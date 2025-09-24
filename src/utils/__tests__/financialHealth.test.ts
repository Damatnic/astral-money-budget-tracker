import { 
  calculateFinancialHealth, 
  generateFinancialRecommendations 
} from '../financialHealth';

describe('financialHealth', () => {
  describe('calculateFinancialHealth', () => {
    const baseData = {
      balance: 1000,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      emergencyFund: 9000,
      goals: [
        { current: 500, target: 1000, targetDate: '2024-12-31' },
        { current: 2000, target: 4000, targetDate: '2025-06-30' },
      ]
    };

    it('should calculate perfect financial health score', () => {
      const perfectData = {
        balance: 10000,
        monthlyIncome: 6000,
        monthlyExpenses: 3000,
        emergencyFund: 18000, // 6 months of expenses
        goals: [
          { current: 1000, target: 1000, targetDate: '2024-12-31' },
          { current: 5000, target: 5000, targetDate: '2025-06-30' },
        ]
      };

      const score = calculateFinancialHealth(perfectData);
      expect(score).toBe(100);
    });

    it('should calculate income vs expenses correctly', () => {
      // Income exceeds expenses (30 points)
      const goodIncomeData = { ...baseData, monthlyIncome: 4000, monthlyExpenses: 3000 };
      expect(calculateFinancialHealth(goodIncomeData)).toBeGreaterThan(50);

      // Income equals expenses (partial points)
      const equalIncomeData = { ...baseData, monthlyIncome: 3000, monthlyExpenses: 3000 };
      expect(calculateFinancialHealth(equalIncomeData)).toBeLessThan(calculateFinancialHealth(goodIncomeData));

      // Income less than expenses (minimal points)
      const poorIncomeData = { ...baseData, monthlyIncome: 2000, monthlyExpenses: 3000 };
      expect(calculateFinancialHealth(poorIncomeData)).toBeLessThan(calculateFinancialHealth(equalIncomeData));
    });

    it('should calculate emergency fund score correctly', () => {
      // Perfect emergency fund (3+ months)
      const perfectEmergencyData = { ...baseData, emergencyFund: 9000 }; // 3 months
      const perfectScore = calculateFinancialHealth(perfectEmergencyData);

      // Partial emergency fund
      const partialEmergencyData = { ...baseData, emergencyFund: 4500 }; // 1.5 months
      const partialScore = calculateFinancialHealth(partialEmergencyData);

      // No emergency fund
      const noEmergencyData = { ...baseData, emergencyFund: 0 };
      const noEmergencyScore = calculateFinancialHealth(noEmergencyData);

      expect(perfectScore).toBeGreaterThan(partialScore);
      expect(partialScore).toBeGreaterThan(noEmergencyScore);
    });

    it('should handle emergency fund with no expenses', () => {
      const noExpensesData = {
        ...baseData,
        monthlyExpenses: 0,
        emergencyFund: 5000
      };

      const score = calculateFinancialHealth(noExpensesData);
      expect(score).toBeGreaterThan(0);
    });

    it('should calculate balance score correctly', () => {
      // Positive balance (20 points)
      const positiveBalanceData = { ...baseData, balance: 1000 };
      const positiveScore = calculateFinancialHealth(positiveBalanceData);

      // Small negative balance (10 points)
      const smallNegativeData = { ...baseData, balance: -500 };
      const smallNegativeScore = calculateFinancialHealth(smallNegativeData);

      // Large negative balance (0 points)
      const largeNegativeData = { ...baseData, balance: -2000 };
      const largeNegativeScore = calculateFinancialHealth(largeNegativeData);

      expect(positiveScore).toBeGreaterThan(smallNegativeScore);
      expect(smallNegativeScore).toBeGreaterThan(largeNegativeScore);
    });

    it('should calculate goal progress correctly', () => {
      // Multiple goals with different progress
      const multipleGoalsData = {
        ...baseData,
        goals: [
          { current: 500, target: 1000, targetDate: '2024-12-31' }, // 50% complete
          { current: 2000, target: 4000, targetDate: '2025-06-30' }, // 50% complete
          { current: 1000, target: 500, targetDate: '2025-12-31' }, // 200% complete (capped at 100%)
        ]
      };

      const score = calculateFinancialHealth(multipleGoalsData);
      expect(score).toBeGreaterThan(0);
    });

    it('should handle no goals', () => {
      const noGoalsData = { ...baseData, goals: [] };
      const score = calculateFinancialHealth(noGoalsData);
      
      // Should still calculate other aspects of financial health
      expect(score).toBeGreaterThan(0);
    });

    it('should calculate saving habits score', () => {
      // Income > Expenses (gets saving bonus)
      const savingData = { ...baseData, monthlyIncome: 4000, monthlyExpenses: 3000 };
      const savingScore = calculateFinancialHealth(savingData);

      // Income = Expenses (no saving bonus)
      const breakEvenData = { ...baseData, monthlyIncome: 3000, monthlyExpenses: 3000 };
      const breakEvenScore = calculateFinancialHealth(breakEvenData);

      expect(savingScore).toBeGreaterThan(breakEvenScore);
    });

    it('should handle zero income', () => {
      const zeroIncomeData = { ...baseData, monthlyIncome: 0 };
      const score = calculateFinancialHealth(zeroIncomeData);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle extreme negative values', () => {
      const extremeData = {
        balance: -10000,
        monthlyIncome: 0,
        monthlyExpenses: 5000,
        emergencyFund: 0,
        goals: []
      };

      const score = calculateFinancialHealth(extremeData);
      expect(score).toBe(0);
    });

    it('should cap score at 100', () => {
      const extremelyGoodData = {
        balance: 100000,
        monthlyIncome: 20000,
        monthlyExpenses: 1000,
        emergencyFund: 50000,
        goals: [
          { current: 10000, target: 1000, targetDate: '2024-12-31' },
          { current: 20000, target: 2000, targetDate: '2025-06-30' },
        ]
      };

      const score = calculateFinancialHealth(extremelyGoodData);
      expect(score).toBe(100);
    });

    it('should handle goals with zero target', () => {
      const zeroTargetGoalData = {
        ...baseData,
        goals: [
          { current: 500, target: 0, targetDate: '2024-12-31' },
          { current: 1000, target: 2000, targetDate: '2025-06-30' },
        ]
      };

      const score = calculateFinancialHealth(zeroTargetGoalData);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return integer scores', () => {
      const score = calculateFinancialHealth(baseData);
      expect(Number.isInteger(score)).toBe(true);
    });
  });

  describe('generateFinancialRecommendations', () => {
    it('should recommend expense reduction when expenses exceed income', () => {
      const data = {
        balance: 1000,
        monthlyIncome: 3000,
        monthlyExpenses: 4000,
        emergencyFund: 5000,
        goals: []
      };

      const recommendations = generateFinancialRecommendations(data);
      expect(recommendations).toContain('Reduce monthly expenses to match or stay below income');
    });

    it('should recommend building emergency fund', () => {
      const data = {
        balance: 1000,
        monthlyIncome: 4000,
        monthlyExpenses: 3000,
        emergencyFund: 5000, // Less than 3 months (9000)
        goals: []
      };

      const recommendations = generateFinancialRecommendations(data);
      expect(recommendations).toContain('Build emergency fund to cover 3-6 months of expenses');
    });

    it('should recommend eliminating negative balance', () => {
      const data = {
        balance: -500,
        monthlyIncome: 4000,
        monthlyExpenses: 3000,
        emergencyFund: 10000,
        goals: []
      };

      const recommendations = generateFinancialRecommendations(data);
      expect(recommendations).toContain('Focus on eliminating negative balance');
    });

    it('should recommend setting financial goals', () => {
      const data = {
        balance: 1000,
        monthlyIncome: 4000,
        monthlyExpenses: 3000,
        emergencyFund: 10000,
        goals: []
      };

      const recommendations = generateFinancialRecommendations(data);
      expect(recommendations).toContain('Set financial goals to improve long-term planning');
    });

    it('should provide multiple recommendations when applicable', () => {
      const data = {
        balance: -1000,
        monthlyIncome: 2000,
        monthlyExpenses: 3000,
        emergencyFund: 1000,
        goals: []
      };

      const recommendations = generateFinancialRecommendations(data);
      expect(recommendations).toHaveLength(4); // All recommendations should apply
      expect(recommendations).toContain('Reduce monthly expenses to match or stay below income');
      expect(recommendations).toContain('Build emergency fund to cover 3-6 months of expenses');
      expect(recommendations).toContain('Focus on eliminating negative balance');
      expect(recommendations).toContain('Set financial goals to improve long-term planning');
    });

    it('should provide no recommendations for perfect financial health', () => {
      const data = {
        balance: 5000,
        monthlyIncome: 6000,
        monthlyExpenses: 4000,
        emergencyFund: 24000, // 6 months
        goals: [
          { current: 1000, target: 2000, targetDate: '2024-12-31' }
        ]
      };

      const recommendations = generateFinancialRecommendations(data);
      expect(recommendations).toHaveLength(0);
    });

    it('should handle edge case with zero expenses', () => {
      const data = {
        balance: 1000,
        monthlyIncome: 4000,
        monthlyExpenses: 0,
        emergencyFund: 5000,
        goals: []
      };

      const recommendations = generateFinancialRecommendations(data);
      // Should not recommend building emergency fund when expenses are 0
      expect(recommendations).not.toContain('Build emergency fund to cover 3-6 months of expenses');
    });

    it('should handle sufficient emergency fund correctly', () => {
      const data = {
        balance: 1000,
        monthlyIncome: 4000,
        monthlyExpenses: 3000,
        emergencyFund: 12000, // 4 months, which is sufficient
        goals: [{ current: 500, target: 1000, targetDate: '2024-12-31' }]
      };

      const recommendations = generateFinancialRecommendations(data);
      expect(recommendations).not.toContain('Build emergency fund to cover 3-6 months of expenses');
    });
  });
});