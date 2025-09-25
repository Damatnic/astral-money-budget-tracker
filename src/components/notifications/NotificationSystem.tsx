/**
 * Advanced Notification System
 * Smart alerts, achievements, and contextual notifications
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Transaction, RecurringBill, FinancialGoal, Notification } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { getUpcomingBillReminders, checkAchievements, analyzeSpendingPatterns } from '@/utils/smartFeatures';
import { useTheme } from '@/contexts/ThemeContext';

interface NotificationSystemProps {
  transactions: Transaction[];
  bills: RecurringBill[];
  goals: FinancialGoal[];
  balance: number;
  onNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  className?: string;
}

interface SmartAlert {
  id: string;
  type: 'achievement' | 'reminder' | 'warning' | 'insight' | 'milestone';
  title: string;
  message: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
  icon: string;
  color: string;
  actionUrl?: string;
  dismissible: boolean;
  autoClose?: number; // seconds
}

export function NotificationSystem({
  transactions,
  bills,
  goals,
  balance,
  onNotification,
  className = ''
}: NotificationSystemProps) {
  const { isDark } = useTheme();
  const [activeAlerts, setActiveAlerts] = useState<SmartAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());

  // Generate smart alerts
  const generateAlerts = useCallback(() => {
    const alerts: SmartAlert[] = [];
    const now = new Date();

    // 1. Bill Reminders
    const upcomingBills = getUpcomingBillReminders(bills, 7);
    upcomingBills.forEach(reminder => {
      if (dismissedAlerts.has(`bill-${reminder.bill.id}`)) return;

      alerts.push({
        id: `bill-${reminder.bill.id}`,
        type: 'reminder',
        title: 'Bill Due Soon',
        message: `${reminder.bill.name} is due in ${reminder.daysUntilDue} day${reminder.daysUntilDue !== 1 ? 's' : ''} (${formatCurrency(reminder.bill.amount)})`,
        action: 'Pay Now',
        priority: reminder.priority,
        icon: '📅',
        color: reminder.priority === 'high' ? '#EF4444' : reminder.priority === 'medium' ? '#F59E0B' : '#3B82F6',
        actionUrl: '/bills',
        dismissible: true,
        autoClose: reminder.priority === 'high' ? undefined : 10
      });
    });

    // 2. Achievements
    const achievements = checkAchievements(transactions, balance, goals);
    achievements.filter(achievement => achievement.isNew).forEach(achievement => {
      if (dismissedAlerts.has(`achievement-${achievement.id}`)) return;

      alerts.push({
        id: `achievement-${achievement.id}`,
        type: 'achievement',
        title: achievement.title,
        message: achievement.description,
        priority: 'low',
        icon: '🏆',
        color: '#10B981',
        dismissible: true,
        autoClose: 8
      });
    });

    // 3. Spending Warnings
    const thisMonth = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const monthlyExpenses = thisMonth
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyIncome = thisMonth
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    if (monthlyIncome > 0 && monthlyExpenses > monthlyIncome * 0.9) {
      if (!dismissedAlerts.has('overspending-warning')) {
        alerts.push({
          id: 'overspending-warning',
          type: 'warning',
          title: 'High Spending Alert',
          message: `You've spent ${((monthlyExpenses / monthlyIncome) * 100).toFixed(0)}% of your monthly income. Consider reviewing your budget.`,
          action: 'Review Budget',
          priority: 'high',
          icon: '⚠️',
          color: '#EF4444',
          actionUrl: '/budget',
          dismissible: true
        });
      }
    }

    // 4. Goal Progress Milestones
    goals.forEach(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const milestones = [25, 50, 75, 90];
      
      milestones.forEach(milestone => {
        if (progress >= milestone && !dismissedAlerts.has(`goal-${goal.id}-${milestone}`)) {
          alerts.push({
            id: `goal-${goal.id}-${milestone}`,
            type: 'milestone',
            title: 'Goal Progress!',
            message: `You're ${milestone}% towards "${goal.title}"! ${formatCurrency(goal.targetAmount - goal.currentAmount)} to go.`,
            priority: 'low',
            icon: milestone >= 75 ? '🎯' : '📊',
            color: '#8B5CF6',
            dismissible: true,
            autoClose: 6
          });
        }
      });
    });

    // 5. Spending Pattern Insights
    if (transactions.length >= 10) {
      const patterns = analyzeSpendingPatterns(transactions);
      
      // Unusual transactions
      if (patterns.unusualTransactions.length > 0 && !dismissedAlerts.has('unusual-spending')) {
        const unusual = patterns.unusualTransactions[0];
        alerts.push({
          id: 'unusual-spending',
          type: 'insight',
          title: 'Unusual Transaction',
          message: `${formatCurrency(unusual.amount)} spent on "${unusual.description}" is much higher than your usual ${unusual.category} spending.`,
          priority: 'medium',
          icon: '🔍',
          color: '#6366F1',
          dismissible: true,
          autoClose: 10
        });
      }

      // Category trends
      const significantTrends = patterns.categoryTrends.filter(trend => Math.abs(trend.percentage) > 50);
      if (significantTrends.length > 0 && !dismissedAlerts.has('spending-trend')) {
        const trend = significantTrends[0];
        alerts.push({
          id: 'spending-trend',
          type: 'insight',
          title: 'Spending Trend',
          message: `Your ${trend.category} spending has ${trend.trend === 'up' ? 'increased' : 'decreased'} by ${Math.abs(trend.percentage).toFixed(0)}% this month.`,
          priority: 'low',
          icon: trend.trend === 'up' ? '📈' : '📉',
          color: trend.trend === 'up' ? '#F59E0B' : '#10B981',
          dismissible: true,
          autoClose: 8
        });
      }
    }

    // 6. Low Balance Warning
    if (balance < 100 && balance > 0 && !dismissedAlerts.has('low-balance')) {
      alerts.push({
        id: 'low-balance',
        type: 'warning',
        title: 'Low Balance Warning',
        message: `Your account balance is ${formatCurrency(balance)}. Consider transferring funds or reducing spending.`,
        action: 'Add Funds',
        priority: 'high',
        icon: '💳',
        color: '#EF4444',
        dismissible: true
      });
    }

    // 7. Positive Balance Milestone
    if (balance > 0 && balance % 1000 < 50 && balance >= 1000) {
      const milestone = Math.floor(balance / 1000) * 1000;
      if (!dismissedAlerts.has(`balance-milestone-${milestone}`)) {
        alerts.push({
          id: `balance-milestone-${milestone}`,
          type: 'milestone',
          title: 'Balance Milestone!',
          message: `Congratulations! Your balance has reached ${formatCurrency(milestone)}`,
          priority: 'low',
          icon: '💰',
          color: '#10B981',
          dismissible: true,
          autoClose: 8
        });
      }
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [transactions, bills, goals, balance, dismissedAlerts]);

  // Check for new alerts periodically - DISABLED to prevent notification spam
  useEffect(() => {
    // Commenting out automatic alert generation to prevent persistent notifications
    // Users can manually trigger notifications when needed
    return;
    
    /*
    const checkAlerts = () => {
      const alerts = generateAlerts();
      const newAlerts = alerts.filter(alert => 
        !activeAlerts.some(active => active.id === alert.id)
      );

      if (newAlerts.length > 0) {
        setActiveAlerts(prev => [...newAlerts, ...prev].slice(0, 5)); // Keep only 5 most recent
        
        // Send notifications to parent
        newAlerts.forEach(alert => {
          onNotification({
            type: alert.type === 'warning' ? 'error' : 
                  alert.type === 'achievement' || alert.type === 'milestone' ? 'success' : 'info',
            title: alert.title,
            message: alert.message,
            priority: alert.priority
          });
        });
      }
    };

    // Check immediately
    checkAlerts();

    // Check every 30 seconds for new alerts
    const interval = setInterval(checkAlerts, 30000);

    return () => clearInterval(interval);
    */
  }, [generateAlerts, activeAlerts, onNotification]);

  // Auto-dismiss alerts
  useEffect(() => {
    activeAlerts.forEach(alert => {
      if (alert.autoClose) {
        setTimeout(() => {
          dismissAlert(alert.id);
        }, alert.autoClose * 1000);
      }
    });
  }, [activeAlerts]);

  const dismissAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    
    // Store dismissed alerts in localStorage
    const dismissed = Array.from(dismissedAlerts);
    dismissed.push(alertId);
    localStorage.setItem('astral-money-dismissed-alerts', JSON.stringify(dismissed));
  };

  const handleAlertAction = (alert: SmartAlert) => {
    if (alert.actionUrl) {
      // Navigate to the specified URL (would need router context)
      console.log(`Navigate to: ${alert.actionUrl}`);
    }
    dismissAlert(alert.id);
  };

  // Load dismissed alerts from localStorage and clear any existing alerts
  useEffect(() => {
    // Clear all existing alerts on mount
    setActiveAlerts([]);
    
    // Clear localStorage to reset all notifications
    localStorage.removeItem('astral-money-dismissed-alerts');
    setDismissedAlerts(new Set());
    
    /*
    const stored = localStorage.getItem('astral-money-dismissed-alerts');
    if (stored) {
      try {
        const dismissed = JSON.parse(stored);
        setDismissedAlerts(new Set(dismissed));
      } catch (error) {
        console.error('Failed to load dismissed alerts:', error);
      }
    }
  }, []);

  if (activeAlerts.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {activeAlerts.map((alert, index) => (
        <div
          key={alert.id}
          className={`relative overflow-hidden rounded-xl border shadow-sm transition-all duration-300 animate-slide-in-top ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
          style={{
            borderLeftColor: alert.color,
            borderLeftWidth: '4px',
            animationDelay: `${index * 100}ms`
          }}
        >
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${alert.color}15` }}
                >
                  {alert.icon}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-semibold text-sm ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {alert.title}
                  </h3>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    alert.priority === 'high'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : alert.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {alert.priority}
                  </div>
                </div>
                
                <p className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                } mb-3`}>
                  {alert.message}
                </p>
                
                <div className="flex items-center justify-between">
                  {alert.action && (
                    <button
                      onClick={() => handleAlertAction(alert)}
                      className="text-sm font-medium px-3 py-1 rounded-lg transition-colors hover-scale"
                      style={{
                        color: alert.color,
                        backgroundColor: `${alert.color}15`
                      }}
                    >
                      {alert.action}
                    </button>
                  )}
                  
                  {alert.dismissible && (
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        isDark 
                          ? 'hover:bg-gray-700 text-gray-400' 
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title="Dismiss"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Animated progress bar for auto-closing alerts */}
          {alert.autoClose && (
            <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 animate-shrink"
                 style={{ 
                   color: alert.color,
                   animationDuration: `${alert.autoClose}s`
                 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// Add shrink animation to CSS
const shrinkAnimation = `
@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.animate-shrink {
  animation: shrink linear;
}
`;

// Inject the animation into the document
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = shrinkAnimation;
  document.head.appendChild(style);
}