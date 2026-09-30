"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, SecondaryButton } from "@/components/ui";

type NotificationDTO = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: any;
  createdAt: string;
  readAt: string | null;
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function notificationMeta(type: string) {
  if (type === "MEDIA_SUBMITTED") {
    return {
      label: "Moderation",
      accent: "border-warn/30 bg-warn-bg/70 text-warn-fg",
      action: "Open moderation",
    };
  }
  if (type === "MEDIA_APPROVED") {
    return {
      label: "Approved",
      accent: "border-success/30 bg-success-bg/70 text-success-fg",
      action: "View profile",
    };
  }
  if (type === "MEDIA_DENIED") {
    return {
      label: "Denied",
      accent: "border-error/30 bg-error-bg/70 text-error",
      action: "Open profile",
    };
  }
  if (type === "PROFILE_SUBMITTED" || type === "PROFILE_APPROVED" || type === "PROFILE_REJECTED") {
    return {
      label: "Review",
      accent: "border-mist bg-surface-subtle text-stone",
      action: type === "PROFILE_SUBMITTED" ? "Open review" : "View profile",
    };
  }
  return {
    label: "Offer",
    accent: "border-mist bg-surface-subtle text-stone",
    action: "Open",
  };
}

export function NotificationsClient(props: {
  role: "TALENT" | "PARTNER" | "ADMIN";
  glassThemeEnabled: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationDTO[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/notifications");
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      setItems([]);
      return;
    }
    setItems(json.notifications as NotificationDTO[]);
  }

  useEffect(() => {
    load();
  }, []);

  const unreadIds = useMemo(() => (items ?? []).filter((n) => !n.readAt).map((n) => n.id), [items]);

  function offerUrl(offerId: string) {
    if (props.role === "ADMIN") return `/admin/offers/${offerId}`;
    if (props.role === "PARTNER") return `/partner/offers/${offerId}`;
    return `/talent/offers/${offerId}`;
  }

  function notificationUrl(n: NotificationDTO) {
    if (n.type === "MEDIA_SUBMITTED" && props.role === "ADMIN") {
      return "/admin/moderation";
    }
    if (n.type === "PROFILE_SUBMITTED") {
      if (props.role === "PARTNER") return "/partner/reviews";
      return "/talent/profile";
    }
    if (n.type === "PROFILE_APPROVED" || n.type === "PROFILE_REJECTED") {
      return props.role === "PARTNER" ? "/partner/reviews" : "/talent/profile";
    }
    const offerId = n.data?.offerId as string | undefined;
    if (offerId) return offerUrl(offerId);

    const talentProfileId = n.data?.talentProfileId as string | undefined;
    if (talentProfileId) {
      if (props.role === "ADMIN") return `/admin/talent/${talentProfileId}`;
      return "/talent/profile";
    }

    return null;
  }

  async function markAllRead() {
    setBusy(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) return;
      await load();
      window.dispatchEvent(new Event("notifications-updated"));
    } finally {
      setBusy(false);
    }
  }

  async function markRead(id: string) {
    setBusy(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      }).catch(() => null);
      await load();
      window.dispatchEvent(new Event("notifications-updated"));
    } finally {
      setBusy(false);
    }
  }

  async function openNotification(n: NotificationDTO) {
    if (busy) return;
    const href = notificationUrl(n);
    if (!n.readAt) await markRead(n.id);
    if (href) router.push(href);
  }

  if (!items) {
    return (
      <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-10 text-center text-sm text-stone">
        Loading...
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className={["text-sm", props.glassThemeEnabled ? "text-white/72" : "text-stone"].join(" ")}>
          {unreadIds.length ? `${unreadIds.length} unread` : ""}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SecondaryButton onClick={() => router.refresh()} disabled={busy}>
            Refresh
          </SecondaryButton>
          <PrimaryButton onClick={markAllRead} disabled={busy || !unreadIds.length}>
            Mark all read
          </PrimaryButton>
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((n) => {
          const href = notificationUrl(n);
          const meta = notificationMeta(n.type);
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => openNotification(n)}
              className={[
                "w-full rounded-[var(--radius-lg)] border-mist bg-surface p-5 text-left duration-[var(--duration-base)] ease-[var(--ease-out)] hover:shadow-raised",
                n.readAt ? "opacity-80" : "ring-2 ring-brand-light",
              ].join(" ")}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold tracking-tight text-ink">{n.title}</div>
                    {n.body ? <div className="mt-1 text-sm text-stone">{n.body}</div> : null}
                  </div>
                  <div className={["shrink-0 rounded-[var(--radius-sm)] border px-2.5 py-1 text-[11px] font-semibold", meta.accent].join(" ")}>
                    {meta.label}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-xs text-stone">{fmtDateTime(n.createdAt)}</div>
                  {href ? <div className="text-sm font-medium text-brand-dark">{meta.action}</div> : null}
                </div>
              </div>
            </button>
          );
        })}

        {!items.length ? (
          <div className="rounded-[var(--radius-lg)] border-mist bg-surface p-10 text-center text-sm text-stone">
            No notifications yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
