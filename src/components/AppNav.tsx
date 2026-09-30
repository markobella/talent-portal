"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import {
  Building2, Bell, Search, Menu, X, LogOut, User, Settings, ChevronDown } from "lucide-react";
import { FullScreenLoadingOverlay, IconButton, Badge, Avatar } from "@/components/ui";
import type { PortalRole } from "@/lib/session";

export type AppNavWorkspace = {
  agencyName: string;
  agencySub: string;
  partnerId?: string | null;
  partnerLogoUpdatedAt?: string | null;
};

export function AppNav(props: {
  role: PortalRole;
  workspace: AppNavWorkspace;
  navRole?: PortalRole;
}) {
  const pathname = usePathname();
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  const navRole: PortalRole = props.navRole ?? props.role;
  const OFFERS_AND_MESSAGING_ENABLED = navRole === "ADMIN";
  const links =
    navRole === "TALENT"
      ? [
          { href: "/talent/profile", label: "My Profile" },
          ...(OFFERS_AND_MESSAGING_ENABLED
            ? [{ href: "/talent/offers", label: "Projects" }]
            : []),
          { href: "/settings", label: "Settings" },
          { href: "/notifications", label: "Notifications" },
        ]
      : navRole === "PARTNER"
        ? [
            { href: "/partner/directory", label: "Directory" },
            { href: "/partner/reviews", label: "Reviews" },
            ...(OFFERS_AND_MESSAGING_ENABLED
              ? [{ href: "/partner/offers", label: "Projects" }]
              : []),
            { href: "/settings", label: "Settings" },
            { href: "/notifications", label: "Notifications" },
          ]
        : [
            { href: "/admin/offers", label: "Projects" },
            { href: "/admin/talent", label: "Models" },
            { href: "/admin/moderation", label: "Moderation" },
            { href: "/admin/accounts", label: "Accounts" },
            { href: "/admin/logs", label: "Logs" },
            { href: "/settings", label: "Settings" },
            { href: "/notifications", label: "Notifications" },
          ];

  const mobileMenuLinks = links.filter((link) => link.href !== "/notifications");
  const agency = props.workspace;

  useEffect(() => {
    let cancelled = false;
    async function loadCount() {
      const res = await fetch("/api/notifications/unread-count", { method: "GET" }).catch(() => null);
      const json = res ? await res.json().catch(() => null) : null;
      if (cancelled) return;
      const next = typeof json?.count === "number" ? json.count : 0;
      setUnreadNotifications(next);
    }

    function onUpdated() {
      loadCount();
    }

    loadCount();
    window.addEventListener("focus", onUpdated);
    window.addEventListener("notifications-updated", onUpdated as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onUpdated);
      window.removeEventListener("notifications-updated", onUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!accountRef.current) return;
      if (!accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    setAccountOpen(false);
    try {
      await signOut({ callbackUrl: "/login" });
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <header className="border-b border-mist bg-surface">
      <FullScreenLoadingOverlay open={signingOut} label="Signing out" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex min-h-[72px] items-center justify-between gap-4 py-3">
          {/* Left: Platform mark + Agency context */}
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/dashboard" className="flex min-w-0 shrink-0 items-center gap-2.5 text-ink hover:text-ink">
              <svg
                width={28}
                height={28}
                viewBox="0 0 28 28"
                aria-hidden="true"
                className="shrink-0"
              >
                <rect x="2" y="2" width="24" height="24" rx="6" fill="#24584E" />
                <rect x="9" y="9" width="10" height="10" rx="2" fill="#F7F6F2" opacity="0.92" />
              </svg>
              <span className="hidden sm:block truncate text-[15px] font-semibold tracking-[-0.01em] leading-none text-ink">
                Talent Portal
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-3">
              <div className="h-8 w-px bg-mist" />
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-brand-light">
                  {agency.partnerId && agency.partnerLogoUpdatedAt ? (
                    <img
                      alt=""
                      src={`/api/public/partner-logos/${encodeURIComponent(agency.partnerId)}?v=${encodeURIComponent(agency.partnerLogoUpdatedAt)}`}
                      className="h-8 w-8 object-cover"
                    />
                  ) : (
                    <Building2 size={16} className="text-brand-dark" strokeWidth={1.75} aria-hidden />
                  )}
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[13px] font-semibold text-ink">{agency.agencyName}</div>
                  <div className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-stone">
                    {agency.agencySub}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2">
              <div className="relative">
                <Search
                  size={16}
                  strokeWidth={1.75}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone"
                  aria-hidden
                />
                <input
                  type="text"
                  placeholder="Search…"
                  className="h-[44px] w-64 rounded-[var(--radius-md)] border border-mist bg-surface-subtle pl-9 pr-3 text-[13px] text-ink placeholder:text-stone transition-colors focus:border-brand focus:bg-surface focus:outline-none"
                />
              </div>
            </div>

            <div className="hidden lg:flex nav-underline-nav items-end gap-0.5 px-2 mr-1">
              {links.map((l) => {
              const active = pathname.startsWith(l.href);
              const isNotifications = l.href === "/notifications";
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={[
                    "relative inline-flex h-[44px] items-center px-3 text-[13px] font-medium transition-colors",
                    active
                      ? "text-ink"
                      : "text-graphite hover:text-ink hover:bg-surface-subtle rounded-[var(--radius-sm)]",
                  ].join(" ")}
                  aria-label={isNotifications ? "Notifications" : undefined}
                  title={isNotifications ? "Notifications" : undefined}
                >
                  <span className="relative inline-flex items-center">
                    {isNotifications ? (
                      <Bell size={18} strokeWidth={1.75} aria-hidden />
                    ) : (
                      l.label
                    )}
                    {isNotifications && unreadNotifications > 0 ? (
                      <span className="ml-2">
                        <Badge variant="brand">{unreadNotifications > 99 ? "99+" : unreadNotifications}</Badge>
                      </span>
                    ) : null}
                  </span>
                  {active ? (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-brand" aria-hidden />
                  ) : null}
                </Link>
              );
            })}
            </div>

            <div className="hidden lg:flex items-center">
              <div className="h-8 w-px bg-mist mx-1" />
            </div>

            <Link
              href="/notifications"
              className="lg:hidden relative inline-flex h-[44px] w-[44px] items-center justify-center rounded-[var(--radius-md)] text-graphite transition-colors hover:bg-surface-subtle hover:text-ink"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={19} strokeWidth={1.75} aria-hidden />
              {unreadNotifications > 0 ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" aria-hidden />
              ) : null}
            </Link>

            <IconButton
              variant="ghost"
              className="lg:hidden"
              label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-expanded={mobileMenuOpen}
              aria-controls="app-nav-mobile-menu"
            >
              {mobileMenuOpen ? <X size={19} strokeWidth={1.75} /> : <Menu size={19} strokeWidth={1.75} />}
            </IconButton>

            {/* Avatar + account dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((o) => !o)}
                className="flex h-[44px] items-center gap-2.5 rounded-[var(--radius-md)] px-1.5 pr-2 transition-colors hover:bg-surface-subtle"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                <Avatar size={32} shape="circle" name={null} fallbackInitials="TP" />
                <ChevronDown
                  size={15}
                  strokeWidth={1.75}
                  className={[
                    "hidden sm:block text-stone transition-transform",
                    accountOpen ? "rotate-180" : "",
                  ].join(" ")}
                  aria-hidden
                />
              </button>

              {accountOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-40 mt-2 w-60 rounded-[var(--radius-lg)] border border-mist bg-surface shadow-raised overflow-hidden py-1"
                >
                  <div className="border-b border-mist px-4 py-3">
                    <div className="text-[13px] font-semibold text-ink leading-tight">Signed in</div>
                    <div className="text-[12px] text-stone mt-0.5">{agency.agencyName}</div>
                  </div>
                  <Link
                    href="/talent/profile"
                    onClick={() => setAccountOpen(false)}
                    className="flex h-10 items-center gap-2.5 px-3 text-[13px] text-graphite hover:bg-surface-subtle hover:text-ink"
                    role="menuitem"
                  >
                    <User size={16} strokeWidth={1.75} aria-hidden />
                    My Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setAccountOpen(false)}
                    className="flex h-10 items-center gap-2.5 px-3 text-[13px] text-graphite hover:bg-surface-subtle hover:text-ink"
                    role="menuitem"
                  >
                    <Settings size={16} strokeWidth={1.75} aria-hidden />
                    Settings
                  </Link>
                  <div className="my-1 h-px bg-mist" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex h-10 w-full items-center gap-2.5 px-3 text-left text-[13px] text-error hover:bg-error-bg/50"
                    role="menuitem"
                  >
                    <LogOut size={16} strokeWidth={1.75} aria-hidden />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen ? (
          <nav
            id="app-nav-mobile-menu"
            className="lg:hidden border-t border-mist pb-4 pt-2 space-y-0.5"
          >
            <div className="mb-3 rounded-[var(--radius-md)] border border-mist bg-surface-subtle p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-brand-light">
                  {agency.partnerId && agency.partnerLogoUpdatedAt ? (
                    <img
                      alt=""
                      src={`/api/public/partner-logos/${encodeURIComponent(agency.partnerId)}?v=${encodeURIComponent(agency.partnerLogoUpdatedAt)}`}
                      className="h-8 w-8 object-cover"
                    />
                  ) : (
                    <Building2 size={16} className="text-brand-dark" strokeWidth={1.75} aria-hidden />
                  )}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-ink">{agency.agencyName}</div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-stone">
                    {agency.agencySub}
                  </div>
                </div>
              </div>
            </div>

            {mobileMenuLinks.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={[
                    "flex items-center justify-between rounded-[var(--radius-md)] px-3 h-[44px] text-[13px] font-medium transition-colors",
                    active
                      ? "bg-brand-light text-brand-dark"
                      : "text-graphite hover:bg-surface-subtle hover:text-ink",
                  ].join(" ")}
                >
                  <span>{l.label}</span>
                </Link>
              );
            })}
            <div className="my-2 h-px bg-mist" />
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-[44px] w-full items-center gap-2.5 px-3 text-left text-[13px] text-error hover:bg-error-bg/50 rounded-[var(--radius-md)]"
            >
              <LogOut size={16} strokeWidth={1.75} aria-hidden />
              Sign out
            </button>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
