/**
 * Budget vs Actual Tracking Component
 * Shows planned budget vs actual spending with variance analysis
 */

'use client';

import { useState, useEffect } from 'react';
import { Transaction, RecurringBill } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { analyzeSpending, validateBudgetRules } from '@/utils/categorization';

interface BudgetCategory {
  name: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'over' | 'under' | 'on-track';
}

interface BudgetTrackerProps {
  transactions: Transaction[];
  bills: RecurringBill[];
  monthlyIncome: number;
  budgetMethod: '50/30/20' | 'zero-based' | 'envelope';
}

export function BudgetTracker({ transactions, bills, monthlyIncome, budgetMethod }: BudgetTrackerProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);

  useEffect(() => {
    calculateBudgetVsActual();
  }, [transactions, bills, monthlyIncome, budgetMethod, selectedMonth]);

  const calculateBudgetVsActual = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    // Filter transactions for selected month
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });

    // Get spending insights
    const insights = analyzeSpending(monthTransactions, monthlyIncome);

    // Calculate budgeted amounts based on method
    const budgetedAmounts = calculateBudgetedAmounts(monthlyIncome, budgetMethod);

    // Create budget categories
    const categories: BudgetCategory[] = budgetedAmounts.map(budget => {
      const insight = insights.find(i => i.category === budget.name);
      const actual = insight?.total || 0;
      const variance = actual - budget.amount;
      const variancePercent = budget.amount > 0 ? (variance / budget.amount) * 100 : 0;
      
      let status: 'over' | 'under' | 'on-track' = 'on-track';
      if (variancePercent > 10) status = 'over';
      else if (variancePercent < -10) status = 'under';

      return {
        name: budget.name,
        budgeted: budget.amount,
        actual,
        variance,
        variancePercent,
        status
      };
    });

    setBudgetCategories(categories);
  };

  const calculateBudgetedAmounts = (income: number, method: string) => {
    if (method === '50/30/20') {
      return [
        { name: 'Housing', amount: income * 0.25 },
        { name: 'Transportation', amount: income * 0.10 },
        { name: 'Groceries', amount: income * 0.10 },
        { name: 'Utilities', amount: income * 0.05 },
        { name: 'Dining', amount: income * 0.15 },
        { name: 'Entertainment', amount: income * 0.10 },
        { name: 'Shopping', amount: income * 0.05 },
        { name: 'Savings & Investments', amount: income * 0.20 }
      ];
    } else {
      // Default categories for other methods
      return [
        { name: 'Housing', amount: income * 0.30 },
        { name: 'Transportation', amount: income * 0.15 },
        { name: 'Groceries', amount: income * 0.15 },
        { name: 'Dining', amount: income * 0.10 },
        { name: 'Entertainment', amount: income * 0.05 },
        { name: 'Savings & Investments', amount: income * 0.25 }
      ];
    }
  };

  const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalActual = budgetCategories.reduce((sum, cat) => sum + cat.actual, 0);
  const totalVariance = totalActual - totalBudgeted;
  const totalVariancePercent = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'text-red-600 bg-red-50 border-red-200';
      case 'under': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'under':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 002 2h6a2 2 0 002-2V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          Budget vs Actual
        </h2>

        <div className="flex items-center space-x-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Total Budgeted</h3>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalBudgeted)}</p>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Total Actual</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalActual)}</p>
        </div>
        
        <div className={`border rounded-lg p-4 ${totalVariance >= 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <h3 className={`text-sm font-medium mb-2 ${totalVariance >= 0 ? 'text-red-800' : 'text-green-800'}`}>
            Total Variance
          </h3>
          <p className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-red-900' : 'text-green-900'}`}>
            {totalVariance >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalVariance))}
          </p>
          <p className={`text-sm ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            ({totalVariancePercent >= 0 ? '+' : ''}{totalVariancePercent.toFixed(1)}%)
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        {budgetCategories.map((category) => (
          <div key={category.name} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">{category.name}</h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(category.status)}`}>
                  {getStatusIcon(category.status)}
                  <span className="ml-1">
                    {category.status === 'over' ? 'Over Budget' : 
                     category.status === 'under' ? 'Under Budget' : 'On Track'}
                  </span>
                </span>
              </div>
              
              <div className="text-right sm:text-left lg:text-right">
                <p className="text-sm text-gray-500">
                  {formatCurrency(category.actual)} / {formatCurrency(category.budgeted)}
                </p>
                <p className={`text-sm font-medium ${
                  category.variance >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {category.variance >= 0 ? '+' : ''}{formatCurrency(Math.abs(category.variance))} 
                  ({category.variancePercent >= 0 ? '+' : ''}{category.variancePercent.toFixed(1)}%)
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  category.actual > category.budgeted ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min((category.actual / category.budgeted) * 100, 100)}%` 
                }}
              />
              {category.actual > category.budgeted && (
                <div className="mt-1">
                  <div 
                    className="h-1 bg-red-300 rounded-full"
                    style={{ 
                      width: `${Math.min(((category.actual - category.budgeted) / category.budgeted) * 100, 100)}%` 
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {budgetCategories.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 002 2h6a2 2 0 002-2V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          <p>No budget data available</p>
          <p className="text-sm mt-1">Add some transactions to see your budget analysis</p>
        </div>
      )}
    </section>
  );
}