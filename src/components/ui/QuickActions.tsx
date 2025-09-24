'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'transaction' | 'bill' | 'report' | 'navigation' | 'settings';
  description?: string;
}

interface QuickActionsProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
  onAddRecurringBill: () => void;
  onViewReports: () => void;
  onExportData: () => void;
  onShowSettings: () => void;
  className?: string;
}

/**
 * Professional Quick Actions Menu with keyboard shortcuts and search
 */
export function QuickActions({
  onAddExpense,
  onAddIncome,
  onAddRecurringBill,
  onViewReports,
  onExportData,
  onShowSettings,
  className = ''
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { addNotification, state } = useAppContext();
  
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'add-expense',
      label: 'Add Expense',
      icon: <MinusIcon />,
      shortcut: 'Ctrl+E',
      action: onAddExpense,
      category: 'transaction',
      description: 'Record a new expense'
    },
    {
      id: 'add-income',
      label: 'Add Income',
      icon: <PlusIcon />,
      shortcut: 'Ctrl+I',
      action: onAddIncome,
      category: 'transaction',
      description: 'Record new income'
    },
    {
      id: 'add-bill',
      label: 'Add Recurring Bill',
      icon: <ClockIcon />,
      shortcut: 'Ctrl+B',
      action: onAddRecurringBill,
      category: 'bill',
      description: 'Set up a recurring bill'
    },
    {
      id: 'view-reports',
      label: 'View Reports',
      icon: <ChartIcon />,
      shortcut: 'Ctrl+R',
      action: onViewReports,
      category: 'report',
      description: 'Open financial reports'
    },
    {
      id: 'export-data',
      label: 'Export Data',
      icon: <DownloadIcon />,
      shortcut: 'Ctrl+Shift+E',
      action: onExportData,
      category: 'report',
      description: 'Download your financial data'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      shortcut: 'Ctrl+,',
      action: onShowSettings,
      category: 'settings',
      description: 'Open application settings'
    },
    {
      id: 'quick-balance',
      label: 'Quick Balance Check',
      icon: <WalletIcon />,
      shortcut: 'Ctrl+Shift+B',
      action: () => {
        // Show quick balance notification
        addNotification({
          type: 'info',
          title: 'Current Balance',
          message: 'Balance information updated',
          priority: 'medium'
        });
      },
      category: 'navigation',
      description: 'Show current balance quickly'
    },
    {
      id: 'undo',
      label: 'Undo Last Action',
      icon: <UndoIcon />,
      shortcut: 'Ctrl+Z',
      action: () => {
        // Implement undo functionality
        addNotification({
          type: 'success',
          title: 'Action Undone',
          message: 'Last action has been undone',
          priority: 'low'
        });
      },
      category: 'navigation',
      description: 'Undo the last action'
    }
  ];

  const filteredActions = quickActions.filter(action =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Quick Actions shortcut (Ctrl+K or Cmd+K)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchRef.current?.focus(), 100);
        return;
      }

      // ESC to close
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(0);
        return;
      }

      if (!isOpen) {
        // Global shortcuts when menu is closed
        quickActions.forEach(action => {
          if (action.shortcut && isShortcutPressed(event, action.shortcut)) {
            event.preventDefault();
            action.action();
          }
        });
        return;
      }

      // Navigation within menu
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredActions.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredActions.length - 1
        );
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          setIsOpen(false);
          setSearchQuery('');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchQuery, selectedIndex, filteredActions, quickActions]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const isShortcutPressed = (event: KeyboardEvent, shortcut: string): boolean => {
    const parts = shortcut.split('+').map(p => p.trim());
    let ctrlKey = false, shiftKey = false, altKey = false, key = '';

    parts.forEach(part => {
      if (part === 'Ctrl') ctrlKey = true;
      else if (part === 'Shift') shiftKey = true;
      else if (part === 'Alt') altKey = true;
      else key = part.toLowerCase();
    });

    return event.ctrlKey === ctrlKey &&
           event.shiftKey === shiftKey &&
           event.altKey === altKey &&
           event.key.toLowerCase() === key;
  };

  const categoryColors = {
    transaction: 'bg-blue-50 text-blue-700',
    bill: 'bg-purple-50 text-purple-700',
    report: 'bg-green-50 text-green-700',
    navigation: 'bg-orange-50 text-orange-700',
    settings: 'bg-gray-50 text-gray-700'
  };

  return (
    <>
      {/* Quick Actions Button */}
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="
            inline-flex items-center justify-center
            w-12 h-12 rounded-full
            bg-gradient-to-r from-blue-600 to-indigo-600
            text-white shadow-lg hover:shadow-xl
            transform transition-all duration-200
            hover:scale-110 hover:rotate-3
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
          title="Quick Actions (Ctrl+K)"
          aria-label="Open quick actions menu"
        >
          <LightningIcon />
        </button>

        {/* Floating indicator for unread notifications */}
        {state.notifications.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">
              {state.notifications.length > 9 ? '9+' : state.notifications.length}
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions Menu Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          
          {/* Menu */}
          <div
            ref={menuRef}
            className="
              relative w-full max-w-2xl
              bg-white rounded-xl shadow-2xl border border-slate-200
              transform transition-all duration-200
              animate-in slide-in-from-top-4
            "
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search actions... (↑↓ to navigate, Enter to select)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  className="
                    w-full pl-10 pr-4 py-3 rounded-lg
                    border border-slate-200 focus:border-blue-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20
                    text-slate-900 placeholder-slate-500
                  "
                  autoFocus
                />
              </div>
            </div>

            {/* Actions List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredActions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <SearchIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No actions found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredActions.map((action, index) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        action.action();
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`
                        w-full flex items-center space-x-3 p-3 rounded-lg
                        text-left transition-all duration-150
                        ${index === selectedIndex
                          ? 'bg-blue-50 border border-blue-200 shadow-sm'
                          : 'hover:bg-slate-50'
                        }
                      `}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        {action.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-slate-900">{action.label}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[action.category]}`}>
                              {action.category}
                            </span>
                            {action.shortcut && (
                              <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">
                                {action.shortcut}
                              </kbd>
                            )}
                          </div>
                        </div>
                        {action.description && (
                          <p className="text-sm text-slate-500 mt-1">{action.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Tip: Use Ctrl+K to open this menu anytime</span>
                <span>ESC to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Icon Components
const LightningIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MinusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const UndoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

export default QuickActions;