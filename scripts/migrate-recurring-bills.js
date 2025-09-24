const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateRecurringBills() {
  try {
    console.log('🔄 Starting migration of recurring bills...');
    
    // Get all existing recurring bills
    const bills = await prisma.recurringBill.findMany({
      where: {
        baseAmount: null
      }
    });
    
    console.log(`📊 Found ${bills.length} bills to migrate`);
    
    for (const bill of bills) {
      // Identify common variable amount providers
      const isVariableAmount = 
        bill.name.toLowerCase().includes('verizon') ||
        bill.name.toLowerCase().includes('electric') ||
        bill.name.toLowerCase().includes('gas') ||
        bill.name.toLowerCase().includes('water') ||
        bill.name.toLowerCase().includes('utility') ||
        bill.category.toLowerCase().includes('utilities');
      
      const provider = bill.name.toLowerCase().includes('verizon') ? 'Verizon' :
                      bill.name.toLowerCase().includes('electric') ? 'Electric Company' :
                      bill.name.toLowerCase().includes('gas') ? 'Gas Company' :
                      null;
      
      // Update the bill with new fields
      await prisma.recurringBill.update({
        where: { id: bill.id },
        data: {
          baseAmount: bill.amount,
          isVariableAmount: isVariableAmount,
          averageAmount: bill.amount, // Start with current amount as average
          minAmount: isVariableAmount ? bill.amount * 0.8 : bill.amount, // Estimate 20% variance
          maxAmount: isVariableAmount ? bill.amount * 1.2 : bill.amount,
          lastBillAmount: bill.amount,
          estimationMethod: isVariableAmount ? 'average' : 'base',
          provider: provider,
          notes: isVariableAmount ? 'Amount varies monthly - check actual bills' : null
        }
      });
      
      console.log(`✅ Migrated: ${bill.name} (${isVariableAmount ? 'Variable' : 'Fixed'} amount)`);
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateRecurringBills();