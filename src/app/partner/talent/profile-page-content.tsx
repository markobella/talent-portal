import { prisma } from "@/lib/db";
import { GALLERY_MEDIA_DB_TYPES, galleryKindFromDbType } from "@/lib/gallery-media";
import { publicUsernameFromLoginIdentifier, usernameLookupCandidates } from "@/lib/public-usernames";
import { digitalShowcasePathFromUsername } from "@/lib/talent-showcase";
import { TalentProfileClient } from "@/app/talent/profile/talent-profile-client";

type TalentProfileRow = {
  id: string;
  displayName: string;
  alias: string | null;
  dateOfBirth: Date | null;
  locationCity: string | null;
  locationCountry: string | null;
  avatarUpdatedAt: Date | null;
  pendingAvatarUpdatedAt?: Date | null;
  avatarReviewStatus?: "PENDING" | "APPROVED" | "DENIED" | null;
  avatarReviewNotes?: string | null;
  phoneNumber: string | null;
  employmentStatus: string | null;
  educationLevel: string | null;
  collegeCourse: string | null;
  nationality: string | null;
  experienceYears: number | null;
  aboutMe: string | null;
  modelingTypes: unknown;
  talents: unknown;
  experienceItems?: unknown;
  heightIn: number | null;
  weightLbs: number | null;
  skinTone: string | null;
  eyeColor: string | null;
  shirtSize: string | null;
  pantsSize: string | null;
  dressSize: string | null;
  shoeSize: number | null;
  tattoos: boolean | null;
  tattooLocations: string | null;
  piercings: boolean | null;
  piercingLocations: string | null;
  birthmarks: boolean | null;
  birthmarkLocations: string | null;
  partnerId: string | null;
  firstApprovedAt: Date | null;
  updatedAt: Date;
  measurements: {
    unit: string;
    bust: number | null;
    underBust: number | null;
    naturalWaist: number | null;
    hips: number | null;
    waistToFloor: number | null;
    hollowToHem: number | null;
    shoulderWidth: number | null;
    backLength: number | null;
    updatedAt: Date;
  } | null;
  socialLinks: { platform: string; handle: string | null; url: string | null; followers: number | null }[];
  mediaItems: { id: string; type: string; fileName: string | null; mimeType: string | null; createdAt: Date }[];
  setcards: { id: string; fileName: string; mimeType: string; createdAt: Date }[];
};

type UserRow = {
  id: string;
  email: string;
  createdAt: Date;
  role: string;
  talentProfile: TalentProfileRow | null;
};

export type PartnerTalentProfileMatch = {
  publicUsername: string;
  user: UserRow & { talentProfile: TalentProfileRow };
};

const talentProfileSelectBase = {
  id: true,
  displayName: true,
  alias: true,
  dateOfBirth: true,
  locationCity: true,
  locationCountry: true,
  avatarUpdatedAt: true,
  phoneNumber: true,
  employmentStatus: true,
  educationLevel: true,
  collegeCourse: true,
  nationality: true,
  experienceYears: true,
  aboutMe: true,
  modelingTypes: true,
  talents: true,
  heightIn: true,
  weightLbs: true,
  skinTone: true,
  eyeColor: true,
  shirtSize: true,
  pantsSize: true,
  dressSize: true,
  shoeSize: true,
  tattoos: true,
  tattooLocations: true,
  piercings: true,
  piercingLocations: true,
  birthmarks: true,
  birthmarkLocations: true,
  partnerId: true,
  firstApprovedAt: true,
  updatedAt: true,
  measurements: {
    select: {
      unit: true,
      bust: true,
      underBust: true,
      naturalWaist: true,
      hips: true,
      waistToFloor: true,
      hollowToHem: true,
      shoulderWidth: true,
      backLength: true,
      updatedAt: true,
    },
  },
  socialLinks: {
    orderBy: { platform: "asc" },
    select: { platform: true, handle: true, url: true, followers: true },
  },
  mediaItems: {
    where: { type: { in: [...GALLERY_MEDIA_DB_TYPES] }, reviewStatus: "APPROVED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 10,
    select: { id: true, type: true, fileName: true, mimeType: true, createdAt: true },
  },
  setcards: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { id: true, fileName: true, mimeType: true, createdAt: true },
  },
} as const;

const userSelectWithExperience = {
  id: true,
  email: true,
  createdAt: true,
  role: true,
  talentProfile: { select: { ...talentProfileSelectBase, experienceItems: true } },
} as const;

const userSelectWithoutExperience = {
  id: true,
  email: true,
  createdAt: true,
  role: true,
  talentProfile: { select: talentProfileSelectBase },
} as const;

type FindUserArgs = Parameters<typeof prisma.user.findUnique>[0];

async function findUser(where: { id?: string; email?: string }) {
  try {
    return (await prisma.user.findUnique({
      where,
      select: userSelectWithExperience,
    } as unknown as FindUserArgs)) as UserRow | null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("Unknown field `experienceItems`")) throw error;
    return (await prisma.user.findUnique({
      where,
      select: userSelectWithoutExperience,
    } as unknown as FindUserArgs)) as UserRow | null;
  }
}

function decodeRouteKey(routeKey: string) {
  try {
    return decodeURIComponent(routeKey).trim();
  } catch {
    return routeKey.trim();
  }
}

function asTalentMatch(user: UserRow | null) {
  if (!user || user.role !== "TALENT" || !user.talentProfile) return null;
  return {
    publicUsername: publicUsernameFromLoginIdentifier(user.email) ?? user.email.trim().toLowerCase(),
    user: user as UserRow & { talentProfile: TalentProfileRow },
  };
}

export async function resolvePartnerTalentProfile(routeKey: string): Promise<PartnerTalentProfileMatch | null> {
  const decodedRouteKey = decodeRouteKey(routeKey);
  if (!decodedRouteKey) return null;

  const directMatch = asTalentMatch(await findUser({ id: decodedRouteKey }));
  if (directMatch) return directMatch;

  const attemptedEmails = new Set<string>();
  for (const candidate of usernameLookupCandidates(decodedRouteKey)) {
    if (attemptedEmails.has(candidate)) continue;
    attemptedEmails.add(candidate);

    const emailMatch = asTalentMatch(await findUser({ email: candidate }));
    if (emailMatch) return emailMatch;
  }

  return null;
}

export function PartnerTalentProfilePageContent(props: {
  glassThemeEnabled: boolean;
  match: PartnerTalentProfileMatch;
  workspace?: { agencyName: string; agencySub: string };
}) {
  const { user } = props.match;
  const profile = user.talentProfile;
  const latestSetcard = profile.setcards[0] ?? null;
  const modelingTypes = Array.isArray(profile.modelingTypes)
    ? profile.modelingTypes.filter((x: unknown): x is string => typeof x === "string")
    : [];
  const talents = Array.isArray(profile.talents)
    ? profile.talents.filter((x: unknown): x is string => typeof x === "string")
    : [];
  const experienceItems = Array.isArray(profile.experienceItems)
    ? profile.experienceItems
        .map((x: unknown) => {
          if (!x || typeof x !== "object") return null;
          const obj = x as Record<string, unknown>;
          const id = typeof obj.id === "string" ? obj.id : null;
          const kind =
            obj.kind === "PROJECT" || obj.kind === "CERTIFICATION" || obj.kind === "TITLE"
              ? (obj.kind as "PROJECT" | "CERTIFICATION" | "TITLE")
              : null;
          const title = typeof obj.title === "string" ? obj.title : null;
          const role = typeof obj.role === "string" ? obj.role : null;
          const when = typeof obj.when === "string" ? obj.when : null;
          const createdAt = typeof obj.createdAt === "string" ? obj.createdAt : null;
          if (!id || !kind || !title || !createdAt) return null;
          return { id, kind, title, role, when, createdAt };
        })
        .filter(
          (x: unknown): x is { id: string; kind: "PROJECT" | "CERTIFICATION" | "TITLE"; title: string; role: string | null; when: string | null; createdAt: string } =>
            Boolean(x),
        )
    : [];

  return (
    <TalentProfileClient
      glassThemeEnabled={props.glassThemeEnabled}
      navRole="PARTNER"
      workspace={props.workspace ?? { agencyName: "", agencySub: "" }}
      readOnly
      backHref="/partner/directory"
      backLabel="← Back to directory"
      user={{
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      }}
      publicShowcasePath={digitalShowcasePathFromUsername(props.match.publicUsername)}
      profile={{
        ...profile,
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : null,
        avatarUpdatedAt: profile.avatarUpdatedAt ? profile.avatarUpdatedAt.toISOString() : null,
        pendingAvatarUpdatedAt: null,
        avatarReviewStatus: null,
        avatarReviewNotes: null,
        updatedAt: profile.updatedAt.toISOString(),
        modelingTypes,
        talents,
      }}
      measurements={
        profile.measurements
          ? {
              ...profile.measurements,
              unit: profile.measurements.unit === "cm" ? "cm" : "in",
              updatedAt: profile.measurements.updatedAt.toISOString(),
            }
          : null
      }
      socialLinks={profile.socialLinks}
      galleryItems={profile.mediaItems.map((m) => ({
        id: m.id,
        kind: galleryKindFromDbType(m.type, m.mimeType),
        fileName: m.fileName,
        mimeType: m.mimeType,
        createdAt: m.createdAt.toISOString(),
        reviewStatus: "APPROVED" as const,
        reviewNotes: null,
      }))}
      experienceItems={experienceItems}
      setcard={
        latestSetcard
          ? {
              ...latestSetcard,
              createdAt: latestSetcard.createdAt.toISOString(),
            }
          : null
      }
      firstApprovedAt={profile.firstApprovedAt ? profile.firstApprovedAt.toISOString() : null}
      pendingReview={null}
      lastDecisionReview={null}
    />
  );
}
