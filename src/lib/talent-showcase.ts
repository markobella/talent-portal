import { prisma } from "@/lib/db";
import { GALLERY_MEDIA_DB_TYPES, galleryKindFromDbType } from "@/lib/gallery-media";
import { publicUsernameFromLoginIdentifier, usernameLookupCandidates } from "@/lib/public-usernames";
import { partnerDisplayName } from "@/lib/session";

type TalentProfileRow = {
  id: string;
  displayName: string;
  alias: string | null;
  dateOfBirth: Date | null;
  locationCity: string | null;
  locationCountry: string | null;
  avatarUpdatedAt: Date | null;
  phoneNumber: string | null;
  employmentStatus: string | null;
  educationLevel: string | null;
  collegeCourse: string | null;
  nationality: string | null;
  showcaseShowContactInfo?: boolean;
  showcaseShowBasicInfo?: boolean;
  showcaseUseGlassTheme?: boolean;
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
  partner: {
    id: string;
    name: string | null;
    displayName: string | null;
    showcaseTheme: string | null;
    logoUpdatedAt: Date | null;
  } | null;
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
  mediaItems: { id: string; type: string; fileName: string | null; mimeType: string | null; width: number | null; height: number | null; createdAt: Date }[];
  setcards: { id: string; fileName: string; mimeType: string; createdAt: Date }[];
};

type UserRow = {
  id: string;
  email: string;
  createdAt: Date;
  role: string;
  talentProfile: TalentProfileRow | null;
};

type TalentMatch = {
  publicUsername: string;
  user: UserRow & { talentProfile: TalentProfileRow };
};

export type ShowcaseThemeKey =
  | "classic"
  | "noir"
  | "stone"
  | "deepink"
  | "clay"
  | "burgundy";

export type TalentShowcaseData = {
  publicUsername: string;
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
  partner: {
    id: string | null;
    name: string | null;
    theme: ShowcaseThemeKey | null;
    logoUpdatedAt: string | null;
  } | null;
  profile: {
    id: string;
    displayName: string;
    alias: string | null;
    dateOfBirth: string | null;
    locationCity: string | null;
    locationCountry: string | null;
    avatarUpdatedAt: string | null;
    phoneNumber: string | null;
    employmentStatus: string | null;
    educationLevel: string | null;
    collegeCourse: string | null;
    nationality: string | null;
    showcaseShowContactInfo: boolean;
    showcaseShowBasicInfo: boolean;
    showcaseUseGlassTheme: boolean;
    theme: ShowcaseThemeKey | null;
    experienceYears: number | null;
    modelingTypes: string[];
    talents: string[];
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
    updatedAt: string;
    firstApprovedAt: string | null;
  };
  measurements: {
    unit: "in" | "cm";
    bust: number | null;
    underBust: number | null;
    naturalWaist: number | null;
    hips: number | null;
    waistToFloor: number | null;
    hollowToHem: number | null;
    shoulderWidth: number | null;
    backLength: number | null;
    updatedAt: string;
  } | null;
  socialLinks: { platform: string; handle: string | null; url: string | null; followers: number | null }[];
  galleryItems: {
    id: string;
    kind: "PHOTO" | "VIDEO";
    fileName: string | null;
    mimeType: string | null;
    width: number | null;
    height: number | null;
    createdAt: string;
  }[];
  experienceItems: {
    id: string;
    kind: "PROJECT" | "CERTIFICATION" | "TITLE";
    title: string;
    role: string | null;
    when: string | null;
    createdAt: string;
  }[];
  setcard: { id: string; fileName: string; mimeType: string; createdAt: string } | null;
};

const talentProfileSelectBaseWithoutPrivacy = {
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
  partner: {
    select: {
      id: true,
      name: true,
      displayName: true,
      showcaseTheme: true,
      logoUpdatedAt: true,
    },
  },
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

const talentProfileSelectBase = {
  ...talentProfileSelectBaseWithoutPrivacy,
  showcaseShowContactInfo: true,
  showcaseShowBasicInfo: true,
  showcaseUseGlassTheme: true,
} as const;

const talentProfileSelectBaseWithoutMediaDims = {
  ...talentProfileSelectBaseWithoutPrivacy,
  showcaseShowContactInfo: true,
  showcaseShowBasicInfo: true,
  showcaseUseGlassTheme: true,
  mediaItems: {
    where: talentProfileSelectBaseWithoutPrivacy.mediaItems.where,
    orderBy: talentProfileSelectBaseWithoutPrivacy.mediaItems.orderBy,
    take: talentProfileSelectBaseWithoutPrivacy.mediaItems.take,
    select: { id: true, type: true, fileName: true, mimeType: true, createdAt: true },
  },
} as const;

const talentProfileSelectBaseWithoutPrivacyWithoutMediaDims = {
  ...talentProfileSelectBaseWithoutPrivacy,
  mediaItems: {
    where: talentProfileSelectBaseWithoutPrivacy.mediaItems.where,
    orderBy: talentProfileSelectBaseWithoutPrivacy.mediaItems.orderBy,
    take: talentProfileSelectBaseWithoutPrivacy.mediaItems.take,
    select: { id: true, type: true, fileName: true, mimeType: true, createdAt: true },
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

const userSelectWithExperienceWithoutPrivacy = {
  id: true,
  email: true,
  createdAt: true,
  role: true,
  talentProfile: { select: { ...talentProfileSelectBaseWithoutPrivacy, experienceItems: true } },
} as const;

const userSelectWithoutExperienceWithoutPrivacy = {
  id: true,
  email: true,
  createdAt: true,
  role: true,
  talentProfile: { select: talentProfileSelectBaseWithoutPrivacy },
} as const;

const userSelectWithExperienceWithoutMediaDims = {
  id: true,
  email: true,
  createdAt: true,
  role: true,
  talentProfile: { select: { ...talentProfileSelectBaseWithoutMediaDims, experienceItems: true } },
} as const;

const userSelectWithoutExperienceWithoutMediaDims = {
  id: true,
  email: true,
  createdAt: true,
  role: true,
  talentProfile: { select: talentProfileSelectBaseWithoutMediaDims },
} as const;

const userSelectWithExperienceWithoutPrivacyWithoutMediaDims = {
  id: true,
  email: true,
  createdAt: true,
  role: true,
  talentProfile: {
    select: { ...talentProfileSelectBaseWithoutPrivacyWithoutMediaDims, experienceItems: true },
  },
} as const;

const userSelectWithoutExperienceWithoutPrivacyWithoutMediaDims = {
  id: true,
  email: true,
  createdAt: true,
  role: true,
  talentProfile: { select: talentProfileSelectBaseWithoutPrivacyWithoutMediaDims },
} as const;

type FindUserArgs = Parameters<typeof prisma.user.findUnique>[0];

function decodeRouteKey(routeKey: string) {
  try {
    return decodeURIComponent(routeKey).trim();
  } catch {
    return routeKey.trim();
  }
}

async function findUser(where: { id?: string; email?: string }) {
  try {
    return (await prisma.user.findUnique({
      where,
      select: userSelectWithExperience,
    } as unknown as FindUserArgs)) as UserRow | null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const missingExperience = message.includes("Unknown field `experienceItems`");
    const missingPrivacy =
      message.includes("Unknown field `showcaseShowContactInfo`") ||
      message.includes("Unknown field `showcaseShowBasicInfo`") ||
      message.includes("Unknown field `showcaseUseGlassTheme`");
    const missingMediaDims =
      message.includes("Unknown field `width`") || message.includes("Unknown field `height`");
    const missingOptional = missingExperience || missingPrivacy || missingMediaDims;

    if (!missingOptional) throw error;

    const trySelect = async (
      select: unknown,
      opts: { allowMissingExperience?: boolean; allowMissingPrivacy?: boolean; allowMissingMediaDims?: boolean } = {},
    ): Promise<UserRow | null> => {
      try {
        return (await prisma.user.findUnique({
          where,
          select,
        } as unknown as FindUserArgs)) as UserRow | null;
      } catch (innerErr) {
        const innerMsg = innerErr instanceof Error ? innerErr.message : "";
        const stillMissingExperience = innerMsg.includes("Unknown field `experienceItems`");
        const stillMissingPrivacy =
          innerMsg.includes("Unknown field `showcaseShowContactInfo`") ||
          innerMsg.includes("Unknown field `showcaseShowBasicInfo`") ||
          innerMsg.includes("Unknown field `showcaseUseGlassTheme`");
        const stillMissingMediaDims =
          innerMsg.includes("Unknown field `width`") || innerMsg.includes("Unknown field `height`");
        if (stillMissingExperience && !opts.allowMissingExperience) throw innerErr;
        if (stillMissingPrivacy && !opts.allowMissingPrivacy) throw innerErr;
        if (stillMissingMediaDims && !opts.allowMissingMediaDims) throw innerErr;
        if (stillMissingExperience || stillMissingPrivacy || stillMissingMediaDims) {
          const fallbackSelect =
            stillMissingExperience && stillMissingPrivacy && stillMissingMediaDims
              ? userSelectWithoutExperienceWithoutPrivacyWithoutMediaDims
              : stillMissingExperience && stillMissingMediaDims
                ? userSelectWithoutExperienceWithoutMediaDims
                : stillMissingPrivacy && stillMissingMediaDims
                  ? userSelectWithoutExperienceWithoutPrivacyWithoutMediaDims
                  : stillMissingExperience && stillMissingPrivacy
                    ? userSelectWithoutExperienceWithoutPrivacy
                    : stillMissingExperience
                      ? userSelectWithoutExperience
                      : stillMissingPrivacy
                        ? userSelectWithoutExperienceWithoutPrivacy
                        : userSelectWithoutExperienceWithoutMediaDims;
          return (await prisma.user.findUnique({
            where,
            select: fallbackSelect,
          } as unknown as FindUserArgs)) as UserRow | null;
        }
        throw innerErr;
      }
    };

    if (missingMediaDims) {
      if (missingPrivacy) {
        return trySelect(userSelectWithExperienceWithoutPrivacyWithoutMediaDims, {
          allowMissingExperience: true,
          allowMissingPrivacy: true,
          allowMissingMediaDims: true,
        });
      }
      return trySelect(userSelectWithExperienceWithoutMediaDims, {
        allowMissingExperience: true,
        allowMissingMediaDims: true,
      });
    }

    if (missingPrivacy) {
      return trySelect(userSelectWithExperienceWithoutPrivacy, {
        allowMissingExperience: true,
        allowMissingPrivacy: true,
      });
    }

    return trySelect(userSelectWithoutExperience, { allowMissingExperience: true });
  }
}

function asTalentMatch(user: UserRow | null): TalentMatch | null {
  if (!user || user.role !== "TALENT" || !user.talentProfile) return null;
  return {
    publicUsername: publicUsernameFromLoginIdentifier(user.email) ?? user.email.trim().toLowerCase(),
    user: user as UserRow & { talentProfile: TalentProfileRow },
  };
}

function normalizeExperienceItems(experienceItems: unknown) {
  if (!Array.isArray(experienceItems)) return [];
  return experienceItems
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
      (
        x: unknown,
      ): x is {
        id: string;
        kind: "PROJECT" | "CERTIFICATION" | "TITLE";
        title: string;
        role: string | null;
        when: string | null;
        createdAt: string;
      } => Boolean(x),
    );
}

export function showcasePathFromUsername(publicUsername: string) {
  return `/showcase/${encodeURIComponent(publicUsername)}`;
}

export function digitalShowcasePathFromUsername(publicUsername: string) {
  return `/showcase/${encodeURIComponent(publicUsername)}/digital`;
}

export async function resolveTalentShowcase(routeKey: string): Promise<TalentShowcaseData | null> {
  const decodedRouteKey = decodeRouteKey(routeKey);
  if (!decodedRouteKey) return null;

  const directMatch = asTalentMatch(await findUser({ id: decodedRouteKey }));
  if (directMatch) return toShowcaseData(directMatch);

  const attemptedEmails = new Set<string>();
  for (const candidate of usernameLookupCandidates(decodedRouteKey)) {
    if (attemptedEmails.has(candidate)) continue;
    attemptedEmails.add(candidate);

    const emailMatch = asTalentMatch(await findUser({ email: candidate }));
    if (emailMatch) return toShowcaseData(emailMatch);
  }

  return null;
}

function toShowcaseData(match: TalentMatch): TalentShowcaseData {
  const profile = match.user.talentProfile;
  const latestSetcard = profile.setcards[0] ?? null;
  const modelingTypes = Array.isArray(profile.modelingTypes)
    ? profile.modelingTypes.filter((x: unknown): x is string => typeof x === "string")
    : [];
  const talents = Array.isArray(profile.talents)
    ? profile.talents.filter((x: unknown): x is string => typeof x === "string")
    : [];

  return {
    publicUsername: match.publicUsername,
    user: {
      id: match.user.id,
      email: match.user.email,
      createdAt: match.user.createdAt.toISOString(),
    },
    partner: (() => {
      const p = profile.partner;
      if (!p) return null;
      const allowed: ShowcaseThemeKey[] = ["classic", "noir", "stone", "deepink", "clay", "burgundy"];
      const theme =
        typeof p.showcaseTheme === "string" && allowed.includes(p.showcaseTheme as ShowcaseThemeKey)
          ? (p.showcaseTheme as ShowcaseThemeKey)
          : null;
      return {
        id: p.id,
        name: partnerDisplayName({ name: p.name, displayName: p.displayName }),
        theme,
        logoUpdatedAt: p.logoUpdatedAt ? p.logoUpdatedAt.toISOString() : null,
      };
    })(),
    profile: {
      id: profile.id,
      displayName: profile.displayName,
      alias: profile.alias,
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : null,
      locationCity: profile.locationCity,
      locationCountry: profile.locationCountry,
      avatarUpdatedAt: profile.avatarUpdatedAt ? profile.avatarUpdatedAt.toISOString() : null,
      phoneNumber: profile.phoneNumber,
      employmentStatus: profile.employmentStatus,
      educationLevel: profile.educationLevel,
      collegeCourse: profile.collegeCourse,
      nationality: profile.nationality,
      showcaseShowContactInfo: profile.showcaseShowContactInfo ?? false,
      showcaseShowBasicInfo: profile.showcaseShowBasicInfo ?? false,
      showcaseUseGlassTheme: profile.showcaseUseGlassTheme ?? false,
      theme: (() => {
        const t = (profile as { showcaseTheme?: unknown }).showcaseTheme;
        const allowed: ShowcaseThemeKey[] = ["classic", "noir", "stone", "deepink", "clay", "burgundy"];
        return typeof t === "string" && allowed.includes(t as ShowcaseThemeKey)
          ? (t as ShowcaseThemeKey)
          : null;
      })(),
      experienceYears: profile.experienceYears,
      modelingTypes,
      talents,
      heightIn: profile.heightIn,
      weightLbs: profile.weightLbs,
      skinTone: profile.skinTone,
      eyeColor: profile.eyeColor,
      shirtSize: profile.shirtSize,
      pantsSize: profile.pantsSize,
      dressSize: profile.dressSize,
      shoeSize: profile.shoeSize,
      tattoos: profile.tattoos,
      tattooLocations: profile.tattooLocations,
      piercings: profile.piercings,
      piercingLocations: profile.piercingLocations,
      birthmarks: profile.birthmarks,
      birthmarkLocations: profile.birthmarkLocations,
      aboutMe: (profile as { aboutMe?: string | null }).aboutMe ?? null,
      updatedAt: profile.updatedAt.toISOString(),
      firstApprovedAt: profile.firstApprovedAt ? profile.firstApprovedAt.toISOString() : null,
    },
    measurements: profile.measurements
      ? {
          ...profile.measurements,
          unit: profile.measurements.unit === "cm" ? "cm" : "in",
          updatedAt: profile.measurements.updatedAt.toISOString(),
        }
      : null,
    socialLinks: profile.socialLinks,
    galleryItems: profile.mediaItems.map((item) => ({
      id: item.id,
      kind: galleryKindFromDbType(item.type, item.mimeType),
      fileName: item.fileName,
      mimeType: item.mimeType,
      width: typeof (item as any).width === "number" ? (item as any).width : null,
      height: typeof (item as any).height === "number" ? (item as any).height : null,
      createdAt: item.createdAt.toISOString(),
    })),
    experienceItems: normalizeExperienceItems(profile.experienceItems),
    setcard: latestSetcard
      ? {
          ...latestSetcard,
          createdAt: latestSetcard.createdAt.toISOString(),
        }
      : null,
  };
}
