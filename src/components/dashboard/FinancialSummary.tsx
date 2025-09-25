/**
 * Financial Summary Component
 * Displays key financial metrics and insights
 */

import { useMemo } from 'react';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { PieChart, LineChart, ProgressRing } from '@/components/charts/SimpleCharts';

interface FinancialSummaryProps {
  transactions: Transaction[];
  balance: number;
}

export function FinancialSummary({ transactions, balance }: FinancialSummaryProps) {
  const summary = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const totalIncome = thisMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netFlow = totalIncome - totalExpenses;
    
    // Calculate spending by category for pie chart
    const categorySpending = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category || 'Other';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Calculate daily spending trend for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });
    
    const dailySpending = last7Days.map(date => {
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.toDateString() === date.toDateString() && t.type === 'expense';
      });
      
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: dayTransactions.reduce((sum, t) => sum + t.amount, 0)
      };
    });

    return {
      totalIncome,
      totalExpenses,
      netFlow,
      transactionCount: thisMonthTransactions.length,
      categorySpending,
      dailySpending
    };
  }, [transactions]);

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <svg className="w-6 h-6 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
        </svg>
        This Month Summary
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-600 font-medium text-sm">Income</span>
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-green-800">
            {formatCurrency(summary.totalIncome)}
          </p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-600 font-medium text-sm">Expenses</span>
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-red-800">
            {formatCurrency(summary.totalExpenses)}
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${summary.netFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`font-medium text-sm ${summary.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              Net Flow
            </span>
            <svg className={`w-5 h-5 ${summary.netFlow >= 0 ? 'text-blue-500' : 'text-orange-500'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 001.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className={`text-2xl font-bold ${summary.netFlow >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
            {formatCurrency(summary.netFlow)}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 font-medium text-sm">Transactions</span>
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {summary.transactionCount}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mt-6 lg:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Spending by Category */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Spending Breakdown</h3>
          {Object.keys(summary.categorySpending).length > 0 ? (
            <div className="flex justify-center">
              <PieChart 
                data={Object.entries(summary.categorySpending).map(([category, amount]) => ({
                  label: category,
                  value: amount
                }))}
                size={180}
                showLabels={false}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No expense data available</p>
            </div>
          )}
        </div>

        {/* Daily Spending Trend */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-medium text-gray-900 mb-4">7-Day Spending Trend</h3>
          {summary.dailySpending.some(d => d.value > 0) ? (
            <LineChart 
              data={summary.dailySpending}
              height={160}
              color="#EF4444"
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No spending data available</p>
            </div>
          )}
        </div>

        {/* Savings Goal Progress */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Savings Goal</h3>
          <div className="flex justify-center">
            <ProgressRing
              value={Math.max(0, summary.netFlow)}
              max={summary.totalIncome * 0.2}
              size={120}
              color={summary.netFlow >= 0 ? '#10B981' : '#EF4444'}
              label="of 20% goal"
            />
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">
              Target: {formatCurrency(summary.totalIncome * 0.2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.netFlow >= 0 ? 'Great job!' : 'Need to reduce expenses'}
            </p>
          </div>
        </div>
      </div>

      {/* Category Legend */}
      {Object.keys(summary.categorySpending).length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Category Breakdown</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(summary.categorySpending).map(([category, amount], index) => {
              const total = Object.values(summary.categorySpending).reduce((sum, val) => sum + val, 0);
              const percentage = ((amount / total) * 100).toFixed(1);
              const color = `hsl(${(index * 360) / Object.keys(summary.categorySpending).length}, 70%, 50%)`;
              
              return (
                <div key={category} className="flex items-center space-x-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-gray-700 truncate">{category}</span>
                  <span className="font-medium text-gray-900 ml-auto">
                    {formatCurrency(amount)} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Insights */}
      {summary.netFlow < 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-yellow-800 text-sm">
              You're spending more than you're earning this month. Consider reviewing your expenses.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}