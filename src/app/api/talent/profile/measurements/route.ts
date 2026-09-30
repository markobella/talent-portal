import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const MeasurementsSchema = z.object({
  unit: z.enum(["in", "cm"]).optional(),
  bust: z.number().min(10).max(200).nullable().optional(),
  underBust: z.number().min(10).max(200).nullable().optional(),
  naturalWaist: z.number().min(10).max(200).nullable().optional(),
  hips: z.number().min(10).max(250).nullable().optional(),
  waistToFloor: z.number().min(10).max(300).nullable().optional(),
  hollowToHem: z.number().min(10).max(300).nullable().optional(),
  shoulderWidth: z.number().min(1).max(100).nullable().optional(),
  backLength: z.number().min(1).max(200).nullable().optional(),
});

export async function POST(req: Request) {
  const auth = await requireApiRole(["TALENT"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = MeasurementsSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const userId = auth.session.user.id;
  const profile = await prisma.talentProfile.findUnique({
    where: { userId },
    select: { id: true, measurements: { select: { id: true } } },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const data = parsed.data;

  const measurements = profile.measurements?.id
    ? await prisma.talentMeasurements.update({
        where: { id: profile.measurements.id },
        data: {
          unit: data.unit ?? undefined,
          bust: data.bust ?? undefined,
          underBust: data.underBust ?? undefined,
          naturalWaist: data.naturalWaist ?? undefined,
          hips: data.hips ?? undefined,
          waistToFloor: data.waistToFloor ?? undefined,
          hollowToHem: data.hollowToHem ?? undefined,
          shoulderWidth: data.shoulderWidth ?? undefined,
          backLength: data.backLength ?? undefined,
        },
        select: { id: true, updatedAt: true },
      })
    : await prisma.talentMeasurements.create({
        data: {
          talentProfileId: profile.id,
          unit: data.unit ?? "in",
          bust: data.bust ?? null,
          underBust: data.underBust ?? null,
          naturalWaist: data.naturalWaist ?? null,
          hips: data.hips ?? null,
          waistToFloor: data.waistToFloor ?? null,
          hollowToHem: data.hollowToHem ?? null,
          shoulderWidth: data.shoulderWidth ?? null,
          backLength: data.backLength ?? null,
        },
        select: { id: true, updatedAt: true },
      });

  await prisma.profileUpdateLog.create({
    data: {
      talentProfileId: profile.id,
      actorId: userId,
      section: "MEASUREMENTS",
      changes: data,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, updatedAt: measurements.updatedAt.toISOString() });
}

