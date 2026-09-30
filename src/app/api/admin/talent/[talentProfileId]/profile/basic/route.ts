import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const BasicSchema = z.object({
  displayName: z.string().min(1).max(80).nullable().optional(),
  alias: z.string().min(1).max(80).nullable().optional(),
  dateOfBirth: z.string().datetime().nullable().optional(),
  locationCity: z.string().min(1).max(60).nullable().optional(),
  locationCountry: z.string().min(1).max(60).nullable().optional(),
  phoneNumber: z.string().min(1).max(30).nullable().optional(),
  employmentStatus: z.string().min(1).max(60).nullable().optional(),
  educationLevel: z.string().min(1).max(60).nullable().optional(),
  collegeCourse: z.string().min(1).max(80).nullable().optional(),
  nationality: z.string().min(1).max(60).nullable().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ talentProfileId: string }> },
) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { talentProfileId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = BasicSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data = parsed.data;
  const updated = await prisma.talentProfile.update({
    where: { id: talentProfileId },
    data: {
      displayName: data.displayName ?? undefined,
      alias: data.alias ?? undefined,
      dateOfBirth: data.dateOfBirth === undefined ? undefined : data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      locationCity: data.locationCity ?? undefined,
      locationCountry: data.locationCountry ?? undefined,
      phoneNumber: data.phoneNumber ?? undefined,
      employmentStatus: data.employmentStatus ?? undefined,
      educationLevel: data.educationLevel ?? undefined,
      collegeCourse: data.collegeCourse ?? undefined,
      nationality: data.nationality ?? undefined,
    },
    select: { id: true, updatedAt: true },
  });

  await prisma.profileUpdateLog.create({
    data: {
      talentProfileId: updated.id,
      actorId: auth.session.user.id,
      section: "BASIC",
      changes: data,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, updatedAt: updated.updatedAt.toISOString() });
}

