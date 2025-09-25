/**
 * Comprehensive Bill Estimation Tests
 * Tests for recurring bill estimation and prediction algorithms
 */

import {
  BillEstimator,
  RecurringBillAnalyzer,
  BillPredictor,
  BillCategoryAnalyzer,
  calculateNextDueDate,
  estimateBillAmount,
  analyzeBillFrequency,
  predictUpcomingBills,
  categorizeBill,
  detectBillPatterns
} from '../billEstimation';

// Mock bill data
const mockBills = [
  {
    id: '1',
    name: 'Electric Bill',
    amount: 120,
    dueDate: new Date('2024-02-01'),
    category: 'utilities',
    isRecurring: true,
    frequency: 'monthly',
    history: [
      { date: new Date('2024-01-01'), amount: 115 },
      { date: new Date('2023-12-01'), amount: 118 },
      { date: new Date('2023-11-01'), amount: 122 }
    ]
  },
  {
    id: '2',
    name: 'Internet',
    amount: 80,
    dueDate: new Date('2024-01-25'),
    category: 'utilities',
    isRecurring: true,
    frequency: 'monthly',
    history: [
      { date: new Date('2023-12-25'), amount: 80 },
      { date: new Date('2023-11-25'), amount: 80 },
      { date: new Date('2023-10-25'), amount: 80 }
    ]
  },
  {
    id: '3',
    name: 'Car Insurance',
    amount: 300,
    dueDate: new Date('2024-03-15'),
    category: 'insurance',
    isRecurring: true,
    frequency: 'quarterly',
    history: [
      { date: new Date('2023-12-15'), amount: 295 },
      { date: new Date('2023-09-15'), amount: 300 },
      { date: new Date('2023-06-15'), amount: 285 }
    ]
  }
];

const mockTransactions = [
  {
    id: '1',
    amount: 115,
    description: 'ELECTRIC COMPANY',
    date: new Date('2024-01-01'),
    category: 'utilities',
    type: 'expense'
  },
  {
    id: '2',
    amount: 80,
    description: 'INTERNET PROVIDER',
    date: new Date('2023-12-25'),
    category: 'utilities',
    type: 'expense'
  },
  {
    id: '3',
    amount: 295,
    description: 'AUTO INSURANCE CO',
    date: new Date('2023-12-15'),
    category: 'insurance',
    type: 'expense'
  }
];

describe('BillEstimator', () => {
  let estimator: BillEstimator;

  beforeEach(() => {
    estimator = new BillEstimator();
  });

  describe('basic estimation', () => {
    it('should estimate simple recurring bills', () => {
      const estimate = estimator.estimateNextAmount(mockBills[0]);
      
      expect(estimate.amount).toBeGreaterThan(0);
      expect(estimate.confidence).toBeGreaterThan(0);
      expect(estimate.confidence).toBeLessThanOrEqual(100);
    });

    it('should handle bills with no history', () => {
      const billWithoutHistory = {
        ...mockBills[0],
        history: []
      };
      
      const estimate = estimator.estimateNextAmount(billWithoutHistory);
      
      expect(estimate.amount).toBe(billWithoutHistory.amount);
      expect(estimate.confidence).toBeLessThan(50);
    });

    it('should calculate confidence based on history length', () => {
      const billWithLongHistory = {
        ...mockBills[0],
        history: Array(12).fill(null).map((_, i) => ({
          date: new Date(2023, i, 1),
          amount: 120 + (Math.random() - 0.5) * 10
        }))
      };
      
      const estimate = estimator.estimateNextAmount(billWithLongHistory);
      
      expect(estimate.confidence).toBeGreaterThan(80);
    });
  });

  describe('seasonal adjustments', () => {
    it('should detect seasonal patterns in utility bills', () => {
      const seasonalBill = {
        ...mockBills[0],
        history: [
          { date: new Date('2023-07-01'), amount: 180 }, // Summer
          { date: new Date('2023-06-01'), amount: 175 }, // Summer
          { date: new Date('2023-01-01'), amount: 160 }, // Winter
          { date: new Date('2023-12-01'), amount: 155 }, // Winter
          { date: new Date('2023-04-01'), amount: 100 }, // Spring
          { date: new Date('2023-10-01'), amount: 105 }  // Fall
        ]
      };
      
      const estimate = estimator.estimateNextAmount(seasonalBill, new Date('2024-07-01'));
      
      expect(estimate.seasonalFactor).toBeGreaterThan(1); // Higher in summer
      expect(estimate.amount).toBeGreaterThan(seasonalBill.amount);
    });

    it('should apply different seasonal factors by category', () => {
      const heatingBill = {
        ...mockBills[0],
        category: 'heating',
        history: [
          { date: new Date('2023-01-01'), amount: 200 }, // Winter
          { date: new Date('2023-07-01'), amount: 50 }   // Summer
        ]
      };
      
      const winterEstimate = estimator.estimateNextAmount(heatingBill, new Date('2024-01-01'));
      const summerEstimate = estimator.estimateNextAmount(heatingBill, new Date('2024-07-01'));
      
      expect(winterEstimate.amount).toBeGreaterThan(summerEstimate.amount);
    });
  });

  describe('trend analysis', () => {
    it('should detect increasing trends', () => {
      const increasingBill = {
        ...mockBills[0],
        history: [
          { date: new Date('2023-09-01'), amount: 100 },
          { date: new Date('2023-10-01'), amount: 105 },
          { date: new Date('2023-11-01'), amount: 110 },
          { date: new Date('2023-12-01'), amount: 115 }
        ]
      };
      
      const estimate = estimator.estimateNextAmount(increasingBill);
      
      expect(estimate.trend).toBe('increasing');
      expect(estimate.amount).toBeGreaterThan(115);
    });

    it('should detect decreasing trends', () => {
      const decreasingBill = {
        ...mockBills[0],
        history: [
          { date: new Date('2023-09-01'), amount: 120 },
          { date: new Date('2023-10-01'), amount: 115 },
          { date: new Date('2023-11-01'), amount: 110 },
          { date: new Date('2023-12-01'), amount: 105 }
        ]
      };
      
      const estimate = estimator.estimateNextAmount(decreasingBill);
      
      expect(estimate.trend).toBe('decreasing');
      expect(estimate.amount).toBeLessThan(105);
    });

    it('should detect stable trends', () => {
      const stableBill = {
        ...mockBills[1], // Internet bill with consistent $80
        history: [
          { date: new Date('2023-09-25'), amount: 80 },
          { date: new Date('2023-10-25'), amount: 80 },
          { date: new Date('2023-11-25'), amount: 80 },
          { date: new Date('2023-12-25'), amount: 80 }
        ]
      };
      
      const estimate = estimator.estimateNextAmount(stableBill);
      
      expect(estimate.trend).toBe('stable');
      expect(estimate.amount).toBe(80);
      expect(estimate.confidence).toBeGreaterThan(90);
    });
  });
});

describe('RecurringBillAnalyzer', () => {
  let analyzer: RecurringBillAnalyzer;

  beforeEach(() => {
    analyzer = new RecurringBillAnalyzer();
  });

  describe('frequency detection', () => {
    it('should detect monthly frequency', () => {
      const monthlyTransactions = [
        { date: new Date('2024-01-15'), amount: 100, description: 'MONTHLY SERVICE' },
        { date: new Date('2023-12-15'), amount: 100, description: 'MONTHLY SERVICE' },
        { date: new Date('2023-11-15'), amount: 100, description: 'MONTHLY SERVICE' }
      ];
      
      const frequency = analyzer.detectFrequency(monthlyTransactions);
      
      expect(frequency.type).toBe('monthly');
      expect(frequency.confidence).toBeGreaterThan(80);
    });

    it('should detect weekly frequency', () => {
      const weeklyTransactions = [
        { date: new Date('2024-01-15'), amount: 50, description: 'WEEKLY PAYMENT' },
        { date: new Date('2024-01-08'), amount: 50, description: 'WEEKLY PAYMENT' },
        { date: new Date('2024-01-01'), amount: 50, description: 'WEEKLY PAYMENT' }
      ];
      
      const frequency = analyzer.detectFrequency(weeklyTransactions);
      
      expect(frequency.type).toBe('weekly');
      expect(frequency.confidence).toBeGreaterThan(70);
    });

    it('should detect quarterly frequency', () => {
      const quarterlyTransactions = [
        { date: new Date('2024-01-01'), amount: 300, description: 'QUARTERLY PAYMENT' },
        { date: new Date('2023-10-01'), amount: 300, description: 'QUARTERLY PAYMENT' },
        { date: new Date('2023-07-01'), amount: 300, description: 'QUARTERLY PAYMENT' }
      ];
      
      const frequency = analyzer.detectFrequency(quarterlyTransactions);
      
      expect(frequency.type).toBe('quarterly');
      expect(frequency.confidence).toBeGreaterThan(75);
    });

    it('should handle irregular patterns', () => {
      const irregularTransactions = [
        { date: new Date('2024-01-15'), amount: 100, description: 'IRREGULAR' },
        { date: new Date('2023-11-22'), amount: 95, description: 'IRREGULAR' },
        { date: new Date('2023-08-03'), amount: 105, description: 'IRREGULAR' }
      ];
      
      const frequency = analyzer.detectFrequency(irregularTransactions);
      
      expect(frequency.type).toBe('irregular');
      expect(frequency.confidence).toBeLessThan(50);
    });
  });

  describe('pattern recognition', () => {
    it('should group similar transactions', () => {
      const transactions = [
        { date: new Date('2024-01-01'), amount: 80, description: 'COMCAST INTERNET' },
        { date: new Date('2023-12-01'), amount: 80, description: 'COMCAST CABLE' },
        { date: new Date('2023-11-01'), amount: 80, description: 'COMCAST SERVICES' }
      ];
      
      const groups = analyzer.groupSimilarTransactions(transactions);
      
      expect(groups).toHaveLength(1);
      expect(groups[0].transactions).toHaveLength(3);
      expect(groups[0].similarity).toBeGreaterThan(80);
    });

    it('should separate different bill types', () => {
      const mixedTransactions = [
        { date: new Date('2024-01-01'), amount: 80, description: 'COMCAST INTERNET' },
        { date: new Date('2024-01-05'), amount: 120, description: 'ELECTRIC COMPANY' },
        { date: new Date('2023-12-01'), amount: 80, description: 'COMCAST CABLE' },
        { date: new Date('2023-12-05'), amount: 115, description: 'ELECTRIC BILL' }
      ];
      
      const groups = analyzer.groupSimilarTransactions(mixedTransactions);
      
      expect(groups).toHaveLength(2);
      expect(groups.some(g => g.category === 'utilities')).toBe(true);
    });
  });
});

describe('BillPredictor', () => {
  let predictor: BillPredictor;

  beforeEach(() => {
    predictor = new BillPredictor();
  });

  describe('upcoming bill prediction', () => {
    it('should predict bills for next 30 days', () => {
      const predictions = predictor.predictUpcomingBills(mockBills, 30);
      
      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeGreaterThan(0);
      
      predictions.forEach(prediction => {
        expect(prediction.dueDate).toBeInstanceOf(Date);
        expect(prediction.estimatedAmount).toBeGreaterThan(0);
        expect(prediction.confidence).toBeGreaterThan(0);
      });
    });

    it('should handle different prediction windows', () => {
      const shortTerm = predictor.predictUpcomingBills(mockBills, 7);
      const longTerm = predictor.predictUpcomingBills(mockBills, 90);
      
      expect(shortTerm.length).toBeLessThanOrEqual(longTerm.length);
    });

    it('should sort predictions by due date', () => {
      const predictions = predictor.predictUpcomingBills(mockBills, 60);
      
      for (let i = 1; i < predictions.length; i++) {
        expect(predictions[i].dueDate.getTime()).toBeGreaterThanOrEqual(
          predictions[i - 1].dueDate.getTime()
        );
      }
    });
  });

  describe('total cost estimation', () => {
    it('should calculate total estimated costs', () => {
      const totalEstimate = predictor.estimateTotalCosts(mockBills, 30);
      
      expect(totalEstimate.total).toBeGreaterThan(0);
      expect(totalEstimate.byCategory).toBeDefined();
      expect(totalEstimate.confidence).toBeGreaterThan(0);
    });

    it('should break down costs by category', () => {
      const totalEstimate = predictor.estimateTotalCosts(mockBills, 30);
      
      expect(totalEstimate.byCategory.utilities).toBeGreaterThan(0);
      expect(totalEstimate.byCategory.insurance).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty bill list', () => {
      const totalEstimate = predictor.estimateTotalCosts([], 30);
      
      expect(totalEstimate.total).toBe(0);
      expect(Object.keys(totalEstimate.byCategory)).toHaveLength(0);
    });
  });
});

describe('BillCategoryAnalyzer', () => {
  let categoryAnalyzer: BillCategoryAnalyzer;

  beforeEach(() => {
    categoryAnalyzer = new BillCategoryAnalyzer();
  });

  describe('automatic categorization', () => {
    it('should categorize utility bills', () => {
      const utilityDescriptions = [
        'ELECTRIC COMPANY',
        'GAS UTILITY',
        'WATER DEPARTMENT',
        'COMCAST INTERNET',
        'VERIZON WIRELESS'
      ];
      
      utilityDescriptions.forEach(description => {
        const category = categoryAnalyzer.categorize(description, 100);
        expect(['utilities', 'phone', 'internet']).toContain(category);
      });
    });

    it('should categorize insurance bills', () => {
      const insuranceDescriptions = [
        'STATE FARM AUTO',
        'HEALTH INSURANCE',
        'HOMEOWNERS INSURANCE',
        'LIFE INSURANCE CO'
      ];
      
      insuranceDescriptions.forEach(description => {
        const category = categoryAnalyzer.categorize(description, 200);
        expect(category).toBe('insurance');
      });
    });

    it('should use amount hints for categorization', () => {
      // Large amounts might indicate rent/mortgage
      const largeAmount = categoryAnalyzer.categorize('MONTHLY PAYMENT', 2000);
      expect(['housing', 'rent', 'mortgage']).toContain(largeAmount);
      
      // Small amounts might indicate subscriptions
      const smallAmount = categoryAnalyzer.categorize('MONTHLY PAYMENT', 15);
      expect(['subscription', 'entertainment']).toContain(smallAmount);
    });
  });

  describe('learning from user input', () => {
    it('should learn from user categorizations', () => {
      categoryAnalyzer.learn('CUSTOM COMPANY', 'custom_category');
      
      const category = categoryAnalyzer.categorize('CUSTOM COMPANY', 100);
      expect(category).toBe('custom_category');
    });

    it('should improve accuracy with more training data', () => {
      const initialAccuracy = categoryAnalyzer.getAccuracy();
      
      // Add training data
      categoryAnalyzer.learn('NETFLIX', 'entertainment');
      categoryAnalyzer.learn('SPOTIFY', 'entertainment');
      categoryAnalyzer.learn('AMAZON PRIME', 'entertainment');
      
      const improvedAccuracy = categoryAnalyzer.getAccuracy();
      expect(improvedAccuracy).toBeGreaterThanOrEqual(initialAccuracy);
    });
  });
});

describe('Utility Functions', () => {
  describe('calculateNextDueDate', () => {
    it('should calculate next monthly due date', () => {
      const lastDue = new Date('2024-01-15');
      const nextDue = calculateNextDueDate(lastDue, 'monthly');
      
      expect(nextDue.getMonth()).toBe(1); // February
      expect(nextDue.getDate()).toBe(15);
    });

    it('should calculate next weekly due date', () => {
      const lastDue = new Date('2024-01-15'); // Monday
      const nextDue = calculateNextDueDate(lastDue, 'weekly');
      
      const daysDiff = (nextDue.getTime() - lastDue.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBe(7);
    });

    it('should calculate next quarterly due date', () => {
      const lastDue = new Date('2024-01-15');
      const nextDue = calculateNextDueDate(lastDue, 'quarterly');
      
      expect(nextDue.getMonth()).toBe(3); // April
      expect(nextDue.getDate()).toBe(15);
    });

    it('should handle end-of-month dates', () => {
      const lastDue = new Date('2024-01-31');
      const nextDue = calculateNextDueDate(lastDue, 'monthly');
      
      // Should handle February not having 31 days
      expect(nextDue.getMonth()).toBe(1); // February
      expect(nextDue.getDate()).toBeLessThanOrEqual(29);
    });
  });

  describe('estimateBillAmount', () => {
    it('should estimate based on historical average', () => {
      const history = [100, 110, 105, 95, 120];
      const estimate = estimateBillAmount(history);
      
      const average = history.reduce((a, b) => a + b) / history.length;
      expect(estimate).toBeCloseTo(average, 1);
    });

    it('should handle empty history', () => {
      const estimate = estimateBillAmount([]);
      expect(estimate).toBe(0);
    });

    it('should apply trend adjustments', () => {
      const increasingHistory = [100, 105, 110, 115, 120];
      const estimate = estimateBillAmount(increasingHistory, { applyTrend: true });
      
      expect(estimate).toBeGreaterThan(120); // Should predict continued increase
    });
  });

  describe('analyzeBillFrequency', () => {
    it('should analyze transaction frequency', () => {
      const dates = [
        new Date('2024-01-15'),
        new Date('2023-12-15'),
        new Date('2023-11-15'),
        new Date('2023-10-15')
      ];
      
      const analysis = analyzeBillFrequency(dates);
      
      expect(analysis.frequency).toBe('monthly');
      expect(analysis.confidence).toBeGreaterThan(80);
      expect(analysis.averageInterval).toBeCloseTo(30, 5); // ~30 days
    });

    it('should detect irregular patterns', () => {
      const irregularDates = [
        new Date('2024-01-15'),
        new Date('2023-11-03'),
        new Date('2023-07-22')
      ];
      
      const analysis = analyzeBillFrequency(irregularDates);
      
      expect(analysis.frequency).toBe('irregular');
      expect(analysis.confidence).toBeLessThan(50);
    });
  });

  describe('predictUpcomingBills', () => {
    it('should predict based on bill data', () => {
      const predictions = predictUpcomingBills(mockBills, new Date('2024-01-20'), 30);
      
      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeGreaterThan(0);
      
      predictions.forEach(prediction => {
        expect(prediction.billId).toBeDefined();
        expect(prediction.dueDate).toBeInstanceOf(Date);
        expect(prediction.estimatedAmount).toBeGreaterThan(0);
      });
    });

    it('should only include bills within date range', () => {
      const predictions = predictUpcomingBills(mockBills, new Date('2024-01-20'), 7);
      
      const endDate = new Date('2024-01-27');
      predictions.forEach(prediction => {
        expect(prediction.dueDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });
  });

  describe('categorizeBill', () => {
    it('should categorize based on description patterns', () => {
      expect(categorizeBill('ELECTRIC COMPANY', 120)).toBe('utilities');
      expect(categorizeBill('STATE FARM AUTO', 300)).toBe('insurance');
      expect(categorizeBill('NETFLIX', 15)).toBe('entertainment');
      expect(categorizeBill('MORTGAGE PAYMENT', 2000)).toBe('housing');
    });

    it('should handle unknown descriptions', () => {
      const category = categorizeBill('UNKNOWN COMPANY XYZ', 100);
      expect(['other', 'unknown', 'miscellaneous']).toContain(category);
    });
  });

  describe('detectBillPatterns', () => {
    it('should detect patterns in transaction history', () => {
      const patterns = detectBillPatterns(mockTransactions);
      
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
      
      patterns.forEach(pattern => {
        expect(pattern.description).toBeDefined();
        expect(pattern.frequency).toBeDefined();
        expect(pattern.averageAmount).toBeGreaterThan(0);
        expect(pattern.transactions.length).toBeGreaterThan(0);
      });
    });

    it('should group similar transactions', () => {
      const duplicatedTransactions = [
        ...mockTransactions,
        {
          id: '4',
          amount: 118,
          description: 'ELECTRIC COMPANY BILL',
          date: new Date('2023-12-01'),
          category: 'utilities',
          type: 'expense'
        }
      ];
      
      const patterns = detectBillPatterns(duplicatedTransactions);
      
      // Should group electric company transactions
      const electricPattern = patterns.find(p => 
        p.description.toLowerCase().includes('electric')
      );
      
      expect(electricPattern).toBeDefined();
      expect(electricPattern?.transactions.length).toBeGreaterThan(1);
    });
  });
});
