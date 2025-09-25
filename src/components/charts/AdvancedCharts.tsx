/**
 * Advanced Chart Components
 * Interactive visualizations using Recharts
 */

'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Transaction, RecurringBill, FinancialGoal } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useTheme } from '@/contexts/ThemeContext';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  height?: number;
}

function ChartContainer({ title, subtitle, children, className = '', height = 300 }: ChartContainerProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover-lift ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div style={{ height: `${height}px` }}>
        {children}
      </div>
    </div>
  );
}

interface SpendingTrendsChartProps {
  transactions: Transaction[];
  period?: 'week' | 'month' | 'quarter' | 'year';
  className?: string;
}

export function SpendingTrendsChart({ transactions, period = 'month', className }: SpendingTrendsChartProps) {
  const { isDark } = useTheme();

  const chartData = useMemo(() => {
    const now = new Date();
    let intervals: number;
    let intervalMs: number;
    let startDate: Date;

    switch (period) {
      case 'week':
        intervals = 7;
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        intervalMs = 24 * 60 * 60 * 1000; // 1 day
        break;
      case 'quarter':
        intervals = 12;
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        intervalMs = (90 * 24 * 60 * 60 * 1000) / 12; // ~7.5 days
        break;
      case 'year':
        intervals = 12;
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        intervalMs = (365 * 24 * 60 * 60 * 1000) / 12; // ~1 month
        break;
      default:
        intervals = 10;
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        intervalMs = (30 * 24 * 60 * 60 * 1000) / 10; // ~3 days
    }

    const data = [];
    for (let i = 0; i < intervals; i++) {
      const intervalStart = new Date(startDate.getTime() + i * intervalMs);
      const intervalEnd = new Date(startDate.getTime() + (i + 1) * intervalMs);

      const intervalTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= intervalStart && date < intervalEnd;
      });

      const income = intervalTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = intervalTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        date: period === 'week' 
          ? intervalStart.toLocaleDateString('en-US', { weekday: 'short' })
          : period === 'year'
            ? intervalStart.toLocaleDateString('en-US', { month: 'short' })
            : intervalStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: intervalStart,
        income,
        expenses,
        netFlow: income - expenses
      });
    }

    return data;
  }, [transactions, period]);

  const colors = {
    income: isDark ? '#10B981' : '#059669',
    expenses: isDark ? '#EF4444' : '#DC2626',
    netFlow: isDark ? '#3B82F6' : '#1E40AF'
  };

  return (
    <ChartContainer 
      title="Cash Flow Trends" 
      subtitle={`Income vs expenses over the last ${period}`}
      className={className}
      height={350}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '8px',
              color: isDark ? '#F9FAFB' : '#111827'
            }}
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="income"
            fill={colors.income}
            fillOpacity={0.1}
            stroke={colors.income}
            strokeWidth={2}
            name="Income"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            fill={colors.expenses}
            fillOpacity={0.1}
            stroke={colors.expenses}
            strokeWidth={2}
            name="Expenses"
          />
          <Line
            type="monotone"
            dataKey="netFlow"
            stroke={colors.netFlow}
            strokeWidth={3}
            dot={{ fill: colors.netFlow, strokeWidth: 2, r: 4 }}
            name="Net Flow"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

interface CategoryBreakdownChartProps {
  transactions: Transaction[];
  type?: 'income' | 'expense';
  className?: string;
}

export function CategoryBreakdownChart({ transactions, type = 'expense', className }: CategoryBreakdownChartProps) {
  const { isDark } = useTheme();

  const chartData = useMemo(() => {
    const categoryTotals = transactions
      .filter(t => t.type === type)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, type]);

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const total = chartData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <ChartContainer 
      title={`${type === 'income' ? 'Income' : 'Expense'} Categories`}
      subtitle="Breakdown by category"
      className={className}
      height={400}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ category, percent }) => 
              percent > 0.05 ? `${category} ${(percent * 100).toFixed(0)}%` : ''
            }
            outerRadius={120}
            fill="#8884d8"
            dataKey="amount"
            animationDuration={1000}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '8px',
              color: isDark ? '#F9FAFB' : '#111827'
            }}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              `${((value / total) * 100).toFixed(1)}%`
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

interface MonthlyComparisonChartProps {
  transactions: Transaction[];
  className?: string;
}

export function MonthlyComparisonChart({ transactions, className }: MonthlyComparisonChartProps) {
  const { isDark } = useTheme();

  const chartData = useMemo(() => {
    const now = new Date();
    const monthsData = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      monthsData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        fullDate: date,
        income,
        expenses,
        savings: income - expenses,
        savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0
      });
    }

    return monthsData;
  }, [transactions]);

  const colors = {
    income: isDark ? '#10B981' : '#059669',
    expenses: isDark ? '#EF4444' : '#DC2626',
    savings: isDark ? '#3B82F6' : '#1E40AF'
  };

  return (
    <ChartContainer 
      title="Monthly Comparison"
      subtitle="12-month income, expenses, and savings"
      className={className}
      height={400}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
          <XAxis 
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '8px',
              color: isDark ? '#F9FAFB' : '#111827'
            }}
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
          />
          <Legend />
          <Bar 
            dataKey="income" 
            fill={colors.income} 
            name="Income"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="expenses" 
            fill={colors.expenses} 
            name="Expenses"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="savings" 
            fill={colors.savings} 
            name="Savings"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

interface GoalsProgressChartProps {
  goals: FinancialGoal[];
  className?: string;
}

export function GoalsProgressChart({ goals, className }: GoalsProgressChartProps) {
  const { isDark } = useTheme();

  const chartData = useMemo(() => {
    return goals.map(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const remaining = goal.targetAmount - goal.currentAmount;
      
      return {
        name: goal.title.length > 15 ? `${goal.title.substring(0, 15)}...` : goal.title,
        fullName: goal.title,
        progress: Math.min(progress, 100),
        current: goal.currentAmount,
        target: goal.targetAmount,
        remaining,
        daysLeft: goal.deadline ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0
      };
    });
  }, [goals]);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <ChartContainer 
      title="Goals Progress"
      subtitle="Track your financial goals"
      className={className}
      height={350}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          layout="horizontal"
          data={chartData} 
          margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
          <XAxis 
            type="number"
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis 
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
            width={75}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '8px',
              color: isDark ? '#F9FAFB' : '#111827'
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value.toFixed(1)}%`,
              `${formatCurrency(props.payload.current)} / ${formatCurrency(props.payload.target)}`
            ]}
            labelFormatter={(label, payload) => 
              payload && payload[0] ? payload[0].payload.fullName : label
            }
          />
          <Bar 
            dataKey="progress" 
            fill="#3B82F6"
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

interface FinancialHealthRadarProps {
  transactions: Transaction[];
  bills: RecurringBill[];
  goals: FinancialGoal[];
  balance: number;
  monthlyIncome: number;
  className?: string;
}

export function FinancialHealthRadar({ 
  transactions, 
  bills, 
  goals, 
  balance, 
  monthlyIncome,
  className 
}: FinancialHealthRadarProps) {
  const { isDark } = useTheme();

  const healthData = useMemo(() => {
    // Calculate health metrics (0-100 scale)
    const now = new Date();
    const thisMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const monthlyExpenses = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // 1. Savings Rate (0-100)
    const savingsRate = monthlyIncome > 0 ? 
      Math.min(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100, 100) : 0;

    // 2. Emergency Fund (0-100, based on 6 months expenses)
    const emergencyFund = monthlyExpenses > 0 ? 
      Math.min((balance / (monthlyExpenses * 6)) * 100, 100) : 100;

    // 3. Goals Progress (0-100, average of all goals)
    const goalsProgress = goals.length > 0 ? 
      goals.reduce((sum, goal) => sum + (goal.currentAmount / goal.targetAmount) * 100, 0) / goals.length : 50;

    // 4. Spending Control (0-100, based on budget adherence)
    const spendingControl = monthlyIncome > 0 ? 
      Math.max(0, 100 - ((monthlyExpenses / monthlyIncome) * 100 - 70)) : 50;

    // 5. Debt Management (0-100, simplified - based on bills ratio)
    const totalBillsAmount = bills.reduce((sum, bill) => {
      let monthlyAmount = bill.amount;
      if (bill.frequency === 'yearly') monthlyAmount /= 12;
      if (bill.frequency === 'weekly') monthlyAmount *= 4.33;
      return sum + monthlyAmount;
    }, 0);
    const debtManagement = monthlyIncome > 0 ? 
      Math.max(0, 100 - ((totalBillsAmount / monthlyIncome) * 100 * 2)) : 50;

    // 6. Investment Readiness (0-100, based on available surplus)
    const investmentReadiness = monthlyIncome > 0 ? 
      Math.min(((monthlyIncome - monthlyExpenses - totalBillsAmount) / monthlyIncome) * 100 * 2, 100) : 0;

    return [
      { metric: 'Savings Rate', value: Math.max(0, savingsRate) },
      { metric: 'Emergency Fund', value: Math.max(0, emergencyFund) },
      { metric: 'Goals Progress', value: Math.max(0, goalsProgress) },
      { metric: 'Spending Control', value: Math.max(0, spendingControl) },
      { metric: 'Debt Management', value: Math.max(0, debtManagement) },
      { metric: 'Investment Ready', value: Math.max(0, investmentReadiness) }
    ];
  }, [transactions, bills, goals, balance, monthlyIncome]);

  return (
    <ChartContainer 
      title="Financial Health Score"
      subtitle="Overall financial wellness assessment"
      className={className}
      height={350}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={healthData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke={isDark ? '#374151' : '#E5E7EB'} />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 11 }}
          />
          <PolarRadiusAxis 
            angle={30}
            domain={[0, 100]}
            tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
            tickFormatter={(value) => `${value}`}
          />
          <Radar
            name="Health Score"
            dataKey="value"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.1}
            strokeWidth={2}
            dot={{ fill: '#3B82F6', strokeWidth: 1, r: 4 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '8px',
              color: isDark ? '#F9FAFB' : '#111827'
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}