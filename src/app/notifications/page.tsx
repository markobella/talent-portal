import { AppNav } from "@/components/AppNav";
import { roleShellClass } from "@/lib/role-ui-theme-shared";
import { getRoleGlassThemeEnabled } from "@/lib/role-ui-theme";
import { requireSession, resolveAppWorkspace } from "@/lib/session";
import { NotificationsClient } from "./notifications-client";

function roleLabel(role: string) {
  if (role === "TALENT") return "Talent";
  if (role === "PARTNER") return "Management";
  if (role === "ADMIN") return "Admin";
  return role;
}

export default async function NotificationsPage() {
  const session = await requireSession();
  const [glassThemeEnabled, workspace] = await Promise.all([
    getRoleGlassThemeEnabled(session.user.role),
    resolveAppWorkspace(session),
  ]);
  const useSoftGlassSections = glassThemeEnabled && session.user.role !== "ADMIN";

  return (
    <div className={[roleShellClass(glassThemeEnabled), useSoftGlassSections ? "glass-soft-sections" : ""].join(" ")}>
      <AppNav
        role={session.user.role}
        workspace={workspace}
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6 lg:p-8">
          <div className="text-sm font-medium text-stone">{roleLabel(session.user.role)}</div>
          <h1 className="mt-0 font-sans text-2xl font-semibold tracking-tight sm:text-3xl text-[var(--color-ink)]" style={{ fontFamily: "var(--font-manrope), var(--font-sans)" }}>Notifications</h1>
          <p className="mt-1 text-sm text-stone">Updates about projects and messages.</p>
        </div>

        <div className="mt-6">
          <NotificationsClient role={session.user.role} glassThemeEnabled={glassThemeEnabled} />
        </div>
      </div>
    </div>
  );
}
