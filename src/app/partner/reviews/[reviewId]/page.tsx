import { notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/db";
import { roleShellClass } from "@/lib/role-ui-theme-shared";
import { getRoleGlassThemeEnabled } from "@/lib/role-ui-theme";
import { requireRole, resolveAppWorkspace } from "@/lib/session";
import { REVIEW_CATEGORY_LABELS, type FieldDiff, type ReviewCategoryKey } from "@/lib/profile-review";
import {
  PartnerReviewDetailClient,
  type DiffField,
  type GroupedDiffs,
} from "./partner-review-detail-client";

type Params = Promise<{ reviewId: string }>;

const REVIEW_AVATAR_BASE = "/api/avatars";

type ReviewRow = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: Date;
  reviewedAt: Date | null;
  rejectionComment: string | null;
  partnerId: string | null;
  changesJson: unknown;
  talent: {
    id: string;
    email: string;
    name: string | null;
    talentProfile: {
      id: string;
      displayName: string;
      alias: string | null;
      partnerId: string | null;
      avatarUpdatedAt: Date | null;
    } | null;
  };
};

const ORDER: ReviewCategoryKey[] = ["identity", "stats", "credibility", "social", "bio"];
const CATEGORY_KEY_FIELDS: Record<ReviewCategoryKey, string[]> = {
  identity: [
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
  ],
  stats: [
    "heightIn",
    "weightLbs",
    "skinTone",
    "eyeColor",
    "shirtSize",
    "pantsSize",
    "dressSize",
    "shoeSize",
    "measurements",
    "tattoos",
    "tattooLocations",
    "piercings",
    "piercingLocations",
    "birthmarks",
    "birthmarkLocations",
  ],
  credibility: ["experienceYears", "modelingTypes", "talents", "experienceItems"],
  social: ["links"],
  bio: ["aboutMe"],
};

function toGroupedDiffs(raw: unknown): GroupedDiffs {
  const out: GroupedDiffs = {};
  if (!raw || typeof raw !== "object") return out;
  const obj = raw as Record<string, unknown>;
  for (const catKey of ORDER) {
    const bucket = obj[catKey];
    if (!bucket || typeof bucket !== "object") continue;
    const orderedKeys = CATEGORY_KEY_FIELDS[catKey];
    const found = Object.keys(bucket as Record<string, unknown>);
    const orderMap = new Map<string, number>();
    orderedKeys.forEach((k, i) => orderMap.set(k, i));
    const sortedKeys = found.sort(
      (a, b) =>
        (orderMap.get(a) ?? Number.MAX_SAFE_INTEGER) -
        (orderMap.get(b) ?? Number.MAX_SAFE_INTEGER),
    );
    const list: DiffField[] = [];
    for (const k of sortedKeys) {
      const fieldDiff = (bucket as Record<string, unknown>)[k] as FieldDiff | undefined;
      if (!fieldDiff) continue;
      if (typeof fieldDiff !== "object") continue;
      const fd = fieldDiff as { old: unknown; new: unknown };
      if (fd.old === undefined && fd.new === undefined) continue;
      if (JSON.stringify(fd.old ?? null) === JSON.stringify(fd.new ?? null)) continue;
      list.push({
        fieldKey: k,
        fieldLabel: k,
        old: fd.old ?? null,
        new: fd.new ?? null,
      });
    }
    if (list.length) out[catKey] = list;
  }
  return out;
}

export default async function PartnerReviewDetailPage(props: { params: Params }) {
  const session = await requireRole(["PARTNER"]);
  const workspace = await resolveAppWorkspace(session);
  const glassThemeEnabled = await getRoleGlassThemeEnabled("PARTNER");
  const { reviewId } = await props.params;
  if (!reviewId) return notFound();

  const review = (await prisma.talentProfileReview.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      reviewedAt: true,
      rejectionComment: true,
      partnerId: true,
      changesJson: true,
      talent: {
        select: {
          id: true,
          email: true,
          name: true,
          talentProfile: {
            select: {
              id: true,
              displayName: true,
              alias: true,
              partnerId: true,
              avatarUpdatedAt: true,
            },
          },
        },
      },
    },
  })) as ReviewRow | null;

  if (!review) return notFound();
  const talentProfile = review.talent.talentProfile;
  if (!talentProfile) return notFound();
  const assignedPartner = review.partnerId ?? talentProfile.partnerId;
  const reviewBelongsToPartner = assignedPartner === session.user.id;

  const groupedDiffs = toGroupedDiffs(review.changesJson);

  const display = talentProfile.displayName || review.talent.name || review.talent.email;
  const subtitle = talentProfile.alias
    ? `${talentProfile.alias} · ${review.talent.email}`
    : review.talent.email;
  const avatarSrc = talentProfile.avatarUpdatedAt
    ? `${REVIEW_AVATAR_BASE}/${talentProfile.id}?v=${encodeURIComponent(
        talentProfile.avatarUpdatedAt.toISOString(),
      )}`
    : null;

  const partnerId = session.user.id;
  void partnerId;
  void REVIEW_CATEGORY_LABELS;

  return (
    <div className={roleShellClass(glassThemeEnabled)}>
      <AppNav
        role="PARTNER"
        workspace={workspace}
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <PartnerReviewDetailClient
          reviewId={review.id}
          reviewStatus={review.status}
          groupedDiffs={groupedDiffs}
          submittedAt={review.submittedAt.toISOString()}
          reviewedAt={review.reviewedAt ? review.reviewedAt.toISOString() : null}
          rejectionComment={review.rejectionComment}
          talentDisplay={display}
          talentAvatarSrc={avatarSrc}
          talentSubtitle={subtitle}
          partnerName={null}
          reviewBelongsToPartner={reviewBelongsToPartner}
        />
      </div>
    </div>
  );
}
