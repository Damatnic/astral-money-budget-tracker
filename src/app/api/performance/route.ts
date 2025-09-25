/**
 * Performance Monitoring API
 * Real-time performance metrics and analytics endpoint
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { APIErrorHandler } from '@/lib/api-error-handler';
import { PerformanceMonitor } from '@/middleware/performance-monitor';
import { requireAuth } from '@/lib/auth-utils';
import { AuthorizationError } from '@/lib/api-error-handler';

// Performance metrics endpoint
export const GET = APIErrorHandler.withErrorHandling(async (request: NextRequest) => {
  // Check if user is authenticated and has admin privileges
  const user = await requireAuth();
  
  // For security, only allow in development mode (admin check would need user role system)
  if (process.env.NODE_ENV === 'production') {
    throw new AuthorizationError('Performance metrics access restricted in production');
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'overview';
  const route = url.searchParams.get('route');
  const format = url.searchParams.get('format') || 'json';

  switch (type) {
    case 'overview':
      const report = PerformanceMonitor.getPerformanceReport();
      
      if (format === 'prometheus') {
        // Return Prometheus-compatible metrics
        const prometheusMetrics = formatPrometheusMetrics(report);
        return new NextResponse(prometheusMetrics, {
          headers: { 'Content-Type': 'text/plain' },
        });
      }
      
      return APIErrorHandler.createSuccessResponse(report);

    case 'route':
      if (!route) {
        throw new Error('Route parameter is required for route-specific metrics');
      }
      
      const routePerformance = PerformanceMonitor.getRoutePerformance(route);
      if (!routePerformance) {
        return APIErrorHandler.createSuccessResponse(null, 'No data found for specified route');
      }
      
      return APIErrorHandler.createSuccessResponse(routePerformance);

    case 'realtime':
      // Return real-time metrics for dashboard
      const realtimeData = {
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage(),
        activeHandles: (process as any)._getActiveHandles?.()?.length || 0,
        activeRequests: (process as any)._getActiveRequests?.()?.length || 0,
      };
      
      return APIErrorHandler.createSuccessResponse(realtimeData);

    case 'alerts':
      // Get performance-related alerts from the last 24 hours
      const alerts = getPerformanceAlerts();
      return APIErrorHandler.createSuccessResponse(alerts);

    default:
      throw new Error(`Unknown performance metrics type: ${type}`);
  }
}, { route: '/api/performance' });

// Clear metrics endpoint (admin only)
export const DELETE = APIErrorHandler.withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth();
  
  if (process.env.NODE_ENV === 'production') {
    throw new AuthorizationError('Metrics clearing restricted in production');
  }

  PerformanceMonitor.clearMetrics();
  
  return APIErrorHandler.createSuccessResponse(
    { message: 'Performance metrics cleared successfully' },
    'Metrics cleared',
    200
  );
}, { route: '/api/performance' });

// Helper functions
function formatPrometheusMetrics(report: any): string {
  const metrics: string[] = [];
  
  // Overview metrics
  metrics.push(`# HELP astral_requests_total Total number of requests`);
  metrics.push(`# TYPE astral_requests_total counter`);
  metrics.push(`astral_requests_total ${report.overview.totalRequests}`);
  
  metrics.push(`# HELP astral_request_duration_ms Average request duration in milliseconds`);
  metrics.push(`# TYPE astral_request_duration_ms gauge`);
  metrics.push(`astral_request_duration_ms ${report.overview.averageResponseTime}`);
  
  metrics.push(`# HELP astral_error_rate Percentage of requests that resulted in errors`);
  metrics.push(`# TYPE astral_error_rate gauge`);
  metrics.push(`astral_error_rate ${report.overview.errorRate}`);
  
  metrics.push(`# HELP astral_slow_request_rate Percentage of requests that were slow`);
  metrics.push(`# TYPE astral_slow_request_rate gauge`);
  metrics.push(`astral_slow_request_rate ${report.overview.slowRequestRate}`);
  
  // Memory metrics
  const memUsage = process.memoryUsage();
  metrics.push(`# HELP astral_memory_heap_used_bytes Heap memory used in bytes`);
  metrics.push(`# TYPE astral_memory_heap_used_bytes gauge`);
  metrics.push(`astral_memory_heap_used_bytes ${memUsage.heapUsed}`);
  
  metrics.push(`# HELP astral_memory_heap_total_bytes Total heap memory in bytes`);
  metrics.push(`# TYPE astral_memory_heap_total_bytes gauge`);
  metrics.push(`astral_memory_heap_total_bytes ${memUsage.heapTotal}`);
  
  // Route-specific metrics
  metrics.push(`# HELP astral_route_requests_total Total requests per route`);
  metrics.push(`# TYPE astral_route_requests_total counter`);
  
  metrics.push(`# HELP astral_route_duration_ms Average duration per route`);
  metrics.push(`# TYPE astral_route_duration_ms gauge`);
  
  metrics.push(`# HELP astral_route_errors_total Total errors per route`);
  metrics.push(`# TYPE astral_route_errors_total counter`);
  
  report.routes.forEach((route: any) => {
    const routeLabel = `route="${route.route}",method="${route.method}"`;
    metrics.push(`astral_route_requests_total{${routeLabel}} ${route.requestCount}`);
    metrics.push(`astral_route_duration_ms{${routeLabel}} ${route.averageResponseTime}`);
    metrics.push(`astral_route_errors_total{${routeLabel}} ${route.errorCount}`);
  });
  
  return metrics.join('\n') + '\n';
}

function getPerformanceAlerts(): any[] {
  // This would integrate with your alerting system
  // For now, return mock data or integrate with HealthMonitor
  return [
    {
      id: 'perf-001',
      level: 'warning',
      message: 'Average response time exceeding threshold',
      timestamp: new Date().toISOString(),
      component: 'performance',
      details: {
        threshold: 1000,
        current: 1250,
        route: '/api/expenses',
      }
    }
  ];
}

// Note: PerformanceMonitor export removed to avoid Next.js build issues
