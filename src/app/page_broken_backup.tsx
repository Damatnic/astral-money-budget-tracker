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

  // Ensure we're in the Home function scope  
  return (
    <div>
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            notification={toast} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>

      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-40">
          ⚠️ You're offline. Some features may be limited.
        </div>
      )}

      {/* Loading Overlay */}
      {(loading.userData || loading.expenses || loading.income || loading.recurringBills) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600">Loading your financial data...</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {Object.values(errors).some(error => error !== null) && (
        <div className="fixed top-20 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 z-40">
          <h4 className="text-red-800 font-semibold mb-2">⚠️ Some issues occurred:</h4>
          <ul className="text-red-600 text-sm space-y-1">
            {Object.entries(errors).map(([key, error]) => 
              error && <li key={key}>• {key}: {error}</li>
            )}
          </ul>
        </div>
      )}

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-md">
            <h4 className="text-yellow-800 font-semibold mb-2">💰 Budget Alerts</h4>
            <div className="space-y-2">
              {budgetAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="text-yellow-700 text-sm">
                  <strong>{alert.category}:</strong> {alert.message}
                </div>
              ))}
              {budgetAlerts.length > 3 && (
                <p className="text-yellow-600 text-xs">+{budgetAlerts.length - 3} more alerts</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Indicator */}
      {activeTooltip && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white rounded-lg p-3 text-sm z-30">
          <h5 className="font-semibold mb-2">🚀 Keyboard Shortcuts</h5>
          <div className="space-y-1">
            <div>Ctrl+K: Search</div>
            <div>Ctrl+N: New Expense</div>
            <div>Ctrl+I: New Income</div>
            <div>Ctrl+B: New Bill</div>
            <div>Ctrl+S: Settings</div>
            <div>ESC: Close modals</div>
          </div>
        </div>
      )}

      {/* Enhanced Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span>🌟</span>
            <span>Astral Money</span>
          </div>
        </div>

        <nav>
          <ul className="nav-menu">
            <li className="nav-item">
              <a 
                href="#dashboard" 
                className={`nav-link ${currentSection === 'dashboard' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); showSection('dashboard'); }}
              >
                <span className="nav-icon">📊</span>
                <span>Dashboard</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#months" 
                className={`nav-link ${currentSection === 'months' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); showSection('months'); }}
              >
                <span className="nav-icon">📅</span>
                <span>Monthly View</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#analytics" 
                className={`nav-link ${currentSection === 'analytics' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); showSection('analytics'); }}
              >
                <span className="nav-icon">📈</span>
                <span>Analytics</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#expenses" 
                className={`nav-link ${currentSection === 'expenses' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); showSection('expenses'); }}
              >
                <span className="nav-icon">💰</span>
                <span>Expenses</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#income" 
                className={`nav-link ${currentSection === 'income' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); showSection('income'); }}
              >
                <span className="nav-icon">💵</span>
                <span>Income</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#recurring" 
                className={`nav-link ${currentSection === 'recurring' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); showSection('recurring'); }}
              >
                <span className="nav-icon">🔄</span>
                <span>Recurring</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#goals" 
                className={`nav-link ${currentSection === 'goals' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); showSection('goals'); }}
              >
                <span className="nav-icon">🎯</span>
                <span>Goals & Targets</span>
              </a>
            </li>
            <li className="nav-item">
              <a 
                href="#settings" 
                className={`nav-link ${currentSection === 'settings' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); showSection('settings'); }}
              >
                <span className="nav-icon">⚙️</span>
                <span>Settings</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* Financial Health Widget */}
        <div className="health-widget">
          <div className="health-header">
            <div className="health-title">Financial Health</div>
            <div className="health-score critical">{state.healthScore}</div>
          </div>
          <div className="health-bar">
            <div className="health-progress critical" style={{width: `${state.healthScore}%`}}></div>
          </div>
          <div className="health-status">
            <span className="status-dot critical"></span>
            <span>Critical - Action Needed</span>
          </div>
          <div className="health-tips">
            💡 Current balance critically low. Prioritize income sources.
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Dashboard Section */}
        {currentSection === 'dashboard' && (
          <section id="dashboard">
            <div className="section-header">
              <h1>💰 Financial Dashboard</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="current-balance">
                  Balance: <span id="currentBalance" className="negative">{formatCurrency(userBalance)}</span>
                </div>
                
                {/* Notifications */}
                <div style={{ position: 'relative' }} data-notifications>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    style={{
                      padding: '8px',
                      background: notifications.length > 0 ? 'var(--warning)' : 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px'
                    }}
                  >
                    🔔
                    {notifications.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: 'var(--danger)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}>
                        {notifications.length > 9 ? '9+' : notifications.length}
                      </div>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      marginTop: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      padding: '16px',
                      minWidth: '300px',
                      maxWidth: '400px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <h4 style={{ margin: 0, color: 'var(--text)' }}>Notifications</h4>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => setNotifications([])}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      
                      {notifications.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '20px',
                          color: 'var(--text-secondary)'
                        }}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                          <p style={{ margin: 0, fontSize: '14px' }}>No notifications</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              style={{
                                padding: '14px',
                                background: notification.type === 'error' ? 'rgba(220, 53, 69, 0.1)' :
                                          notification.type === 'warning' ? 'rgba(255, 193, 7, 0.1)' :
                                          notification.type === 'success' ? 'rgba(40, 167, 69, 0.1)' :
                                          'rgba(13, 110, 253, 0.1)',
                                border: `1px solid ${notification.type === 'error' ? 'var(--danger)' :
                                                   notification.type === 'warning' ? 'var(--warning)' :
                                                   notification.type === 'success' ? 'var(--success)' :
                                                   'var(--primary)'}`,
                                borderRadius: '8px',
                                borderLeft: `4px solid ${notification.type === 'error' ? 'var(--danger)' :
                                                       notification.type === 'warning' ? 'var(--warning)' :
                                                       notification.type === 'success' ? 'var(--success)' :
                                                       'var(--primary)'}`,
                                animation: notification.priority === 'critical' ? 'pulse 2s infinite' : 'none'
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '6px'
                              }}>
                                <div style={{
                                  fontWeight: notification.priority === 'critical' ? '700' : '600',
                                  fontSize: notification.priority === 'critical' ? '15px' : '14px',
                                  color: notification.type === 'error' ? 'var(--danger)' :
                                         notification.type === 'warning' ? 'var(--warning)' :
                                         notification.type === 'success' ? 'var(--success)' :
                                         'var(--text)'
                                }}>
                                  {notification.title}
                                </div>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: '600'
                                }}>
                                  {notification.priority === 'critical' ? '🔥' :
                                   notification.priority === 'high' ? '🔴' : 
                                   notification.priority === 'medium' ? '🟡' : 
                                   notification.priority === 'low' ? '🟢' : '🔵'}
                                </div>
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.4',
                                fontWeight: notification.priority === 'critical' ? '500' : '400'
                              }}>
                                {notification.message}
                              </div>
                              {notification.priority === 'critical' && (
                                <div style={{
                                  marginTop: '8px',
                                  padding: '6px 10px',
                                  background: 'rgba(220, 53, 69, 0.2)',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: 'var(--danger)',
                                  textAlign: 'center'
                                }}>
                                  IMMEDIATE ACTION REQUIRED
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => showSection('expenses')}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--danger)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>-</span>
                    <span>Add Expense</span>
                  </button>
                  <button 
                    onClick={() => showSection('income')}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--success)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>+</span>
                    <span>Add Income</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              {/* Total Income Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-title">Total Income (Oct)</div>
                  <div className="card-icon">💰</div>
                </div>
                <div className="card-value positive">{formatCurrency(state.totalIncome)}</div>
                <div className="progress-container">
                  <div className="progress-bar success" style={{width: '85%'}}></div>
                </div>
                <div className="card-trend">
                  <span>📈</span>
                  <span>3 Paychecks this month</span>
                </div>
              </div>

              {/* Total Expenses Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-title">Total Expenses Remaining</div>
                  <div className="card-icon">💸</div>
                </div>
                <div className="card-value negative">{formatCurrency(state.totalExpenses)}</div>
                <div className="progress-container">
                  <div className="progress-bar danger" style={{width: '65%'}}></div>
                </div>
                <div className="card-trend clickable" onClick={expandHellWeek} style={{cursor: 'pointer'}}>
                  <span>⚠️</span>
                  <span>Hell Week: Oct 8-15 ($870 in bills) - Click to view</span>
                  <span id="hellWeekArrow" style={{marginLeft: '8px'}}>▼</span>
                </div>
                <div id="hellWeekExpanded" style={{display: 'none', marginTop: '16px', padding: '16px', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid var(--warning)', borderRadius: '8px'}}>
                  <div style={{fontWeight: '600', marginBottom: '12px', color: 'var(--warning)'}}>⚠️ Heavy Bill Period (Oct 8-15)</div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 8 - GitHub</span>
                      <span style={{color: 'var(--danger)'}}>$43</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 9 - Adobe Creative Suite</span>
                      <span style={{color: 'var(--danger)'}}>$52.99</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 10 - Netflix</span>
                      <span style={{color: 'var(--danger)'}}>$15.49</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 11 - Spotify Premium</span>
                      <span style={{color: 'var(--danger)'}}>$10.99</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 12 - Car Insurance</span>
                      <span style={{color: 'var(--danger)'}}>$289</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 13 - Phone Bill</span>
                      <span style={{color: 'var(--danger)'}}>$85</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 14 - Gym Membership</span>
                      <span style={{color: 'var(--danger)'}}>$39.99</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 15 - Internet</span>
                      <span style={{color: 'var(--danger)'}}>$79.99</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                      <span>Oct 15 - Groceries Budget</span>
                      <span style={{color: 'var(--danger)'}}>$250</span>
                    </div>
                  </div>
                  <div style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-primary)', fontWeight: '600'}}>
                    Total Hell Week Bills: <span style={{color: 'var(--danger)'}}>$870.45</span>
                  </div>
                </div>
              </div>

              {/* Net Cash Flow Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-title">Net Cash Flow</div>
                  <div className="card-icon">📈</div>
                </div>
                <div className="card-value negative">{formatCurrency(state.netFlow)}</div>
                <div className="progress-container">
                  <div className="progress-bar danger" style={{width: '25%'}}></div>
                </div>
                <div className="card-trend">
                  <span>📉</span>
                  <span>Deficit this month</span>
                </div>
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="overview-card">
              <div className="section-title">⚠️ Critical Alerts</div>
              <div style={{padding: '16px 0'}}>
                <div style={{color: 'var(--danger)', marginBottom: '12px', fontWeight: '600'}}>
                  🚨 Double rent payment due Oct 1st ($3,700)
                </div>
                <div style={{color: 'var(--warning)', marginBottom: '12px'}}>
                  ⚠️ Heavy bill period Oct 8-15 ($870 in bills)
                </div>
                <div style={{color: 'var(--success)'}}>
                  ✅ 3 Paychecks this month ($6,431 total)
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Monthly View Section */}
        {currentSection === 'months' && (
          <section id="months">
            <div className="section-header">
              <h1>📅 Monthly Bills & Income</h1>
              <div className="month-selector">
                <button 
                  className={`month-btn ${currentMonth === 'october' ? 'active' : ''}`}
                  onClick={() => setCurrentMonth('october')}
                >
                  October
                </button>
                <button 
                  className={`month-btn ${currentMonth === 'november' ? 'active' : ''}`}
                  onClick={() => setCurrentMonth('november')}
                >
                  November
                </button>
                <button 
                  className={`month-btn ${currentMonth === 'december' ? 'active' : ''}`}
                  onClick={() => setCurrentMonth('december')}
                >
                  December
                </button>
              </div>
            </div>

            <div className="month-stats">
              <div className="stat-card">
                <span className="stat-label">Income</span>
                <span className="stat-value positive">
                  {formatCurrency(
                    getCurrentMonthData()
                      .filter(b => b.isIncome)
                      .reduce((sum, b) => sum + b.amount, 0)
                  )}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Expenses</span>
                <span className="stat-value negative">
                  {formatCurrency(
                    getCurrentMonthData()
                      .filter(b => !b.isIncome)
                      .reduce((sum, b) => sum + b.amount, 0)
                  )}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Net</span>
                <span className={`stat-value ${
                  getCurrentMonthData().filter(b => b.isIncome).reduce((sum, b) => sum + b.amount, 0) -
                  getCurrentMonthData().filter(b => !b.isIncome).reduce((sum, b) => sum + b.amount, 0) > 0
                    ? 'positive' : 'negative'
                }`}>
                  {formatCurrency(
                    getCurrentMonthData().filter(b => b.isIncome).reduce((sum, b) => sum + b.amount, 0) -
                    getCurrentMonthData().filter(b => !b.isIncome).reduce((sum, b) => sum + b.amount, 0)
                  )}
                </span>
              </div>
            </div>

            <div className="bills-list">
              {getCurrentMonthData().length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📅</div>
                  <p>No financial data for {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>Add expenses or income to see them here</p>
                </div>
              ) : (
                getCurrentMonthData().map(item => (
                  <div key={`${item.type}-${item.id}`} className="bill-row">
                    <span className="bill-date">{item.date}</span>
                    <span className="bill-name">{item.name}</span>
                    <span className="bill-category">{item.category}</span>
                    <span className={`bill-amount ${item.isIncome ? 'income' : 'expense'}`}>
                      {item.isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                    </span>
                    <span className={`bill-status ${item.isPaid ? 'paid' : 'pending'}`}>
                      {item.isPaid ? '✅ Recorded' : '⏳ Pending'}
                    </span>
                    <div className="bill-actions">
                      {(item.type === 'expense' || item.type === 'income') && (
                        <>
                          <button
                            onClick={() => {
                              if (item.type === 'expense') {
                                setEditingExpense(item.originalData);
                                setExpenseForm({
                                  amount: item.originalData.amount.toString(),
                                  description: item.originalData.description,
                                  category: item.originalData.category,
                                  date: item.originalData.date ? new Date(item.originalData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                                });
                                setShowExpenseForm(true);
                              } else {
                                setEditingIncome(item.originalData);
                                setIncomeForm({
                                  amount: item.originalData.amount.toString(),
                                  description: item.originalData.description,
                                  source: item.originalData.category,
                                  date: item.originalData.date ? new Date(item.originalData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                                });
                                setShowIncomeForm(true);
                              }
                            }}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              marginRight: '8px'
                            }}
                            title={`Edit ${item.type}`}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => {
                              if (item.type === 'expense') {
                                deleteExpense(item.id);
                              } else {
                                deleteIncome(item.id);
                              }
                            }}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--danger)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title={`Delete ${item.type}`}
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}
                      {item.type === 'recurring' && (
                        <>
                          <button
                            onClick={() => markBillAsPaid(item.originalData)}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--success)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              marginRight: '8px'
                            }}
                            title="Mark as Paid"
                          >
                            ✅ Pay
                          </button>
                          <button
                            onClick={() => {
                              setEditingRecurringBill(item.originalData);
                              setRecurringForm({
                                name: item.originalData.name,
                                amount: item.originalData.amount.toString(),
                                frequency: item.originalData.frequency,
                                category: item.originalData.category,
                                startDate: item.originalData.startDate ? new Date(item.originalData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                                endDate: item.originalData.endDate ? new Date(item.originalData.endDate).toISOString().split('T')[0] : ''
                              });
                              setShowRecurringForm(true);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              marginRight: '8px'
                            }}
                            title="Edit recurring bill"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => deleteRecurringBill(item.originalData.id)}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--danger)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="Delete recurring bill"
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}
                      {item.type === 'hardcoded' && (
                        <span style={{
                          padding: '4px 8px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'var(--text-secondary)',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          📅 Projected
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Analytics Section */}
        {currentSection === 'analytics' && (
          <section id="analytics">
            <div className="section-header">
              <h1>📈 Financial Analytics</h1>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>📊 Spending by Category</h3>
                <div className="category-breakdown">
                  {(() => {
                    if (expenses.length === 0) {
                      return (
                        <div style={{
                          textAlign: 'center',
                          padding: '40px 20px',
                          color: 'var(--text-secondary)'
                        }}>
                          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
                          <p>No expense data to analyze</p>
                          <p style={{ fontSize: '14px', marginTop: '8px' }}>Add expenses to see category breakdown</p>
                        </div>
                      );
                    }

                    // Calculate category totals from actual expense data
                    const categoryTotals = expenses.reduce((acc, expense) => {
                      const category = expense.category || 'other';
                      acc[category] = (acc[category] || 0) + expense.amount;
                      return acc;
                    }, {} as Record<string, number>);

                    const totalExpenses = (Object.values(categoryTotals) as number[]).reduce((sum: number, amount: number) => sum + amount, 0);
                    const sortedCategories = Object.entries(categoryTotals)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 8); // Show top 8 categories

                    const categoryIcons: Record<string, string> = {
                      'food': '🍔',
                      'transportation': '🚗',
                      'entertainment': '🎬',
                      'shopping': '🛒',
                      'utilities': '⚡',
                      'health': '🏥',
                      'housing': '🏠',
                      'insurance': '🛡️',
                      'other': '📦'
                    };

                    const categoryColors = [
                      'var(--danger)', 'var(--warning)', 'var(--primary)', 
                      'var(--success)', 'var(--secondary)', '#9c27b0', '#ff5722', '#795548'
                    ];

                    return sortedCategories.map(([category, amount], index) => {
                      const percentage = ((amount as number) / totalExpenses) * 100;
                      return (
                        <div key={category} className="category-item">
                          <span className="category-name">
                            {categoryIcons[category] || '📦'} {category.charAt(0).toUpperCase() + category.slice(1)}
                          </span>
                          <div className="category-bar">
                            <div 
                              className="bar-fill" 
                              style={{
                                width: `${Math.max(percentage, 5)}%`, 
                                background: categoryColors[index % categoryColors.length]
                              }}
                            ></div>
                          </div>
                          <span className="category-amount">{formatCurrency(amount as number)}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="analytics-card">
                <h3>💰 Income vs Expenses Trend</h3>
                <div className="trend-chart">
                  <div className="trend-month">
                    <span className="month-label">Oct</span>
                    <div className="month-bars">
                      <div className="income-bar" style={{height: '60%'}}></div>
                      <div className="expense-bar" style={{height: '90%'}}></div>
                    </div>
                  </div>
                  <div className="trend-month">
                    <span className="month-label">Nov</span>
                    <div className="month-bars">
                      <div className="income-bar" style={{height: '60%'}}></div>
                      <div className="expense-bar" style={{height: '50%'}}></div>
                    </div>
                  </div>
                  <div className="trend-month">
                    <span className="month-label">Dec</span>
                    <div className="month-bars">
                      <div className="income-bar" style={{height: '40%'}}></div>
                      <div className="expense-bar" style={{height: '55%'}}></div>
                    </div>
                  </div>
                </div>
                <div className="trend-legend">
                  <span className="legend-item">
                    <span className="legend-color income"></span> Income
                  </span>
                  <span className="legend-item">
                    <span className="legend-color expense"></span> Expenses
                  </span>
                </div>
              </div>

              <div className="analytics-card">
                <h3>🎯 Budget Performance</h3>
                <div className="performance-metrics">
                  <div className="metric">
                    <span className="metric-label">Budget Utilization</span>
                    <div className="metric-value">146%</div>
                    <div className="metric-status danger">Over Budget</div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Savings Rate</span>
                    <div className="metric-value">-46%</div>
                    <div className="metric-status danger">Negative</div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Bill Payment Rate</span>
                    <div className="metric-value">15%</div>
                    <div className="metric-status warning">Behind Schedule</div>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>💡 AI Financial Insights</h3>
                <div className="insights">
                  {(() => {
                    const insights = [];
                    const now = new Date();
                    
                    // Calculate financial metrics
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
                    
                    // Advanced Cash Flow Recovery Strategies
                    const netCashFlow = monthlyIncome - monthlyExpenses;
                    const emergencyFundTarget = monthlyExpenses * 3; // 3-month emergency fund
                    const criticalBalanceThreshold = monthlyExpenses * 0.5; // Half month expenses
                    
                    // Calculate accurate upcoming bills for next 30 days
                    const upcomingBillTotal = calculateUpcomingBills(recurringBills);

                    // Generate enhanced insights based on comprehensive analysis
                    if (expenses.length > 0) {
                      const categoryTotals = expenses.reduce((acc, expense) => {
                        const category = expense.category || 'other';
                        acc[category] = (acc[category] || 0) + expense.amount;
                        return acc;
                      }, {} as Record<string, number>);

                      const sortedCategories = Object.entries(categoryTotals).sort(([,a], [,b]) => (b as number) - (a as number));
                      const topCategory = sortedCategories[0];
                      
                      // Cash Flow Recovery Strategies
                      if (netCashFlow < 0) {
                        const deficit = Math.abs(netCashFlow);
                        if (deficit > monthlyIncome * 0.2) {
                          insights.push({
                            icon: '🆘',
                            text: `Critical deficit: ${formatCurrency(deficit)}. Immediate action needed - consider gig work or expense cuts`
                          });
                        }
                        
                        // Category-specific reduction suggestions
                        if (topCategory && (topCategory[1] as number) > monthlyIncome * 0.3) {
                          const potentialSavings = (topCategory[1] as number) * 0.2; // 20% reduction
                          insights.push({
                            icon: '✂️',
                            text: `Cut ${topCategory[0]} spending by 20% to save ${formatCurrency(potentialSavings)}/month`
                          });
                        }
                        
                        // Income boost suggestions
                        const incomeNeed = deficit + (emergencyFundTarget / 12);
                        insights.push({
                          icon: '💼',
                          text: `Target ${formatCurrency(incomeNeed)} additional monthly income through side work or skills upgrade`
                        });
                      }

                      if (topCategory && monthlyExpenses > 0) {
                        const percentage = (((topCategory[1] as number) / monthlyExpenses) * 100).toFixed(0);
                        insights.push({
                          icon: '📊',
                          text: `${topCategory[0].charAt(0).toUpperCase() + topCategory[0].slice(1)} dominates at ${percentage}% - optimize this category first`
                        });
                      }

                      // Predictive spending alerts
                      const weeklyAvg = monthlyExpenses / 4.33;
                      const projectedWeekly = weeklyAvg * 1.1; // 10% buffer
                      if (userBalance < projectedWeekly * 2) {
                        insights.push({
                          icon: '⏰',
                          text: `Warning: Current balance covers only ${Math.floor(userBalance / weeklyAvg)} weeks at current spending rate`
                        });
                      }
                    }

                    // Enhanced Emergency Fund Recommendations
                    if (userBalance < emergencyFundTarget) {
                      const monthsOfExpenses = userBalance / (monthlyExpenses || 1);
                      const monthlyTarget = (emergencyFundTarget - userBalance) / 12;
                      
                      if (monthsOfExpenses < 0.5) {
                        insights.push({
                          icon: '🚨',
                          text: `Critical: Emergency fund covers ${monthsOfExpenses.toFixed(1)} months. Save ${formatCurrency(monthlyTarget)}/month to reach 3-month target`
                        });
                      } else if (monthsOfExpenses < 1) {
                        insights.push({
                          icon: '⚠️',
                          text: `Low emergency cushion: ${monthsOfExpenses.toFixed(1)} months covered. Target ${formatCurrency(monthlyTarget)}/month savings`
                        });
                      } else if (monthsOfExpenses < 3) {
                        insights.push({
                          icon: '🎯',
                          text: `Building emergency fund: ${monthsOfExpenses.toFixed(1)}/3 months. Add ${formatCurrency(monthlyTarget)}/month`
                        });
                      }
                    }

                    // Debt Reduction Strategy
                    if (monthlyIncome > 0 && monthlyExpenses > 0) {
                      const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100);
                      if (savingsRate > 20) {
                        insights.push({
                          icon: '🏆',
                          text: `Excellent ${savingsRate.toFixed(1)}% savings rate! Consider debt payoff or investment acceleration`
                        });
                      } else if (savingsRate > 10) {
                        insights.push({
                          icon: '💰',
                          text: `Good ${savingsRate.toFixed(1)}% savings rate. Focus on debt reduction or emergency fund growth`
                        });
                      } else if (savingsRate > 0) {
                        insights.push({
                          icon: '📈',
                          text: `Saving ${savingsRate.toFixed(1)}% of income. Target 10-20% for financial stability`
                        });
                      } else {
                        const deficit = monthlyExpenses - monthlyIncome;
                        insights.push({
                          icon: '🔥',
                          text: `Spending ${formatCurrency(deficit)} above income. Immediate budget restructuring required`
                        });
                        
                        // Debt avalanche strategy for high-cost categories
                        if (expenses.length > 0) {
                          const categoryTotals = expenses.reduce((acc, expense) => {
                            const category = expense.category || 'other';
                            acc[category] = (acc[category] || 0) + expense.amount;
                            return acc;
                          }, {} as Record<string, number>);
                          const sortedCategories = Object.entries(categoryTotals).sort(([,a], [,b]) => (b as number) - (a as number));
                          const highestSpend = sortedCategories[0];
                          if (highestSpend && (highestSpend[1] as number) > monthlyIncome * 0.4) {
                            insights.push({
                              icon: '⚡',
                              text: `Focus: ${highestSpend[0]} costs ${(((highestSpend[1] as number)/monthlyIncome)*100).toFixed(0)}% of income - prioritize reduction here`
                            });
                          }
                        }
                      }
                    }

                    // Upcoming expense warnings based on recurring bills
                    if (upcomingBillTotal > userBalance * 0.8) {
                      insights.push({
                        icon: '📅',
                        text: `Upcoming bills (${formatCurrency(upcomingBillTotal)}) will strain current balance - prepare now`
                      });
                    }

                    // Advanced balance-based strategies
                    if (userBalance < criticalBalanceThreshold) {
                      insights.push({
                        icon: '🆘',
                        text: 'Critical balance level! Freeze non-essential spending and activate emergency protocols'
                      });
                    } else if (userBalance > emergencyFundTarget && monthlyIncome > monthlyExpenses) {
                      const surplus = userBalance - emergencyFundTarget;
                      insights.push({
                        icon: '🚀',
                        text: `Emergency fund complete! Consider investing ${formatCurrency(surplus)} surplus for growth`
                      });
                    }

                    // Income diversification insights
                    if (income.length > 0) {
                      const incomeSources = income.reduce((acc, inc) => {
                        acc[inc.category] = (acc[inc.category] || 0) + inc.amount;
                        return acc;
                      }, {} as Record<string, number>);
                      
                      const sourceCount = Object.keys(incomeSources).length;
                      if (sourceCount === 1) {
                        insights.push({
                          icon: '🌐',
                          text: 'Single income source detected - consider diversifying for financial security'
                        });
                      } else if (sourceCount > 3) {
                        insights.push({
                          icon: '💪',
                          text: `Great income diversification across ${sourceCount} sources - strong financial resilience`
                        });
                      }
                    }

                    // Default insights if no data
                    if (insights.length === 0) {
                      insights.push(
                        { icon: '🎯', text: 'Start tracking expenses to get personalized insights' },
                        { icon: '💰', text: 'Add income sources to see your savings rate' },
                        { icon: '📊', text: 'Build a complete financial picture for better recommendations' }
                      );
                    }

                    return insights.slice(0, 5).map((insight, index) => (
                      <div key={index} className="insight-item">
                        <span className="insight-icon">{insight.icon}</span>
                        <span className="insight-text">{insight.text}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Recent Income Analytics */}
              <div className="analytics-card">
                <h3>💵 Recent Income Activity</h3>
                {income.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>💼</div>
                    <p>No income data available</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>Visit the Income section to start tracking</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Last {Math.min(income.length, 5)} income entries
                      </span>
                      <span style={{ 
                        color: 'var(--success)', 
                        fontWeight: '600',
                        fontSize: '16px'
                      }}>
                        Total: +{formatCurrency(income.slice(0, 5).reduce((sum, inc) => sum + inc.amount, 0))}
                      </span>
                    </div>
                    {income.slice(0, 5).map((incomeItem, index) => (
                      <div key={incomeItem.id || index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'rgba(40, 167, 69, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid rgba(40, 167, 69, 0.3)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ fontWeight: '500', color: 'var(--text)', fontSize: '14px' }}>
                            {incomeItem.description}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {incomeItem.category} • {new Date(incomeItem.date || incomeItem.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{
                          fontWeight: '600',
                          color: 'var(--success)',
                          fontSize: '14px'
                        }}>
                          +{formatCurrency(incomeItem.amount)}
                        </div>
                      </div>
                    ))}
                    {income.length > 5 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '12px',
                        color: 'var(--text-secondary)',
                        fontSize: '14px'
                      }}>
                        And {income.length - 5} more income entries...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Expenses Analytics */}
              <div className="analytics-card">
                <h3>💳 Recent Expense Activity</h3>
                {expenses.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
                    <p>No expense data available</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>Visit the Expenses section to start tracking</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Last {Math.min(expenses.length, 5)} expenses
                      </span>
                      <span style={{ 
                        color: 'var(--danger)', 
                        fontWeight: '600',
                        fontSize: '16px'
                      }}>
                        Total: -{formatCurrency(expenses.slice(0, 5).reduce((sum, exp) => sum + exp.amount, 0))}
                      </span>
                    </div>
                    {expenses.slice(0, 5).map((expense, index) => (
                      <div key={expense.id || index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ fontWeight: '500', color: 'var(--text)', fontSize: '14px' }}>
                            {expense.description}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {expense.category} • {new Date(expense.date || expense.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{
                          fontWeight: '600',
                          color: 'var(--danger)',
                          fontSize: '14px'
                        }}>
                          -{formatCurrency(expense.amount)}
                        </div>
                      </div>
                    ))}
                    {expenses.length > 5 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '12px',
                        color: 'var(--text-secondary)',
                        fontSize: '14px'
                      }}>
                        And {expenses.length - 5} more expenses...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Expenses Section */}
        {currentSection === 'expenses' && (
          <section id="expenses">
            <div className="section-header">
              <h1>💰 Expense Tracker</h1>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  style={{
                    padding: '12px 16px',
                    background: showFilters ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  🔍 Filter
                </button>
                <button 
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  style={{
                    padding: '12px 24px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>+</span>
                  <span>Add Expense</span>
                </button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            {showFilters && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {/* Search Bar */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Search Expenses
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by description..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text)',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  
                  {/* Filter Options */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Category
                      </label>
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text)',
                          fontSize: '16px'
                        }}
                      >
                        <option value="all">All Categories</option>
                        <option value="food">Food & Dining</option>
                        <option value="transportation">Transportation</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="shopping">Shopping</option>
                        <option value="utilities">Utilities</option>
                        <option value="health">Health & Medical</option>
                        <option value="housing">Housing</option>
                        <option value="insurance">Insurance</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Date Range
                      </label>
                      <select
                        value={filters.dateRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text)',
                          fontSize: '16px'
                        }}
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last Year</option>
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Amount Range
                      </label>
                      <select
                        value={filters.amountRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, amountRange: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text)',
                          fontSize: '16px'
                        }}
                      >
                        <option value="all">Any Amount</option>
                        <option value="under50">Under $50</option>
                        <option value="50to100">$50 - $100</option>
                        <option value="100to500">$100 - $500</option>
                        <option value="over500">Over $500</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Filter Actions */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilters({
                          category: 'all',
                          dateRange: 'all',
                          amountRange: 'all',
                          type: 'all'
                        });
                      }}
                      style={{
                        padding: '10px 16px',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Expense Form */}
            {showExpenseForm && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ marginBottom: '20px', color: 'var(--text)' }}>
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <form onSubmit={handleExpenseSubmit} style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Amount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text)',
                          fontSize: '16px'
                        }}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Category
                      </label>
                      <select
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text)',
                          fontSize: '16px'
                        }}
                      >
                        <option value="food">Food & Dining</option>
                        <option value="transportation">Transportation</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="shopping">Shopping</option>
                        <option value="utilities">Utilities</option>
                        <option value="health">Health & Medical</option>
                        <option value="housing">Housing</option>
                        <option value="insurance">Insurance</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text)',
                        fontSize: '16px'
                      }}
                      placeholder="What did you spend money on?"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text)',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExpenseForm(false);
                        setEditingExpense(null);
                        setExpenseForm({
                          amount: '',
                          description: '',
                          category: 'food',
                          date: new Date().toISOString().split('T')[0]
                        });
                      }}
                      style={{
                        padding: '12px 24px',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '12px 24px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {editingExpense ? 'Update Expense' : 'Add Expense'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Recent Expenses */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text)' }}>
                {searchTerm || filters.category !== 'all' || filters.dateRange !== 'all' || filters.amountRange !== 'all' 
                  ? `Filtered Expenses (${getFilteredExpenses().length} results)` 
                  : 'Recent Expenses (Last 30 Days)'
                }
              </h3>
              {getFilteredExpenses().length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
                  <p>No expenses recorded yet</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>Click "Add Expense" to start tracking your spending</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {getFilteredExpenses().map((expense, index) => (
                    <div key={expense.id || index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                          {expense.description}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {expense.category} • {new Date(expense.date || expense.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          fontWeight: '600',
                          color: 'var(--danger)',
                          fontSize: '18px'
                        }}>
                          -{formatCurrency(expense.amount)}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setEditingExpense(expense);
                              setExpenseForm({
                                amount: expense.amount.toString(),
                                description: expense.description,
                                category: expense.category,
                                date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : ''
                              });
                              setShowExpenseForm(true);
                            }}
                            style={{
                              padding: '6px 8px',
                              background: 'var(--primary)',
                              border: 'none',
                              borderRadius: '4px',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            style={{
                              padding: '6px 8px',
                              background: 'var(--danger)',
                              border: 'none',
                              borderRadius: '4px',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Income Section */}
        {currentSection === 'income' && (
          <section id="income">
            <div className="section-header">
              <h1>💵 Income Tracker</h1>
              <button 
                onClick={() => setShowIncomeForm(!showIncomeForm)}
                style={{
                  padding: '12px 24px',
                  background: 'var(--success)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>+</span>
                <span>Add Income</span>
              </button>
            </div>

            {/* Income Form */}
            {showIncomeForm && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ marginBottom: '20px', color: 'var(--text)' }}>
                  {editingIncome ? 'Edit Income' : 'Add New Income'}
                </h3>
                <form onSubmit={handleIncomeSubmit} style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Amount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={incomeForm.amount}
                        onChange={(e) => setIncomeForm(prev => ({ ...prev, amount: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text)',
                          fontSize: '16px'
                        }}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Source
                      </label>
                      <select
                        value={incomeForm.source}
                        onChange={(e) => setIncomeForm(prev => ({ ...prev, source: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text)',
                          fontSize: '16px'
                        }}
                      >
                        <option value="salary">Salary/Wages</option>
                        <option value="freelance">Freelance Work</option>
                        <option value="business">Business Income</option>
                        <option value="investment">Investment Returns</option>
                        <option value="rental">Rental Income</option>
                        <option value="bonus">Bonus</option>
                        <option value="gift">Gift/Monetary Gift</option>
                        <option value="refund">Refund</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={incomeForm.description}
                      onChange={(e) => setIncomeForm(prev => ({ ...prev, description: e.target.value }))}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text)',
                        fontSize: '16px'
                      }}
                      placeholder="What income did you receive?"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={incomeForm.date}
                      onChange={(e) => setIncomeForm(prev => ({ ...prev, date: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text)',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowIncomeForm(false);
                        setEditingIncome(null);
                        setIncomeForm({
                          amount: '',
                          description: '',
                          source: 'salary',
                          date: new Date().toISOString().split('T')[0]
                        });
                      }}
                      style={{
                        padding: '12px 24px',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '12px 24px',
                        background: 'var(--success)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {editingIncome ? 'Update Income' : 'Add Income'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Recent Income */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text)' }}>Recent Income (Last 30 Days)</h3>
              {income.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
                  <p>No income recorded yet</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>Click "Add Income" to start tracking your earnings</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: 'rgba(40, 167, 69, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid var(--success)'
                  }}>
                    <span style={{ color: 'var(--text)', fontWeight: '600' }}>
                      Total Income (30 days)
                    </span>
                    <span style={{
                      color: 'var(--success)',
                      fontWeight: '700',
                      fontSize: '18px'
                    }}>
                      +{formatCurrency(income.reduce((sum, item) => sum + item.amount, 0))}
                    </span>
                  </div>
                  {income.map((incomeItem, index) => (
                    <div key={incomeItem.id || index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                          {incomeItem.description}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {incomeItem.category} • {new Date(incomeItem.date || incomeItem.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{
                        fontWeight: '600',
                        color: 'var(--success)',
                        fontSize: '18px'
                      }}>
                        +{formatCurrency(incomeItem.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Recurring Bills Section */}
        {currentSection === 'recurring' && (
          <section id="recurring">
            <div className="section-header">
              <h1>🔄 Recurring Bills & Subscriptions</h1>
              <button 
                onClick={() => setShowRecurringForm(!showRecurringForm)}
                style={{
                  padding: '12px 24px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>+</span>
                <span>Add Recurring Bill</span>
              </button>
            </div>

            {/* Recurring Bill Form */}
            {showRecurringForm && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ marginBottom: '20px', color: 'var(--text)' }}>
                  {editingRecurringBill ? 'Edit Recurring Bill' : 'Add New Recurring Bill'}
                </h3>
                <form onSubmit={handleRecurringSubmit} style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Bill Name
                      </label>
                      <input
                        type="text"
                        value={recurringForm.name}
                        onChange={(e) => setRecurringForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text)',
                          fontSize: '16px'
                        }}
                        placeholder="e.g., Netflix, Rent, Electric Bill"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Amount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={recurringForm.amount}
                        onChange={(e) => setRecurringForm(prev => ({ ...prev, amount: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text)',
                          fontSize: '16px'
                        }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Frequency
                      </label>
                      <select
                        value={recurringForm.frequency}
                        onChange={(e) => setRecurringForm(prev => ({ ...prev, frequency: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text)',
                          fontSize: '16px'
                        }}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Category
                      </label>
                      <select
                        value={recurringForm.category}
                        onChange={(e) => setRecurringForm(prev => ({ ...prev, category: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text)',
                          fontSize: '16px'
                        }}
                      >
                        <option value="utilities">Utilities</option>
                        <option value="housing">Housing</option>
                        <option value="insurance">Insurance</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="software">Software/Subscriptions</option>
                        <option value="transportation">Transportation</option>
                        <option value="health">Health & Medical</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={recurringForm.startDate}
                        onChange={(e) => setRecurringForm(prev => ({ ...prev, startDate: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text)',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={recurringForm.endDate}
                        onChange={(e) => setRecurringForm(prev => ({ ...prev, endDate: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text)',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRecurringForm(false);
                        setEditingRecurringBill(null);
                        setRecurringForm({
                          name: '',
                          amount: '',
                          frequency: 'monthly',
                          category: 'utilities',
                          startDate: new Date().toISOString().split('T')[0],
                          endDate: ''
                        });
                      }}
                      style={{
                        padding: '12px 24px',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '12px 24px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {editingRecurringBill ? 'Update Bill' : 'Add Recurring Bill'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Recurring Bills List */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text)' }}>Your Recurring Bills</h3>
              {recurringBills.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
                  <p>No recurring bills set up yet</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>Click "Add Recurring Bill" to start automating your regular expenses</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recurringBills.map((bill, index) => {
                    // Calculate next due date
                    const getNextDueDate = (bill: any) => {
                      const startDate = new Date(bill.startDate || bill.createdAt);
                      const now = new Date();
                      let nextDue = new Date(startDate);

                      while (nextDue <= now) {
                        switch (bill.frequency) {
                          case 'weekly':
                            nextDue.setDate(nextDue.getDate() + 7);
                            break;
                          case 'biweekly':
                            nextDue.setDate(nextDue.getDate() + 14);
                            break;
                          case 'monthly':
                            nextDue.setMonth(nextDue.getMonth() + 1);
                            break;
                          case 'quarterly':
                            nextDue.setMonth(nextDue.getMonth() + 3);
                            break;
                          case 'yearly':
                            nextDue.setFullYear(nextDue.getFullYear() + 1);
                            break;
                        }
                      }
                      return nextDue;
                    };

                    const nextDue = getNextDueDate(bill);
                    const daysUntilDue = Math.ceil((nextDue.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
                    const isOverdue = daysUntilDue < 0;
                    const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

                    return (
                      <div key={bill.id || index} style={{
                        padding: '20px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        border: `1px solid ${isOverdue ? 'var(--danger)' : isDueSoon ? 'var(--warning)' : bill.isActive ? 'rgba(40, 167, 69, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                        opacity: bill.isActive ? 1 : 0.6,
                        position: 'relative'
                      }}>
                        {/* Due Date Alert Banner */}
                        {bill.isActive && (isOverdue || isDueSoon) && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            background: isOverdue ? 'var(--danger)' : 'var(--warning)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px 12px 0 0',
                            fontSize: '12px',
                            fontWeight: '600',
                            textAlign: 'center'
                          }}>
                            {isOverdue ? `OVERDUE by ${Math.abs(daysUntilDue)} days` : `DUE in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}
                          </div>
                        )}

                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          marginTop: (isOverdue || isDueSoon) ? '16px' : '0'
                        }}>
                          {/* Bill Information */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                            <div style={{ 
                              fontWeight: '700', 
                              color: 'var(--text)',
                              fontSize: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px'
                            }}>
                              {bill.name}
                              <span style={{
                                fontSize: '12px',
                                padding: '4px 8px',
                                background: bill.isActive ? 'var(--success)' : 'var(--secondary)',
                                color: 'white',
                                borderRadius: '12px',
                                fontWeight: '500'
                              }}>
                                {bill.isActive ? 'Active' : 'Paused'}
                              </span>
                            </div>
                            
                            <div style={{ 
                              fontSize: '16px', 
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px'
                            }}>
                              <span style={{ 
                                padding: '4px 8px', 
                                background: 'rgba(255, 255, 255, 0.1)', 
                                borderRadius: '6px',
                                fontSize: '14px'
                              }}>
                                {bill.category}
                              </span>
                              <span>{bill.frequency}</span>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: '600', color: 'var(--danger)' }}>
                                  {bill.isVariableAmount ? (
                                    <>
                                      {formatCurrency(bill.averageAmount || bill.amount)}
                                      <span style={{
                                        fontSize: '10px',
                                        color: 'var(--warning)',
                                        marginLeft: '4px',
                                        fontWeight: '400'
                                      }}>
                                        ~avg
                                      </span>
                                    </>
                                  ) : (
                                    formatCurrency(bill.amount)
                                  )}
                                </span>
                                
                                {/* Variable Amount Indicator */}
                                {bill.isVariableAmount && (
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    📊 {formatCurrency(bill.minAmount || bill.amount)} - {formatCurrency(bill.maxAmount || bill.amount)}
                                    {bill.provider && (
                                      <span style={{ marginLeft: '4px', color: 'var(--primary)' }}>
                                        • {bill.provider}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Due Date Information */}
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                              <div style={{ marginBottom: '4px' }}>
                                <strong>Next Due:</strong> {nextDue.toLocaleDateString()} 
                                {bill.isActive && (
                                  <span style={{ 
                                    marginLeft: '8px',
                                    color: isOverdue ? 'var(--danger)' : isDueSoon ? 'var(--warning)' : 'var(--success)'
                                  }}>
                                    ({isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : 
                                      isDueSoon ? `${daysUntilDue} days remaining` : 
                                      `${daysUntilDue} days away`})
                                  </span>
                                )}
                              </div>
                              <div>
                                <strong>Started:</strong> {new Date(bill.startDate || bill.createdAt).toLocaleDateString()}
                                {bill.endDate && (
                                  <span style={{ marginLeft: '16px' }}>
                                    <strong>Ends:</strong> {new Date(bill.endDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {/* Variable Amount Tracking Button */}
                              {bill.isActive && bill.isVariableAmount && (
                                <button
                                  onClick={() => {
                                    // Open actual amount logging modal
                                    setSelectedBillForHistory(bill);
                                    setShowBillHistoryModal(true);
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    background: 'var(--warning)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}
                                >
                                  📊 Log Amount
                                </button>
                              )}

                              {/* Mark as Paid Button */}
                              {bill.isActive && (
                                <button
                                  onClick={() => markBillAsPaid(bill)}
                                  style={{
                                    padding: '8px 12px',
                                    background: 'var(--success)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}
                                >
                                  💳 Mark Paid
                                </button>
                              )}
                              
                              {/* Edit Button */}
                              <button
                                onClick={() => {
                                  setEditingRecurringBill(bill);
                                  setRecurringForm({
                                    name: bill.name,
                                    amount: bill.amount.toString(),
                                    frequency: bill.frequency,
                                    category: bill.category,
                                    startDate: bill.startDate ? new Date(bill.startDate).toISOString().split('T')[0] : '',
                                    endDate: bill.endDate ? new Date(bill.endDate).toISOString().split('T')[0] : ''
                                  });
                                  setShowRecurringForm(true);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  background: 'var(--primary)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                ✏️ Edit
                              </button>

                              {/* Pause/Resume Button */}
                              <button
                                onClick={() => toggleRecurringBill(bill.id, bill.isActive)}
                                style={{
                                  padding: '8px 12px',
                                  background: bill.isActive ? 'var(--warning)' : 'var(--success)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                {bill.isActive ? '⏸️ Pause' : '▶️ Resume'}
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => deleteRecurringBill(bill.id)}
                                style={{
                                  padding: '8px 12px',
                                  background: 'var(--danger)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Goals Section */}
        {currentSection === 'goals' && (
          <section id="goals">
            <div className="section-header">
              <h1>🎯 Financial Goals & Targets</h1>
            </div>

            <div className="goals-grid">
              {goals.map((goal) => {
                const progressPercentage = Math.min((goal.current / goal.target) * 100, 100);
                const targetDate = new Date(goal.targetDate);
                const today = new Date();
                const monthsRemaining = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / (30 * 24 * 60 * 60 * 1000)));
                const monthlyNeeded = goal.type === 'debt' 
                  ? (goal.target - goal.current) / monthsRemaining 
                  : (goal.target - goal.current) / monthsRemaining;
                
                const progressColor = progressPercentage < 25 ? 'var(--danger)' : 
                                    progressPercentage < 75 ? 'var(--warning)' : 'var(--success)';

                return (
                  <div 
                    key={goal.id} 
                    className="goal-card"
                    style={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onClick={() => {
                      setEditingGoal(goal);
                      setShowGoalForm(true);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="goal-header">
                      <span className="goal-icon">{goal.icon}</span>
                      <h3>{goal.name}</h3>
                      <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        ✏️ Click to edit
                      </div>
                    </div>
                    <div className="goal-target">
                      <span className="current">{formatCurrency(goal.current)}</span>
                      <span className="separator"> / </span>
                      <span className="target">{formatCurrency(goal.target)}</span>
                    </div>
                    <div className="goal-progress">
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{
                          width: `${progressPercentage}%`, 
                          background: progressColor
                        }}></div>
                      </div>
                      <span className="progress-text">{progressPercentage.toFixed(1)}% Complete</span>
                    </div>
                    <div className="goal-deadline">
                      <span className="deadline-label">Target Date:</span>
                      <span className="deadline-date">{targetDate.toLocaleDateString()}</span>
                    </div>
                    <div className="goal-monthly">
                      <span className="monthly-label">
                        {goal.type === 'debt' ? 'Monthly Payment Needed:' : 'Monthly Savings Needed:'}
                      </span>
                      <span className="monthly-amount">{formatCurrency(Math.max(0, monthlyNeeded))}</span>
                    </div>
                  </div>
                );
              })}

              <div className="goal-card add-goal">
                <button 
                  className="add-goal-btn"
                  onClick={() => {
                    setEditingGoal(null);
                    setShowGoalForm(true);
                  }}
                >
                  <span className="plus-icon">+</span>
                  <span>Add New Goal</span>
                </button>
              </div>
            </div>

            <div className="goals-summary">
              <h3>📊 Goals Summary</h3>
              <div className="summary-stats">
                <div className="summary-stat">
                  <span className="stat-label">Total Goals</span>
                  <span className="stat-value">3</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Monthly Commitment</span>
                  <span className="stat-value negative">{formatCurrency(4018.57)}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Available for Goals</span>
                  <span className="stat-value negative">{formatCurrency(-2989.08)}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Goal Feasibility</span>
                  <span className="stat-value danger">Needs Adjustment</span>
                </div>
              </div>
            </div>

            {/* Goal Form */}
            {showGoalForm && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '24px',
                  maxWidth: '500px',
                  width: '90%',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{ marginBottom: '20px', color: 'var(--text)' }}>
                    {editingGoal ? 'Edit Goal' : 'Add New Goal'}
                  </h3>
                  <form style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                          Goal Name
                        </label>
                        <input
                          type="text"
                          defaultValue={editingGoal?.name || ''}
                          placeholder="e.g., Emergency Fund"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text)',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                          Icon
                        </label>
                        <input
                          type="text"
                          defaultValue={editingGoal?.icon || '🎯'}
                          placeholder="🎯"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text)',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                          Current Amount ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={editingGoal?.current || 0}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text)',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                          Target Amount ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={editingGoal?.target || 0}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text)',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                          Target Date
                        </label>
                        <input
                          type="date"
                          defaultValue={editingGoal?.targetDate || ''}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text)',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                          Goal Type
                        </label>
                        <select
                          defaultValue={editingGoal?.type || 'savings'}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text)',
                            fontSize: '16px'
                          }}
                        >
                          <option value="savings">Savings Goal</option>
                          <option value="debt">Debt Payoff</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowGoalForm(false);
                          setEditingGoal(null);
                        }}
                        style={{
                          padding: '12px 24px',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          padding: '12px 24px',
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {editingGoal ? 'Update Goal' : 'Add Goal'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Settings Section */}
        {currentSection === 'settings' && (
          <section id="settings">
            <div className="section-header">
              <h1>⚙️ Settings & Preferences</h1>
            </div>

            <div className="settings-container">
              <div className="settings-section">
                <h3>👤 Account Information</h3>
                <div className="settings-group">
                  <div className="setting-item">
                    <label>Email</label>
                    <input type="email" value="user@astralmoney.com" readOnly className="setting-input" />
                  </div>
                  <div className="setting-item">
                    <label>Current Balance</label>
                    <input type="text" value={formatCurrency(userBalance)} readOnly className="setting-input" />
                  </div>
                  <div className="setting-item">
                    <label>Account Created</label>
                    <input type="text" value="September 23, 2025" readOnly className="setting-input" />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>💰 Income Settings</h3>
                <div className="settings-group">
                  <div className="setting-item">
                    <label>Paycheck Amount</label>
                    <input type="text" value={formatCurrency(state.paycheckAmount)} className="setting-input" />
                  </div>
                  <div className="setting-item">
                    <label>Pay Frequency</label>
                    <select className="setting-input">
                      <option value="biweekly">Bi-Weekly</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="semimonthly">Semi-Monthly</option>
                    </select>
                  </div>
                  <div className="setting-item">
                    <label>Next Paycheck</label>
                    <input type="date" className="setting-input" />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>🔔 Notifications</h3>
                <div className="settings-group">
                  <div className="setting-toggle">
                    <label>Bill Due Reminders</label>
                    <input type="checkbox" checked className="toggle-input" />
                  </div>
                  <div className="setting-toggle">
                    <label>Low Balance Alerts</label>
                    <input type="checkbox" checked className="toggle-input" />
                  </div>
                  <div className="setting-toggle">
                    <label>Goal Progress Updates</label>
                    <input type="checkbox" checked className="toggle-input" />
                  </div>
                  <div className="setting-toggle">
                    <label>Weekly Summary Email</label>
                    <input type="checkbox" className="toggle-input" />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>🎨 Display Preferences</h3>
                <div className="settings-group">
                  <div className="setting-item">
                    <label>Currency</label>
                    <select className="setting-input">
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div className="setting-item">
                    <label>Date Format</label>
                    <select className="setting-input">
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="setting-item">
                    <label>Theme</label>
                    <select className="setting-input">
                      <option value="dark">Dark Mode</option>
                      <option value="light">Light Mode</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>📊 Data Export</h3>
                <div className="settings-group">
                  <div className="setting-item">
                    <label>Export your financial data for backup or analysis</label>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <button 
                        onClick={() => exportData('json')}
                        style={{
                          padding: '10px 20px',
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        📋 Export JSON
                      </button>
                      <button 
                        onClick={() => exportData('csv')}
                        style={{
                          padding: '10px 20px',
                          background: 'var(--success)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        📊 Export CSV
                      </button>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      JSON includes all data, CSV is optimized for spreadsheet analysis
                    </div>
                  </div>
                  <div className="setting-item">
                    <label>Data Summary</label>
                    <div style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '14px',
                      color: 'var(--text-secondary)'
                    }}>
                      <div>• {expenses.length} expense records</div>
                      <div>• {income.length} income records</div>
                      <div>• Current balance: {formatCurrency(userBalance)}</div>
                      <div>• Data as of: {new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                <button className="btn btn-primary">Save Changes</button>
                <button className="btn btn-danger">Reset Settings</button>
              </div>
            </div>
          </section>
        )}
      </main>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        .month-selector {
          display: flex;
          gap: 12px;
        }
        .month-btn {
          padding: 8px 16px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .month-btn:hover {
          background: var(--surface-light);
          color: var(--text-primary);
        }
        .month-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .month-stats {
          display: flex;
          gap: 24px;
          margin: 24px 0;
        }
        .stat-card {
          flex: 1;
          padding: 20px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .stat-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
        }
        .stat-value.positive {
          color: var(--success);
        }
        .stat-value.negative {
          color: var(--danger);
        }
        .bills-list {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 20px;
        }
        .bill-row {
          display: grid;
          grid-template-columns: 40px 100px 1fr 120px 120px 100px;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-secondary);
          transition: background 0.2s ease;
        }
        .bill-row:hover {
          background: var(--surface-light);
        }
        .bill-checkbox {
          width: 20px;
          height: 20px;
        }
        .bill-date {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .bill-name {
          font-weight: 600;
        }
        .bill-category {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .bill-amount {
          font-weight: 600;
          text-align: right;
        }
        .bill-amount.income {
          color: var(--success);
        }
        .bill-amount.expense {
          color: var(--danger);
        }
        .bill-status {
          text-align: center;
          font-size: 0.9rem;
        }
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }
        .analytics-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 24px;
        }
        .analytics-card h3 {
          margin-bottom: 20px;
          color: var(--text-primary);
        }
        .category-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .category-item {
          display: grid;
          grid-template-columns: 120px 1fr 80px;
          align-items: center;
          gap: 12px;
        }
        .category-bar {
          height: 20px;
          background: var(--surface-dark);
          border-radius: 10px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
        }
        .trend-chart {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 200px;
          margin: 20px 0;
        }
        .trend-month {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .month-bars {
          display: flex;
          gap: 8px;
          align-items: flex-end;
          height: 150px;
        }
        .income-bar {
          width: 40px;
          background: var(--success);
          border-radius: 4px 4px 0 0;
        }
        .expense-bar {
          width: 40px;
          background: var(--danger);
          border-radius: 4px 4px 0 0;
        }
        .trend-legend {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 16px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }
        .legend-color.income {
          background: var(--success);
        }
        .legend-color.expense {
          background: var(--danger);
        }
        .performance-metrics {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--surface-dark);
          border-radius: 8px;
        }
        .metric-value {
          font-size: 1.2rem;
          font-weight: 700;
        }
        .metric-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
        }
        .metric-status.danger {
          background: rgba(239, 68, 68, 0.2);
          color: var(--danger);
        }
        .metric-status.warning {
          background: rgba(245, 158, 11, 0.2);
          color: var(--warning);
        }
        .insights {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .insight-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--surface-dark);
          border-radius: 8px;
        }
        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        .goal-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .goal-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .goal-icon {
          font-size: 1.5rem;
        }
        .goal-target {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .goal-target .current {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .goal-target .target {
          font-size: 1.2rem;
          color: var(--text-secondary);
        }
        .goal-progress {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .progress-bar-container {
          height: 8px;
          background: var(--surface-dark);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
        }
        .goal-deadline, .goal-monthly {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        .deadline-label, .monthly-label {
          color: var(--text-secondary);
        }
        .add-goal {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .add-goal-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 32px;
          background: transparent;
          border: 2px dashed var(--glass-border);
          border-radius: 12px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }
        .add-goal-btn:hover {
          background: var(--surface-light);
          border-color: var(--primary);
          color: var(--primary);
        }
        .plus-icon {
          font-size: 2rem;
        }
        .goals-summary {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 24px;
        }
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 16px;
        }
        .summary-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          background: var(--surface-dark);
          border-radius: 8px;
        }
        .settings-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .settings-section {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 24px;
        }
        .settings-section h3 {
          margin-bottom: 20px;
        }
        .settings-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .setting-item {
          display: grid;
          grid-template-columns: 200px 1fr;
          align-items: center;
          gap: 16px;
        }
        .setting-item label {
          color: var(--text-secondary);
        }
        .setting-input {
          padding: 8px 12px;
          background: var(--surface-dark);
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 1rem;
        }
        .setting-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-secondary);
        }
        .toggle-input {
          width: 20px;
          height: 20px;
        }
        .settings-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background: var(--primary);
          color: white;
        }
        .btn-primary:hover {
          background: var(--primary-dark);
        }
        .btn-secondary {
          background: var(--surface-light);
          color: var(--text-primary);
        }
        .btn-secondary:hover {
          background: var(--surface-dark);
        }
        .btn-danger {
          background: var(--danger);
          color: white;
        }
        .btn-danger:hover {
          background: #dc2626;
        }
        
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .container {
            margin: 0;
            padding: 8px;
          }
          
          .header {
            padding: 16px 8px;
          }
          
          .nav-menu {
            display: flex;
            overflow-x: auto;
            padding: 8px;
            gap: 8px;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .nav-menu::-webkit-scrollbar {
            display: none;
          }
          
          .nav-item {
            flex: 0 0 auto;
          }
          
          .nav-link {
            padding: 10px 14px;
            font-size: 13px;
            min-width: 80px;
            text-align: center;
          }
          
          .nav-link span {
            display: block;
          }
          
          .nav-icon {
            font-size: 18px;
            margin-bottom: 2px;
          }
          
          .main-content {
            padding: 16px 8px;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .section-header h1 {
            font-size: 22px;
          }
          
          .dashboard-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .analytics-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .goals-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .current-balance {
            font-size: 16px;
          }
          
          .dashboard-card {
            padding: 16px;
          }
          
          .analytics-card {
            padding: 16px;
          }
          
          .goal-card {
            padding: 16px;
          }
          
          /* Mobile Form Styles */
          form {
            gap: 12px !important;
          }
          
          form > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          
          input, select, textarea {
            font-size: 16px !important; /* Prevents zoom on iOS */
          }
          
          /* Mobile Button Styles */
          button {
            min-height: 44px; /* Touch target size */
            font-size: 14px;
          }
          
          /* Mobile Settings */
          .settings-container {
            gap: 16px;
          }
          
          .settings-section {
            padding: 16px;
          }
          
          .settings-actions {
            flex-direction: column;
            gap: 12px;
          }
          
          .settings-actions button {
            width: 100%;
          }
        }
        
        /* Tablet Styles */
        @media (max-width: 1024px) and (min-width: 769px) {
          .dashboard-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .analytics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .goals-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .nav-menu {
            gap: 12px;
            padding: 0 16px;
          }
          
          .main-content {
            padding: 24px 16px;
          }
        }
        
        /* Small Mobile Styles */
        @media (max-width: 480px) {
          .header {
            padding: 12px 8px;
          }
          
          .header h1 {
            font-size: 20px;
          }
          
          .section-header h1 {
            font-size: 20px;
          }
          
          .current-balance {
            font-size: 14px;
          }
          
          .dashboard-card .card-value {
            font-size: 20px;
          }
          
          .nav-link {
            padding: 8px 10px;
            font-size: 12px;
            min-width: 70px;
          }
          
          .nav-icon {
            font-size: 16px;
          }
          
          button {
            padding: 8px 12px !important;
            font-size: 13px !important;
          }
          
          input, select, textarea {
            padding: 10px !important;
            font-size: 16px !important;
          }
        }
      `}</style>

      {/* Bill History Modal - Temporarily disabled for build testing */}
      {false && showBillHistoryModal && selectedBillForHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '32px',
            minWidth: '500px',
            maxWidth: '600px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px' 
            }}>
              <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
                📊 Log Actual Amount - {selectedBillForHistory.name}
              </h2>
              <button
                onClick={() => {
                  setShowBillHistoryModal(false);
                  setSelectedBillForHistory(null);
                  setBillHistoryForm({
                    actualAmount: '',
                    estimatedAmount: '',
                    billDate: new Date().toISOString().split('T')[0],
                    isPaid: false,
                    notes: ''
                  });
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  fontSize: '20px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Bill Info Summary */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ color: 'white', fontSize: '14px', marginBottom: '8px' }}>
                <strong>Provider:</strong> {selectedBillForHistory.provider || 'Not specified'}
              </div>
              <div style={{ color: 'white', fontSize: '14px', marginBottom: '8px' }}>
                <strong>Expected Range:</strong> ${selectedBillForHistory.minAmount?.toFixed(2) || '0.00'} - ${selectedBillForHistory.maxAmount?.toFixed(2) || '0.00'}
              </div>
              <div style={{ color: 'white', fontSize: '14px' }}>
                <strong>Recent Average:</strong> ${selectedBillForHistory.averageAmount?.toFixed(2) || '0.00'}
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const response = await fetch('/api/recurring/history', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recurringBillId: selectedBillForHistory.id,
                    actualAmount: parseFloat(billHistoryForm.actualAmount),
                    estimatedAmount: selectedBillForHistory.averageAmount || selectedBillForHistory.amount,
                    billDate: billHistoryForm.billDate,
                    isPaid: billHistoryForm.isPaid,
                    notes: billHistoryForm.notes
                  })
                });

                if (response.ok) {
                  showToast('success', 'Bill amount logged successfully!');
                  setShowBillHistoryModal(false);
                  setSelectedBillForHistory(null);
                  setBillHistoryForm({
                    actualAmount: '',
                    estimatedAmount: '',
                    billDate: new Date().toISOString().split('T')[0],
                    isPaid: false,
                    notes: ''
                  });
                  // Refresh recurring bills to update statistics
                  loadRecurringBills();
                } else {
                  showToast('error', 'Failed to log bill amount');
                }
              } catch (error) {
                console.error('Error logging bill amount:', error);
                showToast('error', 'Failed to log bill amount');
              }
            }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '14px' }}>
                      Actual Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={billHistoryForm.actualAmount}
                      onChange={(e) => setBillHistoryForm(prev => ({ ...prev, actualAmount: e.target.value }))}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '16px'
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '14px' }}>
                      Bill Date *
                    </label>
                    <input
                      type="date"
                      value={billHistoryForm.billDate}
                      onChange={(e) => setBillHistoryForm(prev => ({ ...prev, billDate: e.target.value }))}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '14px' }}>
                    Notes (optional)
                  </label>
                  <textarea
                    value={billHistoryForm.notes}
                    onChange={(e) => setBillHistoryForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Any notes about this bill..."
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="isPaid"
                    checked={billHistoryForm.isPaid}
                    onChange={(e) => setBillHistoryForm(prev => ({ ...prev, isPaid: e.target.checked }))}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <label htmlFor="isPaid" style={{ color: 'white', fontSize: '14px' }}>
                    Mark as paid
                  </label>
                </div>

                {/* Variance Alert */}
                {billHistoryForm.actualAmount && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: (() => {
                      const actualAmount = parseFloat(billHistoryForm.actualAmount);
                      const expectedAmount = selectedBillForHistory.averageAmount || selectedBillForHistory.amount;
                      const difference = Math.abs(actualAmount - expectedAmount);
                      const percentDiff = expectedAmount > 0 ? (difference / expectedAmount) * 100 : 0;
                      
                      if (percentDiff < 15) return 'rgba(40, 167, 69, 0.2)'; // Green
                      if (percentDiff < 40) return 'rgba(255, 193, 7, 0.2)'; // Yellow
                      return 'rgba(220, 53, 69, 0.2)'; // Red
                    })(),
                    border: `1px solid ${(() => {
                      const actualAmount = parseFloat(billHistoryForm.actualAmount);
                      const expectedAmount = selectedBillForHistory.averageAmount || selectedBillForHistory.amount;
                      const difference = Math.abs(actualAmount - expectedAmount);
                      const percentDiff = expectedAmount > 0 ? (difference / expectedAmount) * 100 : 0;
                      
                      if (percentDiff < 15) return 'rgba(40, 167, 69, 0.5)';
                      if (percentDiff < 40) return 'rgba(255, 193, 7, 0.5)';
                      return 'rgba(220, 53, 69, 0.5)';
                    })()`
                  }}>
                    {(() => {
                      const actualAmount = parseFloat(billHistoryForm.actualAmount);
                      const expectedAmount = selectedBillForHistory.averageAmount || selectedBillForHistory.amount;
                      const difference = actualAmount - expectedAmount;
                      const percentDiff = expectedAmount > 0 ? (Math.abs(difference) / expectedAmount) * 100 : 0;
                      
                      if (percentDiff < 15) {
                        return (
                          <div style={{ color: 'white', fontSize: '14px' }}>
                            ✅ Amount is within normal range (${difference > 0 ? '+' : ''}${difference.toFixed(2)} vs expected)
                          </div>
                        );
                      } else if (percentDiff < 40) {
                        return (
                          <div style={{ color: 'white', fontSize: '14px' }}>
                            ⚠️ Amount is {percentDiff.toFixed(0)}% {difference > 0 ? 'higher' : 'lower'} than expected
                          </div>
                        );
                      } else {
                        return (
                          <div style={{ color: 'white', fontSize: '14px' }}>
                            🚨 Amount is significantly {difference > 0 ? 'higher' : 'lower'} than expected ({percentDiff.toFixed(0)}% difference)
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: 'var(--success)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    📊 Log Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBillHistoryModal(false);
                      setSelectedBillForHistory(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Error Boundary Fallback Component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-6">We apologize for the inconvenience. Please try refreshing the page.</p>
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Refresh Page
          </button>
        </div>
        <details className="mt-4 text-left">
          <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
          <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
      </div>
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