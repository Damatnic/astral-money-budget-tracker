interface FinancialData {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  emergencyFund: number;
  goals: Array<{
    current: number;
    target: number;
    targetDate: string;
  }>;
}

export const calculateFinancialHealth = (data: FinancialData): number => {
  let score = 0;
  
  // Income vs Expenses (30 points)
  if (data.monthlyIncome > 0) {
    const incomeRatio = data.monthlyIncome > data.monthlyExpenses ? 30 : 
                       Math.max(0, 30 * (data.monthlyIncome / data.monthlyExpenses));
    score += incomeRatio;
  }
  
  // Emergency Fund (25 points)
  const emergencyTarget = data.monthlyExpenses * 3;
  if (emergencyTarget > 0) {
    const emergencyRatio = Math.min(25, 25 * (data.emergencyFund / emergencyTarget));
    score += emergencyRatio;
  } else if (data.emergencyFund > 0) {
    score += 25; // If no expenses but have emergency fund
  }
  
  // Budget adherence (20 points) - based on balance positivity
  if (data.balance > 0) {
    score += 20;
  } else if (data.balance > -1000) {
    score += 10; // Partial credit for small negative balance
  }
  
  // Goal progress (15 points)
  if (data.goals.length > 0) {
    const goalProgress = data.goals.reduce((avg, goal) => {
      return avg + Math.min(1, goal.current / goal.target);
    }, 0) / data.goals.length;
    score += 15 * goalProgress;
  }
  
  // Saving habits (10 points) - positive balance growth indicator
  if (data.monthlyIncome > data.monthlyExpenses) {
    score += 10;
  }
  
  return Math.round(Math.max(0, Math.min(100, score)));
};

export const generateFinancialRecommendations = (data: FinancialData): string[] => {
  const recommendations = [];
  
  if (data.monthlyExpenses > data.monthlyIncome) {
    recommendations.push('Reduce monthly expenses to match or stay below income');
  }
  
  if (data.emergencyFund < data.monthlyExpenses * 3) {
    recommendations.push('Build emergency fund to cover 3-6 months of expenses');
  }
  
  if (data.balance < 0) {
    recommendations.push('Focus on eliminating negative balance');
  }
  
  if (data.goals.length === 0) {
    recommendations.push('Set financial goals to improve long-term planning');
  }
  
  return recommendations;
};