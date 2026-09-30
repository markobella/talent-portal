import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireApiRole(["ADMIN", "PARTNER", "TALENT"]);
  if (!auth.ok) return auth.response;

  const userId = auth.session.user.id;
  const count = await prisma.notification.count({ where: { userId, readAt: null } });
  return NextResponse.json({ ok: true, count });
}

