import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ setcardId: string }> }) {
  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";

  const { setcardId } = await ctx.params;
  const setcard = await prisma.setcard.findUnique({
    where: { id: setcardId },
    select: {
      fileName: true,
      mimeType: true,
      storagePath: true,
    },
  });

  if (!setcard?.storagePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await readFile(setcard.storagePath).catch(() => null);
  if (!bytes) return NextResponse.json({ error: "File missing" }, { status: 410 });

  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": setcard.mimeType,
      "content-disposition": `${download ? "attachment" : "inline"}; filename="${encodeURIComponent(setcard.fileName)}"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
