import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const SocialSchema = z.object({
  links: z
    .array(
      z.object({
        platform: z.string().min(1).max(30),
        handle: z.string().min(1).max(60).nullable().optional(),
        url: z.string().url().nullable().optional(),
        followers: z.number().int().min(0).max(10_000_000).nullable().optional(),
      }),
    )
    .max(12),
});

export async function POST(req: Request) {
  const auth = await requireApiRole(["TALENT"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = SocialSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const userId = auth.session.user.id;
  const profile = await prisma.talentProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  await prisma.socialLink.deleteMany({ where: { talentProfileId: profile.id } });
  if (parsed.data.links.length) {
    await prisma.socialLink.createMany({
      data: parsed.data.links.map((l) => ({
        talentProfileId: profile.id,
        platform: l.platform,
        handle: l.handle ?? null,
        url: l.url ?? null,
        followers: l.followers ?? null,
      })),
    });
  }

  await prisma.profileUpdateLog.create({
    data: {
      talentProfileId: profile.id,
      actorId: userId,
      section: "SOCIAL",
      changes: parsed.data,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}

