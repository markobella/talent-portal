import { cookies } from "next/headers";
import {
  defaultGlassThemeEnabled,
  getRoleGlassThemeCookieName,
  supportsGlassTheme,
  type PortalRole,
} from "@/lib/role-ui-theme-shared";

export async function getRoleGlassThemeEnabled(role: PortalRole) {
  if (!supportsGlassTheme(role)) return false;
  const store = await cookies();
  const raw = store.get(getRoleGlassThemeCookieName(role))?.value;
  if (raw === "0") return false;
  if (raw === "1") return true;
  return defaultGlassThemeEnabled(role);
}
