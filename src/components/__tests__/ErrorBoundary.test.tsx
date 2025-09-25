/**
 * Comprehensive Error Boundary Tests
 * Tests error handling, recovery, logging, and user experience
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary, useErrorHandler, useAsyncError } from '../ErrorBoundary';

// Mock the advanced logger
jest.mock('@/lib/advanced-logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock fetch for error reporting
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Test components that throw errors
const ThrowError = ({ shouldThrow = true, errorMessage = 'Test error' }: { shouldThrow?: boolean; errorMessage?: string }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="no-error">No error occurred</div>;
};

const AsyncThrowError = () => {
  const throwAsyncError = useAsyncError();
  
  React.useEffect(() => {
    setTimeout(() => {
      throwAsyncError(new Error('Async test error'));
    }, 100);
  }, [throwAsyncError]);

  return <div data-testid="async-component">Async component</div>;
};

const ComponentWithErrorHandler = () => {
  const { captureError, reportError } = useErrorHandler();
  
  return (
    <div>
      <button
        data-testid="capture-error-btn"
        onClick={() => captureError(new Error('Captured error'), 'test-context')}
      >
        Capture Error
      </button>
      <button
        data-testid="report-error-btn"
        onClick={() => reportError(new Error('Reported error'), 'test-context')}
      >
        Report Error
      </button>
    </div>
  );
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Error Catching', () => {
    it('should catch and display errors from child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.getByText('Component Error')).toBeInTheDocument();
      expect(screen.getByText(/There was an error in the component/)).toBeInTheDocument();
    });

    it('should display custom error message with component name', () => {
      render(
        <ErrorBoundary name="TestComponent">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/There was an error in the TestComponent/)).toBeInTheDocument();
    });

    it('should show different UI for page-level errors', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
    });

    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('no-error')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback component', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    });

    it('should render custom fallback function with error details', () => {
      const customFallbackFn = (error: Error) => (
        <div data-testid="custom-fallback-fn">
          Error: {error.message}
        </div>
      );

      render(
        <ErrorBoundary fallback={customFallbackFn}>
          <ThrowError errorMessage="Custom error message" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback-fn')).toBeInTheDocument();
      expect(screen.getByText('Error: Custom error message')).toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    it('should log errors with advanced logger', () => {
      const { logger } = require('@/lib/advanced-logger');

      render(
        <ErrorBoundary name="TestComponent">
          <ThrowError errorMessage="Logged error" />
        </ErrorBoundary>
      );

      expect(logger.error).toHaveBeenCalledWith(
        'React Error Boundary: Logged error',
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
          errorBoundary: 'TestComponent',
          level: 'component',
          retryCount: 0,
        }),
        expect.objectContaining({
          component: 'error-boundary',
          context: expect.objectContaining({
            errorBoundaryName: 'TestComponent',
            errorBoundaryLevel: 'component',
          }),
        })
      );
    });

    it('should call custom onError handler', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError errorMessage="Custom handler error" />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Custom handler error' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it('should send error to monitoring service', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      render(
        <ErrorBoundary>
          <ThrowError errorMessage="Monitoring error" />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Monitoring error'),
        });
      });
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry with working retry button', async () => {
      let shouldThrow = true;
      const RetryableComponent = () => <ThrowError shouldThrow={shouldThrow} />;

      render(
        <ErrorBoundary>
          <RetryableComponent />
        </ErrorBoundary>
      );

      // Error should be displayed
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();

      // Fix the component and retry
      shouldThrow = false;
      fireEvent.click(screen.getByTestId('retry-button'));

      await waitFor(() => {
        expect(screen.getByTestId('no-error')).toBeInTheDocument();
        expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
      });
    });

    it('should limit retry attempts', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = screen.getByTestId('retry-button');
      
      // Should show 3 attempts initially
      expect(retryButton).toHaveTextContent('3 attempts left');

      // Click retry multiple times
      fireEvent.click(retryButton);
      expect(screen.getByTestId('retry-button')).toHaveTextContent('2 attempts left');

      fireEvent.click(screen.getByTestId('retry-button'));
      expect(screen.getByTestId('retry-button')).toHaveTextContent('1 attempts left');

      fireEvent.click(screen.getByTestId('retry-button'));
      
      // After max retries, retry button should be gone
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
    });

    it('should reload page when reload button is clicked', () => {
      // Mock window.location.reload
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByTestId('reload-button'));
      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Development Mode', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show error details in development mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError errorMessage="Development error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
      
      // Click to expand details
      fireEvent.click(screen.getByText('Error Details (Development)'));
      expect(screen.getByText('Development error')).toBeInTheDocument();
    });
  });

  describe('Higher-Order Component', () => {
    it('should wrap component with error boundary', () => {
      const WrappedComponent = withErrorBoundary(ThrowError, { name: 'WrappedTest' });

      render(<WrappedComponent />);

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.getByText(/There was an error in the WrappedTest/)).toBeInTheDocument();
    });

    it('should preserve component display name', () => {
      const TestComponent = () => <div>Test</div>;
      TestComponent.displayName = 'TestComponent';

      const WrappedComponent = withErrorBoundary(TestComponent);
      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
    });
  });

  describe('Error Handler Hook', () => {
    it('should capture and throw errors', () => {
      render(
        <ErrorBoundary>
          <ComponentWithErrorHandler />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByTestId('capture-error-btn'));

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.getByText('Component Error')).toBeInTheDocument();
    });

    it('should report errors without throwing', () => {
      const { logger } = require('@/lib/advanced-logger');

      render(
        <ErrorBoundary>
          <ComponentWithErrorHandler />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByTestId('report-error-btn'));

      // Should not trigger error boundary
      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
      
      // But should log the error
      expect(logger.error).toHaveBeenCalledWith(
        'Error reported: Reported error',
        expect.any(Error),
        { context: 'test-context' }
      );
    });
  });

  describe('Async Error Hook', () => {
    it('should handle async errors', async () => {
      render(
        <ErrorBoundary>
          <AsyncThrowError />
        </ErrorBoundary>
      );

      // Initially should render normally
      expect(screen.getByTestId('async-component')).toBeInTheDocument();

      // Wait for async error to be thrown
      await waitFor(() => {
        expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Error Boundary Attributes', () => {
    it('should include error metadata in DOM', () => {
      render(
        <ErrorBoundary level="section" name="TestSection">
          <ThrowError />
        </ErrorBoundary>
      );

      const fallback = screen.getByTestId('error-boundary-fallback');
      expect(fallback).toHaveAttribute('data-error-level', 'section');
      expect(fallback).toHaveAttribute('data-error-id');
    });

    it('should generate unique error IDs', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const firstErrorId = screen.getByTestId('error-boundary-fallback').getAttribute('data-error-id');

      rerender(
        <ErrorBoundary>
          <ThrowError errorMessage="Different error" />
        </ErrorBoundary>
      );

      const secondErrorId = screen.getByTestId('error-boundary-fallback').getAttribute('data-error-id');
      expect(firstErrorId).not.toBe(secondErrorId);
    });
  });

  describe('Error Recovery Logging', () => {
    it('should log retry attempts', () => {
      const { logger } = require('@/lib/advanced-logger');

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByTestId('retry-button'));

      expect(logger.info).toHaveBeenCalledWith(
        'Error boundary retry attempt 1',
        expect.objectContaining({
          maxRetries: 3,
        })
      );
    });

    it('should log page reload attempts', () => {
      const { logger } = require('@/lib/advanced-logger');
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByTestId('reload-button'));

      expect(logger.info).toHaveBeenCalledWith(
        'Error boundary triggered page reload',
        expect.objectContaining({
          errorId: expect.any(String),
        })
      );
    });
  });
});
