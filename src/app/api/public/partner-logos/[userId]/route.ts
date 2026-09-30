import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      logoFileName: true,
      logoMimeType: true,
      logoStoragePath: true,
    },
  });

  if (!user?.logoStoragePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await readFile(user.logoStoragePath).catch(() => null);
  if (!bytes) return NextResponse.json({ error: "File missing" }, { status: 410 });

  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": user.logoMimeType ?? "image/png",
      "content-disposition": `inline; filename="${encodeURIComponent(user.logoFileName ?? "partner-logo.png")}"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
