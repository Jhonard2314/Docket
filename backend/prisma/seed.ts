/**
 * Seed script — departments, categories, and admin account.
 * Run: npx ts-node --transpile-only prisma/seed.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";
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
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Docket123";
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

  // Department Head account
  const hrDept = await prisma.department.findFirst({ where: { name: "Human Resources" } });
  await prisma.user.upsert({
    where:  { email: "head@docket.local" },
    update: {},
    create: {
      name:         "Department Head",
      email:        "head@docket.local",
      passwordHash: hashPassword("Docket123"),
      role:         "DEPARTMENT_HEAD",
      isActive:     true,
      departmentId: hrDept?.id,
    },
  });
  console.log(`✓ Department Head account: head@docket.local / Docket123`);

  // Employee account
  const financeDept = await prisma.department.findFirst({ where: { name: "Finance" } });
  await prisma.user.upsert({
    where:  { email: "employee@docket.local" },
    update: {},
    create: {
      name:         "Employee User",
      email:        "employee@docket.local",
      passwordHash: hashPassword("Docket123"),
      role:         "EMPLOYEE",
      isActive:     true,
      departmentId: financeDept?.id,
    },
  });
  console.log(`✓ Employee account: employee@docket.local / Docket123`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
