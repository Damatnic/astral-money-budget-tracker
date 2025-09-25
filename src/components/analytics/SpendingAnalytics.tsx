/**
 * Spending Analytics Dashboard
 * Provides insights into spending patterns, trends, and recommendations
 */

'use client';

import { useState, useMemo } from 'react';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { analyzeSpending, SpendingInsight } from '@/utils/categorization';

interface SpendingAnalyticsProps {
  transactions: Transaction[];
  monthlyIncome: number;
}

export function SpendingAnalytics({ transactions, monthlyIncome }: SpendingAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const matchesDate = transactionDate >= startDate;
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      return matchesDate && matchesCategory;
    });
  }, [transactions, selectedPeriod, selectedCategory]);

  const insights = useMemo(() => {
    return analyzeSpending(
      filteredTransactions.map(t => ({
        category: t.category || 'Uncategorized',
        amount: t.type === 'expense' ? t.amount : 0,
        date: new Date(t.date)
      })),
      monthlyIncome
    );
  }, [filteredTransactions, monthlyIncome]);

  const totalSpent = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

  const categories = useMemo(() => {
    const categorySet = new Set(transactions.map(t => t.category || 'Uncategorized'));
    return Array.from(categorySet).sort();
  }, [transactions]);

  const getSpendingTrend = () => {
    if (filteredTransactions.length < 2) return 'stable';
    
    const sortedTransactions = filteredTransactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const half = Math.floor(sortedTransactions.length / 2);
    const firstHalf = sortedTransactions.slice(0, half);
    const secondHalf = sortedTransactions.slice(half);
    
    const firstHalfTotal = firstHalf.reduce((sum, t) => sum + t.amount, 0);
    const secondHalfTotal = secondHalf.reduce((sum, t) => sum + t.amount, 0);
    
    const firstHalfAvg = firstHalfTotal / Math.max(1, firstHalf.length);
    const secondHalfAvg = secondHalfTotal / Math.max(1, secondHalf.length);
    
    if (secondHalfAvg > firstHalfAvg * 1.1) return 'increasing';
    if (secondHalfAvg < firstHalfAvg * 0.9) return 'decreasing';
    return 'stable';
  };

  const spendingTrend = getSpendingTrend();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'decreasing':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const largestExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          Spending Analytics
        </h2>

        <div className="flex items-center space-x-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d' | '1y')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">Total Spent</h3>
          <p className="text-2xl font-bold text-red-900">{formatCurrency(totalSpent)}</p>
          <div className="flex items-center mt-1">
            {getTrendIcon(spendingTrend)}
            <span className="text-sm text-gray-600 ml-1 capitalize">{spendingTrend}</span>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">Total Income</h3>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(totalIncome)}</p>
        </div>
        
        <div className={`border rounded-lg p-4 ${netIncome >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <h3 className={`text-sm font-medium mb-2 ${netIncome >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
            Net Income
          </h3>
          <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
            {formatCurrency(Math.abs(netIncome))}
          </p>
        </div>
        
        <div className={`border rounded-lg p-4 ${savingsRate >= 20 ? 'bg-green-50 border-green-200' : savingsRate >= 10 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className={`text-sm font-medium mb-2 ${savingsRate >= 20 ? 'text-green-800' : savingsRate >= 10 ? 'text-yellow-800' : 'text-red-800'}`}>
            Savings Rate
          </h3>
          <p className={`text-2xl font-bold ${savingsRate >= 20 ? 'text-green-900' : savingsRate >= 10 ? 'text-yellow-900' : 'text-red-900'}`}>
            {savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Category Breakdown */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h3>
          <div className="space-y-3">
            {insights.slice(0, 8).map((insight, index) => (
              <div key={insight.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full`} style={{ 
                    backgroundColor: `hsl(${(index * 360) / insights.length}, 70%, 50%)` 
                  }} />
                  <div>
                    <p className="font-medium text-gray-900">{insight.category}</p>
                    <p className="text-sm text-gray-500">{insight.percentage.toFixed(1)}% of income</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(insight.total)}</p>
                  <div className="flex items-center">
                    {getTrendIcon(insight.trend)}
                    <span className="text-sm text-gray-500 ml-1 capitalize">{insight.trend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Largest Expenses */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Largest Expenses</h3>
          <div className="space-y-3">
            {largestExpenses.map((transaction, index) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-500">
                    {transaction.category} • {formatDate(transaction.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">{formatCurrency(transaction.amount)}</p>
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                </div>
              </div>
            ))}
            
            {largestExpenses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No expenses found for the selected period</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {insights.some(i => i.recommendation) && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Recommendations
          </h3>
          <ul className="space-y-2">
            {insights
              .filter(i => i.recommendation)
              .map((insight, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <svg className="w-4 h-4 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-blue-800">{insight.recommendation}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </section>
  );
}