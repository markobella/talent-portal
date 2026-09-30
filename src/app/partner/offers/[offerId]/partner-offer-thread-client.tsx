"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, PrimaryButton, SecondaryButton, StatusBadge } from "@/components/ui";

type MessageDTO = {
  id: string;
  createdAt: string;
  body: string;
  sender: { id: string; role: "TALENT" | "PARTNER" | "ADMIN"; email: string; name: string | null };
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function labelProjectType(type: string | null) {
  if (!type) return null;
  if (type === "PHOTO_SHOOT") return "Photoshoot";
  if (type === "VIDEO_SHOOT") return "Video shoot";
  if (type === "PHOTO_VIDEO_SHOOT") return "Photo and video shoot";
  if (type === "PERFORMANCE") return "Performance";
  if (type === "HOSTING") return "Hosting";
  return "Other";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fmtAmount(amountPhp: number | null, transportAllowance: boolean) {
  if (typeof amountPhp !== "number") return null;
  const base = `₱${amountPhp.toLocaleString()}`;
  return transportAllowance ? `${base} + transport` : base;
}

export function PartnerOfferThreadClient(props: {
  offer: {
    id: string;
    title: string;
    status: string;
    projectType: string | null;
    projectDate: string | null;
    startTime: string | null;
    endTime: string | null;
    amountPhp: number | null;
    transportAllowance: boolean;
    compensation: string | null;
    message: string | null;
    adminRejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
  };
  talent: { id: string; displayName: string; email: string };
  messages: MessageDTO[];
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const showLegacyMessage = useMemo(() => {
    if (!props.offer.message) return false;
    return props.messages.length === 0;
  }, [props.offer.message, props.messages.length]);

  useEffect(() => {
    fetch("/api/notifications/mark-offer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ offerId: props.offer.id }),
    })
      .then(() => window.dispatchEvent(new Event("notifications-updated")))
      .catch(() => null);
  }, [props.offer.id]);

  async function send() {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      const res = await fetch(`/api/offers/${encodeURIComponent(props.offer.id)}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        window.alert(msg || "Failed to send message.");
        return;
      }
      setBody("");
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card
        title={props.offer.title}
        titleRight={<StatusBadge status={props.offer.status} className="font-numeric" />}
        right={<SecondaryButton onClick={() => router.refresh()}>Refresh</SecondaryButton>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="text-sm text-graphite">
            <div className="font-medium text-ink">Talent</div>
            <div className="mt-1 text-ink">{props.talent.displayName}</div>
            <div className="text-xs text-stone">{props.talent.email}</div>
          </div>

          <div className="rounded-[var(--radius-lg)] border-mist bg-surface-subtle p-4">
            <div className="text-xs font-semibold text-stone">Project details</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold text-stone">Project type</div>
                <div className="mt-1 text-sm font-semibold text-ink">
                  {labelProjectType(props.offer.projectType) ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-stone">Date & time</div>
                <div className="mt-1 text-sm font-semibold text-ink">
                  {props.offer.projectDate
                    ? `${fmtDate(props.offer.projectDate)}${props.offer.startTime && props.offer.endTime ? ` • ${props.offer.startTime}–${props.offer.endTime}` : ""}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-stone">Amount</div>
                <div className="mt-1 text-sm font-semibold text-ink">
                  {fmtAmount(props.offer.amountPhp, props.offer.transportAllowance) ??
                    (props.offer.compensation ? props.offer.compensation : "—")}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-stone">Submitted</div>
                <div className="mt-1 text-sm font-semibold text-ink">{fmtDateTime(props.offer.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>

        {props.offer.status === "ADMIN_REJECTED" ? (
          <div className="mt-4 rounded-[var(--radius-lg)] border-error/30 bg-error-bg/70 px-4 py-3 text-sm text-error">
            <div className="font-semibold">Rejected by admin</div>
            <div className="mt-1 text-error/80">{props.offer.adminRejectionReason || "No reason provided."}</div>
          </div>
        ) : null}
      </Card>

      <Card title="Messages" subtitle={<span className="font-numeric">{props.messages.length} messages</span>}>
        <div className="grid gap-3">
          {showLegacyMessage ? (
            <div className="rounded-[var(--radius-lg)] border-mist bg-surface-subtle px-4 py-3">
              <div className="text-xs font-semibold text-stone">Initial message</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-ink">{props.offer.message}</div>
            </div>
          ) : null}

          {props.messages.map((m) => {
            const mine = m.sender.role === "PARTNER";
            const senderLabel = mine ? "You" : m.sender.role === "TALENT" ? "Talent" : "Admin";
            return (
              <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={[
                    "max-w-[680px] rounded-[var(--radius-lg)] px-4 py-3",
                    mine ? "bg-brand text-white" : "border border-mist bg-surface text-ink",
                  ].join(" ")}
                >
                  <div className={mine ? "text-[10px] text-white/70" : "text-[10px] text-stone"}>
                    {senderLabel} • {fmtDateTime(m.createdAt)}
                  </div>
                  <div className={mine ? "mt-1 whitespace-pre-wrap text-sm" : "mt-1 whitespace-pre-wrap text-sm text-graphite"}>
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })}

          {!props.messages.length && !showLegacyMessage ? (
            <div className="rounded-[var(--radius-lg)] border-mist bg-surface-subtle p-8 text-center text-sm text-stone">
              No messages yet.
            </div>
          ) : null}
        </div>

        {props.canWrite !== false ? (
          <div className="mt-5 grid gap-2">
            <textarea
              className="w-full rounded-[var(--radius-lg)] border-mist bg-surface px-4 py-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Send a message..."
            />
            <div className="flex justify-end">
              <PrimaryButton onClick={send} disabled={sending || !body.trim()}>
                {sending ? "Sending..." : "Send"}
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[var(--radius-lg)] border-mist bg-surface-subtle p-4 text-center text-xs font-medium text-stone">
            Messaging is temporarily unavailable for this account.
          </div>
        )}
      </Card>
    </div>
  );
}
