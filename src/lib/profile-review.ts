import type { TalentProfile, TalentMeasurements, SocialLink } from "@prisma/client";

export type ReviewCategoryKey = "identity" | "stats" | "credibility" | "social" | "bio";

export const REVIEW_CATEGORY_LABELS: Record<ReviewCategoryKey, { code: string; label: string }> = {
  identity: { code: "A", label: "Identity" },
  stats: { code: "B", label: "Stats" },
  credibility: { code: "C", label: "Credibility" },
  social: { code: "D", label: "Social" },
  bio: { code: "E", label: "Bio" },
};

export type FieldDiff = {
  old: unknown;
  new: unknown;
};

export type CategoryDiffs = Record<string, FieldDiff>;

export type ChangesByCategory = Partial<Record<ReviewCategoryKey, CategoryDiffs>>;

type NormalizedSocialLink = {
  platform: string;
  handle: string | null;
  url: string | null;
  followers: number | null;
};

type NormalizedMeasurements = {
  unit: "in" | "cm";
  bust: number | null;
  underBust: number | null;
  naturalWaist: number | null;
  hips: number | null;
  waistToFloor: number | null;
  hollowToHem: number | null;
  shoulderWidth: number | null;
  backLength: number | null;
};

type NormalizedExperienceItem = {
  id: string;
  kind: "PROJECT" | "CERTIFICATION" | "TITLE";
  title: string;
  role: string | null;
  when: string | null;
  createdAt: string;
};

function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!jsonEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === "object" && typeof b === "object") {
    const ak = Object.keys(a as object);
    const bk = Object.keys(b as object);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (!jsonEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
    }
    return true;
  }
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return a === b;
  }
  return false;
}

function diffIfChanged(
  out: CategoryDiffs,
  fieldName: string,
  oldVal: unknown,
  newVal: unknown,
): void {
  if (!jsonEqual(oldVal, newVal)) {
    out[fieldName] = { old: oldVal ?? null, new: newVal ?? null };
  }
}

function normalizeMeasurements(m: TalentMeasurements | null): NormalizedMeasurements {
  return {
    unit: (m?.unit as "in" | "cm") ?? "in",
    bust: m?.bust ?? null,
    underBust: m?.underBust ?? null,
    naturalWaist: m?.naturalWaist ?? null,
    hips: m?.hips ?? null,
    waistToFloor: m?.waistToFloor ?? null,
    hollowToHem: m?.hollowToHem ?? null,
    shoulderWidth: m?.shoulderWidth ?? null,
    backLength: m?.backLength ?? null,
  };
}

function normalizeSocialLinks(links: SocialLink[]): NormalizedSocialLink[] {
  return links
    .slice()
    .sort((a, b) => a.platform.localeCompare(b.platform))
    .map((l) => ({
      platform: l.platform,
      handle: l.handle ?? null,
      url: l.url ?? null,
      followers: l.followers ?? null,
    }));
}

function normalizeExperienceItems(raw: unknown): NormalizedExperienceItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
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
    .filter((x): x is NormalizedExperienceItem => Boolean(x))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function dateIsoOrNull(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString();
}

export function jsonArr(v: unknown): unknown[] {
  if (v === null || v === undefined) return [];
  if (!Array.isArray(v)) return [];
  return v;
}

export type ApprovedBaseline = {
  profile: TalentProfile & { measurements: TalentMeasurements | null; socialLinks: SocialLink[] };
};

export type SubmittedDraft = {
  identity: {
    displayName: string;
    alias: string | null;
    dateOfBirth: string | null;
    locationCity: string | null;
    locationCountry: string | null;
    nationality: string | null;
    phoneNumber: string | null;
    employmentStatus: string | null;
    educationLevel: string | null;
    collegeCourse: string | null;
  };
  stats: {
    heightIn: number | null;
    weightLbs: number | null;
    skinTone: string | null;
    eyeColor: string | null;
    shirtSize: string | null;
    pantsSize: string | null;
    dressSize: string | null;
    shoeSize: number | null;
    measurements: NormalizedMeasurements;
    tattoos: boolean | null;
    tattooLocations: string | null;
    piercings: boolean | null;
    piercingLocations: string | null;
    birthmarks: boolean | null;
    birthmarkLocations: string | null;
  };
  credibility: {
    experienceYears: number | null;
    modelingTypes: string[];
    talents: string[];
    experienceItems: NormalizedExperienceItem[];
  };
  social: {
    links: NormalizedSocialLink[];
  };
  bio: {
    aboutMe: string | null;
  };
};

export function computeChangesByCategory(baseline: ApprovedBaseline, draft: SubmittedDraft): ChangesByCategory {
  const p = baseline.profile;
  const out: ChangesByCategory = {};

  const identity: CategoryDiffs = {};
  diffIfChanged(identity, "displayName", p.displayName ?? null, draft.identity.displayName ?? null);
  diffIfChanged(identity, "alias", p.alias ?? null, draft.identity.alias ?? null);
  diffIfChanged(identity, "dateOfBirth", dateIsoOrNull(p.dateOfBirth ?? null), draft.identity.dateOfBirth ?? null);
  diffIfChanged(identity, "locationCity", p.locationCity ?? null, draft.identity.locationCity ?? null);
  diffIfChanged(identity, "locationCountry", p.locationCountry ?? null, draft.identity.locationCountry ?? null);
  diffIfChanged(identity, "nationality", p.nationality ?? null, draft.identity.nationality ?? null);
  diffIfChanged(identity, "phoneNumber", p.phoneNumber ?? null, draft.identity.phoneNumber ?? null);
  diffIfChanged(identity, "employmentStatus", p.employmentStatus ?? null, draft.identity.employmentStatus ?? null);
  diffIfChanged(identity, "educationLevel", p.educationLevel ?? null, draft.identity.educationLevel ?? null);
  diffIfChanged(identity, "collegeCourse", p.collegeCourse ?? null, draft.identity.collegeCourse ?? null);
  if (Object.keys(identity).length) out.identity = identity;

  const stats: CategoryDiffs = {};
  diffIfChanged(stats, "heightIn", p.heightIn ?? null, draft.stats.heightIn ?? null);
  diffIfChanged(stats, "weightLbs", p.weightLbs ?? null, draft.stats.weightLbs ?? null);
  diffIfChanged(stats, "skinTone", p.skinTone ?? null, draft.stats.skinTone ?? null);
  diffIfChanged(stats, "eyeColor", p.eyeColor ?? null, draft.stats.eyeColor ?? null);
  diffIfChanged(stats, "shirtSize", p.shirtSize ?? null, draft.stats.shirtSize ?? null);
  diffIfChanged(stats, "pantsSize", p.pantsSize ?? null, draft.stats.pantsSize ?? null);
  diffIfChanged(stats, "dressSize", p.dressSize ?? null, draft.stats.dressSize ?? null);
  diffIfChanged(stats, "shoeSize", p.shoeSize ?? null, draft.stats.shoeSize ?? null);
  diffIfChanged(stats, "measurements", normalizeMeasurements(p.measurements), draft.stats.measurements);
  diffIfChanged(stats, "tattoos", p.tattoos ?? null, draft.stats.tattoos ?? null);
  diffIfChanged(stats, "tattooLocations", p.tattooLocations ?? null, draft.stats.tattooLocations ?? null);
  diffIfChanged(stats, "piercings", p.piercings ?? null, draft.stats.piercings ?? null);
  diffIfChanged(stats, "piercingLocations", p.piercingLocations ?? null, draft.stats.piercingLocations ?? null);
  diffIfChanged(stats, "birthmarks", p.birthmarks ?? null, draft.stats.birthmarks ?? null);
  diffIfChanged(stats, "birthmarkLocations", p.birthmarkLocations ?? null, draft.stats.birthmarkLocations ?? null);
  if (Object.keys(stats).length) out.stats = stats;

  const credibility: CategoryDiffs = {};
  diffIfChanged(credibility, "experienceYears", p.experienceYears ?? null, draft.credibility.experienceYears ?? null);
  diffIfChanged(credibility, "modelingTypes", jsonArr(p.modelingTypes), draft.credibility.modelingTypes ?? []);
  diffIfChanged(credibility, "talents", jsonArr(p.talents), draft.credibility.talents ?? []);
  diffIfChanged(credibility, "experienceItems", normalizeExperienceItems(p.experienceItems), draft.credibility.experienceItems ?? []);
  if (Object.keys(credibility).length) out.credibility = credibility;

  const social: CategoryDiffs = {};
  diffIfChanged(social, "links", normalizeSocialLinks(p.socialLinks), draft.social.links ?? []);
  if (Object.keys(social).length) out.social = social;

  const bio: CategoryDiffs = {};
  diffIfChanged(bio, "aboutMe", p.aboutMe ?? null, draft.bio.aboutMe ?? null);
  if (Object.keys(bio).length) out.bio = bio;

  return out;
}

export function countChangedCategories(changes: ChangesByCategory): ReviewCategoryKey[] {
  return (Object.keys(changes) as ReviewCategoryKey[]).filter(
    (k) => changes[k] && Object.keys(changes[k]!).length > 0,
  );
}
