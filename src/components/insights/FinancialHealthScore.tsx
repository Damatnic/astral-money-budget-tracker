/**
 * Financial Health Score Component
 * Calculates and displays a comprehensive financial health score with recommendations
 */

'use client';

import { useMemo } from 'react';
import { Transaction, RecurringBill, FinancialGoal } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { ProgressRing } from '@/components/charts/SimpleCharts';

interface FinancialHealthProps {
  transactions: Transaction[];
  bills: RecurringBill[];
  goals: FinancialGoal[];
  balance: number;
  monthlyIncome: number;
  netWorth?: number;
}

interface HealthMetric {
  name: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  recommendation?: string;
  icon: string;
}

interface FinancialHealthData {
  overallScore: number;
  grade: string;
  metrics: HealthMetric[];
  strengths: string[];
  improvements: string[];
}

export function FinancialHealthScore({ 
  transactions, 
  bills, 
  goals, 
  balance, 
  monthlyIncome,
  netWorth = 0
}: FinancialHealthProps) {
  
  const healthData: FinancialHealthData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filter current month transactions
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const monthlyExpenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyActualIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const income = Math.max(monthlyIncome, monthlyActualIncome);

    // Calculate individual metrics
    const metrics: HealthMetric[] = [];

    // 1. Emergency Fund Score (25 points)
    const emergencyFundMonths = income > 0 ? balance / income : 0;
    let emergencyScore = 0;
    let emergencyStatus: HealthMetric['status'] = 'poor';
    
    if (emergencyFundMonths >= 6) {
      emergencyScore = 25;
      emergencyStatus = 'excellent';
    } else if (emergencyFundMonths >= 3) {
      emergencyScore = 18;
      emergencyStatus = 'good';
    } else if (emergencyFundMonths >= 1) {
      emergencyScore = 10;
      emergencyStatus = 'fair';
    }

    metrics.push({
      name: 'Emergency Fund',
      score: emergencyScore,
      maxScore: 25,
      status: emergencyStatus,
      description: `${emergencyFundMonths.toFixed(1)} months of expenses`,
      recommendation: emergencyFundMonths < 6 ? 'Build emergency fund to 6 months of expenses' : undefined,
      icon: '🛡️'
    });

    // 2. Savings Rate Score (20 points)
    const savingsRate = income > 0 ? ((income - monthlyExpenses) / income) * 100 : 0;
    let savingsScore = 0;
    let savingsStatus: HealthMetric['status'] = 'poor';

    if (savingsRate >= 20) {
      savingsScore = 20;
      savingsStatus = 'excellent';
    } else if (savingsRate >= 15) {
      savingsScore = 16;
      savingsStatus = 'good';
    } else if (savingsRate >= 10) {
      savingsScore = 10;
      savingsStatus = 'fair';
    }

    metrics.push({
      name: 'Savings Rate',
      score: savingsScore,
      maxScore: 20,
      status: savingsStatus,
      description: `${savingsRate.toFixed(1)}% of income saved`,
      recommendation: savingsRate < 20 ? 'Aim to save at least 20% of your income' : undefined,
      icon: '💰'
    });

    // 3. Debt-to-Income Ratio (20 points)
    const monthlyDebtPayments = bills
      .filter(bill => bill.billType === 'expense' && ['credit_card', 'loan', 'mortgage'].some(type => 
        bill.category.toLowerCase().includes(type)))
      .reduce((sum, bill) => {
        if (bill.frequency === 'monthly') return sum + bill.amount;
        if (bill.frequency === 'weekly') return sum + (bill.amount * 4.33);
        if (bill.frequency === 'biweekly') return sum + (bill.amount * 2.17);
        if (bill.frequency === 'yearly') return sum + (bill.amount / 12);
        return sum;
      }, 0);

    const debtToIncomeRatio = income > 0 ? (monthlyDebtPayments / income) * 100 : 0;
    let debtScore = 0;
    let debtStatus: HealthMetric['status'] = 'poor';

    if (debtToIncomeRatio <= 10) {
      debtScore = 20;
      debtStatus = 'excellent';
    } else if (debtToIncomeRatio <= 20) {
      debtScore = 15;
      debtStatus = 'good';
    } else if (debtToIncomeRatio <= 36) {
      debtScore = 8;
      debtStatus = 'fair';
    }

    metrics.push({
      name: 'Debt-to-Income',
      score: debtScore,
      maxScore: 20,
      status: debtStatus,
      description: `${debtToIncomeRatio.toFixed(1)}% of income to debt`,
      recommendation: debtToIncomeRatio > 36 ? 'Reduce debt payments to below 36% of income' : undefined,
      icon: '📉'
    });

    // 4. Budget Adherence (15 points)
    const budgetedExpenses = bills
      .filter(bill => bill.billType === 'expense')
      .reduce((sum, bill) => {
        if (bill.frequency === 'monthly') return sum + bill.amount;
        if (bill.frequency === 'weekly') return sum + (bill.amount * 4.33);
        if (bill.frequency === 'biweekly') return sum + (bill.amount * 2.17);
        if (bill.frequency === 'yearly') return sum + (bill.amount / 12);
        return sum;
      }, 0);

    const budgetVariance = budgetedExpenses > 0 ? 
      Math.abs((monthlyExpenses - budgetedExpenses) / budgetedExpenses) * 100 : 0;
    
    let budgetScore = 0;
    let budgetStatus: HealthMetric['status'] = 'poor';

    if (budgetVariance <= 5) {
      budgetScore = 15;
      budgetStatus = 'excellent';
    } else if (budgetVariance <= 15) {
      budgetScore = 12;
      budgetStatus = 'good';
    } else if (budgetVariance <= 25) {
      budgetScore = 6;
      budgetStatus = 'fair';
    }

    metrics.push({
      name: 'Budget Control',
      score: budgetScore,
      maxScore: 15,
      status: budgetStatus,
      description: `${budgetVariance.toFixed(1)}% variance from budget`,
      recommendation: budgetVariance > 15 ? 'Track expenses more closely to stay within budget' : undefined,
      icon: '📊'
    });

    // 5. Goal Progress (10 points)
    const activeGoals = goals.filter(g => !g.isCompleted);
    let goalScore = 0;
    let goalStatus: HealthMetric['status'] = 'poor';

    if (activeGoals.length > 0) {
      const avgProgress = activeGoals.reduce((sum, goal) => 
        sum + (goal.currentAmount / goal.targetAmount), 0) / activeGoals.length;
      
      if (avgProgress >= 0.8) {
        goalScore = 10;
        goalStatus = 'excellent';
      } else if (avgProgress >= 0.5) {
        goalScore = 8;
        goalStatus = 'good';
      } else if (avgProgress >= 0.2) {
        goalScore = 4;
        goalStatus = 'fair';
      }
    } else if (goals.some(g => g.isCompleted)) {
      goalScore = 5; // Some credit for having completed goals
      goalStatus = 'fair';
    }

    metrics.push({
      name: 'Goal Achievement',
      score: goalScore,
      maxScore: 10,
      status: goalStatus,
      description: activeGoals.length > 0 ? 
        `${activeGoals.length} active goals` : 'No active financial goals',
      recommendation: activeGoals.length === 0 ? 'Set specific financial goals to work towards' : 
        goalScore < 8 ? 'Increase contributions to reach your goals faster' : undefined,
      icon: '🎯'
    });

    // 6. Net Worth Growth (10 points)
    let netWorthScore = 0;
    let netWorthStatus: HealthMetric['status'] = 'fair';

    if (netWorth > 0) {
      if (netWorth > income * 2) {
        netWorthScore = 10;
        netWorthStatus = 'excellent';
      } else if (netWorth > income) {
        netWorthScore = 8;
        netWorthStatus = 'good';
      } else if (netWorth > 0) {
        netWorthScore = 5;
        netWorthStatus = 'fair';
      }
    } else {
      netWorthStatus = 'poor';
    }

    metrics.push({
      name: 'Net Worth',
      score: netWorthScore,
      maxScore: 10,
      status: netWorthStatus,
      description: netWorth > 0 ? `${(netWorth / Math.max(income, 1)).toFixed(1)}x annual income` : 'Negative or zero',
      recommendation: netWorth <= 0 ? 'Focus on building positive net worth' : 
        netWorthScore < 8 ? 'Continue building assets and reducing debt' : undefined,
      icon: '📈'
    });

    // Calculate overall score
    const totalScore = metrics.reduce((sum, metric) => sum + metric.score, 0);
    const maxTotalScore = metrics.reduce((sum, metric) => sum + metric.maxScore, 0);
    const overallScore = Math.round((totalScore / maxTotalScore) * 100);

    // Determine grade
    let grade = 'F';
    if (overallScore >= 90) grade = 'A+';
    else if (overallScore >= 85) grade = 'A';
    else if (overallScore >= 80) grade = 'A-';
    else if (overallScore >= 75) grade = 'B+';
    else if (overallScore >= 70) grade = 'B';
    else if (overallScore >= 65) grade = 'B-';
    else if (overallScore >= 60) grade = 'C+';
    else if (overallScore >= 55) grade = 'C';
    else if (overallScore >= 50) grade = 'C-';
    else if (overallScore >= 45) grade = 'D+';
    else if (overallScore >= 40) grade = 'D';
    else if (overallScore >= 35) grade = 'D-';

    // Generate strengths and improvements
    const strengths = metrics.filter(m => m.status === 'excellent' || m.status === 'good')
      .map(m => m.name);
    
    const improvements = metrics.filter(m => m.recommendation)
      .map(m => m.recommendation!);

    return {
      overallScore,
      grade,
      metrics,
      strengths,
      improvements
    };
  }, [transactions, bills, goals, balance, monthlyIncome, netWorth]);

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return '#10B981'; // Green
    if (percentage >= 60) return '#F59E0B'; // Yellow
    if (percentage >= 40) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-50 border-green-200';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (grade.startsWith('D')) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Financial Health Score
        </h2>
      </div>

      {/* Overall Score */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between mb-8">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
          <ProgressRing
            value={healthData.overallScore}
            max={100}
            size={160}
            strokeWidth={12}
            color={getScoreColor(healthData.overallScore, 100)}
            label="Health Score"
          />
          
          <div className="text-center sm:text-left">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-2xl font-bold border-2 ${getGradeColor(healthData.grade)}`}>
              Grade: {healthData.grade}
            </div>
            <p className="text-gray-600 mt-2">
              {healthData.overallScore >= 80 ? 'Excellent financial health!' :
               healthData.overallScore >= 60 ? 'Good financial foundation' :
               healthData.overallScore >= 40 ? 'Room for improvement' :
               'Needs immediate attention'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6 lg:mt-0">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 font-medium">Strengths</p>
            <p className="text-xl font-bold text-green-800">{healthData.strengths.length}</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-600 font-medium">To Improve</p>
            <p className="text-xl font-bold text-orange-800">{healthData.improvements.length}</p>
          </div>
        </div>
      </div>

      {/* Individual Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {healthData.metrics.map((metric, index) => (
          <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{metric.icon}</span>
                <h3 className="font-medium text-gray-900">{metric.name}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                metric.status === 'excellent' ? 'bg-green-100 text-green-800' :
                metric.status === 'good' ? 'bg-blue-100 text-blue-800' :
                metric.status === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {metric.status}
              </span>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>{metric.score}/{metric.maxScore} points</span>
                <span>{((metric.score / metric.maxScore) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(metric.score / metric.maxScore) * 100}%`,
                    backgroundColor: getScoreColor(metric.score, metric.maxScore)
                  }}
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-600">{metric.description}</p>
          </div>
        ))}
      </div>

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        {healthData.strengths.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Your Financial Strengths
            </h3>
            <ul className="space-y-1">
              {healthData.strengths.map((strength, index) => (
                <li key={index} className="text-green-700 text-sm">
                  • {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {healthData.improvements.length > 0 && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Areas for Improvement
            </h3>
            <ul className="space-y-1">
              {healthData.improvements.map((improvement, index) => (
                <li key={index} className="text-orange-700 text-sm">
                  • {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}