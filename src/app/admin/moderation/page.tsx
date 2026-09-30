import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/db";
import { GALLERY_MEDIA_DB_TYPES, galleryKindFromDbType } from "@/lib/gallery-media";
import { requireRole, resolveAppWorkspace } from "@/lib/session";
import { ModerationClient } from "./moderation-client";

export default async function AdminModerationPage() {
  const session = await requireRole(["ADMIN"]);
  const workspace = await resolveAppWorkspace(session);

  const [pendingAvatars, pendingGallery] = await Promise.all([
    prisma.talentProfile.findMany({
      where: { avatarReviewStatus: "PENDING", pendingAvatarStoragePath: { not: null } },
      orderBy: { pendingAvatarUpdatedAt: "asc" },
      select: { id: true, displayName: true, pendingAvatarUpdatedAt: true },
      take: 200,
    }),
    prisma.mediaItem.findMany({
      where: { type: { in: [...GALLERY_MEDIA_DB_TYPES] }, reviewStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        type: true,
        fileName: true,
        mimeType: true,
        createdAt: true,
        talentProfile: { select: { id: true, displayName: true } },
      },
      take: 400,
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#f6f7f5]">
      <AppNav role="ADMIN" workspace={workspace ?? { agencyName: "", agencySub: "" }} />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <ModerationClient
          pendingAvatars={pendingAvatars
            .filter((item) => item.pendingAvatarUpdatedAt)
            .map((item) => ({
              talentProfileId: item.id,
              displayName: item.displayName,
              submittedAt: item.pendingAvatarUpdatedAt!.toISOString(),
            }))}
          pendingGallery={pendingGallery.map((item) => ({
            mediaItemId: item.id,
            talentProfileId: item.talentProfile.id,
            displayName: item.talentProfile.displayName,
            kind: galleryKindFromDbType(item.type, item.mimeType),
            fileName: item.fileName,
            mimeType: item.mimeType,
            submittedAt: item.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
