import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { roleShellClass } from "@/lib/role-ui-theme-shared";
import { getRoleGlassThemeEnabled } from "@/lib/role-ui-theme";
import { requireRole, resolveAppWorkspace } from "@/lib/session";

type SearchParams = { tab?: string };

type OfferRow = {
  id: string;
  title: string;
  status: string;
  projectType: string | null;
  projectDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  amountPhp: number | null;
  transportAllowance: boolean;
  compensation: string | null;
  createdAt: Date;
  talent: { email: string; name: string | null; talentProfile: { displayName: string } | null };
};

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
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

function fmtAmount(amountPhp: number | null, transportAllowance: boolean) {
  if (typeof amountPhp !== "number") return null;
  const base = `₱${amountPhp.toLocaleString()}`;
  return transportAllowance ? `${base} + transport` : base;
}

export default async function PartnerOffersPage(props: { searchParams: Promise<SearchParams> }) {
  const session = await requireRole(["PARTNER"]);
  const workspace = await resolveAppWorkspace(session);
  const glassThemeEnabled = await getRoleGlassThemeEnabled("PARTNER");
  const sp = await props.searchParams;
  const tab = sp.tab === "accepted" || sp.tab === "rejected" || sp.tab === "history" ? sp.tab : "pending";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const offers = (await prisma.offer.findMany({
    where: { partnerId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      status: true,
      projectType: true,
      projectDate: true,
      startTime: true,
      endTime: true,
      amountPhp: true,
      transportAllowance: true,
      compensation: true,
      createdAt: true,
      talent: { select: { talentProfile: { select: { displayName: true } }, email: true, name: true } },
    } as any,
  })) as unknown as OfferRow[];

  const upcoming = offers
    .filter((o) => o.status === "ACCEPTED" && o.projectDate && o.projectDate >= today)
    .sort((a, b) => (a.projectDate?.getTime() ?? 0) - (b.projectDate?.getTime() ?? 0))
    .slice(0, 10);

  const filteredOffers =
    tab === "pending"
      ? offers.filter((o) => o.status === "PENDING_ADMIN" || o.status === "APPROVED" || o.status === "SENT")
      : tab === "accepted"
        ? offers.filter((o) => o.status === "ACCEPTED" && (!o.projectDate || o.projectDate >= today))
        : tab === "history"
          ? offers.filter((o) => o.status === "ACCEPTED" && o.projectDate && o.projectDate < today)
          : offers.filter((o) => o.status === "DECLINED" || o.status === "ADMIN_REJECTED" || o.status === "WITHDRAWN");

  return (
    <div className={roleShellClass(glassThemeEnabled)}>
      <AppNav role="PARTNER" workspace={workspace} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6 lg:p-8">
          <div className="text-sm font-medium text-stone">Management</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-stone">Track your projects and messages.</p>
        </div>

        {upcoming.length ? (
          <div className="mt-6 rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6">
            <div className="text-sm font-semibold tracking-tight text-brand-dark">Upcoming projects</div>
            <div className="mt-1 text-xs text-stone">Accepted projects with upcoming dates.</div>
            <div className="mt-4 min-w-0">
              <div className="no-scrollbar flex w-full min-w-0 max-w-full gap-4 overflow-x-auto pb-2">
                {upcoming.map((o, i) => {
                  const talentName = o.talent.talentProfile?.displayName ?? o.talent.name ?? o.talent.email;
                  const when = o.projectDate
                    ? `${fmtDate(o.projectDate)}${o.startTime && o.endTime ? ` • ${o.startTime}–${o.endTime}` : ""}`
                    : null;
                  const amount = fmtAmount(o.amountPhp, o.transportAllowance);
                  const meta = [when, amount ?? o.compensation ?? null].filter(Boolean).join(" · ");
                  return (
                    <Link
                      key={o.id}
                      href={`/partner/offers/${o.id}`}
                      className="w-[85vw] max-w-[360px] shrink-0 rounded-[var(--radius-lg)] border-mist bg-surface p-5 duration-[var(--duration-base)] ease-[var(--ease-out)] hover:shadow-raised sm:w-[360px]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold tracking-tight text-brand-dark">{o.title}</div>
                          <div className="mt-1 truncate text-sm text-stone">{talentName}</div>
                        </div>
                        <StatusBadge status={o.status} className="shrink-0" />
                      </div>
                      {meta ? <div className="mt-3 text-xs text-stone">{meta}</div> : null}
                      {i === 0 ? <div className="mt-3 text-xs font-semibold text-brand-dark">Next up</div> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <Link
              href="/partner/offers?tab=pending"
              className={[
                "h-10 inline-flex items-center rounded-[var(--radius-md)] px-4 text-sm font-semibold",
                tab === "pending" ? "bg-brand text-white" : "border border-mist bg-surface text-stone hover:bg-surface-subtle",
              ].join(" ")}
            >
              Pending
            </Link>
            <Link
              href="/partner/offers?tab=accepted"
              className={[
                "h-10 inline-flex items-center rounded-[var(--radius-md)] px-4 text-sm font-semibold",
                tab === "accepted" ? "bg-brand text-white" : "border border-mist bg-surface text-stone hover:bg-surface-subtle",
              ].join(" ")}
            >
              Accepted
            </Link>
            <Link
              href="/partner/offers?tab=rejected"
              className={[
                "h-10 inline-flex items-center rounded-[var(--radius-md)] px-4 text-sm font-semibold",
                tab === "rejected" ? "bg-brand text-white" : "border border-mist bg-surface text-stone hover:bg-surface-subtle",
              ].join(" ")}
            >
              Rejected
            </Link>
            <Link
              href="/partner/offers?tab=history"
              className={[
                "h-10 inline-flex items-center rounded-[var(--radius-md)] px-4 text-sm font-semibold",
                tab === "history" ? "bg-brand text-white" : "border border-mist bg-surface text-stone hover:bg-surface-subtle",
              ].join(" ")}
            >
              History
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          {filteredOffers.map((o) => {
            const talentName = o.talent.talentProfile?.displayName ?? o.talent.name ?? o.talent.email;
            const projectType = labelProjectType(o.projectType as any);
            const amount = fmtAmount(o.amountPhp, o.transportAllowance);
            const when = o.projectDate ? `${fmtDate(o.projectDate)}${o.startTime && o.endTime ? ` · ${o.startTime}–${o.endTime}` : ""}` : null;
            const metaParts: string[] = [];
            if (projectType) metaParts.push(projectType);
            if (when) metaParts.push(when);
            if (amount) metaParts.push(amount);
            else if (o.compensation) metaParts.push(o.compensation);
            const meta = metaParts.join(" · ");
            return (
              <Link
                key={o.id}
                href={`/partner/offers/${o.id}`}
                className="rounded-[var(--radius-lg)] border-mist bg-surface p-6 duration-[var(--duration-base)] ease-[var(--ease-out)] hover:shadow-raised"
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <div className="min-w-0 truncate text-lg font-semibold tracking-tight text-brand-dark">{o.title}</div>
                      <StatusBadge status={o.status} className="shrink-0" />
                    </div>
                    <div className="mt-1 text-sm text-graphite">{talentName}</div>
                    {meta ? <div className="mt-2 text-xs text-stone">{meta}</div> : null}
                  </div>
                </div>
              </Link>
            );
          })}

          {!filteredOffers.length ? (
            <div className="rounded-[var(--radius-lg)] border-mist bg-surface p-10 text-center text-sm text-stone">
              {tab === "pending"
                ? "No pending projects."
                : tab === "accepted"
                  ? "No accepted projects."
                  : tab === "rejected"
                    ? "No rejected projects."
                    : "No past projects yet."}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
