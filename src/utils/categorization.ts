/**
 * Smart Transaction Categorization Engine
 * Uses keyword matching and merchant detection to automatically categorize transactions
 */

export interface CategoryRule {
  category: string;
  keywords: string[];
  merchants?: string[];
  amountRange?: { min?: number; max?: number };
}

// Expense category rules with smart keyword matching
export const EXPENSE_CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Housing',
    keywords: ['rent', 'mortgage', 'property', 'lease', 'apartment', 'home insurance', 'hoa'],
    merchants: ['zillow', 'apartments.com', 'property management']
  },
  {
    category: 'Transportation',
    keywords: ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'parking', 'toll', 'transit', 'metro', 'bus', 'train', 'car insurance', 'auto'],
    merchants: ['shell', 'chevron', 'exxon', 'mobil', 'bp', 'texaco', 'uber', 'lyft', 'hertz', 'enterprise']
  },
  {
    category: 'Groceries',
    keywords: ['grocery', 'supermarket', 'market', 'food', 'produce'],
    merchants: ['walmart', 'target', 'kroger', 'safeway', 'whole foods', 'trader joe', 'albertsons', 'costco', 'sam\'s club']
  },
  {
    category: 'Dining',
    keywords: ['restaurant', 'cafe', 'coffee', 'lunch', 'dinner', 'breakfast', 'fast food', 'pizza', 'sushi', 'bar', 'pub'],
    merchants: ['starbucks', 'mcdonalds', 'subway', 'chipotle', 'panera', 'dunkin', 'dominos', 'pizza hut']
  },
  {
    category: 'Utilities',
    keywords: ['electric', 'water', 'gas bill', 'internet', 'cable', 'phone', 'mobile', 'electricity', 'utility'],
    merchants: ['at&t', 'verizon', 'comcast', 'spectrum', 'duke energy', 'con edison']
  },
  {
    category: 'Healthcare',
    keywords: ['doctor', 'hospital', 'pharmacy', 'medical', 'health', 'dentist', 'prescription', 'clinic', 'therapy'],
    merchants: ['cvs', 'walgreens', 'rite aid', 'kaiser', 'blue cross']
  },
  {
    category: 'Insurance',
    keywords: ['insurance', 'premium', 'coverage', 'policy'],
    merchants: ['geico', 'progressive', 'allstate', 'state farm', 'liberty mutual']
  },
  {
    category: 'Entertainment',
    keywords: ['movie', 'theater', 'concert', 'show', 'netflix', 'spotify', 'game', 'sport', 'gym', 'fitness'],
    merchants: ['netflix', 'hulu', 'disney', 'spotify', 'apple music', 'amc', 'planet fitness', 'la fitness']
  },
  {
    category: 'Shopping',
    keywords: ['amazon', 'clothing', 'shoes', 'electronics', 'store', 'mall', 'online'],
    merchants: ['amazon', 'ebay', 'best buy', 'target', 'walmart', 'macy\'s', 'nordstrom', 'nike', 'apple']
  },
  {
    category: 'Education',
    keywords: ['tuition', 'school', 'college', 'university', 'course', 'training', 'book', 'student'],
    merchants: ['coursera', 'udemy', 'edx', 'barnes & noble']
  },
  {
    category: 'Personal Care',
    keywords: ['salon', 'haircut', 'spa', 'massage', 'nail', 'beauty', 'barber'],
    merchants: ['sephora', 'ulta', 'salon']
  },
  {
    category: 'Savings & Investments',
    keywords: ['savings', 'investment', '401k', 'ira', 'retirement', 'stock', 'etf', 'mutual fund'],
    merchants: ['vanguard', 'fidelity', 'charles schwab', 'e*trade']
  },
  {
    category: 'Debt Payments',
    keywords: ['loan', 'credit card', 'payment', 'debt', 'student loan', 'auto loan', 'mortgage payment'],
    merchants: ['chase', 'bank of america', 'wells fargo', 'capital one', 'discover']
  },
  {
    category: 'Charity',
    keywords: ['donation', 'charity', 'nonprofit', 'foundation', 'contribute'],
    merchants: ['red cross', 'united way', 'salvation army']
  },
  {
    category: 'Travel',
    keywords: ['hotel', 'flight', 'airbnb', 'vacation', 'trip', 'airline', 'luggage'],
    merchants: ['marriott', 'hilton', 'airbnb', 'expedia', 'booking.com', 'delta', 'united', 'southwest']
  }
];

// Income category rules
export const INCOME_CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Salary',
    keywords: ['salary', 'payroll', 'wage', 'paycheck', 'direct deposit'],
    amountRange: { min: 1000 }
  },
  {
    category: 'Freelance',
    keywords: ['freelance', 'contract', 'consulting', 'invoice', 'client payment']
  },
  {
    category: 'Investment',
    keywords: ['dividend', 'interest', 'capital gain', 'stock', 'investment return']
  },
  {
    category: 'Rental',
    keywords: ['rent income', 'rental', 'tenant', 'lease payment']
  },
  {
    category: 'Business',
    keywords: ['business income', 'revenue', 'sales', 'commission']
  },
  {
    category: 'Gift',
    keywords: ['gift', 'present', 'birthday', 'wedding'],
    amountRange: { max: 500 }
  },
  {
    category: 'Refund',
    keywords: ['refund', 'return', 'reimbursement', 'cashback', 'rebate']
  },
  {
    category: 'Other Income',
    keywords: ['bonus', 'award', 'prize', 'settlement']
  }
];

/**
 * Categorize a transaction based on description and amount
 */
export function categorizeTransaction(
  description: string,
  amount: number,
  type: 'income' | 'expense'
): string {
  const lowerDesc = description.toLowerCase();
  const rules = type === 'income' ? INCOME_CATEGORY_RULES : EXPENSE_CATEGORY_RULES;
  
  // First pass: Check for exact merchant matches
  for (const rule of rules) {
    if (rule.merchants) {
      for (const merchant of rule.merchants) {
        if (lowerDesc.includes(merchant.toLowerCase())) {
          // Check amount range if specified
          if (rule.amountRange) {
            const { min, max } = rule.amountRange;
            if ((min && amount < min) || (max && amount > max)) {
              continue;
            }
          }
          return rule.category;
        }
      }
    }
  }
  
  // Second pass: Check for keyword matches
  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        // Check amount range if specified
        if (rule.amountRange) {
          const { min, max } = rule.amountRange;
          if ((min && amount < min) || (max && amount > max)) {
            continue;
          }
        }
        return rule.category;
      }
    }
  }
  
  // Default categories
  return type === 'income' ? 'Other Income' : 'Other Expenses';
}

/**
 * Get category suggestions based on partial description
 */
export function getSuggestions(
  partialDescription: string,
  type: 'income' | 'expense'
): string[] {
  if (!partialDescription || partialDescription.length < 2) {
    return [];
  }
  
  const lowerDesc = partialDescription.toLowerCase();
  const rules = type === 'income' ? INCOME_CATEGORY_RULES : EXPENSE_CATEGORY_RULES;
  const suggestions = new Set<string>();
  
  for (const rule of rules) {
    // Check merchants
    if (rule.merchants) {
      for (const merchant of rule.merchants) {
        if (merchant.toLowerCase().includes(lowerDesc)) {
          suggestions.add(rule.category);
        }
      }
    }
    
    // Check keywords
    for (const keyword of rule.keywords) {
      if (keyword.toLowerCase().includes(lowerDesc)) {
        suggestions.add(rule.category);
      }
    }
  }
  
  return Array.from(suggestions).slice(0, 5);
}

/**
 * Analyze spending patterns and provide insights
 */
export interface SpendingInsight {
  category: string;
  total: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation?: string;
}

export function analyzeSpending(
  transactions: Array<{ category: string; amount: number; date: Date }>,
  monthlyIncome: number
): SpendingInsight[] {
  const categoryTotals = new Map<string, number>();
  const categoryHistory = new Map<string, number[]>();
  
  // Group by category and month
  transactions.forEach(t => {
    const category = t.category || 'Uncategorized';
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + t.amount);
    
    const monthKey = `${t.date.getFullYear()}-${t.date.getMonth()}`;
    if (!categoryHistory.has(category)) {
      categoryHistory.set(category, []);
    }
    categoryHistory.get(category)!.push(t.amount);
  });
  
  const totalSpending = Array.from(categoryTotals.values()).reduce((sum, val) => sum + val, 0);
  
  const insights: SpendingInsight[] = [];
  
  categoryTotals.forEach((total, category) => {
    const percentage = (total / monthlyIncome) * 100;
    const history = categoryHistory.get(category) || [];
    
    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (history.length >= 2) {
      const recent = history.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, history.length);
      const previous = history.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, history.length - 3);
      
      if (recent > previous * 1.1) trend = 'increasing';
      else if (recent < previous * 0.9) trend = 'decreasing';
    }
    
    // Generate recommendations
    let recommendation;
    if (category === 'Dining' && percentage > 10) {
      recommendation = 'Consider meal planning to reduce dining expenses';
    } else if (category === 'Entertainment' && percentage > 5) {
      recommendation = 'Look for free or low-cost entertainment options';
    } else if (category === 'Savings & Investments' && percentage < 20) {
      recommendation = 'Try to increase your savings rate to at least 20%';
    }
    
    insights.push({
      category,
      total,
      percentage,
      trend,
      recommendation
    });
  });
  
  return insights.sort((a, b) => b.total - a.total);
}

/**
 * Budget rule validation
 */
export function validateBudgetRules(
  spending: Map<string, number>,
  income: number,
  rules: '50/30/20' | 'zero-based' | 'envelope'
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  if (rules === '50/30/20') {
    const needs = ['Housing', 'Transportation', 'Groceries', 'Utilities', 'Healthcare', 'Insurance'];
    const wants = ['Dining', 'Entertainment', 'Shopping', 'Personal Care', 'Travel'];
    const savings = ['Savings & Investments', 'Debt Payments'];
    
    let needsTotal = 0;
    let wantsTotal = 0;
    let savingsTotal = 0;
    
    spending.forEach((amount, category) => {
      if (needs.includes(category)) needsTotal += amount;
      else if (wants.includes(category)) wantsTotal += amount;
      else if (savings.includes(category)) savingsTotal += amount;
    });
    
    if (needsTotal > income * 0.5) {
      violations.push(`Needs spending (${((needsTotal/income)*100).toFixed(1)}%) exceeds 50% limit`);
    }
    if (wantsTotal > income * 0.3) {
      violations.push(`Wants spending (${((wantsTotal/income)*100).toFixed(1)}%) exceeds 30% limit`);
    }
    if (savingsTotal < income * 0.2) {
      violations.push(`Savings (${((savingsTotal/income)*100).toFixed(1)}%) below 20% target`);
    }
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}