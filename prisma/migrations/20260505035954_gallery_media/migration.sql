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
    CONSTRAINT "MediaItem_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MediaItem" ("createdAt", "id", "sortOrder", "talentProfileId", "title", "type", "url") SELECT "createdAt", "id", "sortOrder", "talentProfileId", "title", "type", "url" FROM "MediaItem";
DROP TABLE "MediaItem";
ALTER TABLE "new_MediaItem" RENAME TO "MediaItem";
CREATE INDEX "MediaItem_talentProfileId_idx" ON "MediaItem"("talentProfileId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
