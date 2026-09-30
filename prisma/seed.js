require("dotenv/config");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function upsertUser({ email, password, role, name }) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, role, name },
    update: { passwordHash, role, name },
  });
}

async function main() {
  const admin = await upsertUser({
    email: "admin@portal.local",
    password: "admin1234",
    role: "ADMIN",
    name: "Admin",
  });

  await upsertUser({
    email: "partner@portal.local",
    password: "partner1234",
    role: "PARTNER",
    name: "Partner",
  });

  const talent = await upsertUser({
    email: "talent@portal.local",
    password: "talent1234",
    role: "TALENT",
    name: "Victoria Gomez",
  });

  const profile = await prisma.talentProfile.upsert({
    where: { userId: talent.id },
    create: {
      userId: talent.id,
      displayName: "Victoria Gomez",
      alias: "Victoria",
      dateOfBirth: new Date("1999-06-10"),
      locationCity: "Bonifacio Global City, Taguig",
      locationCountry: "Philippines",
      phoneNumber: "+63 931 442 4824",
      employmentStatus: "Self-Employed",
      educationLevel: "Postgraduate",
      collegeCourse: "MA Fashion Design",
      nationality: "Filipino-Spanish",
      experienceYears: 6,
      modelingTypes: ["Runway", "Catwalk", "Fashion", "Commercial"],
      talents: ["Acting", "Hosting", "Public Speaking", "Voiceover"],
      heightIn: 66,
      weightLbs: 125,
      skinTone: "Medium",
      eyeColor: "Hazel",
      shirtSize: "S",
      shoeSize: 7.5,
      tattoos: false,
      piercings: true,
      piercingLocations: "Ears, Belly button",
      birthmarks: true,
      birthmarkLocations: "Left cheek",
      measurements: { create: { unit: "in", bust: 34, underBust: 28, naturalWaist: 24, hips: 36, waistToFloor: 41, hollowToHem: 57, shoulderWidth: 14.5, backLength: 15 } },
      socialLinks: {
        create: [
          { platform: "Instagram", handle: "victoriagomez_ph", followers: 96300, url: "https://instagram.com/victoriagomez_ph" },
          { platform: "Tiktok", handle: "victoriagomez", followers: 234000, url: "https://tiktok.com/@victoriagomez" },
          { platform: "YouTube", handle: "Victoria Gomez", followers: 31500, url: "https://youtube.com" },
          { platform: "Facebook", handle: "Victoria Gomez Official", followers: 44700, url: "https://facebook.com" },
          { platform: "X", handle: "victoriagomez_", followers: 11200, url: "https://x.com" },
        ],
      },
    },
    update: {
      displayName: "Victoria Gomez",
      alias: "Victoria",
      dateOfBirth: new Date("1999-06-10"),
      locationCity: "Bonifacio Global City, Taguig",
      locationCountry: "Philippines",
      phoneNumber: "+63 931 442 4824",
      employmentStatus: "Self-Employed",
      educationLevel: "Postgraduate",
      collegeCourse: "MA Fashion Design",
      nationality: "Filipino-Spanish",
      experienceYears: 6,
      modelingTypes: ["Runway", "Catwalk", "Fashion", "Commercial"],
      talents: ["Acting", "Hosting", "Public Speaking", "Voiceover"],
      heightIn: 66,
      weightLbs: 125,
      skinTone: "Medium",
      eyeColor: "Hazel",
      shirtSize: "S",
      shoeSize: 7.5,
      tattoos: false,
      piercings: true,
      piercingLocations: "Ears, Belly button",
      birthmarks: true,
      birthmarkLocations: "Left cheek",
    },
    select: { id: true },
  });

  await prisma.socialLink.deleteMany({ where: { talentProfileId: profile.id } });
  await prisma.socialLink.createMany({
    data: [
      { talentProfileId: profile.id, platform: "Instagram", handle: "victoriagomez_ph", followers: 96300, url: "https://instagram.com/victoriagomez_ph" },
      { talentProfileId: profile.id, platform: "Tiktok", handle: "victoriagomez", followers: 234000, url: "https://tiktok.com/@victoriagomez" },
      { talentProfileId: profile.id, platform: "YouTube", handle: "Victoria Gomez", followers: 31500, url: "https://youtube.com" },
      { talentProfileId: profile.id, platform: "Facebook", handle: "Victoria Gomez Official", followers: 44700, url: "https://facebook.com" },
      { talentProfileId: profile.id, platform: "X", handle: "victoriagomez_", followers: 11200, url: "https://x.com" },
    ],
  });

  const others = [
    { name: "Ariana Cruz", city: "Makati", country: "Philippines", heightIn: 68, modelingTypes: ["Commercial", "Beauty"], talents: ["Acting"] },
    { name: "Noah Reyes", city: "Quezon City", country: "Philippines", heightIn: 71, modelingTypes: ["Runway", "Editorial"], talents: ["Public Speaking"] },
    { name: "Lea Santos", city: "Cebu", country: "Philippines", heightIn: 64, modelingTypes: ["Lifestyle", "Commercial"], talents: ["Hosting"] },
  ];

  for (const t of others) {
    const u = await upsertUser({
      email: `${t.name.toLowerCase().replace(/\s+/g, ".")}@portal.local`,
      password: "talent1234",
      role: "TALENT",
      name: t.name,
    });

    await prisma.talentProfile.upsert({
      where: { userId: u.id },
      create: {
        userId: u.id,
        displayName: t.name,
        locationCity: t.city,
        locationCountry: t.country,
        heightIn: t.heightIn,
        modelingTypes: t.modelingTypes,
        talents: t.talents,
        measurements: { create: {} },
        socialLinks: { create: [{ platform: "Instagram" }] },
      },
      update: {
        displayName: t.name,
        locationCity: t.city,
        locationCountry: t.country,
        heightIn: t.heightIn,
        modelingTypes: t.modelingTypes,
        talents: t.talents,
      },
    });
  }

  console.log("Seed complete:", { admin: admin.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
