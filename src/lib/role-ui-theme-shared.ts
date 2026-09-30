export type PortalRole = "TALENT" | "PARTNER" | "ADMIN";

// Multi-agency neutral shell is the default. Toggle preserved for Settings → Appearance cookie.
export const ENABLE_ROLE_GLASS_UI = false;

export function supportsGlassTheme(role: PortalRole) {
  return role === "TALENT" || role === "PARTNER";
}

export function getRoleGlassThemeCookieName(role: PortalRole) {
  return `portal_glass_theme_${role.toLowerCase()}`;
}

export function defaultGlassThemeEnabled(role: PortalRole) {
  return ENABLE_ROLE_GLASS_UI && supportsGlassTheme(role);
}

export function roleShellClass(glassThemeEnabled: boolean) {
  return glassThemeEnabled ? "role-glass-ui" : "min-h-screen bg-bg";
}

export function roleBackLinkClass(glassThemeEnabled: boolean) {
  return glassThemeEnabled
    ? "role-glass-backlink text-white/80 hover:text-white"
    : "text-graphite hover:text-ink";
}
