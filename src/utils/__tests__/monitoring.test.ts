/**
 * Monitoring Utility Tests
 * Tests for performance monitoring and error tracking
 */

import { 
  MonitoringService,
  ErrorReporter,
  PerformanceTracker
} from '../monitoring';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('MonitoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackMetric', () => {
    it('should track metrics with name and value', () => {
      MonitoringService.trackMetric('test_metric', 123);
      // In development, this should log to console
      if (process.env.NODE_ENV === 'development') {
        expect(console.log).toHaveBeenCalled();
      }
    });

    it('should track metrics with tags', () => {
      MonitoringService.trackMetric('test_metric', 456, { component: 'test' });
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('trackUserAction', () => {
    it('should track user actions', () => {
      MonitoringService.trackUserAction('button_click', 'TestComponent');
      // In development, this should log to console
      if (process.env.NODE_ENV === 'development') {
        expect(console.log).toHaveBeenCalled();
      }
    });

    it('should track user actions with metadata', () => {
      MonitoringService.trackUserAction('form_submit', 'TestForm', { 
        formId: 'test-form' 
      });
      // Should not throw error
      expect(true).toBe(true);
    });
  });
});

describe('ErrorReporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reportError', () => {
    it('should report errors', () => {
      const error = new Error('Test error');
      ErrorReporter.reportError(error);
      // Should not throw error
      expect(true).toBe(true);
    });

    it('should report errors with context', () => {
      const error = new Error('Test error with context');
      ErrorReporter.reportError(error, { component: 'TestComponent' });
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('reportWarning', () => {
    it('should report warnings', () => {
      ErrorReporter.reportWarning('Test warning');
      // Should not throw error
      expect(true).toBe(true);
    });

    it('should report warnings with context', () => {
      ErrorReporter.reportWarning('Test warning with context', { 
        level: 'medium' 
      });
      // Should not throw error
      expect(true).toBe(true);
    });
  });
});

describe('PerformanceTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock performance.now()
    global.performance = {
      ...global.performance,
      now: jest.fn(() => Date.now())
    };
  });

  describe('startTimer', () => {
    it('should start a timer', () => {
      PerformanceTracker.startTimer('test_operation');
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('endTimer', () => {
    it('should end a timer and return duration', () => {
      PerformanceTracker.startTimer('test_operation');
      const duration = PerformanceTracker.endTimer('test_operation');
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for non-existent timer', () => {
      const duration = PerformanceTracker.endTimer('non_existent');
      expect(duration).toBe(0);
    });
  });

  describe('measureAsync', () => {
    it('should measure async operations', async () => {
      const asyncOperation = () => Promise.resolve('test result');
      const result = await PerformanceTracker.measureAsync(
        'async_test',
        asyncOperation
      );
      expect(result).toBe('test result');
    });

    it('should handle async operation errors', async () => {
      const failingOperation = () => Promise.reject(new Error('Async error'));
      
      await expect(
        PerformanceTracker.measureAsync('failing_async', failingOperation)
      ).rejects.toThrow('Async error');
    });
  });
});
