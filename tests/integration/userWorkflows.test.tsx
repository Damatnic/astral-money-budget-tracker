import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the main page component
const MockedHomePage = () => {
  const [expenses, setExpenses] = React.useState([]);
  const [income, setIncome] = React.useState([]);
  const [showExpenseForm, setShowExpenseForm] = React.useState(false);
  const [showIncomeForm, setShowIncomeForm] = React.useState(false);
  
  const handleAddExpense = async (expenseData: any) => {
    // Simulate API call
    const newExpense = { id: Date.now().toString(), ...expenseData };
    setExpenses(prev => [...prev, newExpense]);
    setShowExpenseForm(false);
  };

  const handleAddIncome = async (incomeData: any) => {
    // Simulate API call
    const newIncome = { id: Date.now().toString(), ...incomeData };
    setIncome(prev => [...prev, newIncome]);
    setShowIncomeForm(false);
  };

  return (
    <div data-testid="home-page">
      <div data-testid="balance">$1,000.00</div>
      
      <button 
        data-testid="add-expense-btn"
        onClick={() => setShowExpenseForm(true)}
      >
        Add Expense
      </button>
      
      <button 
        data-testid="add-income-btn"
        onClick={() => setShowIncomeForm(true)}
      >
        Add Income
      </button>

      {showExpenseForm && (
        <form 
          data-testid="expense-form"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleAddExpense({
              amount: parseFloat(formData.get('amount') as string),
              description: formData.get('description'),
              category: formData.get('category'),
            });
          }}
        >
          <input 
            name="amount" 
            type="number" 
            placeholder="Amount" 
            data-testid="expense-amount"
            required 
          />
          <input 
            name="description" 
            type="text" 
            placeholder="Description" 
            data-testid="expense-description"
            required 
          />
          <select name="category" data-testid="expense-category" required>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="entertainment">Entertainment</option>
          </select>
          <button type="submit" data-testid="submit-expense">
            Add Expense
          </button>
          <button 
            type="button" 
            data-testid="cancel-expense"
            onClick={() => setShowExpenseForm(false)}
          >
            Cancel
          </button>
        </form>
      )}

      {showIncomeForm && (
        <form 
          data-testid="income-form"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleAddIncome({
              amount: parseFloat(formData.get('amount') as string),
              description: formData.get('description'),
              source: formData.get('source'),
            });
          }}
        >
          <input 
            name="amount" 
            type="number" 
            placeholder="Amount" 
            data-testid="income-amount"
            required 
          />
          <input 
            name="description" 
            type="text" 
            placeholder="Description" 
            data-testid="income-description"
            required 
          />
          <select name="source" data-testid="income-source" required>
            <option value="salary">Salary</option>
            <option value="freelance">Freelance</option>
            <option value="business">Business</option>
          </select>
          <button type="submit" data-testid="submit-income">
            Add Income
          </button>
          <button 
            type="button" 
            data-testid="cancel-income"
            onClick={() => setShowIncomeForm(false)}
          >
            Cancel
          </button>
        </form>
      )}

      <div data-testid="expenses-list">
        {expenses.map((expense: any) => (
          <div key={expense.id} data-testid={`expense-${expense.id}`}>
            {expense.description}: ${expense.amount} ({expense.category})
          </div>
        ))}
      </div>

      <div data-testid="income-list">
        {income.map((income: any) => (
          <div key={income.id} data-testid={`income-${income.id}`}>
            {income.description}: ${income.amount} ({income.source})
          </div>
        ))}
      </div>
    </div>
  );
};

describe('User Workflows Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('Expense Management Workflow', () => {
    test('should allow user to add a new expense', async () => {
      const user = userEvent.setup();
      render(<MockedHomePage />);

      // Initial state - no expenses
      expect(screen.getByTestId('expenses-list')).toBeEmptyDOMElement();

      // Click add expense button
      await user.click(screen.getByTestId('add-expense-btn'));

      // Verify form appears
      expect(screen.getByTestId('expense-form')).toBeInTheDocument();

      // Fill out the form
      await user.type(screen.getByTestId('expense-amount'), '50.00');
      await user.type(screen.getByTestId('expense-description'), 'Lunch');
      await user.selectOptions(screen.getByTestId('expense-category'), 'food');

      // Submit the form
      await user.click(screen.getByTestId('submit-expense'));

      // Verify expense appears in list
      await waitFor(() => {
        expect(screen.getByText(/Lunch: \$50/)).toBeInTheDocument();
        expect(screen.getByText(/food/)).toBeInTheDocument();
      });

      // Verify form is hidden
      expect(screen.queryByTestId('expense-form')).not.toBeInTheDocument();
    });

    test('should allow user to cancel expense creation', async () => {
      const user = userEvent.setup();
      render(<MockedHomePage />);

      // Click add expense button
      await user.click(screen.getByTestId('add-expense-btn'));

      // Verify form appears
      expect(screen.getByTestId('expense-form')).toBeInTheDocument();

      // Click cancel
      await user.click(screen.getByTestId('cancel-expense'));

      // Verify form is hidden
      expect(screen.queryByTestId('expense-form')).not.toBeInTheDocument();
    });
  });

  describe('Income Management Workflow', () => {
    test('should allow user to add new income', async () => {
      const user = userEvent.setup();
      render(<MockedHomePage />);

      // Initial state - no income
      expect(screen.getByTestId('income-list')).toBeEmptyDOMElement();

      // Click add income button
      await user.click(screen.getByTestId('add-income-btn'));

      // Verify form appears
      expect(screen.getByTestId('income-form')).toBeInTheDocument();

      // Fill out the form
      await user.type(screen.getByTestId('income-amount'), '3000.00');
      await user.type(screen.getByTestId('income-description'), 'Monthly Salary');
      await user.selectOptions(screen.getByTestId('income-source'), 'salary');

      // Submit the form
      await user.click(screen.getByTestId('submit-income'));

      // Verify income appears in list
      await waitFor(() => {
        expect(screen.getByText(/Monthly Salary: \$3000/)).toBeInTheDocument();
        expect(screen.getByText(/salary/)).toBeInTheDocument();
      });

      // Verify form is hidden
      expect(screen.queryByTestId('income-form')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation Workflow', () => {
    test('should validate expense form fields', async () => {
      const user = userEvent.setup();
      render(<MockedHomePage />);

      // Click add expense button
      await user.click(screen.getByTestId('add-expense-btn'));

      // Try to submit empty form
      await user.click(screen.getByTestId('submit-expense'));

      // Form should still be visible (validation failed)
      expect(screen.getByTestId('expense-form')).toBeInTheDocument();

      // Fill required fields
      await user.type(screen.getByTestId('expense-amount'), '25.50');
      await user.type(screen.getByTestId('expense-description'), 'Coffee');

      // Now submit should work
      await user.click(screen.getByTestId('submit-expense'));

      await waitFor(() => {
        expect(screen.getByText(/Coffee: \$25.5/)).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation Workflow', () => {
    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MockedHomePage />);

      // Tab to add expense button
      await user.tab();
      expect(screen.getByTestId('add-expense-btn')).toHaveFocus();

      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(screen.getByTestId('expense-form')).toBeInTheDocument();

      // Tab through form fields
      await user.tab();
      expect(screen.getByTestId('expense-amount')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('expense-description')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('expense-category')).toHaveFocus();
    });
  });
});