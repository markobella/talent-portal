import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { notifyUsers } from "@/lib/notifications";
import { adminAuditLog } from "@/lib/admin-audit";

const OfferSchema = z.object({
  talentId: z.string().min(1),
  title: z.string().min(2).max(100),
  projectDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  amountPhp: z.number().int().min(0).max(10_000_000),
  transportAllowance: z.boolean().optional(),
  projectType: z.enum(["PHOTO_SHOOT", "VIDEO_SHOOT", "PHOTO_VIDEO_SHOOT", "PERFORMANCE", "HOSTING", "OTHER"]),
  message: z.string().max(4000).nullable().optional(),
});

export async function POST(req: Request) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const json = await req.json().catch(() => null);
    const parsed = OfferSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const partnerId = auth.session.user.id;
    const talent = await prisma.user.findUnique({
      where: { id: parsed.data.talentId },
      select: {
        id: true,
        role: true,
        talentProfile: { select: { partnerId: true } },
      },
    });
    if (!talent || talent.role !== "TALENT") {
      return NextResponse.json({ error: "Talent not found" }, { status: 404 });
    }
    if (talent.talentProfile?.partnerId !== partnerId) {
      return NextResponse.json({ error: "Talent not in your roster" }, { status: 403 });
    }

    const offer = await prisma.offer.create({
      data: {
        partnerId,
        talentId: talent.id,
        title: parsed.data.title,
        projectType: parsed.data.projectType,
        projectDate: new Date(`${parsed.data.projectDate}T00:00:00`),
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        amountPhp: parsed.data.amountPhp,
        transportAllowance: parsed.data.transportAllowance ?? false,
        message: parsed.data.message ?? null,
        messages: parsed.data.message
          ? {
              create: {
                senderId: partnerId,
                body: parsed.data.message,
              },
            }
          : undefined,
      } as any,
      select: { id: true, title: true },
    });

    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await adminAuditLog({
      actorId: partnerId,
      action: "OFFER_SUBMIT",
      entityType: "OFFER",
      entityId: offer.id,
      details: { title: offer.title, talentId: talent.id },
    }).catch(() => null);

    await notifyUsers({
      userIds: admins.map((a) => a.id),
      type: "OFFER_SUBMITTED",
      title: "New offer pending approval",
      body: offer.title,
      data: { offerId: offer.id },
    }).catch(() => null);

    await notifyUsers({
      userIds: [partnerId],
      type: "OFFER_SUBMITTED",
      title: "Offer submitted for approval",
      body: offer.title,
      data: { offerId: offer.id },
    }).catch(() => null);

    return NextResponse.json({ ok: true, offerId: offer.id });
  } catch {
    return NextResponse.json({ error: "Failed to send offer" }, { status: 500 });
  }
}
