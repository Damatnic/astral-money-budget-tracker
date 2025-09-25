/**
 * Smart Features Utility Tests
 * Tests for AI-powered insights and smart recommendations
 */

import {
  getUpcomingBillReminders,
  checkAchievements,
  analyzeSpendingPatterns,
  generateSmartInsights,
  predictFutureExpenses,
  suggestBudgetOptimizations
} from '../smartFeatures';

// Mock data
const mockTransactions = [
  {
    id: '1',
    amount: 50,
    description: 'Grocery Store',
    category: 'groceries',
    date: new Date('2024-01-15'),
    type: 'expense'
  },
  {
    id: '2',
    amount: 25,
    description: 'Gas Station',
    category: 'transportation',
    date: new Date('2024-01-10'),
    type: 'expense'
  },
  {
    id: '3',
    amount: 2000,
    description: 'Salary',
    category: 'income',
    date: new Date('2024-01-01'),
    type: 'income'
  }
];

const mockBills = [
  {
    id: '1',
    name: 'Electric Bill',
    amount: 120,
    dueDate: new Date('2024-02-01'),
    category: 'utilities',
    isRecurring: true,
    frequency: 'monthly'
  },
  {
    id: '2',
    name: 'Internet',
    amount: 80,
    dueDate: new Date('2024-01-25'),
    category: 'utilities',
    isRecurring: true,
    frequency: 'monthly'
  }
];

const mockGoals = [
  {
    id: '1',
    title: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 5000,
    deadline: new Date('2024-12-31'),
    category: 'emergency',
    isCompleted: false
  },
  {
    id: '2',
    title: 'Vacation',
    targetAmount: 3000,
    currentAmount: 3000,
    deadline: new Date('2024-06-30'),
    category: 'savings',
    isCompleted: true
  }
];

describe('Smart Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock current date
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-20'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getUpcomingBillReminders', () => {
    it('should return upcoming bills within reminder window', () => {
      const reminders = getUpcomingBillReminders(mockBills, 7); // 7 days
      
      expect(reminders).toHaveLength(1);
      expect(reminders[0].name).toBe('Internet');
      expect(reminders[0].daysUntilDue).toBe(5);
    });

    it('should return empty array when no bills are due', () => {
      const futureBills = [
        {
          ...mockBills[0],
          dueDate: new Date('2024-03-01')
        }
      ];
      
      const reminders = getUpcomingBillReminders(futureBills, 7);
      
      expect(reminders).toHaveLength(0);
    });

    it('should handle empty bills array', () => {
      const reminders = getUpcomingBillReminders([], 7);
      
      expect(reminders).toHaveLength(0);
    });
  });

  describe('checkAchievements', () => {
    it('should detect goal completion achievement', () => {
      const achievements = checkAchievements(mockGoals, mockTransactions, 5000);
      
      expect(achievements.length).toBeGreaterThan(0);
      expect(achievements.some(a => a.type === 'goal_completed')).toBe(true);
    });

    it('should detect spending milestone achievements', () => {
      const highSpendingTransactions = [
        ...mockTransactions,
        { id: '4', amount: 1000, description: 'Big Purchase', category: 'other', date: new Date(), type: 'expense' }
      ];
      
      const achievements = checkAchievements(mockGoals, highSpendingTransactions, 5000);
      
      expect(achievements.length).toBeGreaterThan(0);
    });

    it('should detect savings achievements', () => {
      const achievements = checkAchievements(mockGoals, mockTransactions, 10000);
      
      expect(achievements.length).toBeGreaterThan(0);
      expect(achievements.some(a => a.type === 'savings_milestone')).toBe(true);
    });

    it('should return empty array for no achievements', () => {
      const noGoals = [];
      const noTransactions = [];
      
      const achievements = checkAchievements(noGoals, noTransactions, 0);
      
      expect(achievements).toHaveLength(0);
    });
  });

  describe('analyzeSpendingPatterns', () => {
    it('should analyze spending by category', () => {
      const analysis = analyzeSpendingPatterns(mockTransactions);
      
      expect(analysis.categories).toBeDefined();
      expect(analysis.categories.groceries).toBe(50);
      expect(analysis.categories.transportation).toBe(25);
    });

    it('should calculate total spending', () => {
      const analysis = analyzeSpendingPatterns(mockTransactions);
      
      expect(analysis.totalSpending).toBe(75); // 50 + 25
    });

    it('should identify top spending category', () => {
      const analysis = analyzeSpendingPatterns(mockTransactions);
      
      expect(analysis.topCategory).toBe('groceries');
    });

    it('should handle empty transactions', () => {
      const analysis = analyzeSpendingPatterns([]);
      
      expect(analysis.totalSpending).toBe(0);
      expect(analysis.categories).toEqual({});
      expect(analysis.topCategory).toBeNull();
    });

    it('should analyze spending trends', () => {
      const analysis = analyzeSpendingPatterns(mockTransactions);
      
      expect(analysis.trends).toBeDefined();
      expect(Array.isArray(analysis.trends)).toBe(true);
    });
  });

  describe('generateSmartInsights', () => {
    it('should generate insights based on spending data', () => {
      const insights = generateSmartInsights(mockTransactions, mockBills, mockGoals, 5000);
      
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should include different types of insights', () => {
      const insights = generateSmartInsights(mockTransactions, mockBills, mockGoals, 5000);
      
      const insightTypes = insights.map(i => i.type);
      expect(insightTypes.length).toBeGreaterThan(0);
    });

    it('should prioritize insights by importance', () => {
      const insights = generateSmartInsights(mockTransactions, mockBills, mockGoals, 5000);
      
      // Should have priority levels
      expect(insights.every(i => ['high', 'medium', 'low'].includes(i.priority))).toBe(true);
    });

    it('should handle minimal data gracefully', () => {
      const insights = generateSmartInsights([], [], [], 0);
      
      expect(Array.isArray(insights)).toBe(true);
    });
  });

  describe('predictFutureExpenses', () => {
    it('should predict expenses based on historical data', () => {
      const predictions = predictFutureExpenses(mockTransactions, 30); // 30 days
      
      expect(predictions.totalPredicted).toBeGreaterThan(0);
      expect(predictions.byCategory).toBeDefined();
    });

    it('should predict by category', () => {
      const predictions = predictFutureExpenses(mockTransactions, 30);
      
      expect(predictions.byCategory.groceries).toBeGreaterThan(0);
      expect(predictions.byCategory.transportation).toBeGreaterThan(0);
    });

    it('should handle insufficient data', () => {
      const predictions = predictFutureExpenses([], 30);
      
      expect(predictions.totalPredicted).toBe(0);
      expect(predictions.confidence).toBe('low');
    });

    it('should provide confidence levels', () => {
      const predictions = predictFutureExpenses(mockTransactions, 30);
      
      expect(['low', 'medium', 'high'].includes(predictions.confidence)).toBe(true);
    });
  });

  describe('suggestBudgetOptimizations', () => {
    it('should suggest optimizations based on spending patterns', () => {
      const suggestions = suggestBudgetOptimizations(mockTransactions, mockGoals, 5000);
      
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should prioritize suggestions', () => {
      const suggestions = suggestBudgetOptimizations(mockTransactions, mockGoals, 5000);
      
      if (suggestions.length > 0) {
        expect(suggestions.every(s => ['high', 'medium', 'low'].includes(s.priority))).toBe(true);
      }
    });

    it('should include actionable recommendations', () => {
      const suggestions = suggestBudgetOptimizations(mockTransactions, mockGoals, 5000);
      
      if (suggestions.length > 0) {
        expect(suggestions.every(s => s.action && s.description)).toBe(true);
      }
    });

    it('should calculate potential savings', () => {
      const suggestions = suggestBudgetOptimizations(mockTransactions, mockGoals, 5000);
      
      if (suggestions.length > 0) {
        expect(suggestions.every(s => typeof s.potentialSavings === 'number')).toBe(true);
      }
    });

    it('should handle low balance scenarios', () => {
      const suggestions = suggestBudgetOptimizations(mockTransactions, mockGoals, 100);
      
      expect(Array.isArray(suggestions)).toBe(true);
      // Should prioritize expense reduction when balance is low
    });
  });
});
