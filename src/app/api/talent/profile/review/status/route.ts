import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  const auth = await requireApiRole(["TALENT"]);
  if (!auth.ok) return auth.response;

  const userId = auth.session.user.id;

  const pending = await prisma.talentProfileReview.findFirst({
    where: { talentUserId: userId, status: "PENDING" },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      status: true,
      submittedAt: true,
    },
  });

  if (pending) {
    return NextResponse.json({
      pending: true,
      reviewId: pending.id,
      submittedAt: pending.submittedAt.toISOString(),
    });
  }

  const last = await prisma.talentProfileReview.findFirst({
    where: { talentUserId: userId, status: { in: ["APPROVED", "REJECTED"] } },
    orderBy: { reviewedAt: "desc", submittedAt: "desc" },
    take: 1,
    select: {
      id: true,
      status: true,
      reviewedAt: true,
      rejectionComment: true,
    },
  });

  return NextResponse.json({
    pending: false,
    last: last
      ? {
          reviewId: last.id,
          decision: last.status,
          reviewedAt: last.reviewedAt?.toISOString() ?? null,
          rejectionComment: last.rejectionComment ?? null,
        }
      : null,
  });
}
