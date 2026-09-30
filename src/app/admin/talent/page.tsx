import Link from "next/link";
import Image from "next/image";
import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/db";
import { requireRole, resolveAppWorkspace } from "@/lib/session";

type SearchParams = { q?: string };

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean);
  return chars.join("") || "MP";
}

export default async function AdminTalentDirectoryPage(props: { searchParams: Promise<SearchParams> }) {
  const session = await requireRole(["ADMIN"]);
  const workspace = await resolveAppWorkspace(session);
  const sp = await props.searchParams;
  const q = (sp.q ?? "").trim();

  const profiles = await prisma.talentProfile.findMany({
    where: q ? { displayName: { contains: q } } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      displayName: true,
      avatarUpdatedAt: true,
      locationCity: true,
      locationCountry: true,
      updatedAt: true,
      user: { select: { email: true } },
    },
  });

  return (
    <div className="min-h-screen bg-bg">
      <AppNav role="ADMIN" workspace={workspace} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6 lg:p-8">
          <div className="text-sm font-medium text-stone">Admin</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Models</h1>
          <p className="mt-1 text-sm text-stone">View and edit talent profiles.</p>

          <form className="mt-6 flex flex-col gap-2 sm:flex-row" action="/admin/talent" method="get">
            <input
              name="q"
              defaultValue={q}
              className="w-full h-11 rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              placeholder="Search by name"
            />
            <button className="h-11 rounded-[var(--radius-md)] bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark sm:w-auto">
              Search
            </button>
          </form>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {profiles.map((p, i) => {
            const location = [p.locationCity, p.locationCountry].filter(Boolean).join(", ");
            return (
              <Link
                key={p.id}
                href={`/admin/talent/${p.id}`}
                className="rounded-[var(--radius-lg)] border-mist bg-surface p-5 hover:bg-surface-subtle sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-br from-brand to-brand-light">
                    {p.avatarUpdatedAt ? (
                      <Image
                        alt={`${p.displayName} avatar`}
                        src={`/api/avatars/${p.id}?v=${encodeURIComponent(p.avatarUpdatedAt.toISOString())}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                        priority={i < 2}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
                        {initials(p.displayName)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold tracking-tight text-brand-dark">{p.displayName}</div>
                    <div className="mt-1 truncate text-sm text-stone">{p.user.email}</div>
                    <div className="mt-2 truncate text-sm text-stone">{location || "—"}</div>
                    <div className="mt-3 text-xs text-stone">Updated {fmtDate(p.updatedAt)}</div>
                  </div>
                </div>
              </Link>
            );
          })}
          {!profiles.length ? (
            <div className="rounded-[var(--radius-lg)] border-mist bg-surface p-10 text-center text-sm text-stone md:col-span-2">
              No models found.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
