"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, PrimaryButton, SecondaryButton } from "@/components/ui";

type Role = "TALENT" | "PARTNER";

export function AccountsClient() {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role>("TALENT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ username: string; defaultPassword: string } | null>(null);
  const [lastReset, setLastReset] = useState<{ username: string; defaultPassword: string } | null>(null);
  const [items, setItems] = useState<
    Array<{ id: string; username: string; role: Role; name: string | null; createdAt: string; updatedAt: string }>
  >([]);
  const [loadingList, setLoadingList] = useState(false);
  const loadSeqRef = useRef(0);
  const mountedRef = useRef(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; step: 1 | 2 } | null>(null);
  const [renameModal, setRenameModal] = useState<{ id: string; currentUsername: string; nextUsername: string } | null>(
    null,
  );
  const [resetModal, setResetModal] = useState<{ id: string; username: string } | null>(null);

  const canSubmit = useMemo(() => username.trim().length >= 3, [username]);

  async function loadAccounts() {
    const seq = ++loadSeqRef.current;
    setLoadingList(true);
    try {
      const res = await fetch("/api/admin/accounts", { method: "GET" });
      const payload = (await res.json().catch(() => null)) as
        | {
            users?: Array<{
              id: string;
              username: string;
              role: Role;
              name: string | null;
              createdAt: string;
              updatedAt: string;
            }>;
            error?: string;
          }
        | null;

      if (!mountedRef.current || seq !== loadSeqRef.current) return;

      if (!res.ok) {
        setError(payload?.error ?? "Failed to load accounts.");
        return;
      }
      setItems(Array.isArray(payload?.users) ? payload!.users : []);
      setError(null);
    } catch {
      if (!mountedRef.current || seq !== loadSeqRef.current) return;
      setError("Failed to load accounts.");
    } finally {
      if (!mountedRef.current || seq !== loadSeqRef.current) return;
      setLoadingList(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    loadAccounts();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate() {
    const u = username.trim();
    if (!u) return;

    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: u, role }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; username?: string; defaultPassword?: string; error?: string }
        | null;

      if (!res.ok || !payload?.ok || !payload.username || !payload.defaultPassword) {
        setError(payload?.error ?? "Failed to create account.");
        return;
      }

      setCreated({ username: payload.username, defaultPassword: payload.defaultPassword });
      setLastReset(null);
      setUsername("");
      setRole("TALENT");
      await loadAccounts();
    } finally {
      setBusy(false);
    }
  }

  async function onChangeUsername(id: string, nextUsername: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, username: nextUsername }),
      });
      const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !payload?.ok) {
        setError(payload?.error ?? "Failed to update username.");
        return;
      }
      setRenameModal(null);
      await loadAccounts();
    } finally {
      setBusy(false);
    }
  }

  async function onResetPassword(id: string, username: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounts?id=${encodeURIComponent(id)}`, { method: "POST" });
      const payload = (await res.json().catch(() => null)) as { ok?: boolean; defaultPassword?: string; error?: string } | null;
      if (!res.ok || !payload?.ok || !payload.defaultPassword) {
        setError(payload?.error ?? "Failed to reset password.");
        return;
      }
      setResetModal(null);
      setCreated(null);
      setLastReset({ username, defaultPassword: payload.defaultPassword });
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !payload?.ok) {
        setError(payload?.error ?? "Failed to delete account.");
        return;
      }
      setDeleteConfirm(null);
      await loadAccounts();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Modal
        open={Boolean(renameModal)}
        title="Change username"
        subtitle={renameModal ? `Current: ${renameModal.currentUsername}` : undefined}
        onClose={() => {
          if (busy) return;
          setRenameModal(null);
        }}
        widthClassName="max-w-xl"
      >
        <div className="grid gap-3">
          <label className="block">
            <div className="text-xs font-semibold tracking-widest text-stone">NEW USERNAME</div>
            <input
              value={renameModal?.nextUsername ?? ""}
              onChange={(e) => setRenameModal((p) => (p ? { ...p, nextUsername: e.target.value } : p))}
              className="mt-2 w-full rounded-[var(--radius-lg)] border border-mist bg-surface px-4 py-3 text-sm font-medium text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              autoComplete="off"
              disabled={busy}
            />
          </label>
          <div className="mt-2 flex items-center justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setRenameModal(null)} disabled={busy}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              type="button"
              onClick={() => {
                const next = (renameModal?.nextUsername ?? "").trim();
                if (!renameModal || !next) return;
                onChangeUsername(renameModal.id, next);
              }}
              disabled={busy || !(renameModal?.nextUsername ?? "").trim()}
            >
              {busy ? "Saving..." : "Save"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(resetModal)}
        title="Reset password"
        subtitle={resetModal ? `Reset password for ${resetModal.username} to default?` : undefined}
        onClose={() => {
          if (busy) return;
          setResetModal(null);
        }}
        widthClassName="max-w-xl"
      >
        <div className="flex items-center justify-end gap-2">
          <SecondaryButton type="button" onClick={() => setResetModal(null)} disabled={busy}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => {
              if (!resetModal) return;
              onResetPassword(resetModal.id, resetModal.username);
            }}
            disabled={busy}
          >
            {busy ? "Resetting..." : "Reset"}
          </PrimaryButton>
        </div>
      </Modal>

      <div className="rounded-[var(--radius-xl)] border border-mist bg-surface p-5 shadow-sm sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block md:col-span-2">
            <div className="text-xs font-semibold tracking-widest text-stone">USERNAME</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-[var(--radius-lg)] border border-mist bg-surface px-4 py-3 text-sm font-medium text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-light h-11"
              placeholder="e.g., model.jane"
              autoComplete="off"
              disabled={busy}
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold tracking-widest text-stone">ACCOUNT TYPE</div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="mt-2 w-full rounded-[var(--radius-lg)] border border-mist bg-surface px-4 py-3 text-sm font-medium text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-light h-11"
              disabled={busy}
            >
              <option value="TALENT">Model/Talent</option>
              <option value="PARTNER">Partner</option>
            </select>
          </label>
        </div>

        {created ? (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-success/30 bg-success-bg/70 px-4 py-3 text-sm text-success-fg">
            <div className="font-semibold">Account created</div>
            <div className="mt-1 text-sm text-success-fg/80">
              Username: <span className="font-semibold">{created.username}</span> · Default password:{" "}
              <span className="font-semibold">{created.defaultPassword}</span>
            </div>
          </div>
        ) : null}

        {lastReset ? (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-success/30 bg-success-bg/70 px-4 py-3 text-sm text-success-fg">
            <div className="font-semibold">Password reset</div>
            <div className="mt-1 text-sm text-success-fg/80">
              Username: <span className="font-semibold">{lastReset.username}</span> · Default password:{" "}
              <span className="font-semibold">{lastReset.defaultPassword}</span>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
          <SecondaryButton
            type="button"
            onClick={() => {
              setUsername("");
              setRole("TALENT");
              setError(null);
              setCreated(null);
              setLastReset(null);
            }}
            disabled={busy}
          >
            Clear
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onCreate} disabled={busy || !canSubmit}>
            {busy ? "Creating..." : "Create account"}
          </PrimaryButton>
        </div>
      </div>

      {error ? (
        <div className="rounded-[var(--radius-xl)] border border-error/30 bg-error-bg/70 px-4 py-4 text-sm text-error sm:px-6">
          {error}
        </div>
      ) : null}

      <div className="rounded-[var(--radius-xl)] border border-mist bg-surface shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-mist px-4 py-4 sm:px-6">
          <div className="text-sm font-semibold tracking-tight text-brand-dark">Existing accounts</div>
          <SecondaryButton type="button" onClick={loadAccounts} disabled={busy || loadingList}>
            {loadingList ? "Refreshing..." : "Refresh"}
          </SecondaryButton>
        </div>
        <div className="divide-y divide-mist">
          {!items.length ? (
            <div className="px-4 py-10 text-center text-sm text-stone sm:px-6">No accounts found.</div>
          ) : (
            items.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-brand-dark">{u.username}</div>
                  <div className="mt-1 text-xs text-stone">
                    {u.role === "TALENT" ? "Model/Talent" : "Partner"} · Created{" "}
                    {new Date(u.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                  <SecondaryButton
                    type="button"
                    onClick={() => setRenameModal({ id: u.id, currentUsername: u.username, nextUsername: u.username })}
                    disabled={busy}
                    className="px-4 py-2 text-xs"
                  >
                    Change username
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => setResetModal({ id: u.id, username: u.username })}
                    disabled={busy}
                    className="px-4 py-2 text-xs"
                  >
                    Reset password
                  </SecondaryButton>
                  {deleteConfirm?.id === u.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ id: u.id, step: 2 })}
                        disabled={busy}
                        className="rounded-full border border-red-600/25 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        {deleteConfirm.step === 1 ? "Confirm delete" : "Final confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (deleteConfirm?.id === u.id) setDeleteConfirm(null);
                        }}
                        disabled={busy}
                        className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-black/60 hover:bg-black/5 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      {deleteConfirm.step === 2 ? (
                        <button
                          type="button"
                          onClick={() => onDelete(u.id)}
                          disabled={busy}
                          className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ id: u.id, step: 1 })}
                      disabled={busy}
                      className="rounded-full border border-red-600/25 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
