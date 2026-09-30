"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, PrimaryButton, SecondaryButton } from "@/components/ui";
import { ModerationTabs } from "./moderation-tabs";

type PendingAvatar = {
  talentProfileId: string;
  displayName: string;
  submittedAt: string;
};

type PendingGallery = {
  mediaItemId: string;
  talentProfileId: string;
  displayName: string;
  kind: "PHOTO" | "VIDEO";
  fileName: string | null;
  mimeType: string | null;
  submittedAt: string;
};

type DecisionTarget =
  | { kind: "avatar"; talentProfileId: string; label: string }
  | { kind: "gallery"; mediaItemId: string; label: string };

export function ModerationClient(props: {
  pendingAvatars: PendingAvatar[];
  pendingGallery: PendingGallery[];
}) {
  const router = useRouter();
  const [target, setTarget] = useState<DecisionTarget | null>(null);
  const [decision, setDecision] = useState<"APPROVE" | "DENY">("APPROVE");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const totalPending = props.pendingAvatars.length + props.pendingGallery.length;

  const groupedPending = useMemo(() => {
    const map = new Map<
      string,
      { talentProfileId: string; displayName: string; avatar?: PendingAvatar; gallery: PendingGallery[] }
    >();

    for (const avatar of props.pendingAvatars) {
      map.set(avatar.talentProfileId, {
        talentProfileId: avatar.talentProfileId,
        displayName: avatar.displayName,
        avatar,
        gallery: map.get(avatar.talentProfileId)?.gallery ?? [],
      });
    }

    for (const item of props.pendingGallery) {
      const existing = map.get(item.talentProfileId);
      if (existing) {
        existing.gallery.push(item);
      } else {
        map.set(item.talentProfileId, {
          talentProfileId: item.talentProfileId,
          displayName: item.displayName,
          gallery: [item],
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [props.pendingAvatars, props.pendingGallery]);

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
          ? `/api/admin/talent/${encodeURIComponent(target.talentProfileId)}/avatar/review`
          : `/api/admin/media/${encodeURIComponent(target.mediaItemId)}/review`;

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
      <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-stone">Admin</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Moderation</h1>
            <p className="mt-1 text-sm text-stone">Approve or deny uploaded profile photos and gallery media before they go live.</p>
          </div>
          <div className="rounded-[var(--radius-sm)] border-warn/30 bg-warn-bg/70 px-3 py-1 text-sm font-semibold text-warn-fg">
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
        <ModerationTabs active="pending" />
      </div>

      <div className="mt-6 rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold tracking-tight">Pending approvals</div>
            <div className="mt-1 text-sm text-stone">All pending profile and gallery submissions across the portal.</div>
          </div>
        </div>

        {!groupedPending.length ? (
          <div className="mt-5 rounded-[var(--radius-lg)] border-dashed border-mist bg-surface-subtle px-4 py-10 text-center text-sm text-stone">
            Nothing is waiting for moderation right now.
          </div>
        ) : (
          <div className="mt-5 grid gap-5">
            {groupedPending.map((group) => (
              <div key={group.talentProfileId} className="rounded-[var(--radius-lg)] border-mist bg-surface-subtle p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold tracking-tight text-ink">{group.displayName}</div>
                    <div className="mt-1 text-xs text-stone">
                      {group.avatar ? "Profile photo pending" : "No pending avatar"} · {group.gallery.length} gallery item{group.gallery.length === 1 ? "" : "s"} pending
                    </div>
                  </div>
                  <Link
                    href={`/admin/talent/${group.talentProfileId}`}
                    className="h-10 rounded-[var(--radius-md)] border-mist bg-surface px-4 text-sm font-medium text-graphite hover:bg-surface-subtle inline-flex items-center"
                  >
                    Open model
                  </Link>
                </div>

                {group.avatar ? (
                  <div className="mt-4 rounded-[var(--radius-lg)] border-mist bg-surface p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative h-28 w-28 overflow-hidden rounded-[var(--radius-lg)] border-mist bg-surface">
                        <Image
                          alt={`${group.displayName} pending avatar`}
                          src={`/api/avatars/${group.talentProfileId}?variant=pending&v=${encodeURIComponent(group.avatar.submittedAt)}`}
                          fill
                          sizes="112px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-ink">Profile photo</div>
                        <div className="mt-1 text-xs text-stone">
                          Submitted{" "}
                          {new Date(group.avatar.submittedAt).toLocaleString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton
                            type="button"
                            onClick={() => openDecision({ kind: "avatar", talentProfileId: group.talentProfileId, label: `${group.displayName} profile photo` }, "APPROVE")}
                          >
                            Approve
                          </PrimaryButton>
                          <SecondaryButton
                            type="button"
                            onClick={() => openDecision({ kind: "avatar", talentProfileId: group.talentProfileId, label: `${group.displayName} profile photo` }, "DENY")}
                          >
                            Deny
                          </SecondaryButton>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {group.gallery.length ? (
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-ink">Pending gallery media</div>
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {group.gallery.map((item) => (
                        <div key={item.mediaItemId} className="overflow-hidden rounded-[var(--radius-lg)] border-mist bg-surface">
                          <div className="relative aspect-[4/5] overflow-hidden bg-[#f0f0f0]">
                            {item.kind === "VIDEO" ? (
                              <video
                                src={`/api/gallery/${item.mediaItemId}?v=${encodeURIComponent(item.submittedAt)}`}
                                className="h-full w-full object-cover bg-black"
                                controls
                                preload="metadata"
                              />
                            ) : (
                              <Image
                                alt={item.fileName ?? "Pending gallery photo"}
                                src={`/api/gallery/${item.mediaItemId}?v=${encodeURIComponent(item.submittedAt)}`}
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
                              Submitted {new Date(item.submittedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                            </div>
                            <div className="mt-1 text-xs text-stone">Type: {item.kind === "VIDEO" ? "Video" : "Photo"}</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <PrimaryButton
                                type="button"
                                onClick={() =>
                                  openDecision(
                                    {
                                      kind: "gallery",
                                      mediaItemId: item.mediaItemId,
                                      label: item.fileName ?? `${group.displayName} gallery ${item.kind === "VIDEO" ? "video" : "photo"}`,
                                    },
                                    "APPROVE",
                                  )
                                }
                              >
                                Approve
                              </PrimaryButton>
                              <SecondaryButton
                                type="button"
                                onClick={() =>
                                  openDecision(
                                    {
                                      kind: "gallery",
                                      mediaItemId: item.mediaItemId,
                                      label: item.fileName ?? `${group.displayName} gallery ${item.kind === "VIDEO" ? "video" : "photo"}`,
                                    },
                                    "DENY",
                                  )
                                }
                              >
                                Deny
                              </SecondaryButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
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
              ? "Add optional notes before publishing this media."
              : "Add optional notes. Denied media is removed from the model profile immediately."}
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
