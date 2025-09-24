/**
 * Toast Notification Component
 * Displays temporary notifications with auto-dismiss functionality
 */

import { useEffect } from 'react';
import { Notification } from '@/types';

interface ToastProps {
  notification: Notification;
  onClose: () => void;
  autoHideDuration?: number;
}

export function Toast({ notification, onClose, autoHideDuration = 5000 }: ToastProps) {
  const typeStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  const priorityStyles = {
    critical: 'ring-2 ring-red-500',
    high: 'shadow-lg',
    medium: 'shadow-md',
    low: 'shadow-sm'
  };

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(onClose, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [onClose, autoHideDuration]);

  return (
    <div 
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg border max-w-sm transform transition-all duration-300 ${typeStyles[notification.type]} ${priorityStyles[notification.priority]}`}
      role="alert"
      aria-live={notification.priority === 'critical' ? 'assertive' : 'polite'}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{notification.title}</h4>
          <p className="text-sm mt-1 opacity-90">{notification.message}</p>
          {notification.timestamp && (
            <p className="text-xs mt-2 opacity-70">
              {notification.timestamp.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}