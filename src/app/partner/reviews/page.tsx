import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/db";
import { roleShellClass } from "@/lib/role-ui-theme-shared";
import { getRoleGlassThemeEnabled } from "@/lib/role-ui-theme";
import { requireRole, resolveAppWorkspace } from "@/lib/session";
import { REVIEW_CATEGORY_LABELS, type ReviewCategoryKey } from "@/lib/profile-review";

type TabKey = "all" | "pending" | "approved" | "rejected";
type SearchParams = { tab?: string; q?: string };

type ReviewRow = {
  id: string;
  status: string;
  submittedAt: Date;
  reviewedAt: Date | null;
  rejectionComment: string | null;
  changesJson: unknown;
  talent: {
    id: string;
    email: string;
    name: string | null;
    talentProfile: {
      id: string;
      displayName: string;
      alias: string | null;
      avatarUpdatedAt: Date | null;
      partnerId: string | null;
    } | null;
  };
};

const REVIEW_AVATAR_BASE = "/api/avatars";

function fmtSubmittedAgo(d: Date) {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function changedCategoryKeys(changesJson: unknown): ReviewCategoryKey[] {
  if (!changesJson || typeof changesJson !== "object") return [];
  const obj = changesJson as Record<string, unknown>;
  const keys: ReviewCategoryKey[] = [];
  const order: ReviewCategoryKey[] = ["identity", "stats", "credibility", "social", "bio"];
  for (const k of order) {
    const bucket = obj[k];
    if (!bucket || typeof bucket !== "object") continue;
    const entries = Object.keys(bucket as Record<string, unknown>);
    if (entries.length > 0) keys.push(k);
  }
  return keys;
}

function statusClasses(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
    case "APPROVED":
      return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
    case "REJECTED":
      return "bg-rose-50 text-rose-800 ring-1 ring-rose-200";
    default:
      return "bg-stone-100 text-stone-700 ring-1 ring-stone-200";
  }
}

function statusLabel(status: string) {
  if (status === "PENDING") return "Pending review";
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Changes requested";
  return status;
}

function initialsOf(name: string | null | undefined) {
  const s = (name ?? "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || s[0]?.toUpperCase() || "—";
}

const CATEGORY_PILL_CLASS =
  "inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[11px] font-semibold text-black/70";

export default async function PartnerReviewsPage(props: { searchParams: Promise<SearchParams> }) {
  const session = await requireRole(["PARTNER"]);
  const workspace = await resolveAppWorkspace(session);
  const glassThemeEnabled = await getRoleGlassThemeEnabled("PARTNER");
  const sp = await props.searchParams;
  const tab: TabKey =
    sp.tab === "pending" || sp.tab === "approved" || sp.tab === "rejected" ? sp.tab : "all";
  const q = sp.q?.trim() ?? "";

  const partnerId = session.user.id;
  const allReviews = (await prisma.talentProfileReview.findMany({
    where: {
      OR: [{ partnerId }, { talent: { talentProfile: { partnerId } } }],
    },
    orderBy: [
      { status: "asc" },
      { submittedAt: "desc" },
    ],
    take: 500,
    select: {
      id: true,
      status: true,
      submittedAt: true,
      reviewedAt: true,
      rejectionComment: true,
      changesJson: true,
      talent: {
        select: {
          id: true,
          email: true,
          name: true,
          talentProfile: {
            select: {
              id: true,
              displayName: true,
              alias: true,
              avatarUpdatedAt: true,
              partnerId: true,
            },
          },
        },
      },
    },
  })) as unknown as ReviewRow[];

  const counts = {
    all: allReviews.length,
    pending: allReviews.filter((r) => r.status === "PENDING").length,
    approved: allReviews.filter((r) => r.status === "APPROVED").length,
    rejected: allReviews.filter((r) => r.status === "REJECTED").length,
  };

  const filtered = allReviews.filter((r) => {
    if (tab === "pending" && r.status !== "PENDING") return false;
    if (tab === "approved" && r.status !== "APPROVED") return false;
    if (tab === "rejected" && r.status !== "REJECTED") return false;
    if (q) {
      const hay = [
        r.talent.name ?? "",
        r.talent.talentProfile?.displayName ?? "",
        r.talent.talentProfile?.alias ?? "",
        r.talent.email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className={roleShellClass(glassThemeEnabled)}>
      <AppNav
        role="PARTNER"
        workspace={workspace ?? { agencyName: "", agencySub: "" }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6 lg:p-8">
          <div className="text-sm font-medium text-stone">Management</div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Profile reviews</h1>
              <p className="mt-1 text-sm text-stone">
                Review and approve changes submitted by talents on your roster.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold",
                  statusClasses("PENDING"),
                ].join(" ")}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "currentColor" }}
                />
                {counts.pending} pending
              </div>
              <div
                className={[
                  "inline-flex items-center rounded-full px-2.5 py-1 font-semibold",
                  statusClasses("APPROVED"),
                ].join(" ")}
              >
                {counts.approved} approved
              </div>
              <div
                className={[
                  "inline-flex items-center rounded-full px-2.5 py-1 font-semibold",
                  statusClasses("REJECTED"),
                ].join(" ")}
              >
                {counts.rejected} changes requested
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {(
              [
                ["all", "All", counts.all],
                ["pending", "Pending", counts.pending],
                ["approved", "Approved", counts.approved],
                ["rejected", "Changes requested", counts.rejected],
              ] as const
            ).map(([key, label, count]) => (
              <Link
                key={key}
                href={`/partner/reviews?tab=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={[
                  "h-10 inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold",
                  tab === key
                    ? "bg-black text-white"
                    : "border border-mist bg-surface text-stone hover:bg-surface-subtle",
                ].join(" ")}
              >
                <span>{label}</span>
                <span
                  className={[
                    "rounded-full px-1.5 text-[11px] font-semibold",
                    tab === key ? "bg-white/15 text-white/90" : "bg-black/5 text-stone",
                  ].join(" ")}
                >
                  {count}
                </span>
              </Link>
            ))}
          </div>

          <form
            action="/partner/reviews"
            method="GET"
            className="flex w-full items-center gap-2 sm:max-w-sm"
          >
            <input type="hidden" name="tab" value={tab} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search talent name or email…"
              className="h-10 w-full rounded-[var(--radius-md)] border border-mist bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
            />
            <button
              type="submit"
              className="h-10 shrink-0 rounded-[var(--radius-md)] border border-mist bg-surface px-3 text-sm font-semibold text-stone hover:bg-surface-subtle"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-mist bg-surface">
          <div className="grid grid-cols-12 items-center gap-3 border-b border-mist bg-surface-subtle px-4 py-3 text-[11px] font-semibold tracking-[0.14em] uppercase text-stone sm:px-5">
            <div className="col-span-12 sm:col-span-5">Talent</div>
            <div className="col-span-7 sm:col-span-3">Changed categories</div>
            <div className="col-span-3 sm:col-span-2">Submitted</div>
            <div className="col-span-2 sm:col-span-2 text-right">Status</div>
          </div>
          {filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-stone">
              {q || tab !== "all"
                ? "No reviews match the current filters."
                : "No profile review submissions yet. When a talent on your roster submits profile changes, they will appear here."}
            </div>
          ) : (
            <ul className="divide-y divide-mist">
              {filtered.map((r) => {
                const display = r.talent.talentProfile?.displayName ?? r.talent.name ?? r.talent.email;
                const sub = r.talent.talentProfile?.alias
                  ? `${r.talent.talentProfile.alias} · ${r.talent.email}`
                  : r.talent.email;
                const avatarV = r.talent.talentProfile?.avatarUpdatedAt;
                const avatarSrc = avatarV
                  ? `${REVIEW_AVATAR_BASE}/${r.talent.talentProfile!.id}?v=${encodeURIComponent(avatarV.toISOString())}`
                  : null;
                const cats = changedCategoryKeys(r.changesJson);
                return (
                  <li
                    key={r.id}
                    className="grid grid-cols-12 items-center gap-3 px-4 py-4 sm:px-5"
                  >
                    <div className="col-span-12 min-w-0 sm:col-span-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-100 ring-1 ring-stone-200">
                          {avatarSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatarSrc}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-stone">
                              {initialsOf(display)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-ink">
                            {display}
                          </div>
                          <div className="truncate text-xs text-stone">{sub}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-7 sm:col-span-3">
                      {cats.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {cats.map((k) => (
                            <span key={k} className={CATEGORY_PILL_CLASS}>
                              <span className="opacity-60">
                                {REVIEW_CATEGORY_LABELS[k].code}
                              </span>
                              <span>{REVIEW_CATEGORY_LABELS[k].label}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-stone">No field diffs</span>
                      )}
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-xs text-stone">
                      <div>{fmtSubmittedAgo(r.submittedAt)}</div>
                      <div className="opacity-70">
                        {r.submittedAt.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-2">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          statusClasses(r.status),
                        ].join(" ")}
                      >
                        {statusLabel(r.status)}
                      </span>
                      <Link
                        href={`/partner/reviews/${r.id}`}
                        className="h-8 shrink-0 rounded-[var(--radius-sm)] border border-mist bg-surface px-3 text-[12px] font-semibold text-ink hover:bg-surface-subtle"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
