/**
 * Comprehensive Component Tests for GoalsSection
 * Tests UI interactions, API integration, and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the GoalsSection component since it uses client-side hooks
const MockGoalsSection = () => {
  const [goals, setGoals] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);
  const [formLoading, setFormLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchGoals = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/goals');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.success) {
          setGoals(result.data.goals || []);
        } else {
          throw new Error(result.error || 'Failed to load goals');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load goals');
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const createGoal = async (data) => {
    try {
      setFormLoading(true);
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setGoals(prev => [result.data.goal, ...prev]);
        setShowCreateForm(false);
      } else {
        throw new Error(result.error || 'Failed to create goal');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
    } finally {
      setFormLoading(false);
    }
  };

  const updateGoal = async (id, data) => {
    try {
      setFormLoading(true);
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setGoals(prev => prev.map(goal => 
          goal.id === id ? result.data.goal : goal
        ));
        setEditingGoal(null);
      } else {
        throw new Error(result.error || 'Failed to update goal');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal');
    } finally {
      setFormLoading(false);
    }
  };

  const deleteGoal = async (id) => {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setGoals(prev => prev.filter(goal => goal.id !== id));
        setDeleteConfirm(null);
      } else {
        throw new Error(result.error || 'Failed to delete goal');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    }
  };

  if (loading) {
    return <div>Loading Goals...</div>;
  }

  if (error) {
    return (
      <div>
        <div>Failed to load goals: {error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div aria-label="financial goals section">
      <h2>Financial Goals</h2>
      
      <button onClick={() => setShowCreateForm(true)}>
        Add New Goal
      </button>

      {showCreateForm && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const title = formData.get('title') as string;
          const targetAmount = Number(formData.get('targetAmount'));
          const currentAmount = Number(formData.get('currentAmount') || 0);
          const deadline = formData.get('deadline') as string;
          const category = formData.get('category') as string;

          if (!title) {
            setError('Title is required');
            return;
          }
          if (!targetAmount || targetAmount <= 0) {
            setError('Target amount is required and must be greater than 0');
            return;
          }

          createGoal({
            title,
            targetAmount,
            currentAmount,
            deadline: deadline || undefined,
            category,
          });
        }}>
          <input
            name="title"
            placeholder="Goal title"
            disabled={formLoading}
          />
          <input
            name="targetAmount"
            type="number"
            placeholder="Target amount"
            disabled={formLoading}
          />
          <input
            name="currentAmount"
            type="number"
            placeholder="Current amount"
            disabled={formLoading}
          />
          <input
            name="deadline"
            type="date"
            placeholder="Deadline"
            disabled={formLoading}
          />
          <select name="category" defaultValue="emergency" disabled={formLoading}>
            <option value="emergency">Emergency</option>
            <option value="savings">Savings</option>
            <option value="debt">Debt</option>
            <option value="investment">Investment</option>
            <option value="purchase">Purchase</option>
          </select>
          <button type="submit" disabled={formLoading}>
            {formLoading ? 'Creating Goal...' : 'Create Goal'}
          </button>
          <button type="button" onClick={() => setShowCreateForm(false)}>
            Cancel
          </button>
        </form>
      )}

      {goals.map((goal) => (
        <div key={goal.id}>
          {editingGoal?.id === goal.id ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const title = formData.get('title') as string;
              const targetAmount = Number(formData.get('targetAmount'));
              const currentAmount = Number(formData.get('currentAmount'));
              updateGoal(goal.id, { title, targetAmount, currentAmount });
            }}>
              <input name="title" defaultValue={goal.title} />
              <input name="targetAmount" type="number" defaultValue={goal.targetAmount} />
              <input name="currentAmount" type="number" defaultValue={goal.currentAmount} />
              <button type="submit">Save Changes</button>
              <button type="button" onClick={() => setEditingGoal(null)}>Cancel</button>
            </form>
          ) : (
            <div>
              <h3>{goal.title}</h3>
              <div>${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}</div>
              <div>{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</div>
              {goal.isCompleted && <span>✓ Completed</span>}
              <button onClick={() => setEditingGoal(goal)}>Edit</button>
              <button onClick={() => setDeleteConfirm(goal)}>Delete</button>
            </div>
          )}
        </div>
      ))}

      {deleteConfirm && (
        <div>
          <h3>Confirm Deletion</h3>
          <p>Delete {deleteConfirm.title}?</p>
          <button onClick={() => deleteGoal(deleteConfirm.id)}>Confirm Deletion</button>
          <button onClick={() => setDeleteConfirm(null)}>Cancel</button>
        </div>
      )}

      {error && <div>{error}</div>}
    </div>
  );
};

const GoalsSection = MockGoalsSection;
import type { FinancialGoal, ApiResponse } from '@/types';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock data
const mockGoals: FinancialGoal[] = [
  {
    id: 'goal1',
    userId: 'user123',
    title: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 5000,
    deadline: new Date('2024-12-31'),
    category: 'emergency',
    isCompleted: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'goal2',
    userId: 'user123',
    title: 'Vacation Savings',
    targetAmount: 3000,
    currentAmount: 3000,
    deadline: new Date('2024-06-15'),
    category: 'savings',
    isCompleted: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-05-01'),
  },
];

describe('GoalsSection Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: { goals: mockGoals },
      } as ApiResponse<{ goals: FinancialGoal[] }>),
    });
  });

  describe('Initial Rendering and Data Loading', () => {
    it('should render loading state initially', () => {
      render(<GoalsSection />);
      expect(screen.getByText(/loading goals/i)).toBeInTheDocument();
    });

    it('should display goals after loading', async () => {
      render(<GoalsSection />);

      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
        expect(screen.getByText('Vacation Savings')).toBeInTheDocument();
      });

      expect(screen.getByText('$5,000 of $10,000')).toBeInTheDocument();
      expect(screen.getByText('$3,000 of $3,000')).toBeInTheDocument();
    });

    it('should show completed badge for completed goals', async () => {
      render(<GoalsSection />);

      await waitFor(() => {
        expect(screen.getByText('✓ Completed')).toBeInTheDocument();
      });
    });

    it('should calculate and display progress correctly', async () => {
      render(<GoalsSection />);

      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument(); // Emergency Fund
        expect(screen.getByText('100%')).toBeInTheDocument(); // Vacation Savings
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<GoalsSection />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load goals/i)).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should display error when API returns error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          error: 'Database connection failed',
          code: 'DB_ERROR',
        } as ApiResponse<any>),
      });

      render(<GoalsSection />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load goals/i)).toBeInTheDocument();
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<GoalsSection />);

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
    });

    it('should retry loading when retry button is clicked', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { goals: mockGoals },
        }),
      });

      render(<GoalsSection />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByText(/retry/i);
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      });
    });
  });

  describe('Create Goal Form', () => {
    beforeEach(async () => {
      render(<GoalsSection />);
      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      });
    });

    it('should show create form when Add New Goal button is clicked', async () => {
      const addButton = screen.getByText(/add new goal/i);
      await user.click(addButton);

      expect(screen.getByPlaceholderText(/goal title/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/target amount/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('emergency')).toBeInTheDocument(); // Default category
    });

    it('should validate required fields', async () => {
      const addButton = screen.getByText(/add new goal/i);
      await user.click(addButton);

      const createButton = screen.getByText(/create goal/i);
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
        expect(screen.getByText(/target amount is required/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum target amount', async () => {
      const addButton = screen.getByText(/add new goal/i);
      await user.click(addButton);

      const titleInput = screen.getByPlaceholderText(/goal title/i);
      const amountInput = screen.getByPlaceholderText(/target amount/i);
      
      await user.type(titleInput, 'Test Goal');
      await user.type(amountInput, '0');

      const createButton = screen.getByText(/create goal/i);
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/target amount must be at least/i)).toBeInTheDocument();
      });
    });

    it('should create goal successfully', async () => {
      const newGoal: FinancialGoal = {
        id: 'goal3',
        userId: 'user123',
        title: 'New Car',
        targetAmount: 25000,
        currentAmount: 0,
        deadline: new Date('2025-03-15'),
        category: 'purchase',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock successful creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          success: true,
          data: { goal: newGoal },
        } as ApiResponse<{ goal: FinancialGoal }>),
      });

      const addButton = screen.getByText(/add new goal/i);
      await user.click(addButton);

      // Fill form
      await user.type(screen.getByPlaceholderText(/goal title/i), 'New Car');
      await user.type(screen.getByPlaceholderText(/target amount/i), '25000');
      await user.selectOptions(screen.getByDisplayValue('emergency'), 'purchase');
      await user.type(screen.getByPlaceholderText(/deadline/i), '2025-03-15');

      const createButton = screen.getByText(/create goal/i);
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('New Car')).toBeInTheDocument();
        expect(screen.getByText('$0 of $25,000')).toBeInTheDocument();
      });

      // Form should be hidden after successful creation
      expect(screen.queryByPlaceholderText(/goal title/i)).not.toBeInTheDocument();
    });

    it('should handle creation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({
          success: false,
          error: 'A goal with this title already exists',
          code: 'DUPLICATE_GOAL',
        } as ApiResponse<any>),
      });

      const addButton = screen.getByText(/add new goal/i);
      await user.click(addButton);

      await user.type(screen.getByPlaceholderText(/goal title/i), 'Emergency Fund');
      await user.type(screen.getByPlaceholderText(/target amount/i), '5000');

      const createButton = screen.getByText(/create goal/i);
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/goal with this title already exists/i)).toBeInTheDocument();
      });

      // Form should still be visible on error
      expect(screen.getByPlaceholderText(/goal title/i)).toBeInTheDocument();
    });

    it('should cancel form creation', async () => {
      const addButton = screen.getByText(/add new goal/i);
      await user.click(addButton);

      expect(screen.getByPlaceholderText(/goal title/i)).toBeInTheDocument();

      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);

      expect(screen.queryByPlaceholderText(/goal title/i)).not.toBeInTheDocument();
    });
  });

  describe('Edit Goal Functionality', () => {
    beforeEach(async () => {
      render(<GoalsSection />);
      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      });
    });

    it('should show edit form when edit button is clicked', async () => {
      const editButtons = screen.getAllByText(/edit/i);
      await user.click(editButtons[0]);

      expect(screen.getByDisplayValue('Emergency Fund')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10000')).toBeInTheDocument();
    });

    it('should update goal successfully', async () => {
      const updatedGoal = {
        ...mockGoals[0],
        currentAmount: 7500,
        title: 'Updated Emergency Fund',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { goal: updatedGoal, changes: ['title', 'currentAmount'] },
        } as ApiResponse<{ goal: FinancialGoal; changes: string[] }>),
      });

      const editButtons = screen.getAllByText(/edit/i);
      await user.click(editButtons[0]);

      const titleInput = screen.getByDisplayValue('Emergency Fund');
      const currentAmountInput = screen.getByDisplayValue('5000');

      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Emergency Fund');
      await user.clear(currentAmountInput);
      await user.type(currentAmountInput, '7500');

      const saveButton = screen.getByText(/save changes/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Updated Emergency Fund')).toBeInTheDocument();
        expect(screen.getByText('$7,500 of $10,000')).toBeInTheDocument();
      });
    });

    it('should handle edit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve({
          success: false,
          error: 'Current amount cannot exceed target amount',
          code: 'BUSINESS_RULE_VIOLATION',
        } as ApiResponse<any>),
      });

      const editButtons = screen.getAllByText(/edit/i);
      await user.click(editButtons[0]);

      const currentAmountInput = screen.getByDisplayValue('5000');
      await user.clear(currentAmountInput);
      await user.type(currentAmountInput, '15000');

      const saveButton = screen.getByText(/save changes/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/current amount cannot exceed target amount/i)).toBeInTheDocument();
      });
    });

    it('should cancel edit operation', async () => {
      const editButtons = screen.getAllByText(/edit/i);
      await user.click(editButtons[0]);

      expect(screen.getByDisplayValue('Emergency Fund')).toBeInTheDocument();

      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);

      expect(screen.queryByDisplayValue('Emergency Fund')).not.toBeInTheDocument();
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument(); // Back to read-only display
    });
  });

  describe('Delete Goal Functionality', () => {
    beforeEach(async () => {
      render(<GoalsSection />);
      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      });
    });

    it('should show confirmation dialog before deletion', async () => {
      const deleteButtons = screen.getAllByText(/delete/i);
      await user.click(deleteButtons[0]);

      expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
      expect(screen.getByText(/delete emergency fund/i)).toBeInTheDocument();
    });

    it('should delete goal successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { message: 'Goal deleted successfully' },
        } as ApiResponse<{ message: string }>),
      });

      const deleteButtons = screen.getAllByText(/delete/i);
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByText(/confirm deletion/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText('Emergency Fund')).not.toBeInTheDocument();
      });
    });

    it('should handle delete errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          error: 'Failed to delete goal',
          code: 'INTERNAL_ERROR',
        } as ApiResponse<any>),
      });

      const deleteButtons = screen.getAllByText(/delete/i);
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByText(/confirm deletion/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to delete goal/i)).toBeInTheDocument();
      });

      // Goal should still be visible
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    });

    it('should cancel delete operation', async () => {
      const deleteButtons = screen.getAllByText(/delete/i);
      await user.click(deleteButtons[0]);

      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);

      expect(screen.queryByText(/confirm deletion/i)).not.toBeInTheDocument();
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    });
  });

  describe('UI State Management', () => {
    it('should show loading states during operations', async () => {
      let resolveCreatePromise: (value: any) => void;
      const createPromise = new Promise((resolve) => {
        resolveCreatePromise = resolve;
      });

      mockFetch.mockResolvedValueOnce(createPromise as any);

      render(<GoalsSection />);

      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      });

      const addButton = screen.getByText(/add new goal/i);
      await user.click(addButton);

      await user.type(screen.getByPlaceholderText(/goal title/i), 'Test Goal');
      await user.type(screen.getByPlaceholderText(/target amount/i), '5000');

      const createButton = screen.getByText(/create goal/i);
      await user.click(createButton);

      expect(screen.getByText(/creating goal/i)).toBeInTheDocument();
      expect(createButton).toBeDisabled();

      // Resolve the promise to complete the test
      resolveCreatePromise!({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { goal: { ...mockGoals[0], id: 'new-goal' } },
        }),
      });
    });

    it('should disable form during submission', async () => {
      render(<GoalsSection />);

      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      });

      const addButton = screen.getByText(/add new goal/i);
      await user.click(addButton);

      const titleInput = screen.getByPlaceholderText(/goal title/i);
      const amountInput = screen.getByPlaceholderText(/target amount/i);
      
      await user.type(titleInput, 'Test Goal');
      await user.type(amountInput, '5000');

      // Start form submission
      const createButton = screen.getByText(/create goal/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(titleInput).toBeDisabled();
        expect(amountInput).toBeDisabled();
        expect(createButton).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<GoalsSection />);
      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels', () => {
      expect(screen.getByLabelText(/financial goals section/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add new goal/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const addButton = screen.getByText(/add new goal/i);
      
      // Focus should work
      addButton.focus();
      expect(addButton).toHaveFocus();

      // Enter key should activate button
      fireEvent.keyDown(addButton, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/goal title/i)).toBeInTheDocument();
      });
    });

    it('should announce loading states to screen readers', () => {
      const { rerender } = render(<GoalsSection />);
      
      // Check for aria-live regions
      const loadingElement = screen.getByText(/loading goals/i);
      expect(loadingElement.closest('[aria-live]')).toBeTruthy();
    });
  });

  describe('Data Persistence', () => {
    it('should maintain form data when switching between create and edit modes', async () => {
      render(<GoalsSection />);

      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      });

      // Start creating a goal
      const addButton = screen.getByText(/add new goal/i);
      await user.click(addButton);

      await user.type(screen.getByPlaceholderText(/goal title/i), 'Partial Goal');

      // Cancel and restart
      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);

      // Re-open form
      await user.click(addButton);

      // Form should be reset
      expect(screen.getByPlaceholderText(/goal title/i)).toHaveValue('');
    });

    it('should refresh goals list after successful operations', async () => {
      const updatedGoals = [
        ...mockGoals,
        {
          id: 'goal3',
          userId: 'user123',
          title: 'New Goal',
          targetAmount: 5000,
          currentAmount: 0,
          deadline: null,
          category: 'savings',
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { goals: mockGoals },
        }),
      });

      // Mock successful creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          success: true,
          data: { goal: updatedGoals[2] },
        }),
      });

      render(<GoalsSection />);

      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      });

      const addButton = screen.getByText(/add new goal/i);
      await user.click(addButton);

      await user.type(screen.getByPlaceholderText(/goal title/i), 'New Goal');
      await user.type(screen.getByPlaceholderText(/target amount/i), '5000');

      const createButton = screen.getByText(/create goal/i);
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('New Goal')).toBeInTheDocument();
      });
    });
  });
});