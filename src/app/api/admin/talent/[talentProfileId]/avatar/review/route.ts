import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { adminAuditLog } from "@/lib/admin-audit";
import { notifyUsers } from "@/lib/notifications";

const ReviewSchema = z.object({
  decision: z.enum(["APPROVE", "DENY"]),
  notes: z.string().max(1000).optional().nullable(),
});

export async function POST(req: Request, ctx: { params: Promise<{ talentProfileId: string }> }) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { talentProfileId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = ReviewSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const profile = await prisma.talentProfile.findUnique({
    where: { id: talentProfileId },
    select: {
      id: true,
      displayName: true,
      userId: true,
      pendingAvatarFileName: true,
      pendingAvatarMimeType: true,
      pendingAvatarStoragePath: true,
      pendingAvatarUpdatedAt: true,
      avatarReviewStatus: true,
    },
  });

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!profile.pendingAvatarStoragePath || profile.avatarReviewStatus !== "PENDING") {
    return NextResponse.json({ error: "No pending profile photo to review" }, { status: 400 });
  }

  const actorId = auth.session.user.id;
  const now = new Date();
  const notes = (parsed.data.notes ?? "").trim() || null;

  if (parsed.data.decision === "APPROVE") {
    await prisma.talentProfile.update({
      where: { id: profile.id },
      data: {
        avatarFileName: profile.pendingAvatarFileName,
        avatarMimeType: profile.pendingAvatarMimeType,
        avatarStoragePath: profile.pendingAvatarStoragePath,
        avatarUpdatedAt: profile.pendingAvatarUpdatedAt ?? now,
        pendingAvatarFileName: null,
        pendingAvatarMimeType: null,
        pendingAvatarStoragePath: null,
        pendingAvatarUpdatedAt: null,
        avatarReviewStatus: "APPROVED",
        avatarReviewNotes: notes,
        avatarReviewedAt: now,
        avatarReviewedById: actorId,
      },
      select: { id: true },
    });

    await prisma.profileUpdateLog.create({
      data: {
        talentProfileId: profile.id,
        actorId,
        section: "MEDIA",
        changes: { avatarDecision: "APPROVED", notes, at: now.toISOString() },
      },
      select: { id: true },
    });

    await adminAuditLog({
      actorId,
      action: "AVATAR_APPROVE",
      entityType: "TALENT_AVATAR",
      entityId: profile.id,
      details: { talentProfileId: profile.id, displayName: profile.displayName, notes },
    });

    await notifyUsers({
      userIds: [profile.userId],
      type: "MEDIA_APPROVED",
      title: "Profile photo approved",
      body: notes ?? "Your new profile photo is now live.",
      data: { talentProfileId: profile.id, mediaKind: "AVATAR" },
    });

    return NextResponse.json({ ok: true, status: "APPROVED" });
  }

  await prisma.talentProfile.update({
    where: { id: profile.id },
    data: {
      pendingAvatarFileName: null,
      pendingAvatarMimeType: null,
      pendingAvatarStoragePath: null,
      pendingAvatarUpdatedAt: null,
      avatarReviewStatus: null,
      avatarReviewNotes: null,
      avatarReviewedAt: now,
      avatarReviewedById: actorId,
    },
    select: { id: true },
  });

  await unlink(profile.pendingAvatarStoragePath).catch(() => null);

  await prisma.profileUpdateLog.create({
    data: {
      talentProfileId: profile.id,
      actorId,
      section: "MEDIA",
      changes: { avatarDecision: "DENIED", notes, at: now.toISOString() },
    },
    select: { id: true },
  });

  await adminAuditLog({
    actorId,
    action: "AVATAR_DENY",
    entityType: "TALENT_AVATAR",
    entityId: profile.id,
    details: { talentProfileId: profile.id, displayName: profile.displayName, notes },
  });

  await notifyUsers({
    userIds: [profile.userId],
    type: "MEDIA_DENIED",
    title: "Profile photo denied",
    body: notes ?? "Your pending profile photo was denied and removed from review.",
    data: { talentProfileId: profile.id, mediaKind: "AVATAR", notes, removed: true },
  });

  return NextResponse.json({ ok: true, status: "DENIED" });
}
