/**
 * Core Type Definitions for Astral Money
 * Centralized type definitions for better maintainability
 */

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  createdAt?: string;
  type?: 'income' | 'expense';
}

export interface Goal {
  id: string;
  icon: string;
  name: string;
  current: number;
  target: number;
  targetDate: string;
  type: 'savings' | 'debt';
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  startDate: string;
  endDate?: string;
  isActive?: boolean;
}

export interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface LoadingState {
  userData: boolean;
  expenses: boolean;
  income: boolean;
  recurringBills: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export interface ErrorState {
  userData: string | null;
  expenses: string | null;
  income: string | null;
  recurringBills: string | null;
  form: string | null;
}

// Extended types for enhanced functionality
export interface EnhancedTransaction extends Transaction {
  tags?: string[];
  location?: string;
  receipt?: string;
}

export interface FinancialData {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  emergencyFund: number;
  goals: Array<{
    current: number;
    target: number;
    targetDate: string;
  }>;
}

export interface ExportData {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: string;
}

export interface ExportResult {
  filename: string;
  data: string;
  mimeType: string;
}