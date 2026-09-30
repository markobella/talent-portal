import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET(req: Request, ctx: { params: Promise<{ setcardId: string }> }) {
  const auth = await requireApiRole(["TALENT", "PARTNER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";

  const { setcardId } = await ctx.params;
  const setcard = await prisma.setcard.findUnique({
    where: { id: setcardId },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      storagePath: true,
      talentProfile: { select: { userId: true } },
    },
  });
  if (!setcard) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = auth.session.user.id === setcard.talentProfile.userId;
  if (!isOwner && auth.session.user.role !== "ADMIN" && auth.session.user.role !== "PARTNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const bytes = await readFile(setcard.storagePath).catch(() => null);
  if (!bytes) return NextResponse.json({ error: "File missing" }, { status: 410 });

  const safeFileName = encodeURIComponent(setcard.fileName);
  const disposition = download ? "attachment" : "inline";

  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": setcard.mimeType,
      "content-disposition": `${disposition}; filename="${safeFileName}"`,
    },
  });
}
