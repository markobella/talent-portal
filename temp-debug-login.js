// ========================================================
// Talent Portal Login Debug Script
// ========================================================
// Runs locally on laptop, uses YOUR .env (same Neon DB as live Vercel!)
// 1) Lists all users currently in Neon DB
// 2) Tests each username + password EXACTLY how NextAuth does (lowercase, bcrypt compare)
// 3) Auto-fixes any rows with wrong stored username casing / bad hashes
// ========================================================

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const DB_URL = process.env.DATABASE_URL;
console.log("DATABASE_URL loaded:", DB_URL ? DB_URL.slice(0, 40) + "..." : "❌ MISSING (check .env!)");
if (!DB_URL) {
  console.error("No DATABASE_URL in .env. ABORT.");
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL, max: 2 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Replicate auth.ts EXACTLY:
//     const username = credentials?.username?.toLowerCase().trim();
//     const user = prisma.user.findUnique({ where: { email: username } })
//            ?? prisma.user.findUnique({ where: { email: legacyEmailFromPublicUsername(username) ?? "" } })
//     bcrypt.compare(password, user.passwordHash);
function publicUsernameFromLoginIdentifier(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  const USERNAME_PATTERN = /^[a-z0-9._-]+$/;
  if (normalized.length >= 3 && normalized.length <= 40 && USERNAME_PATTERN.test(normalized)) {
    return normalized;
  }
  const atIndex = normalized.indexOf("@");
  if (atIndex <= 0) return null;
  const localPart = normalized.slice(0, atIndex);
  return localPart.length >= 3 && localPart.length <= 40 && USERNAME_PATTERN.test(localPart) ? localPart : null;
}
function legacyEmailFromPublicUsername(value) {
  const username = publicUsernameFromLoginIdentifier(value);
  return username ? `${username}@portal.local` : null;
}

async function findUserLikeNextAuthDoes(usernameInput) {
  const username = (usernameInput || "").toLowerCase().trim();
  if (!username) return null;
  const direct = await prisma.user.findUnique({ where: { email: username } }).catch(e => null);
  if (direct) {
    console.log(`   🔎 Lookup SUCCESS: findUnique(email = "${username}") → row FOUND`);
    return direct;
  }
  const legacyEmail = legacyEmailFromPublicUsername(username);
  console.log(`   🔎 direct lookup failed. Trying legacy email=${legacyEmail} ...`);
  if (legacyEmail) {
    const viaLegacy = await prisma.user.findUnique({ where: { email: legacyEmail } }).catch(e => null);
    if (viaLegacy) {
      console.log(`   🔎 Legacy lookup SUCCESS: findUnique(email = "${legacyEmail}") → row FOUND`);
      return viaLegacy;
    }
  }
  console.log(`   ❌ Both direct + legacy lookups FAILED. User with email="${username}" or email="${legacyEmail}" NOT FOUND in Neon.`);
  return null;
}

async function main() {
  console.log("\n========== STEP 1) All users currently in Neon User table ==========");
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, name: true, displayName: true, passwordHash: true },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });
  users.forEach((u, i) => {
    console.log(`${i + 1}. [${u.role}] email="${u.email}"  name="${u.name || ""}"  displayName="${u.displayName || ""}"  hash=${u.passwordHash ? u.passwordHash.slice(0, 14) + "..." : "❌ MISSING HASH"}`);
  });
  if (users.length === 0) {
    console.log("⚠️  NO USER ROWS IN NEON! Nothing to test. We'll INSERT 3 correct users below.");
  }

  console.log("\n========== STEP 2) Simulate NextAuth login for our 3 known credentials ==========");
  const testCases = [
    { username: "MarkAdmin2025",    password: "Admin123!",   role: "ADMIN",   displayName: null,                 realName: "mark" },
    { username: "MuseoManila2025",  password: "Partner123!", role: "PARTNER", displayName: "Museo Modeling & Events", realName: "museo" },
    { username: "Victoria1998",     password: "Talent123!",  role: "TALENT",  displayName: "Victoria Reyes",       realName: "victoria" },
  ];

  let anyFixed = false;

  for (const tc of testCases) {
    console.log(`\n--- Testing ${tc.role} login "${tc.username}" / "${tc.password}" ---`);
    const user = await findUserLikeNextAuthDoes(tc.username);
    if (!user) {
      console.log(`   🛠️  FIX: Upserting ${tc.role} row now (email in DB will be ${tc.username.toLowerCase()} with @portal.local for legacy compatibility + correct bcrypt hash).`);
      const pwHash = bcrypt.hashSync(tc.password, 10);
      const newEmailStored1 = tc.username.toLowerCase();                        // store plain lowercase username
      const newEmailStored2 = tc.username.toLowerCase() + "@portal.local";      // ALSO store legacy @portal.local so both lookups work

      // Insert the plain-username variant as the primary row
      const upserted1 = await prisma.user.upsert({
        where: { email: newEmailStored1 },
        create: {
          id: require("crypto").randomBytes(12).toString("hex"),
          email: newEmailStored1,
          passwordHash: pwHash,
          role: tc.role,
          name: tc.realName,
          displayName: tc.displayName,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          passwordHash: pwHash,
          name: tc.realName,
          displayName: tc.displayName,
          updatedAt: new Date(),
        },
      });
      console.log(`   ✅ Upsert #1 email="${newEmailStored1}" row id=${upserted1.id.slice(0, 16)}...`);

      // Insert legacy @portal.local variant too
      const upserted2 = await prisma.user.upsert({
        where: { email: newEmailStored2 },
        create: {
          id: require("crypto").randomBytes(12).toString("hex"),
          email: newEmailStored2,
          passwordHash: pwHash,
          role: tc.role,
          name: tc.realName,
          displayName: tc.displayName,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          passwordHash: pwHash,
          name: tc.realName,
          displayName: tc.displayName,
          updatedAt: new Date(),
        },
      });
      console.log(`   ✅ Upsert #2 email="${newEmailStored2}" legacy-compat row id=${upserted2.id.slice(0, 16)}...`);

      // For talent, also create TalentProfile row (Victoria1998)
      if (tc.role === "TALENT") {
        const profile = await prisma.talentProfile.upsert({
          where: { userId: upserted1.id },
          create: {
            id: require("crypto").randomBytes(12).toString("hex"),
            userId: upserted1.id,
            displayName: tc.displayName || "Talent",
            alias: "Vicky",
            createdAt: new Date(),
            updatedAt: new Date(),
            heightIn: 68, weightLbs: 120,
            phoneNumber: "+63 917 000 0000",
            nationality: "Filipino", locationCity: "Manila", locationCountry: "Philippines",
            aboutMe: "Fashion, print, and commercial talent based in Manila. Available for photo and video shoots. Currently with Museo Modeling & Events.",
            showcaseShowContactInfo: true, showcaseShowBasicInfo: true, showcaseUseGlassTheme: true,
            experienceYears: 4,
            employmentStatus: "Full-time model",
            educationLevel: "College Graduate",
            collegeCourse: "Bachelor of Science in Tourism Management",
          },
          update: {
            updatedAt: new Date(),
            displayName: tc.displayName || "Talent",
          },
        });
        console.log(`   ✅ TalentProfile (Victoria1998) upserted id=${profile.id.slice(0, 16)}...`);

        // Update legacy @portal.local talent row userId to also point to same profile? skip to avoid conflict; keep profile linked to plain email user row
      }

      anyFixed = true;

      // Re-run lookup now to confirm row FOUND + bcrypt passes
      console.log(`   🧪 Re-testing login now after fix...`);
      const u2 = await findUserLikeNextAuthDoes(tc.username);
      if (!u2) {
        console.log(`   ❌ STILL NOT FOUND after upsert. This is a bug in script. Stop.`);
        continue;
      }
      const bcryptOk = await bcrypt.compare(tc.password, u2.passwordHash);
      console.log(`   bcrypt.compare("${tc.password}", stored hash) → ${bcryptOk ? "✅ PASS" : "❌ FAIL (hash corrupted)"}`);
      continue;
    }

    // User WAS found, but does bcrypt compare pass?
    console.log(`   Row exists in Neon: email="${user.email}"  passwordHash prefix=${user.passwordHash ? user.passwordHash.slice(0, 10) : "NO HASH"}`);
    const bcryptOk = user.passwordHash ? (await bcrypt.compare(tc.password, user.passwordHash)) : false;
    if (bcryptOk) {
      console.log(`   ✅ bcrypt.compare PASSED. NextAuth will log in this user! 💯`);
      continue;
    }

    // bcrypt FAILS — so stored hash doesn't match the password we expect
    console.log(`   ❌ bcrypt.compare FAILED → stored passwordHash in Neon does NOT correspond to password "${tc.password}".`);
    console.log(`   🛠️  FIX: Updating passwordHash on this user row (email="${user.email}") to bcrypt("${tc.password}")...`);
    const newHash = bcrypt.hashSync(tc.password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash, displayName: tc.displayName, name: tc.realName, updatedAt: new Date() } });
    console.log(`   ✅ passwordHash UPDATED. Retesting bcrypt now...`);
    const u2 = await prisma.user.findUnique({ where: { id: user.id } });
    const bcryptOk2 = await bcrypt.compare(tc.password, u2.passwordHash);
    console.log(`   bcrypt.compare(...) → ${bcryptOk2 ? "✅ PASS now. Ready." : "❌ FAIL AGAIN. Impossible."}`);
    anyFixed = true;
  }

  console.log("\n========== STEP 3) FINAL NEON USER TABLE STATE ==========");
  const finalUsers = await prisma.user.findMany({
    select: { email: true, role: true, name: true, displayName: true, passwordHash: true },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });
  finalUsers.forEach(u => {
    const hashOK = u.passwordHash && u.passwordHash.startsWith("$2");
    console.log(`[${u.role}]  ${u.email.padEnd(30)}  name="${u.name || ""}"  display="${u.displayName || ""}"  hashOK=${hashOK ? "✅" : "❌ BAD:" + (u.passwordHash || "NULL").slice(0, 25)}`);
  });

  console.log("\n========== STEP 4) FINAL LOGIN VERIFICATION ==========");
  let allPass = true;
  for (const tc of testCases) {
    const u = await findUserLikeNextAuthDoes(tc.username);
    const ok = u ? await bcrypt.compare(tc.password, u.passwordHash) : false;
    const status = ok ? "✅ PASS" : "❌ FAIL";
    console.log(`${status}  ${tc.role.padEnd(8)} "${tc.username}" / "${tc.password}"  → will login on Vercel: ${ok ? "YES 🎉" : "NO"}`);
    if (!ok) allPass = false;
  }

  console.log(`\n${anyFixed ? "🔧 DB fix operations applied." : "✅ DB already correct."}`);
  if (allPass) {
    console.log("\n🎉🎉🎉 ALL 3 CREDENTIALS PASS. GO LOG IN ON LIVE VERCEL NOW, WORKS FIRST TRY. 🎉🎉🎉");
  } else {
    console.log("\n❌ At least one credential still fails. Paste the output above to me, I fix.");
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error("\n❌ UNEXPECTED SCRIPT ERROR:", e?.stack || e?.message || e);
  try { await prisma.$disconnect(); } catch(_){}
  try { await pool.end(); } catch(_){}
  process.exit(1);
});