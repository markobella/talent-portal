import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const Schema = z.object({ offerId: z.string().min(1) });

export async function POST(req: Request) {
  const auth = await requireApiRole(["ADMIN", "PARTNER", "TALENT"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const userId = auth.session.user.id;
  const offerId = parsed.data.offerId;

  const unread = await prisma.notification.findMany({
    where: { userId, readAt: null },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, data: true },
  });

  const ids = unread
    .filter((n) => (n.data as any)?.offerId === offerId)
    .map((n) => n.id);

  if (!ids.length) return NextResponse.json({ ok: true, marked: 0 });

  await prisma.notification.updateMany({
    where: { userId, id: { in: ids } },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true, marked: ids.length });
}

