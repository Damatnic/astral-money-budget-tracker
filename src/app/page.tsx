/**
 * Main Page Component - Refactored
 * 
 * This is the new, simplified main page that uses the refactored
 * dashboard architecture instead of the monolithic 5,432-line component.
 * 
 * Key improvements:
 * - Separation of concerns
 * - Component modularity  
 * - Better maintainability
 * - Improved testability
 * - Cleaner error boundaries
 */

'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { MainDashboard } from '@/components/dashboard/MainDashboard';

// Custom Error Boundary component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
    
    if (process.env.NODE_ENV === 'production') {
      // In production, send to error reporting service
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} resetError={() => this.setState({ hasError: false, error: undefined })} />;
    }

    return this.props.children;
  }
}

// Simple error fallback component
function ErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        
        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. Don't worry, your data is safe.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-4 border border-gray-300 rounded-lg transition-colors"
          >
            Refresh Page
          </button>
        </div>

        {/* Error details for development */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 mb-2">
              Error Details (Development Only)
            </summary>
            <pre className="text-xs text-red-600 bg-red-50 p-3 rounded border overflow-auto max-h-32">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Main Astral Money Application Component
 * 
 * This component provides:
 * - Error boundary protection
 * - Clean separation from dashboard logic
 * - Simple, maintainable structure
 */
function AstralMoneyApp() {
  return (
    <ErrorBoundary>
      <MainDashboard />
    </ErrorBoundary>
  );
}

export default AstralMoneyApp;