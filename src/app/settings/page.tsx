import { AppNav } from "@/components/AppNav";
import { SectionHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { publicUsernameFromLoginIdentifier } from "@/lib/public-usernames";
import { roleShellClass } from "@/lib/role-ui-theme-shared";
import { getRoleGlassThemeEnabled } from "@/lib/role-ui-theme";
import { requireSession, resolveAppWorkspace } from "@/lib/session";
import { SettingsClient } from "./settings-client";
import { ShowcaseThemeKey } from "@/lib/talent-showcase";

function roleLabel(role: string) {
  if (role === "TALENT") return "Talent";
  if (role === "PARTNER") return "Partner";
  if (role === "ADMIN") return "Admin";
  return role;
}

export default async function SettingsPage() {
  const session = await requireSession();
  const [glassThemeEnabled, workspace] = await Promise.all([
    getRoleGlassThemeEnabled(session.user.role),
    resolveAppWorkspace(session),
  ]);
  const useSoftGlassCards = glassThemeEnabled && session.user.role !== "ADMIN";

  let user:
    | {
        email: string | null;
        name: string | null;
        displayName: string | null;
        showcaseTheme: string | null;
        logoUpdatedAt: Date | null;
        talentProfile: {
          showcaseShowContactInfo?: boolean;
          showcaseShowBasicInfo?: boolean;
          showcaseUseGlassTheme?: boolean;
        } | null;
      }
    | null;

  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        name: true,
        displayName: true,
        showcaseTheme: true,
        logoUpdatedAt: true,
        talentProfile: {
          select: {
            showcaseShowContactInfo: true,
            showcaseShowBasicInfo: true,
            showcaseUseGlassTheme: true,
          },
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const missingPrivacy =
      message.includes("Unknown field `showcaseShowContactInfo`") ||
      message.includes("Unknown field `showcaseShowBasicInfo`") ||
      message.includes("Unknown field `showcaseUseGlassTheme`") ||
      message.includes("Unknown field `displayName`");
    if (!missingPrivacy) throw error;

    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        name: true,
        displayName: true,
        showcaseTheme: true,
        logoUpdatedAt: true,
        talentProfile: { select: { id: true } },
      },
    });
  }

  const showcaseThemeRaw = user?.showcaseTheme ?? null;
  const allowedThemes: ShowcaseThemeKey[] = ["classic", "noir", "stone", "deepink", "clay", "burgundy"];
  const initialShowcaseTheme: ShowcaseThemeKey | null =
    typeof showcaseThemeRaw === "string" && allowedThemes.includes(showcaseThemeRaw as ShowcaseThemeKey)
      ? (showcaseThemeRaw as ShowcaseThemeKey)
      : null;

  return (
    <div
      className={[roleShellClass(glassThemeEnabled), useSoftGlassCards ? "glass-soft-sections" : ""].join(" ")}
    >
      <AppNav
        role={session.user.role}
        workspace={workspace}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <SectionHeader
          eyebrow={roleLabel(session.user.role)}
          title="Account Settings"
          description="Manage your profile credentials, appearance, and digital showcase preferences."
        />
        <div className="mt-8">
          <SettingsClient
            initialUsername={publicUsernameFromLoginIdentifier(user?.email) ?? user?.email ?? ""}
            role={session.user.role}
            partnerUserId={session.user.role === "PARTNER" ? session.user.id : null}
            initialPartnerDisplayName={session.user.role === "PARTNER" ? (user?.displayName ?? user?.name ?? "") : null}
            initialPartnerLogoUpdatedAt={session.user.role === "PARTNER" ? (user?.logoUpdatedAt?.toISOString() ?? null) : null}
            initialShowcaseShowContactInfo={user?.talentProfile?.showcaseShowContactInfo ?? false}
            initialShowcaseShowBasicInfo={user?.talentProfile?.showcaseShowBasicInfo ?? false}
            initialShowcaseUseGlassTheme={user?.talentProfile?.showcaseUseGlassTheme ?? false}
            initialShowcaseTheme={initialShowcaseTheme}
          />
        </div>
      </div>
    </div>
  );
}
