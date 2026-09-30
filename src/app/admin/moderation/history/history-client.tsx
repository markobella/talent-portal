"use client";

import Link from "next/link";
import { ModerationTabs } from "../moderation-tabs";

type HistoryItem = {
  id: string;
  createdAt: string;
  actorName: string;
  action: "APPROVED" | "DENIED";
  mediaKind: "AVATAR" | "GALLERY";
  displayName: string;
  fileName: string | null;
  notes: string | null;
  talentProfileId: string | null;
};

function statusMeta(action: "APPROVED" | "DENIED") {
  if (action === "APPROVED") {
    return {
      label: "Approved",
      className: "border-success/30 bg-success-bg/70 text-success-fg",
    };
  }
  return {
    label: "Denied",
    className: "border-error/30 bg-error-bg/70 text-error",
  };
}

export function ModerationHistoryClient(props: { history: HistoryItem[] }) {
  return (
    <>
      <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-stone">Admin</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Moderation</h1>
            <p className="mt-1 text-sm text-stone">Review the full approval and denial history for uploaded model media.</p>
          </div>
          <div className="rounded-[var(--radius-sm)] border-mist bg-surface-subtle px-3 py-1 text-sm font-semibold text-graphite">
            {props.history.length} records
          </div>
        </div>
        <ModerationTabs active="history" />
      </div>

      <div className="mt-6 rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6">
        <div className="text-lg font-semibold tracking-tight">Approval history</div>
        <div className="mt-1 text-sm text-stone">Recent moderation decisions across profile and gallery uploads.</div>
        <div className="mt-5 grid gap-3">
          {props.history.map((item) => {
            const meta = statusMeta(item.action);
            return (
              <div key={item.id} className="rounded-[var(--radius-lg)] border-mist bg-surface-subtle p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-ink">
                        {item.displayName}
                        {item.mediaKind === "GALLERY" && item.fileName ? ` · ${item.fileName}` : item.mediaKind === "AVATAR" ? " · Profile photo" : ""}
                      </div>
                      <div className={["rounded-[var(--radius-sm)] border px-2.5 py-1 text-[11px] font-semibold", meta.className].join(" ")}>
                        {meta.label}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-stone">
                      {item.mediaKind === "AVATAR" ? "Profile photo" : "Gallery media"} moderated by {item.actorName}
                    </div>
                    {item.notes ? <div className="mt-2 rounded-[var(--radius-md)] bg-surface px-3 py-2 text-sm text-graphite">{item.notes}</div> : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 text-xs text-stone sm:items-end">
                    <div>
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {item.talentProfileId ? (
                      <Link
                        href={`/admin/talent/${item.talentProfileId}`}
                        className="h-7 rounded-[var(--radius-sm)] border-mist bg-surface px-3 text-xs font-medium text-graphite hover:bg-surface-subtle inline-flex items-center"
                      >
                        Open model
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}

          {!props.history.length ? (
            <div className="rounded-[var(--radius-lg)] border-dashed border-mist bg-surface-subtle px-4 py-10 text-center text-sm text-stone">
              No moderation history yet.
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
