import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { isGalleryMediaDbType } from "@/lib/gallery-media";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ mediaItemId: string }> }) {
  const auth = await requireApiRole(["TALENT", "PARTNER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const { mediaItemId } = await ctx.params;
  const item = await prisma.mediaItem.findUnique({
    where: { id: mediaItemId },
    select: {
      id: true,
      type: true,
      fileName: true,
      mimeType: true,
      storagePath: true,
      reviewStatus: true,
      talentProfile: { select: { userId: true } },
    },
  });

  if (!item || !isGalleryMediaDbType(item.type) || !item.storagePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (auth.session.user.role === "TALENT" && auth.session.user.id !== item.talentProfile.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (auth.session.user.role === "PARTNER" && item.reviewStatus !== "APPROVED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await readFile(item.storagePath).catch(() => null);
  if (!bytes) return NextResponse.json({ error: "File missing" }, { status: 410 });

  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": item.mimeType ?? "application/octet-stream",
      "content-disposition": `inline; filename="${encodeURIComponent(item.fileName ?? "gallery-item")}"`,
      "cache-control": "private, max-age=3600",
    },
  });
}
