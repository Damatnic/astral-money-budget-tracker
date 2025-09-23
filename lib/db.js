import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Only initialize Prisma if DATABASE_URL is available
let prisma;

if (process.env.DATABASE_URL) {
  prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
} else {
  // Fallback when DATABASE_URL is not configured
  prisma = {
    user: { findUnique: () => null, create: () => null, update: () => null },
    budget: { findUnique: () => null, create: () => null, update: () => null },
    bill: { findMany: () => [], create: () => null, update: () => null },
    transaction: { findMany: () => [], create: () => null },
    financialGoal: { findMany: () => [], create: () => null, update: () => null },
    recurringBill: { findMany: () => [], create: () => null },
  };
}

export { prisma };
export default prisma;