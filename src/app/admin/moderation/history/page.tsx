import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/db";
import { requireRole, resolveAppWorkspace } from "@/lib/session";
import { ModerationHistoryClient } from "./history-client";

type AuditDetails = {
  displayName?: unknown;
  fileName?: unknown;
  notes?: unknown;
  talentProfileId?: unknown;
};

export default async function AdminModerationHistoryPage() {
  const session = await requireRole(["ADMIN"]);
  const workspace = await resolveAppWorkspace(session);

  const history = await prisma.adminAuditLog.findMany({
    where: {
      action: {
        in: [
          "AVATAR_APPROVE",
          "AVATAR_DENY",
          "GALLERY_PHOTO_APPROVE",
          "GALLERY_PHOTO_DENY",
          "GALLERY_VIDEO_APPROVE",
          "GALLERY_VIDEO_DENY",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      createdAt: true,
      action: true,
      details: true,
      actor: { select: { email: true, name: true } },
    },
  });

  return (
    <div className="min-h-screen bg-[#f6f7f5]">
      <AppNav role="ADMIN" workspace={workspace ?? { agencyName: "", agencySub: "" }} />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <ModerationHistoryClient
          history={history.map((item) => {
            const details = (item.details ?? {}) as AuditDetails;
            const displayName = typeof details.displayName === "string" ? details.displayName : "Unknown model";
            const fileName = typeof details.fileName === "string" ? details.fileName : null;
            const notes = typeof details.notes === "string" ? details.notes : null;
            const talentProfileId = typeof details.talentProfileId === "string" ? details.talentProfileId : null;
            return {
              id: item.id,
              createdAt: item.createdAt.toISOString(),
              actorName: item.actor.name ?? item.actor.email,
              action: item.action.endsWith("APPROVE") ? ("APPROVED" as const) : ("DENIED" as const),
              mediaKind: item.action.startsWith("AVATAR") ? ("AVATAR" as const) : ("GALLERY" as const),
              displayName,
              fileName,
              notes,
              talentProfileId,
            };
          })}
        />
      </div>
    </div>
  );
}
