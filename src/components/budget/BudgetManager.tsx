/**
 * Budget Manager Component
 * Implements 50/30/20 rule, Zero-based, and Envelope budgeting methods
 */

'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { Transaction, RecurringBill } from '@/types';

interface BudgetCategory {
  id: string;
  name: string;
  type: 'need' | 'want' | 'savings';
  allocated: number;
  spent: number;
  remaining: number;
  percentage?: number;
  icon?: string;
}

interface BudgetManagerProps {
  transactions: Transaction[];
  bills: RecurringBill[];
  monthlyIncome: number;
  onBudgetUpdate?: (budget: any) => void;
}

type BudgetMethod = '50/30/20' | 'zero-based' | 'envelope' | 'custom';

const DEFAULT_CATEGORIES_50_30_20: BudgetCategory[] = [
  { id: 'needs', name: 'Needs (50%)', type: 'need', allocated: 0, spent: 0, remaining: 0, percentage: 50, icon: '🏠' },
  { id: 'wants', name: 'Wants (30%)', type: 'want', allocated: 0, spent: 0, remaining: 0, percentage: 30, icon: '🎮' },
  { id: 'savings', name: 'Savings & Debt (20%)', type: 'savings', allocated: 0, spent: 0, remaining: 0, percentage: 20, icon: '💰' },
];

const ENVELOPE_CATEGORIES: BudgetCategory[] = [
  { id: 'housing', name: 'Housing', type: 'need', allocated: 0, spent: 0, remaining: 0, icon: '🏠' },
  { id: 'food', name: 'Food & Groceries', type: 'need', allocated: 0, spent: 0, remaining: 0, icon: '🍽️' },
  { id: 'transportation', name: 'Transportation', type: 'need', allocated: 0, spent: 0, remaining: 0, icon: '🚗' },
  { id: 'utilities', name: 'Utilities', type: 'need', allocated: 0, spent: 0, remaining: 0, icon: '💡' },
  { id: 'insurance', name: 'Insurance', type: 'need', allocated: 0, spent: 0, remaining: 0, icon: '🛡️' },
  { id: 'entertainment', name: 'Entertainment', type: 'want', allocated: 0, spent: 0, remaining: 0, icon: '🎬' },
  { id: 'personal', name: 'Personal', type: 'want', allocated: 0, spent: 0, remaining: 0, icon: '👤' },
  { id: 'savings', name: 'Savings', type: 'savings', allocated: 0, spent: 0, remaining: 0, icon: '🏦' },
  { id: 'emergency', name: 'Emergency Fund', type: 'savings', allocated: 0, spent: 0, remaining: 0, icon: '🚨' },
];

export function BudgetManager({ transactions, bills, monthlyIncome, onBudgetUpdate }: BudgetManagerProps) {
  const [budgetMethod, setBudgetMethod] = useState<BudgetMethod>('50/30/20');
  const [categories, setCategories] = useState<BudgetCategory[]>(DEFAULT_CATEGORIES_50_30_20);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'need' as const, allocated: 0 });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [currentIncome, setCurrentIncome] = useState(monthlyIncome);

  useEffect(() => {
    updateBudgetAllocations();
  }, [budgetMethod, currentIncome]);

  const updateBudgetAllocations = () => {
    if (budgetMethod === '50/30/20') {
      const needs = currentIncome * 0.5;
      const wants = currentIncome * 0.3;
      const savings = currentIncome * 0.2;
      
      setCategories([
        { ...DEFAULT_CATEGORIES_50_30_20[0], allocated: needs, remaining: needs - DEFAULT_CATEGORIES_50_30_20[0].spent },
        { ...DEFAULT_CATEGORIES_50_30_20[1], allocated: wants, remaining: wants - DEFAULT_CATEGORIES_50_30_20[1].spent },
        { ...DEFAULT_CATEGORIES_50_30_20[2], allocated: savings, remaining: savings - DEFAULT_CATEGORIES_50_30_20[2].spent },
      ]);
    } else if (budgetMethod === 'envelope') {
      setCategories(ENVELOPE_CATEGORIES);
    }
  };

  const handleMethodChange = (method: BudgetMethod) => {
    setBudgetMethod(method);
    if (method === '50/30/20') {
      setCategories(DEFAULT_CATEGORIES_50_30_20);
    } else if (method === 'envelope') {
      setCategories(ENVELOPE_CATEGORIES);
    } else if (method === 'zero-based') {
      setCategories([]);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.name) {
      const category: BudgetCategory = {
        id: Date.now().toString(),
        name: newCategory.name,
        type: newCategory.type,
        allocated: newCategory.allocated,
        spent: 0,
        remaining: newCategory.allocated,
        icon: newCategory.type === 'need' ? '📌' : newCategory.type === 'want' ? '✨' : '💵',
      };
      setCategories([...categories, category]);
      setNewCategory({ name: '', type: 'need', allocated: 0 });
      setShowAddCategory(false);
    }
  };

  const handleUpdateCategory = (id: string, allocated: number) => {
    setCategories(categories.map(cat => 
      cat.id === id 
        ? { ...cat, allocated, remaining: allocated - cat.spent }
        : cat
    ));
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id));
  };

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = currentIncome - totalAllocated;
  const isOverBudget = totalAllocated > currentIncome;

  const getCategoryTypeColor = (type: 'need' | 'want' | 'savings') => {
    switch (type) {
      case 'need': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'want': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'savings': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getProgressColor = (spent: number, allocated: number) => {
    const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Budget Manager</h2>
        <p className="text-gray-600">Plan and track your monthly budget using proven methods</p>
      </div>

      {/* Budget Method Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Budgeting Method</label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 text-sm lg:text-base">
          {(['50/30/20', 'zero-based', 'envelope', 'custom'] as BudgetMethod[]).map(method => (
            <button
              key={method}
              onClick={() => handleMethodChange(method)}
              className={`p-3 rounded-lg border-2 transition-all ${
                budgetMethod === method
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-semibold capitalize">{method}</div>
              <div className="text-xs mt-1 opacity-75">
                {method === '50/30/20' && 'Simple rule-based'}
                {method === 'zero-based' && 'Every dollar allocated'}
                {method === 'envelope' && 'Category-based'}
                {method === 'custom' && 'Your own system'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Income */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Income</label>
            <p className="text-xs text-gray-500 mt-1">After-tax income for budgeting</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">$</span>
            <input
              type="number"
              value={currentIncome}
              onChange={(e) => setCurrentIncome(parseFloat(e.target.value) || 0)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Income</div>
          <div className="text-2xl font-bold text-blue-800">{formatCurrency(currentIncome)}</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600 font-medium">Allocated</div>
          <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-purple-800'}`}>
            {formatCurrency(totalAllocated)}
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium">Remaining</div>
          <div className={`text-2xl font-bold ${totalRemaining < 0 ? 'text-red-600' : 'text-green-800'}`}>
            {formatCurrency(totalRemaining)}
          </div>
        </div>
      </div>

      {/* Budget Method Description */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          {budgetMethod === '50/30/20' && '📊 50/30/20 Rule'}
          {budgetMethod === 'zero-based' && '🎯 Zero-Based Budgeting'}
          {budgetMethod === 'envelope' && '✉️ Envelope System'}
          {budgetMethod === 'custom' && '⚙️ Custom Budget'}
        </h3>
        <p className="text-sm text-blue-700">
          {budgetMethod === '50/30/20' && 'Allocate 50% to needs, 30% to wants, and 20% to savings & debt repayment. Simple and balanced.'}
          {budgetMethod === 'zero-based' && 'Give every dollar a job. Income minus expenses equals zero. Complete control over spending.'}
          {budgetMethod === 'envelope' && 'Divide money into categories (envelopes). When an envelope is empty, stop spending in that category.'}
          {budgetMethod === 'custom' && 'Create your own budget categories and allocations that work for your unique situation.'}
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map(category => (
          <div key={category.id} className={`p-4 rounded-lg border-2 ${getCategoryTypeColor(category.type)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h3 className="font-semibold">{category.name}</h3>
                  <span className="text-xs opacity-75 capitalize">{category.type}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {editingCategory === category.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      defaultValue={category.allocated}
                      onBlur={(e) => handleUpdateCategory(category.id, parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border rounded text-right"
                      autoFocus
                    />
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(category.allocated)}</div>
                      {category.percentage && (
                        <div className="text-xs opacity-75">{category.percentage}% of income</div>
                      )}
                    </div>
                    {budgetMethod !== '50/30/20' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingCategory(category.id)}
                          className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-xs px-2 py-1 bg-red-500 bg-opacity-20 text-red-700 rounded hover:bg-opacity-30"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Spent: {formatCurrency(category.spent)}</span>
                <span>Remaining: {formatCurrency(category.remaining)}</span>
              </div>
              <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(category.spent, category.allocated)}`}
                  style={{ width: `${Math.min((category.spent / category.allocated) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add Category Button */}
        {(budgetMethod === 'zero-based' || budgetMethod === 'custom' || budgetMethod === 'envelope') && (
          <>
            {showAddCategory ? (
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                  />
                  <select
                    value={newCategory.type}
                    onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as any })}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="need">Need</option>
                    <option value="want">Want</option>
                    <option value="savings">Savings</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newCategory.allocated || ''}
                    onChange={(e) => setNewCategory({ ...newCategory, allocated: parseFloat(e.target.value) || 0 })}
                    className="px-3 py-2 border rounded-md"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddCategory}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddCategory(false)}
                      className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddCategory(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                + Add Budget Category
              </button>
            )}
          </>
        )}
      </div>

      {/* Zero-Based Budget Check */}
      {budgetMethod === 'zero-based' && (
        <div className={`mt-6 p-4 rounded-lg border-2 ${
          totalRemaining === 0 
            ? 'bg-green-50 border-green-300 text-green-800' 
            : totalRemaining > 0
            ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
            : 'bg-red-50 border-red-300 text-red-800'
        }`}>
          <div className="font-semibold mb-1">
            {totalRemaining === 0 && '✅ Perfect! Every dollar has a job.'}
            {totalRemaining > 0 && `⚠️ ${formatCurrency(totalRemaining)} still needs to be allocated.`}
            {totalRemaining < 0 && `❌ Over-budgeted by ${formatCurrency(Math.abs(totalRemaining))}.`}
          </div>
          <div className="text-sm opacity-75">
            Zero-based budgeting requires income minus allocations to equal zero.
          </div>
        </div>
      )}
    </div>
  );
}