/**
 * Main Dashboard Component
 * Orchestrates all dashboard sections and manages global state
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
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
  
  // Global state management
  const [transactions, setTransactions] = useState<Transaction[]>(initialData?.transactions || []);
  const [goals, setGoals] = useState<Goal[]>(initialData?.goals || []);
  const [bills, setBills] = useState<RecurringBill[]>(initialData?.bills || []);
  const [balance, setBalance] = useState(initialData?.balance || 0);
  
  // UI state
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState<LoadingState>({
    userData: false,
    expenses: false,
    income: false,
    recurringBills: false,
    creating: false,
    updating: false,
    deleting: false,
  });
  const [errors, setErrors] = useState<ErrorState>({
    userData: null,
    expenses: null,
    income: null,
    recurringBills: null,
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
        createdAt: new Date().toISOString(),
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
          onSignOut={signOut}
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
            <GoalsSection 
              goals={goals}
              onUpdate={setGoals}
            />

            <BillsSection 
              bills={bills}
              onUpdate={setBills}
            />
          </div>
        </div>
      </div>
    </div>
  );
}