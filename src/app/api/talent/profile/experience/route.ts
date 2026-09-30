import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const KindSchema = z.enum(["PROJECT", "CERTIFICATION", "TITLE"]);

const AddSchema = z.object({
  kind: KindSchema,
  title: z.string().min(1).max(120),
  role: z.string().min(1).max(80).nullable().optional(),
  when: z.string().min(1).max(40).nullable().optional(),
});

const DeleteSchema = z.object({
  id: z.string().min(1).max(200),
});

const UpdateSchema = z.object({
  id: z.string().min(1).max(200),
  kind: KindSchema,
  title: z.string().min(1).max(120),
  role: z.string().min(1).max(80).nullable().optional(),
  when: z.string().min(1).max(40).nullable().optional(),
});

function normalizeItems(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const obj = x as Record<string, unknown>;
      const id = typeof obj.id === "string" ? obj.id : null;
      const kind =
        obj.kind === "PROJECT" || obj.kind === "CERTIFICATION" || obj.kind === "TITLE"
          ? (obj.kind as "PROJECT" | "CERTIFICATION" | "TITLE")
          : null;
      const title = typeof obj.title === "string" ? obj.title : null;
      const role = typeof obj.role === "string" ? obj.role : null;
      const when = typeof obj.when === "string" ? obj.when : null;
      const createdAt = typeof obj.createdAt === "string" ? obj.createdAt : null;
      if (!id || !kind || !title || !createdAt) return null;
      return { id, kind, title, role, when, createdAt };
    })
    .filter(
      (x): x is {
        id: string;
        kind: "PROJECT" | "CERTIFICATION" | "TITLE";
        title: string;
        role: string | null;
        when: string | null;
        createdAt: string;
      } => Boolean(x),
    );
}

export async function POST(req: Request) {
  const auth = await requireApiRole(["TALENT"]);
  if (!auth.ok) return auth.response;

  try {
    const json = await req.json().catch(() => null);
    const parsed = AddSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const userId = auth.session.user.id;
    const profile = await prisma.talentProfile.findUnique({
      where: { userId },
      select: { id: true, experienceItems: true },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const existing = normalizeItems(profile.experienceItems);
    if (existing.length >= 30) return NextResponse.json({ error: "Limit reached (max 30 items)." }, { status: 400 });

    const nowIso = new Date().toISOString();
    const item = {
      id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      kind: parsed.data.kind,
      title: parsed.data.title.trim(),
      role: parsed.data.role ? parsed.data.role.trim() : null,
      when: parsed.data.when ? parsed.data.when.trim() : null,
      createdAt: nowIso,
    };

    const next = [item, ...existing];
    await prisma.talentProfile.update({
      where: { id: profile.id },
      data: { experienceItems: next },
      select: { id: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unknown field `experienceItems`")) {
      return NextResponse.json({ error: "Server needs restart (Prisma client out of date)." }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to add item." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireApiRole(["TALENT"]);
  if (!auth.ok) return auth.response;

  try {
    const json = await req.json().catch(() => null);
    const parsed = DeleteSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const userId = auth.session.user.id;
    const profile = await prisma.talentProfile.findUnique({
      where: { userId },
      select: { id: true, experienceItems: true },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const existing = normalizeItems(profile.experienceItems);
    const next = existing.filter((x) => x.id !== parsed.data.id);

    await prisma.talentProfile.update({
      where: { id: profile.id },
      data: { experienceItems: next },
      select: { id: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unknown field `experienceItems`")) {
      return NextResponse.json({ error: "Server needs restart (Prisma client out of date)." }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to remove item." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireApiRole(["TALENT"]);
  if (!auth.ok) return auth.response;

  try {
    const json = await req.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const userId = auth.session.user.id;
    const profile = await prisma.talentProfile.findUnique({
      where: { userId },
      select: { id: true, experienceItems: true },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const existing = normalizeItems(profile.experienceItems);
    const idx = existing.findIndex((x) => x.id === parsed.data.id);
    if (idx < 0) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const prev = existing[idx];
    const next = existing.slice();
    next[idx] = {
      ...prev,
      kind: parsed.data.kind,
      title: parsed.data.title.trim(),
      role: parsed.data.role ? parsed.data.role.trim() : null,
      when: parsed.data.when ? parsed.data.when.trim() : null,
    };

    await prisma.talentProfile.update({
      where: { id: profile.id },
      data: { experienceItems: next },
      select: { id: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unknown field `experienceItems`")) {
      return NextResponse.json({ error: "Server needs restart (Prisma client out of date)." }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to update item." }, { status: 500 });
  }
}
