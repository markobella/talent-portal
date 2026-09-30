import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const DEFAULT_PASSWORD = "Leigacy123!";

const CreateAccountSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dot, underscore, or hyphen."),
  role: z.enum(["TALENT", "PARTNER"]),
});

export async function POST(req: Request) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = CreateAccountSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const username = parsed.data.username.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email: username,
        passwordHash,
        role: parsed.data.role,
        name: parsed.data.username,
        talentProfile:
          parsed.data.role === "TALENT"
            ? {
                create: {
                  displayName: parsed.data.username,
                  socialLinks: {
                    create: [
                      { platform: "Instagram" },
                      { platform: "Tiktok" },
                      { platform: "YouTube" },
                      { platform: "Facebook" },
                      { platform: "X" },
                    ],
                  },
                  measurements: { create: {} },
                },
              }
            : undefined,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, userId: user.id, username, defaultPassword: DEFAULT_PASSWORD });
  } catch {
    return NextResponse.json({ error: "Username already in use" }, { status: 409 });
  }
}
