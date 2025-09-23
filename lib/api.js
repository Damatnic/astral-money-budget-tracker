import prisma from './db.js';

// User operations
export async function getUser(email) {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      budgets: {
        include: {
          bills: true,
        },
      },
    },
  });
}

export async function createUser(userData) {
  return await prisma.user.create({
    data: userData,
  });
}

export async function updateUserBalance(userId, newBalance) {
  return await prisma.user.update({
    where: { id: userId },
    data: { balance: newBalance },
  });
}

// Budget operations
export async function getBudget(userId, month, year) {
  return await prisma.budget.findUnique({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
    include: {
      bills: {
        orderBy: {
          dueDate: 'asc',
        },
      },
    },
  });
}

export async function createBudget(budgetData) {
  return await prisma.budget.create({
    data: budgetData,
  });
}

export async function updateBudget(budgetId, updates) {
  return await prisma.budget.update({
    where: { id: budgetId },
    data: updates,
  });
}

// Bill operations
export async function getBills(userId, month = null, year = null) {
  const where = { userId };
  
  if (month && year) {
    where.budget = {
      month,
      year,
    };
  }

  return await prisma.bill.findMany({
    where,
    orderBy: {
      dueDate: 'asc',
    },
  });
}

export async function createBill(billData) {
  return await prisma.bill.create({
    data: billData,
  });
}

export async function updateBill(billId, updates) {
  return await prisma.bill.update({
    where: { id: billId },
    data: updates,
  });
}

export async function markBillPaid(billId, isPaid = true) {
  return await prisma.bill.update({
    where: { id: billId },
    data: { isPaid },
  });
}

// Transaction operations
export async function createTransaction(transactionData) {
  return await prisma.transaction.create({
    data: transactionData,
  });
}

export async function getTransactions(userId, startDate = null, endDate = null) {
  const where = { userId };
  
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  return await prisma.transaction.findMany({
    where,
    orderBy: {
      date: 'desc',
    },
  });
}

// Financial goals operations
export async function getFinancialGoals(userId) {
  return await prisma.financialGoal.findMany({
    where: { userId },
    orderBy: {
      deadline: 'asc',
    },
  });
}

export async function createFinancialGoal(goalData) {
  return await prisma.financialGoal.create({
    data: goalData,
  });
}

export async function updateFinancialGoal(goalId, updates) {
  return await prisma.financialGoal.update({
    where: { id: goalId },
    data: updates,
  });
}

// Analytics operations
export async function getFinancialHealthScore(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      bills: {
        where: {
          isPaid: false,
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          },
        },
      },
      transactions: {
        where: {
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      },
    },
  });

  if (!user) return 0;

  // Calculate health score based on multiple factors
  let score = 100;

  // Factor 1: Balance vs upcoming bills
  const upcomingBills = user.bills.reduce((sum, bill) => sum + (bill.isIncome ? 0 : bill.amount), 0);
  const balanceRatio = user.balance / (upcomingBills || 1);
  
  if (balanceRatio < 0.1) score -= 40;
  else if (balanceRatio < 0.5) score -= 20;
  else if (balanceRatio < 1) score -= 10;

  // Factor 2: Recent transaction patterns
  const recentIncome = user.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const recentExpenses = user.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  if (recentExpenses > recentIncome * 1.2) score -= 20;
  else if (recentExpenses > recentIncome) score -= 10;

  // Factor 3: Bill payment consistency
  const totalBills = user.bills.length;
  const paidBills = user.bills.filter(bill => bill.isPaid).length;
  const paymentRatio = totalBills > 0 ? paidBills / totalBills : 1;
  
  if (paymentRatio < 0.7) score -= 15;
  else if (paymentRatio < 0.9) score -= 5;

  return Math.max(0, Math.min(100, score));
}

// Recurring bill operations
export async function getRecurringBills() {
  return await prisma.recurringBill.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function createRecurringBill(billData) {
  return await prisma.recurringBill.create({
    data: billData,
  });
}