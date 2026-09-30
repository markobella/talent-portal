import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/db";
import { requireRole, resolveAppWorkspace } from "@/lib/session";

function fmtDateTime(d: Date) {
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminLogsPage() {
  const session = await requireRole(["ADMIN"]);
  const workspace = await resolveAppWorkspace(session);

  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      createdAt: true,
      action: true,
      entityType: true,
      entityId: true,
      actor: { select: { email: true, role: true, name: true } },
      details: true,
    },
  });

  return (
    <div className="min-h-screen bg-bg">
      <AppNav role="ADMIN" workspace={workspace ?? { agencyName: "", agencySub: "" }} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6 lg:p-8">
          <div className="text-sm font-medium text-stone">Admin</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Logs</h1>
          <p className="mt-1 text-sm text-stone">Audit trail for offer activity.</p>
        </div>

        <div className="mt-6 rounded-[var(--radius-lg)] border-mist bg-surface">
          <div className="grid gap-3 p-4 sm:hidden">
            {logs.map((l) => {
              const actorName = l.actor.name ?? l.actor.email;
              const details = [l.entityType, l.entityId ? `#${l.entityId}` : null].filter(Boolean).join(" ");
              const extra = l.details ? JSON.stringify(l.details) : "";
              return (
                <div key={l.id} className="rounded-[var(--radius-lg)] border-mist bg-surface-subtle p-4">
                  <div className="text-[10px] font-semibold tracking-widest text-stone">WHEN</div>
                  <div className="mt-1 text-sm text-graphite">{fmtDateTime(l.createdAt)}</div>
                  <div className="mt-3 text-[10px] font-semibold tracking-widest text-stone">ACTOR</div>
                  <div className="mt-1 text-sm text-graphite">{actorName}</div>
                  <div className="mt-3 text-[10px] font-semibold tracking-widest text-stone">ACTION</div>
                  <div className="mt-1 text-sm text-ink">{l.action}</div>
                  <div className="mt-3 text-[10px] font-semibold tracking-widest text-stone">DETAILS</div>
                  <div className="mt-1 text-sm text-graphite">{details || "—"}</div>
                  {extra ? <div className="mt-1 break-words text-xs text-stone">{extra}</div> : null}
                </div>
              );
            })}

            {!logs.length ? <div className="p-6 text-center text-sm text-stone">No logs yet.</div> : null}
          </div>
          <div className="no-scrollbar hidden overflow-x-auto sm:block">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[180px_120px_160px_1fr] gap-0 border-b border-mist bg-surface-subtle px-4 py-3 text-xs font-semibold tracking-widest text-stone sm:px-6">
                <div>WHEN</div>
                <div>ACTOR</div>
                <div>ACTION</div>
                <div>DETAILS</div>
              </div>
              <div className="divide-y divide-mist">
                {logs.map((l) => {
                  const actorName = l.actor.name ?? l.actor.email;
                  const details = [l.entityType, l.entityId ? `#${l.entityId}` : null].filter(Boolean).join(" ");
                  const extra = l.details ? JSON.stringify(l.details) : "";
                  return (
                    <div
                      key={l.id}
                      className="grid grid-cols-[180px_120px_160px_1fr] gap-0 px-4 py-3 text-sm sm:px-6"
                    >
                      <div className="text-graphite">{fmtDateTime(l.createdAt)}</div>
                      <div className="truncate text-graphite">{actorName}</div>
                      <div className="text-ink">{l.action}</div>
                      <div className="min-w-0">
                        <div className="text-graphite">{details}</div>
                        {extra ? <div className="mt-1 truncate text-xs text-stone">{extra}</div> : null}
                      </div>
                    </div>
                  );
                })}

                {!logs.length ? (
                  <div className="p-10 text-center text-sm text-stone">No logs yet.</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
