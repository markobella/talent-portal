-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_ADMIN',
    "partnerId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectType" TEXT,
    "projectDate" DATETIME,
    "startTime" TEXT,
    "endTime" TEXT,
    "amountPhp" INTEGER,
    "transportAllowance" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "compensation" TEXT,
    "adminReviewedAt" DATETIME,
    "adminReviewerId" TEXT,
    "adminRejectionReason" TEXT,
    CONSTRAINT "Offer_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Offer_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Offer_adminReviewerId_fkey" FOREIGN KEY ("adminReviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Offer" ("adminRejectionReason", "adminReviewedAt", "adminReviewerId", "compensation", "createdAt", "id", "message", "partnerId", "status", "talentId", "title", "updatedAt") SELECT "adminRejectionReason", "adminReviewedAt", "adminReviewerId", "compensation", "createdAt", "id", "message", "partnerId", "status", "talentId", "title", "updatedAt" FROM "Offer";
DROP TABLE "Offer";
ALTER TABLE "new_Offer" RENAME TO "Offer";
CREATE INDEX "Offer_partnerId_idx" ON "Offer"("partnerId");
CREATE INDEX "Offer_talentId_idx" ON "Offer"("talentId");
CREATE INDEX "Offer_adminReviewerId_idx" ON "Offer"("adminReviewerId");
CREATE INDEX "Offer_status_idx" ON "Offer"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
