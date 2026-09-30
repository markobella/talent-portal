import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export const runtime = "nodejs";
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function isUploadFile(value: unknown): value is {
  arrayBuffer: () => Promise<ArrayBuffer>;
  type?: string;
  size?: number;
  name?: string;
} {
  return !!value && typeof value === "object" && typeof (value as any).arrayBuffer === "function";
}

export async function POST(req: Request) {
  const auth = await requireApiRole(["PARTNER"]);
  if (!auth.ok) return auth.response;

  const userId = auth.session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, logoStoragePath: true },
  });
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  const action = typeof form.get("action") === "string" ? form.get("action") : "upload";

  if (action === "remove") {
    if (user.logoStoragePath) await unlink(user.logoStoragePath).catch(() => null);
    await prisma.user.update({
      where: { id: userId },
      data: {
        logoFileName: null,
        logoMimeType: null,
        logoStoragePath: null,
        logoUpdatedAt: null,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, logoUpdatedAt: null });
  }

  if (!isUploadFile(file)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  const type = typeof file.type === "string" ? file.type : "";
  const size = typeof file.size === "number" ? file.size : 0;
  const name = typeof file.name === "string" ? file.name : "partner-logo.png";
  if (!type.startsWith("image/")) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  if (size > MAX_LOGO_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5 MB for management logos." },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const dir = path.join(process.cwd(), "uploads", "partner-logos", userId);
  await mkdir(dir, { recursive: true });

  const fileName = `${Date.now()}-${safeName(name)}`;
  const storagePath = path.join(dir, fileName);
  await writeFile(storagePath, buffer);

  if (user.logoStoragePath) await unlink(user.logoStoragePath).catch(() => null);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      logoFileName: name || "partner-logo.png",
      logoMimeType: type || "image/png",
      logoStoragePath: storagePath,
      logoUpdatedAt: new Date(),
    },
    select: { id: true, logoUpdatedAt: true },
  });

  return NextResponse.json({
    ok: true,
    logoUpdatedAt: updated.logoUpdatedAt?.toISOString() ?? null,
  });
}
