import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { publicUsernameFromLoginIdentifier } from "@/lib/public-usernames";
import { requireApiRole } from "@/lib/api-auth";

const DEFAULT_PASSWORD = "Leigacy123!";

const UsernameSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dot, underscore, or hyphen.");

const UpdateUsernameSchema = z.object({
  id: z.string().min(1).max(200),
  username: UsernameSchema,
});

const IdSchema = z.object({
  id: z.string().min(1).max(200),
});

async function readId(req: Request) {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("id");
  if (fromQuery) return fromQuery;
  const json = await req.json().catch(() => null);
  const parsed = IdSchema.safeParse(json);
  return parsed.success ? parsed.data.id : null;
}

export async function GET() {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const users = await prisma.user.findMany({
    where: { role: { in: ["TALENT", "PARTNER"] } },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      username: publicUsernameFromLoginIdentifier(u.email) ?? u.email,
      role: u.role,
      name: u.name,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    })),
  });
}

export async function PATCH(req: Request) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = UpdateUsernameSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, role: true },
  });
  if (!target || target.role === "ADMIN") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const username = parsed.data.username.toLowerCase().trim();
  try {
    await prisma.user.update({
      where: { id: parsed.data.id },
      data: { email: username, name: parsed.data.username },
      select: { id: true },
    });
  } catch {
    return NextResponse.json({ error: "Username already in use" }, { status: 409 });
  }

  return NextResponse.json({ ok: true, username });
}

export async function POST(req: Request) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const id = await readId(req);
  if (!id) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!target || target.role === "ADMIN") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  await prisma.user.update({
    where: { id },
    data: { passwordHash },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, defaultPassword: DEFAULT_PASSWORD });
}

export async function DELETE(req: Request) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const id = await readId(req);
  if (!id) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (id === auth.session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!target || target.role === "ADMIN") return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return NextResponse.json({ error: msg || "Failed to delete account." }, { status: 500 });
  }
}
