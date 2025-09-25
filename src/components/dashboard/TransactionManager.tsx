/**
 * Transaction Manager Component
 * Handles transaction creation, editing, and listing
 */

import { useState, useEffect } from 'react';
import { Transaction, LoadingState } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { categorizeTransaction, getSuggestions, EXPENSE_CATEGORY_RULES, INCOME_CATEGORY_RULES } from '@/utils/categorization';

interface TransactionManagerProps {
  transactions: Transaction[];
  onAdd: (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Transaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading: LoadingState;
}

export function TransactionManager({ 
  transactions, 
  onAdd, 
  onUpdate, 
  onDelete, 
  loading 
}: TransactionManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense'
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.category) {
      return;
    }

    try {
      await onAdd({
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: new Date(formData.date),
        type: formData.type
      });
      
      // Reset form
      setFormData({
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense'
      });
      setSuggestions([]);
      setShowSuggestions(false);
      setShowForm(false);
    } catch (error) {
      // Error is handled by parent component
    }
  };

  const recentTransactions = transactions.slice(0, 10);

  return (
    <section className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/60 overflow-hidden">
      <div className="p-4">
        <div className="flex flex-row items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent flex items-center">
            <div className="w-6 h-6 mr-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h6zM4 14a2 2 0 002 2h8a2 2 0 002-2v-2H4v2z" />
              </svg>
            </div>
            Recent Transactions
          </h2>
          
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={loading.creating}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg className="w-3 h-3 mr-1.5 relative z-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10">Add</span>
          </button>
        </div>

        {/* Compact Quick Add Form */}
        {showForm && (
          <div className="mb-4 p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-white/60 shadow-md">
            <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-white/60 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-white/60 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, description: value }));
                  
                  // Auto-categorize and show suggestions
                  if (value.length > 2) {
                    const autoCategory = categorizeTransaction(value, parseFloat(formData.amount) || 0, formData.type);
                    if (autoCategory && autoCategory !== 'Other Income' && autoCategory !== 'Other Expenses') {
                      setFormData(prev => ({ ...prev, category: autoCategory }));
                    }
                    
                    const newSuggestions = getSuggestions(value, formData.type);
                    setSuggestions(newSuggestions);
                    setShowSuggestions(newSuggestions.length > 0);
                  } else {
                    setShowSuggestions(false);
                  }
                }}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                placeholder="What was this for?"
                required
              />
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category {formData.category && (
                  <span className="text-xs text-green-600">✓ Auto-detected</span>
                )}
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, category: e.target.value }));
                  setShowSuggestions(false);
                }}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                required
              >
                <option value="">Select category</option>
                {(formData.type === 'expense' ? EXPENSE_CATEGORY_RULES : INCOME_CATEGORY_RULES).map(rule => (
                  <option key={rule.category} value={rule.category}>{rule.category}</option>
                ))}
              </select>
              
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="p-2 text-xs text-gray-500 border-b">Suggestions based on description:</div>
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, category: suggestion }));
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 text-gray-700 bg-white/80 backdrop-blur-sm border border-white/60 rounded-xl hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading.creating}
              className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">
                {loading.creating ? 'Adding...' : 'Add Transaction'}
              </span>
            </button>
          </div>
            </form>
          </div>
        )}

        {/* Enhanced Transaction List */}
        <div className="space-y-3">
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h6zM4 14a2 2 0 002 2h8a2 2 0 002-2v-2H4v2z" clipRule="evenodd" />
            </svg>
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Add your first transaction to get started</p>
          </div>
        ) : (
          recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="group flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm border border-white/60 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                  transaction.type === 'income' 
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white' 
                    : 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
                }`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    {transaction.type === 'income' ? (
                      <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    )}
                  </svg>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">{transaction.description}</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    <span className="font-medium">{transaction.category}</span> • {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`text-lg font-bold ${
                  transaction.type === 'income' 
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600' 
                    : 'bg-gradient-to-r from-red-600 to-rose-600'
                } bg-clip-text text-transparent`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

        {transactions.length > 10 && (
          <div className="mt-6 text-center">
            <button className="group relative overflow-hidden bg-gradient-to-br from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 text-blue-700 px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-blue-200/50">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center justify-center">
                View all transactions ({transactions.length})
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}