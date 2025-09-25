/**
 * Core Type Definitions for Astral Money
 * These types EXACTLY match the Prisma database schema for data consistency
 */

// Database model types matching schema.prisma exactly
export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
  pin: string | null;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: string; // "income" or "expense"
  amount: number;
  description: string | null;
  category: string | null;
  date: Date;
  createdAt: Date;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
  category: string; // "emergency", "savings", "debt"
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringBill {
  id: string;
  userId: string;
  name: string;
  amount: number; // Keep existing amount field
  baseAmount: number | null; // Base/estimated amount
  frequency: string; // "monthly", "weekly", "biweekly"
  category: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  isVariableAmount: boolean;
  averageAmount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  lastBillAmount: number | null;
  estimationMethod: string; // "base", "average", "lastBill"
  notes: string | null;
  provider: string | null;
  billType: string; // "expense", "income"
  createdAt: Date;
  updatedAt: Date;
}

export interface BillHistory {
  id: string;
  recurringBillId: string;
  actualAmount: number;
  estimatedAmount: number;
  billDate: Date;
  isPaid: boolean;
  paidDate: Date | null;
  variance: number;
  variancePercent: number;
  notes: string | null;
  paymentMethod: string | null;
  transactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  month: string;
  year: number;
  income: number;
  expenses: number;
  savings: number;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bill {
  id: string;
  userId: string;
  budgetId: string | null;
  name: string;
  amount: number;
  dueDate: Date;
  category: string;
  isRecurring: boolean;
  isPaid: boolean;
  isIncome: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// API request/response types
export interface CreateTransactionRequest {
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  category?: string;
  date?: string;
}

export interface CreateFinancialGoalRequest {
  title: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string;
  category: 'emergency' | 'savings' | 'debt' | 'investment' | 'purchase';
}

export interface UpdateFinancialGoalRequest {
  id: string;
  title?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string;
  category?: 'emergency' | 'savings' | 'debt' | 'investment' | 'purchase';
  isCompleted?: boolean;
}

export interface CreateRecurringBillRequest {
  name: string;
  amount: number;
  baseAmount?: number;
  frequency: 'monthly' | 'weekly' | 'biweekly' | 'yearly';
  category: string;
  startDate: string;
  endDate?: string;
  isVariableAmount?: boolean;
  estimationMethod?: 'base' | 'average' | 'lastBill';
  notes?: string;
  provider?: string;
  billType?: 'expense' | 'income';
}

export interface UpdateRecurringBillRequest {
  id: string;
  name?: string;
  amount?: number;
  baseAmount?: number;
  frequency?: 'monthly' | 'weekly' | 'biweekly' | 'yearly';
  category?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isVariableAmount?: boolean;
  estimationMethod?: 'base' | 'average' | 'lastBill';
  notes?: string;
  provider?: string;
  billType?: 'expense' | 'income';
}

export interface CreateBillHistoryRequest {
  recurringBillId: string;
  actualAmount: number;
  estimatedAmount: number;
  billDate: string;
  isPaid?: boolean;
  paidDate?: string;
  notes?: string;
  paymentMethod?: string;
  transactionId?: string;
}

// UI-specific types for frontend components
export interface DashboardData {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  transactions: Transaction[];
  goals: FinancialGoal[];
  recurringBills: RecurringBill[];
}

// Legacy types for backward compatibility (will be phased out)
export interface Goal {
  id: string;
  icon: string;
  name: string;
  current: number;
  target: number;
  targetDate: string;
  type: 'savings' | 'debt';
}

// Notification system
export interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// Loading and error states
export interface LoadingState {
  userData: boolean;
  expenses: boolean;
  income: boolean;
  recurringBills: boolean;
  goals: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export interface ErrorState {
  userData: string | null;
  expenses: string | null;
  income: string | null;
  recurringBills: string | null;
  goals: string | null;
  form: string | null;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  requestId?: string;
  metadata?: {
    source?: string;
    queryTime?: number;
    [key: string]: any;
  };
}

// Export data types
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

// Financial analysis types
export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  savingsRate: number;
  emergencyFundRatio: number;
  goalProgress: number;
}

export interface SpendingByCategory {
  [category: string]: {
    amount: number;
    percentage: number;
    transactions: number;
  };
}

// Categories enum for consistency
export const TransactionCategories = {
  INCOME: ['salary', 'freelance', 'investment', 'gift', 'other_income'],
  EXPENSE: ['food', 'transportation', 'utilities', 'entertainment', 'healthcare', 'shopping', 'other_expense']
} as const;

export const GoalCategories = ['emergency', 'savings', 'debt', 'investment', 'purchase'] as const;
export const BillFrequencies = ['monthly', 'weekly', 'biweekly', 'yearly'] as const;
export const EstimationMethods = ['base', 'average', 'lastBill'] as const;

// Type guards
export function isTransaction(obj: any): obj is Transaction {
  return obj && typeof obj.id === 'string' && typeof obj.amount === 'number' && typeof obj.type === 'string';
}

export function isFinancialGoal(obj: any): obj is FinancialGoal {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string' && typeof obj.targetAmount === 'number';
}

export function isRecurringBill(obj: any): obj is RecurringBill {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.amount === 'number';
}