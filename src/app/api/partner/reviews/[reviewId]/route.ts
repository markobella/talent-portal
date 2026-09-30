import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import type { ChangesByCategory, FieldDiff, SubmittedDraft } from "@/lib/profile-review";
import { notifyUsers } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";

const ActionSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT"]),
    rejectionComment: z
      .string()
      .max(2000)
      .nullable()
      .optional()
      .transform((v) => (v === undefined ? null : v)),
  })
  .superRefine((v, ctx) => {
    if (v.action === "REJECT" && (!v.rejectionComment || !v.rejectionComment.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide a note explaining why changes were rejected.",
        path: ["rejectionComment"],
      });
    }
  });

type ReviewChangesShape = {
  identity?: Partial<Record<string, FieldDiff>>;
  stats?: Partial<Record<string, FieldDiff | { unit: string; old: unknown; new: unknown }>> & {
    measurements?: { old: unknown; new: unknown };
  };
  credibility?: Partial<Record<string, FieldDiff>>;
  social?: { links?: FieldDiff };
  bio?: Partial<Record<string, FieldDiff>>;
};

function fieldNewValue<T = unknown>(diff: FieldDiff | undefined): T | null {
  if (!diff) return null;
  const v = diff.new;
  return (v === undefined ? null : v) as T | null;
}

export async function POST(req: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const auth = await requireApiRole(["PARTNER"]);
  if (!auth.ok) return auth.response;
  const session = auth.session;
  const { reviewId } = await params;
  if (!reviewId) return NextResponse.json({ error: "Missing review id." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { action, rejectionComment } = parsed.data;

  const review = await prisma.talentProfileReview.findUnique({
    where: { id: reviewId },
    include: {
      talent: {
        select: {
          id: true,
          talentProfile: {
            select: { id: true, partnerId: true, firstApprovedAt: true },
          },
        },
      },
    },
  });
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  if (review.status !== "PENDING") {
    return NextResponse.json({ error: "This review has already been decided." }, { status: 409 });
  }
  const talentProfileId = review.talent.talentProfile?.id ?? null;
  const partnerId = review.talent.talentProfile?.partnerId ?? null;
  const reviewPartnerId = review.partnerId ?? partnerId;
  if (!talentProfileId) return NextResponse.json({ error: "Talent profile missing." }, { status: 404 });
  if (reviewPartnerId !== session.user.id) {
    return NextResponse.json({ error: "Not authorized to review this submission." }, { status: 403 });
  }
  const talentUserId = review.talentUserId;
  const changesJson = (review.changesJson ?? {}) as ReviewChangesShape;
  const submittedDraft = reviewToSubmittedDraft(changesJson);

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (action === "REJECT") {
        const updated = await tx.talentProfileReview.update({
          where: { id: reviewId },
          data: {
            status: "REJECTED",
            rejectionComment: rejectionComment ?? null,
            reviewedAt: new Date(),
          },
          select: { id: true, status: true, reviewedAt: true, rejectionComment: true },
        });
        return { decision: "REJECTED" as const, updated };
      }

      const identity = changesJson.identity ?? {};
      const stats = changesJson.stats ?? {};
      const measurementsDiff = stats.measurements as
        | { old?: Record<string, unknown> | null; new?: Record<string, unknown> | null }
        | undefined;
      const measurementsNew = measurementsDiff?.new ?? null;
      const credibility = changesJson.credibility ?? {};
      const bio = changesJson.bio ?? {};
      const wasNeverApproved = review.talent.talentProfile?.firstApprovedAt == null;

      const profileData: Record<string, unknown> = {};
      for (const k of [
        "displayName",
        "alias",
        "dateOfBirth",
        "locationCity",
        "locationCountry",
        "nationality",
        "phoneNumber",
        "employmentStatus",
        "educationLevel",
        "collegeCourse",
      ]) {
        const fieldDiff = identity[k] as FieldDiff | undefined;
        if (!fieldDiff) continue;
        if (k === "dateOfBirth") {
          const raw = fieldNewValue<string | null>(fieldDiff);
          profileData[k] = raw ? new Date(raw) : null;
        } else {
          profileData[k] = fieldNewValue(fieldDiff);
        }
      }
      for (const k of [
        "heightIn",
        "weightLbs",
        "skinTone",
        "eyeColor",
        "shirtSize",
        "pantsSize",
        "dressSize",
        "shoeSize",
        "tattoos",
        "tattooLocations",
        "piercings",
        "piercingLocations",
        "birthmarks",
        "birthmarkLocations",
      ]) {
        const fieldDiff = stats[k] as FieldDiff | undefined;
        if (!fieldDiff) continue;
        profileData[k] = fieldNewValue(fieldDiff);
      }
      for (const k of ["experienceYears", "modelingTypes", "talents"]) {
        const fieldDiff = credibility[k] as FieldDiff | undefined;
        if (!fieldDiff) continue;
        profileData[k] = fieldNewValue(fieldDiff) ?? (k === "experienceYears" ? null : k === "modelingTypes" || k === "talents" ? [] : null);
      }
      {
        const experienceItemsDiff = credibility.experienceItems as FieldDiff | undefined;
        if (experienceItemsDiff && experienceItemsDiff.new !== undefined) {
          profileData.experienceItems = experienceItemsDiff.new ?? [];
        }
      }
      {
        const aboutDiff = bio.aboutMe as FieldDiff | undefined;
        if (aboutDiff) {
          profileData.aboutMe = fieldNewValue<string | null>(aboutDiff);
        }
      }
      if (wasNeverApproved) {
        profileData.firstApprovedAt = new Date();
      }

      await tx.talentProfile.update({ where: { id: talentProfileId }, data: profileData });

      if (measurementsNew) {
        const m = measurementsNew as Record<string, unknown>;
        const unit = (m.unit as "in" | "cm" | undefined) ?? "in";
        const asNum = (v: unknown): number | null =>
          typeof v === "number" && Number.isFinite(v) ? v : null;
        await tx.talentMeasurements.upsert({
          where: { talentProfileId: talentProfileId },
          create: {
            talentProfileId,
            unit,
            bust: asNum(m.bust),
            underBust: asNum(m.underBust),
            naturalWaist: asNum(m.naturalWaist),
            hips: asNum(m.hips),
            waistToFloor: asNum(m.waistToFloor),
            hollowToHem: asNum(m.hollowToHem),
            shoulderWidth: asNum(m.shoulderWidth),
            backLength: asNum(m.backLength),
          },
          update: {
            unit,
            bust: asNum(m.bust),
            underBust: asNum(m.underBust),
            naturalWaist: asNum(m.naturalWaist),
            hips: asNum(m.hips),
            waistToFloor: asNum(m.waistToFloor),
            hollowToHem: asNum(m.hollowToHem),
            shoulderWidth: asNum(m.shoulderWidth),
            backLength: asNum(m.backLength),
          },
        });
      }

      if (changesJson.social?.links && (changesJson.social.links as FieldDiff).new !== undefined) {
        const newLinks = (changesJson.social.links as FieldDiff).new as
          | Array<{ platform: string; handle: string | null; url: string | null; followers: number | null }>
          | null;
        await tx.socialLink.deleteMany({ where: { talentProfileId } });
        if (newLinks && newLinks.length) {
          const rows = newLinks.map((l) => ({
            talentProfileId,
            platform: l.platform,
            handle: l.handle ?? null,
            url: l.url ?? null,
            followers: typeof l.followers === "number" ? l.followers : null,
          }));
          await tx.socialLink.createMany({ data: rows });
        }
      }

      const updated = await tx.talentProfileReview.update({
        where: { id: reviewId },
        data: { status: "APPROVED", reviewedAt: new Date() },
        select: { id: true, status: true, reviewedAt: true, rejectionComment: true },
      });
      return { decision: "APPROVED" as const, updated };
    });

    await notifyUsers({
      userIds: [talentUserId],
      type: (result.decision === "APPROVED"
        ? "PROFILE_APPROVED"
        : "PROFILE_REJECTED") as NotificationType,
      title:
        result.decision === "APPROVED"
          ? "Profile changes approved"
          : "Profile changes requested",
      body:
        result.decision === "APPROVED"
          ? "Your management approved your latest profile changes. They are now live on your showcase."
          : result.updated.rejectionComment ??
            "Your management requested changes to your profile. Review the note and resubmit.",
    }).catch(() => {});

    const notificationType =
      result.decision === "APPROVED" ? "profile-approved" : "profile-rejected";
    try {
      await prisma.$executeRawUnsafe(`SELECT 1`);
    } catch {}
    void notificationType;
    void submittedDraft;

    return NextResponse.json({
      ok: true,
      decision: result.decision,
      reviewedAt: result.updated.reviewedAt?.toISOString() ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Transaction failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function reviewToSubmittedDraft(changes: ReviewChangesShape): SubmittedDraft {
  const identity = changes.identity ?? {};
  const stats = changes.stats ?? {};
  const measurementsDiff = stats.measurements as
    | { old?: Record<string, unknown> | null; new?: Record<string, unknown> | null }
    | undefined;
  const mNew = measurementsDiff?.new ?? null;
  const credibility = changes.credibility ?? {};
  const social = changes.social ?? {};
  const bio = changes.bio ?? {};
  const identityStr = (k: string): string => {
    const d = identity[k] as FieldDiff | undefined;
    const v = d?.new;
    return typeof v === "string" ? v : "";
  };
  const identityStrNull = (k: string): string | null => {
    const d = identity[k] as FieldDiff | undefined;
    const v = d?.new;
    return typeof v === "string" ? v : null;
  };
  const statsStrNull = (k: string): string | null => {
    const d = stats[k] as FieldDiff | undefined;
    const v = d?.new;
    return typeof v === "string" ? v : null;
  };
  const statsNumNull = (k: string): number | null => {
    const d = stats[k] as FieldDiff | undefined;
    const v = d?.new;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  };
  const statsBoolNull = (k: string): boolean | null => {
    const d = stats[k] as FieldDiff | undefined;
    const v = d?.new;
    return typeof v === "boolean" ? v : null;
  };
  return {
    identity: {
      displayName: identityStr("displayName"),
      alias: identityStrNull("alias"),
      dateOfBirth: identityStrNull("dateOfBirth"),
      locationCity: identityStrNull("locationCity"),
      locationCountry: identityStrNull("locationCountry"),
      nationality: identityStrNull("nationality"),
      phoneNumber: identityStrNull("phoneNumber"),
      employmentStatus: identityStrNull("employmentStatus"),
      educationLevel: identityStrNull("educationLevel"),
      collegeCourse: identityStrNull("collegeCourse"),
    },
    stats: {
      heightIn: statsNumNull("heightIn"),
      weightLbs: statsNumNull("weightLbs"),
      skinTone: statsStrNull("skinTone"),
      eyeColor: statsStrNull("eyeColor"),
      shirtSize: statsStrNull("shirtSize"),
      pantsSize: statsStrNull("pantsSize"),
      dressSize: statsStrNull("dressSize"),
      shoeSize: statsNumNull("shoeSize"),
      measurements: {
        unit: (typeof mNew?.unit === "string" ? (mNew.unit as "in" | "cm") : "in"),
        bust: typeof mNew?.bust === "number" ? mNew.bust : null,
        underBust: typeof mNew?.underBust === "number" ? mNew.underBust : null,
        naturalWaist: typeof mNew?.naturalWaist === "number" ? mNew.naturalWaist : null,
        hips: typeof mNew?.hips === "number" ? mNew.hips : null,
        waistToFloor: typeof mNew?.waistToFloor === "number" ? mNew.waistToFloor : null,
        hollowToHem: typeof mNew?.hollowToHem === "number" ? mNew.hollowToHem : null,
        shoulderWidth: typeof mNew?.shoulderWidth === "number" ? mNew.shoulderWidth : null,
        backLength: typeof mNew?.backLength === "number" ? mNew.backLength : null,
      },
      tattoos: statsBoolNull("tattoos"),
      tattooLocations: statsStrNull("tattooLocations"),
      piercings: statsBoolNull("piercings"),
      piercingLocations: statsStrNull("piercingLocations"),
      birthmarks: statsBoolNull("birthmarks"),
      birthmarkLocations: statsStrNull("birthmarkLocations"),
    },
    credibility: {
      experienceYears: (() => {
        const d = credibility.experienceYears as FieldDiff | undefined;
        const v = d?.new;
        return typeof v === "number" && Number.isFinite(v) ? v : null;
      })(),
      modelingTypes: (() => {
        const d = credibility.modelingTypes as FieldDiff | undefined;
        const v = d?.new;
        return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
      })(),
      talents: (() => {
        const d = credibility.talents as FieldDiff | undefined;
        const v = d?.new;
        return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
      })(),
      experienceItems: (() => {
        const d = credibility.experienceItems as FieldDiff | undefined;
        const v = d?.new;
        if (!Array.isArray(v)) return [];
        return v
          .map((x) => {
            if (!x || typeof x !== "object") return null;
            const o = x as Record<string, unknown>;
            const id = typeof o.id === "string" ? o.id : null;
            const kind =
              o.kind === "PROJECT" || o.kind === "CERTIFICATION" || o.kind === "TITLE"
                ? (o.kind as "PROJECT" | "CERTIFICATION" | "TITLE")
                : null;
            const title = typeof o.title === "string" ? o.title : null;
            const role = typeof o.role === "string" ? o.role : null;
            const when = typeof o.when === "string" ? o.when : null;
            const createdAt = typeof o.createdAt === "string" ? o.createdAt : null;
            if (!id || !kind || !title || !createdAt) return null;
            return { id, kind, title, role, when, createdAt };
          })
          .filter(
            (
              x,
            ): x is {
              id: string;
              kind: "PROJECT" | "CERTIFICATION" | "TITLE";
              title: string;
              role: string | null;
              when: string | null;
              createdAt: string;
            } => Boolean(x),
          );
      })(),
    },
    social: {
      links: (() => {
        const d = social.links as FieldDiff | undefined;
        const v = d?.new;
        if (!Array.isArray(v)) return [];
        return v
          .map((x) => {
            if (!x || typeof x !== "object") return null;
            const o = x as Record<string, unknown>;
            const platform = typeof o.platform === "string" ? o.platform : null;
            if (!platform) return null;
            const handle = typeof o.handle === "string" ? o.handle : null;
            const url = typeof o.url === "string" ? o.url : null;
            const followers = typeof o.followers === "number" ? o.followers : null;
            return { platform, handle, url, followers };
          })
          .filter(
            (
              x,
            ): x is {
              platform: string;
              handle: string | null;
              url: string | null;
              followers: number | null;
            } => Boolean(x),
          );
      })(),
    },
    bio: {
      aboutMe: (() => {
        const d = bio.aboutMe as FieldDiff | undefined;
        const v = d?.new;
        return typeof v === "string" ? v : null;
      })(),
    },
  };
}
