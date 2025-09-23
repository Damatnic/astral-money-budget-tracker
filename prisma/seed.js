const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default user
  const user = await prisma.user.upsert({
    where: { email: 'user@astralmoney.com' },
    update: {},
    create: {
      email: 'user@astralmoney.com',
      name: 'Astral User',
      balance: 11.29, // Current balance from bank statement
    },
  });

  console.log('✅ User created:', user.email);

  // Create October 2025 budget
  const budget = await prisma.budget.upsert({
    where: { 
      userId_month_year: {
        userId: user.id,
        month: 'october',
        year: 2025
      }
    },
    update: {},
    create: {
      userId: user.id,
      month: 'october',
      year: 2025,
      income: 6431.92, // 3 paychecks
      expenses: 9421.00,
      balance: user.balance,
    },
  });

  console.log('✅ Budget created for October 2025');

  // Recurring bills data
  const recurringBills = [
    { name: 'Rent', amount: 1850, category: 'housing', frequency: 'monthly' },
    { name: 'Car Insurance', amount: 289, category: 'insurance', frequency: 'monthly' },
    { name: 'Phone Bill', amount: 85, category: 'utilities', frequency: 'monthly' },
    { name: 'Internet', amount: 79.99, category: 'utilities', frequency: 'monthly' },
    { name: 'Gym Membership', amount: 39.99, category: 'health', frequency: 'monthly' },
    { name: 'Netflix', amount: 15.49, category: 'entertainment', frequency: 'monthly' },
    { name: 'Spotify Premium', amount: 10.99, category: 'entertainment', frequency: 'monthly' },
    { name: 'Adobe Creative Suite', amount: 52.99, category: 'software', frequency: 'monthly' },
    { name: 'GitHub', amount: 43, category: 'software', frequency: 'monthly' },
    { name: 'Groceries Budget', amount: 250, category: 'food', frequency: 'monthly' },
  ];

  // Create recurring bills
  for (const bill of recurringBills) {
    await prisma.recurringBill.upsert({
      where: { 
        name: bill.name,
      },
      update: {},
      create: {
        ...bill,
        startDate: new Date('2025-10-01'),
        isActive: true,
      },
    });
  }

  console.log('✅ Recurring bills created');

  // Create October 2025 bills with specific dates
  const octoberBills = [
    // Early October
    { name: 'Rent', amount: 1850, dueDate: '2025-10-01', category: 'housing' },
    { name: 'Second Rent Payment', amount: 1850, dueDate: '2025-10-01', category: 'housing' },
    { name: 'Paycheck 1', amount: 2143.73, dueDate: '2025-10-04', category: 'income', isIncome: true },
    { name: 'Student Loan', amount: 127, dueDate: '2025-10-05', category: 'debt' },
    { name: 'Electric Bill', amount: 156, dueDate: '2025-10-07', category: 'utilities' },

    // Hell Week (Oct 8-15)
    { name: 'GitHub', amount: 43, dueDate: '2025-10-08', category: 'software' },
    { name: 'Adobe Creative Suite', amount: 52.99, dueDate: '2025-10-09', category: 'software' },
    { name: 'Netflix', amount: 15.49, dueDate: '2025-10-10', category: 'entertainment' },
    { name: 'Spotify Premium', amount: 10.99, dueDate: '2025-10-11', category: 'entertainment' },
    { name: 'Car Insurance', amount: 289, dueDate: '2025-10-12', category: 'insurance' },
    { name: 'Phone Bill', amount: 85, dueDate: '2025-10-13', category: 'utilities' },
    { name: 'Gym Membership', amount: 39.99, dueDate: '2025-10-14', category: 'health' },
    { name: 'Internet', amount: 79.99, dueDate: '2025-10-15', category: 'utilities' },
    { name: 'Groceries Budget', amount: 250, dueDate: '2025-10-15', category: 'food' },

    // Mid October
    { name: 'Paycheck 2', amount: 2143.73, dueDate: '2025-10-18', category: 'income', isIncome: true },
    { name: 'Gas Bill', amount: 89, dueDate: '2025-10-20', category: 'utilities' },
    { name: 'Water Bill', amount: 67, dueDate: '2025-10-22', category: 'utilities' },

    // Late October
    { name: 'Credit Card Payment', amount: 250, dueDate: '2025-10-25', category: 'debt' },
    { name: 'Amazon Prime', amount: 14.98, dueDate: '2025-10-28', category: 'entertainment' },
    { name: 'Savings Transfer', amount: 500, dueDate: '2025-10-30', category: 'savings' },
    { name: 'Paycheck 3', amount: 2144.46, dueDate: '2025-10-31', category: 'income', isIncome: true },
  ];

  for (const billData of octoberBills) {
    await prisma.bill.create({
      data: {
        userId: user.id,
        budgetId: budget.id,
        name: billData.name,
        amount: billData.amount,
        dueDate: new Date(billData.dueDate),
        category: billData.category,
        isIncome: billData.isIncome || false,
        isRecurring: true,
      },
    });
  }

  console.log('✅ October 2025 bills created');

  // Create financial goals
  const goals = [
    {
      userId: user.id,
      title: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 11.29,
      category: 'emergency',
      deadline: new Date('2025-12-31'),
    },
    {
      userId: user.id,
      title: 'Debt Payoff',
      targetAmount: 5000,
      currentAmount: 1500,
      category: 'debt',
      deadline: new Date('2025-06-30'),
    },
    {
      userId: user.id,
      title: 'Vacation Fund',
      targetAmount: 3000,
      currentAmount: 0,
      category: 'savings',
      deadline: new Date('2025-08-01'),
    },
  ];

  for (const goal of goals) {
    await prisma.financialGoal.create({ data: goal });
  }

  console.log('✅ Financial goals created');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });