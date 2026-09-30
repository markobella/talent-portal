import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import {
  computeChangesByCategory,
  countChangedCategories,
  REVIEW_CATEGORY_LABELS,
  type SubmittedDraft,
} from "@/lib/profile-review";
import { notifyUsers } from "@/lib/notifications";

const SocialLinkDraftSchema = z.object({
  platform: z.string().min(1).max(30),
  handle: z.string().min(1).max(60).nullable().optional().transform((v) => (v === undefined ? null : v)),
  url: z.string().url().nullable().optional().transform((v) => (v === undefined ? null : v)),
  followers: z
    .number()
    .int()
    .min(0)
    .max(10_000_000)
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? null : v)),
});

const ExperienceItemDraftSchema = z.object({
  id: z.string().min(1).max(200),
  kind: z.enum(["PROJECT", "CERTIFICATION", "TITLE"]),
  title: z.string().min(1).max(120),
  role: z.string().min(1).max(80).nullable().optional().transform((v) => (v === undefined ? null : v)),
  when: z.string().min(1).max(40).nullable().optional().transform((v) => (v === undefined ? null : v)),
  createdAt: z.string().min(1).max(60),
});

const MeasurementsDraftSchema = z.object({
  unit: z.enum(["in", "cm"]),
  bust: z.number().min(10).max(200).nullable().optional().transform((v) => (v === undefined ? null : v)),
  underBust: z.number().min(10).max(200).nullable().optional().transform((v) => (v === undefined ? null : v)),
  naturalWaist: z.number().min(10).max(200).nullable().optional().transform((v) => (v === undefined ? null : v)),
  hips: z.number().min(10).max(250).nullable().optional().transform((v) => (v === undefined ? null : v)),
  waistToFloor: z.number().min(10).max(300).nullable().optional().transform((v) => (v === undefined ? null : v)),
  hollowToHem: z.number().min(10).max(300).nullable().optional().transform((v) => (v === undefined ? null : v)),
  shoulderWidth: z.number().min(1).max(100).nullable().optional().transform((v) => (v === undefined ? null : v)),
  backLength: z.number().min(1).max(200).nullable().optional().transform((v) => (v === undefined ? null : v)),
});

const SubmitDraftSchema = z.object({
  identity: z.object({
    displayName: z.string().min(1).max(80),
    alias: z.string().min(1).max(80).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    dateOfBirth: z.string().datetime().nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    locationCity: z.string().min(1).max(60).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    locationCountry: z.string().min(1).max(60).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    nationality: z.string().min(1).max(60).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    phoneNumber: z.string().min(1).max(30).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    employmentStatus: z.string().min(1).max(60).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    educationLevel: z.string().min(1).max(60).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    collegeCourse: z.string().min(1).max(80).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
  }),
  stats: z.object({
    heightIn: z.number().min(30).max(100).nullable().optional().transform((v) => (v === undefined ? null : v)),
    weightLbs: z.number().min(40).max(600).nullable().optional().transform((v) => (v === undefined ? null : v)),
    skinTone: z.string().min(1).max(40).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    eyeColor: z.string().min(1).max(40).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    shirtSize: z.string().min(1).max(10).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    pantsSize: z.string().min(1).max(10).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    dressSize: z.string().min(1).max(10).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    shoeSize: z.number().min(1).max(30).nullable().optional().transform((v) => (v === undefined ? null : v)),
    measurements: MeasurementsDraftSchema,
    tattoos: z.boolean().nullable().optional().transform((v) => (v === undefined ? null : v)),
    tattooLocations: z.string().min(1).max(120).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    piercings: z.boolean().nullable().optional().transform((v) => (v === undefined ? null : v)),
    piercingLocations: z.string().min(1).max(120).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
    birthmarks: z.boolean().nullable().optional().transform((v) => (v === undefined ? null : v)),
    birthmarkLocations: z.string().min(1).max(120).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
  }),
  credibility: z.object({
    experienceYears: z.number().int().min(0).max(80).nullable().optional().transform((v) => (v === undefined ? null : v)),
    modelingTypes: z.array(z.string().min(1).max(40)).max(30).default([]),
    talents: z.array(z.string().min(1).max(40)).max(30).default([]),
    experienceItems: z.array(ExperienceItemDraftSchema).max(30).default([]),
  }),
  social: z.object({
    links: z.array(SocialLinkDraftSchema).max(12).default([]),
  }),
  bio: z.object({
    aboutMe: z.string().max(4000).nullable().optional().transform((v) => (v === undefined || v === "" ? null : v)),
  }),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireApiRole(["TALENT"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = SubmitDraftSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues.map((i) => ({ path: i.path, msg: i.message })) },
      { status: 400 },
    );
  }

  const userId = auth.session.user.id;
  const draft = parsed.data as unknown as SubmittedDraft;

  const baseline = await prisma.talentProfile.findUnique({
    where: { userId },
    include: { measurements: true, socialLinks: true },
  });
  if (!baseline) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const partnerId = baseline.partnerId;

  const pending = await prisma.talentProfileReview.findFirst({
    where: { talentUserId: userId, status: "PENDING" },
    select: { id: true },
  });
  if (pending) {
    return NextResponse.json(
      { error: "A review is already pending for this profile. Please wait for your management to act on it first." },
      { status: 409 },
    );
  }

  const changes = computeChangesByCategory(
    { profile: baseline },
    draft,
  );
  const changedCats = countChangedCategories(changes);
  if (changedCats.length === 0) {
    return NextResponse.json(
      { error: "No changes detected against the currently approved profile." },
      { status: 400 },
    );
  }

  const review = await prisma.talentProfileReview.create({
    data: {
      talentUserId: userId,
      partnerId: partnerId ?? null,
      changesJson: changes as any,
      status: "PENDING",
    },
    select: {
      id: true,
      submittedAt: true,
    },
  });

  if (partnerId) {
    const changedLabels = changedCats
      .map((k) => `${REVIEW_CATEGORY_LABELS[k].code} ${REVIEW_CATEGORY_LABELS[k].label}`)
      .join(", ");
    const talentName = baseline.displayName || "A talent";
    try {
      await notifyUsers({
        userIds: [partnerId],
        type: "PROFILE_SUBMITTED",
        title: "Profile review requested",
        body: `${talentName} submitted profile changes for your review. Changes in: ${changedLabels}.`,
        data: { reviewId: review.id, talentUserId: userId },
      });
    } catch {}
  }

  return NextResponse.json({
    ok: true,
    reviewId: review.id,
    submittedAt: review.submittedAt.toISOString(),
    changedCategories: changedCats,
  });
}
