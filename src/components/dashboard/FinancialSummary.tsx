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
    <section className="relative overflow-hidden bg-gradient-to-r from-white/80 via-blue-50/60 to-indigo-50/60 backdrop-blur-sm border-b border-white/40">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent flex items-center">
            <div className="w-6 h-6 lg:w-7 lg:h-7 mr-2 lg:mr-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            </div>
            This Month Summary
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {/* Income Card */}
          <div className="group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-700 font-semibold text-xs uppercase tracking-wide">Income</span>
                <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {formatCurrency(summary.totalIncome)}
              </p>
              <div className="mt-1 flex items-center text-emerald-600 text-xs">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></div>
                <span>Month</span>
              </div>
            </div>
          </div>

          {/* Expenses Card */}
          <div className="group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-700 font-semibold text-xs uppercase tracking-wide">Expenses</span>
                <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                {formatCurrency(summary.totalExpenses)}
              </p>
              <div className="mt-1 flex items-center text-red-600 text-xs">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></div>
                <span>Month</span>
              </div>
            </div>
          </div>

          {/* Net Flow Card */}
          <div className={`group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fadeInUp`} style={{animationDelay: '0.3s'}}>
            <div className={`absolute inset-0 ${summary.netFlow >= 0 ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10' : 'bg-gradient-to-br from-orange-500/10 to-amber-500/10'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className={`font-semibold text-xs uppercase tracking-wide ${summary.netFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  Net Flow
                </span>
                <div className={`w-7 h-7 ${summary.netFlow >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'} rounded-lg flex items-center justify-center shadow-md`}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 001.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className={`text-xl lg:text-2xl font-bold ${summary.netFlow >= 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-orange-600 to-amber-600'} bg-clip-text text-transparent`}>
                {formatCurrency(summary.netFlow)}
              </p>
              <div className={`mt-1 flex items-center text-xs ${summary.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                <div className={`w-1.5 h-1.5 ${summary.netFlow >= 0 ? 'bg-blue-500' : 'bg-orange-500'} rounded-full mr-1.5 animate-pulse`}></div>
                <span>{summary.netFlow >= 0 ? 'Positive' : 'Negative'}</span>
              </div>
            </div>
          </div>

          {/* Transactions Card */}
          <div className="group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fadeInUp" style={{animationDelay: '0.4s'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-700 font-semibold text-xs uppercase tracking-wide">Transactions</span>
                <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {summary.transactionCount}
              </p>
              <div className="mt-1 flex items-center text-purple-600 text-xs">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5 animate-pulse"></div>
                <span>Month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Insight */}
        {summary.netFlow < 0 && (
          <div className="col-span-2 lg:col-span-4 mt-2 p-3 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/60 rounded-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-yellow-800 text-xs">
                Spending exceeds income this month. Review expenses.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}