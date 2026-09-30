const USERNAME_PATTERN = /^[a-z0-9._-]+$/;

export const LEGACY_PORTAL_EMAIL_DOMAIN = "@portal.local";

function normalizeIdentifier(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidPublicUsername(value: string | null | undefined) {
  const normalized = normalizeIdentifier(value);
  return normalized.length >= 3 && normalized.length <= 40 && USERNAME_PATTERN.test(normalized);
}

export function publicUsernameFromLoginIdentifier(value: string | null | undefined) {
  const normalized = normalizeIdentifier(value);
  if (!normalized) return null;
  if (isValidPublicUsername(normalized)) return normalized;

  const atIndex = normalized.indexOf("@");
  if (atIndex <= 0) return null;

  const localPart = normalized.slice(0, atIndex);
  return isValidPublicUsername(localPart) ? localPart : null;
}

export function legacyEmailFromPublicUsername(value: string | null | undefined) {
  const username = publicUsernameFromLoginIdentifier(value);
  return username ? `${username}${LEGACY_PORTAL_EMAIL_DOMAIN}` : null;
}

export function usernameLookupCandidates(value: string | null | undefined) {
  const normalized = normalizeIdentifier(value);
  if (!normalized) return [];

  const candidates = new Set<string>();
  if (normalized.includes("@")) candidates.add(normalized);

  const publicUsername = publicUsernameFromLoginIdentifier(normalized);
  if (publicUsername) {
    candidates.add(publicUsername);
    candidates.add(`${publicUsername}${LEGACY_PORTAL_EMAIL_DOMAIN}`);
  }

  if (!candidates.size) candidates.add(normalized);
  return [...candidates];
}
