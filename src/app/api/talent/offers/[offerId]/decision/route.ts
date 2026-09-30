import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { adminAuditLog } from "@/lib/admin-audit";
import { notifyUsers } from "@/lib/notifications";

const DecisionSchema = z.object({
  decision: z.enum(["ACCEPT", "DECLINE"]),
});

export async function POST(req: Request, ctx: { params: Promise<{ offerId: string }> }) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { offerId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = DecisionSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const userId = auth.session.user.id;
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { id: true, title: true, status: true, partnerId: true, talentId: true },
  });
  if (!offer || offer.talentId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (offer.status !== "APPROVED") {
    return NextResponse.json({ error: "Offer cannot be updated" }, { status: 400 });
  }

  const nextStatus = parsed.data.decision === "ACCEPT" ? ("ACCEPTED" as const) : ("DECLINED" as const);
  await prisma.offer.update({ where: { id: offer.id }, data: { status: nextStatus }, select: { id: true } });

  await adminAuditLog({
    actorId: userId,
    action: nextStatus === "ACCEPTED" ? "OFFER_ACCEPT" : "OFFER_DECLINE",
    entityType: "OFFER",
    entityId: offer.id,
    details: { title: offer.title },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await notifyUsers({
    userIds: [offer.partnerId],
    type: nextStatus === "ACCEPTED" ? "OFFER_ACCEPTED" : "OFFER_DECLINED",
    title: nextStatus === "ACCEPTED" ? "Offer accepted" : "Offer declined",
    body: offer.title,
    data: { offerId: offer.id },
  });
  await notifyUsers({
    userIds: admins.map((a) => a.id),
    type: nextStatus === "ACCEPTED" ? "OFFER_ACCEPTED" : "OFFER_DECLINED",
    title: nextStatus === "ACCEPTED" ? "Talent accepted an offer" : "Talent declined an offer",
    body: offer.title,
    data: { offerId: offer.id },
  });

  return NextResponse.json({ ok: true, status: nextStatus });
}

