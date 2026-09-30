import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ talentProfileId: string }> }) {
  const auth = await requireApiRole(["TALENT", "PARTNER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const { talentProfileId } = await ctx.params;
  const url = new URL(req.url);
  const wantsPending = url.searchParams.get("variant") === "pending";
  const profile = await prisma.talentProfile.findUnique({
    where: { id: talentProfileId },
    select: {
      userId: true,
      avatarFileName: true,
      avatarMimeType: true,
      avatarStoragePath: true,
      pendingAvatarFileName: true,
      pendingAvatarMimeType: true,
      pendingAvatarStoragePath: true,
    },
  });

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (wantsPending) {
    const canSeePending = auth.session.user.role === "ADMIN" || (auth.session.user.role === "TALENT" && auth.session.user.id === profile.userId);
    if (!canSeePending) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!profile.pendingAvatarStoragePath) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const pendingBytes = await readFile(profile.pendingAvatarStoragePath).catch(() => null);
    if (!pendingBytes) return NextResponse.json({ error: "File missing" }, { status: 410 });

    return new Response(pendingBytes, {
      status: 200,
      headers: {
        "content-type": profile.pendingAvatarMimeType ?? "image/jpeg",
        "content-disposition": `inline; filename="${encodeURIComponent(profile.pendingAvatarFileName ?? "avatar.jpg")}"`,
        "cache-control": "private, max-age=3600",
      },
    });
  }

  if (!profile.avatarStoragePath) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = await readFile(profile.avatarStoragePath).catch(() => null);
  if (!bytes) return NextResponse.json({ error: "File missing" }, { status: 410 });

  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": profile.avatarMimeType ?? "image/jpeg",
      "content-disposition": `inline; filename="${encodeURIComponent(profile.avatarFileName ?? "avatar.jpg")}"`,
      "cache-control": "private, max-age=3600",
    },
  });
}
