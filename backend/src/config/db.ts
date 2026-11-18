import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client.
 * Re-uses the same instance across hot-reloads in dev to avoid exhausting connections.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
