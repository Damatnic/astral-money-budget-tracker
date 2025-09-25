/**
 * Performance and Load Testing Suite
 * Tests application performance under various load conditions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock performance APIs
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock fetch for API performance testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Performance testing utilities
class PerformanceTester {
  private startTime: number = 0;
  private endTime: number = 0;
  private measurements: Array<{ name: string; duration: number; timestamp: number }> = [];

  start(name: string = 'default') {
    this.startTime = performance.now();
    performance.mark(`${name}-start`);
  }

  end(name: string = 'default') {
    this.endTime = performance.now();
    performance.mark(`${name}-end`);
    const duration = this.endTime - this.startTime;
    
    this.measurements.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    return duration;
  }

  getDuration() {
    return this.endTime - this.startTime;
  }

  getMeasurements() {
    return this.measurements;
  }

  reset() {
    this.measurements = [];
    this.startTime = 0;
    this.endTime = 0;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    this.start(name);
    const result = await fn();
    const duration = this.end(name);
    return { result, duration };
  }

  measureSync<T>(name: string, fn: () => T): { result: T; duration: number } {
    this.start(name);
    const result = fn();
    const duration = this.end(name);
    return { result, duration };
  }
}

// Memory usage tracker
class MemoryTracker {
  private snapshots: Array<{ name: string; usage: any; timestamp: number }> = [];

  takeSnapshot(name: string) {
    const usage = (performance as any).memory || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    };

    this.snapshots.push({
      name,
      usage: { ...usage },
      timestamp: Date.now(),
    });

    return usage;
  }

  getSnapshots() {
    return this.snapshots;
  }

  getMemoryDelta(startSnapshot: string, endSnapshot: string) {
    const start = this.snapshots.find(s => s.name === startSnapshot);
    const end = this.snapshots.find(s => s.name === endSnapshot);

    if (!start || !end) {
      return null;
    }

    return {
      usedJSHeapSize: end.usage.usedJSHeapSize - start.usage.usedJSHeapSize,
      totalJSHeapSize: end.usage.totalJSHeapSize - start.usage.totalJSHeapSize,
    };
  }

  reset() {
    this.snapshots = [];
  }
}

// Load testing utilities
class LoadTester {
  async simulateConcurrentUsers(userCount: number, userAction: () => Promise<void>) {
    const promises = Array.from({ length: userCount }, (_, i) =>
      this.simulateUser(`user-${i}`, userAction)
    );

    const startTime = performance.now();
    const results = await Promise.allSettled(promises);
    const endTime = performance.now();

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      totalUsers: userCount,
      successful,
      failed,
      duration: endTime - startTime,
      throughput: userCount / ((endTime - startTime) / 1000), // users per second
    };
  }

  private async simulateUser(userId: string, userAction: () => Promise<void>) {
    try {
      await userAction();
    } catch (error) {
      throw new Error(`User ${userId} failed: ${error}`);
    }
  }

  async stressTest(
    initialUsers: number,
    maxUsers: number,
    stepSize: number,
    userAction: () => Promise<void>
  ) {
    const results = [];

    for (let users = initialUsers; users <= maxUsers; users += stepSize) {
      const result = await this.simulateConcurrentUsers(users, userAction);
      results.push({ users, ...result });

      // Add delay between stress levels
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}

// Test components for performance testing
const PerformanceTestComponent = ({ itemCount = 100 }: { itemCount?: number }) => {
  const [items, setItems] = React.useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = React.useState(false);

  const generateItems = React.useCallback(() => {
    setLoading(true);
    const newItems = Array.from({ length: itemCount }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    setItems(newItems);
    setLoading(false);
  }, [itemCount]);

  const addItem = React.useCallback(() => {
    setItems(prev => [...prev, { id: prev.length, name: `Item ${prev.length}` }]);
  }, []);

  const clearItems = React.useCallback(() => {
    setItems([]);
  }, []);

  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }

  return (
    <div data-testid="performance-component">
      <div>
        <button onClick={generateItems} data-testid="generate-btn">
          Generate {itemCount} Items
        </button>
        <button onClick={addItem} data-testid="add-btn">
          Add Item
        </button>
        <button onClick={clearItems} data-testid="clear-btn">
          Clear Items
        </button>
      </div>
      <div data-testid="items-count">Items: {items.length}</div>
      <div data-testid="items-list">
        {items.map(item => (
          <div key={item.id} data-testid={`item-${item.id}`}>
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
};

describe('Performance and Load Testing', () => {
  let performanceTester: PerformanceTester;
  let memoryTracker: MemoryTracker;
  let loadTester: LoadTester;

  beforeEach(() => {
    performanceTester = new PerformanceTester();
    memoryTracker = new MemoryTracker();
    loadTester = new LoadTester();
    mockFetch.mockClear();
  });

  afterEach(() => {
    performanceTester.reset();
    memoryTracker.reset();
  });

  describe('Component Rendering Performance', () => {
    it('should render components within acceptable time limits', async () => {
      const { result, duration } = performanceTester.measureSync('component-render', () => {
        return render(<PerformanceTestComponent itemCount={100} />);
      });

      expect(result.container).toBeInTheDocument();
      expect(duration).toBeLessThan(100); // Should render within 100ms
    });

    it('should handle large lists efficiently', async () => {
      const user = userEvent.setup();
      
      render(<PerformanceTestComponent itemCount={1000} />);

      const { duration } = await performanceTester.measureAsync('large-list-generation', async () => {
        await user.click(screen.getByTestId('generate-btn'));
        await waitFor(() => {
          expect(screen.getByText('Items: 1000')).toBeInTheDocument();
        });
      });

      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    it('should maintain performance with frequent updates', async () => {
      const user = userEvent.setup();
      render(<PerformanceTestComponent />);

      const updateTimes: number[] = [];

      // Perform 50 rapid updates
      for (let i = 0; i < 50; i++) {
        const { duration } = await performanceTester.measureAsync(`update-${i}`, async () => {
          await user.click(screen.getByTestId('add-btn'));
        });
        updateTimes.push(duration);
      }

      // Average update time should be reasonable
      const averageTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
      expect(averageTime).toBeLessThan(50); // Average should be under 50ms

      // No update should take longer than 200ms
      const maxTime = Math.max(...updateTimes);
      expect(maxTime).toBeLessThan(200);
    });
  });

  describe('Memory Usage Testing', () => {
    it('should not leak memory during component lifecycle', async () => {
      memoryTracker.takeSnapshot('start');

      const { unmount } = render(<PerformanceTestComponent itemCount={500} />);
      
      memoryTracker.takeSnapshot('after-render');

      // Generate items
      const user = userEvent.setup();
      await user.click(screen.getByTestId('generate-btn'));
      
      memoryTracker.takeSnapshot('after-generation');

      // Clear items
      await user.click(screen.getByTestId('clear-btn'));
      
      memoryTracker.takeSnapshot('after-clear');

      // Unmount component
      unmount();
      
      memoryTracker.takeSnapshot('after-unmount');

      const snapshots = memoryTracker.getSnapshots();
      expect(snapshots).toHaveLength(5);

      // Memory should not continuously grow
      const startMemory = snapshots[0].usage.usedJSHeapSize;
      const endMemory = snapshots[4].usage.usedJSHeapSize;
      const memoryGrowth = endMemory - startMemory;

      // Allow for some memory growth but not excessive
      expect(memoryGrowth).toBeLessThan(1024 * 1024); // Less than 1MB growth
    });

    it('should handle memory-intensive operations efficiently', async () => {
      memoryTracker.takeSnapshot('start');

      const { unmount } = render(<PerformanceTestComponent itemCount={2000} />);
      const user = userEvent.setup();

      // Generate large list
      await user.click(screen.getByTestId('generate-btn'));
      memoryTracker.takeSnapshot('large-list');

      // Clear and regenerate multiple times
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByTestId('clear-btn'));
        await user.click(screen.getByTestId('generate-btn'));
      }

      memoryTracker.takeSnapshot('after-cycles');
      unmount();
      memoryTracker.takeSnapshot('end');

      const delta = memoryTracker.getMemoryDelta('start', 'end');
      expect(delta?.usedJSHeapSize).toBeLessThan(2 * 1024 * 1024); // Less than 2MB growth
    });
  });

  describe('API Performance Testing', () => {
    it('should handle API requests within acceptable time limits', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      const { duration } = await performanceTester.measureAsync('api-request', async () => {
        const response = await fetch('/api/test');
        await response.json();
      });

      expect(duration).toBeLessThan(100); // Mock should be very fast
      expect(mockFetch).toHaveBeenCalledWith('/api/test');
    });

    it('should handle concurrent API requests efficiently', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      const concurrentRequests = 10;
      const { duration } = await performanceTester.measureAsync('concurrent-requests', async () => {
        const promises = Array.from({ length: concurrentRequests }, () =>
          fetch('/api/test').then(r => r.json())
        );
        await Promise.all(promises);
      });

      expect(duration).toBeLessThan(200); // All concurrent requests should complete quickly
      expect(mockFetch).toHaveBeenCalledTimes(concurrentRequests);
    });

    it('should handle API errors without performance degradation', async () => {
      // Mix of successful and failed requests
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

      const requestTimes: number[] = [];

      for (let i = 0; i < 4; i++) {
        const { duration } = await performanceTester.measureAsync(`error-request-${i}`, async () => {
          try {
            const response = await fetch('/api/test');
            if (response.ok) {
              await response.json();
            }
          } catch (error) {
            // Handle error
          }
        });
        requestTimes.push(duration);
      }

      // Error handling shouldn't significantly impact performance
      const averageTime = requestTimes.reduce((sum, time) => sum + time, 0) / requestTimes.length;
      expect(averageTime).toBeLessThan(50);
    });
  });

  describe('Load Testing', () => {
    it('should handle multiple concurrent users', async () => {
      const userAction = async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

        await fetch('/api/test');
      };

      const result = await loadTester.simulateConcurrentUsers(10, userAction);

      expect(result.totalUsers).toBe(10);
      expect(result.successful).toBe(10);
      expect(result.failed).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.throughput).toBeGreaterThan(5); // At least 5 users per second
    });

    it('should perform stress testing with increasing load', async () => {
      const userAction = async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await fetch('/api/stress-test');
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 10));
      };

      const results = await loadTester.stressTest(5, 20, 5, userAction);

      expect(results).toHaveLength(4); // 5, 10, 15, 20 users
      
      // All stress levels should complete successfully
      results.forEach(result => {
        expect(result.successful).toBe(result.users);
        expect(result.failed).toBe(0);
        expect(result.duration).toBeLessThan(2000); // Within 2 seconds
      });

      // Throughput should remain reasonable under stress
      const finalResult = results[results.length - 1];
      expect(finalResult.throughput).toBeGreaterThan(5);
    });

    it('should handle load testing failures gracefully', async () => {
      let requestCount = 0;
      const userAction = async () => {
        requestCount++;
        if (requestCount > 5) {
          throw new Error('Simulated overload');
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await fetch('/api/test');
      };

      const result = await loadTester.simulateConcurrentUsers(10, userAction);

      expect(result.totalUsers).toBe(10);
      expect(result.successful).toBe(5);
      expect(result.failed).toBe(5);
      expect(result.duration).toBeLessThan(1000);
    });
  });

  describe('Performance Regression Testing', () => {
    it('should maintain consistent performance across test runs', async () => {
      const runTimes: number[] = [];

      // Run the same test multiple times
      for (let i = 0; i < 5; i++) {
        const { duration } = performanceTester.measureSync(`regression-test-${i}`, () => {
          render(<PerformanceTestComponent itemCount={200} />);
        });
        runTimes.push(duration);
      }

      // Calculate variance to ensure consistency
      const average = runTimes.reduce((sum, time) => sum + time, 0) / runTimes.length;
      const variance = runTimes.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / runTimes.length;
      const standardDeviation = Math.sqrt(variance);

      // Standard deviation should be low, indicating consistent performance
      expect(standardDeviation).toBeLessThan(average * 0.3); // Less than 30% of average
    });

    it('should not degrade performance with repeated operations', async () => {
      render(<PerformanceTestComponent />);
      const user = userEvent.setup();

      const operationTimes: number[] = [];

      // Perform the same operation multiple times
      for (let i = 0; i < 20; i++) {
        const { duration } = await performanceTester.measureAsync(`repeated-operation-${i}`, async () => {
          await user.click(screen.getByTestId('add-btn'));
        });
        operationTimes.push(duration);
      }

      // Later operations shouldn't be significantly slower than earlier ones
      const firstFive = operationTimes.slice(0, 5);
      const lastFive = operationTimes.slice(-5);

      const firstAverage = firstFive.reduce((sum, time) => sum + time, 0) / firstFive.length;
      const lastAverage = lastFive.reduce((sum, time) => sum + time, 0) / lastFive.length;

      // Last operations shouldn't be more than 50% slower than first operations
      expect(lastAverage).toBeLessThan(firstAverage * 1.5);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track performance metrics correctly', async () => {
      const measurements = performanceTester.getMeasurements();
      expect(measurements).toHaveLength(0);

      performanceTester.start('test-metric');
      await new Promise(resolve => setTimeout(resolve, 50));
      const duration = performanceTester.end('test-metric');

      expect(duration).toBeGreaterThan(45);
      expect(duration).toBeLessThan(100);

      const updatedMeasurements = performanceTester.getMeasurements();
      expect(updatedMeasurements).toHaveLength(1);
      expect(updatedMeasurements[0].name).toBe('test-metric');
      expect(updatedMeasurements[0].duration).toBe(duration);
    });

    it('should integrate with browser performance APIs', () => {
      performanceTester.start('browser-integration');
      performanceTester.end('browser-integration');

      expect(mockPerformance.mark).toHaveBeenCalledWith('browser-integration-start');
      expect(mockPerformance.mark).toHaveBeenCalledWith('browser-integration-end');
    });
  });
});
