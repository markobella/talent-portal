import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ talentProfileId: string }> }) {
  const { talentProfileId } = await ctx.params;
  const profile = await prisma.talentProfile.findUnique({
    where: { id: talentProfileId },
    select: {
      avatarFileName: true,
      avatarMimeType: true,
      avatarStoragePath: true,
    },
  });

  if (!profile?.avatarStoragePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await readFile(profile.avatarStoragePath).catch(() => null);
  if (!bytes) return NextResponse.json({ error: "File missing" }, { status: 410 });

  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": profile.avatarMimeType ?? "image/jpeg",
      "content-disposition": `inline; filename="${encodeURIComponent(profile.avatarFileName ?? "avatar.jpg")}"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
