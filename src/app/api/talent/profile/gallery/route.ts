import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import {
  GALLERY_MEDIA_DB_TYPES,
  MAX_GALLERY_ITEMS,
  galleryDbTypeFromKind,
  galleryKindFromMimeType,
  galleryKindLabel,
  maxGalleryUploadBytesForKind,
} from "@/lib/gallery-media";
import { notifyUsers } from "@/lib/notifications";
import { probeImageDimensions } from "@/lib/probe-image-dimensions";

export const runtime = "nodejs";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function isUploadFile(
  value: FormDataEntryValue,
): value is File {
  return !!value && typeof value === "object" && typeof (value as any).arrayBuffer === "function";
}

export async function POST(req: Request) {
  const auth = await requireApiRole(["TALENT"]);
  if (!auth.ok) return auth.response;

  const userId = auth.session.user.id;
  const profile = await prisma.talentProfile.findUnique({
    where: { userId },
    select: { id: true, displayName: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const existingCount = await prisma.mediaItem.count({
    where: { talentProfileId: profile.id, type: { in: [...GALLERY_MEDIA_DB_TYPES] }, reviewStatus: { not: "DENIED" } },
  });
  if (existingCount >= MAX_GALLERY_ITEMS) {
    return NextResponse.json({ error: `Gallery is full (max ${MAX_GALLERY_ITEMS} items).` }, { status: 400 });
  }

  const form = await req.formData();
  const files = form.getAll("files");
  const uploadables = files.filter(isUploadFile);
  if (!uploadables.length) return NextResponse.json({ error: "Missing files" }, { status: 400 });

  const remaining = MAX_GALLERY_ITEMS - existingCount;
  const toSave = uploadables.slice(0, remaining);

  const dir = path.join(process.cwd(), "uploads", "gallery", profile.id);
  await mkdir(dir, { recursive: true });

  const startOrder =
    (await prisma.mediaItem
      .findFirst({
        where: { talentProfileId: profile.id, type: { in: [...GALLERY_MEDIA_DB_TYPES] } },
        orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
        select: { sortOrder: true },
      })
      .then((x) => x?.sortOrder ?? 0)) + 1;

  let createdCount = 0;
  let createdPhotos = 0;
  let createdVideos = 0;
  for (let i = 0; i < toSave.length; i += 1) {
    const file = toSave[i];
    const type = typeof (file as any).type === "string" ? (file as any).type.trim().toLowerCase() : "";
    const size = typeof (file as any).size === "number" ? (file as any).size : 0;
    const kind = galleryKindFromMimeType(type);
    const name =
      typeof (file as any).name === "string"
        ? (file as any).name
        : kind === "VIDEO"
          ? "video.mp4"
          : "photo.jpg";

    if (!kind) continue;
    if (size > maxGalleryUploadBytesForKind(kind)) continue;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dims = kind === "PHOTO" ? probeImageDimensions(buffer, type) : null;

    const storedName = `${Date.now()}-${safeName(name)}`;
    const storagePath = path.join(dir, storedName);
    await writeFile(storagePath, buffer);

    await prisma.mediaItem.create({
      data: {
        talentProfileId: profile.id,
        type: galleryDbTypeFromKind(kind),
        title: null,
        url: null,
        fileName: name,
        mimeType: type || (kind === "VIDEO" ? "video/mp4" : "image/jpeg"),
        storagePath,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
        sortOrder: startOrder + i,
        reviewStatus: "PENDING",
        reviewNotes: null,
        reviewedAt: null,
        reviewedById: null,
      },
      select: { id: true },
    });
    createdCount += 1;
    if (kind === "VIDEO") createdVideos += 1;
    else createdPhotos += 1;
  }

  if (!createdCount) {
    return NextResponse.json({ error: "No valid gallery files uploaded. Photos can be up to 10 MB and videos up to 100 MB." }, { status: 400 });
  }

  const submittedParts = [
    createdPhotos ? `${createdPhotos} gallery ${galleryKindLabel("PHOTO", createdPhotos)}` : null,
    createdVideos ? `${createdVideos} gallery ${galleryKindLabel("VIDEO", createdVideos)}` : null,
  ].filter((value): value is string => Boolean(value));

  await prisma.profileUpdateLog.create({
    data: {
      talentProfileId: profile.id,
      actorId: userId,
      section: "MEDIA",
      changes: {
        galleryAdded: createdCount,
        galleryPhotosAdded: createdPhotos,
        galleryVideosAdded: createdVideos,
        at: new Date().toISOString(),
        moderation: "PENDING",
      },
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
    title: "Gallery uploads pending review",
    body: `${profile.displayName} uploaded ${submittedParts.join(" and ")}.`,
    data: { talentProfileId: profile.id, mediaKind: "GALLERY" },
  });

  return NextResponse.json({ ok: true, created: createdCount });
}
