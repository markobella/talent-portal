 import { prisma } from "@/lib/db";
import { GALLERY_MEDIA_DB_TYPES, galleryKindFromDbType } from "@/lib/gallery-media";
import { getRoleGlassThemeEnabled } from "@/lib/role-ui-theme";
import { requireRole, resolveAppWorkspace } from "@/lib/session";
import { publicUsernameFromLoginIdentifier } from "@/lib/public-usernames";
import { digitalShowcasePathFromUsername } from "@/lib/talent-showcase";
import { TalentProfileClient } from "./talent-profile-client";

type TalentProfileRow = {
  id: string;
  displayName: string;
  alias: string | null;
  dateOfBirth: Date | null;
  locationCity: string | null;
  locationCountry: string | null;
  avatarUpdatedAt: Date | null;
  pendingAvatarUpdatedAt: Date | null;
  avatarReviewStatus: "PENDING" | "APPROVED" | "DENIED" | null;
  avatarReviewNotes: string | null;
  phoneNumber: string | null;
  employmentStatus: string | null;
  educationLevel: string | null;
  collegeCourse: string | null;
  nationality: string | null;
  experienceYears: number | null;
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
  aboutMe: string | null;
  updatedAt: Date;
  firstApprovedAt: Date | null;
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
  mediaItems: {
    type: string;
    id: string;
    fileName: string | null;
    mimeType: string | null;
    createdAt: Date;
    reviewStatus: "PENDING" | "APPROVED" | "DENIED";
    reviewNotes: string | null;
  }[];
  setcards: { id: string; fileName: string; mimeType: string; createdAt: Date }[];
};

type UserRow = {
  id: string;
  email: string;
  createdAt: Date;
  talentProfile: TalentProfileRow | null;
};

type FindUserArgs = Parameters<typeof prisma.user.findUnique>[0];

export default async function TalentProfilePage() {
  const session = await requireRole(["TALENT"]);
  const workspace = await resolveAppWorkspace(session);
  const glassThemeEnabled = await getRoleGlassThemeEnabled("TALENT");

  const talentProfileSelectBase = {
    id: true,
    displayName: true,
    alias: true,
    dateOfBirth: true,
    locationCity: true,
    locationCountry: true,
    avatarUpdatedAt: true,
    pendingAvatarUpdatedAt: true,
    avatarReviewStatus: true,
    avatarReviewNotes: true,
    phoneNumber: true,
    employmentStatus: true,
    educationLevel: true,
    collegeCourse: true,
    nationality: true,
    experienceYears: true,
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
    aboutMe: true,
    updatedAt: true,
    firstApprovedAt: true,
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
      where: { type: { in: [...GALLERY_MEDIA_DB_TYPES] }, reviewStatus: { not: "DENIED" } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 10,
      select: { id: true, type: true, fileName: true, mimeType: true, createdAt: true, reviewStatus: true, reviewNotes: true },
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
    talentProfile: { select: { ...talentProfileSelectBase, experienceItems: true } },
  } as const;

  const userSelectWithoutExperience = {
    id: true,
    email: true,
    createdAt: true,
    talentProfile: { select: talentProfileSelectBase },
  } as const;

  let user: UserRow | null;
  try {
    user = (await prisma.user.findUnique({
      where: { id: session.user.id },
      select: userSelectWithExperience,
    } as unknown as FindUserArgs)) as UserRow | null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unknown field `experienceItems`")) {
      user = (await prisma.user.findUnique({
        where: { id: session.user.id },
        select: userSelectWithoutExperience,
      } as unknown as FindUserArgs)) as UserRow | null;
    } else {
      throw e;
    }
  }

  if (!user?.talentProfile) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        talentProfile: {
          create: {
            displayName: session.user.name ?? "New Talent",
            socialLinks: {
              create: [
                { platform: "Instagram" },
                { platform: "Tiktok" },
                { platform: "YouTube" },
                { platform: "Facebook" },
                { platform: "X" },
              ],
            },
            measurements: { create: {} },
          },
        },
      },
      select: { id: true },
    });

    try {
      user = (await prisma.user.findUnique({
        where: { id: session.user.id },
        select: userSelectWithExperience,
      } as unknown as FindUserArgs)) as UserRow | null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Unknown field `experienceItems`")) {
        user = (await prisma.user.findUnique({
          where: { id: session.user.id },
          select: userSelectWithoutExperience,
        } as unknown as FindUserArgs)) as UserRow | null;
      } else {
        throw e;
      }
    }
  }

  if (!user?.talentProfile) return null;

  const profile = user.talentProfile;
  const latestSetcard = profile.setcards[0] ?? null;
  const publicUsername = publicUsernameFromLoginIdentifier(user.email);

  const pendingReview = await prisma.talentProfileReview.findFirst({
    where: { talentUserId: session.user.id, status: "PENDING" },
    orderBy: { submittedAt: "desc" },
    select: { id: true, submittedAt: true },
  });
  const lastDecisionReview = pendingReview
    ? null
    : await prisma.talentProfileReview.findFirst({
        where: { talentUserId: session.user.id, status: { in: ["APPROVED", "REJECTED"] } },
        orderBy: [{ reviewedAt: "desc" }, { submittedAt: "desc" }],
        take: 1,
        select: { id: true, status: true, reviewedAt: true, rejectionComment: true },
      });

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
      glassThemeEnabled={glassThemeEnabled}
      workspace={workspace ?? { agencyName: "", agencySub: "" }}
      user={{
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      }}
      publicShowcasePath={publicUsername ? digitalShowcasePathFromUsername(publicUsername) : undefined}
      profile={{
        ...profile,
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : null,
        avatarUpdatedAt: profile.avatarUpdatedAt ? profile.avatarUpdatedAt.toISOString() : null,
        pendingAvatarUpdatedAt: profile.pendingAvatarUpdatedAt ? profile.pendingAvatarUpdatedAt.toISOString() : null,
        updatedAt: profile.updatedAt.toISOString(),
        modelingTypes,
        talents,
      }}
      firstApprovedAt={profile.firstApprovedAt ? profile.firstApprovedAt.toISOString() : null}
      pendingReview={
        pendingReview
          ? { id: pendingReview.id, submittedAt: pendingReview.submittedAt.toISOString() }
          : null
      }
      lastDecisionReview={
        lastDecisionReview
          ? {
              id: lastDecisionReview.id,
              status: lastDecisionReview.status as "APPROVED" | "REJECTED",
              reviewedAt: lastDecisionReview.reviewedAt ? lastDecisionReview.reviewedAt.toISOString() : null,
              rejectionComment: lastDecisionReview.rejectionComment ?? null,
            }
          : null
      }
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
        reviewStatus: m.reviewStatus,
        reviewNotes: m.reviewNotes,
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
    />
  );
}
