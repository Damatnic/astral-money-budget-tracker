/**
 * Smart Features Utilities
 * Predictive text and intelligent categorization
 */

import { Transaction } from '@/types';

// Common transaction patterns and their categories
const CATEGORY_PATTERNS = {
  'Food & Dining': [
    'restaurant', 'pizza', 'coffee', 'starbucks', 'mcdonald', 'burger', 'cafe', 'diner',
    'food', 'lunch', 'dinner', 'breakfast', 'grocery', 'market', 'kroger', 'walmart',
    'whole foods', 'trader joe', 'safeway', 'publix', 'dominoes', 'subway', 'chipotle',
    'uber eats', 'doordash', 'grubhub', 'postmates', 'takeout', 'delivery'
  ],
  'Transportation': [
    'gas', 'fuel', 'uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'parking',
    'car wash', 'oil change', 'maintenance', 'repair', 'tires', 'auto', 'vehicle',
    'chevron', 'shell', 'exxon', 'bp', 'mobil', 'citgo', 'valero'
  ],
  'Shopping': [
    'amazon', 'target', 'costco', 'walmart', 'best buy', 'home depot', 'lowes',
    'clothing', 'shoes', 'electronics', 'furniture', 'department', 'mall',
    'nike', 'adidas', 'apple store', 'macys', 'nordstrom', 'kohls'
  ],
  'Bills & Utilities': [
    'electric', 'electricity', 'gas bill', 'water', 'sewer', 'internet', 'phone',
    'cell phone', 'mobile', 'cable', 'satellite', 'utility', 'power', 'energy',
    'verizon', 'att', 't-mobile', 'sprint', 'comcast', 'xfinity', 'charter'
  ],
  'Entertainment': [
    'netflix', 'hulu', 'disney', 'spotify', 'apple music', 'youtube', 'movie',
    'theater', 'cinema', 'concert', 'show', 'game', 'gaming', 'steam',
    'playstation', 'xbox', 'nintendo', 'subscription'
  ],
  'Healthcare': [
    'doctor', 'hospital', 'pharmacy', 'medical', 'dentist', 'dental', 'vision',
    'insurance', 'copay', 'prescription', 'medicine', 'cvs', 'walgreens',
    'rite aid', 'health', 'clinic', 'urgent care'
  ],
  'Education': [
    'school', 'university', 'college', 'tuition', 'books', 'supplies', 'course',
    'training', 'workshop', 'certification', 'education', 'learning'
  ],
  'Personal Care': [
    'salon', 'barber', 'haircut', 'spa', 'massage', 'gym', 'fitness', 'yoga',
    'beauty', 'cosmetics', 'skincare', 'personal', 'grooming'
  ],
  'Home & Garden': [
    'rent', 'mortgage', 'furniture', 'decor', 'garden', 'lawn', 'cleaning',
    'supplies', 'hardware', 'tools', 'appliance', 'home improvement'
  ],
  'Income': [
    'salary', 'wages', 'paycheck', 'bonus', 'commission', 'freelance', 'contract',
    'consulting', 'dividend', 'interest', 'refund', 'cashback', 'reward'
  ]
};

// Common transaction descriptions and their likely categories
const DESCRIPTION_PATTERNS = {
  'ATM': 'ATM & Bank Fees',
  'WITHDRAWAL': 'ATM & Bank Fees',
  'FEE': 'ATM & Bank Fees',
  'INTEREST': 'Income',
  'DIVIDEND': 'Income',
  'PAYROLL': 'Income',
  'DEPOSIT': 'Income',
  'REFUND': 'Income',
  'CASHBACK': 'Income'
};

/**
 * Predict category based on transaction description
 */
export function predictCategory(description: string): string {
  const normalizedDescription = description.toLowerCase().trim();
  
  // Check exact patterns first
  for (const [category, pattern] of Object.entries(DESCRIPTION_PATTERNS)) {
    if (normalizedDescription.includes(pattern.toLowerCase())) {
      return category;
    }
  }
  
  // Check category patterns
  for (const [category, keywords] of Object.entries(CATEGORY_PATTERNS)) {
    for (const keyword of keywords) {
      if (normalizedDescription.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  // Default fallback
  return 'Other';
}

/**
 * Get predictive suggestions for transaction descriptions
 */
export function getPredictiveSuggestions(
  input: string, 
  transactions: Transaction[], 
  limit: number = 5
): string[] {
  if (!input || input.length < 2) return [];
  
  const normalizedInput = input.toLowerCase().trim();
  const suggestions = new Set<string>();
  
  // Get suggestions from previous transactions
  transactions
    .filter(t => t.description.toLowerCase().includes(normalizedInput))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Most recent first
    .slice(0, limit * 2) // Get more than needed to filter duplicates
    .forEach(t => {
      if (suggestions.size < limit) {
        suggestions.add(t.description);
      }
    });
  
  // Add common patterns if we don't have enough suggestions
  if (suggestions.size < limit) {
    const allKeywords = Object.values(CATEGORY_PATTERNS).flat();
    const matchingKeywords = allKeywords
      .filter(keyword => keyword.toLowerCase().includes(normalizedInput))
      .slice(0, limit - suggestions.size);
    
    matchingKeywords.forEach(keyword => {
      // Capitalize first letter
      const capitalized = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      suggestions.add(capitalized);
    });
  }
  
  return Array.from(suggestions);
}

/**
 * Analyze spending patterns and provide insights
 */
export function analyzeSpendingPatterns(transactions: Transaction[]): {
  frequentMerchants: { name: string; count: number; totalAmount: number }[];
  categoryTrends: { category: string; trend: 'up' | 'down' | 'stable'; percentage: number }[];
  unusualTransactions: Transaction[];
} {
  // Frequent merchants analysis
  const merchantCounts = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const merchant = t.description;
      if (!acc[merchant]) {
        acc[merchant] = { count: 0, totalAmount: 0 };
      }
      acc[merchant].count++;
      acc[merchant].totalAmount += t.amount;
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number }>);
  
  const frequentMerchants = Object.entries(merchantCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Category trends analysis (comparing last 30 days to previous 30 days)
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const recentTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= last30Days && t.type === 'expense';
  });
  
  const previousTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= previous30Days && date < last30Days && t.type === 'expense';
  });
  
  const recentByCategory = recentTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const previousByCategory = previousTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const categoryTrends = Object.keys(recentByCategory).map(category => {
    const recentAmount = recentByCategory[category] || 0;
    const previousAmount = previousByCategory[category] || 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let percentage = 0;
    
    if (previousAmount > 0) {
      percentage = ((recentAmount - previousAmount) / previousAmount) * 100;
      if (percentage > 10) trend = 'up';
      else if (percentage < -10) trend = 'down';
    } else if (recentAmount > 0) {
      trend = 'up';
      percentage = 100;
    }
    
    return { category, trend, percentage };
  }).sort((a, b) => Math.abs(b.percentage) - Math.abs(a.percentage));
  
  // Unusual transactions (transactions that are significantly higher than average for that category)
  const categoryAverages = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { total: 0, count: 0 };
      }
      acc[t.category].total += t.amount;
      acc[t.category].count++;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);
  
  const unusualTransactions = transactions
    .filter(t => {
      if (t.type !== 'expense') return false;
      const avg = categoryAverages[t.category];
      if (!avg || avg.count < 3) return false; // Need at least 3 transactions to establish pattern
      
      const averageAmount = avg.total / avg.count;
      return t.amount > averageAmount * 2; // More than 2x the average
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  
  return {
    frequentMerchants,
    categoryTrends,
    unusualTransactions
  };
}

/**
 * Smart auto-complete for transaction forms
 */
export class TransactionAutoComplete {
  private transactions: Transaction[];
  private merchantSuggestions: Map<string, { category: string; avgAmount: number }> = new Map();
  
  constructor(transactions: Transaction[]) {
    this.transactions = transactions;
    this.buildMerchantSuggestions();
  }
  
  private buildMerchantSuggestions() {
    const merchantData = this.transactions.reduce((acc, t) => {
      const key = t.description.toLowerCase().trim();
      if (!acc[key]) {
        acc[key] = {
          category: t.category,
          amounts: [],
          description: t.description
        };
      }
      acc[key].amounts.push(t.amount);
      return acc;
    }, {} as Record<string, { category: string; amounts: number[]; description: string }>);
    
    Object.entries(merchantData).forEach(([key, data]) => {
      const avgAmount = data.amounts.reduce((sum, amt) => sum + amt, 0) / data.amounts.length;
      this.merchantSuggestions.set(key, {
        category: data.category,
        avgAmount
      });
    });
  }
  
  getSuggestion(description: string): {
    suggestedCategory?: string;
    suggestedAmount?: number;
    confidence: number;
  } {
    const normalizedDesc = description.toLowerCase().trim();
    
    // Exact match
    const exactMatch = this.merchantSuggestions.get(normalizedDesc);
    if (exactMatch) {
      return {
        suggestedCategory: exactMatch.category,
        suggestedAmount: Math.round(exactMatch.avgAmount * 100) / 100,
        confidence: 0.9
      };
    }
    
    // Partial match
    for (const [merchant, data] of this.merchantSuggestions.entries()) {
      if (merchant.includes(normalizedDesc) || normalizedDesc.includes(merchant)) {
        return {
          suggestedCategory: data.category,
          suggestedAmount: Math.round(data.avgAmount * 100) / 100,
          confidence: 0.7
        };
      }
    }
    
    // Fallback to pattern matching
    const predictedCategory = predictCategory(description);
    if (predictedCategory !== 'Other') {
      return {
        suggestedCategory: predictedCategory,
        confidence: 0.5
      };
    }
    
    return { confidence: 0 };
  }
  
  getDescriptionSuggestions(input: string, limit: number = 5): string[] {
    return getPredictiveSuggestions(input, this.transactions, limit);
  }
}

/**
 * Bill reminder system
 */
export function getUpcomingBillReminders(bills: any[], daysAhead: number = 7): Array<{
  bill: any;
  daysUntilDue: number;
  priority: 'high' | 'medium' | 'low';
}> {
  const today = new Date();
  const reminderDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  return bills
    .map(bill => {
      let nextDueDate: Date;
      
      // Calculate next due date based on frequency
      switch (bill.frequency) {
        case 'monthly':
          nextDueDate = new Date(today.getFullYear(), today.getMonth(), bill.dueDate || 1);
          if (nextDueDate < today) {
            nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, bill.dueDate || 1);
          }
          break;
        case 'yearly':
          nextDueDate = new Date(today.getFullYear(), (bill.dueDate || 1) - 1, 1);
          if (nextDueDate < today) {
            nextDueDate = new Date(today.getFullYear() + 1, (bill.dueDate || 1) - 1, 1);
          }
          break;
        case 'weekly':
          const daysUntilDue = ((bill.dueDate || 1) - today.getDay() + 7) % 7;
          nextDueDate = new Date(today.getTime() + daysUntilDue * 24 * 60 * 60 * 1000);
          break;
        default:
          nextDueDate = new Date(bill.dueDate || today);
      }
      
      const daysUntilDue = Math.ceil((nextDueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      
      let priority: 'high' | 'medium' | 'low' = 'low';
      if (daysUntilDue <= 1) priority = 'high';
      else if (daysUntilDue <= 3) priority = 'medium';
      
      return {
        bill,
        daysUntilDue,
        priority,
        nextDueDate
      };
    })
    .filter(reminder => reminder.daysUntilDue >= 0 && reminder.daysUntilDue <= daysAhead)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

/**
 * Achievement system for financial milestones
 */
export function checkAchievements(
  transactions: Transaction[],
  balance: number,
  goals: any[]
): Array<{
  id: string;
  title: string;
  description: string;
  type: 'savings' | 'spending' | 'goals' | 'streak';
  isNew: boolean;
  date: Date;
}> {
  const achievements = [];
  const now = new Date();
  
  // Savings milestones
  if (balance >= 1000) {
    achievements.push({
      id: 'first-thousand',
      title: 'First Thousand!',
      description: 'You\'ve reached your first $1,000 in savings',
      type: 'savings' as const,
      isNew: balance >= 1000 && balance < 1100, // Assume new if recently hit
      date: now
    });
  }
  
  if (balance >= 10000) {
    achievements.push({
      id: 'ten-thousand',
      title: 'Five Figures Club',
      description: 'Amazing! You\'ve saved $10,000',
      type: 'savings' as const,
      isNew: balance >= 10000 && balance < 10100,
      date: now
    });
  }
  
  // Goal completions
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount);
  if (completedGoals.length > 0) {
    achievements.push({
      id: 'goal-achiever',
      title: 'Goal Achiever',
      description: `You've completed ${completedGoals.length} financial goal${completedGoals.length > 1 ? 's' : ''}!`,
      type: 'goals' as const,
      isNew: completedGoals.some(g => 
        new Date(g.updatedAt || g.createdAt).getTime() > now.getTime() - 7 * 24 * 60 * 60 * 1000
      ),
      date: now
    });
  }
  
  // Transaction streak
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    return date.toDateString();
  });
  
  const hasTransactionEachDay = last7Days.every(dateStr => 
    transactions.some(t => new Date(t.date).toDateString() === dateStr)
  );
  
  if (hasTransactionEachDay) {
    achievements.push({
      id: 'tracking-streak',
      title: 'Tracking Streak',
      description: 'You\'ve recorded transactions for 7 days straight!',
      type: 'streak' as const,
      isNew: true,
      date: now
    });
  }
  
  return achievements;
}