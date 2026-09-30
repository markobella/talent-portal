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
  aboutMe: z.string().max(4000).nullable().optional(),
});

export async function POST(req: Request) {
  const auth = await requireApiRole(["TALENT"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = BasicSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const userId = auth.session.user.id;
  const profile = await prisma.talentProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const data = parsed.data;
  const updated = await prisma.talentProfile.update({
    where: { id: profile.id },
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
      aboutMe: data.aboutMe === undefined ? undefined : data.aboutMe ? data.aboutMe : null,
    },
    select: { id: true, updatedAt: true },
  });

  await prisma.profileUpdateLog.create({
    data: {
      talentProfileId: updated.id,
      actorId: userId,
      section: "BASIC",
      changes: data,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, updatedAt: updated.updatedAt.toISOString() });
}

