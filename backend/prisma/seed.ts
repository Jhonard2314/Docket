/**
 * Seed script — creates default departments, categories, and the first
 * administrator account.
 *
 * Run:  npm run db:seed
 *
 * The admin password is supplied via SEED_ADMIN_PASSWORD in the environment.
 * Never hard-code or commit a password.
 */

import { PrismaClient } from '@prisma/client';
import { auth }         from '../src/config/auth';

const prisma = new PrismaClient();

async function main() {
  // ── Departments ─────────────────────────────────────────────────────────────
  const departments = [
    'Human Resources',
    'Finance',
    'Legal',
    'Operations',
    'IT & Technology',
    'Marketing',
  ];

  for (const name of departments) {
    await prisma.department.upsert({
      where:  { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ ${departments.length} departments seeded.`);

  // ── Categories ──────────────────────────────────────────────────────────────
  const categories = [
    'Policy',
    'Report',
    'Contract',
    'Memo',
    'Presentation',
    'Invoice',
    'Manual',
    'Other',
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where:  { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ ${categories.length} categories seeded.`);

  // ── Bootstrap admin account ─────────────────────────────────────────────────
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@docket.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Docket123!';
  const adminName     = process.env.SEED_ADMIN_NAME     ?? 'System Administrator';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    // Use Better Auth's server API to create the account so the password is
    // hashed correctly by the library.
    await auth.api.signUpEmail({
      body: { name: adminName, email: adminEmail, password: adminPassword },
    });

    // Promote to ADMIN — Better Auth creates users as EMPLOYEE by default.
    await prisma.user.update({
      where: { email: adminEmail },
      data:  { role: 'ADMIN', isActive: true },
    });

    console.log(`✓ Admin account created: ${adminEmail}`);
  } else {
    console.log(`– Admin account already exists: ${adminEmail}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
