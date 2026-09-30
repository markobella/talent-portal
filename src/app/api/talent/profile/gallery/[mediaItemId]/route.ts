import { unlink } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { isGalleryMediaDbType } from "@/lib/gallery-media";

export const runtime = "nodejs";

export async function DELETE(req: Request, ctx: { params: Promise<{ mediaItemId: string }> }) {
  const auth = await requireApiRole(["TALENT"]);
  if (!auth.ok) return auth.response;

  const userId = auth.session.user.id;
  const profile = await prisma.talentProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { mediaItemId } = await ctx.params;
  const item = await prisma.mediaItem.findUnique({
    where: { id: mediaItemId },
    select: { id: true, talentProfileId: true, type: true, storagePath: true },
  });

  if (!item || item.talentProfileId !== profile.id || !isGalleryMediaDbType(item.type)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.mediaItem.delete({ where: { id: item.id }, select: { id: true } });
  if (item.storagePath) await unlink(item.storagePath).catch(() => null);

  await prisma.profileUpdateLog.create({
    data: {
      talentProfileId: profile.id,
      actorId: userId,
      section: "MEDIA",
      changes: { galleryRemoved: 1, at: new Date().toISOString() },
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}
