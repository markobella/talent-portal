import Image from "next/image";
import { notFound } from "next/navigation";
import { resolveTalentShowcase } from "@/lib/talent-showcase";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getAge(dateOfBirthIso: string | null) {
  if (!dateOfBirthIso) return null;
  const dob = new Date(dateOfBirthIso);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

function formatHeight(totalInches: number | null) {
  if (!totalInches) return null;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return `${feet}′${inches}″`;
}

function experienceLabelFromYears(years: number | null) {
  if (years === null) return "No experience listed";
  if (years < 0.5) return "Less than 6 months";
  if (years < 1.5) return "6 months to 1 year";
  if (years < 2.5) return "1 to 2 years";
  if (years < 5.5) return "2 to 5 years";
  return "More than 5 years";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map((part) => part[0]?.toUpperCase()).filter(Boolean);
  return chars.join("") || "MP";
}

function compactNumber(value: number) {
  try {
    return new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);
  } catch {
    return value.toLocaleString();
  }
}

function measureLabel(unit: "in" | "cm") {
  return unit === "cm" ? "cm" : "in";
}

function valueOrDash(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const text = String(value).trim();
  return text ? text : "—";
}

function SectionTitle(props: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-black/5 pb-2">
      <h2 className="font-editorial text-[1.35rem] leading-none text-brand-dark">{props.title}</h2>
      {props.subtitle ? <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#8e6c1d]">{props.subtitle}</p> : null}
    </div>
  );
}

function DetailRow(props: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={props.compact ? "grid min-w-0 grid-cols-[84px_minmax(0,1fr)] gap-3 py-1" : "grid min-w-0 grid-cols-[108px_minmax(0,1fr)] gap-3 border-b border-black/5 py-2 last:border-b-0"}>
      <div className="min-w-0 text-[11px] uppercase tracking-[0.14em] text-black/40">{props.label}</div>
      <div className="min-w-0 break-words text-[13px] leading-5 text-black/80">{props.value}</div>
    </div>
  );
}

function FieldItem(props: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-black/5 pb-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-black/40">{props.label}</div>
      <div className="mt-1 min-w-0 break-words text-[13px] font-medium leading-5 text-black/80">{props.value}</div>
    </div>
  );
}

export default async function ShowcasePage(props: { params: Promise<{ username: string }> }) {
  const { username } = await props.params;
  const showcase = await resolveTalentShowcase(username);

  if (!showcase) notFound();

  const age = getAge(showcase.profile.dateOfBirth);
  const location = [showcase.profile.locationCity, showcase.profile.locationCountry].filter(Boolean).join(", ");
  const totalFollowers = showcase.socialLinks.reduce((sum, link) => sum + (link.followers ?? 0), 0);
  const avatarSrc = showcase.profile.avatarUpdatedAt
    ? `/api/public/avatars/${showcase.profile.id}?v=${encodeURIComponent(showcase.profile.avatarUpdatedAt)}`
    : null;

  const measurementRows = showcase.measurements
    ? [
        { label: "Bust", value: showcase.measurements.bust },
        { label: "Under Bust", value: showcase.measurements.underBust },
        { label: "Waist", value: showcase.measurements.naturalWaist },
        { label: "Hips", value: showcase.measurements.hips },
        { label: "Waist to Floor", value: showcase.measurements.waistToFloor },
        { label: "Hollow to Hem", value: showcase.measurements.hollowToHem },
        { label: "Shoulder Width", value: showcase.measurements.shoulderWidth },
        { label: "Back Length", value: showcase.measurements.backLength },
      ]
    : [];

  const summaryLine =
    showcase.profile.talents.length || showcase.profile.modelingTypes.length
      ? `Experienced in ${showcase.profile.modelingTypes.join(", ") || "professional modeling"}${showcase.profile.talents.length ? ` with strengths in ${showcase.profile.talents.join(", ")}` : ""}.`
      : "Professional talent profile prepared for manager, agency, and brand submissions.";

  const portfolioItems = showcase.galleryItems.slice(0, 6);
  const socialSummary = showcase.socialLinks
    .map((link) => {
      const handle = link.handle ? `@${link.handle}` : "—";
      const followers = link.followers !== null ? `${compactNumber(link.followers)} followers` : "—";
      return {
        platform: link.platform,
        handle,
        followers,
      };
    })
    .filter((link) => link.platform.trim().length > 0);

  if (!showcase.profile.firstApprovedAt) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#ece6db] px-6 py-16">
        <div className="w-full max-w-md rounded-[28px] border border-black/5 bg-[#fbfaf6] px-8 py-12 text-center shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          {showcase.partner?.id && showcase.partner?.logoUpdatedAt ? (
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-brand-light">
              <img
                alt=""
                src={`/api/public/partner-logos/${encodeURIComponent(showcase.partner.id)}?v=${encodeURIComponent(showcase.partner.logoUpdatedAt)}`}
                className="h-20 w-20 object-cover"
              />
            </div>
          ) : (
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#24584E]/10">
              <svg className="h-8 w-8 text-[#24584E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          )}
          {showcase.partner?.name ? (
            <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-[#8e6c1d]">{showcase.partner.name}</div>
          ) : null}
          <h1 className="font-editorial text-[28px] leading-[1.1] text-brand-dark">Profile under review</h1>
          <p className="mt-4 text-[14px] leading-7 text-black/60">
            This talent profile is being reviewed by their management and is not yet live on the platform.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#ece6db] px-3 py-4 text-black/80 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto w-full max-w-[8.5in] overflow-hidden rounded-[28px] border border-black/5 bg-[#fbfaf6] shadow-[0_20px_60px_rgba(0,0,0,0.12)] print:rounded-none print:border-0 print:shadow-none">
        <section className="min-h-[11in] px-[0.45in] py-[0.45in]">
          <div className="relative overflow-hidden rounded-[30px] border border-black/5 bg-[#fbfaf6] px-5 py-5 sm:px-6 sm:py-6">
            <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(228,166,46,0.18),transparent_38%),radial-gradient(circle_at_85%_32%,rgba(36,84,62,0.12),transparent_44%)]" />
            <div className="relative z-10 grid gap-5 border-b border-black/5 pb-5 md:grid-cols-[2.35in_1fr]">
            <div className="flex">
              <div className="relative h-full min-h-[4.2in] w-full overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-[0_18px_36px_-28px_rgba(0,0,0,0.32)]">
                {avatarSrc ? (
                  <Image
                    alt={`${showcase.profile.displayName} portrait`}
                    src={avatarSrc}
                    fill
                    sizes="(max-width: 768px) 100vw, 2.35in"
                    className="object-cover"
                    unoptimized
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand to-brand-light text-5xl font-semibold text-white">
                    {initials(showcase.profile.displayName)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex min-w-0 flex-col justify-between">
              <div>
                {showcase.partner?.id ? (
                  <div className="flex items-center gap-2 min-w-0">
                    {showcase.partner.logoUpdatedAt ? (
                      <div className="flex-shrink-0 h-5 w-5 rounded-md overflow-hidden bg-[#8e6c1d]/10">
                        <img
                          alt=""
                          src={`/api/public/partner-logos/${encodeURIComponent(showcase.partner.id)}?v=${encodeURIComponent(showcase.partner.logoUpdatedAt)}`}
                          className="h-5 w-5 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 h-5 w-5 rounded-md flex items-center justify-center bg-[#8e6c1d]/10">
                        <svg className="h-3.5 w-3.5 text-[#8e6c1d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 text-[11px] uppercase tracking-[0.22em] text-[#8e6c1d] leading-none truncate">
                      {showcase.partner.name ?? "Agency"}
                    </div>
                  </div>
                ) : null}
                <h1 className={`${showcase.partner?.id ? "mt-3" : "mt-0"} font-editorial text-[2.1rem] leading-[1] text-brand-dark sm:text-[2.5rem]`}>
                  {showcase.profile.displayName}
                </h1>
                {showcase.profile.alias ? <div className="mt-2 text-[1rem] italic text-brand-dark/60">“{showcase.profile.alias}”</div> : null}

                <div className="mt-4 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  <DetailRow label="Location" value={valueOrDash(location)} compact />
                  <DetailRow label="Age" value={age !== null ? `${age}` : "—"} compact />
                  <DetailRow label="Height" value={valueOrDash(formatHeight(showcase.profile.heightIn))} compact />
                  <DetailRow label="Weight" value={showcase.profile.weightLbs ? `${showcase.profile.weightLbs} lbs` : "—"} compact />
                  <DetailRow label="Experience" value={experienceLabelFromYears(showcase.profile.experienceYears)} compact />
                  <DetailRow label="Reach" value={totalFollowers ? `${compactNumber(totalFollowers)} followers` : "—"} compact />
                </div>

                <p className="mt-4 text-[13px] leading-6 text-black/70">{summaryLine}</p>
              </div>

              <div className="mt-5 border-t border-black/5 pt-4">
                <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  <DetailRow label="Modeling" value={valueOrDash(showcase.profile.modelingTypes.join(", "))} compact />
                  <DetailRow label="Talents" value={valueOrDash(showcase.profile.talents.join(", "))} compact />
                  <DetailRow label="Updated" value={fmtDate(showcase.profile.updatedAt)} compact />
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[1.08fr_0.92fr]">
            <section className="rounded-[28px] border border-black/5 bg-white/70 px-5 py-5">
              <SectionTitle title="Vitals" subtitle="Core submission details" />
              <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
                <FieldItem label="Skin Tone" value={valueOrDash(showcase.profile.skinTone)} />
                <FieldItem label="Eye Color" value={valueOrDash(showcase.profile.eyeColor)} />
                <FieldItem label="Shirt Size" value={valueOrDash(showcase.profile.shirtSize)} />
                <FieldItem label="Pants Size" value={valueOrDash(showcase.profile.pantsSize)} />
                <FieldItem label="Dress Size" value={valueOrDash(showcase.profile.dressSize)} />
                <FieldItem label="Shoe Size" value={valueOrDash(showcase.profile.shoeSize)} />
                <FieldItem label="Tattoos" value={showcase.profile.tattoos === null ? "—" : showcase.profile.tattoos ? "Yes" : "No"} />
                <FieldItem label="Piercings" value={showcase.profile.piercings === null ? "—" : showcase.profile.piercings ? "Yes" : "No"} />
                <FieldItem label="Birthmarks" value={showcase.profile.birthmarks === null ? "—" : showcase.profile.birthmarks ? "Yes" : "No"} />
                <FieldItem label="Tattoo Areas" value={valueOrDash(showcase.profile.tattooLocations)} />
                <FieldItem label="Piercing Areas" value={valueOrDash(showcase.profile.piercingLocations)} />
                <FieldItem label="Birthmark Areas" value={valueOrDash(showcase.profile.birthmarkLocations)} />
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white/70 px-5 py-5">
              <SectionTitle title="Measurements" subtitle={showcase.measurements ? `All values in ${measureLabel(showcase.measurements.unit)}` : "No measurements listed"} />
              {showcase.measurements ? (
                (() => {
                  const measurements = showcase.measurements;
                  return (
                    <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
                      {measurementRows.map((item) => (
                        <FieldItem
                          key={item.label}
                          label={item.label}
                          value={item.value !== null ? `${item.value} ${measureLabel(measurements.unit)}` : "—"}
                        />
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="mt-3 text-[13px] leading-6 text-black/60">Measurements will appear here when available.</div>
              )}
            </section>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[1.08fr_0.92fr]">
            <section className="rounded-[28px] border border-black/5 bg-white/70 px-5 py-5">
              <SectionTitle title="Portfolio" subtitle="Selected approved media" />
              {portfolioItems.length ? (
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="overflow-hidden rounded-[22px] border border-black/10 bg-white shadow-[0_12px_26px_-24px_rgba(0,0,0,0.28)]">
                      <div className="relative aspect-[4/5]">
                        {item.kind === "VIDEO" ? (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(36,84,62,0.15),rgba(228,166,46,0.14))] px-4 text-center text-[12px] uppercase tracking-[0.16em] text-brand-dark/70">
                            Video Sample
                          </div>
                        ) : (
                          <Image
                            alt={item.fileName ?? "Portfolio image"}
                            src={`/api/public/gallery/${item.id}?v=${encodeURIComponent(item.createdAt)}`}
                            fill
                            sizes="(max-width: 768px) 50vw, 2in"
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-[13px] leading-6 text-black/60">No approved portfolio items yet.</div>
              )}
            </section>

            <section className="space-y-5">
              <section className="rounded-[28px] border border-black/5 bg-white/70 px-5 py-5">
                <SectionTitle title="Experience" subtitle="Projects, titles, and certifications" />
                {showcase.experienceItems.length ? (
                  <div className="mt-3 space-y-2">
                    {showcase.experienceItems.slice(0, 6).map((item) => (
                      <div key={item.id} className="border-b border-black/5 pb-2 last:border-b-0 last:pb-0">
                        <div className="text-[13px] font-medium text-brand-dark">{item.title}</div>
                        <div className="mt-1 text-[12px] leading-5 text-black/60">
                          {[item.kind === "PROJECT" ? "Project" : item.kind === "TITLE" ? "Title" : "Certification", item.role, item.when || fmtDate(item.createdAt)]
                            .filter(Boolean)
                            .join(" • ")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-[13px] leading-6 text-black/60">No experience entries yet.</div>
                )}
              </section>

              <section className="rounded-[28px] border border-black/5 bg-white/70 px-5 py-5">
                <SectionTitle title="Social Media" subtitle="Platform presence" />
                {socialSummary.length ? (
                  <div className="mt-3">
                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 border-b border-black/5 pb-2 text-[10px] uppercase tracking-[0.14em] text-black/40">
                      <div>Platform</div>
                      <div>Username</div>
                      <div className="text-right">Followers</div>
                    </div>
                    <div className="mt-1 space-y-2">
                      {socialSummary.map((entry) => (
                        <div
                          key={entry.platform}
                          className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-3 border-b border-black/5 pb-2 text-[13px] leading-5 text-black/80 last:border-b-0 last:pb-0"
                        >
                          <div className="min-w-0">
                            <div className="break-words font-medium text-brand-dark">{entry.platform}</div>
                          </div>
                          <div className="min-w-0">
                            <div className="break-words">{entry.handle}</div>
                          </div>
                          <div className="min-w-[92px] whitespace-nowrap text-right">{entry.followers}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-[13px] leading-6 text-black/60">No social profiles listed yet.</div>
                )}
              </section>
            </section>
          </div>

          <div className="mt-5 rounded-[28px] border border-black/5 bg-white/70 px-5 py-5">
            <SectionTitle title="Setcard" subtitle={showcase.setcard ? `Latest file added ${fmtDate(showcase.setcard.createdAt)}` : "No setcard uploaded"} />
            {showcase.setcard ? (
              showcase.setcard.mimeType.toLowerCase().includes("pdf") ? (
                <div className="mt-3 rounded-[22px] border border-black/5 bg-[#f6f2ec] px-4 py-4 text-[13px] leading-6 text-black/70">
                  Setcard is available as a PDF document in the talent record.
                </div>
              ) : (
                <div className="relative mt-3 aspect-[16/7] overflow-hidden rounded-[22px] border border-black/10 bg-white shadow-[0_12px_26px_-24px_rgba(0,0,0,0.28)]">
                  <Image
                    alt="Setcard"
                    src={`/api/public/setcards/${showcase.setcard.id}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 7.6in"
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )
            ) : (
              <div className="mt-3 text-[13px] leading-6 text-black/60">Setcard preview will appear here when available.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
