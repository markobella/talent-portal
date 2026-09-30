import { notFound } from "next/navigation";
import { TalentShowcaseDigital } from "./talent-showcase-digital";
import { resolveTalentShowcase } from "@/lib/talent-showcase";

const ASPECT_VARIANTS: { width: number; height: number }[] = [
  { width: 1600, height: 2000 },
  { width: 2400, height: 1600 },
  { width: 2000, height: 2000 },
  { width: 3000, height: 2000 },
  { width: 1800, height: 2400 },
  { width: 2800, height: 1800 },
  { width: 2200, height: 2800 },
  { width: 1500, height: 2100 },
];

export default async function DigitalShowcasePage(props: {
  params: Promise<{ username: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { username } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const showcase = await resolveTalentShowcase(username);
  if (!showcase) notFound();

  const rawCount = searchParams?.count;
  const countStr = Array.isArray(rawCount) ? rawCount[0] : rawCount;
  const targetCount = countStr ? parseInt(countStr, 10) : NaN;

  let galleryItems = showcase.galleryItems;
  if (
    process.env.NODE_ENV === "development" &&
    !Number.isNaN(targetCount) &&
    targetCount >= 1 &&
    showcase.galleryItems.length
  ) {
    const cappedCount = Math.min(targetCount, 11);
    const baseItems = showcase.galleryItems.filter((g) => g.kind === "PHOTO");
    const sourcePool = baseItems.length ? baseItems : showcase.galleryItems;
    const result: typeof showcase.galleryItems = [];
    for (let i = 0; i < cappedCount; i++) {
      const src = sourcePool[i % sourcePool.length];
      const variant = ASPECT_VARIANTS[i % ASPECT_VARIANTS.length];
      result.push({
        ...src,
        id: `${src.id}__test_${i}`,
        storagePath: src.id,
        width: variant.width,
        height: variant.height,
      });
    }
    galleryItems = result;
  }

  if (!showcase.profile.firstApprovedAt) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaf6] px-6 py-16">
        <div className="w-full max-w-md text-center">
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
            <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-black/40">{showcase.partner.name}</div>
          ) : null}
          <h1 className="font-editorial text-[32px] leading-[1.1] text-[#1A1A1A]">Profile under review</h1>
          <p className="mt-4 text-[15px] leading-7 text-black/60">
            This talent profile is being reviewed by their management and is not yet live on the platform.
          </p>
        </div>
      </main>
    );
  }

  return (
    <TalentShowcaseDigital
      avatarSrc={
        showcase.profile.avatarUpdatedAt
          ? `/api/public/avatars/${showcase.profile.id}?v=${encodeURIComponent(showcase.profile.avatarUpdatedAt)}`
          : null
      }
      avatarRouteBase="/api/public/avatars"
      galleryRouteBase="/api/public/gallery"
      setcardRouteBase="/api/public/setcards"
      profile={{
        id: showcase.profile.id,
        displayName: showcase.profile.displayName,
        alias: showcase.profile.alias,
        email: showcase.user.email,
        dateOfBirth: showcase.profile.dateOfBirth,
        locationCity: showcase.profile.locationCity,
        locationCountry: showcase.profile.locationCountry,
        avatarUpdatedAt: showcase.profile.avatarUpdatedAt,
        phoneNumber: showcase.profile.phoneNumber,
        employmentStatus: showcase.profile.employmentStatus,
        educationLevel: showcase.profile.educationLevel,
        collegeCourse: showcase.profile.collegeCourse,
        nationality: showcase.profile.nationality,
        showcaseShowBasicInfo: showcase.profile.showcaseShowBasicInfo,
        experienceYears: showcase.profile.experienceYears,
        modelingTypes: showcase.profile.modelingTypes,
        talents: showcase.profile.talents,
        heightIn: showcase.profile.heightIn,
        weightLbs: showcase.profile.weightLbs,
        skinTone: showcase.profile.skinTone,
        eyeColor: showcase.profile.eyeColor,
        shirtSize: showcase.profile.shirtSize,
        pantsSize: showcase.profile.pantsSize,
        dressSize: showcase.profile.dressSize,
        shoeSize: showcase.profile.shoeSize,
        tattoos: showcase.profile.tattoos,
        tattooLocations: showcase.profile.tattooLocations,
        piercings: showcase.profile.piercings,
        piercingLocations: showcase.profile.piercingLocations,
        birthmarks: showcase.profile.birthmarks,
        birthmarkLocations: showcase.profile.birthmarkLocations,
        aboutMe: showcase.profile.aboutMe,
        updatedAt: showcase.profile.updatedAt,
        firstApprovedAt: showcase.profile.firstApprovedAt,
        theme: showcase.profile.theme,
      }}
      partnerTheme={showcase.partner?.theme ?? null}
      partner={
        showcase.partner
          ? {
              id: showcase.partner.id,
              name: showcase.partner.name,
              logoUpdatedAt: showcase.partner.logoUpdatedAt,
            }
          : null
      }
      measurements={
        showcase.measurements
          ? {
              unit: showcase.measurements.unit,
              bust: showcase.measurements.bust,
              underBust: showcase.measurements.underBust,
              naturalWaist: showcase.measurements.naturalWaist,
              hips: showcase.measurements.hips,
              waistToFloor: showcase.measurements.waistToFloor,
              hollowToHem: showcase.measurements.hollowToHem,
              shoulderWidth: showcase.measurements.shoulderWidth,
              backLength: showcase.measurements.backLength,
            }
          : null
      }
      socialLinks={showcase.socialLinks}
      galleryItems={galleryItems}
      experienceItems={showcase.experienceItems}
      setcard={showcase.setcard}
      showContactInfo={showcase.profile.showcaseShowContactInfo}
    />
  );
}
