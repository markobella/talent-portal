import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const VitalsSchema = z.object({
  experienceYears: z.number().int().min(0).max(80).nullable().optional(),
  modelingTypes: z.array(z.string().min(1).max(40)).max(30).nullable().optional(),
  talents: z.array(z.string().min(1).max(40)).max(30).nullable().optional(),
  heightIn: z.number().min(30).max(100).nullable().optional(),
  weightLbs: z.number().min(40).max(600).nullable().optional(),
  skinTone: z.string().min(1).max(40).nullable().optional(),
  eyeColor: z.string().min(1).max(40).nullable().optional(),
  shirtSize: z.string().min(1).max(10).nullable().optional(),
  pantsSize: z.string().min(1).max(10).nullable().optional(),
  dressSize: z.string().min(1).max(10).nullable().optional(),
  shoeSize: z.number().min(1).max(30).nullable().optional(),
  tattoos: z.boolean().nullable().optional(),
  tattooLocations: z.string().min(1).max(120).nullable().optional(),
  piercings: z.boolean().nullable().optional(),
  piercingLocations: z.string().min(1).max(120).nullable().optional(),
  birthmarks: z.boolean().nullable().optional(),
  birthmarkLocations: z.string().min(1).max(120).nullable().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ talentProfileId: string }> },
) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { talentProfileId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = VitalsSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data = parsed.data;
  const updated = await prisma.talentProfile.update({
    where: { id: talentProfileId },
    data: {
      experienceYears: data.experienceYears ?? undefined,
      modelingTypes:
        data.modelingTypes === undefined
          ? undefined
          : data.modelingTypes === null
            ? Prisma.DbNull
            : data.modelingTypes,
      talents: data.talents === undefined ? undefined : data.talents === null ? Prisma.DbNull : data.talents,
      heightIn: data.heightIn ?? undefined,
      weightLbs: data.weightLbs ?? undefined,
      skinTone: data.skinTone ?? undefined,
      eyeColor: data.eyeColor ?? undefined,
      shirtSize: data.shirtSize ?? undefined,
      pantsSize: data.pantsSize ?? undefined,
      dressSize: data.dressSize ?? undefined,
      shoeSize: data.shoeSize ?? undefined,
      tattoos: data.tattoos ?? undefined,
      tattooLocations: data.tattooLocations ?? undefined,
      piercings: data.piercings ?? undefined,
      piercingLocations: data.piercingLocations ?? undefined,
      birthmarks: data.birthmarks ?? undefined,
      birthmarkLocations: data.birthmarkLocations ?? undefined,
    },
    select: { id: true, updatedAt: true },
  });

  await prisma.profileUpdateLog.create({
    data: {
      talentProfileId: updated.id,
      actorId: auth.session.user.id,
      section: "VITALS",
      changes: data,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, updatedAt: updated.updatedAt.toISOString() });
}

