import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export const runtime = "nodejs";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function isUploadFile(value: unknown): value is { arrayBuffer: () => Promise<ArrayBuffer>; type?: string; size?: number; name?: string } {
  return !!value && typeof value === "object" && typeof (value as any).arrayBuffer === "function";
}

export async function POST(req: Request, ctx: { params: Promise<{ talentProfileId: string }> }) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { talentProfileId } = await ctx.params;
  const profile = await prisma.talentProfile.findUnique({
    where: { id: talentProfileId },
    select: { id: true, pendingAvatarStoragePath: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!isUploadFile(file)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  const type = typeof (file as any).type === "string" ? (file as any).type : "";
  const size = typeof (file as any).size === "number" ? (file as any).size : 0;
  const name = typeof (file as any).name === "string" ? (file as any).name : "avatar.jpg";
  if (!type.startsWith("image/")) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  if (size > 8 * 1024 * 1024) return NextResponse.json({ error: "File too large" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const dir = path.join(process.cwd(), "uploads", "avatars", talentProfileId);
  await mkdir(dir, { recursive: true });

  const fileName = `${Date.now()}-${safeName(name)}`;
  const storagePath = path.join(dir, fileName);
  await writeFile(storagePath, buffer);

  if (profile.pendingAvatarStoragePath) {
    await unlink(profile.pendingAvatarStoragePath).catch(() => null);
  }

  const updated = await prisma.talentProfile.update({
    where: { id: talentProfileId },
    data: {
      avatarFileName: name || "avatar.jpg",
      avatarMimeType: type || "image/jpeg",
      avatarStoragePath: storagePath,
      avatarUpdatedAt: new Date(),
      pendingAvatarFileName: null,
      pendingAvatarMimeType: null,
      pendingAvatarStoragePath: null,
      pendingAvatarUpdatedAt: null,
      avatarReviewStatus: "APPROVED",
      avatarReviewNotes: null,
      avatarReviewedAt: new Date(),
      avatarReviewedById: auth.session.user.id,
    },
    select: { id: true, avatarUpdatedAt: true },
  });

  await prisma.profileUpdateLog.create({
    data: {
      talentProfileId: updated.id,
      actorId: auth.session.user.id,
      section: "MEDIA",
      changes: { avatarUpdatedAt: updated.avatarUpdatedAt?.toISOString() ?? null },
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, avatarUpdatedAt: updated.avatarUpdatedAt?.toISOString() ?? null });
}
