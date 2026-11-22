/**
 * Seed script — departments, categories, and admin account.
 * Run: npx ts-node --transpile-only prisma/seed.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(salt + password).digest("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma  = new PrismaClient({ adapter } as any);

  const departments = [
    "Human Resources", "Finance", "Legal",
    "Operations", "IT & Technology", "Marketing",
  ];
  for (const name of departments) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`✓ ${departments.length} departments seeded.`);

  const categories = [
    "Policy", "Report", "Contract", "Memo",
    "Presentation", "Invoice", "Manual", "Other",
  ];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`✓ ${categories.length} categories seeded.`);

  const adminEmail    = process.env.SEED_ADMIN_EMAIL    ?? "admin@docket.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Docket123!";
  const adminName     = process.env.SEED_ADMIN_NAME     ?? "System Administrator";

  await prisma.user.upsert({
    where:  { email: adminEmail },
    update: {},
    create: {
      name:         adminName,
      email:        adminEmail,
      passwordHash: hashPassword(adminPassword),
      role:         "ADMIN",
      isActive:     true,
    },
  });
  console.log(`✓ Admin account: ${adminEmail} / ${adminPassword}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
