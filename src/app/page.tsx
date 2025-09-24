'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Types
interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  createdAt?: string;
  type?: 'income' | 'expense';
}

interface Goal {
  id: string;
  icon: string;
  name: string;
  current: number;
  target: number;
  targetDate: string;
  type: 'savings' | 'debt';
}

interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  startDate: string;
  endDate?: string;
  isActive?: boolean;
}

interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface LoadingState {
  userData: boolean;
  expenses: boolean;
  income: boolean;
  recurringBills: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

interface ErrorState {
  userData: string | null;
  expenses: string | null;
  income: string | null;
  recurringBills: string | null;
  form: string | null;
}

// Loading Spinner Component
function LoadingSpinner({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}></div>
  );
}

// Toast Notification Component
function Toast({ notification, onClose }: { notification: Notification; onClose: () => void }) {
  const typeStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg max-w-sm transform transition-all duration-300 ${typeStyles[notification.type]}`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{notification.title}</h4>
          <p className="text-sm mt-1">{notification.message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function Home() {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [currentMonth, setCurrentMonth] = useState('october');
  const [userBalance, setUserBalance] = useState(11.29);
  const [bills, setBills] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([
    {
      id: 'emergency_fund',
      icon: '🚨',
      name: 'Emergency Fund',
      current: 11.29,
      target: 10000,
      targetDate: '2025-12-31',
      type: 'savings'
    },
    {
      id: 'debt_payoff',
      icon: '💳',
      name: 'Debt Payoff',
      current: 1500,
      target: 5000,
      targetDate: '2025-06-30',
      type: 'debt'
    },
    {
      id: 'vacation_fund',
      icon: '✈️',
      name: 'Vacation Fund',
      current: 750,
      target: 3000,
      targetDate: '2025-07-01',
      type: 'savings'
    }
  ]);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0]
  });
  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    description: '',
    source: 'salary',
    date: new Date().toISOString().split('T')[0]
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recurringBills, setRecurringBills] = useState<any[]>([]);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recurringForm, setRecurringForm] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    category: 'utilities',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    dateRange: 'all',
    amountRange: 'all',
    type: 'all' // all, expense, income
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [editingRecurringBill, setEditingRecurringBill] = useState<any>(null);
  const [selectedBillForHistory, setSelectedBillForHistory] = useState<any>(null);
  const [showBillHistoryModal, setShowBillHistoryModal] = useState(false);
  const [billHistoryForm, setBillHistoryForm] = useState({
    actualAmount: '',
    estimatedAmount: '',
    billDate: new Date().toISOString().split('T')[0],
    isPaid: false,
    notes: ''
  });
  // Loading and Error States
  const [loading, setLoading] = useState<LoadingState>({
    userData: false,
    expenses: false,
    income: false,
    recurringBills: false,
    creating: false,
    updating: false,
    deleting: false
  });
  const [errors, setErrors] = useState<ErrorState>({
    userData: null,
    expenses: null,
    income: null,
    recurringBills: null,
    form: null
  });
  const [toasts, setToasts] = useState<Notification[]>([]);
  
  // App Settings and Preferences
  const [settings, setSettings] = useState({
    theme: 'light',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    notifications: {
      lowBalance: true,
      billReminders: true,
      goalProgress: true,
      spendingAlerts: true
    },
    budgetLimits: {
      food: 500,
      entertainment: 200,
      utilities: 300,
      transportation: 150,
      shopping: 100,
      healthcare: 200,
      other: 150
    },
    onboardingCompleted: false
  });
  
  // Performance optimization refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  
  const [state, setState] = useState({
    startBalance: 11.29,
    paycheckAmount: 2143.73,
    paycheckFreq: 'biweekly',
    currency: 'USD',
    currentMonth: 'october',
    checkedBills: new Set(),
    totalIncome: 6431.92,
    totalExpenses: 9421.00,
    netFlow: -2989.08,
    healthScore: 25,
  });
  
  // Advanced features state
  const [showOnboarding, setShowOnboarding] = useState(!settings.onboardingCompleted);
  const [showSettings, setShowSettings] = useState(false);
  const [showBudgetPlanner, setShowBudgetPlanner] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // Financial insights and AI recommendations
  const [financialInsights, setFinancialInsights] = useState<any[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<any[]>([]);

  // Performance optimized data fetching
  const fetchUserData = useCallback(async () => {
    setLoading(prev => ({ ...prev, userData: true }));
    setErrors(prev => ({ ...prev, userData: null }));
    
    try {
      const response = await fetch('/api/user/balance');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (data.balance !== undefined) {
        setUserBalance(data.balance);
        setState(prev => ({ ...prev, startBalance: data.balance }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({ ...prev, userData: errorMessage }));
      showToast('error', 'Failed to load balance', errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, userData: false }));
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(prev => ({ ...prev, expenses: true }));
    setErrors(prev => ({ ...prev, expenses: null }));
    
    try {
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (data.expenses) {
        setExpenses(data.expenses);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({ ...prev, expenses: errorMessage }));
      showToast('error', 'Failed to load expenses', errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, expenses: false }));
    }
  }, []);

  const fetchIncome = useCallback(async () => {
    setLoading(prev => ({ ...prev, income: true }));
    setErrors(prev => ({ ...prev, income: null }));
    
    try {
      const response = await fetch('/api/income');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (data.income) {
        setIncome(data.income);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({ ...prev, income: errorMessage }));
      showToast('error', 'Failed to load income', errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, income: false }));
    }
  }, []);

  const fetchRecurringBills = useCallback(async () => {
    setLoading(prev => ({ ...prev, recurringBills: true }));
    setErrors(prev => ({ ...prev, recurringBills: null }));
    
    try {
      const response = await fetch('/api/recurring');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (data.recurring) {
        setRecurringBills(data.recurring);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({ ...prev, recurringBills: errorMessage }));
      showToast('error', 'Failed to load recurring bills', errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, recurringBills: false }));
    }
  }, []);

  // Toast notification system
  const showToast = useCallback((type: Notification['type'], title: string, message: string, priority: Notification['priority'] = 'medium') => {
    const toast: Notification = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      priority
    };
    setToasts(prev => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast('success', 'Back Online', 'Internet connection restored');
      // Re-fetch data when back online
      fetchUserData();
      fetchExpenses();
      fetchIncome();
      fetchRecurringBills();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      showToast('warning', 'Offline Mode', 'Some features may be limited');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchUserData, fetchExpenses, fetchIncome, fetchRecurringBills, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'k': // Search
            event.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 'n': // New expense
            event.preventDefault();
            setShowExpenseForm(true);
            break;
          case 'i': // New income
            event.preventDefault();
            setShowIncomeForm(true);
            break;
          case 'b': // New bill
            event.preventDefault();
            setShowRecurringForm(true);
            break;
          case 's': // Settings
            event.preventDefault();
            setShowSettings(true);
            break;
          case '?': // Help
            event.preventDefault();
            setShowHelpModal(true);
            break;
        }
      }
      
      // ESC to close modals
      if (event.key === 'Escape') {
        setShowExpenseForm(false);
        setShowIncomeForm(false);
        setShowRecurringForm(false);
        setShowSettings(false);
        setShowHelpModal(false);
        setShowDataExport(false);
        setActiveTooltip(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchUserData();
    fetchExpenses();
    fetchIncome();
    fetchRecurringBills();
  }, [fetchUserData, fetchExpenses, fetchIncome, fetchRecurringBills]);

  // Enhanced data processing with memoization
  const processedExpenses = useMemo(() => {
    return expenses.map(expense => ({
      ...expense,
      amount: typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount,
      date: new Date(expense.date || expense.createdAt)
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenses]);

  const processedIncome = useMemo(() => {
    return income.map(inc => ({
      ...inc,
      amount: typeof inc.amount === 'string' ? parseFloat(inc.amount) : inc.amount,
      date: new Date(inc.date || inc.createdAt)
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [income]);

  // Advanced filtering with performance optimization
  const filteredTransactions = useMemo(() => {
    const allTransactions = [
      ...processedExpenses.map(exp => ({ ...exp, type: 'expense' as const })),
      ...processedIncome.map(inc => ({ ...inc, type: 'income' as const }))
    ];

    return allTransactions.filter(transaction => {
      // Search filter
      if (searchTerm && !transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && transaction.category !== filters.category) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const transactionDate = transaction.date;
        let cutoffDate = new Date();

        switch (filters.dateRange) {
          case 'today':
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            cutoffDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        if (transactionDate < cutoffDate) {
          return false;
        }
      }

      // Amount range filter
      if (filters.amountRange !== 'all') {
        const amount = transaction.amount;
        switch (filters.amountRange) {
          case 'small':
            if (amount >= 50) return false;
            break;
          case 'medium':
            if (amount < 50 || amount >= 200) return false;
            break;
          case 'large':
            if (amount < 200) return false;
            break;
        }
      }

      return true;
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [processedExpenses, processedIncome, searchTerm, filters]);

  // Financial insights generation
  const generateFinancialInsights = useCallback(() => {
    const insights = [];
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Recent spending analysis
    const recentExpenses = processedExpenses.filter(exp => exp.date >= last30Days);
    const recentIncome = processedIncome.filter(inc => inc.date >= last30Days);
    
    const totalExpenses = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = recentIncome.reduce((sum, inc) => sum + inc.amount, 0);
    const avgDailySpending = totalExpenses / 30;
    
    // Category analysis
    const categorySpending = recentExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categorySpending).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    if (topCategory) {
      insights.push({
        type: 'spending',
        title: 'Top Spending Category',
        message: `You spent $${(topCategory[1] as number).toFixed(2)} on ${topCategory[0]} this month`,
        icon: '📊',
        actionable: true
      });
    }
    
    // Savings rate
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
      insights.push({
        type: savingsRate >= 20 ? 'positive' : 'warning',
        title: 'Savings Rate',
        message: `You're saving ${savingsRate.toFixed(1)}% of your income ${savingsRate >= 20 ? '🎉' : '📈'}`,
        icon: savingsRate >= 20 ? '💚' : '⚠️',
        actionable: savingsRate < 20
      });
    }
    
    // Spending trend
    const last7Days = recentExpenses.filter(exp => exp.date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    const weeklySpending = last7Days.reduce((sum, exp) => sum + exp.amount, 0);
    const projectedMonthly = (weeklySpending / 7) * 30;
    
    if (projectedMonthly > totalExpenses * 1.2) {
      insights.push({
        type: 'warning',
        title: 'Spending Acceleration',
        message: `Your recent spending pace suggests ${formatCurrency(projectedMonthly)} monthly total`,
        icon: '🚨',
        actionable: true
      });
    }
    
    setFinancialInsights(insights);
  }, [processedExpenses, processedIncome]);

  // Budget limit checking
  const checkBudgetLimits = useCallback(() => {
    const alerts = [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyExpenses = processedExpenses.filter(exp => exp.date >= monthStart);
    
    const categorySpending = monthlyExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(settings.budgetLimits).forEach(([category, limit]) => {
      const spent = categorySpending[category] || 0;
      const percentage = (spent / limit) * 100;
      
      if (percentage >= 90) {
        alerts.push({
          category,
          spent,
          limit,
          percentage,
          type: percentage >= 100 ? 'exceeded' : 'warning',
          message: percentage >= 100 
            ? `Budget exceeded by ${formatCurrency(spent - limit)}`
            : `${(100 - percentage).toFixed(0)}% budget remaining`
        });
      }
    });
    
    setBudgetAlerts(alerts);
  }, [processedExpenses, settings.budgetLimits]);

  // Enhanced financial calculations
  const calculateFinancialHealth = useCallback(() => {
    const totalExpenses = processedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = processedIncome.reduce((sum, inc) => sum + inc.amount, 0);
    
    let score = 50; // Base score
    
    // Income vs Expenses (30 points)
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
      if (savingsRate >= 20) score += 30;
      else if (savingsRate >= 10) score += 20;
      else if (savingsRate >= 0) score += 10;
      else score -= 20; // Spending more than earning
    }
    
    // Emergency fund (25 points)
    const monthlyExpenses = totalExpenses / 3; // Rough monthly estimate
    const emergencyFundRatio = userBalance / (monthlyExpenses * 3);
    if (emergencyFundRatio >= 1) score += 25;
    else if (emergencyFundRatio >= 0.5) score += 15;
    else if (emergencyFundRatio >= 0.25) score += 5;
    else score -= 10;
    
    // Budget adherence (20 points)
    const budgetScore = budgetAlerts.length === 0 ? 20 : Math.max(0, 20 - budgetAlerts.length * 5);
    score += budgetScore;
    
    // Goal progress (15 points)
    const goalProgress = goals.reduce((sum, goal) => sum + (goal.current / goal.target), 0) / goals.length;
    score += Math.min(15, goalProgress * 15);
    
    // Regular saving habits (10 points)
    const recentSavings = processedIncome.slice(0, 5).length - processedExpenses.slice(0, 5).length;
    if (recentSavings > 0) score += 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [processedExpenses, processedIncome, userBalance, budgetAlerts, goals]);

  // Update KPIs
  const updateKPIs = useCallback(() => {
    const totalIncome = processedIncome.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpenses = processedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netFlow = totalIncome - totalExpenses;
    const healthScore = calculateFinancialHealth();
    
    setState(prev => ({
      ...prev,
      totalIncome,
      totalExpenses,
      netFlow,
      healthScore
    }));
  }, [processedIncome, processedExpenses, calculateFinancialHealth]);

  // Generate AI-powered recommendations
  const generateAIRecommendations = useCallback(() => {
    const recommendations = [];
    const healthScore = calculateFinancialHealth();
    
    // Category spending analysis
    const categoryTotals = processedExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topSpendingCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    if (topSpendingCategory && (topSpendingCategory[1] as number) > settings.budgetLimits[topSpendingCategory[0]]) {
      recommendations.push({
        type: 'budget',
        priority: 'high',
        title: `Reduce ${topSpendingCategory[0]} spending`,
        description: `You've spent $${(topSpendingCategory[1] as number).toFixed(2)} on ${topSpendingCategory[0]}, which exceeds your budget.`,
        action: 'Set spending alerts or find alternatives'
      });
    }
    
    // Savings recommendations
    if (healthScore < 60) {
      recommendations.push({
        type: 'savings',
        priority: 'high',
        title: 'Improve your financial health',
        description: `Your financial health score is ${healthScore}/100. Focus on building emergency fund and reducing expenses.`,
        action: 'Review your biggest expenses and look for savings opportunities'
      });
    }
    
    // Goal recommendations
    goals.forEach(goal => {
      const progress = (goal.current / goal.target) * 100;
      if (progress < 25 && new Date(goal.targetDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) {
        recommendations.push({
          type: 'goal',
          priority: 'medium',
          title: `Accelerate ${goal.name} progress`,
          description: `You're at ${progress.toFixed(1)}% of your ${goal.name} goal with deadline approaching.`,
          action: 'Consider increasing monthly contributions'
        });
      }
    });
    
    setAiRecommendations(recommendations);
  }, [calculateFinancialHealth, processedExpenses, settings.budgetLimits, goals]);

  // Update KPIs and notifications when data changes
  useEffect(() => {
    updateKPIs();
    generateNotifications();
    generateFinancialInsights();
    generateAIRecommendations();
    checkBudgetLimits();
  }, [userBalance, expenses, income, settings.budgetLimits, updateKPIs, generateFinancialInsights, generateAIRecommendations, checkBudgetLimits]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showNotifications && !target.closest('[data-notifications]')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const generateNotifications = () => {
    const newNotifications = [];
    const now = new Date();

    // Advanced financial calculations
    const last30DaysExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date || expense.createdAt);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return expenseDate >= thirtyDaysAgo;
    });

    const last30DaysIncome = income.filter(incomeItem => {
      const incomeDate = new Date(incomeItem.date || incomeItem.createdAt);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return incomeDate >= thirtyDaysAgo;
    });

    const monthlyExpenses = last30DaysExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthlyIncome = last30DaysIncome.reduce((sum, incomeItem) => sum + incomeItem.amount, 0);
    const avgDailySpending = monthlyExpenses / 30;
    const emergencyFundTarget = monthlyExpenses * 3;

    const upcomingBillTotal = calculateUpcomingBills(recurringBills);

    // CRITICAL ALERTS (High Priority)
    
    // Critical balance level
    if (userBalance < avgDailySpending * 7) {
      newNotifications.push({
        id: 'critical_balance',
        type: 'error',
        title: '🚨 Critical Balance Alert',
        message: `Only ${Math.floor(userBalance / avgDailySpending)} days of spending left at current rate`,
        timestamp: now,
        priority: 'critical'
      });
    }

    // Upcoming bill strain
    if (upcomingBillTotal > userBalance * 0.8) {
      newNotifications.push({
        id: 'bill_strain',
        type: 'error',
        title: '📅 Upcoming Bills Warning',
        message: `${formatCurrency(upcomingBillTotal)} in bills will strain your ${formatCurrency(userBalance)} balance`,
        timestamp: now,
        priority: 'critical'
      });
    }

    // Negative cash flow alert
    if (monthlyExpenses > monthlyIncome && monthlyIncome > 0) {
      const deficit = monthlyExpenses - monthlyIncome;
      newNotifications.push({
        id: 'negative_cashflow',
        type: 'error',
        title: '🔥 Negative Cash Flow',
        message: `Spending ${formatCurrency(deficit)} more than earning - immediate action required`,
        timestamp: now,
        priority: 'critical'
      });
    }

    // HIGH PRIORITY ALERTS

    // Balance vs Emergency Fund
    if (userBalance < emergencyFundTarget * 0.3) {
      newNotifications.push({
        id: 'emergency_fund_low',
        type: 'warning',
        title: '⚠️ Emergency Fund Critical',
        message: `Need ${formatCurrency(emergencyFundTarget - userBalance)} more for 3-month emergency fund`,
        timestamp: now,
        priority: 'high'
      });
    }

    // Predictive spending alerts - High spending weeks ahead
    const last7DaysExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date || expense.createdAt);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return expenseDate >= sevenDaysAgo;
    });

    const weeklySpending = last7DaysExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const avgWeeklySpending = monthlyExpenses / 4.33;
    
    if (weeklySpending > avgWeeklySpending * 1.5) {
      newNotifications.push({
        id: 'high_spending_week',
        type: 'warning',
        title: '📈 High Spending Period',
        message: `This week's ${formatCurrency(weeklySpending)} is 50% above average - consider slowing down`,
        timestamp: now,
        priority: 'high'
      });
    }

    // Debt avalanche alert for high categories
    if (expenses.length > 0) {
      const categoryTotals = expenses.reduce((acc, expense) => {
        const category = expense.category || 'other';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      const sortedCategories = Object.entries(categoryTotals).sort(([,a], [,b]) => (b as number) - (a as number));
      const topCategory = sortedCategories[0];
      
      if (topCategory && monthlyIncome > 0 && (topCategory[1] as number) > monthlyIncome * 0.4) {
        newNotifications.push({
          id: 'category_dominance',
          type: 'warning',
          title: '⚡ Category Alert',
          message: `${topCategory[0]} consumes ${(((topCategory[1] as number)/monthlyIncome)*100).toFixed(0)}% of income - focus reduction here`,
          timestamp: now,
          priority: 'high'
        });
      }
    }

    // MEDIUM PRIORITY ALERTS

    // Balance runway prediction
    if (avgDailySpending > 0 && userBalance / avgDailySpending < 30) {
      const daysLeft = Math.floor(userBalance / avgDailySpending);
      newNotifications.push({
        id: 'balance_runway',
        type: 'warning',
        title: '⏰ Balance Runway',
        message: `Current balance will last ${daysLeft} days at current spending rate`,
        timestamp: now,
        priority: 'medium'
      });
    }

    // Savings rate optimization
    if (monthlyIncome > 0 && monthlyExpenses > 0) {
      const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
      if (savingsRate < 10 && savingsRate > 0) {
        newNotifications.push({
          id: 'low_savings_rate',
          type: 'info',
          title: '📊 Savings Rate Alert',
          message: `${savingsRate.toFixed(1)}% savings rate is below recommended 10-20% target`,
          timestamp: now,
          priority: 'medium'
        });
      }
    }

    // Income diversification alert
    if (income.length > 0) {
      const incomeSources = income.reduce((acc, inc) => {
        acc[inc.category] = (acc[inc.category] || 0) + inc.amount;
        return acc;
      }, {} as Record<string, number>);
      
      if (Object.keys(incomeSources).length === 1) {
        newNotifications.push({
          id: 'income_diversification',
          type: 'info',
          title: '🌐 Income Diversification',
          message: 'Single income source detected - consider adding backup income streams',
          timestamp: now,
          priority: 'medium'
        });
      }
    }

    // LOW PRIORITY / POSITIVE ALERTS

    // Emergency fund progress
    if (userBalance >= emergencyFundTarget * 0.5 && userBalance < emergencyFundTarget) {
      const progress = (userBalance / emergencyFundTarget * 100).toFixed(0);
      newNotifications.push({
        id: 'emergency_progress',
        type: 'success',
        title: '🎯 Emergency Fund Progress',
        message: `${progress}% towards 3-month emergency fund goal - keep going!`,
        timestamp: now,
        priority: 'low'
      });
    }

    // Excellent financial health
    if (monthlyIncome > monthlyExpenses && userBalance > emergencyFundTarget && monthlyIncome > 0) {
      const surplus = monthlyIncome - monthlyExpenses;
      const surplusBalance = userBalance - emergencyFundTarget;
      newNotifications.push({
        id: 'financial_health',
        type: 'success',
        title: '🏆 Excellent Financial Health',
        message: `Emergency fund complete + ${formatCurrency(surplus)}/mo surplus. Consider investment opportunities!`,
        timestamp: now,
        priority: 'low'
      });
    }

    // Good savings rate celebration
    if (monthlyIncome > 0 && monthlyExpenses > 0) {
      const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
      if (savingsRate >= 20) {
        newNotifications.push({
          id: 'excellent_savings',
          type: 'success',
          title: '💪 Outstanding Savings Rate',
          message: `${savingsRate.toFixed(1)}% savings rate exceeds recommendations - you're crushing it!`,
          timestamp: now,
          priority: 'low'
        });
      }
    }

    // Weekly spending on track
    if (weeklySpending > 0 && weeklySpending <= avgWeeklySpending * 0.8) {
      newNotifications.push({
        id: 'controlled_spending',
        type: 'success',
        title: '✅ Controlled Spending',
        message: `This week's spending is 20% below average - excellent self-control!`,
        timestamp: now,
        priority: 'low'
      });
    }

    // Sort notifications by priority for display
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    newNotifications.sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 3));

    setNotifications(newNotifications);
  };

  const exportData = (format: 'csv' | 'json') => {
    const data = {
      balance: userBalance,
      expenses: expenses.map(expense => ({
        date: expense.date || expense.createdAt,
        description: expense.description,
        amount: expense.amount,
        category: expense.category
      })),
      income: income.map(incomeItem => ({
        date: incomeItem.date || incomeItem.createdAt,
        description: incomeItem.description,
        amount: incomeItem.amount,
        source: incomeItem.category
      })),
      exportDate: new Date().toISOString()
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `astral-money-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Create CSV for transactions
      const allTransactions = [
        ...expenses.map(expense => ({
          date: expense.date || expense.createdAt,
          type: 'Expense',
          description: expense.description,
          category: expense.category,
          amount: -expense.amount // Negative for expenses
        })),
        ...income.map(incomeItem => ({
          date: incomeItem.date || incomeItem.createdAt,
          type: 'Income',
          description: incomeItem.description,
          category: incomeItem.category,
          amount: incomeItem.amount
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const csvHeaders = 'Date,Type,Description,Category,Amount\n';
      const csvRows = allTransactions.map(transaction => 
        `${new Date(transaction.date).toLocaleDateString()},${transaction.type},"${transaction.description}",${transaction.category},${transaction.amount}`
      ).join('\n');
      
      const csvContent = csvHeaders + csvRows;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `astral-money-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };


  // Enhanced form submission with loading states and validation
  const handleExpenseSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      setErrors(prev => ({ ...prev, form: 'Please enter a valid amount' }));
      return;
    }
    
    if (!expenseForm.description.trim()) {
      setErrors(prev => ({ ...prev, form: 'Please enter a description' }));
      return;
    }
    
    setErrors(prev => ({ ...prev, form: null }));
    setLoading(prev => ({ ...prev, creating: true }));
    
    try {
      const isEditing = editingExpense !== null;
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? JSON.stringify({
            id: editingExpense.id,
            amount: parseFloat(expenseForm.amount),
            description: expenseForm.description.trim(),
            category: expenseForm.category,
            date: expenseForm.date,
          })
        : JSON.stringify({
            amount: parseFloat(expenseForm.amount),
            description: expenseForm.description.trim(),
            category: expenseForm.category,
            date: expenseForm.date,
          });

      const response = await fetch('/api/expenses', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (isEditing) {
        setExpenses(prev => prev.map(exp => 
          exp.id === editingExpense.id ? data.expense : exp
        ));
        setEditingExpense(null);
        showToast('success', 'Expense Updated', 'Your expense has been updated successfully');
      } else {
        setExpenses(prev => [data.expense, ...prev]);
        showToast('success', 'Expense Added', `Added ${formatCurrency(parseFloat(expenseForm.amount))} expense`);
      }
      
      if (data.newBalance !== undefined) {
        setUserBalance(data.newBalance);
      }
      
      setExpenseForm({
        amount: '',
        description: '',
        category: 'food',
        date: new Date().toISOString().split('T')[0]
      });
      setShowExpenseForm(false);
      fetchUserData(); // Refresh balance
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({ ...prev, form: `Failed to ${editingExpense ? 'update' : 'add'} expense: ${errorMessage}` }));
      showToast('error', 'Error', `Failed to ${editingExpense ? 'update' : 'add'} expense`);
    } finally {
      setLoading(prev => ({ ...prev, creating: false }));
    }
  }, [expenseForm, editingExpense, showToast, fetchUserData]);

  const markBillAsPaid = async (bill: any) => {
    if (!confirm(`Mark ${bill.name} as paid for ${formatCurrency(bill.amount)}?`)) {
      return;
    }

    try {
      // Create an expense entry for the bill payment
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: bill.amount,
          description: `${bill.name} - Recurring Bill Payment`,
          category: bill.category,
          date: new Date().toISOString().split('T')[0],
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setExpenses(prev => [data.expense, ...prev]);
        if (data.newBalance !== undefined) {
          setUserBalance(data.newBalance);
        }
        fetchUserData(); // Refresh balance
        alert(`✅ ${bill.name} marked as paid! Added ${formatCurrency(bill.amount)} expense.`);
      } else {
        alert(data.error || 'Failed to mark bill as paid');
      }
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      alert('Failed to mark bill as paid');
    }
  };

  const deleteRecurringBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this recurring bill? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/recurring', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: billId }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setRecurringBills(prev => prev.filter(bill => bill.id !== billId));
        alert('✅ Recurring bill deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete recurring bill');
      }
    } catch (error) {
      console.error('Error deleting recurring bill:', error);
      alert('Failed to delete recurring bill');
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const response = await fetch('/api/expenses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: expenseId }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
        if (data.newBalance !== undefined) {
          setUserBalance(data.newBalance);
        }
        fetchUserData(); // Refresh balance
      } else {
        alert(data.error || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const deleteIncome = async (incomeId: string) => {
    if (!confirm('Are you sure you want to delete this income entry?')) {
      return;
    }

    try {
      const response = await fetch('/api/income', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: incomeId }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setIncome(prev => prev.filter(inc => inc.id !== incomeId));
        if (data.newBalance !== undefined) {
          setUserBalance(data.newBalance);
        }
        fetchUserData(); // Refresh balance
      } else {
        alert(data.error || 'Failed to delete income');
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      alert('Failed to delete income');
    }
  };

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = editingIncome !== null;
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? JSON.stringify({
            id: editingIncome.id,
            amount: parseFloat(incomeForm.amount),
            description: incomeForm.description,
            source: incomeForm.source,
            date: incomeForm.date,
          })
        : JSON.stringify({
            amount: parseFloat(incomeForm.amount),
            description: incomeForm.description,
            source: incomeForm.source,
            date: incomeForm.date,
          });

      const response = await fetch('/api/income', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });
      
      const data = await response.json();
      if (response.ok) {
        if (isEditing) {
          setIncome(prev => prev.map(inc => 
            inc.id === editingIncome.id ? data.income : inc
          ));
          setEditingIncome(null);
        } else {
          setIncome(prev => [data.income, ...prev]);
        }
        
        if (data.newBalance !== undefined) {
          setUserBalance(data.newBalance);
        }
        setIncomeForm({
          amount: '',
          description: '',
          source: 'salary',
          date: new Date().toISOString().split('T')[0]
        });
        setShowIncomeForm(false);
        fetchUserData(); // Refresh balance
      } else {
        alert(data.error || `Failed to ${isEditing ? 'update' : 'add'} income`);
      }
    } catch (error) {
      console.error(`Error ${editingIncome ? 'updating' : 'adding'} income:`, error);
      alert(`Failed to ${editingIncome ? 'update' : 'add'} income`);
    }
  };

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = editingRecurringBill !== null;
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? JSON.stringify({
            id: editingRecurringBill.id,
            name: recurringForm.name,
            amount: parseFloat(recurringForm.amount),
            frequency: recurringForm.frequency,
            category: recurringForm.category,
            startDate: recurringForm.startDate,
            endDate: recurringForm.endDate || null,
          })
        : JSON.stringify({
            name: recurringForm.name,
            amount: parseFloat(recurringForm.amount),
            frequency: recurringForm.frequency,
            category: recurringForm.category,
            startDate: recurringForm.startDate,
            endDate: recurringForm.endDate || null,
          });

      const response = await fetch('/api/recurring', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });
      
      const data = await response.json();
      if (response.ok) {
        if (isEditing) {
          setRecurringBills(prev => prev.map(bill => 
            bill.id === editingRecurringBill.id ? data.recurring : bill
          ));
          setEditingRecurringBill(null);
        } else {
          setRecurringBills(prev => [data.recurring, ...prev]);
        }
        
        setRecurringForm({
          name: '',
          amount: '',
          frequency: 'monthly',
          category: 'utilities',
          startDate: new Date().toISOString().split('T')[0],
          endDate: ''
        });
        setShowRecurringForm(false);
        fetchRecurringBills(); // Refresh list
      } else {
        alert(data.error || `Failed to ${isEditing ? 'update' : 'add'} recurring bill`);
      }
    } catch (error) {
      console.error(`Error ${editingRecurringBill ? 'updating' : 'adding'} recurring bill:`, error);
      alert(`Failed to ${editingRecurringBill ? 'update' : 'add'} recurring bill`);
    }
  };

  const toggleRecurringBill = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/recurring', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      
      if (response.ok) {
        fetchRecurringBills(); // Refresh list
      }
    } catch (error) {
      console.error('Error toggling recurring bill:', error);
    }
  };

  // Calculate accurate upcoming bills for next N days
  const calculateUpcomingBills = (bills: any[], daysAhead = 30) => {
    const now = new Date();
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    let total = 0;
    
    bills.filter(bill => bill.isActive).forEach(bill => {
      const startDate = new Date(bill.startDate || bill.createdAt || now);
      const currentDate = new Date(Math.max(startDate.getTime(), now.getTime()));
      
      while (currentDate <= endDate) {
        let nextDate: Date;
        
        switch (bill.frequency) {
          case 'weekly':
            nextDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'biweekly':
            nextDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            nextDate = new Date(currentDate);
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate = new Date(currentDate);
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDate = new Date(currentDate);
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
          default:
            return; // Skip unknown frequencies
        }
        
        if (currentDate >= now && currentDate <= endDate) {
          total += bill.amount;
        }
        
        currentDate.setTime(nextDate.getTime());
        
        // Prevent infinite loops
        if (nextDate <= currentDate) break;
      }
    });
    
    return total;
  };

  const filterTransactions = (transactions: any[], type: 'expense' | 'income' | 'all' = 'all') => {
    return transactions.filter(transaction => {
      // Search term filter
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (filters.category !== 'all' && transaction.category !== filters.category) {
        return false;
      }
      
      // Type filter
      if (filters.type !== 'all') {
        if (filters.type === 'expense' && type !== 'expense') return false;
        if (filters.type === 'income' && type !== 'income') return false;
      }
      
      // Date range filter
      if (filters.dateRange !== 'all') {
        const transactionDate = new Date(transaction.date || transaction.createdAt);
        const now = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            if (transactionDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (transactionDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (transactionDate < monthAgo) return false;
            break;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            if (transactionDate < yearAgo) return false;
            break;
        }
      }
      
      // Amount range filter
      if (filters.amountRange !== 'all') {
        const amount = transaction.amount;
        switch (filters.amountRange) {
          case 'under50':
            if (amount >= 50) return false;
            break;
          case '50to100':
            if (amount < 50 || amount >= 100) return false;
            break;
          case '100to500':
            if (amount < 100 || amount >= 500) return false;
            break;
          case 'over500':
            if (amount < 500) return false;
            break;
        }
      }
      
      return true;
    });
  };

  const getFilteredExpenses = () => filterTransactions(expenses, 'expense');
  const getFilteredIncome = () => filterTransactions(income, 'income');
  const getFilteredRecurring = () => {
    return recurringBills.filter(bill => {
      if (searchTerm && !bill.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filters.category !== 'all' && bill.category !== filters.category) {
        return false;
      }
      return true;
    });
  };


  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currency,
    }).format(amount);
  }, [settings.currency]);

  // Advanced data export with multiple formats
  const exportDataAdvanced = useCallback(async (format: 'csv' | 'json' | 'pdf' | 'excel') => {
    const data = {
      transactions: filteredTransactions,
      summary: {
        totalIncome: processedIncome.reduce((sum, inc) => sum + inc.amount, 0),
        totalExpenses: processedExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        currentBalance: userBalance,
        generatedAt: new Date().toISOString(),
        dateRange: filters.dateRange,
        categoryFilter: filters.category
      },
      budgetAnalysis: budgetAlerts,
      financialInsights,
      goals,
      recurringBills
    };

    switch (format) {
      case 'json':
        const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadFile(jsonBlob, `astral-money-export-${new Date().toISOString().split('T')[0]}.json`);
        showToast('success', 'Export Complete', 'JSON export downloaded successfully');
        break;
        
      case 'csv':
        const csvHeaders = 'Date,Type,Description,Category,Amount\\n';
        const csvRows = filteredTransactions.map(t => 
          `${t.date.toISOString().split('T')[0]},${t.type},"${t.description?.replace(/"/g, '""')}",${t.category},${t.amount}`
        ).join('\\n');
        const csvBlob = new Blob([csvHeaders + csvRows], { type: 'text/csv' });
        downloadFile(csvBlob, `astral-money-transactions-${new Date().toISOString().split('T')[0]}.csv`);
        showToast('success', 'Export Complete', 'CSV export downloaded successfully');
        break;
        
      case 'pdf':
        showToast('info', 'PDF Export', 'PDF export feature coming soon! Use JSON or CSV for now.');
        break;
        
      case 'excel':
        showToast('info', 'Excel Export', 'Excel export feature coming soon! Use CSV for now.');
        break;
    }
  }, [filteredTransactions, processedIncome, processedExpenses, userBalance, filters, budgetAlerts, financialInsights, goals, recurringBills, showToast]);

  const downloadFile = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);



  // Format date with user preference
  const formatDate = useCallback((date: Date | string) => {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    return d.toLocaleDateString('en-US', options);
  }, []);

  // Calculate category percentage
  const getCategoryPercentage = useCallback((category: string) => {
    const categoryTotal = processedExpenses
      .filter(exp => exp.category === category)
      .reduce((sum, exp) => sum + exp.amount, 0);
    const totalExpenses = processedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    return totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0;
  }, [processedExpenses]);

  // Enhanced search function
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Enhanced filter function
  const handleFilterChange = useCallback((filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  const showSection = (sectionId: string) => {
    setCurrentSection(sectionId);
  };

  const expandHellWeek = () => {
    const expandedSection = document.getElementById('hellWeekExpanded');
    const arrow = document.getElementById('hellWeekArrow');
    
    if (expandedSection && arrow) {
      if (expandedSection.style.display === 'none') {
        expandedSection.style.display = 'block';
        arrow.textContent = '▲';
      } else {
        expandedSection.style.display = 'none';
        arrow.textContent = '▼';
      }
    }
  };

  const handleBillCheck = (billId: string, amount: number) => {
    setState(prev => {
      const newCheckedBills = new Set(prev.checkedBills);
      if (newCheckedBills.has(billId)) {
        newCheckedBills.delete(billId);
      } else {
        newCheckedBills.add(billId);
      }
      return { ...prev, checkedBills: newCheckedBills };
    });
  };

  // October Bills Data
  const octoberBills = [
    { id: '1', name: 'Rent', amount: 1850, date: 'Oct 1', category: 'housing', isPaid: false },
    { id: '2', name: 'Second Rent Payment', amount: 1850, date: 'Oct 1', category: 'housing', isPaid: false },
    { id: '3', name: 'Paycheck 1', amount: 2143.73, date: 'Oct 4', category: 'income', isIncome: true, isPaid: true },
    { id: '4', name: 'Student Loan', amount: 127, date: 'Oct 5', category: 'debt', isPaid: false },
    { id: '5', name: 'Electric Bill', amount: 156, date: 'Oct 7', category: 'utilities', isPaid: false },
    { id: '6', name: 'GitHub', amount: 43, date: 'Oct 8', category: 'software', isPaid: false },
    { id: '7', name: 'Adobe Creative Suite', amount: 52.99, date: 'Oct 9', category: 'software', isPaid: false },
    { id: '8', name: 'Netflix', amount: 15.49, date: 'Oct 10', category: 'entertainment', isPaid: false },
    { id: '9', name: 'Spotify Premium', amount: 10.99, date: 'Oct 11', category: 'entertainment', isPaid: false },
    { id: '10', name: 'Car Insurance', amount: 289, date: 'Oct 12', category: 'insurance', isPaid: false },
    { id: '11', name: 'Phone Bill', amount: 85, date: 'Oct 13', category: 'utilities', isPaid: false },
    { id: '12', name: 'Gym Membership', amount: 39.99, date: 'Oct 14', category: 'health', isPaid: false },
    { id: '13', name: 'Internet', amount: 79.99, date: 'Oct 15', category: 'utilities', isPaid: false },
    { id: '14', name: 'Groceries Budget', amount: 250, date: 'Oct 15', category: 'food', isPaid: false },
    { id: '15', name: 'Paycheck 2', amount: 2143.73, date: 'Oct 18', category: 'income', isIncome: true, isPaid: false },
    { id: '16', name: 'Gas Bill', amount: 89, date: 'Oct 20', category: 'utilities', isPaid: false },
    { id: '17', name: 'Water Bill', amount: 67, date: 'Oct 22', category: 'utilities', isPaid: false },
    { id: '18', name: 'Credit Card Payment', amount: 250, date: 'Oct 25', category: 'debt', isPaid: false },
    { id: '19', name: 'Amazon Prime', amount: 14.98, date: 'Oct 28', category: 'entertainment', isPaid: false },
    { id: '20', name: 'Savings Transfer', amount: 500, date: 'Oct 30', category: 'savings', isPaid: false },
    { id: '21', name: 'Paycheck 3', amount: 2144.46, date: 'Oct 31', category: 'income', isIncome: true, isPaid: false },
  ];

  // November Bills Data
  const novemberBills = [
    { id: 'n1', name: 'Rent', amount: 1850, date: 'Nov 1', category: 'housing', isPaid: false },
    { id: 'n2', name: 'Paycheck 1', amount: 2143.73, date: 'Nov 1', category: 'income', isIncome: true, isPaid: false },
    { id: 'n3', name: 'Student Loan', amount: 127, date: 'Nov 5', category: 'debt', isPaid: false },
    { id: 'n4', name: 'Electric Bill', amount: 156, date: 'Nov 7', category: 'utilities', isPaid: false },
    { id: 'n5', name: 'GitHub', amount: 43, date: 'Nov 8', category: 'software', isPaid: false },
    { id: 'n6', name: 'Adobe Creative Suite', amount: 52.99, date: 'Nov 9', category: 'software', isPaid: false },
    { id: 'n7', name: 'Netflix', amount: 15.49, date: 'Nov 10', category: 'entertainment', isPaid: false },
    { id: 'n8', name: 'Spotify Premium', amount: 10.99, date: 'Nov 11', category: 'entertainment', isPaid: false },
    { id: 'n9', name: 'Car Insurance', amount: 289, date: 'Nov 12', category: 'insurance', isPaid: false },
    { id: 'n10', name: 'Phone Bill', amount: 85, date: 'Nov 13', category: 'utilities', isPaid: false },
    { id: 'n11', name: 'Gym Membership', amount: 39.99, date: 'Nov 14', category: 'health', isPaid: false },
    { id: 'n12', name: 'Internet', amount: 79.99, date: 'Nov 15', category: 'utilities', isPaid: false },
    { id: 'n13', name: 'Groceries Budget', amount: 250, date: 'Nov 15', category: 'food', isPaid: false },
    { id: 'n14', name: 'Paycheck 2', amount: 2143.73, date: 'Nov 15', category: 'income', isIncome: true, isPaid: false },
    { id: 'n15', name: 'Gas Bill', amount: 89, date: 'Nov 20', category: 'utilities', isPaid: false },
    { id: 'n16', name: 'Water Bill', amount: 67, date: 'Nov 22', category: 'utilities', isPaid: false },
    { id: 'n17', name: 'Credit Card Payment', amount: 250, date: 'Nov 25', category: 'debt', isPaid: false },
    { id: 'n18', name: 'Amazon Prime', amount: 14.98, date: 'Nov 28', category: 'entertainment', isPaid: false },
    { id: 'n19', name: 'Paycheck 3', amount: 2143.73, date: 'Nov 29', category: 'income', isIncome: true, isPaid: false },
    { id: 'n20', name: 'Savings Transfer', amount: 500, date: 'Nov 30', category: 'savings', isPaid: false },
  ];

  // December Bills Data
  const decemberBills = [
    { id: 'd1', name: 'Rent', amount: 1850, date: 'Dec 1', category: 'housing', isPaid: false },
    { id: 'd2', name: 'Student Loan', amount: 127, date: 'Dec 5', category: 'debt', isPaid: false },
    { id: 'd3', name: 'Electric Bill', amount: 156, date: 'Dec 7', category: 'utilities', isPaid: false },
    { id: 'd4', name: 'GitHub', amount: 43, date: 'Dec 8', category: 'software', isPaid: false },
    { id: 'd5', name: 'Adobe Creative Suite', amount: 52.99, date: 'Dec 9', category: 'software', isPaid: false },
    { id: 'd6', name: 'Netflix', amount: 15.49, date: 'Dec 10', category: 'entertainment', isPaid: false },
    { id: 'd7', name: 'Spotify Premium', amount: 10.99, date: 'Dec 11', category: 'entertainment', isPaid: false },
    { id: 'd8', name: 'Car Insurance', amount: 289, date: 'Dec 12', category: 'insurance', isPaid: false },
    { id: 'd9', name: 'Phone Bill', amount: 85, date: 'Dec 13', category: 'utilities', isPaid: false },
    { id: 'd10', name: 'Paycheck 1', amount: 2143.73, date: 'Dec 13', category: 'income', isIncome: true, isPaid: false },
    { id: 'd11', name: 'Gym Membership', amount: 39.99, date: 'Dec 14', category: 'health', isPaid: false },
    { id: 'd12', name: 'Internet', amount: 79.99, date: 'Dec 15', category: 'utilities', isPaid: false },
    { id: 'd13', name: 'Groceries Budget', amount: 250, date: 'Dec 15', category: 'food', isPaid: false },
    { id: 'd14', name: 'Holiday Shopping', amount: 500, date: 'Dec 15', category: 'shopping', isPaid: false },
    { id: 'd15', name: 'Gas Bill', amount: 89, date: 'Dec 20', category: 'utilities', isPaid: false },
    { id: 'd16', name: 'Water Bill', amount: 67, date: 'Dec 22', category: 'utilities', isPaid: false },
    { id: 'd17', name: 'Credit Card Payment', amount: 250, date: 'Dec 25', category: 'debt', isPaid: false },
    { id: 'd18', name: 'Paycheck 2', amount: 2143.73, date: 'Dec 27', category: 'income', isIncome: true, isPaid: false },
    { id: 'd19', name: 'Amazon Prime', amount: 14.98, date: 'Dec 28', category: 'entertainment', isPaid: false },
    { id: 'd20', name: 'Year-End Savings', amount: 1000, date: 'Dec 31', category: 'savings', isPaid: false },
  ];

  const getCurrentMonthData = () => {
    const now = new Date();
    let targetMonth = 9; // October (0-indexed)
    let targetYear = now.getFullYear();
    
    switch(currentMonth) {
      case 'october':
        targetMonth = 9;
        break;
      case 'november':
        targetMonth = 10;
        break;
      case 'december':
        targetMonth = 11;
        break;
      default:
        targetMonth = 9;
    }

    // Filter expenses for the selected month
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date || expense.createdAt);
      return expenseDate.getMonth() === targetMonth && expenseDate.getFullYear() === targetYear;
    });

    // Filter income for the selected month
    const monthIncome = income.filter(incomeItem => {
      const incomeDate = new Date(incomeItem.date || incomeItem.createdAt);
      return incomeDate.getMonth() === targetMonth && incomeDate.getFullYear() === targetYear;
    });

    // Get recurring bills projected for this month
    const projectedRecurringBills = recurringBills.filter(bill => {
      if (!bill.isActive) return false;
      
      const startDate = new Date(bill.startDate);
      const endDate = bill.endDate ? new Date(bill.endDate) : null;
      const targetDate = new Date(targetYear, targetMonth, 1);
      
      // Check if bill is active during target month
      if (startDate > targetDate) return false;
      if (endDate && endDate < targetDate) return false;
      
      return true;
    }).map(bill => {
      // Calculate the next due date for this bill in the target month
      const startDate = new Date(bill.startDate);
      let dueDate = new Date(startDate);
      
      // Move to target month/year
      dueDate.setFullYear(targetYear);
      dueDate.setMonth(targetMonth);
      
      // For monthly bills, use the same day of month as start date
      if (bill.frequency === 'monthly') {
        dueDate.setDate(startDate.getDate());
      }
      
      return {
        id: `recurring-${bill.id}-${targetMonth}`,
        name: bill.name,
        amount: bill.amount,
        date: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        category: bill.category,
        isIncome: false,
        isPaid: false,
        type: 'recurring',
        originalData: bill,
        dueDate: dueDate
      };
    });

    // Get the original hardcoded bills for the selected month
    const getHardcodedBills = () => {
      switch(currentMonth) {
        case 'october': return octoberBills;
        case 'november': return novemberBills;
        case 'december': return decemberBills;
        default: return octoberBills;
      }
    };

    const hardcodedBills = getHardcodedBills().map(bill => ({
      ...bill,
      type: 'hardcoded',
      originalData: bill
    }));

    // Combine all data sources
    const combinedData = [
      // Recorded expenses
      ...monthExpenses.map(expense => ({
        id: expense.id,
        name: expense.description,
        amount: expense.amount,
        date: new Date(expense.date || expense.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        category: expense.category,
        isIncome: false,
        isPaid: true,
        type: 'expense',
        originalData: expense
      })),
      // Recorded income
      ...monthIncome.map(incomeItem => ({
        id: incomeItem.id,
        name: incomeItem.description,
        amount: incomeItem.amount,
        date: new Date(incomeItem.date || incomeItem.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        category: incomeItem.category,
        isIncome: true,
        isPaid: true,
        type: 'income',
        originalData: incomeItem
      })),
      // Projected recurring bills
      ...projectedRecurringBills,
      // Hardcoded bills
      ...hardcodedBills
    ];

    return combinedData;
  };

  const combinedData = getCurrentMonthData();
  console.log('Home function executing, combinedData length:', combinedData.length);

  return (
    <div>
      <h1>Test</h1>
    </div>
  );
}

// Main Component Wrapper with Error Boundary
function AstralMoneyApp() {
  return (
    <div>
      <Home />
    </div>
  );
}

export default AstralMoneyApp;
