-- AlterTable
ALTER TABLE "TalentProfile" ADD COLUMN "avatarReviewNotes" TEXT;
ALTER TABLE "TalentProfile" ADD COLUMN "avatarReviewStatus" TEXT;
ALTER TABLE "TalentProfile" ADD COLUMN "avatarReviewedAt" DATETIME;
ALTER TABLE "TalentProfile" ADD COLUMN "avatarReviewedById" TEXT;
ALTER TABLE "TalentProfile" ADD COLUMN "pendingAvatarFileName" TEXT;
ALTER TABLE "TalentProfile" ADD COLUMN "pendingAvatarMimeType" TEXT;
ALTER TABLE "TalentProfile" ADD COLUMN "pendingAvatarStoragePath" TEXT;
ALTER TABLE "TalentProfile" ADD COLUMN "pendingAvatarUpdatedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MediaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentProfileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "url" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "storagePath" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "reviewStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "reviewNotes" TEXT,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    CONSTRAINT "MediaItem_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MediaItem" ("createdAt", "fileName", "id", "mimeType", "sortOrder", "storagePath", "talentProfileId", "title", "type", "url") SELECT "createdAt", "fileName", "id", "mimeType", "sortOrder", "storagePath", "talentProfileId", "title", "type", "url" FROM "MediaItem";
DROP TABLE "MediaItem";
ALTER TABLE "new_MediaItem" RENAME TO "MediaItem";
CREATE INDEX "MediaItem_talentProfileId_idx" ON "MediaItem"("talentProfileId");
CREATE INDEX "MediaItem_talentProfileId_reviewStatus_idx" ON "MediaItem"("talentProfileId", "reviewStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
