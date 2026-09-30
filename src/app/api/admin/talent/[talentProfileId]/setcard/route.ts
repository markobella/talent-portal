import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ talentProfileId: string }> },
) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { talentProfileId } = await ctx.params;
  const profile = await prisma.talentProfile.findUnique({
    where: { id: talentProfileId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const dir = path.join(process.cwd(), "uploads", "setcards", talentProfileId);
  await mkdir(dir, { recursive: true });

  const fileName = `${Date.now()}-${safeName(file.name || "setcard")}`;
  const storagePath = path.join(dir, fileName);
  await writeFile(storagePath, buffer);

  const created = await prisma.setcard.create({
    data: {
      talentProfileId,
      uploadedById: auth.session.user.id,
      fileName: file.name || fileName,
      mimeType: file.type || "application/octet-stream",
      storagePath,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, setcardId: created.id });
}

