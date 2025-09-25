/**
 * Smart Insights Widget
 * AI-powered financial recommendations and insights
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
import { Transaction, RecurringBill, FinancialGoal } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { useTheme } from '@/contexts/ThemeContext';

interface InsightData {
  id: string;
  type: 'tip' | 'warning' | 'achievement' | 'opportunity' | 'trend';
  title: string;
  description: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'spending' | 'saving' | 'budgeting' | 'goals' | 'bills';
  amount?: number;
  percentage?: number;
  icon: string;
}

interface SmartInsightsProps {
  transactions: Transaction[];
  bills: RecurringBill[];
  goals: FinancialGoal[];
  balance: number;
  monthlyIncome: number;
  className?: string;
}

export function SmartInsights({
  transactions,
  bills,
  goals,
  balance,
  monthlyIncome,
  className = ''
}: SmartInsightsProps) {
  const { isDark } = useTheme();
  const [selectedInsight, setSelectedInsight] = useState<InsightData | null>(null);
  const [animatedInsights, setAnimatedInsights] = useState<InsightData[]>([]);

  const insights = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    // Filter transactions for current month
    const thisMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const thisMonthExpenses = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const thisMonthIncome = thisMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const insights: InsightData[] = [];

    // 1. Spending Pattern Analysis
    const categorySpending = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];

    if (topCategory && topCategory[1] > thisMonthIncome * 0.3) {
      insights.push({
        id: 'high-category-spending',
        type: 'warning',
        title: 'High Category Spending',
        description: `You've spent ${formatCurrency(topCategory[1])} on ${topCategory[0]} this month. This represents ${((topCategory[1] / thisMonthIncome) * 100).toFixed(1)}% of your income.`,
        action: 'Review and set a budget limit',
        priority: 'high',
        category: 'spending',
        amount: topCategory[1],
        percentage: (topCategory[1] / thisMonthIncome) * 100,
        icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
      });
    }

    // 2. Savings Rate Analysis
    const savingsRate = thisMonthIncome > 0 ? ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100 : 0;
    
    if (savingsRate < 10) {
      insights.push({
        id: 'low-savings-rate',
        type: 'tip',
        title: 'Low Savings Rate',
        description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of your income.`,
        action: 'Try the 50/30/20 budgeting rule',
        priority: 'medium',
        category: 'saving',
        percentage: savingsRate,
        icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
      });
    } else if (savingsRate > 30) {
      insights.push({
        id: 'excellent-savings',
        type: 'achievement',
        title: 'Excellent Savings Rate!',
        description: `Amazing! You're saving ${savingsRate.toFixed(1)}% of your income. You're well on track for financial independence.`,
        priority: 'low',
        category: 'saving',
        percentage: savingsRate,
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      });
    }

    // 3. Bill Payment Optimization
    const totalBillsAmount = bills.reduce((sum, bill) => {
      let monthlyAmount = bill.amount;
      if (bill.frequency === 'yearly') monthlyAmount /= 12;
      if (bill.frequency === 'weekly') monthlyAmount *= 4.33;
      return sum + monthlyAmount;
    }, 0);

    if (totalBillsAmount > thisMonthIncome * 0.5) {
      insights.push({
        id: 'high-bills-ratio',
        type: 'warning',
        title: 'High Bills-to-Income Ratio',
        description: `Your recurring bills take up ${((totalBillsAmount / thisMonthIncome) * 100).toFixed(1)}% of your income. Consider reviewing subscriptions and negotiating better rates.`,
        action: 'Review and optimize subscriptions',
        priority: 'medium',
        category: 'bills',
        amount: totalBillsAmount,
        percentage: (totalBillsAmount / thisMonthIncome) * 100,
        icon: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z'
      });
    }

    // 4. Goal Progress Analysis
    goals.forEach(goal => {
      const progressPercent = (goal.currentAmount / goal.targetAmount) * 100;
      const remainingAmount = goal.targetAmount - goal.currentAmount;
      const targetDate = goal.deadline ? new Date(goal.deadline) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const monthsRemaining = Math.max(0, (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const monthlyRequired = monthsRemaining > 0 ? remainingAmount / monthsRemaining : remainingAmount;

      if (progressPercent > 90) {
        insights.push({
          id: `goal-almost-complete-${goal.id}`,
          type: 'achievement',
          title: 'Goal Almost Complete!',
          description: `You're ${progressPercent.toFixed(1)}% of the way to "${goal.title}". Only ${formatCurrency(remainingAmount)} to go!`,
          action: 'Make final push to complete',
          priority: 'low',
          category: 'goals',
          amount: remainingAmount,
          percentage: progressPercent,
          icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        });
      } else if (monthsRemaining < 3 && progressPercent < 75) {
        insights.push({
          id: `goal-behind-schedule-${goal.id}`,
          type: 'warning',
          title: 'Goal Behind Schedule',
          description: `"${goal.title}" needs ${formatCurrency(monthlyRequired)} per month to stay on track. Consider adjusting timeline or increasing contributions.`,
          action: 'Increase monthly contribution',
          priority: 'medium',
          category: 'goals',
          amount: monthlyRequired,
          icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
        });
      }
    });

    // 5. Cash Flow Trends
    const last30DaysTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return (now.getTime() - date.getTime()) <= (30 * 24 * 60 * 60 * 1000);
    });

    if (last30DaysTransactions.length > 5) {
      const dailyBalances = [];
      const sortedTransactions = last30DaysTransactions.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      let runningBalance = balance;
      for (const transaction of sortedTransactions.reverse()) {
        runningBalance -= transaction.type === 'income' ? -transaction.amount : transaction.amount;
      }

      // Simple trend analysis
      const firstWeekBalance = runningBalance;
      const currentBalance = balance;
      const trend = currentBalance - firstWeekBalance;

      if (trend > 0 && trend > thisMonthIncome * 0.1) {
        insights.push({
          id: 'positive-cash-flow',
          type: 'achievement',
          title: 'Strong Cash Flow',
          description: `Your balance has increased by ${formatCurrency(trend)} over the past 30 days. Keep up the great financial habits!`,
          priority: 'low',
          category: 'spending',
          amount: trend,
          icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
        });
      }
    }

    // 6. Emergency Fund Check
    const monthlyExpenses = thisMonthExpenses || 
      (transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) / 
       Math.max(1, transactions.length / 30));

    const emergencyFundMonths = monthlyExpenses > 0 ? balance / monthlyExpenses : 0;

    if (emergencyFundMonths < 3) {
      insights.push({
        id: 'low-emergency-fund',
        type: 'tip',
        title: 'Build Emergency Fund',
        description: `Your current balance covers ${emergencyFundMonths.toFixed(1)} months of expenses. Aim for 3-6 months as an emergency fund.`,
        action: 'Start saving for emergencies',
        priority: 'high',
        category: 'saving',
        amount: (3 * monthlyExpenses) - balance,
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
      });
    } else if (emergencyFundMonths > 6) {
      insights.push({
        id: 'excess-emergency-fund',
        type: 'opportunity',
        title: 'Investment Opportunity',
        description: `Your emergency fund covers ${emergencyFundMonths.toFixed(1)} months of expenses. Consider investing the excess ${formatCurrency(balance - (6 * monthlyExpenses))} for better returns.`,
        action: 'Explore investment options',
        priority: 'low',
        category: 'saving',
        amount: balance - (6 * monthlyExpenses),
        icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
      });
    }

    // Sort by priority
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [transactions, bills, goals, balance, monthlyIncome]);

  // Animate insights on mount
  useEffect(() => {
    setAnimatedInsights([]);
    const timer = setTimeout(() => {
      insights.forEach((insight, index) => {
        setTimeout(() => {
          setAnimatedInsights(prev => [...prev, insight]);
        }, index * 200);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [insights]);

  const getInsightIcon = (type: InsightData['type']) => {
    switch (type) {
      case 'achievement':
        return '🎉';
      case 'warning':
        return '⚠️';
      case 'tip':
        return '💡';
      case 'opportunity':
        return '🚀';
      case 'trend':
        return '📈';
      default:
        return 'ℹ️';
    }
  };

  const getTypeColor = (type: InsightData['type']) => {
    switch (type) {
      case 'achievement':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
      case 'warning':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'tip':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
      case 'opportunity':
        return 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-200';
      case 'trend':
        return 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-200';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200';
    }
  };

  if (insights.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Great Financial Health!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No immediate insights to show. Keep up the good work with your financial management!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Smart Insights
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered financial recommendations
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {animatedInsights.length} insight{animatedInsights.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {animatedInsights.map((insight, index) => (
          <div
            key={insight.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-md animate-slide-in-bottom ${getTypeColor(insight.type)}`}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => setSelectedInsight(insight)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-lg">
                  {getInsightIcon(insight.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm truncate">
                    {insight.title}
                  </h3>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    insight.priority === 'high' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : insight.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {insight.priority}
                  </div>
                </div>
                <p className="text-sm opacity-90 mb-2">
                  {insight.description}
                </p>
                {insight.action && (
                  <p className="text-xs font-medium opacity-75">
                    💡 {insight.action}
                  </p>
                )}
                {(insight.amount !== undefined || insight.percentage !== undefined) && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-current/20">
                    {insight.amount !== undefined && (
                      <span className="text-sm font-semibold">
                        {formatCurrency(insight.amount)}
                      </span>
                    )}
                    {insight.percentage !== undefined && (
                      <span className="text-sm">
                        {insight.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Insight Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">{getInsightIcon(selectedInsight.type)}</div>
              <button
                onClick={() => setSelectedInsight(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {selectedInsight.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {selectedInsight.description}
            </p>
            {selectedInsight.action && (
              <div className={`p-3 rounded-lg mb-4 ${getTypeColor(selectedInsight.type)}`}>
                <p className="font-medium text-sm">Recommended Action:</p>
                <p className="text-sm mt-1">{selectedInsight.action}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}