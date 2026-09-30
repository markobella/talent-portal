import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const MarkReadSchema = z.object({
  ids: z.array(z.string().min(1)).max(200).optional(),
  all: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireApiRole(["ADMIN", "PARTNER", "TALENT"]);
  if (!auth.ok) return auth.response;

  const userId = auth.session.user.id;
  const items = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, type: true, title: true, body: true, data: true, createdAt: true, readAt: true },
  });

  return NextResponse.json({
    ok: true,
    notifications: items.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt ? n.readAt.toISOString() : null,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireApiRole(["ADMIN", "PARTNER", "TALENT"]);
  if (!auth.ok) return auth.response;

  const userId = auth.session.user.id;
  const json = await req.json().catch(() => null);
  const parsed = MarkReadSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const now = new Date();
  if (parsed.data.all) {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: now },
    });
    return NextResponse.json({ ok: true });
  }

  const ids = (parsed.data.ids ?? []).filter(Boolean);
  if (!ids.length) return NextResponse.json({ ok: true });

  await prisma.notification.updateMany({
    where: { userId, id: { in: ids } },
    data: { readAt: now },
  });
  return NextResponse.json({ ok: true });
}

