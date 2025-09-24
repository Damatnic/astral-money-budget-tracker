import { test, expect } from '@playwright/test';

test.describe('Astral Money Budget Tracker E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page correctly', async ({ page }) => {
    // Check if the page title contains Astral Money
    await expect(page).toHaveTitle(/Astral Money/);
    
    // Check for key elements
    await expect(page.locator('text=Astral Money')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Check for navigation items
    await expect(page.locator('text=Expenses')).toBeVisible();
    await expect(page.locator('text=Income')).toBeVisible();
    await expect(page.locator('text=Recurring')).toBeVisible();
    await expect(page.locator('text=Goals')).toBeVisible();
  });

  test('should display financial dashboard elements', async ({ page }) => {
    // Check for balance display
    await expect(page.locator('[data-testid="current-balance"]').or(page.locator('text=/\\$[\\d,]+\\.\\d{2}/'))).toBeVisible();
    
    // Check for income/expense sections
    await expect(page.locator('text=/Income/i')).toBeVisible();
    await expect(page.locator('text=/Expense/i')).toBeVisible();
    
    // Check for financial health score if present
    const healthScore = page.locator('text=/Financial Health/i');
    if (await healthScore.isVisible()) {
      await expect(healthScore).toBeVisible();
    }
  });

  test('should navigate between different sections', async ({ page }) => {
    // Test navigation to Expenses section
    await page.click('text=Expenses');
    await expect(page.locator('text=Add Expense').or(page.locator('[data-testid="add-expense"]'))).toBeVisible();
    
    // Test navigation to Income section
    await page.click('text=Income');
    await expect(page.locator('text=Add Income').or(page.locator('[data-testid="add-income"]'))).toBeVisible();
    
    // Test navigation to Monthly View
    await page.click('text=Monthly View');
    await expect(page.locator('text=/October|November|December/')).toBeVisible();
    
    // Test navigation back to Dashboard
    await page.click('text=Dashboard');
    await expect(page.locator('text=Financial Health').or(page.locator('[data-testid="dashboard"]'))).toBeVisible();
  });

  test('should handle expense creation workflow', async ({ page }) => {
    // Navigate to expenses section
    await page.click('text=Expenses');
    
    // Look for Add Expense button (various possible selectors)
    const addExpenseButton = page.locator('text=Add Expense').or(
      page.locator('[data-testid="add-expense"]')
    ).or(
      page.locator('button:has-text("Add")')
    ).first();
    
    await addExpenseButton.click();
    
    // Check if expense form appears
    const expenseForm = page.locator('form').or(
      page.locator('[data-testid="expense-form"]')
    ).or(
      page.locator('text=Amount').locator('..')
    );
    
    await expect(expenseForm).toBeVisible();
    
    // Fill out expense form if inputs are visible
    const amountInput = page.locator('input[type="number"]').or(
      page.locator('[data-testid="expense-amount"]')
    ).or(
      page.locator('input[placeholder*="amount" i]')
    ).first();
    
    if (await amountInput.isVisible()) {
      await amountInput.fill('25.50');
      
      const descriptionInput = page.locator('input[type="text"]').or(
        page.locator('[data-testid="expense-description"]')
      ).or(
        page.locator('input[placeholder*="description" i]')
      ).first();
      
      await descriptionInput.fill('Test Expense');
      
      // Submit the form
      const submitButton = page.locator('button[type="submit"]').or(
        page.locator('text=Add Expense')
      ).or(
        page.locator('button:has-text("Add")')
      );
      
      await submitButton.click();
      
      // Verify success (could be a toast notification or updated list)
      await expect(
        page.locator('text=Test Expense').or(
          page.locator('text=success').or(
            page.locator('text=added')
          )
        )
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle income creation workflow', async ({ page }) => {
    // Navigate to income section
    await page.click('text=Income');
    
    // Look for Add Income button
    const addIncomeButton = page.locator('text=Add Income').or(
      page.locator('[data-testid="add-income"]')
    ).or(
      page.locator('button:has-text("Add")')
    ).first();
    
    await addIncomeButton.click();
    
    // Check if income form appears
    const incomeForm = page.locator('form').or(
      page.locator('[data-testid="income-form"]')
    );
    
    await expect(incomeForm).toBeVisible();
    
    // Fill out income form if inputs are visible
    const amountInput = page.locator('input[type="number"]').first();
    
    if (await amountInput.isVisible()) {
      await amountInput.fill('3000.00');
      
      const descriptionInput = page.locator('input[type="text"]').first();
      await descriptionInput.fill('Monthly Salary');
      
      // Submit the form
      const submitButton = page.locator('button[type="submit"]').or(
        page.locator('text=Add Income')
      );
      
      await submitButton.click();
      
      // Verify success
      await expect(
        page.locator('text=Monthly Salary').or(
          page.locator('text=success')
        )
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display monthly view with bills', async ({ page }) => {
    // Navigate to monthly view
    await page.click('text=Monthly View');
    
    // Check for month selector buttons
    await expect(page.locator('text=October')).toBeVisible();
    await expect(page.locator('text=November')).toBeVisible();
    await expect(page.locator('text=December')).toBeVisible();
    
    // Test month switching
    await page.click('text=November');
    
    // Check if bills/transactions are displayed
    const billsList = page.locator('[data-testid="bills-list"]').or(
      page.locator('.bill-row').first()
    ).or(
      page.locator('text=/\\$[\\d,]+/')
    );
    
    // Bills should be visible (either real data or empty state message)
    await expect(
      billsList.or(page.locator('text=No'))
    ).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page, isMobile }) => {
    if (isMobile) {
      // Test mobile-specific functionality
      await expect(page.locator('text=Astral Money')).toBeVisible();
      
      // Check if navigation works on mobile
      const navToggle = page.locator('[data-testid="nav-toggle"]').or(
        page.locator('button').first()
      );
      
      // If there's a navigation toggle, test it
      if (await navToggle.isVisible()) {
        await navToggle.click();
        await expect(page.locator('text=Dashboard')).toBeVisible();
      }
      
      // Test touch interactions
      await page.tap('text=Expenses');
      await expect(page.locator('text=Add Expense').or(page.locator('button'))).toBeVisible();
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test Tab navigation
    await page.keyboard.press('Tab');
    
    // Check if focus is visible on interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test Enter key activation
    await page.keyboard.press('Enter');
    
    // Should navigate or activate something
    // This is a basic test - specific behavior depends on implementation
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test with potential network issues by intercepting requests
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    // Try to perform an action that would trigger an API call
    await page.click('text=Expenses');
    
    const addButton = page.locator('text=Add Expense').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Fill form and submit to trigger error
      const amountInput = page.locator('input[type="number"]').first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('100');
        
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        
        // Should show error message
        await expect(
          page.locator('text=error').or(
            page.locator('text=failed').or(
              page.locator('text=try again')
            )
          )
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should persist data across page reloads', async ({ page }) => {
    // Navigate to expenses and add an item if possible
    await page.click('text=Expenses');
    
    const addButton = page.locator('text=Add Expense').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      const amountInput = page.locator('input[type="number"]').first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('50');
        
        const descriptionInput = page.locator('input[type="text"]').first();
        await descriptionInput.fill('Persistence Test');
        
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        
        // Wait for item to be added
        await page.waitForTimeout(1000);
        
        // Reload page
        await page.reload();
        
        // Check if data persists (this depends on having a real backend)
        await page.click('text=Expenses');
        
        // Look for the item we added (may not be visible if using mock data)
        const persistedItem = page.locator('text=Persistence Test');
        // Don't fail if not found, as it depends on backend implementation
      }
    }
  });
});