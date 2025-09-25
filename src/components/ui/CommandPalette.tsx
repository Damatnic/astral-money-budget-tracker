/**
 * Command Palette Component (Cmd+K)
 * Global search and quick actions for power users
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Transaction, FinancialGoal, RecurringBill } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useTheme } from '@/contexts/ThemeContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  goals: FinancialGoal[];
  bills: RecurringBill[];
  onNavigate: (tab: string) => void;
  onAddTransaction: () => void;
  onAddGoal: () => void;
  onAddBill: () => void;
}

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  category: 'navigation' | 'action' | 'search' | 'data';
  icon: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette({
  isOpen,
  onClose,
  transactions,
  goals,
  bills,
  onNavigate,
  onAddTransaction,
  onAddGoal,
  onAddBill,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  // Base commands
  const baseCommands: Command[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-overview',
      title: 'Overview',
      subtitle: 'Go to dashboard overview',
      category: 'navigation',
      icon: 'M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z',
      action: () => {
        onNavigate('overview');
        onClose();
      },
      keywords: ['dashboard', 'home', 'main']
    },
    {
      id: 'nav-transactions',
      title: 'Transactions',
      subtitle: 'View and manage transactions',
      category: 'navigation',
      icon: 'M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h6zM4 14a2 2 0 002 2h8a2 2 0 002-2v-2H4v2z',
      action: () => {
        onNavigate('transactions');
        onClose();
      },
      keywords: ['expenses', 'income', 'money']
    },
    {
      id: 'nav-budget',
      title: 'Budget',
      subtitle: 'Budget planning and tracking',
      category: 'navigation',
      icon: 'M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z',
      action: () => {
        onNavigate('budget');
        onClose();
      },
      keywords: ['planning', 'spending', 'allocation']
    },
    {
      id: 'nav-goals',
      title: 'Goals',
      subtitle: 'Financial goals and savings',
      category: 'navigation',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      action: () => {
        onNavigate('goals');
        onClose();
      },
      keywords: ['savings', 'targets', 'objectives']
    },
    {
      id: 'nav-bills',
      title: 'Bills',
      subtitle: 'Recurring bills and payments',
      category: 'navigation',
      icon: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z',
      action: () => {
        onNavigate('bills');
        onClose();
      },
      keywords: ['recurring', 'payments', 'subscriptions']
    },
    {
      id: 'nav-analytics',
      title: 'Analytics',
      subtitle: 'Financial insights and reports',
      category: 'navigation',
      icon: 'M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z',
      action: () => {
        onNavigate('analytics');
        onClose();
      },
      keywords: ['reports', 'insights', 'charts', 'statistics']
    },
    
    // Quick Actions
    {
      id: 'action-add-transaction',
      title: 'Add Transaction',
      subtitle: 'Record a new income or expense',
      category: 'action',
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      action: () => {
        onAddTransaction();
        onClose();
      },
      keywords: ['new', 'record', 'expense', 'income']
    },
    {
      id: 'action-add-goal',
      title: 'Add Goal',
      subtitle: 'Create a new financial goal',
      category: 'action',
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      action: () => {
        onAddGoal();
        onClose();
      },
      keywords: ['new', 'target', 'saving']
    },
    {
      id: 'action-add-bill',
      title: 'Add Bill',
      subtitle: 'Set up a recurring payment',
      category: 'action',
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      action: () => {
        onAddBill();
        onClose();
      },
      keywords: ['new', 'recurring', 'subscription']
    },
    {
      id: 'action-toggle-theme',
      title: 'Toggle Theme',
      subtitle: `Switch to ${isDark ? 'light' : 'dark'} mode`,
      category: 'action',
      icon: isDark 
        ? 'M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z'
        : 'M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z',
      action: () => {
        toggleTheme();
        onClose();
      },
      keywords: ['dark', 'light', 'appearance']
    },
    {
      id: 'action-export',
      title: 'Export Data',
      subtitle: 'Download your financial data',
      category: 'action',
      icon: 'M4 16v1a3 3 0 003 3h6a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
      action: () => {
        onNavigate('export');
        onClose();
      },
      keywords: ['download', 'backup', 'csv', 'pdf']
    }
  ], [isDark, onNavigate, onAddTransaction, onAddGoal, onAddBill, onClose, toggleTheme]);

  // Data-based commands
  const dataCommands: Command[] = useMemo(() => {
    const commands: Command[] = [];

    // Recent transactions
    transactions.slice(0, 5).forEach(transaction => {
      commands.push({
        id: `transaction-${transaction.id}`,
        title: transaction.description,
        subtitle: `${formatCurrency(transaction.amount)} • ${formatDate(transaction.date)}`,
        category: 'data',
        icon: transaction.type === 'income' 
          ? 'M12 6v6m0 0v6m0-6h6m-6 0H6'
          : 'M18 12H6',
        action: () => {
          onNavigate('transactions');
          onClose();
        },
        keywords: [transaction.description, transaction.category, transaction.type]
      });
    });

    // Goals
    goals.slice(0, 3).forEach(goal => {
      commands.push({
        id: `goal-${goal.id}`,
        title: goal.title,
        subtitle: `${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}`,
        category: 'data',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        action: () => {
          onNavigate('goals');
          onClose();
        },
        keywords: [goal.title, 'goal', 'saving']
      });
    });

    // Bills
    bills.slice(0, 3).forEach(bill => {
      commands.push({
        id: `bill-${bill.id}`,
        title: bill.name,
        subtitle: `${formatCurrency(bill.amount)} • ${bill.frequency}`,
        category: 'data',
        icon: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z',
        action: () => {
          onNavigate('bills');
          onClose();
        },
        keywords: [bill.name, 'bill', 'recurring']
      });
    });

    return commands;
  }, [transactions, goals, bills, onNavigate, onClose]);

  // Combined and filtered commands
  const filteredCommands = useMemo(() => {
    const allCommands = [...baseCommands, ...dataCommands];
    
    if (!query) {
      return allCommands;
    }

    const queryLower = query.toLowerCase();
    return allCommands.filter(command => {
      return (
        command.title.toLowerCase().includes(queryLower) ||
        command.subtitle?.toLowerCase().includes(queryLower) ||
        command.keywords?.some(keyword => keyword.toLowerCase().includes(queryLower))
      );
    });
  }, [baseCommands, dataCommands, query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          // Add to recent searches
          if (query && !recentSearches.includes(query)) {
            const newRecentSearches = [query, ...recentSearches.slice(0, 4)];
            setRecentSearches(newRecentSearches);
            localStorage.setItem('astral-money-recent-searches', JSON.stringify(newRecentSearches));
          }
          filteredCommands[selectedIndex].action();
        }
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose, query, recentSearches]);

  // Global Cmd+K shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open command palette logic would be handled by parent
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Command palette specific keyboard navigation
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('astral-money-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'action':
        return 'M13 10V3L4 14h7v7l9-11h-7z';
      case 'data':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      default:
        return 'M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-start justify-center pt-[10vh] px-4">
        <div 
          className={`w-full max-w-2xl rounded-2xl shadow-2xl border ${
            isDark 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-200'
          } overflow-hidden animate-in slide-in-from-top-4 duration-200`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className={`flex items-center px-4 py-4 border-b ${
            isDark ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <svg 
              className={`w-5 h-5 mr-3 ${
                isDark ? 'text-gray-700' : 'text-gray-700'
              }`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Search commands or data..."
              className={`flex-1 bg-transparent border-none outline-none text-lg ${
                isDark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-500'
              }`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <div className={`text-xs px-2 py-1 rounded border ${
              isDark 
                ? 'border-gray-600 text-gray-700 bg-gray-700' 
                : 'border-gray-200 text-gray-700 bg-gray-100'
            }`}>
              ESC
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className={`px-4 py-8 text-center ${
                isDark ? 'text-gray-700' : 'text-gray-700'
              }`}>
                <svg className="w-12 h-12 mx-auto mb-4 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <p className="text-lg mb-2">No commands found</p>
                <p className="text-sm">Try searching for something else</p>
              </div>
            ) : (
              <div className="py-2">
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                      index === selectedIndex
                        ? isDark
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-900'
                        : isDark
                          ? 'text-gray-200 hover:bg-gray-700'
                          : 'text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      if (query && !recentSearches.includes(query)) {
                        const newRecentSearches = [query, ...recentSearches.slice(0, 4)];
                        setRecentSearches(newRecentSearches);
                        localStorage.setItem('astral-money-recent-searches', JSON.stringify(newRecentSearches));
                      }
                      command.action();
                    }}
                  >
                    <div className="flex items-center flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                        command.category === 'navigation' 
                          ? 'bg-blue-100 text-blue-600'
                          : command.category === 'action'
                            ? 'bg-green-100 text-green-600'
                            : command.category === 'data'
                              ? 'bg-purple-100 text-purple-600'
                              : 'bg-gray-100 text-gray-800'
                      }`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d={command.icon} clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{command.title}</div>
                        {command.subtitle && (
                          <div className={`text-sm truncate ${
                            index === selectedIndex
                              ? isDark ? 'text-blue-200' : 'text-blue-700'
                              : isDark ? 'text-gray-700' : 'text-gray-700'
                          }`}>
                            {command.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      index === selectedIndex
                        ? isDark ? 'bg-blue-700 text-blue-200' : 'bg-blue-200 text-blue-800'
                        : isDark ? 'bg-gray-700 text-gray-700' : 'bg-gray-100 text-gray-800'
                    }`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d={getCategoryIcon(command.category)} clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className={`border-t px-4 py-3 ${
              isDark ? 'border-gray-600 bg-gray-750' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className={`text-xs font-medium mb-2 ${
                isDark ? 'text-gray-700' : 'text-gray-700'
              }`}>
                Recent Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-white text-gray-800 hover:bg-gray-100'
                    }`}
                    onClick={() => setQuery(search)}
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className={`flex items-center justify-between px-4 py-3 text-xs border-t ${
            isDark 
              ? 'border-gray-600 text-gray-700 bg-gray-750' 
              : 'border-gray-200 text-gray-700 bg-gray-50'
          }`}>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <kbd className={`px-1.5 py-0.5 rounded border ${
                  isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                }`}>↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className={`px-1.5 py-0.5 rounded border ${
                  isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                }`}>↵</kbd>
                <span>Select</span>
              </div>
            </div>
            <div className="text-right">
              <span className="opacity-60">Astral Money Command Palette</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}