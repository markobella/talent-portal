import { notFound } from "next/navigation";
import { getRoleGlassThemeEnabled } from "@/lib/role-ui-theme";
import { requireRole, resolveAppWorkspace } from "@/lib/session";
import { PartnerTalentProfilePageContent, resolvePartnerTalentProfile } from "@/app/partner/talent/profile-page-content";

export default async function PublicUsernameProfilePage(props: { params: Promise<{ username: string }> }) {
  const session = await requireRole(["PARTNER"]);
  const [glassThemeEnabled, workspace] = await Promise.all([
    getRoleGlassThemeEnabled("PARTNER"),
    resolveAppWorkspace(session),
  ]);
  const { username } = await props.params;
  const match = await resolvePartnerTalentProfile(username);

  if (!match) return notFound();

  return (
    <PartnerTalentProfilePageContent
      glassThemeEnabled={glassThemeEnabled}
      match={match}
      workspace={workspace}
    />
  );
}
