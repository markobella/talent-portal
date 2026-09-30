import { AppNav } from "@/components/AppNav";
import { requireRole, resolveAppWorkspace } from "@/lib/session";
import { AccountsClient } from "./accounts-client";

export default async function AdminAccountsPage() {
  const session = await requireRole(["ADMIN"]);
  const workspace = await resolveAppWorkspace(session);

  return (
    <div className="min-h-screen bg-bg">
      <AppNav role="ADMIN" workspace={workspace ?? { agencyName: "", agencySub: "" }} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6 lg:p-8">
          <div className="text-sm font-medium text-stone">Admin</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Accounts</h1>
          <p className="mt-1 text-sm text-stone">Create model/talent and partner accounts.</p>
        </div>

        <div className="mt-6">
          <AccountsClient />
        </div>
      </div>
    </div>
  );
}
