"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { Chip, Modal, PrimaryButton, SecondaryButton } from "@/components/ui";
import { roleShellClass } from "@/lib/role-ui-theme-shared";

type Item = {
  id: string;
  username: string;
  talentProfileId: string;
  displayName: string;
  locationCity: string | null;
  locationCountry: string | null;
  avatarUpdatedAt: string | null;
  dateOfBirth: string | null;
  modelingTypes: string[];
  talents: string[];
  heightIn: number | null;
  updatedAt: string;
};

type OfferProjectType = "PHOTO_SHOOT" | "VIDEO_SHOOT" | "PHOTO_VIDEO_SHOOT" | "PERFORMANCE" | "HOSTING" | "OTHER";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean);
  return chars.join("") || "MP";
}

function formatHeight(totalInches: number | null) {
  if (!totalInches) return null;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return `${feet}′${inches}″`;
}

function getAge(dateOfBirthIso: string | null) {
  if (!dateOfBirthIso) return null;
  const dob = new Date(dateOfBirthIso);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

export function PartnerDirectoryClient(props: {
  initialItems: Item[];
  initialFilters: { q: string; city: string; country: string; minH: number | null; maxH: number | null };
  glassThemeEnabled: boolean;
  workspace?: { agencyName: string; agencySub: string };
}) {
  const router = useRouter();
  const [filters, setFilters] = useState(props.initialFilters);

  const [offerFor, setOfferFor] = useState<Item | null>(null);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerDate, setOfferDate] = useState("");
  const [offerStartTime, setOfferStartTime] = useState("");
  const [offerEndTime, setOfferEndTime] = useState("");
  const [offerAmountPhp, setOfferAmountPhp] = useState("");
  const [offerTransportAllowance, setOfferTransportAllowance] = useState(false);
  const [offerProjectType, setOfferProjectType] = useState<OfferProjectType>("PHOTO_SHOOT");
  const [sending, setSending] = useState(false);
  const [offerFeedback, setOfferFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.q.trim()) p.set("q", filters.q.trim());
    if (filters.city.trim()) p.set("city", filters.city.trim());
    if (filters.country.trim()) p.set("country", filters.country.trim());
    if (filters.minH !== null && String(filters.minH).trim()) p.set("minH", String(filters.minH));
    if (filters.maxH !== null && String(filters.maxH).trim()) p.set("maxH", String(filters.maxH));
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [filters]);

  function applyFilters() {
    router.push(`/partner/directory${qs}`);
  }

  async function sendOffer() {
    if (!offerFor) return;
    setSending(true);
    setOfferFeedback(null);
    try {
      const amount = Number(offerAmountPhp);
      if (!offerDate) {
        setOfferFeedback({ kind: "error", message: "Please select a date." });
        return;
      }
      if (!offerStartTime || !offerEndTime) {
        setOfferFeedback({ kind: "error", message: "Please set a start and end time." });
        return;
      }
      if (!Number.isFinite(amount) || amount < 0) {
        setOfferFeedback({ kind: "error", message: "Please enter a valid amount in PHP." });
        return;
      }
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          talentId: offerFor.id,
          title: offerTitle.trim() || "Offer",
          projectDate: offerDate,
          startTime: offerStartTime,
          endTime: offerEndTime,
          amountPhp: Math.round(amount),
          transportAllowance: offerTransportAllowance,
          projectType: offerProjectType,
          message: offerMessage.trim() ? offerMessage.trim() : null,
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        setOfferFeedback({ kind: "error", message: msg || "Failed to send offer." });
        return;
      }
      setOfferFor(null);
      setOfferTitle("");
      setOfferMessage("");
      setOfferDate("");
      setOfferStartTime("");
      setOfferEndTime("");
      setOfferAmountPhp("");
      setOfferTransportAllowance(false);
      setOfferProjectType("PHOTO_SHOOT");
      setOfferFeedback({ kind: "success", message: "Offer submitted for admin approval." });
    } catch {
      setOfferFeedback({ kind: "error", message: "Failed to send offer." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={roleShellClass(props.glassThemeEnabled)}>
      <AppNav role="PARTNER" workspace={props.workspace} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="rounded-[var(--radius-xl)] border-mist bg-surface p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-medium text-stone">Management</div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Model/Talent Directory</h1>
              <p className="mt-1 text-sm text-stone">
                Filter by name, location, and height. Projects require admin approval before the talent receives them.
              </p>
            </div>
            <div className="flex gap-2">
              <SecondaryButton onClick={() => router.refresh()}>Refresh</SecondaryButton>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-5">
            <label className="lg:col-span-2">
              <div className="text-xs font-semibold text-stone">Search</div>
              <input
                className="mt-1 h-11 w-full rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                placeholder="Name"
              />
            </label>
            <label>
              <div className="text-xs font-semibold text-stone">City</div>
              <input
                className="mt-1 h-11 w-full rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                value={filters.city}
                onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
                placeholder="e.g. Taguig"
              />
            </label>
            <label>
              <div className="text-xs font-semibold text-stone">Country</div>
              <input
                className="mt-1 h-11 w-full rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                value={filters.country}
                onChange={(e) => setFilters((p) => ({ ...p, country: e.target.value }))}
                placeholder="e.g. PH"
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
              <label className="w-full">
                <div className="text-xs font-semibold text-stone">Min height (in)</div>
                <input
                  inputMode="decimal"
                  className="mt-1 h-11 w-full rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                  value={filters.minH ?? ""}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, minH: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                />
              </label>
              <label className="w-full">
                <div className="text-xs font-semibold text-stone">Max height (in)</div>
                <input
                  inputMode="decimal"
                  className="mt-1 h-11 w-full rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                  value={filters.maxH ?? ""}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, maxH: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                />
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <PrimaryButton onClick={applyFilters}>Apply Filters</PrimaryButton>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {props.initialItems.map((t, i) => {
            const location = [t.locationCity, t.locationCountry].filter(Boolean).join(", ");
            const age = getAge(t.dateOfBirth);
            return (
              <div key={t.id} className="group overflow-hidden rounded-[var(--radius-lg)] border-mist bg-surface duration-[var(--duration-base)] ease-[var(--ease-out)] hover:shadow-raised">
                <div className="flex flex-col items-stretch sm:flex-row">
                  <div className="relative h-56 w-full shrink-0 overflow-hidden sm:h-auto sm:w-44">
                    <div className="absolute inset-0 z-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
                      {t.avatarUpdatedAt ? (
                        <Image
                          alt={`${t.displayName} avatar`}
                          src={`/api/avatars/${t.talentProfileId}?v=${encodeURIComponent(t.avatarUpdatedAt)}`}
                          fill
                          sizes="(max-width: 639px) 100vw, 176px"
                          className="object-cover"
                          unoptimized
                          priority={i === 0}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand to-brand-light text-2xl font-semibold text-white">
                          {initials(t.displayName)}
                        </div>
                      )}
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10">
                      <div className="truncate text-lg font-semibold text-white font-editorial">{t.displayName}</div>
                      <div className="truncate text-xs text-white/80">{location || "—"}</div>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        {age !== null ? <Chip>{age} yrs</Chip> : null}
                        {formatHeight(t.heightIn) ? <Chip>{formatHeight(t.heightIn)}</Chip> : null}
                      </div>

                      <div className="mt-3">
                        <div className="text-[10px] font-semibold tracking-widest text-stone">TYPE OF MODELING</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {t.modelingTypes.length ? (
                            t.modelingTypes.slice(0, 4).map((x) => <Chip key={x}>{x}</Chip>)
                          ) : (
                            <Chip>—</Chip>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-[10px] font-semibold tracking-widest text-stone">TALENTS</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {t.talents.length ? t.talents.slice(0, 4).map((x) => <Chip key={x}>{x}</Chip>) : <Chip>—</Chip>}
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-stone">Updated {fmtDate(t.updatedAt)}</div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Link
                        href={`/${encodeURIComponent(t.username || t.id)}`}
                        className="h-10 inline-flex w-full items-center justify-center rounded-[var(--radius-md)] border border-mist bg-surface px-4 text-sm font-medium text-graphite hover:bg-surface-subtle sm:w-auto"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        open={!!offerFor}
        title="Send Offer"
        subtitle={offerFor ? offerFor.displayName : undefined}
        onClose={() => setOfferFor(null)}
        widthClassName="max-w-2xl"
      >
        {offerFeedback ? (
          <div
            className={[
              "mb-4 rounded-[var(--radius-lg)] border px-4 py-3 text-sm",
              offerFeedback.kind === "success"
                ? "border-success/30 bg-success-bg/70 text-success-fg"
                : "border-error/30 bg-error-bg/70 text-error",
            ].join(" ")}
          >
            {offerFeedback.message}
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-3">
          <label>
            <div className="text-xs font-semibold text-stone">Title</div>
            <input
              className="mt-1 h-11 w-full rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={offerTitle}
              onChange={(e) => setOfferTitle(e.target.value)}
              placeholder="Commercial shoot - May 20"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="md:col-span-1">
              <div className="text-xs font-semibold text-stone">Date</div>
              <input
                type="date"
                className="mt-1 h-11 w-full rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                value={offerDate}
                onChange={(e) => setOfferDate(e.target.value)}
              />
            </label>
            <label className="md:col-span-1">
              <div className="text-xs font-semibold text-stone">Start time</div>
              <input
                type="time"
                className="mt-1 h-11 w-full rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                value={offerStartTime}
                onChange={(e) => setOfferStartTime(e.target.value)}
              />
            </label>
            <label className="md:col-span-1">
              <div className="text-xs font-semibold text-stone">End time</div>
              <input
                type="time"
                className="mt-1 h-11 w-full rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                value={offerEndTime}
                onChange={(e) => setOfferEndTime(e.target.value)}
              />
            </label>
          </div>

          <label>
            <div className="text-xs font-semibold text-stone">Amount (PHP)</div>
            <div className="mt-1 flex overflow-hidden rounded-[var(--radius-md)] border-mist bg-surface focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-light">
              <div className="flex items-center px-3 text-sm font-semibold text-stone">₱</div>
              <input
                inputMode="numeric"
                className="w-full bg-transparent px-3 py-2 text-sm text-ink placeholder:text-stone outline-none"
                value={offerAmountPhp}
                onChange={(e) => setOfferAmountPhp(e.target.value)}
                placeholder="10000"
              />
            </div>
          </label>

          <label className="flex items-center gap-2 text-sm text-graphite">
            <input
              type="checkbox"
              checked={offerTransportAllowance}
              onChange={(e) => setOfferTransportAllowance(e.target.checked)}
            />
            Add transportation allowance
          </label>

          <label>
            <div className="text-xs font-semibold text-stone">Project type</div>
            <select
              className="mt-1 h-11 w-full rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-graphite outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={offerProjectType}
              onChange={(e) => setOfferProjectType(e.target.value as OfferProjectType)}
            >
              <option value="PHOTO_SHOOT">Photoshoot</option>
              <option value="VIDEO_SHOOT">Video shoot</option>
              <option value="PHOTO_VIDEO_SHOOT">Photo and video shoot</option>
              <option value="PERFORMANCE">Performance</option>
              <option value="HOSTING">Hosting</option>
              <option value="OTHER">Other</option>
            </select>
          </label>

          <label>
            <div className="text-xs font-semibold text-stone">Message</div>
            <textarea
              className="mt-1 w-full rounded-[var(--radius-md)] border-mist bg-surface px-4 py-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              rows={5}
              placeholder="Shoot details, call time, location, usage, etc."
            />
          </label>
        </div>
        <div className="mt-4 rounded-[var(--radius-lg)] border-mist bg-surface-subtle px-4 py-3 text-sm text-stone">
          Note: Admin has visibility on this offer and must approve it before the talent receives it.
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <SecondaryButton onClick={() => setOfferFor(null)} disabled={sending}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={sendOffer} disabled={sending}>
            {sending ? "Sending..." : "Send"}
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
