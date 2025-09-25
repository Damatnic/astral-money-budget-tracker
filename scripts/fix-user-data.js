const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixUserData() {
  try {
    console.log('🔧 Starting user data fix...');
    
    // Find or create the user account
    const email = 'user@astralmoney.com'; // Your email
    const pin = '1234'; // Your PIN
    const hashedPin = await bcrypt.hash(pin, 10);
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (user) {
      // Update existing user
      console.log('📝 Updating existing user...');
      user = await prisma.user.update({
        where: { email },
        data: {
          name: 'Our Monies',
          pin: hashedPin,
          balance: user.balance || 0
        }
      });
      console.log('✅ User updated:', user.email, '- Name:', user.name);
    } else {
      // Create new user
      console.log('🆕 Creating new user...');
      user = await prisma.user.create({
        data: {
          email,
          name: 'Our Monies',
          pin: hashedPin,
          balance: 0
        }
      });
      console.log('✅ User created:', user.email, '- Name:', user.name);
    }
    
    // Check for any transactions not belonging to this user
    const allTransactions = await prisma.transaction.findMany();
    const orphanedTransactions = allTransactions.filter(t => !t.userId || t.userId !== user.id);
    
    if (orphanedTransactions.length > 0) {
      console.log(`🔗 Found ${orphanedTransactions.length} orphaned transactions. Linking to user...`);
      for (const transaction of orphanedTransactions) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { userId: user.id }
        });
      }
      console.log('✅ Transactions linked to user');
    }
    
    // Check for any bills not belonging to this user
    const allBills = await prisma.bill.findMany();
    const orphanedBills = allBills.filter(b => !b.userId || b.userId !== user.id);
    
    if (orphanedBills.length > 0) {
      console.log(`🔗 Found ${orphanedBills.length} orphaned bills. Linking to user...`);
      for (const bill of orphanedBills) {
        await prisma.bill.update({
          where: { id: bill.id },
          data: { userId: user.id }
        });
      }
      console.log('✅ Bills linked to user');
    }
    
    // Update recurring bills to have userId (since we just added this field)
    const allRecurringBills = await prisma.recurringBill.findMany();
    const recurringBillsWithoutUser = allRecurringBills.filter(r => !r.userId || r.userId !== user.id);
    
    if (recurringBillsWithoutUser.length > 0) {
      console.log(`🔗 Found ${recurringBillsWithoutUser.length} recurring bills without user. Linking...`);
      for (const recurringBill of recurringBillsWithoutUser) {
        await prisma.recurringBill.update({
          where: { id: recurringBill.id },
          data: { userId: user.id }
        });
      }
      console.log('✅ Recurring bills linked to user');
    }
    
    // Get summary of user's data
    const transactionCount = await prisma.transaction.count({
      where: { userId: user.id }
    });
    
    const billCount = await prisma.bill.count({
      where: { userId: user.id }
    });
    
    const recurringBillCount = await prisma.recurringBill.count({
      where: { userId: user.id }
    });
    
    // Calculate actual balance from transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id }
    });
    
    let calculatedBalance = 0;
    for (const transaction of transactions) {
      if (transaction.type === 'income') {
        calculatedBalance += transaction.amount;
      } else if (transaction.type === 'expense') {
        calculatedBalance -= transaction.amount;
      }
    }
    
    // Update user balance to match transactions
    user = await prisma.user.update({
      where: { id: user.id },
      data: { balance: calculatedBalance }
    });
    
    console.log('\n📊 Data Summary for', user.name, '(' + user.email + '):');
    console.log('   - Transactions:', transactionCount);
    console.log('   - Bills:', billCount);
    console.log('   - Recurring Bills:', recurringBillCount);
    console.log('   - Balance: $' + user.balance.toFixed(2));
    
    console.log('\n✅ User data fix complete!');
    console.log('📱 You can now log in with:');
    console.log('   Email:', email);
    console.log('   PIN:', pin);
    
  } catch (error) {
    console.error('❌ Error fixing user data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixUserData();