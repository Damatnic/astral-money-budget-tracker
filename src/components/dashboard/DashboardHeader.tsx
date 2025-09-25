/**
 * Dashboard Header Component
 * Displays main balance and key navigation elements
 */

import { formatCurrency } from '@/utils/formatters';
import { Session } from 'next-auth';
import { CompactThemeToggle } from '@/components/common/ThemeToggle';

interface DashboardHeaderProps {
  balance: number;
  isOffline?: boolean;
  userName?: string;
  session?: Session | null;
  onSignOut?: () => void;
}

export function DashboardHeader({ 
  balance, 
  isOffline = false,
  userName = 'User',
  session,
  onSignOut
}: DashboardHeaderProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const balanceColor = balance >= 0 ? 'text-green-600' : 'text-red-600';
  const displayName = session?.user?.name || userName;

  return (
    <header className="bg-white rounded-lg shadow-sm p-4 lg:p-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            <svg className="w-6 h-6 lg:w-8 lg:h-8 mr-2 lg:mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
            </svg>
            Astral Money
            {isOffline && (
              <span className="ml-3 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                Offline
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">Welcome back, {displayName}</p>
          <p className="text-gray-500 text-sm">{currentDate}</p>
        </div>

        <div className="flex flex-col sm:items-end space-y-4">
          {/* User Profile Section */}
          {session && onSignOut && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="text-left sm:text-right order-2 sm:order-1">
                <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                <p className="text-xs text-gray-500">{session.user?.email}</p>
              </div>
              <div className="relative order-1 sm:order-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {session.user?.name?.[0] || 'U'}
                  </span>
                </div>
              </div>
              <div className="order-3 flex items-center space-x-2">
                <CompactThemeToggle />
                <button
                  onClick={onSignOut}
                  className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors w-full sm:w-auto"
                  title="Sign out"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
          
          {/* Balance Section */}
          <div className="text-left sm:text-right w-full">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Current Balance</p>
            <p className={`text-4xl font-bold ${balanceColor}`}>
              {formatCurrency(balance)}
            </p>
            {balance < 0 && (
              <p className="text-sm text-red-500 mt-1 flex items-center justify-end">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Account overdrawn
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">This Month</p>
            <p className="text-lg font-semibold text-blue-800">Track Progress</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Savings Goal</p>
            <p className="text-lg font-semibold text-green-800">Stay on Track</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Budget Status</p>
            <p className="text-lg font-semibold text-purple-800">Monitor Spending</p>
          </div>
        </div>
      </div>
    </header>
  );
}