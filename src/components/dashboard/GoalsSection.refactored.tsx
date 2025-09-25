/**
 * Refactored Financial Goals Section Component
 * Improved testability with separated concerns and dependency injection
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { FinancialGoal, CreateFinancialGoalRequest, UpdateFinancialGoalRequest } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Extracted interfaces for better type safety
interface GoalsSectionProps {
  goals: FinancialGoal[];
  loading: boolean;
  onUpdate: (goals: FinancialGoal[]) => void;
  className?: string;
  compact?: boolean;
  onNavigate?: (tab: string) => void;
  // Dependency injection for better testability
  apiClient?: GoalsApiClient;
}

interface GoalFormData {
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'emergency' | 'savings' | 'debt' | 'investment' | 'purchase';
}

interface GoalsApiClient {
  createGoal: (data: CreateFinancialGoalRequest) => Promise<FinancialGoal>;
  updateGoal: (id: string, data: Partial<UpdateFinancialGoalRequest>) => Promise<FinancialGoal>;
  deleteGoal: (id: string) => Promise<void>;
}

// Default API client implementation
const defaultApiClient: GoalsApiClient = {
  async createGoal(data: CreateFinancialGoalRequest): Promise<FinancialGoal> {
    const response = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to create goal');
    }

    return result.data.goal;
  },

  async updateGoal(id: string, data: Partial<UpdateFinancialGoalRequest>): Promise<FinancialGoal> {
    const response = await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to update goal');
    }

    return result.data.goal;
  },

  async deleteGoal(id: string): Promise<void> {
    const response = await fetch(`/api/goals/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete goal');
    }
  },
};

// Category configuration moved to constants
const CATEGORY_CONFIG = {
  emergency: { icon: '🚨', label: 'Emergency Fund', color: 'red' },
  savings: { icon: '💰', label: 'Savings Goal', color: 'blue' },
  debt: { icon: '💳', label: 'Debt Payoff', color: 'orange' },
  investment: { icon: '📈', label: 'Investment', color: 'green' },
  purchase: { icon: '🛒', label: 'Purchase Goal', color: 'purple' },
} as const;

// Custom hook for goals state management
function useGoalsState(
  initialGoals: FinancialGoal[],
  onUpdate: (goals: FinancialGoal[]) => void,
  apiClient: GoalsApiClient
) {
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const createGoal = useCallback(async (data: CreateFinancialGoalRequest) => {
    try {
      setFormLoading(true);
      setError(null);
      
      const newGoal = await apiClient.createGoal(data);
      const updatedGoals = [newGoal, ...initialGoals];
      onUpdate(updatedGoals);
      
      return newGoal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create goal';
      setError(errorMessage);
      throw err;
    } finally {
      setFormLoading(false);
    }
  }, [initialGoals, onUpdate, apiClient]);

  const updateGoal = useCallback(async (id: string, data: Partial<UpdateFinancialGoalRequest>) => {
    try {
      setFormLoading(true);
      setError(null);
      
      const updatedGoal = await apiClient.updateGoal(id, data);
      const updatedGoals = initialGoals.map(goal => 
        goal.id === id ? updatedGoal : goal
      );
      onUpdate(updatedGoals);
      
      return updatedGoal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update goal';
      setError(errorMessage);
      throw err;
    } finally {
      setFormLoading(false);
    }
  }, [initialGoals, onUpdate, apiClient]);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      setFormLoading(true);
      setError(null);
      
      await apiClient.deleteGoal(id);
      const updatedGoals = initialGoals.filter(goal => goal.id !== id);
      onUpdate(updatedGoals);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete goal';
      setError(errorMessage);
      throw err;
    } finally {
      setFormLoading(false);
    }
  }, [initialGoals, onUpdate, apiClient]);

  return {
    error,
    formLoading,
    clearError,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}

// Custom hook for form state management
function useGoalForm() {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: '',
    category: 'savings',
  });

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      targetAmount: 0,
      currentAmount: 0,
      deadline: '',
      category: 'savings',
    });
    setShowForm(false);
    setEditingGoal(null);
  }, []);

  const openCreateForm = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  const openEditForm = useCallback((goal: FinancialGoal) => {
    setFormData({
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline ? (goal.deadline instanceof Date ? goal.deadline.toISOString().split('T')[0] : goal.deadline) : '',
      category: goal.category as GoalFormData['category'],
    });
    setEditingGoal(goal);
    setShowForm(true);
  }, []);

  const updateFormData = useCallback((updates: Partial<GoalFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    showForm,
    editingGoal,
    formData,
    resetForm,
    openCreateForm,
    openEditForm,
    updateFormData,
    setShowForm,
  };
}

// Separated Goal Item Component for better testability
interface GoalItemProps {
  goal: FinancialGoal;
  compact: boolean;
  onEdit: (goal: FinancialGoal) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, currentAmount: number) => void;
}

function GoalItem({ goal, compact, onEdit, onDelete, onUpdateProgress }: GoalItemProps) {
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [progressAmount, setProgressAmount] = useState(goal.currentAmount);

  const progress = useMemo(() => {
    return goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  }, [goal.currentAmount, goal.targetAmount]);

  const isCompleted = progress >= 100;
  const config = CATEGORY_CONFIG[goal.category];

  const handleProgressUpdate = async () => {
    try {
      setIsUpdatingProgress(true);
      await onUpdateProgress(goal.id, progressAmount);
      setShowProgressForm(false);
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-4 ${compact ? 'p-3' : 'p-6'}`}
      data-testid={`goal-${goal.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>
              {goal.title}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full bg-${config.color}-100 text-${config.color}-800`}>
              {config.label}
            </span>
          </div>
        </div>
        
        {isCompleted && (
          <span className="text-green-500 font-bold text-sm">✓ Completed</span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>Progress</span>
          <span className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isCompleted ? 'bg-green-500' : `bg-${config.color}-500`
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
            {progress.toFixed(1)}%
          </span>
          {!isCompleted && (
            <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
              {formatCurrency(goal.targetAmount - goal.currentAmount)} remaining
            </span>
          )}
        </div>
      </div>

      {goal.deadline && (
        <div className={`text-gray-600 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
          <span className="font-medium">Target Date:</span> {new Date(goal.deadline).toLocaleDateString()}
        </div>
      )}

      {!compact && (
        <div className="flex space-x-2">
          <button
            onClick={() => setShowProgressForm(!showProgressForm)}
            className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
            disabled={isCompleted}
          >
            Update Progress
          </button>
          <button
            onClick={() => onEdit(goal)}
            className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      )}

      {showProgressForm && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={progressAmount}
              onChange={(e) => setProgressAmount(Number(e.target.value))}
              className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm"
              min="0"
              max={goal.targetAmount}
              step="0.01"
            />
            <button
              onClick={handleProgressUpdate}
              disabled={isUpdatingProgress}
              className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isUpdatingProgress ? 'Updating...' : 'Update'}
            </button>
            <button
              onClick={() => setShowProgressForm(false)}
              className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Separated Goal Form Component
interface GoalFormProps {
  formData: GoalFormData;
  editingGoal: FinancialGoal | null;
  formLoading: boolean;
  onSubmit: (data: GoalFormData) => Promise<void>;
  onCancel: () => void;
  onUpdateFormData: (updates: Partial<GoalFormData>) => void;
}

function GoalForm({ formData, editingGoal, formLoading, onSubmit, onCancel, onUpdateFormData }: GoalFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6" data-testid="goal-form">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {editingGoal ? 'Edit Goal' : 'Create New Goal'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Goal Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onUpdateFormData({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="e.g., Emergency Fund"
            data-testid="goal-title-input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount
            </label>
            <input
              type="number"
              value={formData.targetAmount}
              onChange={(e) => onUpdateFormData({ targetAmount: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
              step="0.01"
              placeholder="10000"
              data-testid="target-amount-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Amount
            </label>
            <input
              type="number"
              value={formData.currentAmount}
              onChange={(e) => onUpdateFormData({ currentAmount: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              placeholder="0"
              data-testid="current-amount-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => onUpdateFormData({ category: e.target.value as GoalFormData['category'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="category-select"
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
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => onUpdateFormData({ deadline: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="deadline-input"
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={formLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="submit-goal-button"
          >
            {formLoading ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            data-testid="cancel-goal-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Main Goals Section Component
export function GoalsSection({ 
  goals, 
  loading, 
  onUpdate, 
  className = '', 
  compact = false, 
  onNavigate,
  apiClient = defaultApiClient 
}: GoalsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  
  const goalsState = useGoalsState(goals, onUpdate, apiClient);
  const formState = useGoalForm();

  const displayedGoals = useMemo(() => {
    if (compact && !showAll) {
      return goals.slice(0, 3);
    }
    return goals;
  }, [goals, compact, showAll]);

  const handleFormSubmit = useCallback(async (data: GoalFormData) => {
    try {
      if (formState.editingGoal) {
        await goalsState.updateGoal(formState.editingGoal.id, data);
      } else {
        await goalsState.createGoal(data);
      }
      formState.resetForm();
    } catch (error) {
      // Error is handled in the custom hook
      console.error('Form submission error:', error);
    }
  }, [formState.editingGoal, goalsState, formState]);

  const handleUpdateProgress = useCallback(async (id: string, currentAmount: number) => {
    await goalsState.updateGoal(id, { currentAmount });
  }, [goalsState]);

  if (loading) {
    return (
      <div className="animate-pulse" data-testid="goals-loading">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div className="text-red-600">Failed to load goals section</div>}>
      <div className={`space-y-4 ${className}`} data-testid="goals-section">
        <div className="flex items-center justify-between">
          <h2 className={`font-bold text-gray-900 ${compact ? 'text-lg' : 'text-2xl'}`}>
            Financial Goals ({goals.length})
          </h2>
          
          {!compact && (
            <button
              onClick={formState.openCreateForm}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="add-goal-button"
            >
              Add New Goal
            </button>
          )}
        </div>

        {goalsState.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md" data-testid="error-message">
            <div className="flex items-center justify-between">
              <span>{goalsState.error}</span>
              <button
                onClick={goalsState.clearError}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {formState.showForm && (
          <GoalForm
            formData={formState.formData}
            editingGoal={formState.editingGoal}
            formLoading={goalsState.formLoading}
            onSubmit={handleFormSubmit}
            onCancel={formState.resetForm}
            onUpdateFormData={formState.updateFormData}
          />
        )}

        {displayedGoals.length === 0 ? (
          <div className="text-center py-8" data-testid="empty-goals">
            <div className="text-gray-400 mb-4">
              <span className="text-6xl">🎯</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
            <p className="text-gray-500 mb-4">
              Start by creating your first financial goal to track your progress.
            </p>
            {!compact && (
              <button
                onClick={formState.openCreateForm}
                className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700"
              >
                Create Your First Goal
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4" data-testid="goals-list">
            {displayedGoals.map((goal) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                compact={compact}
                onEdit={formState.openEditForm}
                onDelete={goalsState.deleteGoal}
                onUpdateProgress={handleUpdateProgress}
              />
            ))}

            {compact && goals.length > 3 && (
              <div className="text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showAll ? 'Show Less' : `Show ${goals.length - 3} More Goals`}
                </button>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('goals')}
                    className="ml-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All Goals →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
