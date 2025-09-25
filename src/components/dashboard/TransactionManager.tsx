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
  compact?: boolean;
  showForm?: boolean;
}

export function TransactionManager({ 
  transactions, 
  onAdd, 
  onUpdate, 
  onDelete, 
  loading,
  compact = false,
  showForm: showFormProp = true
}: TransactionManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
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

  // Filter and search transactions
  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    })
    .slice(0, compact ? 5 : undefined);

  const categories = [...new Set(transactions.map(t => t.category).filter(Boolean))];

  // Quick Add form component
  const QuickAddForm = () => (
    <div className="mb-4 p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-white/60 shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-4'} gap-3 mb-3`}>
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
              className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          
          {!compact && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, description: value }));
                    
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
                  className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Description"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {(formData.type === 'expense' ? EXPENSE_CATEGORY_RULES : INCOME_CATEGORY_RULES).map(rule => (
                    <option key={rule.category} value={rule.category}>{rule.category}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        
        {compact && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Description"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Select category</option>
                {(formData.type === 'expense' ? EXPENSE_CATEGORY_RULES : INCOME_CATEGORY_RULES).map(rule => (
                  <option key={rule.category} value={rule.category}>{rule.category}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-3 py-1.5 text-sm text-gray-800 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading.creating}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors"
          >
            {loading.creating ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );

  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <div className="w-5 h-5 mr-2 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" />
              </svg>
            </div>
            Recent Transactions
          </h3>
          {showFormProp && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
            >
              Add
            </button>
          )}
        </div>
        
        {showForm && showFormProp && <QuickAddForm />}
        
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-6 text-gray-800">
              <p className="text-sm">No recent transactions</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                    transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-32">{transaction.description}</p>
                    <p className="text-xs text-gray-800">{transaction.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  <p className="text-xs text-gray-800">{formatDate(transaction.date)}</p>
                </div>
              </div>
            ))
          )}
        </div>
        
        {transactions.length > 5 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all ({transactions.length})
            </button>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <div className="w-6 h-6 mr-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" />
              </svg>
            </div>
            Transactions ({transactions.length})
          </h2>
          
          {showFormProp && (
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={loading.creating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Transaction
            </button>
          )}
        </div>
        
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      
      {showForm && showFormProp && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <QuickAddForm />
        </div>
      )}
      
      {/* Transaction table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-800 uppercase tracking-wider">Transaction</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-800 uppercase tracking-wider">Category</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-800 uppercase tracking-wider">Date</th>
              <th className="text-right py-3 px-6 text-xs font-medium text-gray-800 uppercase tracking-wider">Amount</th>
              <th className="text-center py-3 px-6 text-xs font-medium text-gray-800 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="text-gray-800">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" clipRule="evenodd" />
                    </svg>
                    <p>No transactions found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                        transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
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
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-800 capitalize">{transaction.type}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {transaction.category}
                    </span>
                  </td>
                  
                  <td className="py-4 px-6 text-sm text-gray-800">
                    {formatDate(transaction.date)}
                  </td>
                  
                  <td className="py-4 px-6 text-right">
                    <span className={`text-lg font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </td>
                  
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setEditingId(transaction.id)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(transaction.id)}
                        disabled={loading.deleting}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400 p-1"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}