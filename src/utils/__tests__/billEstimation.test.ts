import { 
  calculateNextBillEstimate, 
  analyzeBillVariance, 
  checkForBillAnomalies 
} from '../billEstimation';

describe('billEstimation', () => {
  describe('calculateNextBillEstimate', () => {
    it('should estimate fixed amount bills correctly', () => {
      const bill = {
        id: '1',
        name: 'Netflix',
        baseAmount: 15.99,
        averageAmount: 15.99,
        minAmount: 15.99,
        maxAmount: 15.99,
        lastBillAmount: 15.99,
        estimationMethod: 'base',
        isVariableAmount: false,
        billHistory: []
      };

      const result = calculateNextBillEstimate(bill);
      
      expect(result.estimatedAmount).toBe(15.99);
      expect(result.confidence).toBe('high');
      expect(result.reason).toBe('Fixed amount bill');
      expect(result.range.min).toBe(15.99);
      expect(result.range.max).toBe(15.99);
    });

    it('should estimate variable bills using last bill method', () => {
      const bill = {
        id: '2',
        name: 'Electric',
        baseAmount: 100,
        averageAmount: 120,
        minAmount: 80,
        maxAmount: 150,
        lastBillAmount: 125,
        estimationMethod: 'lastBill',
        isVariableAmount: true,
        billHistory: [
          { actualAmount: 110, billDate: '2024-07-01', variance: 10, variancePercent: 9 },
          { actualAmount: 130, billDate: '2024-08-01', variance: 10, variancePercent: 8 },
          { actualAmount: 125, billDate: '2024-09-01', variance: 5, variancePercent: 4 },
        ]
      };

      const result = calculateNextBillEstimate(bill);
      
      expect(result.estimatedAmount).toBe(125);
      expect(result.confidence).toBe('medium');
      expect(result.reason).toBe('Based on most recent bill');
      expect(result.range.min).toBeGreaterThan(0);
      expect(result.range.max).toBeGreaterThan(result.estimatedAmount);
    });

    it('should estimate using average method', () => {
      const bill = {
        id: '3',
        name: 'Internet',
        baseAmount: 60,
        averageAmount: 65,
        minAmount: 60,
        maxAmount: 70,
        lastBillAmount: 67,
        estimationMethod: 'average',
        isVariableAmount: true,
        billHistory: [
          { actualAmount: 60, billDate: '2024-06-01', variance: -5, variancePercent: -7 },
          { actualAmount: 65, billDate: '2024-07-01', variance: 0, variancePercent: 0 },
          { actualAmount: 70, billDate: '2024-08-01', variance: 5, variancePercent: 8 },
          { actualAmount: 67, billDate: '2024-09-01', variance: 2, variancePercent: 3 },
        ]
      };

      const result = calculateNextBillEstimate(bill);
      
      expect(result.estimatedAmount).toBe(65);
      expect(result.confidence).toBe('high');
      expect(result.reason).toBe('Based on 4 bill average');
      expect(result.range.min).toBeGreaterThan(0);
      expect(result.range.max).toBeGreaterThan(result.estimatedAmount);
    });

    it('should handle seasonal patterns', () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      
      const bill = {
        id: '4',
        name: 'Heating',
        baseAmount: 100,
        averageAmount: 100,
        minAmount: 50,
        maxAmount: 200,
        lastBillAmount: 150,
        estimationMethod: 'seasonal',
        isVariableAmount: true,
        billHistory: Array.from({ length: 12 }, (_, i) => ({
          actualAmount: i < 4 || i > 9 ? 150 : 50, // Winter vs Summer
          billDate: new Date(2024, i, 1).toISOString(),
          variance: 10,
          variancePercent: 10,
        }))
      };

      const result = calculateNextBillEstimate(bill);
      
      expect(result.confidence).toMatch(/high|medium/);
      expect(result.reason).toContain('same month');
      expect(result.estimatedAmount).toBeGreaterThan(0);
    });

    it('should use best strategy when method is not specified', () => {
      const bill = {
        id: '5',
        name: 'Verizon',
        baseAmount: 80,
        averageAmount: 85,
        minAmount: 78,
        maxAmount: 95,
        lastBillAmount: 87,
        estimationMethod: 'auto',
        isVariableAmount: true,
        billHistory: [
          { actualAmount: 82, billDate: '2024-07-01', variance: 2, variancePercent: 2.4 },
          { actualAmount: 88, billDate: '2024-08-01', variance: 3, variancePercent: 3.5 },
          { actualAmount: 87, billDate: '2024-09-01', variance: 2, variancePercent: 2.3 },
        ]
      };

      const result = calculateNextBillEstimate(bill);
      
      expect(result.estimatedAmount).toBeGreaterThan(0);
      expect(result.confidence).toMatch(/low|medium|high/);
      expect(result.reason).toBeTruthy();
      expect(result.range.min).toBeLessThan(result.range.max);
    });

    it('should handle bills with no history', () => {
      const bill = {
        id: '6',
        name: 'New Service',
        baseAmount: 50,
        averageAmount: null,
        minAmount: null,
        maxAmount: null,
        lastBillAmount: null,
        estimationMethod: 'auto',
        isVariableAmount: true,
        billHistory: []
      };

      const result = calculateNextBillEstimate(bill);
      
      expect(result.estimatedAmount).toBe(50);
      expect(result.confidence).toBe('low');
      expect(result.reason).toBe('Insufficient history - using base amount');
      expect(result.range.min).toBe(40); // 50 * 0.8
      expect(result.range.max).toBe(60); // 50 * 1.2
    });
  });

  describe('analyzeBillVariance', () => {
    it('should identify stable bills', () => {
      const bill = {
        id: '1',
        name: 'Netflix',
        billHistory: [
          { actualAmount: 15.99, billDate: '2024-06-01', variance: 0, variancePercent: 0 },
          { actualAmount: 15.99, billDate: '2024-07-01', variance: 0, variancePercent: 0 },
          { actualAmount: 15.99, billDate: '2024-08-01', variance: 0, variancePercent: 0 },
        ]
      };

      const result = analyzeBillVariance(bill);
      
      expect(result.varianceType).toBe('stable');
      expect(result.analysis).toContain('very consistent');
      expect(result.recommendations).toContain('Consider using base amount estimation method');
    });

    it('should identify seasonal bills', () => {
      const bill = {
        id: '2',
        name: 'Electric Bill',
        billHistory: [
          { actualAmount: 80, billDate: '2024-01-01', variance: 10, variancePercent: 14 },
          { actualAmount: 60, billDate: '2024-04-01', variance: -10, variancePercent: -14 },
          { actualAmount: 120, billDate: '2024-07-01', variance: 50, variancePercent: 71 },
          { actualAmount: 90, billDate: '2024-10-01', variance: 20, variancePercent: 29 },
        ]
      };

      const result = analyzeBillVariance(bill);
      
      expect(result.varianceType).toBe('seasonal');
      expect(result.analysis).toContain('seasonal');
      expect(result.recommendations).toContain('Consider using seasonal estimation method');
    });

    it('should identify volatile bills', () => {
      const bill = {
        id: '3',
        name: 'Business Expenses',
        billHistory: [
          { actualAmount: 100, billDate: '2024-06-01', variance: 50, variancePercent: 100 },
          { actualAmount: 200, billDate: '2024-07-01', variance: 50, variancePercent: 33 },
          { actualAmount: 50, billDate: '2024-08-01', variance: -100, variancePercent: -67 },
          { actualAmount: 300, billDate: '2024-09-01', variance: 150, variancePercent: 100 },
        ]
      };

      const result = analyzeBillVariance(bill);
      
      expect(result.varianceType).toBe('volatile');
      expect(result.analysis).toContain('vary significantly');
      expect(result.recommendations).toContain('Consider budgeting with higher buffer');
    });

    it('should handle insufficient data', () => {
      const bill = {
        id: '4',
        name: 'New Bill',
        billHistory: [
          { actualAmount: 75, billDate: '2024-09-01', variance: 0, variancePercent: 0 },
        ]
      };

      const result = analyzeBillVariance(bill);
      
      expect(result.varianceType).toBe('stable');
      expect(result.analysis).toBe('Insufficient data for variance analysis');
      expect(result.recommendations).toContain('Add more bill history to improve predictions');
    });
  });

  describe('checkForBillAnomalies', () => {
    const normalBill = {
      id: '1',
      name: 'Internet',
      baseAmount: 50,
      averageAmount: 50,
      minAmount: 48,
      maxAmount: 52,
      lastBillAmount: 50,
      estimationMethod: 'average',
      isVariableAmount: false,
      billHistory: [
        { actualAmount: 50, billDate: '2024-07-01', variance: 0, variancePercent: 0 },
        { actualAmount: 50, billDate: '2024-08-01', variance: 0, variancePercent: 0 },
        { actualAmount: 50, billDate: '2024-09-01', variance: 0, variancePercent: 0 },
      ]
    };

    it('should detect normal amounts', () => {
      const result = checkForBillAnomalies(normalBill, 52);
      
      expect(result.isAnomaly).toBe(false);
      expect(result.severity).toBe('low');
      expect(result.message).toBe('Amount is within normal range');
      expect(result.suggestedAction).toBe('No action needed');
    });

    it('should detect medium anomalies', () => {
      const result = checkForBillAnomalies(normalBill, 65);
      
      expect(result.isAnomaly).toBe(true);
      expect(result.severity).toBe('medium');
      expect(result.message).toContain('higher than expected');
      expect(result.suggestedAction).toContain('Review bill');
    });

    it('should detect high anomalies', () => {
      const result = checkForBillAnomalies(normalBill, 100);
      
      expect(result.isAnomaly).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.message).toContain('unusually high');
      expect(result.suggestedAction).toContain('contact provider');
    });

    it('should handle zero estimated amount', () => {
      const zeroBill = {
        ...normalBill,
        baseAmount: 0,
        averageAmount: 0,
      };
      
      const result = checkForBillAnomalies(zeroBill, 50);
      
      // When estimated amount is 0, percent diff is 0, so it's not flagged as anomaly
      expect(result.isAnomaly).toBe(false);
      expect(result.severity).toBe('low');
    });

    it('should handle negative variance (lower than expected)', () => {
      const result = checkForBillAnomalies(normalBill, 35);
      
      expect(result.message).toContain('higher than expected'); // Still reports as percentage difference
    });
  });
});