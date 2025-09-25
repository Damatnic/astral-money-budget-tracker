/**
 * Main Dashboard Component
 * Orchestrates all dashboard sections and manages global state
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Transaction, Goal, RecurringBill, Notification, LoadingState, ErrorState } from '@/types';
import { Toast } from '@/components/common/Toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { NotificationOverlay } from './NotificationOverlay';
import { DashboardHeader } from './DashboardHeader';
import { FinancialSummary } from './FinancialSummary';
import { TransactionManager } from './TransactionManager';
import { GoalsSection } from './GoalsSection';
import { BillsSection } from './BillsSection';

interface MainDashboardProps {
  initialData?: {
    transactions?: Transaction[];
    goals?: Goal[];
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
  const [goals, setGoals] = useState<Goal[]>(initialData?.goals || []);
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

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  // Fetch user data on mount
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserData();
    }
  }, [status, session]);

  const fetchUserData = async () => {
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
    }

    // Handle bills
    if (billsRes.status === 'fulfilled' && billsRes.value.ok) {
      const data = await billsRes.value.json();
      setBills(data.recurring || []);
    }
    setLoading(prev => ({ ...prev, recurringBills: false }));

    // Handle goals
    if (goalsRes.status === 'fulfilled' && goalsRes.value.ok) {
      const data = await goalsRes.value.json();
      setGoals(data.goals || []);
    }
    setLoading(prev => ({ ...prev, goals: false }));

    // Handle transactions
    if (transactionsRes.status === 'fulfilled' && transactionsRes.value.ok) {
      const data = await transactionsRes.value.json();
      setTransactions(data.transactions || []);
    }

    setLoading(prev => ({ ...prev, userData: false }));
  };

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

  // Transaction handlers
  const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    setLoading(prev => ({ ...prev, creating: true }));
    try {
      const newTransaction: Transaction = {
        ...transaction,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Update balance based on transaction type
      const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      setBalance(prev => prev + amount);
      
      addToast({
        type: 'success',
        title: 'Transaction Added',
        message: `${transaction.type === 'income' ? 'Income' : 'Expense'} recorded successfully`,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Failed to add transaction:', error);
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
      setTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      );
      addToast({
        type: 'success',
        title: 'Updated',
        message: 'Transaction updated successfully',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Failed to update transaction:', error);
      addToast({
        type: 'error',
        title: 'Error', 
        message: 'Failed to update transaction.',
        priority: 'high'
      });
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setLoading(prev => ({ ...prev, deleting: true }));
    try {
      const transaction = transactions.find(t => t.id === id);
      if (transaction) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        
        // Reverse balance update
        const amount = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        setBalance(prev => prev + amount);
      }
      addToast({
        type: 'success',
        title: 'Deleted',
        message: 'Transaction removed successfully',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete transaction.',
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
      console.error('Failed to add bill:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to add recurring bill. Please try again.',
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
      console.error('Failed to update bill:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update recurring bill.',
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
      console.error('Failed to delete bill:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete recurring bill.',
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

  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Notification Overlays */}
      <NotificationOverlay
        isOffline={isOffline}
        loading={loading}
        errors={errors}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        <DashboardHeader 
          balance={balance}
          isOffline={isOffline}
          session={session}
          onSignOut={handleSignOut}
        />

        <FinancialSummary 
          transactions={transactions}
          balance={balance}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TransactionManager
            transactions={transactions}
            onAdd={handleAddTransaction}
            onUpdate={handleUpdateTransaction}
            onDelete={handleDeleteTransaction}
            loading={loading}
          />

          <div className="space-y-8">
            <GoalsSection />

            <BillsSection 
              bills={bills}
              loading={loading.recurringBills}
              onAdd={handleAddBill}
              onUpdate={handleUpdateBill}
              onDelete={handleDeleteBill}
            />
          </div>
        </div>
      </div>
    </div>
  );
}