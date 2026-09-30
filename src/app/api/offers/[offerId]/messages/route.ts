import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { notifyUsers } from "@/lib/notifications";
import { adminAuditLog } from "@/lib/admin-audit";

const MessageSchema = z.object({
  body: z.string().min(1).max(4000),
});

function isTalentVisibleStatus(status: string) {
  return status !== "PENDING_ADMIN" && status !== "ADMIN_REJECTED";
}

export async function GET(req: Request, ctx: { params: Promise<{ offerId: string }> }) {
  const auth = await requireApiRole(["ADMIN", "PARTNER", "TALENT"]);
  if (!auth.ok) return auth.response;

  const { offerId } = await ctx.params;
  const userId = auth.session.user.id;
  const role = auth.session.user.role;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { id: true, status: true, partnerId: true, talentId: true },
  });
  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (role === "PARTNER" && offer.partnerId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role === "TALENT" && (offer.talentId !== userId || !isTalentVisibleStatus(offer.status))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const msgs = await prisma.offerMessage.findMany({
    where: { offerId: offer.id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      createdAt: true,
      body: true,
      sender: { select: { id: true, role: true, email: true, name: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    messages: msgs.map((m) => ({
      id: m.id,
      createdAt: m.createdAt.toISOString(),
      body: m.body,
      sender: m.sender,
    })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ offerId: string }> }) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { offerId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = MessageSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const userId = auth.session.user.id;
  const role = auth.session.user.role;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { id: true, title: true, status: true, partnerId: true, talentId: true },
  });
  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (offer.status === "WITHDRAWN") return NextResponse.json({ error: "Offer closed" }, { status: 400 });

  if (role === "PARTNER" && offer.partnerId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role === "TALENT" && (offer.talentId !== userId || !isTalentVisibleStatus(offer.status))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = parsed.data.body.trim();
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const msg = await prisma.offerMessage.create({
    data: { offerId: offer.id, senderId: userId, body },
    select: { id: true, createdAt: true },
  });

  await adminAuditLog({
    actorId: userId,
    action: "OFFER_MESSAGE",
    entityType: "OFFER",
    entityId: offer.id,
    details: { messageId: msg.id, senderRole: role },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  if (role === "TALENT") {
    await notifyUsers({
      userIds: [offer.partnerId, ...admins.map((a) => a.id)],
      type: "OFFER_MESSAGE",
      title: "New message on offer",
      body: offer.title,
      data: { offerId: offer.id, messageId: msg.id },
    });
  } else if (role === "PARTNER") {
    if (isTalentVisibleStatus(offer.status)) {
      await notifyUsers({
        userIds: [offer.talentId, ...admins.map((a) => a.id)],
        type: "OFFER_MESSAGE",
        title: "New message on offer",
        body: offer.title,
        data: { offerId: offer.id, messageId: msg.id },
      });
    }
  } else {
    await notifyUsers({
      userIds: [offer.partnerId, offer.talentId],
      type: "OFFER_MESSAGE",
      title: "New admin message on offer",
      body: offer.title,
      data: { offerId: offer.id, messageId: msg.id },
    });
  }

  return NextResponse.json({ ok: true, messageId: msg.id, createdAt: msg.createdAt.toISOString() });
}
