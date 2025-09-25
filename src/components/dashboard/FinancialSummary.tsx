/**
 * Financial Summary Component
 * Displays key financial metrics and insights
 */

import { useMemo } from 'react';
import { Transaction } from '@/types';
import { formatCurrency, calculateTotal } from '@/utils/formatters';
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
      .reduce((sum, t) => sum + (t?.amount || 0), 0);

    const totalExpenses = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t?.amount || 0), 0);

    const netFlow = totalIncome - totalExpenses;
    
    return {
      totalIncome,
      totalExpenses,
      netFlow,
      transactionCount: thisMonthTransactions.length
    };
  }, [transactions]);

  // Compact horizontal layout for header
  return (
    <div className="flex items-center space-x-6">
      {/* Income */}
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <div>
          <p className="text-xs text-gray-800 dark:text-gray-300">Income</p>
          <p className="text-sm font-semibold text-green-600">{formatCurrency(summary.totalIncome)}</p>
        </div>
      </div>
      
      {/* Expenses */}
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <div>
          <p className="text-xs text-gray-800 dark:text-gray-300">Expenses</p>
          <p className="text-sm font-semibold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
        </div>
      </div>
      
      {/* Net Flow */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${summary.netFlow >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
        <div>
          <p className="text-xs text-gray-800 dark:text-gray-300">Net</p>
          <p className={`text-sm font-semibold ${summary.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatCurrency(summary.netFlow)}
          </p>
        </div>
      </div>
      
      {/* Transactions */}
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
        <div>
          <p className="text-xs text-gray-800 dark:text-gray-300">Transactions</p>
          <p className="text-sm font-semibold text-purple-600">{summary.transactionCount}</p>
        </div>
      </div>
    </div>
  );
}

// Full detailed version for overview page
export function DetailedFinancialSummary({ transactions, balance }: FinancialSummaryProps) {
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
      .reduce((sum, t) => sum + (t?.amount || 0), 0);

    const totalExpenses = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t?.amount || 0), 0);

    const netFlow = totalIncome - totalExpenses;
    
    return {
      totalIncome,
      totalExpenses,
      netFlow,
      transactionCount: thisMonthTransactions.length
    };
  }, [transactions]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <div className="w-6 h-6 mr-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
          </svg>
        </div>
        This Month Summary
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-700 font-medium text-sm">Income</span>
            <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-xl font-bold text-green-700">{formatCurrency(summary.totalIncome)}</p>
        </div>

        {/* Expenses Card */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-700 font-medium text-sm">Expenses</span>
            <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-xl font-bold text-red-700">{formatCurrency(summary.totalExpenses)}</p>
        </div>

        {/* Net Flow Card */}
        <div className={`${summary.netFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`font-medium text-sm ${summary.netFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              Net Flow
            </span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${summary.netFlow >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className={`text-xl font-bold ${summary.netFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {formatCurrency(summary.netFlow)}
          </p>
        </div>

        {/* Transactions Card */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-700 font-medium text-sm">Transactions</span>
            <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xl font-bold text-purple-700">{summary.transactionCount}</p>
        </div>
      </div>

      {/* Quick Insight */}
      {summary.netFlow < 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-yellow-800 text-sm">
              Spending exceeds income this month. Review expenses.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}