import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole, resolveAppWorkspace, partnerDisplayName } from "@/lib/session";

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
  partner: { email: string; name: string | null; displayName: string | null };
  talent: { email: string; name: string | null; talentProfile: { id: string; displayName: string } | null };
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

export default async function AdminOffersPage(props: { searchParams: Promise<SearchParams> }) {
  const session = await requireRole(["ADMIN"]);
  const workspace = await resolveAppWorkspace(session);
  const sp = await props.searchParams;
  const tab = sp.tab === "accepted" || sp.tab === "rejected" || sp.tab === "history" ? sp.tab : "pending";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const offers = (await prisma.offer.findMany({
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
      partner: { select: { email: true, name: true, displayName: true } },
      talent: {
        select: {
          email: true,
          name: true,
          talentProfile: { select: { id: true, displayName: true } },
        },
      },
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
    <div className="min-h-screen bg-bg">
      <AppNav role="ADMIN" workspace={workspace ?? { agencyName: "", agencySub: "" }} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6 lg:p-8">
          <div className="text-sm font-medium text-stone">Admin</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-stone">Visibility across partner ↔ talent projects.</p>
        </div>

        {upcoming.length ? (
          <div className="mt-6 rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6">
            <div className="text-sm font-semibold tracking-tight text-brand-dark">Upcoming projects</div>
            <div className="mt-1 text-xs text-stone">Accepted projects with upcoming dates.</div>
            <div className="mt-4 min-w-0">
              <div className="no-scrollbar flex w-full min-w-0 max-w-full gap-4 overflow-x-auto pb-2">
                {upcoming.map((o, i) => {
                  const partnerName = partnerDisplayName({
                    name: o.partner.name,
                    displayName: o.partner.displayName,
                    email: o.partner.email,
                  });
                  const talentName = o.talent.talentProfile?.displayName ?? o.talent.name ?? o.talent.email;
                  const when = o.projectDate
                    ? `${fmtDate(o.projectDate)}${o.startTime && o.endTime ? ` • ${o.startTime}–${o.endTime}` : ""}`
                    : null;
                  const amount = fmtAmount(o.amountPhp, o.transportAllowance);
                  const meta = [when, amount ?? o.compensation ?? null].filter(Boolean).join(" · ");
                  return (
                    <Link
                      key={o.id}
                      href={`/admin/offers/${o.id}`}
                      className="w-[85vw] max-w-[360px] shrink-0 rounded-[var(--radius-lg)] border-mist bg-surface p-5 duration-[var(--duration-base)] ease-[var(--ease-out)] hover:shadow-raised sm:w-[360px]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold tracking-tight text-brand-dark">{o.title}</div>
                          <div className="mt-1 truncate text-sm text-stone">
                            {partnerName} → {talentName}
                          </div>
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
              href="/admin/offers?tab=pending"
              className={[
                "h-10 inline-flex items-center rounded-[var(--radius-md)] px-4 text-sm font-semibold",
                tab === "pending" ? "bg-brand text-white" : "border border-mist bg-surface text-stone hover:bg-surface-subtle",
              ].join(" ")}
            >
              Pending
            </Link>
            <Link
              href="/admin/offers?tab=accepted"
              className={[
                "h-10 inline-flex items-center rounded-[var(--radius-md)] px-4 text-sm font-semibold",
                tab === "accepted" ? "bg-brand text-white" : "border border-mist bg-surface text-stone hover:bg-surface-subtle",
              ].join(" ")}
            >
              Accepted
            </Link>
            <Link
              href="/admin/offers?tab=rejected"
              className={[
                "h-10 inline-flex items-center rounded-[var(--radius-md)] px-4 text-sm font-semibold",
                tab === "rejected" ? "bg-brand text-white" : "border border-mist bg-surface text-stone hover:bg-surface-subtle",
              ].join(" ")}
            >
              Rejected
            </Link>
            <Link
              href="/admin/offers?tab=history"
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
              <div key={o.id} className="rounded-[var(--radius-lg)] border-mist bg-surface p-6 duration-[var(--duration-base)] ease-[var(--ease-out)] hover:shadow-raised">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/offers/${o.id}`} className="text-lg font-semibold tracking-tight text-brand-dark hover:underline">
                        {o.title}
                      </Link>
                      <StatusBadge status={o.status} className="shrink-0" />
                    </div>
                    <div className="mt-1 text-sm text-graphite">
                      {partnerDisplayName({
                        name: o.partner.name,
                        displayName: o.partner.displayName,
                        email: o.partner.email,
                      })}{" "}
                      →{" "}
                      {o.talent.talentProfile?.displayName ?? o.talent.name ?? o.talent.email}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-stone">{fmtDate(o.createdAt)}</span>
                      {meta ? <span className="text-stone">{meta}</span> : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/offers/${o.id}`}
                      className="h-10 inline-flex items-center rounded-[var(--radius-md)] border border-mist bg-surface px-4 text-sm font-medium text-graphite hover:bg-surface-subtle"
                    >
                      View Project
                    </Link>
                    {o.talent.talentProfile?.id ? (
                      <Link
                        href={`/admin/talent/${o.talent.talentProfile.id}`}
                        className="h-10 inline-flex items-center rounded-[var(--radius-md)] border border-mist bg-surface px-4 text-sm font-medium text-graphite hover:bg-surface-subtle"
                      >
                        View Talent
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
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
