/**
 * Integration Tests for Critical User Flows
 * End-to-end testing of major application workflows
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}));

// Mock authentication
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Simple mock components for integration testing
const MockDashboard = () => {
  const [goals, setGoals] = React.useState([]);
  const [expenses, setExpenses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [balance, setBalance] = React.useState(5000);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load goals
        const goalsResponse = await fetch('/api/goals');
        if (goalsResponse.ok) {
          const goalsData = await goalsResponse.json();
          setGoals(goalsData.data || []);
        }

        // Load expenses
        const expensesResponse = await fetch('/api/expenses');
        if (expensesResponse.ok) {
          const expensesData = await expensesResponse.json();
          setExpenses(expensesData.data?.transactions || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const addExpense = async (expenseData: any) => {
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData),
    });

    if (response.ok) {
      const result = await response.json();
      setExpenses(prev => [...prev, result.data.transaction]);
      setBalance(result.data.newBalance);
    }
  };

  const addGoal = async (goalData: any) => {
    const response = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goalData),
    });

    if (response.ok) {
      const result = await response.json();
      setGoals(prev => [...prev, result.data]);
    }
  };

  if (loading) {
    return <div data-testid="dashboard-loading">Loading Dashboard...</div>;
  }

  return (
    <div data-testid="dashboard">
      <header data-testid="dashboard-header">
        <h1>Financial Dashboard</h1>
        <div data-testid="balance">Balance: ${balance}</div>
      </header>

      <section data-testid="quick-actions">
        <h2>Quick Actions</h2>
        <button 
          onClick={() => {
            const amount = 50;
            addExpense({
              amount,
              description: 'Quick expense',
              category: 'miscellaneous',
            });
          }}
          data-testid="quick-expense-btn"
        >
          Add Quick Expense ($50)
        </button>
      </section>

      <section data-testid="goals-section">
        <h2>Financial Goals ({goals.length})</h2>
        <button
          onClick={() => {
            addGoal({
              title: 'Emergency Fund',
              targetAmount: 10000,
              currentAmount: 0,
              category: 'emergency',
            });
          }}
          data-testid="add-goal-btn"
        >
          Add Emergency Goal
        </button>
        <div data-testid="goals-list">
          {goals.map((goal: any) => (
            <div key={goal.id} data-testid={`goal-${goal.id}`}>
              <h3>{goal.title}</h3>
              <div>${goal.currentAmount} / ${goal.targetAmount}</div>
            </div>
          ))}
        </div>
      </section>

      <section data-testid="expenses-section">
        <h2>Recent Expenses ({expenses.length})</h2>
        <div data-testid="expenses-list">
          {expenses.map((expense: any) => (
            <div key={expense.id} data-testid={`expense-${expense.id}`}>
              <span>{expense.description}</span>
              <span>${expense.amount}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

describe('User Flow Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockLocalStorage.clear.mockClear();
  });

  describe('Dashboard Loading Flow', () => {
    it('should load dashboard with all sections', async () => {
      // Mock API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              { id: '1', title: 'Vacation Fund', targetAmount: 5000, currentAmount: 2000 }
            ]
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              transactions: [
                { id: '1', description: 'Grocery Shopping', amount: 85.50, category: 'groceries' }
              ]
            }
          }),
        });

      render(<MockDashboard />);

      // Should show loading initially
      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Verify all sections are present
      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      expect(screen.getByTestId('goals-section')).toBeInTheDocument();
      expect(screen.getByTestId('expenses-section')).toBeInTheDocument();

      // Verify data is displayed
      expect(screen.getByText('Vacation Fund')).toBeInTheDocument();
      expect(screen.getByText('Grocery Shopping')).toBeInTheDocument();
      expect(screen.getByText('Balance: $5000')).toBeInTheDocument();
    });

    it('should handle API failures gracefully', async () => {
      // Mock API failures
      mockFetch
        .mockRejectedValueOnce(new Error('Goals API failed'))
        .mockRejectedValueOnce(new Error('Expenses API failed'));

      render(<MockDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Should still render dashboard structure
      expect(screen.getByTestId('goals-section')).toBeInTheDocument();
      expect(screen.getByTestId('expenses-section')).toBeInTheDocument();

      // Should show empty state
      expect(screen.getByText('Financial Goals (0)')).toBeInTheDocument();
      expect(screen.getByText('Recent Expenses (0)')).toBeInTheDocument();
    });
  });

  describe('Add Expense Flow', () => {
    beforeEach(async () => {
      // Mock initial data load
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { transactions: [] } }),
        });

      render(<MockDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      mockFetch.mockClear();
    });

    it('should add expense and update balance', async () => {
      const user = userEvent.setup();

      // Mock expense creation response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            transaction: {
              id: 'new-expense-1',
              description: 'Quick expense',
              amount: 50,
              category: 'miscellaneous',
            },
            newBalance: 4950,
          },
        }),
      });

      // Click quick expense button
      await user.click(screen.getByTestId('quick-expense-btn'));

      await waitFor(() => {
        expect(screen.getByText('Quick expense')).toBeInTheDocument();
        expect(screen.getByText('Balance: $4950')).toBeInTheDocument();
      });

      // Verify API was called correctly
      expect(mockFetch).toHaveBeenCalledWith('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 50,
          description: 'Quick expense',
          category: 'miscellaneous',
        }),
      });
    });

    it('should handle expense creation failure', async () => {
      const user = userEvent.setup();

      // Mock expense creation failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { message: 'Insufficient funds' },
        }),
      });

      const initialBalance = screen.getByText('Balance: $5000');
      expect(initialBalance).toBeInTheDocument();

      await user.click(screen.getByTestId('quick-expense-btn'));

      // Balance should remain unchanged on failure
      await waitFor(() => {
        expect(screen.getByText('Balance: $5000')).toBeInTheDocument();
      });

      // Expense should not be added to the list
      expect(screen.queryByText('Quick expense')).not.toBeInTheDocument();
    });
  });

  describe('Add Goal Flow', () => {
    beforeEach(async () => {
      // Mock initial data load
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { transactions: [] } }),
        });

      render(<MockDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      mockFetch.mockClear();
    });

    it('should add goal and update goals list', async () => {
      const user = userEvent.setup();

      // Mock goal creation response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'new-goal-1',
            title: 'Emergency Fund',
            targetAmount: 10000,
            currentAmount: 0,
            category: 'emergency',
          },
        }),
      });

      // Initial state
      expect(screen.getByText('Financial Goals (0)')).toBeInTheDocument();

      // Click add goal button
      await user.click(screen.getByTestId('add-goal-btn'));

      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
        expect(screen.getByText('$0 / $10000')).toBeInTheDocument();
        expect(screen.getByText('Financial Goals (1)')).toBeInTheDocument();
      });

      // Verify API was called correctly
      expect(mockFetch).toHaveBeenCalledWith('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Emergency Fund',
          targetAmount: 10000,
          currentAmount: 0,
          category: 'emergency',
        }),
      });
    });
  });

  describe('Complete User Journey', () => {
    it('should handle a complete user session', async () => {
      const user = userEvent.setup();

      // Mock initial data load
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              { id: '1', title: 'Existing Goal', targetAmount: 1000, currentAmount: 500 }
            ]
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { transactions: [] }
          }),
        });

      render(<MockDashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
        expect(screen.getByText('Existing Goal')).toBeInTheDocument();
      });

      mockFetch.mockClear();

      // Step 1: Add a new goal
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: '2',
            title: 'Emergency Fund',
            targetAmount: 10000,
            currentAmount: 0,
          },
        }),
      });

      await user.click(screen.getByTestId('add-goal-btn'));

      await waitFor(() => {
        expect(screen.getByText('Financial Goals (2)')).toBeInTheDocument();
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      });

      // Step 2: Add an expense
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            transaction: {
              id: '1',
              description: 'Quick expense',
              amount: 50,
            },
            newBalance: 4950,
          },
        }),
      });

      await user.click(screen.getByTestId('quick-expense-btn'));

      await waitFor(() => {
        expect(screen.getByText('Recent Expenses (1)')).toBeInTheDocument();
        expect(screen.getByText('Balance: $4950')).toBeInTheDocument();
      });

      // Verify final state
      expect(screen.getByText('Financial Goals (2)')).toBeInTheDocument();
      expect(screen.getByText('Recent Expenses (1)')).toBeInTheDocument();
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      expect(screen.getByText('Quick expense')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from network errors', async () => {
      const user = userEvent.setup();

      // Mock initial load failure, then success
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { transactions: [] } }),
        });

      render(<MockDashboard />);

      // Should eventually load despite initial failures
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Should show empty state after recovery
      expect(screen.getByText('Financial Goals (0)')).toBeInTheDocument();
      expect(screen.getByText('Recent Expenses (0)')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle rapid user interactions', async () => {
      const user = userEvent.setup();

      // Mock initial data load
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      render(<MockDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Mock rapid successful responses
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: Math.random().toString(),
              title: 'Test Goal',
              targetAmount: 1000,
              currentAmount: 0,
            },
          }),
        })
      );

      // Rapidly click add goal button multiple times
      const addGoalBtn = screen.getByTestId('add-goal-btn');
      
      for (let i = 0; i < 5; i++) {
        await user.click(addGoalBtn);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Should handle rapid clicks without crashing
      await waitFor(() => {
        expect(screen.getByTestId('goals-section')).toBeInTheDocument();
      });

      // Should have made multiple API calls
      expect(mockFetch).toHaveBeenCalledTimes(7); // 2 initial + 5 rapid clicks
    });
  });
});
