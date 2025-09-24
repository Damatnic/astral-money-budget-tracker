/**
 * Bill Estimation Utilities
 * Provides intelligent estimation for variable recurring bills like Verizon
 */

interface BillHistory {
  actualAmount: number;
  billDate: Date | string;
  variance: number;
  variancePercent: number;
}

interface RecurringBill {
  id: string;
  name: string;
  baseAmount?: number | null;
  averageAmount?: number | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  lastBillAmount?: number | null;
  estimationMethod: string;
  isVariableAmount: boolean;
  billHistory?: BillHistory[];
}

/**
 * Calculate the best estimate for next bill amount
 */
export function calculateNextBillEstimate(bill: RecurringBill): {
  estimatedAmount: number;
  confidence: 'low' | 'medium' | 'high';
  reason: string;
  range: { min: number; max: number };
} {
  const { isVariableAmount, estimationMethod, billHistory = [] } = bill;
  
  // For fixed amount bills, use base amount
  if (!isVariableAmount) {
    const amount = bill.baseAmount || bill.averageAmount || 0;
    return {
      estimatedAmount: amount,
      confidence: 'high',
      reason: 'Fixed amount bill',
      range: { min: amount, max: amount }
    };
  }

  // For variable bills, use different strategies based on estimation method
  switch (estimationMethod) {
    case 'lastBill':
      return estimateFromLastBill(bill);
    
    case 'average':
      return estimateFromAverage(bill);
    
    case 'seasonal':
      return estimateFromSeasonalPattern(bill);
    
    case 'trend':
      return estimateFromTrend(bill);
    
    default:
      return estimateFromBestStrategy(bill);
  }
}

/**
 * Estimate based on last bill amount
 */
function estimateFromLastBill(bill: RecurringBill) {
  const lastAmount = bill.lastBillAmount || bill.averageAmount || bill.baseAmount || 0;
  const variance = calculateVarianceRange(bill);
  
  return {
    estimatedAmount: lastAmount,
    confidence: bill.billHistory && bill.billHistory.length > 0 ? 'medium' : 'low' as 'medium' | 'low',
    reason: 'Based on most recent bill',
    range: {
      min: Math.max(0, lastAmount - variance),
      max: lastAmount + variance
    }
  };
}

/**
 * Estimate based on historical average
 */
function estimateFromAverage(bill: RecurringBill) {
  const avgAmount = bill.averageAmount || bill.baseAmount || 0;
  const variance = calculateVarianceRange(bill);
  const historyLength = bill.billHistory?.length || 0;
  
  return {
    estimatedAmount: avgAmount,
    confidence: historyLength > 3 ? 'high' : historyLength > 1 ? 'medium' : 'low',
    reason: `Based on ${historyLength} bill average`,
    range: {
      min: Math.max(0, avgAmount - variance),
      max: avgAmount + variance
    }
  };
}

/**
 * Estimate based on seasonal patterns (e.g., higher electric bills in summer/winter)
 */
function estimateFromSeasonalPattern(bill: RecurringBill) {
  const history = bill.billHistory || [];
  const currentMonth = new Date().getMonth(); // 0-11
  
  if (history.length < 6) {
    // Fall back to average if not enough data
    return estimateFromAverage(bill);
  }
  
  // Find bills from same month in previous years
  const sameMonthBills = history.filter(h => {
    const billMonth = new Date(h.billDate).getMonth();
    return billMonth === currentMonth;
  });
  
  if (sameMonthBills.length > 0) {
    const seasonalAvg = sameMonthBills.reduce((sum, h) => sum + h.actualAmount, 0) / sameMonthBills.length;
    const variance = calculateVarianceRange(bill);
    
    return {
      estimatedAmount: seasonalAvg,
      confidence: sameMonthBills.length > 1 ? 'high' : 'medium',
      reason: `Based on ${sameMonthBills.length} bills from same month`,
      range: {
        min: Math.max(0, seasonalAvg - variance),
        max: seasonalAvg + variance
      }
    };
  }
  
  return estimateFromAverage(bill);
}

/**
 * Estimate based on trend analysis
 */
function estimateFromTrend(bill: RecurringBill) {
  const history = bill.billHistory || [];
  
  if (history.length < 3) {
    return estimateFromAverage(bill);
  }
  
  // Sort by date (most recent first)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.billDate).getTime() - new Date(a.billDate).getTime()
  );
  
  // Calculate trend from last 6 months or available data
  const recentBills = sortedHistory.slice(0, 6);
  const amounts = recentBills.map(h => h.actualAmount).reverse(); // Oldest to newest
  
  // Simple linear trend calculation
  const trend = calculateLinearTrend(amounts);
  const lastAmount = amounts[amounts.length - 1];
  const projectedAmount = lastAmount + trend;
  
  const variance = calculateVarianceRange(bill);
  
  return {
    estimatedAmount: Math.max(0, projectedAmount),
    confidence: recentBills.length > 3 ? 'medium' : 'low',
    reason: `Based on ${recentBills.length}-month trend analysis`,
    range: {
      min: Math.max(0, projectedAmount - variance),
      max: projectedAmount + variance
    }
  };
}

/**
 * Choose the best estimation strategy automatically
 */
function estimateFromBestStrategy(bill: RecurringBill) {
  const history = bill.billHistory || [];
  const historyLength = history.length;
  
  // Not enough data - use base amount or last known amount
  if (historyLength === 0) {
    const amount = bill.baseAmount || 0;
    return {
      estimatedAmount: amount,
      confidence: 'low' as const,
      reason: 'Insufficient history - using base amount',
      range: { min: amount * 0.8, max: amount * 1.2 }
    };
  }
  
  // Limited data - use last bill
  if (historyLength < 3) {
    return estimateFromLastBill(bill);
  }
  
  // Check if bill varies significantly by season (utilities)
  const isUtilityLike = bill.name.toLowerCase().includes('electric') ||
                       bill.name.toLowerCase().includes('gas') ||
                       bill.name.toLowerCase().includes('heating') ||
                       bill.name.toLowerCase().includes('cooling');
  
  if (isUtilityLike && historyLength > 6) {
    return estimateFromSeasonalPattern(bill);
  }
  
  // For phone bills like Verizon, average is usually best
  const isPhoneLike = bill.name.toLowerCase().includes('verizon') ||
                     bill.name.toLowerCase().includes('phone') ||
                     bill.name.toLowerCase().includes('mobile');
  
  if (isPhoneLike) {
    return estimateFromAverage(bill);
  }
  
  // Default to average for most cases
  return estimateFromAverage(bill);
}

/**
 * Calculate variance range based on historical data
 */
function calculateVarianceRange(bill: RecurringBill): number {
  const history = bill.billHistory || [];
  
  if (history.length === 0) {
    // Default to 20% variance for unknown bills
    const baseAmount = bill.baseAmount || bill.averageAmount || 0;
    return baseAmount * 0.2;
  }
  
  // Calculate standard deviation of historical amounts
  const amounts = history.map(h => h.actualAmount);
  const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  const squaredDiffs = amounts.map(amount => Math.pow(amount - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  
  // Use 1 standard deviation as the variance range
  return stdDev;
}

/**
 * Calculate linear trend from array of values
 */
function calculateLinearTrend(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  
  const xSum = n * (n - 1) / 2; // Sum of indices 0, 1, 2, ..., n-1
  const ySum = values.reduce((sum, val) => sum + val, 0);
  const xySum = values.reduce((sum, val, i) => sum + (i * val), 0);
  const x2Sum = n * (n - 1) * (2 * n - 1) / 6; // Sum of squares of indices
  
  const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
  return slope;
}

/**
 * Analyze bill variance patterns
 */
export function analyzeBillVariance(bill: RecurringBill): {
  varianceType: 'stable' | 'seasonal' | 'trending' | 'volatile';
  analysis: string;
  recommendations: string[];
} {
  const history = bill.billHistory || [];
  
  if (history.length < 3) {
    return {
      varianceType: 'stable',
      analysis: 'Insufficient data for variance analysis',
      recommendations: ['Add more bill history to improve predictions']
    };
  }
  
  const amounts = history.map(h => h.actualAmount);
  const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  const coefficientOfVariation = calculateVarianceRange(bill) / mean;
  
  // Determine variance type
  if (coefficientOfVariation < 0.1) {
    return {
      varianceType: 'stable',
      analysis: 'Bill amounts are very consistent',
      recommendations: ['Consider using base amount estimation method']
    };
  } else if (coefficientOfVariation < 0.3) {
    // Check for seasonal patterns
    const isSeasonalCandidate = bill.name.toLowerCase().includes('electric') ||
                               bill.name.toLowerCase().includes('gas') ||
                               bill.name.toLowerCase().includes('heating');
    
    if (isSeasonalCandidate) {
      return {
        varianceType: 'seasonal',
        analysis: 'Bill shows moderate variance, likely seasonal',
        recommendations: [
          'Consider using seasonal estimation method',
          'Track bills for full year to identify patterns'
        ]
      };
    } else {
      return {
        varianceType: 'stable',
        analysis: 'Bill amounts have moderate but manageable variance',
        recommendations: ['Average estimation method works well for this bill']
      };
    }
  } else {
    return {
      varianceType: 'volatile',
      analysis: 'Bill amounts vary significantly',
      recommendations: [
        'Review bill details to understand variance causes',
        'Consider budgeting with higher buffer',
        'Track usage patterns if applicable'
      ]
    };
  }
}

/**
 * Generate variance alerts for unusual bill amounts
 */
export function checkForBillAnomalies(bill: RecurringBill, proposedAmount: number): {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestedAction: string;
} {
  const estimate = calculateNextBillEstimate(bill);
  const difference = Math.abs(proposedAmount - estimate.estimatedAmount);
  const percentDiff = estimate.estimatedAmount > 0 ? (difference / estimate.estimatedAmount) * 100 : 0;
  
  if (percentDiff < 15) {
    return {
      isAnomaly: false,
      severity: 'low',
      message: 'Amount is within normal range',
      suggestedAction: 'No action needed'
    };
  } else if (percentDiff < 40) {
    return {
      isAnomaly: true,
      severity: 'medium',
      message: `Amount is ${percentDiff.toFixed(0)}% higher than expected`,
      suggestedAction: 'Review bill for unusual charges'
    };
  } else {
    return {
      isAnomaly: true,
      severity: 'high',
      message: `Amount is ${percentDiff.toFixed(0)}% higher than expected - unusually high`,
      suggestedAction: 'Carefully review bill details and contact provider if necessary'
    };
  }
}