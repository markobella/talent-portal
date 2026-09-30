import { prisma } from "@/lib/db";
import { publicUsernameFromLoginIdentifier } from "@/lib/public-usernames";
import { getRoleGlassThemeEnabled } from "@/lib/role-ui-theme";
import { requireRole, resolveAppWorkspace } from "@/lib/session";
import { PartnerDirectoryClient } from "./partner-directory-client";

type SearchParams = { q?: string; city?: string; country?: string; minH?: string; maxH?: string };

export default async function PartnerDirectoryPage(props: { searchParams: Promise<SearchParams> }) {
  const session = await requireRole(["PARTNER"]);
  const workspace = await resolveAppWorkspace(session);
  const partnerId = session.user.id;
  const glassThemeEnabled = await getRoleGlassThemeEnabled("PARTNER");
  const sp = await props.searchParams;

  const q = (sp.q ?? "").trim();
  const city = (sp.city ?? "").trim();
  const country = (sp.country ?? "").trim();
  const minH = sp.minH ? Number(sp.minH) : null;
  const maxH = sp.maxH ? Number(sp.maxH) : null;

  const talents = await prisma.user.findMany({
    where: {
      role: "TALENT",
      talentProfile: {
        is: {
          partnerId: { equals: partnerId },
          ...(q ? { displayName: { contains: q } } : {}),
          ...(city ? { locationCity: { contains: city } } : {}),
          ...(country ? { locationCountry: { contains: country } } : {}),
          ...(minH !== null || maxH !== null
            ? {
                heightIn: {
                  ...(minH !== null ? { gte: minH } : {}),
                  ...(maxH !== null ? { lte: maxH } : {}),
                },
              }
            : {}),
        },
      },
    },
    select: {
      id: true,
      email: true,
      talentProfile: {
        select: {
          id: true,
          displayName: true,
          locationCity: true,
          locationCountry: true,
          avatarUpdatedAt: true,
          dateOfBirth: true,
          modelingTypes: true,
          talents: true,
          heightIn: true,
          updatedAt: true,
          partnerId: true,
        },
      },
    },
    orderBy: { talentProfile: { updatedAt: "desc" } },
    take: 60,
  });

  const items = talents
    .filter((t) => t.talentProfile)
    .map((t) => {
      const tp = t.talentProfile!;
      return {
        id: t.id,
        username: publicUsernameFromLoginIdentifier(t.email) ?? t.email.trim().toLowerCase(),
        talentProfileId: tp.id,
        displayName: tp.displayName,
        locationCity: tp.locationCity,
        locationCountry: tp.locationCountry,
        avatarUpdatedAt: tp.avatarUpdatedAt ? tp.avatarUpdatedAt.toISOString() : null,
        dateOfBirth: tp.dateOfBirth ? tp.dateOfBirth.toISOString() : null,
        modelingTypes: Array.isArray(tp.modelingTypes) ? (tp.modelingTypes as string[]) : [],
        talents: Array.isArray(tp.talents) ? (tp.talents as string[]) : [],
        heightIn: tp.heightIn,
        updatedAt: tp.updatedAt.toISOString(),
      };
    });

  return <PartnerDirectoryClient initialItems={items} initialFilters={{ q, city, country, minH, maxH }} glassThemeEnabled={glassThemeEnabled} workspace={workspace ?? { agencyName: "", agencySub: "" }} />;
}
