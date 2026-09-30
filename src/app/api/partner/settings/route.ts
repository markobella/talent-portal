import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { adminAuditLog } from "@/lib/admin-audit";

const ShowcaseThemeKey = z.enum(["classic", "noir", "stone", "deepink", "clay", "burgundy"]);

const PartnerSettingsSchema = z.union([
  z.object({
    showcaseTheme: ShowcaseThemeKey,
  }),
  z.object({
    displayName: z
      .string()
      .trim()
      .min(1, "Display name is required.")
      .max(80, "Display name must be 80 characters or fewer."),
  }),
]);

export async function POST(req: Request) {
  const auth = await requireApiRole(["PARTNER"]);
  if (!auth.ok) return auth.response;

  try {
    const json = await req.json().catch(() => null);
    const parsed = PartnerSettingsSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const partnerId = auth.session.user.id;
    const data: { showcaseTheme?: string; displayName?: string } = {};
    if ("showcaseTheme" in parsed.data) {
      data.showcaseTheme = parsed.data.showcaseTheme;
    }
    if ("displayName" in parsed.data) {
      data.displayName = parsed.data.displayName;
    }

    const updated = await prisma.user.update({
      where: { id: partnerId },
      data,
      select: {
        id: true,
        showcaseTheme: true,
        displayName: true,
        updatedAt: true,
      },
    });

    await adminAuditLog({
      actorId: partnerId,
      action: "showcaseTheme" in parsed.data ? "PARTNER_SHOWCASE_THEME_UPDATE" : "PARTNER_DISPLAY_NAME_UPDATE",
      entityType: "PARTNER",
      entityId: updated.id,
      details: { showcaseTheme: updated.showcaseTheme ?? null, displayName: updated.displayName ?? null },
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      showcaseTheme: updated.showcaseTheme,
      displayName: updated.displayName,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("Unknown field `displayName`")) {
      return NextResponse.json({ error: "Please run database migrations before updating display name." }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to update management settings" }, { status: 500 });
  }
}
