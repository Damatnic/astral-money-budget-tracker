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
    <header className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-indigo-100 rounded-2xl shadow-xl backdrop-blur-sm border border-white/60 p-6 lg:p-8">
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-6 sm:mb-0">
          <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent flex items-center">
            <div className="w-8 h-8 lg:w-10 lg:h-10 mr-3 lg:mr-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
              </svg>
            </div>
            Astral Money
            {isOffline && (
              <span className="ml-4 px-3 py-1 text-xs font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg animate-pulse">
                Offline Mode
              </span>
            )}
          </h1>
          <p className="text-gray-700 mt-2 font-medium">Welcome back, {displayName}</p>
          <p className="text-gray-600 text-sm mt-1">{currentDate}</p>
        </div>

        <div className="flex flex-col sm:items-end space-y-6">
          {/* User Profile Section */}
          {session && onSignOut && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="text-left sm:text-right order-2 sm:order-1">
                <p className="text-sm font-semibold text-gray-800">{session.user?.name}</p>
                <p className="text-xs text-gray-600">{session.user?.email}</p>
              </div>
              <div className="relative order-1 sm:order-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/50">
                  <span className="text-white font-bold text-lg">
                    {session.user?.name?.[0] || 'U'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="order-3 flex items-center space-x-3">
                <CompactThemeToggle />
                <button
                  onClick={onSignOut}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md w-full sm:w-auto"
                  title="Sign out"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
          
          {/* Enhanced Balance Section */}
          <div className="text-left sm:text-right w-full">
            <div className="inline-block sm:block">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-lg">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider mb-2">Current Balance</p>
                <div className="flex items-center justify-start sm:justify-end space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${balance >= 0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                  <p className={`text-4xl lg:text-5xl font-bold ${balance >= 0 ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-red-600 to-rose-600'} bg-clip-text text-transparent`}>
                    {formatCurrency(balance)}
                  </p>
                </div>
                {balance < 0 ? (
                  <div className="flex items-center justify-start sm:justify-end text-red-500 bg-red-50 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Account overdrawn</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-start sm:justify-end text-green-600 bg-green-50 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Account in good standing</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="relative z-10 mt-8 pt-6 border-t border-white/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <div className="group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-blue-700 mb-1">This Month</p>
              <p className="text-lg font-bold text-gray-800">Track Progress</p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h6zM4 14a2 2 0 002 2h8a2 2 0 002-2v-2H4v2z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-emerald-700 mb-1">Savings Goal</p>
              <p className="text-lg font-bold text-gray-800">Stay on Track</p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-purple-700 mb-1">Budget Status</p>
              <p className="text-lg font-bold text-gray-800">Monitor Spending</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}