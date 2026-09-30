-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TalentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "displayName" TEXT NOT NULL,
    "alias" TEXT,
    "dateOfBirth" DATETIME,
    "locationCity" TEXT,
    "locationCountry" TEXT,
    "avatarFileName" TEXT,
    "avatarMimeType" TEXT,
    "avatarStoragePath" TEXT,
    "avatarUpdatedAt" DATETIME,
    "pendingAvatarFileName" TEXT,
    "pendingAvatarMimeType" TEXT,
    "pendingAvatarStoragePath" TEXT,
    "pendingAvatarUpdatedAt" DATETIME,
    "avatarReviewStatus" TEXT,
    "avatarReviewNotes" TEXT,
    "avatarReviewedAt" DATETIME,
    "avatarReviewedById" TEXT,
    "phoneNumber" TEXT,
    "employmentStatus" TEXT,
    "educationLevel" TEXT,
    "collegeCourse" TEXT,
    "nationality" TEXT,
    "showcaseShowContactInfo" BOOLEAN NOT NULL DEFAULT false,
    "showcaseShowBasicInfo" BOOLEAN NOT NULL DEFAULT false,
    "showcaseUseGlassTheme" BOOLEAN NOT NULL DEFAULT false,
    "experienceYears" INTEGER,
    "modelingTypes" JSONB,
    "talents" JSONB,
    "experienceItems" JSONB,
    "heightIn" REAL,
    "weightLbs" REAL,
    "skinTone" TEXT,
    "eyeColor" TEXT,
    "shirtSize" TEXT,
    "pantsSize" TEXT,
    "dressSize" TEXT,
    "shoeSize" REAL,
    "tattoos" BOOLEAN,
    "tattooLocations" TEXT,
    "piercings" BOOLEAN,
    "piercingLocations" TEXT,
    "birthmarks" BOOLEAN,
    "birthmarkLocations" TEXT,
    CONSTRAINT "TalentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TalentProfile" ("alias", "avatarFileName", "avatarMimeType", "avatarReviewNotes", "avatarReviewStatus", "avatarReviewedAt", "avatarReviewedById", "avatarStoragePath", "avatarUpdatedAt", "birthmarkLocations", "birthmarks", "collegeCourse", "createdAt", "dateOfBirth", "displayName", "dressSize", "educationLevel", "employmentStatus", "experienceItems", "experienceYears", "eyeColor", "heightIn", "id", "locationCity", "locationCountry", "modelingTypes", "nationality", "pantsSize", "pendingAvatarFileName", "pendingAvatarMimeType", "pendingAvatarStoragePath", "pendingAvatarUpdatedAt", "phoneNumber", "piercingLocations", "piercings", "shirtSize", "shoeSize", "showcaseShowBasicInfo", "showcaseShowContactInfo", "skinTone", "talents", "tattooLocations", "tattoos", "updatedAt", "userId", "weightLbs") SELECT "alias", "avatarFileName", "avatarMimeType", "avatarReviewNotes", "avatarReviewStatus", "avatarReviewedAt", "avatarReviewedById", "avatarStoragePath", "avatarUpdatedAt", "birthmarkLocations", "birthmarks", "collegeCourse", "createdAt", "dateOfBirth", "displayName", "dressSize", "educationLevel", "employmentStatus", "experienceItems", "experienceYears", "eyeColor", "heightIn", "id", "locationCity", "locationCountry", "modelingTypes", "nationality", "pantsSize", "pendingAvatarFileName", "pendingAvatarMimeType", "pendingAvatarStoragePath", "pendingAvatarUpdatedAt", "phoneNumber", "piercingLocations", "piercings", "shirtSize", "shoeSize", "showcaseShowBasicInfo", "showcaseShowContactInfo", "skinTone", "talents", "tattooLocations", "tattoos", "updatedAt", "userId", "weightLbs" FROM "TalentProfile";
DROP TABLE "TalentProfile";
ALTER TABLE "new_TalentProfile" RENAME TO "TalentProfile";
CREATE UNIQUE INDEX "TalentProfile_userId_key" ON "TalentProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
