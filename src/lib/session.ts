import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type PortalRole = "TALENT" | "PARTNER" | "ADMIN";

export type AppWorkspace = {
  agencyName: string;
  agencySub: string;
  partnerId: string | null;
  partnerLogoUpdatedAt: string | null;
};

export function partnerDisplayName(u: {
  name?: string | null;
  displayName?: string | null;
  email?: string | null;
}): string {
  if (u.displayName && String(u.displayName).trim().length > 0) {
    return String(u.displayName).trim();
  }
  if (u.name && String(u.name).trim().length > 0) {
    return String(u.name).trim();
  }
  if (u.email && String(u.email).trim().length > 0) {
    return String(u.email).trim();
  }
  return "Management";
}

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(roles: Array<PortalRole>) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) redirect("/dashboard");
  return session;
}

export async function resolveAppWorkspace(session: {
  user: { id: string; role: PortalRole; name?: string | null };
}): Promise<AppWorkspace> {
  if (session.user.role === "ADMIN") {
    return {
      agencyName: "Platform Admin",
      agencySub: "Administration",
      partnerId: null,
      partnerLogoUpdatedAt: null,
    };
  }

  if (session.user.role === "PARTNER") {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, displayName: true, logoUpdatedAt: true },
    });
    const name = partnerDisplayName({
      name: u?.name,
      displayName: u?.displayName,
      email: session.user.name,
    }) || "Management Workspace";
    return {
      agencyName: name,
      agencySub: "Management workspace",
      partnerId: session.user.id,
      partnerLogoUpdatedAt: u?.logoUpdatedAt?.toISOString() ?? null,
    };
  }

  const talent = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      talentProfile: {
        select: {
          partner: { select: { id: true, name: true, displayName: true, logoUpdatedAt: true } },
        },
      },
    },
  });
  const partner = talent?.talentProfile?.partner ?? null;
  const partnerName = partner
    ? partnerDisplayName({ name: partner.name, displayName: partner.displayName }) || null
    : null;
  return {
    agencyName: partnerName || "Independent Talent",
    agencySub: "Talent workspace",
    partnerId: partner?.id ?? null,
    partnerLogoUpdatedAt: partner?.logoUpdatedAt?.toISOString() ?? null,
  };
}
