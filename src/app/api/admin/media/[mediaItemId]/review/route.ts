import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { adminAuditLog } from "@/lib/admin-audit";
import { galleryKindFromDbType, galleryKindLabel, isGalleryMediaDbType } from "@/lib/gallery-media";
import { notifyUsers } from "@/lib/notifications";

const ReviewSchema = z.object({
  decision: z.enum(["APPROVE", "DENY"]),
  notes: z.string().max(1000).optional().nullable(),
});

export async function POST(req: Request, ctx: { params: Promise<{ mediaItemId: string }> }) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { mediaItemId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = ReviewSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const item = await prisma.mediaItem.findUnique({
    where: { id: mediaItemId },
    select: {
      id: true,
      talentProfileId: true,
      type: true,
      fileName: true,
      storagePath: true,
      reviewStatus: true,
      talentProfile: {
        select: {
          displayName: true,
          userId: true,
        },
      },
    },
  });

  if (!item || !isGalleryMediaDbType(item.type)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const mediaKind = galleryKindFromDbType(item.type);
  const mediaLabel = `gallery ${galleryKindLabel(mediaKind)}`;
  if (item.reviewStatus !== "PENDING") {
    return NextResponse.json({ error: `This ${mediaLabel} has already been reviewed` }, { status: 400 });
  }

  const actorId = auth.session.user.id;
  const now = new Date();
  const notes = (parsed.data.notes ?? "").trim() || null;
  const approved = parsed.data.decision === "APPROVE";

  if (approved) {
    await prisma.mediaItem.update({
      where: { id: item.id },
      data: {
        reviewStatus: "APPROVED",
        reviewNotes: notes,
        reviewedAt: now,
        reviewedById: actorId,
      },
      select: { id: true },
    });
  } else {
    await prisma.mediaItem.delete({
      where: { id: item.id },
      select: { id: true },
    });
    if (item.storagePath) {
      await unlink(item.storagePath).catch(() => null);
    }
  }

  await prisma.profileUpdateLog.create({
    data: {
      talentProfileId: item.talentProfileId,
      actorId,
      section: "MEDIA",
      changes: {
        galleryReview: approved ? "APPROVED" : "DENIED",
        mediaItemId: item.id,
        fileName: item.fileName,
        notes,
        at: now.toISOString(),
      },
    },
    select: { id: true },
  });

  await adminAuditLog({
    actorId,
    action: approved ? `GALLERY_${mediaKind}_APPROVE` : `GALLERY_${mediaKind}_DENY`,
    entityType: `GALLERY_${mediaKind}`,
    entityId: item.id,
    details: {
      talentProfileId: item.talentProfileId,
      displayName: item.talentProfile.displayName,
      fileName: item.fileName,
      mediaKind,
      notes,
    },
  });

  await notifyUsers({
    userIds: [item.talentProfile.userId],
    type: approved ? "MEDIA_APPROVED" : "MEDIA_DENIED",
    title: approved ? `Gallery ${galleryKindLabel(mediaKind)} approved` : `Gallery ${galleryKindLabel(mediaKind)} denied`,
    body:
      notes ??
      (approved
        ? `${item.fileName ?? `Your gallery ${galleryKindLabel(mediaKind)}`} is now visible to management.`
        : `${item.fileName ?? `This gallery ${galleryKindLabel(mediaKind)}`} was denied and removed from review.`),
    data: { talentProfileId: item.talentProfileId, mediaKind: "GALLERY", galleryMediaKind: mediaKind, notes, removed: !approved },
  });

  return NextResponse.json({ ok: true, status: approved ? "APPROVED" : "DENIED" });
}
