import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const UsernameSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dot, underscore, or hyphen.");

const Schema = z.object({
  username: UsernameSchema,
  currentPassword: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const auth = await requireApiRole(["ADMIN", "PARTNER", "TALENT"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const userId = auth.session.user.id;
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, passwordHash: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await bcrypt.compare(parsed.data.currentPassword, target.passwordHash);
  if (!ok) return NextResponse.json({ error: "Incorrect password" }, { status: 400 });

  const username = parsed.data.username.toLowerCase().trim();
  if (username === target.email) return NextResponse.json({ ok: true, username });

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { email: username },
      select: { id: true },
    });
  } catch {
    return NextResponse.json({ error: "Username already in use" }, { status: 409 });
  }

  return NextResponse.json({ ok: true, username });
}

