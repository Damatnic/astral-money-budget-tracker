/**
 * Notification Overlay Component
 * Handles system notifications like offline status, loading states, and errors
 */

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LoadingState, ErrorState } from '@/types';

interface NotificationOverlayProps {
  isOffline: boolean;
  loading: LoadingState;
  errors: ErrorState;
  budgetAlerts?: string[];
}

export function NotificationOverlay({ 
  isOffline, 
  loading, 
  errors, 
  budgetAlerts = [] 
}: NotificationOverlayProps) {
  const hasLoadingState = Object.values(loading).some(state => state);
  const hasErrors = Object.values(errors).some(error => error !== null);

  return (
    <>
      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-40">
          ⚠️ You're offline. Some features may be limited.
        </div>
      )}

      {/* Loading Overlay */}
      {hasLoadingState && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center min-w-[200px]">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600 text-center">
              {loading.userData && "Loading your financial data..."}
              {loading.expenses && "Loading expenses..."}
              {loading.income && "Loading income..."}
              {loading.recurringBills && "Loading bills..."}
              {loading.creating && "Creating transaction..."}
              {loading.updating && "Updating transaction..."}
              {loading.deleting && "Deleting transaction..."}
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {hasErrors && (
        <div className="fixed top-20 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 z-40 max-w-md mx-auto">
          <h4 className="text-red-800 font-semibold mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Issues Occurred
          </h4>
          <ul className="text-red-600 text-sm space-y-1">
            {Object.entries(errors).map(([key, error]) => 
              error && (
                <li key={key} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}: {error}</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-md">
            <h4 className="text-yellow-800 font-semibold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              Budget Alerts
            </h4>
            <div className="space-y-2">
              {budgetAlerts.map((alert, index) => (
                <div key={index} className="text-yellow-700 text-sm flex items-start">
                  <span className="mr-2">•</span>
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}