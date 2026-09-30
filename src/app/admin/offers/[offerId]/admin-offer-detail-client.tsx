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

export function AdminOfferDetailClient(props: {
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
    adminReviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  partner: { id: string; displayName: string; email: string };
  talent: { id: string; displayName: string; email: string };
  messages: MessageDTO[];
}) {
  const router = useRouter();
  const [reviewBusy, setReviewBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const canReview = props.offer.status === "PENDING_ADMIN";

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

  async function review(decision: "APPROVE" | "REJECT") {
    setReviewBusy(true);
    try {
      const res = await fetch(`/api/admin/offers/${encodeURIComponent(props.offer.id)}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, reason: decision === "REJECT" ? rejectReason.trim() || null : null }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        window.alert(msg || "Failed to review offer.");
        return;
      }
      router.refresh();
    } finally {
      setReviewBusy(false);
    }
  }

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
          <div className="grid gap-4">
            <div className="text-sm text-black/70">
              <div className="font-medium text-black/80">Partner</div>
              <div className="mt-1">{props.partner.displayName}</div>
              <div className="text-xs text-black/40">{props.partner.email}</div>
            </div>
            <div className="text-sm text-black/70">
              <div className="font-medium text-black/80">Talent</div>
              <div className="mt-1">{props.talent.displayName}</div>
              <div className="text-xs text-black/40">{props.talent.email}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4">
            <div className="text-xs font-semibold text-black/50">Project details</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold text-black/40">Project type</div>
                <div className="mt-1 text-sm font-semibold text-black/80">
                  {labelProjectType(props.offer.projectType) ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-black/40">Date & time</div>
                <div className="mt-1 text-sm font-semibold text-black/80">
                  {props.offer.projectDate
                    ? `${fmtDate(props.offer.projectDate)}${props.offer.startTime && props.offer.endTime ? ` • ${props.offer.startTime}–${props.offer.endTime}` : ""}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-black/40">Amount</div>
                <div className="mt-1 text-sm font-semibold text-black/80">
                  {fmtAmount(props.offer.amountPhp, props.offer.transportAllowance) ??
                    (props.offer.compensation ? props.offer.compensation : "—")}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-black/40">Submitted</div>
                <div className="mt-1 text-sm font-semibold text-black/80">{fmtDateTime(props.offer.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>

        {props.offer.status === "ADMIN_REJECTED" ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            <div className="font-semibold">Rejected</div>
            <div className="mt-1 text-red-900/80">{props.offer.adminRejectionReason || "No reason provided."}</div>
          </div>
        ) : null}

        {canReview ? (
          <div className="mt-5 grid gap-2">
            <div className="text-sm font-medium text-black/70">Admin review</div>
            <textarea
              className="w-full rounded-[var(--radius-lg)] border-mist bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason (only if rejecting)"
            />
            <div className="flex flex-wrap justify-end gap-2">
              <SecondaryButton onClick={() => review("REJECT")} disabled={reviewBusy}>
                Reject
              </SecondaryButton>
              <PrimaryButton onClick={() => review("APPROVE")} disabled={reviewBusy}>
                Approve
              </PrimaryButton>
            </div>
          </div>
        ) : null}
      </Card>

      <Card title="Messages" subtitle={<span className="font-numeric">{props.messages.length} messages</span>}>
        <div className="grid gap-3">
          {showLegacyMessage ? (
            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              <div className="text-xs font-semibold text-black/50">Initial message</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-black/80">{props.offer.message}</div>
            </div>
          ) : null}

          {props.messages.map((m) => {
            const tone =
              m.sender.role === "ADMIN"
                ? "bg-surface-subtle text-ink"
                : m.sender.role === "PARTNER"
                  ? "bg-brand text-white"
                  : "border-mist bg-surface text-ink";
            const senderLabel = m.sender.role === "ADMIN" ? "Admin" : m.sender.role === "PARTNER" ? "Partner" : "Talent";
            return (
              <div key={m.id} className="flex justify-start">
                <div className={["max-w-[760px] rounded-[var(--radius-lg)] px-4 py-3", tone].join(" ")}>
                  <div className={m.sender.role === "PARTNER" ? "text-[10px] text-white/70" : "text-[10px] text-stone"}>
                    {senderLabel} • {fmtDateTime(m.createdAt)}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm">{m.body}</div>
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

        <div className="mt-5 grid gap-2">
          <textarea
            className="w-full rounded-[var(--radius-lg)] border-mist bg-surface px-4 py-3 text-sm text-ink outline-none placeholder:text-stone focus:border-brand focus:ring-2 focus:ring-brand-light"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Send a message as admin..."
          />
          <div className="flex justify-end">
            <PrimaryButton onClick={send} disabled={sending || !body.trim()}>
              {sending ? "Sending..." : "Send"}
            </PrimaryButton>
          </div>
        </div>
      </Card>
    </div>
  );
}
