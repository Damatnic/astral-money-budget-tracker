const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateRecurringBills() {
  try {
    console.log('🔧 Starting recurring bills migration...');
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: 'user@astralmoney.com' }
    });
    
    if (!user) {
      console.error('❌ User not found! Please run fix-user-data.js first.');
      return;
    }
    
    console.log('✅ Found user:', user.name);
    
    // First, let's add userId column with a default value using raw SQL
    console.log('📝 Adding userId column to recurring_bills table...');
    
    try {
      // Add the column as nullable first
      await prisma.$executeRaw`ALTER TABLE recurring_bills ADD COLUMN IF NOT EXISTS "userId" TEXT`;
      console.log('✅ Column added or already exists');
      
      // Update all existing records to have the user ID
      await prisma.$executeRaw`UPDATE recurring_bills SET "userId" = ${user.id} WHERE "userId" IS NULL`;
      console.log('✅ Updated all recurring bills with userId');
      
      // Now make the column required
      await prisma.$executeRaw`ALTER TABLE recurring_bills ALTER COLUMN "userId" SET NOT NULL`;
      console.log('✅ Made userId column required');
      
    } catch (error) {
      if (error.code === '42701') {
        console.log('ℹ️ Column already exists, updating records...');
        // Column already exists, just update the records
        await prisma.$executeRaw`UPDATE recurring_bills SET "userId" = ${user.id} WHERE "userId" IS NULL OR "userId" != ${user.id}`;
        console.log('✅ Updated all recurring bills with userId');
      } else {
        console.log('Error code:', error.code);
        throw error;
      }
    }
    
    // Get count of recurring bills
    const recurringBillCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM recurring_bills WHERE "userId" = ${user.id}
    `;
    
    console.log(`\n📊 Migration complete!`);
    console.log(`   - Recurring bills linked to ${user.name}: ${recurringBillCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateRecurringBills();
