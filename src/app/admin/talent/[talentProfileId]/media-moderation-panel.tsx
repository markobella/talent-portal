"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, PrimaryButton, SecondaryButton } from "@/components/ui";

type PendingGalleryItem = {
  id: string;
  kind: "PHOTO" | "VIDEO";
  fileName: string | null;
  mimeType: string | null;
  createdAt: string;
};

type DecisionTarget =
  | { kind: "avatar"; label: string }
  | { kind: "gallery"; id: string; label: string };

export function MediaModerationPanel(props: {
  talentProfileId: string;
  displayName: string;
  pendingAvatarUpdatedAt: string | null;
  pendingGalleryItems: PendingGalleryItem[];
}) {
  const router = useRouter();
  const [target, setTarget] = useState<DecisionTarget | null>(null);
  const [decision, setDecision] = useState<"APPROVE" | "DENY">("APPROVE");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const totalPending = (props.pendingAvatarUpdatedAt ? 1 : 0) + props.pendingGalleryItems.length;

  const pendingAvatarUrl = useMemo(() => {
    if (!props.pendingAvatarUpdatedAt) return null;
    return `/api/avatars/${props.talentProfileId}?variant=pending&v=${encodeURIComponent(props.pendingAvatarUpdatedAt)}`;
  }, [props.pendingAvatarUpdatedAt, props.talentProfileId]);

  function openDecision(nextTarget: DecisionTarget, nextDecision: "APPROVE" | "DENY") {
    setTarget(nextTarget);
    setDecision(nextDecision);
    setNotes("");
    setFeedback(null);
  }

  async function submitDecision() {
    if (!target) return;
    setBusy(true);
    setFeedback(null);
    try {
      const endpoint =
        target.kind === "avatar"
          ? `/api/admin/talent/${encodeURIComponent(props.talentProfileId)}/avatar/review`
          : `/api/admin/media/${encodeURIComponent(target.id)}/review`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, notes }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setFeedback({ kind: "error", message: json?.error ?? "Review failed." });
        return;
      }

      setTarget(null);
      setNotes("");
      setFeedback({
        kind: "success",
        message: `${target.label} ${decision === "APPROVE" ? "approved" : "denied and removed"}.`,
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">Media Moderation</div>
            <div className="mt-1 text-xs text-stone">
              Review profile photos and gallery media before they go live to partners.
            </div>
          </div>
          <div className="rounded-[var(--radius-sm)] border-warn/30 bg-warn-bg/70 px-3 py-1 text-xs font-semibold text-warn-fg">
            {totalPending} pending
          </div>
        </div>

        {feedback ? (
          <div
            className={[
              "mt-4 rounded-[var(--radius-lg)] px-4 py-3 text-sm",
              feedback.kind === "success" ? "bg-success-bg/70 text-success-fg" : "bg-error-bg/70 text-error",
            ].join(" ")}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="mt-5 grid gap-5">
          {props.pendingAvatarUpdatedAt ? (
            <div className="rounded-[var(--radius-lg)] border-mist bg-surface-subtle p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-ink">Pending Profile Photo</div>
                  <div className="mt-1 text-xs text-stone">Uploaded for {props.displayName}</div>
                </div>
                <div className="rounded-[var(--radius-sm)] border-warn/30 bg-warn-bg/70 px-3 py-1 text-[11px] font-semibold text-warn-fg">
                  Pending review
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-32 w-32 overflow-hidden rounded-[var(--radius-lg)] border-mist bg-surface">
                  {pendingAvatarUrl ? (
                    <Image
                      alt="Pending profile photo"
                      src={pendingAvatarUrl}
                      fill
                      sizes="128px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-stone">
                    Submitted {new Date(props.pendingAvatarUpdatedAt).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <PrimaryButton type="button" onClick={() => openDecision({ kind: "avatar", label: "Profile photo" }, "APPROVE")}>
                      Approve
                    </PrimaryButton>
                    <SecondaryButton type="button" onClick={() => openDecision({ kind: "avatar", label: "Profile photo" }, "DENY")}>
                      Deny
                    </SecondaryButton>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div>
            <div className="text-sm font-semibold text-ink">Pending Gallery Media</div>
            <div className="mt-1 text-xs text-stone">Approve or deny each gallery upload individually.</div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {props.pendingGalleryItems.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-[var(--radius-lg)] border-mist bg-surface-subtle">
                  <div className="relative aspect-[4/5] overflow-hidden bg-white">
                    {item.kind === "VIDEO" ? (
                      <video
                        src={`/api/gallery/${item.id}?v=${encodeURIComponent(item.createdAt)}`}
                        className="h-full w-full object-cover bg-black"
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <Image
                        alt={item.fileName ?? "Pending gallery photo"}
                        src={`/api/gallery/${item.id}?v=${encodeURIComponent(item.createdAt)}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 320px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="truncate text-sm font-semibold text-ink">
                      {item.fileName ?? `Untitled ${item.kind === "VIDEO" ? "video" : "photo"}`}
                    </div>
                    <div className="mt-1 text-xs text-stone">
                      Submitted {new Date(item.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                    </div>
                    <div className="mt-1 text-xs text-stone">Type: {item.kind === "VIDEO" ? "Video" : "Photo"}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <PrimaryButton
                        type="button"
                        onClick={() => openDecision({ kind: "gallery", id: item.id, label: item.fileName ?? `Gallery ${item.kind === "VIDEO" ? "video" : "photo"}` }, "APPROVE")}
                      >
                        Approve
                      </PrimaryButton>
                      <SecondaryButton
                        type="button"
                        onClick={() => openDecision({ kind: "gallery", id: item.id, label: item.fileName ?? `Gallery ${item.kind === "VIDEO" ? "video" : "photo"}` }, "DENY")}
                      >
                        Deny
                      </SecondaryButton>
                    </div>
                  </div>
                </div>
              ))}

              {!props.pendingGalleryItems.length ? (
                <div className="rounded-[var(--radius-lg)] border-dashed border-mist bg-surface px-4 py-8 text-center text-sm text-stone sm:col-span-2 xl:col-span-3">
                  No gallery media is waiting for moderation.
                </div>
              ) : null}
            </div>
          </div>

          {!props.pendingAvatarUpdatedAt && !props.pendingGalleryItems.length ? (
            <div className="rounded-[var(--radius-lg)] border-dashed border-mist bg-surface-subtle px-4 py-8 text-center text-sm text-stone">
              No media is waiting for review right now.
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        open={Boolean(target)}
        title={decision === "APPROVE" ? "Approve media" : "Deny media"}
        subtitle={target ? target.label : undefined}
        onClose={() => (!busy ? setTarget(null) : null)}
        widthClassName="max-w-lg"
      >
        <div className="space-y-4">
          <div className="text-sm text-black/60">
            {decision === "APPROVE"
              ? "Add optional notes for the talent before publishing this media."
              : "Add optional notes. Denied media is removed from the talent profile immediately."}
          </div>
          <label className="block">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/45">Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
              rows={5}
              maxLength={1000}
              className="w-full rounded-[var(--radius-lg)] border-mist bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light"
              placeholder={decision === "APPROVE" ? "Optional approval note" : "Reason for denial"}
            />
          </label>
          {feedback?.kind === "error" ? (
            <div className="rounded-2xl bg-red-600/10 px-4 py-3 text-sm text-red-700">{feedback.message}</div>
          ) : null}
          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setTarget(null)} disabled={busy}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="button" onClick={submitDecision} disabled={busy}>
              {busy ? "Saving..." : decision === "APPROVE" ? "Approve" : "Deny"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
