"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SettingsNav, SettingsSection, Toggle, Input, Label, PasswordInput, Button, AlertBanner, Select } from "@/components/ui";
import type { PortalRole } from "@/lib/role-ui-theme-shared";
import type { ShowcaseThemeKey } from "@/lib/talent-showcase";
import { Building2 } from "lucide-react";

type Feedback = { kind: "success" | "error"; message: string };

type NavKey = "account" | "showcase" | "branding";

const SHOWCASE_THEMES: { key: ShowcaseThemeKey; label: string }[] = [
  { key: "classic", label: "Classic" },
  { key: "noir", label: "Noir Editorial" },
  { key: "stone", label: "Stone & Ink" },
  { key: "deepink", label: "Deep Ink Blue" },
  { key: "clay", label: "Clay & Terracotta" },
  { key: "burgundy", label: "Cream & Burgundy" },
];

function normalizeErrorMessage(raw: unknown) {
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.error === "string" && obj.error.trim()) return obj.error.trim();
    if (typeof obj.message === "string" && obj.message.trim()) return obj.message.trim();
  }
  return "Request failed.";
}

function validateUsername(username: string) {
  const u = username.trim().toLowerCase();
  if (u.length < 3) return { ok: false as const, error: "Username must be at least 3 characters." };
  if (u.length > 40) return { ok: false as const, error: "Username must be at most 40 characters." };
  if (!/^[a-z0-9._-]+$/.test(u)) {
    return { ok: false as const, error: "Use only letters, numbers, dot, underscore, or hyphen." };
  }
  return { ok: true as const, username: u };
}

export function SettingsClient(props: {
  initialUsername: string;
  role: PortalRole;
  partnerUserId: string | null;
  initialPartnerDisplayName: string | null;
  initialPartnerLogoUpdatedAt: string | null;
  initialShowcaseShowContactInfo: boolean;
  initialShowcaseShowBasicInfo: boolean;
  initialShowcaseUseGlassTheme: boolean;
  initialShowcaseTheme: ShowcaseThemeKey | null;
}) {
  const router = useRouter();
  const normalizedInitial = useMemo(
    () => props.initialUsername.trim().toLowerCase(),
    [props.initialUsername],
  );

  const [active, setActive] = useState<NavKey>("account");

  const [username, setUsername] = useState(normalizedInitial);
  const [usernamePassword, setUsernamePassword] = useState("");
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [usernameFeedback, setUsernameFeedback] = useState<Feedback | null>(null);

  const [partnerDisplayName, setPartnerDisplayName] = useState(
    props.initialPartnerDisplayName ?? "",
  );
  const [partnerDisplayNameBusy, setPartnerDisplayNameBusy] = useState(false);
  const [partnerDisplayNameFeedback, setPartnerDisplayNameFeedback] = useState<Feedback | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback | null>(null);
  const [showcaseShowContactInfo, setShowcaseShowContactInfo] = useState(
    props.initialShowcaseShowContactInfo,
  );
  const [showcaseShowBasicInfo, setShowcaseShowBasicInfo] = useState(props.initialShowcaseShowBasicInfo);
  const [showcaseBusy, setShowcaseBusy] = useState(false);
  const [showcasePrivacyFeedback, setShowcasePrivacyFeedback] = useState<Feedback | null>(null);

  const [partnerShowcaseTheme, setPartnerShowcaseTheme] = useState<ShowcaseThemeKey>(
    props.initialShowcaseTheme ?? "classic",
  );
  const [partnerSettingsBusy, setPartnerSettingsBusy] = useState(false);
  const [partnerSettingsFeedback, setPartnerSettingsFeedback] = useState<Feedback | null>(null);

  const [partnerLogoUpdatedAt, setPartnerLogoUpdatedAt] = useState<string | null>(
    props.initialPartnerLogoUpdatedAt,
  );
  const [partnerLogoBusy, setPartnerLogoBusy] = useState(false);
  const [partnerLogoFeedback, setPartnerLogoFeedback] = useState<Feedback | null>(null);
  const partnerLogoFileRef = useRef<HTMLInputElement | null>(null);

  const canManageShowcasePrivacy = props.role === "TALENT";
  const canManagePartnerShowcaseTheme = props.role === "PARTNER";

  const navItems: { key: NavKey; label: string; show: boolean }[] = [
    { key: "account", label: "Account", show: true },
    { key: "showcase", label: "Showcase", show: canManageShowcasePrivacy },
    { key: "branding", label: "Branding", show: canManagePartnerShowcaseTheme },
  ];
  const visibleNav = navItems.filter((n) => n.show);

  useEffect(() => {
    if (!visibleNav.find((n) => n.key === active)) {
      setActive(visibleNav[0]?.key ?? "account");
    }
  }, [active, visibleNav]);

  async function saveUsername() {
    setUsernameFeedback(null);
    const parsed = validateUsername(username);
    if (!parsed.ok) {
      setUsernameFeedback({ kind: "error", message: parsed.error });
      return;
    }
    if (!usernamePassword) {
      setUsernameFeedback({
        kind: "error",
        message: "Enter your current password to change your username.",
      });
      return;
    }
    if (parsed.username === normalizedInitial) {
      setUsernameFeedback({ kind: "success", message: "No changes to save." });
      return;
    }

    setUsernameBusy(true);
    try {
      const res = await fetch("/api/account/username", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: parsed.username, currentPassword: usernamePassword }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setUsernameFeedback({ kind: "error", message: normalizeErrorMessage(json) });
        return;
      }
      setUsernameFeedback({ kind: "success", message: "Username updated." });
      setUsernamePassword("");
    } catch {
      setUsernameFeedback({ kind: "error", message: "Failed to update username." });
    } finally {
      setUsernameBusy(false);
    }
  }

  async function savePartnerDisplayName() {
    if (props.role !== "PARTNER") return;
    setPartnerDisplayNameFeedback(null);
    const raw = partnerDisplayName.trim();
    if (!raw) {
      setPartnerDisplayNameFeedback({
        kind: "error",
        message: "Display name is required. This appears on all talent showcases you manage.",
      });
      return;
    }
    if (raw.length > 80) {
      setPartnerDisplayNameFeedback({
        kind: "error",
        message: "Display name must be 80 characters or fewer.",
      });
      return;
    }
    setPartnerDisplayNameBusy(true);
    try {
      const res = await fetch("/api/partner/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: raw }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setPartnerDisplayNameFeedback({ kind: "error", message: normalizeErrorMessage(json) });
        return;
      }
      setPartnerDisplayNameFeedback({
        kind: "success",
        message: "Display name updated. Appears on all talent showcases now.",
      });
      router.refresh();
    } catch {
      setPartnerDisplayNameFeedback({ kind: "error", message: "Failed to update display name." });
    } finally {
      setPartnerDisplayNameBusy(false);
    }
  }

  async function changePassword() {
    setPasswordFeedback(null);
    if (!currentPassword) {
      setPasswordFeedback({ kind: "error", message: "Enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordFeedback({
        kind: "error",
        message: "New password must be at least 8 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        kind: "error",
        message: "New password and confirmation do not match.",
      });
      return;
    }

    setPasswordBusy(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setPasswordFeedback({ kind: "error", message: normalizeErrorMessage(json) });
        return;
      }
      setPasswordFeedback({ kind: "success", message: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordFeedback({ kind: "error", message: "Failed to update password." });
    } finally {
      setPasswordBusy(false);
    }
  }

  async function saveShowcasePrivacy() {
    if (!canManageShowcasePrivacy) return;
    setShowcaseBusy(true);
    setShowcasePrivacyFeedback(null);
    try {
      const res = await fetch("/api/talent/profile/showcase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          showcaseShowContactInfo,
          showcaseShowBasicInfo,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setShowcasePrivacyFeedback({ kind: "error", message: normalizeErrorMessage(json) });
        return;
      }
      setShowcasePrivacyFeedback({
        kind: "success",
        message: "Digital showcase privacy updated.",
      });
      router.refresh();
    } catch {
      setShowcasePrivacyFeedback({
        kind: "error",
        message: "Failed to update digital showcase privacy.",
      });
    } finally {
      setShowcaseBusy(false);
    }
  }

  async function handlePartnerLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!canManagePartnerShowcaseTheme) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPartnerLogoFeedback({ kind: "error", message: "Only image files are supported for management logos." });
      if (partnerLogoFileRef.current) partnerLogoFileRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPartnerLogoFeedback({ kind: "error", message: "Logo is too large. Maximum file size is 5 MB." });
      if (partnerLogoFileRef.current) partnerLogoFileRef.current.value = "";
      return;
    }

    setPartnerLogoBusy(true);
    setPartnerLogoFeedback(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/partner/settings/logo", { method: "POST", body });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setPartnerLogoFeedback({ kind: "error", message: normalizeErrorMessage(json) });
        return;
      }
      setPartnerLogoUpdatedAt(json?.logoUpdatedAt ?? null);
      setPartnerLogoFeedback({
        kind: "success",
        message: "Management logo uploaded. Changes applied across workspace immediately.",
      });
      router.refresh();
    } catch {
      setPartnerLogoFeedback({ kind: "error", message: "Failed to upload management logo." });
    } finally {
      setPartnerLogoBusy(false);
      if (partnerLogoFileRef.current) partnerLogoFileRef.current.value = "";
    }
  }

  async function removePartnerLogo() {
    if (!canManagePartnerShowcaseTheme) return;
    setPartnerLogoBusy(true);
    setPartnerLogoFeedback(null);
    try {
      const body = new FormData();
      body.append("action", "remove");
      const res = await fetch("/api/partner/settings/logo", { method: "POST", body });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setPartnerLogoFeedback({ kind: "error", message: normalizeErrorMessage(json) });
        return;
      }
      setPartnerLogoUpdatedAt(null);
      setPartnerLogoFeedback({ kind: "success", message: "Management logo removed." });
      router.refresh();
    } catch {
      setPartnerLogoFeedback({ kind: "error", message: "Failed to remove management logo." });
    } finally {
      setPartnerLogoBusy(false);
    }
  }

  async function savePartnerShowcaseTheme() {
    if (!canManagePartnerShowcaseTheme) return;
    setPartnerSettingsBusy(true);
    setPartnerSettingsFeedback(null);
    try {
      const res = await fetch("/api/partner/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ showcaseTheme: partnerShowcaseTheme }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setPartnerSettingsFeedback({ kind: "error", message: normalizeErrorMessage(json) });
        return;
      }
      setPartnerSettingsFeedback({
        kind: "success",
        message: "Showcase theme updated for all talent under your management.",
      });
      router.refresh();
    } catch {
      setPartnerSettingsFeedback({
        kind: "error",
        message: "Failed to update showcase theme.",
      });
    } finally {
      setPartnerSettingsBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
      <SettingsNav
        items={visibleNav.map((n) => ({ key: n.key, label: n.label }))}
        active={active}
        onChange={(k) => setActive(k as NavKey)}
      />
      <div className="min-w-0">
        {active === "account" ? (
          <div className="space-y-0 rounded-[var(--radius-lg)]">
            <SettingsSection
              eyebrow="Credentials"
              title="Username"
              description="Your public username is used for the digital showcase links."
              footer={
                <div className="flex gap-2">
                  <Button
                  variant="secondary"
                  size="sm"
                  disabled={usernameBusy}
                  onClick={() => {
                    setUsername(normalizedInitial);
                    setUsernamePassword("");
                    setUsernameFeedback(null);
                  }}
                >
                  Reset
                </Button>
                <Button size="sm" disabled={usernameBusy} onClick={saveUsername}>
                  Save
                </Button>
              </div>
            }>
              <div className="space-y-4 w-full">
                {usernameFeedback ? (
                <AlertBanner
                  tone={usernameFeedback.kind}
                  onDismiss={() => setUsernameFeedback(null)}
                >
                  {usernameFeedback.message}
                </AlertBanner>
              ) : null}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 w-full">
                <div className="md:col-span-2 space-y-1.5 w-full">
                  <Label htmlFor="settings-username">Username</Label>
                  <Input
                    id="settings-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="e.g. mark.taguig"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-username-password">Current password</Label>
                  <PasswordInput
                    id="settings-username-password"
                    value={usernamePassword}
                    onChange={(e) => setUsernamePassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
            </SettingsSection>

            {props.role === "PARTNER" ? (
              <SettingsSection
                eyebrow="Workspace identity"
                title="Display name"
                description="The public-facing name that appears on talent showcases. You may use spaces, symbols and full multi-word names (e.g. Museo Modeling & Events)."
                footer={
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={partnerDisplayNameBusy}
                      onClick={() => {
                        setPartnerDisplayName(props.initialPartnerDisplayName ?? "");
                        setPartnerDisplayNameFeedback(null);
                      }}
                    >
                      Reset
                    </Button>
                    <Button size="sm" disabled={partnerDisplayNameBusy} onClick={savePartnerDisplayName}>
                      Save changes
                    </Button>
                  </div>
                }
              >
                <div className="space-y-4 w-full">
                  {partnerDisplayNameFeedback ? (
                    <AlertBanner
                      tone={partnerDisplayNameFeedback.kind}
                      onDismiss={() => setPartnerDisplayNameFeedback(null)}
                    >
                      {partnerDisplayNameFeedback.message}
                    </AlertBanner>
                  ) : null}
                  <div className="space-y-1.5 w-full max-w-md">
                    <Label htmlFor="settings-partner-display-name">Display name</Label>
                    <Input
                      id="settings-partner-display-name"
                      value={partnerDisplayName}
                      onChange={(e) => setPartnerDisplayName(e.target.value)}
                      placeholder="e.g. Museo Modeling & Events"
                    />
                    <p className="t-body-sm text-stone pt-1">
                      This replaces your username on showcase branding. Max 80 characters.
                    </p>
                  </div>
                </div>
              </SettingsSection>
            ) : null}

            <SettingsSection
              eyebrow="Credentials"
              title="Change password"
              description="Protect your account with a strong, unique password that you don't use anywhere else."
              footer={
                <Button size="sm" disabled={passwordBusy} onClick={changePassword}>
                  Update Password
                </Button>
              }
            >
              <div className="space-y-4 w-full">
                {passwordFeedback ? (
                  <AlertBanner
                    tone={passwordFeedback.kind}
                    onDismiss={() => setPasswordFeedback(null)}
                  >
                    {passwordFeedback.message}
                  </AlertBanner>
                ) : null}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 w-full">
                <div className="space-y-1.5">
                  <Label htmlFor="settings-current-pw">Current password</Label>
                  <PasswordInput
                    id="settings-current-pw"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-new-pw">New password</Label>
                  <PasswordInput
                    id="settings-new-pw"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-confirm-pw">Confirm new password</Label>
                  <PasswordInput
                    id="settings-confirm-pw"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>
            </div>
            </SettingsSection>
          </div>
        ) : null}

        {active === "showcase" && canManageShowcasePrivacy ? (
          <div className="space-y-0">
            <SettingsSection
              eyebrow="Privacy"
              title="Show contact information"
              description="Include your email address and mobile number on your public digital showcase."
            >
              <div className="w-full flex justify-end">
                <Toggle
                  checked={showcaseShowContactInfo}
                  onCheckedChange={(v) => setShowcaseShowContactInfo(!!v)}
                  disabled={showcaseBusy}
                  label="Show contact information"
                />
              </div>
            </SettingsSection>

            <SettingsSection
              eyebrow="Privacy"
              title="Show basic information"
              description="Include nationality, employment status, education, and course details on your public digital showcase."
            >
              <div className="w-full flex justify-end">
                <Toggle
                  checked={showcaseShowBasicInfo}
                  onCheckedChange={(v) => setShowcaseShowBasicInfo(!!v)}
                  disabled={showcaseBusy}
                  label="Show basic information"
                />
              </div>
            </SettingsSection>

            <SettingsSection
              eyebrow=""
              title=""
              description=""
              footer={
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={showcaseBusy}
                    onClick={() => {
                      setShowcaseShowContactInfo(props.initialShowcaseShowContactInfo);
                      setShowcaseShowBasicInfo(props.initialShowcaseShowBasicInfo);
                      setShowcasePrivacyFeedback(null);
                    }}
                  >
                    Reset
                  </Button>
                  <Button size="sm" disabled={showcaseBusy} onClick={saveShowcasePrivacy}>
                    Save changes
                  </Button>
                </div>
              }
            >
              <div className="w-full">
                {showcasePrivacyFeedback ? (
                  <AlertBanner
                    tone={showcasePrivacyFeedback.kind}
                    onDismiss={() => setShowcasePrivacyFeedback(null)}
                  >
                    {showcasePrivacyFeedback.message}
                  </AlertBanner>
                ) : (
                  <div className="t-body-sm text-stone">
                    Use the toggles above to customize what appears on your public showcase. Click Save when you are done.
                  </div>
                )}
              </div>
            </SettingsSection>
          </div>
        ) : null}

        {active === "branding" && canManagePartnerShowcaseTheme ? (
          <div className="space-y-0">
            <SettingsSection
              eyebrow="Workspace identity"
              title="Management logo"
              description="Upload a square 1:1 logo to replace the generic icon throughout the portal. Image will be cropped to a square. Max 5 MB."
              footer={
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={partnerLogoFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePartnerLogoFileChange}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={partnerLogoBusy || !partnerLogoUpdatedAt}
                    onClick={removePartnerLogo}
                  >
                    Remove logo
                  </Button>
                  <Button
                    size="sm"
                    disabled={partnerLogoBusy}
                    onClick={() => partnerLogoFileRef.current?.click()}
                  >
                    {partnerLogoUpdatedAt ? "Upload new logo" : "Upload logo"}
                  </Button>
                </div>
              }
            >
              <div className="space-y-4 w-full">
                {partnerLogoFeedback ? (
                  <AlertBanner
                    tone={partnerLogoFeedback.kind}
                    onDismiss={() => setPartnerLogoFeedback(null)}
                  >
                    {partnerLogoFeedback.message}
                  </AlertBanner>
                ) : null}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="relative">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-brand-light">
                      {partnerLogoUpdatedAt && props.partnerUserId ? (
                        <img
                          alt="Management logo preview"
                          src={`/api/public/partner-logos/${encodeURIComponent(props.partnerUserId)}?v=${encodeURIComponent(partnerLogoUpdatedAt)}`}
                          className="h-20 w-20 object-cover"
                        />
                      ) : (
                        <Building2 size={28} className="text-brand-dark" strokeWidth={1.75} aria-hidden />
                      )}
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-stone">
                      1:1 preview
                    </div>
                  </div>
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="t-body-md font-medium text-black">
                      {partnerLogoUpdatedAt ? "Logo uploaded" : "No logo uploaded yet"}
                    </div>
                    <p className="t-body-sm text-stone">
                      For best results upload a PNG or JPG with a 1:1 (square) aspect ratio and a transparent or plain background.
                    </p>
                  </div>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              eyebrow="Showcase branding"
              title="Roster showcase theme"
              description="Pick a single palette applied to every talent showcase under your management."
              footer={
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={partnerSettingsBusy}
                    onClick={() => {
                      setPartnerShowcaseTheme(props.initialShowcaseTheme ?? "classic");
                      setPartnerSettingsFeedback(null);
                    }}
                  >
                    Reset
                  </Button>
                  <Button size="sm" disabled={partnerSettingsBusy} onClick={savePartnerShowcaseTheme}>
                    Save changes
                  </Button>
                </div>
              }
            >
              <div className="space-y-5 w-full">
                {partnerSettingsFeedback ? (
                  <AlertBanner
                    tone={partnerSettingsFeedback.kind}
                    onDismiss={() => setPartnerSettingsFeedback(null)}
                  >
                    {partnerSettingsFeedback.message}
                  </AlertBanner>
                ) : null}
                <div className="space-y-2 w-full max-w-md">
                  <Label htmlFor="settings-partner-theme">Theme</Label>
                  <Select
                    id="settings-partner-theme"
                    value={partnerShowcaseTheme}
                    onChange={(e) => {
                      const next = e.target.value as ShowcaseThemeKey;
                      if (SHOWCASE_THEMES.find((t) => t.key === next)) {
                        setPartnerShowcaseTheme(next);
                      }
                    }}
                  >
                    {SHOWCASE_THEMES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                  <p className="t-body-sm text-stone pt-1">
                    Palette tokens apply uniformly to all showcases under your management. Changes take effect immediately on the public pages.
                  </p>
                </div>
              </div>
            </SettingsSection>
          </div>
        ) : null}
      </div>
    </div>
  );
}
