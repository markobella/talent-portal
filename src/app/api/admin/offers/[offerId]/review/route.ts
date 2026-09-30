import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { adminAuditLog } from "@/lib/admin-audit";
import { notifyUsers } from "@/lib/notifications";

const ReviewSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().max(1000).optional().nullable(),
});

export async function POST(req: Request, ctx: { params: Promise<{ offerId: string }> }) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { offerId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = ReviewSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { id: true, title: true, status: true, partnerId: true, talentId: true },
  });
  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (offer.status !== "PENDING_ADMIN") {
    return NextResponse.json({ error: "Offer already reviewed" }, { status: 400 });
  }

  const actorId = auth.session.user.id;
  const now = new Date();
  const reason = (parsed.data.reason ?? "").trim() || null;

  if (parsed.data.decision === "APPROVE") {
    await prisma.offer.update({
      where: { id: offer.id },
      data: {
        status: "APPROVED",
        adminReviewedAt: now,
        adminReviewerId: actorId,
        adminRejectionReason: null,
      },
      select: { id: true },
    });

    await adminAuditLog({
      actorId,
      action: "OFFER_APPROVE",
      entityType: "OFFER",
      entityId: offer.id,
      details: { title: offer.title },
    });

    await notifyUsers({
      userIds: [offer.partnerId],
      type: "OFFER_APPROVED",
      title: "Offer approved by admin",
      body: offer.title,
      data: { offerId: offer.id },
    });
    await notifyUsers({
      userIds: [offer.talentId],
      type: "OFFER_APPROVED",
      title: "New offer received",
      body: offer.title,
      data: { offerId: offer.id },
    });

    return NextResponse.json({ ok: true, status: "APPROVED" });
  }

  await prisma.offer.update({
    where: { id: offer.id },
    data: {
      status: "ADMIN_REJECTED",
      adminReviewedAt: now,
      adminReviewerId: actorId,
      adminRejectionReason: reason,
    },
    select: { id: true },
  });

  await adminAuditLog({
    actorId,
    action: "OFFER_REJECT",
    entityType: "OFFER",
    entityId: offer.id,
    details: { title: offer.title, reason },
  });

  await notifyUsers({
    userIds: [offer.partnerId],
    type: "OFFER_REJECTED",
    title: "Offer rejected by admin",
    body: offer.title,
    data: { offerId: offer.id, reason },
  });

  return NextResponse.json({ ok: true, status: "ADMIN_REJECTED" });
}

