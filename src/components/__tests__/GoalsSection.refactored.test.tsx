/**
 * Tests for Refactored GoalsSection Component
 * Tests improved testability with dependency injection and separated concerns
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalsSection } from '../dashboard/GoalsSection.refactored';
import { FinancialGoal, CreateFinancialGoalRequest, UpdateFinancialGoalRequest } from '@/types';

// Mock the ErrorBoundary
jest.mock('../ErrorBoundary', () => ({
  ErrorBoundary: ({ children, fallback }: any) => {
    try {
      return children;
    } catch (error) {
      return fallback || <div data-testid="error-boundary">Error occurred</div>;
    }
  },
}));

// Mock formatters
jest.mock('@/utils/formatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toLocaleString()}`,
}));

// Mock advanced logger
jest.mock('@/lib/advanced-logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Sample test data
const mockGoals: FinancialGoal[] = [
  {
    id: '1',
    title: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 5000,
    category: 'emergency',
    deadline: '2024-12-31',
    userId: 'user1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    title: 'Vacation Savings',
    targetAmount: 3000,
    currentAmount: 3000,
    category: 'savings',
    deadline: '2024-06-30',
    userId: 'user1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

describe('Refactored GoalsSection Component', () => {
  const mockOnUpdate = jest.fn();
  const mockApiClient = {
    createGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render loading state', () => {
      render(
        <GoalsSection
          goals={[]}
          loading={true}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      expect(screen.getByTestId('goals-loading')).toBeInTheDocument();
    });

    it('should render goals section with data', () => {
      render(
        <GoalsSection
          goals={mockGoals}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      expect(screen.getByTestId('goals-section')).toBeInTheDocument();
      expect(screen.getByText('Financial Goals (2)')).toBeInTheDocument();
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      expect(screen.getByText('Vacation Savings')).toBeInTheDocument();
    });

    it('should render empty state when no goals', () => {
      render(
        <GoalsSection
          goals={[]}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      expect(screen.getByTestId('empty-goals')).toBeInTheDocument();
      expect(screen.getByText('No goals yet')).toBeInTheDocument();
      expect(screen.getByText('Create Your First Goal')).toBeInTheDocument();
    });

    it('should render compact mode correctly', () => {
      const manyGoals = Array.from({ length: 5 }, (_, i) => ({
        ...mockGoals[0],
        id: `goal-${i}`,
        title: `Goal ${i + 1}`,
      }));

      render(
        <GoalsSection
          goals={manyGoals}
          loading={false}
          onUpdate={mockOnUpdate}
          compact={true}
          apiClient={mockApiClient}
        />
      );

      // Should only show first 3 goals in compact mode
      expect(screen.getByText('Goal 1')).toBeInTheDocument();
      expect(screen.getByText('Goal 2')).toBeInTheDocument();
      expect(screen.getByText('Goal 3')).toBeInTheDocument();
      expect(screen.queryByText('Goal 4')).not.toBeInTheDocument();
      expect(screen.getByText('Show 2 More Goals')).toBeInTheDocument();
    });
  });

  describe('Goal Creation', () => {
    it('should open create form when add button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <GoalsSection
          goals={[]}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      await user.click(screen.getByTestId('add-goal-button'));
      expect(screen.getByTestId('goal-form')).toBeInTheDocument();
      expect(screen.getByText('Create New Goal')).toBeInTheDocument();
    });

    it('should create goal successfully with API client', async () => {
      const user = userEvent.setup();
      const newGoal: FinancialGoal = {
        id: '3',
        title: 'New Car',
        targetAmount: 25000,
        currentAmount: 0,
        category: 'purchase',
        deadline: '2025-12-31',
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockApiClient.createGoal.mockResolvedValueOnce(newGoal);

      render(
        <GoalsSection
          goals={mockGoals}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      // Open form
      await user.click(screen.getByTestId('add-goal-button'));

      // Fill form
      await user.type(screen.getByTestId('goal-title-input'), 'New Car');
      await user.type(screen.getByTestId('target-amount-input'), '25000');
      await user.selectOptions(screen.getByTestId('category-select'), 'purchase');
      await user.type(screen.getByTestId('deadline-input'), '2025-12-31');

      // Submit form
      await user.click(screen.getByTestId('submit-goal-button'));

      await waitFor(() => {
        expect(mockApiClient.createGoal).toHaveBeenCalledWith({
          title: 'New Car',
          targetAmount: 25000,
          currentAmount: 0,
          category: 'purchase',
          deadline: '2025-12-31',
        });

        expect(mockOnUpdate).toHaveBeenCalledWith([newGoal, ...mockGoals]);
      });

      // Form should be closed after successful creation
      expect(screen.queryByTestId('goal-form')).not.toBeInTheDocument();
    });

    it('should handle create goal errors', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to create goal';

      mockApiClient.createGoal.mockRejectedValueOnce(new Error(errorMessage));

      render(
        <GoalsSection
          goals={[]}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      await user.click(screen.getByTestId('add-goal-button'));
      await user.type(screen.getByTestId('goal-title-input'), 'Test Goal');
      await user.type(screen.getByTestId('target-amount-input'), '1000');
      await user.click(screen.getByTestId('submit-goal-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should clear errors when dismiss button is clicked', async () => {
      const user = userEvent.setup();

      mockApiClient.createGoal.mockRejectedValueOnce(new Error('Test error'));

      render(
        <GoalsSection
          goals={[]}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      await user.click(screen.getByTestId('add-goal-button'));
      await user.type(screen.getByTestId('goal-title-input'), 'Test Goal');
      await user.type(screen.getByTestId('target-amount-input'), '1000');
      await user.click(screen.getByTestId('submit-goal-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Click dismiss button (×)
      await user.click(screen.getByText('✕'));
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('Goal Editing', () => {
    it('should open edit form with pre-filled data', async () => {
      const user = userEvent.setup();

      render(
        <GoalsSection
          goals={mockGoals}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      // Click edit button for first goal
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      expect(screen.getByTestId('goal-form')).toBeInTheDocument();
      expect(screen.getByText('Edit Goal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Emergency Fund')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
    });

    it('should update goal successfully', async () => {
      const user = userEvent.setup();
      const updatedGoal = { ...mockGoals[0], title: 'Updated Emergency Fund' };

      mockApiClient.updateGoal.mockResolvedValueOnce(updatedGoal);

      render(
        <GoalsSection
          goals={mockGoals}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      // Open edit form
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      // Update title
      const titleInput = screen.getByDisplayValue('Emergency Fund');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Emergency Fund');

      // Submit
      await user.click(screen.getByTestId('submit-goal-button'));

      await waitFor(() => {
        expect(mockApiClient.updateGoal).toHaveBeenCalledWith('1', {
          title: 'Updated Emergency Fund',
          targetAmount: 10000,
          currentAmount: 5000,
          category: 'emergency',
          deadline: '2024-12-31',
        });

        expect(mockOnUpdate).toHaveBeenCalledWith([updatedGoal, mockGoals[1]]);
      });
    });
  });

  describe('Goal Deletion', () => {
    it('should delete goal successfully', async () => {
      const user = userEvent.setup();

      mockApiClient.deleteGoal.mockResolvedValueOnce(undefined);

      render(
        <GoalsSection
          goals={mockGoals}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      // Click delete button for first goal
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockApiClient.deleteGoal).toHaveBeenCalledWith('1');
        expect(mockOnUpdate).toHaveBeenCalledWith([mockGoals[1]]); // Only second goal remains
      });
    });

    it('should handle delete errors', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to delete goal';

      mockApiClient.deleteGoal.mockRejectedValueOnce(new Error(errorMessage));

      render(
        <GoalsSection
          goals={mockGoals}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Progress Updates', () => {
    it('should update goal progress', async () => {
      const user = userEvent.setup();
      const updatedGoal = { ...mockGoals[0], currentAmount: 6000 };

      mockApiClient.updateGoal.mockResolvedValueOnce(updatedGoal);

      render(
        <GoalsSection
          goals={mockGoals}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      // Click update progress button
      const updateButtons = screen.getAllByText('Update Progress');
      await user.click(updateButtons[0]);

      // Update progress amount
      const progressInput = screen.getByDisplayValue('5000');
      await user.clear(progressInput);
      await user.type(progressInput, '6000');

      // Submit update
      await user.click(screen.getByText('Update'));

      await waitFor(() => {
        expect(mockApiClient.updateGoal).toHaveBeenCalledWith('1', {
          currentAmount: 6000,
        });

        expect(mockOnUpdate).toHaveBeenCalledWith([updatedGoal, mockGoals[1]]);
      });
    });

    it('should not show update progress for completed goals', () => {
      render(
        <GoalsSection
          goals={mockGoals}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      const updateButtons = screen.getAllByText('Update Progress');
      
      // First goal (50% complete) should have enabled button
      expect(updateButtons[0]).not.toBeDisabled();
      
      // Second goal (100% complete) should have disabled button
      expect(updateButtons[1]).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();

      render(
        <GoalsSection
          goals={[]}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      await user.click(screen.getByTestId('add-goal-button'));
      await user.click(screen.getByTestId('submit-goal-button'));

      // HTML5 validation should prevent submission
      const titleInput = screen.getByTestId('goal-title-input');
      const targetAmountInput = screen.getByTestId('target-amount-input');

      expect(titleInput).toBeRequired();
      expect(targetAmountInput).toBeRequired();
      expect(mockApiClient.createGoal).not.toHaveBeenCalled();
    });

    it('should validate minimum target amount', async () => {
      const user = userEvent.setup();

      render(
        <GoalsSection
          goals={[]}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      await user.click(screen.getByTestId('add-goal-button'));
      
      const targetAmountInput = screen.getByTestId('target-amount-input');
      expect(targetAmountInput).toHaveAttribute('min', '1');
    });
  });

  describe('Compact Mode Features', () => {
    it('should show expand/collapse functionality', async () => {
      const user = userEvent.setup();
      const manyGoals = Array.from({ length: 5 }, (_, i) => ({
        ...mockGoals[0],
        id: `goal-${i}`,
        title: `Goal ${i + 1}`,
      }));

      render(
        <GoalsSection
          goals={manyGoals}
          loading={false}
          onUpdate={mockOnUpdate}
          compact={true}
          apiClient={mockApiClient}
        />
      );

      // Initially shows 3 goals
      expect(screen.getByText('Goal 1')).toBeInTheDocument();
      expect(screen.getByText('Goal 3')).toBeInTheDocument();
      expect(screen.queryByText('Goal 4')).not.toBeInTheDocument();

      // Click show more
      await user.click(screen.getByText('Show 2 More Goals'));

      // Now shows all goals
      expect(screen.getByText('Goal 4')).toBeInTheDocument();
      expect(screen.getByText('Goal 5')).toBeInTheDocument();
      expect(screen.getByText('Show Less')).toBeInTheDocument();

      // Click show less
      await user.click(screen.getByText('Show Less'));

      // Back to 3 goals
      expect(screen.queryByText('Goal 4')).not.toBeInTheDocument();
      expect(screen.getByText('Show 2 More Goals')).toBeInTheDocument();
    });

    it('should call navigation handler when provided', async () => {
      const user = userEvent.setup();
      const mockOnNavigate = jest.fn();
      const manyGoals = Array.from({ length: 5 }, (_, i) => ({
        ...mockGoals[0],
        id: `goal-${i}`,
        title: `Goal ${i + 1}`,
      }));

      render(
        <GoalsSection
          goals={manyGoals}
          loading={false}
          onUpdate={mockOnUpdate}
          compact={true}
          onNavigate={mockOnNavigate}
          apiClient={mockApiClient}
        />
      );

      await user.click(screen.getByText('View All Goals →'));
      expect(mockOnNavigate).toHaveBeenCalledWith('goals');
    });
  });

  describe('Goal Progress Display', () => {
    it('should display progress correctly', () => {
      render(
        <GoalsSection
          goals={mockGoals}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      // Emergency Fund: 5000/10000 = 50%
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      expect(screen.getByText('$5,000 remaining')).toBeInTheDocument();

      // Vacation Savings: 3000/3000 = 100%
      expect(screen.getByText('100.0%')).toBeInTheDocument();
      expect(screen.getByText('✓ Completed')).toBeInTheDocument();
    });

    it('should show category icons and labels', () => {
      render(
        <GoalsSection
          goals={mockGoals}
          loading={false}
          onUpdate={mockOnUpdate}
          apiClient={mockApiClient}
        />
      );

      expect(screen.getByText('🚨')).toBeInTheDocument(); // Emergency icon
      expect(screen.getByText('💰')).toBeInTheDocument(); // Savings icon
    });
  });

  describe('API Client Dependency Injection', () => {
    it('should use default API client when none provided', async () => {
      // Mock fetch for default API client
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { goal: { id: '3', title: 'Test Goal' } },
        }),
      });

      const user = userEvent.setup();

      render(
        <GoalsSection
          goals={[]}
          loading={false}
          onUpdate={mockOnUpdate}
          // No apiClient provided - should use default
        />
      );

      await user.click(screen.getByTestId('add-goal-button'));
      await user.type(screen.getByTestId('goal-title-input'), 'Test Goal');
      await user.type(screen.getByTestId('target-amount-input'), '1000');
      await user.click(screen.getByTestId('submit-goal-button'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Test Goal',
            targetAmount: 1000,
            currentAmount: 0,
            category: 'savings',
            deadline: '',
          }),
        });
      });
    });

    it('should handle API client errors in default implementation', async () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const user = userEvent.setup();

      render(
        <GoalsSection
          goals={[]}
          loading={false}
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByTestId('add-goal-button'));
      await user.type(screen.getByTestId('goal-title-input'), 'Test Goal');
      await user.type(screen.getByTestId('target-amount-input'), '1000');
      await user.click(screen.getByTestId('submit-goal-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText(/HTTP 400: Bad Request/)).toBeInTheDocument();
      });
    });
  });
});
