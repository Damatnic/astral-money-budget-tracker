/**
 * Main Dashboard Component
 * Orchestrates all dashboard sections and manages global state
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Transaction, FinancialGoal, RecurringBill, Notification, LoadingState, ErrorState } from '@/types';
import { Toast } from '@/components/common/Toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { NotificationOverlay } from './NotificationOverlay';
import { DashboardHeader } from './DashboardHeader';
import { FinancialSummary, DetailedFinancialSummary } from './FinancialSummary';
import { TransactionManager } from './TransactionManager';
import { GoalsSection } from './GoalsSection';
import { BillsSection } from './BillsSection';
import { BudgetManager } from '@/components/budget/BudgetManager';
import { BudgetTracker } from '@/components/analytics/BudgetTracker';
import { SpendingAnalytics } from '@/components/analytics/SpendingAnalytics';
import { NetWorthTracker } from '@/components/wealth/NetWorthTracker';
import { FinancialHealthScore } from '@/components/insights/FinancialHealthScore';
import { DataExporter } from '@/components/export/DataExporter';
import { formatCurrency } from '@/utils/formatters';
import { CompactThemeToggle } from '@/components/common/ThemeToggle';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { WelcomeMessage } from './WelcomeMessage';
import { SmartInsights } from '@/components/insights/SmartInsights';
import { SpendingTrendsChart, CategoryBreakdownChart, MonthlyComparisonChart, GoalsProgressChart, FinancialHealthRadar } from '@/components/charts/AdvancedCharts';
import { FinancialSparkline, SparklineCard } from '@/components/charts/Sparkline';
import { QuickStatsCard, AnimatedCounter, AnimatedPercentage } from '@/components/ui/AnimatedCounter';
import { SkeletonWrapper, DashboardStatsSkeleton, ChartSkeleton, SparklineCardSkeleton } from '@/components/ui/Skeleton';
import { NotificationSystem } from '@/components/notifications/NotificationSystem';

interface MainDashboardProps {
  initialData?: {
    transactions?: Transaction[];
    goals?: FinancialGoal[];
    bills?: RecurringBill[];
    balance?: number;
  };
}

export function MainDashboard({ initialData }: MainDashboardProps) {
  // Session management
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Global state management
  const [transactions, setTransactions] = useState<Transaction[]>(initialData?.transactions || []);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [bills, setBills] = useState<RecurringBill[]>(initialData?.bills || []);
  const [balance, setBalance] = useState(initialData?.balance || 0);
  
  // UI state
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState<LoadingState>({
    userData: true, // Start with loading true
    expenses: false,
    income: false,
    recurringBills: true,
    goals: true,
    creating: false,
    updating: false,
    deleting: false,
  });
  const [errors, setErrors] = useState<ErrorState>({
    userData: null,
    expenses: null,
    income: null,
    recurringBills: null,
    goals: null,
    form: null,
  });

  // Notification management
  const addToast = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
    };
    setToasts(prev => [...prev, newNotification]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Navigation state management - MUST be before any returns
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'budget' | 'goals' | 'bills' | 'analytics' | 'export'>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  // Fetch user data on mount
  const fetchUserData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      const [balanceRes, billsRes, goalsRes, transactionsRes] = await Promise.allSettled([
        fetch('/api/user/balance'),
        fetch('/api/recurring'),
        fetch('/api/goals'),
        fetch('/api/expenses')
      ]);

      // Handle balance
      if (balanceRes.status === 'fulfilled' && balanceRes.value.ok) {
        const data = await balanceRes.value.json();
        setBalance(data.balance || 0);
      } else {
        setErrors(prev => ({ ...prev, userData: 'Failed to load balance' }));
      }

      // Handle bills
      if (billsRes.status === 'fulfilled' && billsRes.value.ok) {
        const data = await billsRes.value.json();
        setBills(data.recurring || []);
      } else {
        setErrors(prev => ({ ...prev, recurringBills: 'Failed to load recurring bills' }));
      }
      setLoading(prev => ({ ...prev, recurringBills: false }));

      // Handle goals
      if (goalsRes.status === 'fulfilled' && goalsRes.value.ok) {
        const data = await goalsRes.value.json();
        if (data.success && data.data?.goals) {
          setGoals(data.data.goals);
        }
      } else {
        setErrors(prev => ({ ...prev, goals: 'Failed to load financial goals' }));
      }
      setLoading(prev => ({ ...prev, goals: false }));

      // Handle transactions
      if (transactionsRes.status === 'fulfilled' && transactionsRes.value.ok) {
        const data = await transactionsRes.value.json();
        if (data.success && data.data?.transactions) {
          setTransactions(data.data.transactions);
        } else {
          setTransactions([]);
        }
      } else {
        setErrors(prev => ({ ...prev, expenses: 'Failed to load transactions' }));
      }

      setLoading(prev => ({ ...prev, userData: false }));
    } catch (error) {
      setErrors(prev => ({ ...prev, userData: 'Failed to load dashboard data' }));
      setLoading(prev => ({ 
        ...prev, 
        userData: false, 
        recurringBills: false, 
        goals: false 
      }));
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserData();
    }
  }, [status, session, fetchUserData]);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Global keyboard shortcuts - MUST be before any returns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Transaction handlers
  const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    setLoading(prev => ({ ...prev, creating: true }));
    try {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      // Make API call to create transaction
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      const result = await response.json();
      
      if (result.success && result.data?.transaction) {
        const newTransaction: Transaction = result.data.transaction;
        setTransactions(prev => [newTransaction, ...prev]);
        
        // Update balance from API response
        if (result.data.newBalance !== undefined) {
          setBalance(result.data.newBalance);
        }
      } else {
        throw new Error('Invalid response from server');
      }
      
      addToast({
        type: 'success',
        title: 'Transaction Added',
        message: `${transaction.type === 'income' ? 'Income' : 'Expense'} recorded successfully`,
        priority: 'medium'
      });
    } catch (error) {
      // Log error securely without exposing sensitive data
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to add transaction. Please try again.',
        priority: 'high'
      });
    } finally {
      setLoading(prev => ({ ...prev, creating: false }));
    }
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setLoading(prev => ({ ...prev, updating: true }));
    try {
      const response = await fetch('/api/expenses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update transaction');
      }

      const result = await response.json();
      
      if (result.success && result.data?.transaction) {
        setTransactions(prev => 
          prev.map(t => t.id === id ? result.data.transaction : t)
        );
        
        // Update balance from API response
        if (result.data.newBalance !== undefined) {
          setBalance(result.data.newBalance);
        }
        
        addToast({
          type: 'success',
          title: 'Updated',
          message: 'Transaction updated successfully',
          priority: 'medium'
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error', 
        message: error instanceof Error ? error.message : 'Failed to update transaction.',
        priority: 'high'
      });
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setLoading(prev => ({ ...prev, deleting: true }));
    try {
      const response = await fetch('/api/expenses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete transaction');
      }

      const result = await response.json();
      
      if (result.success) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        
        // Update balance from API response
        if (result.data?.newBalance !== undefined) {
          setBalance(result.data.newBalance);
        }
        
        addToast({
          type: 'success',
          title: 'Deleted',
          message: 'Transaction removed successfully',
          priority: 'medium'
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete transaction.',
        priority: 'high'
      });
    } finally {
      setLoading(prev => ({ ...prev, deleting: false }));
    }
  };

  // Bills handlers
  const handleAddBill = async (bill: Omit<RecurringBill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    setLoading(prev => ({ ...prev, creating: true }));
    try {
      const response = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bill)
      });

      if (response.ok) {
        const data = await response.json();
        setBills(prev => [...prev, data.recurring]);
        addToast({
          type: 'success',
          title: 'Bill Added',
          message: `${bill.name} has been added to your recurring bills`,
          priority: 'medium'
        });
      } else {
        throw new Error('Failed to add bill');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to add recurring bill. Please try again.',
        priority: 'high'
      });
    } finally {
      setLoading(prev => ({ ...prev, creating: false }));
    }
  };

  const handleUpdateBill = async (id: string, updates: Partial<RecurringBill>) => {
    setLoading(prev => ({ ...prev, updating: true }));
    try {
      const response = await fetch('/api/recurring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });

      if (response.ok) {
        const data = await response.json();
        setBills(prev => prev.map(b => b.id === id ? data.recurring : b));
        addToast({
          type: 'success',
          title: 'Bill Updated',
          message: 'Recurring bill updated successfully',
          priority: 'medium'
        });
      } else {
        throw new Error('Failed to update bill');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update recurring bill.',
        priority: 'high'
      });
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
  };

  const handleDeleteBill = async (id: string) => {
    setLoading(prev => ({ ...prev, deleting: true }));
    try {
      const response = await fetch('/api/recurring', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        setBills(prev => prev.filter(b => b.id !== id));
        addToast({
          type: 'success',
          title: 'Bill Deleted',
          message: 'Recurring bill removed successfully',
          priority: 'medium'
        });
      } else {
        throw new Error('Failed to delete bill');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete recurring bill.',
        priority: 'high'
      });
    } finally {
      setLoading(prev => ({ ...prev, deleting: false }));
    }
  };

  // Handle authentication loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle unauthenticated state (shouldn't happen with middleware, but safety check)
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  // Calculate monthly income for components
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && 
      new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  // Command palette handlers
  const handleNavigateToTab = (tab: string) => {
    setPageTransition(true);
    setTimeout(() => {
      setActiveTab(tab as any);
      setPageTransition(false);
    }, 150);
  };

  const handleQuickAddTransaction = () => {
    setActiveTab('transactions');
    // Could trigger a modal or form focus here
  };

  const handleQuickAddGoal = () => {
    setActiveTab('goals');
    // Could trigger goal creation modal
  };

  const handleQuickAddBill = () => {
    setActiveTab('bills');
    // Could trigger bill creation modal
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Toast Notifications */}
      <div className="toast-container fixed top-4 right-4 z-[100]">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            notification={toast} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>

      {/* Notification Overlays */}
      <NotificationOverlay
        isOffline={isOffline}
        loading={loading}
        errors={errors}
      />

      {/* Smart Notification System */}
      <div className="fixed top-20 right-4 z-[90] max-w-sm">
        <NotificationSystem
          transactions={transactions}
          bills={bills}
          goals={goals}
          balance={balance}
          onNotification={addToast}
        />
      </div>

      {/* Sidebar Navigation */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <span className="ml-3 font-bold text-gray-900">Astral Money</span>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* User Info */}
        {!sidebarCollapsed && session && (
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {session.user?.name?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{session.user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
              </div>
            </div>
            <div className="mt-3 p-2 bg-white rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Current Balance</p>
              <p className={`text-lg font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'overview', label: 'Overview', icon: 'M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z' },
            { id: 'transactions', label: 'Transactions', icon: 'M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h6zM4 14a2 2 0 002 2h8a2 2 0 002-2v-2H4v2z' },
            { id: 'budget', label: 'Budget', icon: 'M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z' },
            { id: 'goals', label: 'Goals', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'bills', label: 'Bills', icon: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z' },
            { id: 'analytics', label: 'Analytics', icon: 'M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' },
            { id: 'export', label: 'Export', icon: 'M4 16v1a3 3 0 003 3h6a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigateToTab(item.id)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover-lift ${
                activeTab === item.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? item.label : ''}
            >
              <svg className={`w-5 h-5 ${!sidebarCollapsed && 'mr-3'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d={item.icon} clipRule="evenodd" />
              </svg>
              {!sidebarCollapsed && item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          {!sidebarCollapsed && isOffline && (
            <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-orange-800">Offline Mode</span>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
            title={sidebarCollapsed ? 'Sign Out' : ''}
          >
            <svg className={`w-5 h-5 ${!sidebarCollapsed && 'mr-3'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            {!sidebarCollapsed && 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 capitalize">{activeTab}</h1>
              <FinancialSummary transactions={transactions} balance={balance} />
            </div>
            <div className="flex items-center space-x-3">
              <CompactThemeToggle />
              {activeTab !== 'export' && (
                <DataExporter
                  transactions={transactions}
                  bills={bills}
                  goals={goals}
                  balance={balance}
                />
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className={`flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6 transition-opacity duration-150 ${
          pageTransition ? 'opacity-0' : 'opacity-100'
        }`}>
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Welcome Message */}
              <WelcomeMessage 
                transactions={transactions}
                balance={balance}
                className="animate-slide-in-top"
              />
              
              {/* Quick Stats Cards */}
              <SkeletonWrapper
                loading={loading.userData}
                skeleton={<DashboardStatsSkeleton />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <QuickStatsCard
                    title="Total Balance"
                    value={balance}
                    isCurrency={true}
                    trend={balance >= 0 ? 'up' : 'down'}
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h6zM4 14a2 2 0 002 2h8a2 2 0 002-2v-2H4v2z" />
                      </svg>
                    }
                    className="animate-slide-in-bottom animate-stagger-1"
                  />
                  
                  <QuickStatsCard
                    title="Monthly Income"
                    value={monthlyIncome}
                    isCurrency={true}
                    trend="up"
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    }
                    className="animate-slide-in-bottom animate-stagger-2"
                  />
                  
                  <QuickStatsCard
                    title="Active Goals"
                    value={goals.length}
                    suffix=" goals"
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                      </svg>
                    }
                    className="animate-slide-in-bottom animate-stagger-3"
                  />
                  
                  <QuickStatsCard
                    title="Recurring Bills"
                    value={bills.length}
                    suffix=" bills"
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    }
                    className="animate-slide-in-bottom animate-stagger-4"
                  />
                </div>
              </SkeletonWrapper>

              {/* Sparkline Charts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SkeletonWrapper
                  loading={loading.userData}
                  skeleton={<SparklineCardSkeleton />}
                >
                  <FinancialSparkline
                    transactions={transactions}
                    period="month"
                    type="income"
                  />
                </SkeletonWrapper>
                
                <SkeletonWrapper
                  loading={loading.userData}
                  skeleton={<SparklineCardSkeleton />}
                >
                  <FinancialSparkline
                    transactions={transactions}
                    period="month"
                    type="expense"
                  />
                </SkeletonWrapper>
                
                <SkeletonWrapper
                  loading={loading.userData}
                  skeleton={<SparklineCardSkeleton />}
                >
                  <FinancialSparkline
                    transactions={transactions}
                    period="month"
                    type="balance"
                  />
                </SkeletonWrapper>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Smart Insights */}
                <SmartInsights
                  transactions={transactions}
                  bills={bills}
                  goals={goals}
                  balance={balance}
                  monthlyIncome={monthlyIncome}
                  className="animate-slide-in-left"
                />
                
                {/* Recent Transactions */}
                <TransactionManager
                  transactions={transactions.slice(0, 5)}
                  onAdd={handleAddTransaction}
                  onUpdate={handleUpdateTransaction}
                  onDelete={handleDeleteTransaction}
                  loading={loading}
                  compact={true}
                />
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Goals Progress */}
                <GoalsSection 
                  goals={goals} 
                  loading={loading.goals} 
                  onUpdate={(updatedGoals) => setGoals(updatedGoals)} 
                  compact={true}
                />
                
                {/* Upcoming Bills */}
                <BillsSection 
                  bills={bills.slice(0, 5)}
                  loading={loading.recurringBills}
                  onAdd={handleAddBill}
                  onUpdate={handleUpdateBill}
                  onDelete={handleDeleteBill}
                  compact={true}
                />
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="max-w-7xl mx-auto">
              <TransactionManager
                transactions={transactions}
                onAdd={handleAddTransaction}
                onUpdate={handleUpdateTransaction}
                onDelete={handleDeleteTransaction}
                loading={loading}
              />
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">
              <BudgetManager 
                transactions={transactions}
                bills={bills}
                monthlyIncome={monthlyIncome}
              />
              <BudgetTracker
                transactions={transactions}
                bills={bills}
                monthlyIncome={monthlyIncome}
                budgetMethod="50/30/20"
              />
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="max-w-4xl mx-auto">
              <GoalsSection 
                goals={goals} 
                loading={loading.goals} 
                onUpdate={(updatedGoals) => setGoals(updatedGoals)} 
              />
            </div>
          )}

          {activeTab === 'bills' && (
            <div className="max-w-4xl mx-auto">
              <BillsSection 
                bills={bills}
                loading={loading.recurringBills}
                onAdd={handleAddBill}
                onUpdate={handleUpdateBill}
                onDelete={handleDeleteBill}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              {/* Advanced Charts Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <SkeletonWrapper
                  loading={loading.userData}
                  skeleton={<ChartSkeleton height={350} />}
                >
                  <SpendingTrendsChart 
                    transactions={transactions} 
                    period="month"
                    className="animate-slide-in-left"
                  />
                </SkeletonWrapper>
                
                <SkeletonWrapper
                  loading={loading.userData}
                  skeleton={<ChartSkeleton height={400} />}
                >
                  <CategoryBreakdownChart 
                    transactions={transactions}
                    type="expense"
                    className="animate-slide-in-right"
                  />
                </SkeletonWrapper>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <SkeletonWrapper
                  loading={loading.userData}
                  skeleton={<ChartSkeleton height={400} />}
                >
                  <MonthlyComparisonChart 
                    transactions={transactions}
                    className="animate-slide-in-left animate-stagger-1"
                  />
                </SkeletonWrapper>
                
                <SkeletonWrapper
                  loading={loading.goals}
                  skeleton={<ChartSkeleton height={350} />}
                >
                  <GoalsProgressChart 
                    goals={goals}
                    className="animate-slide-in-right animate-stagger-1"
                  />
                </SkeletonWrapper>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <SkeletonWrapper
                  loading={loading.userData}
                  skeleton={<ChartSkeleton height={350} />}
                >
                  <FinancialHealthRadar
                    transactions={transactions}
                    bills={bills}
                    goals={goals}
                    balance={balance}
                    monthlyIncome={monthlyIncome}
                    className="animate-slide-in-left animate-stagger-2"
                  />
                </SkeletonWrapper>
                
                <div className="space-y-6 animate-slide-in-right animate-stagger-2">
                  <SpendingAnalytics transactions={transactions} monthlyIncome={monthlyIncome} />
                  <FinancialHealthScore
                    transactions={transactions}
                    bills={bills}
                    goals={goals}
                    balance={balance}
                    monthlyIncome={monthlyIncome}
                  />
                </div>
              </div>
              
              <NetWorthTracker />
            </div>
          )}

          {activeTab === 'export' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h2>
                <DataExporter
                  transactions={transactions}
                  bills={bills}
                  goals={goals}
                  balance={balance}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        transactions={transactions}
        goals={goals}
        bills={bills}
        onNavigate={handleNavigateToTab}
        onAddTransaction={handleQuickAddTransaction}
        onAddGoal={handleQuickAddGoal}
        onAddBill={handleQuickAddBill}
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-50">
        {/* Command Palette Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover-lift"
          title="Command Palette (Cmd+K)"
        >
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Quick Add Transaction Button */}
        <button
          onClick={handleQuickAddTransaction}
          className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover-lift btn-pulse"
          title="Quick Add Transaction"
        >
          <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}