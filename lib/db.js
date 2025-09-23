const globalForPrisma = globalThis;

// Only initialize Prisma if DATABASE_URL is available
let prisma;

if (process.env.DATABASE_URL) {
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = globalForPrisma.prisma || new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  } catch (error) {
    console.warn('Prisma client not available:', error.message);
    prisma = createFallbackPrisma();
  }
} else {
  prisma = createFallbackPrisma();
}

function createFallbackPrisma() {
  return {
    user: { 
      findUnique: () => Promise.resolve(null), 
      create: () => Promise.resolve(null), 
      update: () => Promise.resolve(null) 
    },
    budget: { 
      findUnique: () => Promise.resolve(null), 
      create: () => Promise.resolve(null), 
      update: () => Promise.resolve(null) 
    },
    bill: { 
      findMany: () => Promise.resolve([]), 
      create: () => Promise.resolve(null), 
      update: () => Promise.resolve(null) 
    },
    transaction: { 
      findMany: () => Promise.resolve([]), 
      create: () => Promise.resolve(null) 
    },
    financialGoal: { 
      findMany: () => Promise.resolve([]), 
      create: () => Promise.resolve(null), 
      update: () => Promise.resolve(null) 
    },
    recurringBill: { 
      findMany: () => Promise.resolve([]), 
      create: () => Promise.resolve(null) 
    },
    $connect: () => Promise.resolve(),
  };
}

export { prisma };
export default prisma;