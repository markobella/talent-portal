"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertBanner, PrimaryButton, SecondaryButton } from "@/components/ui";
import { REVIEW_CATEGORY_LABELS, type ReviewCategoryKey } from "@/lib/profile-review";

export type DiffField = {
  fieldKey: string;
  fieldLabel: string;
  old: unknown;
  new: unknown;
};

export type GroupedDiffs = Partial<Record<ReviewCategoryKey, DiffField[]>>;

const FIELD_LABELS: Record<string, string> = {
  displayName: "Display name",
  alias: "Alias",
  dateOfBirth: "Date of birth",
  locationCity: "City",
  locationCountry: "Country",
  nationality: "Nationality",
  phoneNumber: "Mobile number",
  employmentStatus: "Employment status",
  educationLevel: "Educational attainment",
  collegeCourse: "College course",
  heightIn: "Height",
  weightLbs: "Weight",
  skinTone: "Skin tone",
  eyeColor: "Eye color",
  shirtSize: "Shirt size",
  pantsSize: "Pants size",
  dressSize: "Dress size",
  shoeSize: "Shoe size",
  measurements: "Measurements",
  tattoos: "Tattoos",
  tattooLocations: "Tattoo locations",
  piercings: "Piercings",
  piercingLocations: "Piercing locations",
  birthmarks: "Birthmarks",
  birthmarkLocations: "Birthmark locations",
  experienceYears: "Modeling experience",
  modelingTypes: "Type of modeling",
  talents: "Talents",
  experienceItems: "Experience items",
  links: "Social links",
  aboutMe: "About me",
};

function formatHeight(oldRaw: unknown, newRaw: unknown) {
  const render = (inches: unknown): string | null => {
    if (typeof inches !== "number" || !Number.isFinite(inches) || inches <= 0) return null;
    const ft = Math.floor(inches / 12);
    const inch = Math.round(inches % 12);
    if (ft === 0) return `${inch}"`;
    return inch === 0 ? `${ft}'` : `${ft}' ${inch}"`;
  };
  const a = render(oldRaw);
  const b = render(newRaw);
  if (!a && !b) return null;
  return { old: a ?? "—", new: b ?? "—" };
}

function labelFor(category: ReviewCategoryKey, fieldKey: string) {
  return FIELD_LABELS[fieldKey] ?? fieldKey;
}

function formatValue(v: unknown, category: ReviewCategoryKey, fieldKey: string): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") {
    if (fieldKey === "dateOfBirth") {
      try {
        return new Date(v).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return v;
      }
    }
    if (v === "") return "—";
    return v;
  }
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") {
    if (fieldKey === "shoeSize") return String(v);
    if (fieldKey === "heightIn") {
      const ft = Math.floor(v / 12);
      const inch = Math.round(v % 12);
      if (ft === 0) return `${inch}"`;
      return inch === 0 ? `${ft}'` : `${ft}' ${inch}"`;
    }
    if (fieldKey === "weightLbs") return `${v} lbs`;
    if (fieldKey === "followers") return new Intl.NumberFormat(undefined, { notation: "compact" }).format(v);
    return String(v);
  }
  if (Array.isArray(v)) {
    if (category === "stats" && fieldKey === "measurements") {
      return "measurements (structured)";
    }
    if (fieldKey === "experienceItems") {
      if (!v.length) return "None";
      return v
        .map((x, i) => {
          if (!x || typeof x !== "object") return "";
          const o = x as Record<string, unknown>;
          const kind =
            o.kind === "PROJECT" ? "Project" : o.kind === "CERTIFICATION" ? "Certification" : o.kind === "TITLE" ? "Title" : "";
          const parts = [kind, typeof o.title === "string" ? o.title : ""];
          if (typeof o.when === "string") parts.push(o.when);
          const line = parts.filter(Boolean).join(" · ");
          return `${i + 1}. ${line}`;
        })
        .filter(Boolean)
        .join("\n");
    }
    if (fieldKey === "links") {
      if (!v.length) return "None";
      return v
        .map((x, i) => {
          if (!x || typeof x !== "object") return "";
          const o = x as Record<string, unknown>;
          const platform = typeof o.platform === "string" ? o.platform : "";
          const handle = typeof o.handle === "string" ? `@${o.handle}` : null;
          const fcount = typeof o.followers === "number"
            ? new Intl.NumberFormat(undefined, { notation: "compact" }).format(o.followers)
            : null;
          const line = [platform, handle, fcount ? `${fcount} followers` : null].filter(Boolean).join(" — ");
          return `${i + 1}. ${line}`;
        })
        .filter(Boolean)
        .join("\n");
    }
    const strs = v.map((item) => (typeof item === "string" ? item : JSON.stringify(item)));
    if (!strs.length) return "None";
    return strs.join(", ");
  }
  if (typeof v === "object") {
    if (category === "stats" && fieldKey === "measurements") {
      const m = v as Record<string, unknown>;
      const unit = (m.unit as string) ?? "in";
      const keys: [string, string][] = [
        ["bust", "Bust"],
        ["underBust", "Under bust"],
        ["naturalWaist", "Natural waist"],
        ["hips", "Full hips"],
        ["waistToFloor", "Waist to floor"],
        ["hollowToHem", "Hollow to hem"],
        ["shoulderWidth", "Shoulder width"],
        ["backLength", "Back length"],
      ];
      const lines = keys.map(([k, label]) => {
        const raw = m[k];
        const val = typeof raw === "number" ? `${raw}${unit}` : "—";
        return `${label}: ${val}`;
      });
      return lines.join("  |  ");
    }
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return "[object]";
    }
  }
  return String(v);
}

export function PartnerReviewDetailClient(props: {
  reviewId: string;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
  groupedDiffs: GroupedDiffs;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionComment: string | null;
  talentDisplay: string;
  talentAvatarSrc: string | null;
  talentSubtitle: string | null;
  partnerName: string | null;
  reviewBelongsToPartner: boolean;
}) {
  const router = useRouter();
  const { reviewId, reviewStatus, groupedDiffs, submittedAt, reviewedAt, rejectionComment, talentDisplay, talentAvatarSrc, talentSubtitle, reviewBelongsToPartner } = props;
  const [openReject, setOpenReject] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectRequired, setRejectRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);
  const canAct = reviewStatus === "PENDING" && reviewBelongsToPartner && !busy;

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 10000);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const totalDiffCount = Object.values(groupedDiffs).reduce(
    (sum, bucket) => sum + (bucket?.length ?? 0),
    0,
  );

  async function onApprove() {
    if (!canAct) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/partner/reviews/${encodeURIComponent(reviewId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        setFeedback({ kind: "error", message: msg || "Could not approve changes." });
        return;
      }
      setFeedback({ kind: "success", message: "Profile changes approved. The talent's showcase is now updated." });
      router.refresh();
    } catch {
      setFeedback({ kind: "error", message: "Could not approve changes." });
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitReject() {
    if (!canAct) return;
    const comment = rejectNote.trim();
    if (!comment) {
      setRejectRequired(true);
      return;
    }
    setBusy(true);
    setRejectRequired(false);
    try {
      const res = await fetch(`/api/partner/reviews/${encodeURIComponent(reviewId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "REJECT", rejectionComment: comment }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        setFeedback({ kind: "error", message: msg || "Could not submit requested changes." });
        return;
      }
      setFeedback({ kind: "success", message: "Note sent to talent. They can update their profile and resubmit." });
      setOpenReject(false);
      setRejectNote("");
      router.refresh();
    } catch {
      setFeedback({ kind: "error", message: "Could not submit requested changes." });
    } finally {
      setBusy(false);
    }
  }

  const order: ReviewCategoryKey[] = ["identity", "stats", "credibility", "social", "bio"];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-stone-100 ring-1 ring-stone-200">
                {talentAvatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={talentAvatarSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-stone">
                    {(talentDisplay ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium tracking-widest uppercase text-stone">
                  Profile review submission
                </div>
                <h1 className="mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {talentDisplay}
                </h1>
                {talentSubtitle ? (
                  <div className="mt-0.5 truncate text-sm text-stone">{talentSubtitle}</div>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone">
                  <span>
                    Submitted{" "}
                    {new Date(submittedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  {reviewedAt ? (
                    <span>
                      Decided{" "}
                      {new Date(reviewedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  ) : null}
                  <span>
                    {totalDiffCount} changed field{totalDiffCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
            <StatusPill status={reviewStatus} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            {order.map((k) => {
              const diffs = groupedDiffs[k] ?? [];
              const meta = REVIEW_CATEGORY_LABELS[k];
              const active = diffs.length > 0;
              return (
                <span
                  key={k}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold",
                    active
                      ? "border-black/10 bg-black text-white"
                      : "border-mist bg-surface text-stone/70",
                  ].join(" ")}
                >
                  <span className={active ? "opacity-75" : ""}>{meta.code}</span>
                  <span>{meta.label}</span>
                  <span
                    className={[
                      "rounded-full px-1.5 text-[10px]",
                      active ? "bg-white/15 text-white/90" : "bg-black/5 text-stone",
                    ].join(" ")}
                  >
                    {diffs.length}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {feedback ? (
          <div className="mt-4">
            <AlertBanner
              tone={feedback.kind === "success" ? "success" : feedback.kind === "error" ? "error" : "warning"}
            >
              <div className="font-semibold">
                {feedback.kind === "success" ? "Done" : feedback.kind === "error" ? "Something went wrong" : "Note"}
              </div>
              <div className="mt-0.5 text-[13px] opacity-90">{feedback.message}</div>
            </AlertBanner>
          </div>
        ) : null}

        {reviewStatus === "REJECTED" && rejectionComment ? (
          <div className="mt-4 rounded-[var(--radius-xl)] border border-rose-200/70 bg-rose-50/60 p-5">
            <div className="text-[10px] font-semibold tracking-widest uppercase text-rose-800/70">
              Note sent to talent
            </div>
            <div className="mt-1 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-rose-900/90">
              {rejectionComment}
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-4">
          {order.map((k) => {
            const diffs = groupedDiffs[k] ?? [];
            const active = diffs.length > 0;
            const meta = REVIEW_CATEGORY_LABELS[k];
            return (
              <section
                key={k}
                className={[
                  "rounded-[var(--radius-xl)] border-mist bg-surface p-4 sm:p-5",
                  !active ? "opacity-75" : "",
                ].join(" ")}
                aria-labelledby={`cat-${k}`}
              >
                <header className="flex items-center justify-between gap-3 pb-3 border-b border-mist">
                  <div className="min-w-0">
                    <div
                      id={`cat-${k}`}
                      className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-stone"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-white/90">
                        {meta.code}
                      </span>
                      {meta.label}
                    </div>
                    <div className="mt-1 text-sm text-stone">
                      {active
                        ? `${diffs.length} field${diffs.length === 1 ? "" : "s"} changed`
                        : "No changes in this category"}
                    </div>
                  </div>
                </header>
                {active ? (
                  <ul className="mt-3 grid grid-cols-1 divide-y divide-mist sm:grid-cols-1">
                    {diffs.map((d) => {
                      const label = labelFor(k, d.fieldKey);
                      let oldVal = formatValue(d.old, k, d.fieldKey);
                      let newVal = formatValue(d.new, k, d.fieldKey);
                      if (k === "stats" && d.fieldKey === "heightIn") {
                        const fmt = formatHeight(d.old, d.new);
                        if (fmt) {
                          oldVal = fmt.old;
                          newVal = fmt.new;
                        }
                      }
                      const isMultiline =
                        (d.fieldKey === "aboutMe") ||
                        (d.fieldKey === "experienceItems") ||
                        (d.fieldKey === "links");
                      return (
                        <li key={d.fieldKey} className="py-3 first:pt-0 last:pb-0">
                          <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-stone">
                            {label}
                          </div>
                          <div
                            className={[
                              "mt-1.5 grid grid-cols-1 gap-3 sm:grid-cols-2",
                              isMultiline ? "items-start" : "items-center",
                            ].join(" ")}
                          >
                            <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/60 px-3 py-2 text-sm text-stone line-through decoration-stone-400/70">
                              <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-stone/70">
                                Current
                              </div>
                              <div
                                className={[
                                  "mt-0.5 whitespace-pre-wrap break-words text-stone",
                                  isMultiline ? "leading-relaxed" : "",
                                ].join(" ")}
                              >
                                {oldVal}
                              </div>
                            </div>
                            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-950/90">
                              <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-emerald-900/60">
                                Proposed
                              </div>
                              <div
                                className={[
                                  "mt-0.5 whitespace-pre-wrap break-words text-emerald-950/90 font-medium",
                                  isMultiline ? "leading-relaxed" : "",
                                ].join(" ")}
                              >
                                {newVal}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 h-fit">
        <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-5">
          <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-stone">
            Review decision
          </div>
          <div className="mt-2">
            <StatusPill status={reviewStatus} large />
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-stone">
            {reviewStatus === "PENDING"
              ? reviewBelongsToPartner
                ? "You can approve the proposed changes to apply them to the talent's live profile, or reject with a note requesting edits."
                : "You are not the assigned management team for this talent's roster. Decisions are locked to the assigned management."
              : reviewStatus === "APPROVED"
                ? "These changes were approved and applied to the talent's showcase profile."
                : "These changes were returned to the talent with the note below."}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onApprove}
              disabled={!canAct}
              className={[
                "inline-flex h-10 items-center justify-center gap-1 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
                canAct
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-stone-100 text-stone/60 cursor-not-allowed",
              ].join(" ")}
            >
              {busy ? "Working…" : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canAct) return;
                setOpenReject(true);
                setRejectNote("");
                setRejectRequired(false);
              }}
              disabled={!canAct}
              className={[
                "inline-flex h-10 items-center justify-center gap-1 rounded-[var(--radius-md)] border px-3 text-sm font-semibold",
                canAct
                  ? "border-rose-300/70 bg-white text-rose-700 hover:bg-rose-50"
                  : "border-mist bg-surface text-stone/60 cursor-not-allowed",
              ].join(" ")}
            >
              Reject
            </button>
          </div>
          <div className="mt-4 border-t border-mist pt-4">
            <Link
              href="/partner/reviews"
              className="text-xs font-semibold text-stone hover:text-ink"
            >
              ← Back to all reviews
            </Link>
          </div>
        </div>
      </aside>

      {openReject ? (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setOpenReject(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-rose-800/70">
              Request changes
            </div>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Return with note
            </h2>
            <p className="mt-1 text-sm text-stone leading-relaxed">
              Tell the talent what to update. They will be able to edit their profile and resubmit once they address your notes.
            </p>
            <div className="mt-4">
              <label className="block">
                <div className="text-xs font-semibold text-black/50">
                  Reason / edits requested <span className="text-rose-600">*</span>
                </div>
                <textarea
                  rows={5}
                  value={rejectNote}
                  onChange={(e) => {
                    setRejectNote(e.target.value);
                    if (rejectRequired && e.target.value.trim()) setRejectRequired(false);
                  }}
                  disabled={busy}
                  placeholder={
                    "e.g., \"Please update your bust/waist/hips measurements to match your latest comp card, and confirm your shirt size with a brand fitting note.\""
                  }
                  className={[
                    "mt-1 w-full resize-y rounded-xl border px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2",
                    rejectRequired
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                      : "border-black/10 focus:border-brand focus:ring-brand-light",
                  ].join(" ")}
                />
                {rejectRequired ? (
                  <div className="mt-1 text-[11px] font-medium text-rose-700">
                    Please provide a note explaining what needs to change.
                  </div>
                ) : null}
                <div className="mt-1 text-[10px] text-black/40">
                  {rejectNote.length} / 2000 characters
                </div>
              </label>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <SecondaryButton onClick={() => !busy && setOpenReject(false)} disabled={busy}>
                Cancel
              </SecondaryButton>
              <PrimaryButton
                onClick={() => {
                  void onSubmitReject();
                }}
                className="bg-rose-700 hover:bg-rose-800"
                disabled={busy}
              >
                {busy ? "Sending…" : "Send note to talent"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusPill(props: { status: "PENDING" | "APPROVED" | "REJECTED"; large?: boolean }) {
  const { status, large } = props;
  const meta =
    status === "PENDING"
      ? { label: "Pending review", cls: "bg-amber-50 text-amber-800 ring-1 ring-amber-200" }
      : status === "APPROVED"
        ? { label: "Approved", cls: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" }
        : { label: "Changes requested", cls: "bg-rose-50 text-rose-800 ring-1 ring-rose-200" };
  const dot =
    status === "PENDING"
      ? "bg-amber-500"
      : status === "APPROVED"
        ? "bg-emerald-500"
        : "bg-rose-500";
  const sizeCls = large ? "px-3 py-1.5 text-[13px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span className={["inline-flex items-center gap-1.5 rounded-full font-semibold", meta.cls, sizeCls].join(" ")}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {meta.label}
    </span>
  );
}
