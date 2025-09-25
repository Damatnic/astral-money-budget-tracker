/**
 * Financial Goals Section Component
 * Complete CRUD operations with API integration and real-time updates
 */

'use client';

import React, { useState } from 'react';
import { FinancialGoal, CreateFinancialGoalRequest, UpdateFinancialGoalRequest, ApiResponse } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface GoalsSectionProps {
  goals: FinancialGoal[];
  loading: boolean;
  onUpdate: (goals: FinancialGoal[]) => void;
  className?: string;
  compact?: boolean;
}

interface GoalFormData {
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'emergency' | 'savings' | 'debt' | 'investment' | 'purchase';
}

const CATEGORY_CONFIG = {
  emergency: { icon: '🚨', label: 'Emergency Fund', color: 'red' },
  savings: { icon: '💰', label: 'Savings Goal', color: 'blue' },
  debt: { icon: '💳', label: 'Debt Payoff', color: 'orange' },
  investment: { icon: '📈', label: 'Investment', color: 'green' },
  purchase: { icon: '🛒', label: 'Purchase Goal', color: 'purple' },
};

export function GoalsSection({ goals, loading, onUpdate, className = '', compact = false }: GoalsSectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: '',
    category: 'savings',
  });
  const [formLoading, setFormLoading] = useState(false);


  // Create new goal
  const createGoal = async (data: CreateFinancialGoalRequest) => {
    try {
      setFormLoading(true);
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<{ goal: FinancialGoal }> = await response.json();
      
      if (result.success && result.data) {
        const newGoals = [result.data.goal, ...goals];
        onUpdate(newGoals);
        resetForm();
      } else {
        throw new Error(result.error || 'Failed to create goal');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
    } finally {
      setFormLoading(false);
    }
  };

  // Update existing goal
  const updateGoal = async (id: string, data: Partial<UpdateFinancialGoalRequest>) => {
    try {
      setFormLoading(true);
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<{ goal: FinancialGoal }> = await response.json();
      
      if (result.success && result.data) {
        const updatedGoals = goals.map(g => g.id === id ? result.data!.goal : g);
        onUpdate(updatedGoals);
        resetForm();
      } else {
        throw new Error(result.error || 'Failed to update goal');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete goal
  const deleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (result.success) {
        const filteredGoals = goals.filter(g => g.id !== id);
        onUpdate(filteredGoals);
      } else {
        throw new Error(result.error || 'Failed to delete goal');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    }
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      title: '',
      targetAmount: 0,
      currentAmount: 0,
      deadline: '',
      category: 'savings',
    });
    setEditingGoal(null);
    setShowForm(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      title: formData.title.trim(),
      targetAmount: formData.targetAmount,
      currentAmount: formData.currentAmount,
      deadline: formData.deadline || undefined,
      category: formData.category,
    };

    if (editingGoal) {
      await updateGoal(editingGoal.id, data);
    } else {
      await createGoal(data);
    }
  };

  const startEditing = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
      category: goal.category as any,
    });
    setShowForm(true);
    setError(null);
  };

  const calculateProgress = (current: number, target: number) => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  };

  const getDaysUntilDeadline = (deadline: Date | null) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };


  if (loading) {
    return (
      <section className={`bg-white rounded-lg shadow-sm p-6 border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-300 rounded w-48"></div>
            <div className="h-8 bg-gray-300 rounded w-24"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (compact) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <div className="w-5 h-5 mr-2 bg-green-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            Goals Progress
          </h3>
        </div>
        
        <div className="space-y-3">
          {goals.length === 0 ? (
            <div className="text-center py-6 text-gray-700">
              <p className="text-sm">No goals yet</p>
            </div>
          ) : (
            goals.slice(0, 3).map((goal) => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const config = CATEGORY_CONFIG[goal.category as keyof typeof CATEGORY_CONFIG];
              
              return (
                <div key={goal.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{config.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-32">{goal.title}</p>
                        <p className="text-xs text-gray-700">{config.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-800">{progress.toFixed(0)}%</p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(goal.currentAmount)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${
                        config.color === 'green' ? 'from-green-400 to-green-600' :
                        config.color === 'blue' ? 'from-blue-400 to-blue-600' :
                        config.color === 'red' ? 'from-red-400 to-red-600' :
                        config.color === 'orange' ? 'from-orange-400 to-orange-600' :
                        'from-purple-400 to-purple-600'
                      }`} 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-700">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-xs text-gray-700">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {goals.length > 3 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all ({goals.length})
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className={`relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-emerald-50/30 rounded-2xl shadow-xl backdrop-blur-sm border border-white/60 p-6 lg:p-8 ${className}`}>
      {/* Decorative Elements */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-400/10 to-green-400/10 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-blue-400/10 to-indigo-400/10 rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-green-900 bg-clip-text text-transparent flex items-center">
            <div className="w-8 h-8 lg:w-10 lg:h-10 mr-3 lg:mr-4 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            Financial Goals ({goals.length})
          </h2>
          
          <button 
            onClick={() => setShowForm(!showForm)}
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg className="w-5 h-5 mr-2 relative z-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10">Add Goal</span>
          </button>
        </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="ml-2 text-sm text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Goal Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingGoal ? 'Edit Goal' : 'Create New Goal'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.targetAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1000.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.currentAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : (editingGoal ? 'Update Goal' : 'Create Goal')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-12 text-gray-700">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-lg font-medium">No goals set yet</p>
          <p className="text-sm mt-1">Create your first financial goal to start tracking your progress</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            const isCompleted = goal.isCompleted || progress >= 100;
            const daysUntilDeadline = getDaysUntilDeadline(goal.deadline);
            const isOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0 && !isCompleted;
            const categoryConfig = CATEGORY_CONFIG[goal.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.savings;
            
            return (
              <div
                key={goal.id}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : isOverdue
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{categoryConfig.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        categoryConfig.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        categoryConfig.color === 'green' ? 'bg-green-100 text-green-800' :
                        categoryConfig.color === 'red' ? 'bg-red-100 text-red-800' :
                        categoryConfig.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {categoryConfig.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-800 font-medium">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </p>
                    {goal.deadline && (
                      <p className={`text-xs mt-1 ${
                        isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'
                      }`}>
                        {isOverdue ? 'Overdue' : daysUntilDeadline === 0 ? 'Due today' : 
                         daysUntilDeadline === 1 ? 'Due tomorrow' :
                         daysUntilDeadline && daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` :
                         new Date(goal.deadline).toLocaleDateString()
                        }
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-800">Progress</span>
                    <span className={`font-medium ${
                      isCompleted ? 'text-green-600' : 
                      isOverdue ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : 
                        isOverdue ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isCompleted && (
                      <div className="flex items-center text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Completed!</span>
                      </div>
                    )}
                    {isOverdue && (
                      <div className="flex items-center text-red-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Overdue</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditing(goal)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-red-600 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      </div>
    </section>
  );
}