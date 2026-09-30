-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TalentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "displayName" TEXT NOT NULL,
    "alias" TEXT,
    "dateOfBirth" DATETIME,
    "locationCity" TEXT,
    "locationCountry" TEXT,
    "experienceYears" INTEGER,
    "modelingTypes" JSONB,
    "talents" JSONB,
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

-- CreateTable
CREATE TABLE "TalentMeasurements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentProfileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'in',
    "bust" REAL,
    "underBust" REAL,
    "naturalWaist" REAL,
    "hips" REAL,
    "waistToFloor" REAL,
    "hollowToHem" REAL,
    "shoulderWidth" REAL,
    "backLength" REAL,
    CONSTRAINT "TalentMeasurements_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentProfileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT,
    "url" TEXT,
    "followers" INTEGER,
    CONSTRAINT "SocialLink_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentProfileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MediaItem_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "partnerId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "compensation" TEXT,
    CONSTRAINT "Offer_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Offer_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setcard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentProfileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    CONSTRAINT "Setcard_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Setcard_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileUpdateLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentProfileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    CONSTRAINT "ProfileUpdateLog_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileUpdateLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_userId_key" ON "TalentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentMeasurements_talentProfileId_key" ON "TalentMeasurements"("talentProfileId");

-- CreateIndex
CREATE INDEX "SocialLink_talentProfileId_idx" ON "SocialLink"("talentProfileId");

-- CreateIndex
CREATE INDEX "MediaItem_talentProfileId_idx" ON "MediaItem"("talentProfileId");

-- CreateIndex
CREATE INDEX "Offer_partnerId_idx" ON "Offer"("partnerId");

-- CreateIndex
CREATE INDEX "Offer_talentId_idx" ON "Offer"("talentId");

-- CreateIndex
CREATE INDEX "Offer_status_idx" ON "Offer"("status");

-- CreateIndex
CREATE INDEX "Setcard_talentProfileId_idx" ON "Setcard"("talentProfileId");

-- CreateIndex
CREATE INDEX "ProfileUpdateLog_talentProfileId_idx" ON "ProfileUpdateLog"("talentProfileId");

-- CreateIndex
CREATE INDEX "ProfileUpdateLog_actorId_idx" ON "ProfileUpdateLog"("actorId");

-- CreateIndex
CREATE INDEX "ProfileUpdateLog_section_idx" ON "ProfileUpdateLog"("section");
