/**
 * Script to create test accounts with PIN 7347
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const testAccounts = [
  {
    email: 'test@astral.money',
    name: 'Test User',
    pin: '7347',
    balance: 1500.00
  },
  {
    email: 'demo@astral.money',
    name: 'Demo User',
    pin: '7347',
    balance: 2500.00
  },
  {
    email: 'user@astral.money', 
    name: 'Sample User',
    pin: '7347',
    balance: 3500.00
  }
];

async function createTestAccounts() {
  console.log('Creating test accounts with PIN 7347...');
  
  try {
    for (const account of testAccounts) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email }
      });

      if (existingUser) {
        console.log(`User ${account.email} already exists, updating PIN...`);
        await prisma.user.update({
          where: { email: account.email },
          data: { pin: account.pin }
        });
      } else {
        console.log(`Creating user ${account.email}...`);
        await prisma.user.create({
          data: account
        });
      }
    }

    console.log('✅ Test accounts created successfully!');
    console.log('');
    console.log('Available test accounts:');
    testAccounts.forEach(account => {
      console.log(`  📧 ${account.email} (PIN: ${account.pin}) - Balance: $${account.balance}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAccounts();