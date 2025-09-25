/**
 * Comprehensive API Endpoint Tests
 * Tests for all major API routes with proper error handling and validation
 */

import { NextRequest } from 'next/server';
import { GET as healthGET } from '@/app/api/health/route';
import { GET as performanceGET } from '@/app/api/performance/route';

// Mock dependencies
jest.mock('@/lib/auth-utils', () => ({
  requireAuth: jest.fn(() => Promise.resolve({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  })),
}));

jest.mock('@/utils/monitoring', () => ({
  MonitoringService: {
    trackMetric: jest.fn(),
    trackError: jest.fn(),
    trackUserAction: jest.fn(),
    getMetrics: jest.fn(() => []),
    getErrors: jest.fn(() => []),
    getActions: jest.fn(() => []),
  },
}));

jest.mock('@/lib/database-optimizer', () => ({
  createHealthCheckResponse: jest.fn(() => Promise.resolve({
    database: {
      status: 'healthy',
      responseTime: 50,
      activeConnections: 5,
    },
    performance: {
      averageQueryTime: 25,
      slowQueries: 0,
      queriesPerSecond: 10.5,
      totalQueries: 1000,
    },
    optimizations: [],
    timestamp: new Date().toISOString(),
  })),
}));

// Mock process for Node.js APIs
const mockProcess = {
  memoryUsage: jest.fn(() => ({
    rss: 50 * 1024 * 1024,
    heapTotal: 30 * 1024 * 1024,
    heapUsed: 20 * 1024 * 1024,
    external: 5 * 1024 * 1024,
    arrayBuffers: 2 * 1024 * 1024,
  })),
  uptime: jest.fn(() => 3600), // 1 hour
  cpuUsage: jest.fn(() => ({
    user: 100000,
    system: 50000,
  })),
};

// Mock global process
Object.defineProperty(global, 'process', {
  value: mockProcess,
  writable: true,
});

describe('API Endpoints - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set development mode for tests
    process.env.NODE_ENV = 'development';
  });

  describe('Health API (/api/health)', () => {
    const createHealthRequest = (params: Record<string, string> = {}) => {
      const url = new URL('http://localhost:3000/api/health');
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      
      return new NextRequest(url);
    };

    it('should return basic health status', async () => {
      const request = createHealthRequest();
      const response = await healthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('components');
      expect(data).toHaveProperty('metrics');
    });

    it('should return detailed health information when requested', async () => {
      const request = createHealthRequest({ detailed: 'true' });
      const response = await healthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('alerts');
      expect(Array.isArray(data.alerts)).toBe(true);
    });

    it('should return specific component health', async () => {
      const request = createHealthRequest({ component: 'database' });
      const response = await healthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('component', 'database');
    });

    it('should include proper cache headers', async () => {
      const request = createHealthRequest();
      const response = await healthGET(request);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('X-Health-Status')).toBeTruthy();
      expect(response.headers.get('X-Response-Time')).toBeTruthy();
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in health check
      const mockCreateHealthCheckResponse = require('@/lib/database-optimizer').createHealthCheckResponse;
      mockCreateHealthCheckResponse.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = createHealthRequest();
      const response = await healthGET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });
  });

  describe('Performance API (/api/performance)', () => {
    const createPerformanceRequest = (params: Record<string, string> = {}) => {
      const url = new URL('http://localhost:3000/api/performance');
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      
      return new NextRequest(url);
    };

    it('should return performance overview', async () => {
      const request = createPerformanceRequest();
      const response = await performanceGET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('overview');
      expect(data.data).toHaveProperty('routes');
    });

    it('should return realtime performance data', async () => {
      const request = createPerformanceRequest({ type: 'realtime' });
      const response = await performanceGET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('timestamp');
      expect(data.data).toHaveProperty('memory');
      expect(data.data).toHaveProperty('uptime');
    });

    it('should return Prometheus metrics format', async () => {
      const request = createPerformanceRequest({ format: 'prometheus' });
      const response = await performanceGET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain');
      
      const text = await response.text();
      expect(text).toContain('# HELP');
      expect(text).toContain('# TYPE');
      expect(text).toContain('astral_');
    });

    it('should handle invalid type parameter', async () => {
      const request = createPerformanceRequest({ type: 'invalid' });
      const response = await performanceGET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Unknown performance metrics type');
    });

    it('should restrict access in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const request = createPerformanceRequest();
      const response = await performanceGET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      const mockRequireAuth = require('@/lib/auth-utils').requireAuth;
      mockRequireAuth.mockRejectedValueOnce(new Error('Authentication required'));

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthGET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should include request IDs in error responses', async () => {
      const mockRequireAuth = require('@/lib/auth-utils').requireAuth;
      mockRequireAuth.mockRejectedValueOnce(new Error('Test error'));

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthGET(request);

      const data = await response.json();
      expect(data.error).toHaveProperty('requestId');
      expect(data.error).toHaveProperty('timestamp');
    });

    it('should log errors to monitoring service', async () => {
      const mockRequireAuth = require('@/lib/auth-utils').requireAuth;
      mockRequireAuth.mockRejectedValueOnce(new Error('Test monitoring error'));

      const request = new NextRequest('http://localhost:3000/api/health');
      await healthGET(request);

      // Error should be tracked in monitoring
      const MonitoringService = require('@/utils/monitoring').MonitoringService;
      expect(MonitoringService.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          severity: expect.any(String),
        })
      );
    });
  });

  describe('Performance Characteristics', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthGET(request);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        healthGET(new NextRequest('http://localhost:3000/api/health'))
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should not leak memory during multiple requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make multiple requests
      for (let i = 0; i < 20; i++) {
        const request = new NextRequest('http://localhost:3000/api/health');
        await healthGET(request);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Security', () => {
    it('should not expose sensitive information in errors', async () => {
      const mockCreateHealthCheckResponse = require('@/lib/database-optimizer').createHealthCheckResponse;
      mockCreateHealthCheckResponse.mockRejectedValueOnce(new Error('Database password is invalid123'));

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthGET(request);

      const data = await response.json();
      expect(JSON.stringify(data)).not.toContain('password');
      expect(JSON.stringify(data)).not.toContain('123'); // Assuming this is sensitive
    });

    it('should include security headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthGET(request);

      expect(response.headers.get('X-Request-ID')).toBeTruthy();
      expect(response.headers.get('X-Response-Time')).toBeTruthy();
    });

    it('should validate request parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/performance?type=<script>alert("xss")</script>');
      const response = await performanceGET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error.message).toContain('Unknown performance metrics type');
    });
  });

  describe('API Response Format', () => {
    it('should return consistent success response format', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthGET(request);
      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(typeof data.timestamp).toBe('string');
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should return consistent error response format', async () => {
      const mockRequireAuth = require('@/lib/auth-utils').requireAuth;
      mockRequireAuth.mockRejectedValueOnce(new Error('Test error'));

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthGET(request);
      const data = await response.json();

      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
      expect(data.error).toHaveProperty('timestamp');
      expect(data.error).toHaveProperty('requestId');
    });

    it('should include proper HTTP status codes', async () => {
      // Test successful request
      const successRequest = new NextRequest('http://localhost:3000/api/health');
      const successResponse = await healthGET(successRequest);
      expect(successResponse.status).toBe(200);

      // Test error request
      const mockRequireAuth = require('@/lib/auth-utils').requireAuth;
      mockRequireAuth.mockRejectedValueOnce(new Error('Test error'));

      const errorRequest = new NextRequest('http://localhost:3000/api/health');
      const errorResponse = await healthGET(errorRequest);
      expect(errorResponse.status).toBeGreaterThanOrEqual(400);
    });
  });
});
