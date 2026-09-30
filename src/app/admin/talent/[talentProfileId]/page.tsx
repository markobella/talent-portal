import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/db";
import { GALLERY_MEDIA_DB_TYPES, galleryKindFromDbType } from "@/lib/gallery-media";
import { requireRole, resolveAppWorkspace } from "@/lib/session";
import { AdminTalentEditor } from "./talent-editor";
import { MediaModerationPanel } from "./media-moderation-panel";
import { SetcardUploader } from "./setcard-uploader";

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default async function AdminTalentPage(props: { params: Promise<{ talentProfileId: string }> }) {
  const session = await requireRole(["ADMIN"]);
  const workspace = await resolveAppWorkspace(session);
  const { talentProfileId } = await props.params;

  const profile = await prisma.talentProfile.findUnique({
    where: { id: talentProfileId },
    select: {
      id: true,
      displayName: true,
      updatedAt: true,
      avatarUpdatedAt: true,
      pendingAvatarUpdatedAt: true,
      avatarReviewStatus: true,
      alias: true,
      dateOfBirth: true,
      locationCity: true,
      locationCountry: true,
      phoneNumber: true,
      employmentStatus: true,
      educationLevel: true,
      collegeCourse: true,
      nationality: true,
      experienceYears: true,
      modelingTypes: true,
      talents: true,
      heightIn: true,
      weightLbs: true,
      skinTone: true,
      eyeColor: true,
      shirtSize: true,
      pantsSize: true,
      dressSize: true,
      shoeSize: true,
      tattoos: true,
      tattooLocations: true,
      piercings: true,
      piercingLocations: true,
      birthmarks: true,
      birthmarkLocations: true,
      user: { select: { email: true } },
      measurements: {
        select: {
          unit: true,
          bust: true,
          underBust: true,
          naturalWaist: true,
          hips: true,
          waistToFloor: true,
          hollowToHem: true,
          shoulderWidth: true,
          backLength: true,
          updatedAt: true,
        },
      },
      socialLinks: {
        orderBy: { platform: "asc" },
        select: { platform: true, handle: true, url: true, followers: true },
      },
      setcards: { orderBy: { createdAt: "desc" }, select: { id: true, fileName: true, createdAt: true }, take: 5 },
      mediaItems: {
        where: { type: { in: [...GALLERY_MEDIA_DB_TYPES] }, reviewStatus: "PENDING" },
        orderBy: { createdAt: "asc" },
        select: { id: true, type: true, fileName: true, mimeType: true, createdAt: true },
      },
      updateLogs: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, createdAt: true, section: true, actor: { select: { email: true } } },
      },
    },
  });

  if (!profile) return null;

  const modelingTypes = Array.isArray(profile.modelingTypes)
    ? profile.modelingTypes.filter((x): x is string => typeof x === "string")
    : [];
  const talents = Array.isArray(profile.talents)
    ? profile.talents.filter((x): x is string => typeof x === "string")
    : [];

  return (
    <div className="min-h-screen bg-[#f6f7f5]">
      <AppNav role="ADMIN" workspace={workspace} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="text-sm font-medium text-black/60">Admin</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight font-display sm:text-3xl">
            {profile.displayName}
          </h1>
          <div className="mt-2 text-sm text-black/60">
            {profile.user.email} · Updated {fmtDate(profile.updatedAt)}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:col-span-1">
            <div className="text-sm font-semibold tracking-tight">Setcard</div>
            <div className="mt-1 text-xs text-black/40">Only admins can upload setcards.</div>
            <div className="mt-4">
              <SetcardUploader talentProfileId={profile.id} />
            </div>
            <div className="mt-4 grid gap-2">
              {profile.setcards.map((s) => (
                <a
                  key={s.id}
                  href={`/api/setcards/${s.id}`}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black/70 hover:bg-black/5"
                >
                  <div className="truncate">{s.fileName}</div>
                  <div className="mt-1 text-xs font-normal text-black/40">{fmtDate(s.createdAt)}</div>
                </a>
              ))}
              {!profile.setcards.length ? (
                <div className="rounded-xl border border-black/5 bg-[#fafafa] px-4 py-6 text-center text-sm text-black/60">
                  No setcard uploaded yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-2">
            <AdminTalentEditor
              profile={{
                id: profile.id,
                displayName: profile.displayName,
                alias: profile.alias,
                dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : null,
                locationCity: profile.locationCity,
                locationCountry: profile.locationCountry,
                phoneNumber: profile.phoneNumber,
                employmentStatus: profile.employmentStatus,
                educationLevel: profile.educationLevel,
                collegeCourse: profile.collegeCourse,
                nationality: profile.nationality,
                experienceYears: profile.experienceYears,
                modelingTypes,
                talents,
                heightIn: profile.heightIn,
                weightLbs: profile.weightLbs,
                skinTone: profile.skinTone,
                eyeColor: profile.eyeColor,
                shirtSize: profile.shirtSize,
                pantsSize: profile.pantsSize,
                dressSize: profile.dressSize,
                shoeSize: profile.shoeSize,
                tattoos: profile.tattoos,
                tattooLocations: profile.tattooLocations,
                piercings: profile.piercings,
                piercingLocations: profile.piercingLocations,
                birthmarks: profile.birthmarks,
                birthmarkLocations: profile.birthmarkLocations,
                updatedAt: profile.updatedAt.toISOString(),
                avatarUpdatedAt: profile.avatarUpdatedAt ? profile.avatarUpdatedAt.toISOString() : null,
              }}
              measurements={
                profile.measurements
                  ? {
                      ...profile.measurements,
                      unit: profile.measurements.unit === "cm" ? "cm" : "in",
                      updatedAt: profile.measurements.updatedAt.toISOString(),
                    }
                  : null
              }
              socialLinks={profile.socialLinks}
            />
          </div>
        </div>

        <div className="mt-6">
          <MediaModerationPanel
            talentProfileId={profile.id}
            displayName={profile.displayName}
            pendingAvatarUpdatedAt={
              profile.avatarReviewStatus === "PENDING" && profile.pendingAvatarUpdatedAt
                ? profile.pendingAvatarUpdatedAt.toISOString()
                : null
            }
            pendingGalleryItems={profile.mediaItems.map((item) => ({
              id: item.id,
                kind: galleryKindFromDbType(item.type, item.mimeType),
              fileName: item.fileName,
                mimeType: item.mimeType,
              createdAt: item.createdAt.toISOString(),
            }))}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="text-sm font-semibold tracking-tight">Profile Update Log</div>
          <div className="mt-1 text-xs text-black/40">Tracks talent profile changes.</div>
          <div className="mt-4 rounded-2xl border border-black/5">
            <div className="grid gap-3 p-4 sm:hidden">
              {profile.updateLogs.map((l) => (
                <div key={l.id} className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
                  <div className="text-[10px] font-semibold tracking-widest text-black/40">WHEN</div>
                  <div className="mt-1 text-sm text-black/70">{fmtDate(l.createdAt)}</div>
                  <div className="mt-3 text-[10px] font-semibold tracking-widest text-black/40">SECTION</div>
                  <div className="mt-1 text-sm text-black/70">{l.section}</div>
                  <div className="mt-3 text-[10px] font-semibold tracking-widest text-black/40">ACTOR</div>
                  <div className="mt-1 text-sm text-black/60">{l.actor.email}</div>
                </div>
              ))}
              {!profile.updateLogs.length ? (
                <div className="px-4 py-6 text-center text-sm text-black/60">No updates logged yet.</div>
              ) : null}
            </div>
            <div className="no-scrollbar hidden overflow-x-auto sm:block">
              <div className="min-w-[520px]">
                <div className="grid grid-cols-3 bg-[#fafafa] px-4 py-2 text-[10px] font-semibold tracking-widest text-black/40">
                  <div>WHEN</div>
                  <div>SECTION</div>
                  <div>ACTOR</div>
                </div>
                {profile.updateLogs.map((l) => (
                  <div key={l.id} className="grid grid-cols-3 border-t border-black/5 px-4 py-3 text-sm">
                    <div className="text-black/70">{fmtDate(l.createdAt)}</div>
                    <div className="text-black/70">{l.section}</div>
                    <div className="text-black/60">{l.actor.email}</div>
                  </div>
                ))}
                {!profile.updateLogs.length ? (
                  <div className="border-t border-black/5 px-4 py-6 text-center text-sm text-black/60">
                    No updates logged yet.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
