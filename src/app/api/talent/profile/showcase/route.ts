import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const ShowcasePrivacySchema = z.object({
  showcaseShowContactInfo: z.boolean().optional(),
  showcaseShowBasicInfo: z.boolean().optional(),
  showcaseUseGlassTheme: z.boolean().optional(),
});

function isMissingShowcaseFieldError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return (
    message.includes("showcaseShowContactInfo") ||
    message.includes("showcaseShowBasicInfo") ||
    message.includes("showcaseUseGlassTheme")
  );
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return false;
}

export async function POST(req: Request) {
  const auth = await requireApiRole(["TALENT"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = ShowcasePrivacySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const userId = auth.session.user.id;
  const profile = await prisma.talentProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const data = parsed.data;
  let updated: {
    id: string;
    updatedAt: Date;
    showcaseShowContactInfo: boolean;
    showcaseShowBasicInfo: boolean;
    showcaseUseGlassTheme: boolean;
  };

  try {
    updated = await prisma.talentProfile.update({
      where: { id: profile.id },
      data: {
        showcaseShowContactInfo: data.showcaseShowContactInfo ?? undefined,
        showcaseShowBasicInfo: data.showcaseShowBasicInfo ?? undefined,
        showcaseUseGlassTheme: data.showcaseUseGlassTheme ?? undefined,
      },
      select: {
        id: true,
        updatedAt: true,
        showcaseShowContactInfo: true,
        showcaseShowBasicInfo: true,
        showcaseUseGlassTheme: true,
      },
    });
  } catch (error) {
    if (!isMissingShowcaseFieldError(error)) throw error;

    const assignments: Prisma.Sql[] = [];
    if (data.showcaseShowContactInfo !== undefined) {
      assignments.push(Prisma.sql`"showcaseShowContactInfo" = ${data.showcaseShowContactInfo}`);
    }
    if (data.showcaseShowBasicInfo !== undefined) {
      assignments.push(Prisma.sql`"showcaseShowBasicInfo" = ${data.showcaseShowBasicInfo}`);
    }
    if (data.showcaseUseGlassTheme !== undefined) {
      assignments.push(Prisma.sql`"showcaseUseGlassTheme" = ${data.showcaseUseGlassTheme}`);
    }
    assignments.push(Prisma.sql`"updatedAt" = CURRENT_TIMESTAMP`);

    await prisma.$executeRaw(
      Prisma.sql`UPDATE "TalentProfile" SET ${Prisma.join(assignments, Prisma.sql`, `)} WHERE "id" = ${profile.id}`,
    );

    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        updatedAt: Date | string;
        showcaseShowContactInfo: boolean | number | null;
        showcaseShowBasicInfo: boolean | number | null;
        showcaseUseGlassTheme: boolean | number | null;
      }>
    >(
      Prisma.sql`SELECT "id", "updatedAt", "showcaseShowContactInfo", "showcaseShowBasicInfo", "showcaseUseGlassTheme" FROM "TalentProfile" WHERE "id" = ${profile.id} LIMIT 1`,
    );

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    updated = {
      id: row.id,
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
      showcaseShowContactInfo: asBoolean(row.showcaseShowContactInfo),
      showcaseShowBasicInfo: asBoolean(row.showcaseShowBasicInfo),
      showcaseUseGlassTheme: asBoolean(row.showcaseUseGlassTheme),
    };
  }

  await prisma.profileUpdateLog.create({
    data: {
      talentProfileId: updated.id,
      actorId: userId,
      section: "BASIC",
      changes: {
        showcaseShowContactInfo: updated.showcaseShowContactInfo,
        showcaseShowBasicInfo: updated.showcaseShowBasicInfo,
        showcaseUseGlassTheme: updated.showcaseUseGlassTheme,
      },
    },
    select: { id: true },
  });

  return NextResponse.json({
    ok: true,
    updatedAt: updated.updatedAt.toISOString(),
    showcaseShowContactInfo: updated.showcaseShowContactInfo,
    showcaseShowBasicInfo: updated.showcaseShowBasicInfo,
    showcaseUseGlassTheme: updated.showcaseUseGlassTheme,
  });
}
