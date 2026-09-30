import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { notifyUsers } from "@/lib/notifications";

export const runtime = "nodejs";
const MAX_PHOTO_UPLOAD_BYTES = 10 * 1024 * 1024;

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function isUploadFile(value: unknown): value is { arrayBuffer: () => Promise<ArrayBuffer>; type?: string; size?: number; name?: string } {
  return !!value && typeof value === "object" && typeof (value as any).arrayBuffer === "function";
}

export async function POST(req: Request) {
  const auth = await requireApiRole(["TALENT"]);
  if (!auth.ok) return auth.response;

  const userId = auth.session.user.id;
  const profile = await prisma.talentProfile.findUnique({
    where: { userId },
    select: { id: true, displayName: true, pendingAvatarStoragePath: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!isUploadFile(file)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  const type = typeof (file as any).type === "string" ? (file as any).type : "";
  const size = typeof (file as any).size === "number" ? (file as any).size : 0;
  const name = typeof (file as any).name === "string" ? (file as any).name : "avatar.jpg";
  if (!type.startsWith("image/")) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  if (size > MAX_PHOTO_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large. Maximum size is 10 MB per photo." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const dir = path.join(process.cwd(), "uploads", "avatars", profile.id);
  await mkdir(dir, { recursive: true });

  const fileName = `${Date.now()}-${safeName(name)}`;
  const storagePath = path.join(dir, fileName);
  await writeFile(storagePath, buffer);

  if (profile.pendingAvatarStoragePath) {
    await unlink(profile.pendingAvatarStoragePath).catch(() => null);
  }

  const updated = await prisma.talentProfile.update({
    where: { id: profile.id },
    data: {
      pendingAvatarFileName: name || "avatar.jpg",
      pendingAvatarMimeType: type || "image/jpeg",
      pendingAvatarStoragePath: storagePath,
      pendingAvatarUpdatedAt: new Date(),
      avatarReviewStatus: "PENDING",
      avatarReviewNotes: null,
      avatarReviewedAt: null,
      avatarReviewedById: null,
    },
    select: { id: true, pendingAvatarUpdatedAt: true },
  });

  await prisma.profileUpdateLog.create({
    data: {
      talentProfileId: updated.id,
      actorId: userId,
      section: "MEDIA",
      changes: { avatarSubmittedAt: updated.pendingAvatarUpdatedAt?.toISOString() ?? null, moderation: "PENDING" },
    },
    select: { id: true },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  await notifyUsers({
    userIds: admins.map((admin) => admin.id),
    type: "MEDIA_SUBMITTED",
    title: "Profile photo pending review",
    body: `${profile.displayName} uploaded a new profile photo.`,
    data: { talentProfileId: profile.id, mediaKind: "AVATAR" },
  });

  return NextResponse.json({
    ok: true,
    pendingAvatarUpdatedAt: updated.pendingAvatarUpdatedAt?.toISOString() ?? null,
    avatarReviewStatus: "PENDING",
  });
}
