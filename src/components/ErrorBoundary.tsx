/**
 * Enhanced Error Boundary Component
 * Comprehensive error handling with logging, recovery, and user feedback
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { clientLogger } from '@/lib/client-logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, name, level = 'component' } = this.props;
    
    // Log error with client logger
    clientLogger.error(
      `React Error Boundary: ${error.message}`,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: name || 'Unknown',
        level,
        retryCount: this.retryCount,
        stack: error.stack,
      },
      {
        component: 'error-boundary',
        errorBoundaryName: name,
        errorBoundaryLevel: level,
      }
    );

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Track error in monitoring
    if (typeof window !== 'undefined') {
      // Client-side error tracking
      this.trackClientError(error, errorInfo);
    }
  }

  private trackClientError(error: Error, errorInfo: ErrorInfo) {
    // Send error to monitoring service
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          errorBoundary: this.props.name,
          level: this.props.level,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          errorId: this.state.errorId,
        }),
      }).catch(err => {
        console.error('Failed to send error to monitoring service:', err);
      });
    } catch (err) {
      console.error('Error in error tracking:', err);
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      clientLogger.info(`Error boundary retry attempt ${this.retryCount}`, {
        errorId: this.state.errorId,
        maxRetries: this.maxRetries,
      });
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    }
  };

  private handleReload = () => {
    clientLogger.info('Error boundary triggered page reload', {
      errorId: this.state.errorId,
    });
    
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private renderFallback(): ReactNode {
    const { fallback, level = 'component', name } = this.props;
    const { error, errorInfo, errorId } = this.state;

    // Custom fallback provided
    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback(error!, errorInfo!);
      }
      return fallback;
    }

    // Default fallback based on error level
    const canRetry = this.retryCount < this.maxRetries;
    const isPageLevel = level === 'page';

    return (
      <div
        className={`
          ${isPageLevel ? 'min-h-screen flex items-center justify-center bg-gray-50' : 'p-6 bg-red-50 border border-red-200 rounded-lg'}
        `}
        data-testid="error-boundary-fallback"
        data-error-id={errorId}
        data-error-level={level}
      >
        <div className="text-center max-w-md">
          {/* Error Icon */}
          <div className="mb-4">
            {isPageLevel ? (
              <div className="text-6xl mb-4">⚠️</div>
            ) : (
              <div className="text-4xl mb-2">⚠️</div>
            )}
          </div>

          {/* Error Title */}
          <h2 className={`font-bold text-gray-900 mb-2 ${isPageLevel ? 'text-2xl' : 'text-lg'}`}>
            {isPageLevel ? 'Something went wrong' : 'Component Error'}
          </h2>

          {/* Error Description */}
          <p className="text-gray-600 mb-4">
            {isPageLevel
              ? 'We encountered an unexpected error. Please try refreshing the page.'
              : `There was an error in the ${name || 'component'}. You can try again or refresh the page.`
            }
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mb-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error Details (Development)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                <div className="font-semibold mb-1">Error:</div>
                <div className="mb-2">{error.message}</div>
                {error.stack && (
                  <>
                    <div className="font-semibold mb-1">Stack Trace:</div>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                  </>
                )}
              </div>
            </details>
          )}

          {/* Error ID */}
          <div className="text-xs text-gray-400 mb-4">
            Error ID: {errorId}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="retry-button"
              >
                Try Again ({this.maxRetries - this.retryCount} attempts left)
              </button>
            )}
            
            <button
              onClick={this.handleReload}
              className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              data-testid="reload-button"
            >
              {isPageLevel ? 'Refresh Page' : 'Reload Page'}
            </button>
          </div>

          {/* Additional Help */}
          {isPageLevel && (
            <div className="mt-6 text-sm text-gray-500">
              <p>If the problem persists, please contact support.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallback();
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error boundary context
export function useErrorHandler() {
  return {
    captureError: (error: Error, context?: string) => {
      clientLogger.error(`Manual error capture: ${error.message}`, { error: error.message, stack: error.stack, context });
      throw error; // Re-throw to trigger error boundary
    },
    reportError: (error: Error, context?: string) => {
      clientLogger.error(`Error reported: ${error.message}`, { error: error.message, stack: error.stack, context });
      // Don't re-throw, just report
    },
  };
}

// Async error boundary hook
export function useAsyncError() {
  const [, setError] = React.useState();
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}