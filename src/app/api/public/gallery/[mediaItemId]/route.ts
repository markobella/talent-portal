import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isGalleryMediaDbType } from "@/lib/gallery-media";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ mediaItemId: string }> }) {
  const { mediaItemId } = await ctx.params;
  const item = await prisma.mediaItem.findUnique({
    where: { id: mediaItemId },
    select: {
      type: true,
      fileName: true,
      mimeType: true,
      storagePath: true,
      reviewStatus: true,
    },
  });

  if (!item || !isGalleryMediaDbType(item.type) || item.reviewStatus !== "APPROVED" || !item.storagePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await readFile(item.storagePath).catch(() => null);
  if (!bytes) return NextResponse.json({ error: "File missing" }, { status: 410 });

  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": item.mimeType ?? "application/octet-stream",
      "content-disposition": `inline; filename="${encodeURIComponent(item.fileName ?? "gallery-item")}"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
