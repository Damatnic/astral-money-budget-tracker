/**
 * Welcome Message Component
 * Personalized greeting with contextual information
 */

'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

interface WelcomeMessageProps {
  transactions: Transaction[];
  balance: number;
  className?: string;
}

export function WelcomeMessage({ transactions, balance, className = '' }: WelcomeMessageProps) {
  const { data: session } = useSession();

  const insights = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's transactions
    const todayTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= today;
    });

    // This week's transactions
    const weekTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= thisWeek;
    });

    // This month's transactions
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= thisMonth;
    });

    const todaySpent = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const weekSpent = weekTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthSpent = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      todayTransactions: todayTransactions.length,
      todaySpent,
      weekSpent,
      monthSpent,
      monthIncome,
      savingsThisMonth: monthIncome - monthSpent
    };
  }, [transactions]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const getMotivationalMessage = () => {
    const { todaySpent, monthSpent, monthIncome, savingsThisMonth } = insights;

    if (todaySpent === 0) {
      return "Great start to the day! No expenses recorded yet.";
    }

    if (savingsThisMonth > 0 && monthIncome > 0) {
      const savingsRate = (savingsThisMonth / monthIncome) * 100;
      if (savingsRate > 20) {
        return `Excellent! You're saving ${savingsRate.toFixed(0)}% of your income this month.`;
      }
      if (savingsRate > 10) {
        return `Good job! You're on track with ${savingsRate.toFixed(0)}% savings rate.`;
      }
    }

    if (monthSpent > monthIncome * 0.8) {
      return "Consider reviewing your spending to stay within budget.";
    }

    return "Keep tracking your expenses to maintain financial health.";
  };

  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  return (
    <div className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-blue-100 dark:border-gray-700 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center animate-scale-in">
                <span className="text-white font-bold text-lg">
                  {firstName[0].toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-slide-in-right">
                {greeting}, {firstName}!
              </h1>
              <p className="text-sm text-gray-800 dark:text-gray-700 mt-1 animate-slide-in-right animate-stagger-1">
                {getMotivationalMessage()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm animate-slide-in-bottom animate-stagger-1">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-700 mb-1">
                Current Balance
              </p>
              <AnimatedCounter
                value={balance}
                isCurrency={true}
                className={`text-lg font-bold ${
                  balance >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}
                duration={2000}
              />
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm animate-slide-in-bottom animate-stagger-2">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-700 mb-1">
                Today's Spending
              </p>
              <AnimatedCounter
                value={insights.todaySpent}
                isCurrency={true}
                className="text-lg font-bold text-gray-900 dark:text-white"
                duration={1500}
              />
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm animate-slide-in-bottom animate-stagger-3">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-700 mb-1">
                This Week
              </p>
              <AnimatedCounter
                value={insights.weekSpent}
                isCurrency={true}
                className="text-lg font-bold text-gray-900 dark:text-white"
                duration={1800}
              />
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm animate-slide-in-bottom animate-stagger-4">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-700 mb-1">
                Month Savings
              </p>
              <AnimatedCounter
                value={insights.savingsThisMonth}
                isCurrency={true}
                className={`text-lg font-bold ${
                  insights.savingsThisMonth >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}
                duration={2200}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick insights bar */}
      <div className="mt-4 pt-4 border-t border-blue-200/50 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-800 dark:text-gray-700">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{insights.todayTransactions} transactions today</span>
            </span>
            {insights.monthIncome > 0 && (
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>
                  {((insights.monthSpent / insights.monthIncome) * 100).toFixed(0)}% of income spent
                </span>
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-700 dark:text-gray-700">
              Last updated: {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}