/**
 * Performance Monitoring Middleware
 * Real-time performance tracking and optimization for all requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '@/utils/monitoring';
import { HealthMonitor } from '@/app/api/health/route';

interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  contentLength?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  userId?: string;
  route?: string;
}

interface RoutePerformance {
  route: string;
  method: string;
  averageResponseTime: number;
  requestCount: number;
  errorCount: number;
  slowRequestCount: number;
  lastAccessed: Date;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static routeStats = new Map<string, RoutePerformance>();
  private static slowRequestThreshold = 1000; // 1 second
  private static maxMetricsHistory = 10000;
  
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static startRequest(request: NextRequest): PerformanceMetrics {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();

    const metrics: PerformanceMetrics = {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: this.getClientIP(request),
      startTime,
      memoryUsage,
      cpuUsage,
      route: this.extractRoute(request.url),
    };

    // Add to tracking
    this.metrics.push(metrics);
    
    // Cleanup old metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory / 2);
    }

    return metrics;
  }

  static endRequest(
    metrics: PerformanceMetrics, 
    response: NextResponse,
    userId?: string
  ): void {
    const endTime = Date.now();
    const duration = endTime - metrics.startTime;
    const statusCode = response.status;
    const contentLength = response.headers.get('content-length') 
      ? parseInt(response.headers.get('content-length')!) 
      : undefined;

    // Update metrics
    metrics.endTime = endTime;
    metrics.duration = duration;
    metrics.statusCode = statusCode;
    metrics.contentLength = contentLength;
    metrics.userId = userId;

    // Update route statistics
    this.updateRouteStats(metrics);

    // Track in monitoring service
    this.trackMetrics(metrics);

    // Check for performance issues
    this.checkPerformanceAlerts(metrics);

    // Add response headers for debugging
    response.headers.set('X-Request-ID', metrics.requestId);
    response.headers.set('X-Response-Time', duration.toString());
    
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('X-Memory-Usage', JSON.stringify({
        heapUsed: Math.round((metrics.memoryUsage?.heapUsed || 0) / 1024 / 1024),
        heapTotal: Math.round((metrics.memoryUsage?.heapTotal || 0) / 1024 / 1024),
      }));
    }
  }

  static getPerformanceReport(): {
    overview: {
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
      slowRequestRate: number;
      requestsPerMinute: number;
    };
    routes: RoutePerformance[];
    slowestRequests: PerformanceMetrics[];
    recentErrors: PerformanceMetrics[];
    memoryTrend: { timestamp: number; heapUsed: number }[];
  } {
    const recentMetrics = this.getRecentMetrics(60 * 60 * 1000); // Last hour
    const totalRequests = recentMetrics.length;
    
    const completedRequests = recentMetrics.filter(m => m.duration !== undefined);
    const errorRequests = recentMetrics.filter(m => m.statusCode && m.statusCode >= 400);
    const slowRequests = recentMetrics.filter(m => m.duration && m.duration > this.slowRequestThreshold);

    const averageResponseTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, m) => sum + (m.duration || 0), 0) / completedRequests.length
      : 0;

    const errorRate = totalRequests > 0 ? (errorRequests.length / totalRequests) * 100 : 0;
    const slowRequestRate = totalRequests > 0 ? (slowRequests.length / totalRequests) * 100 : 0;
    const requestsPerMinute = totalRequests; // Simplified - already filtered to last hour

    // Get slowest requests
    const slowestRequests = [...completedRequests]
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    // Get recent errors
    const recentErrors = errorRequests
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
      .slice(0, 10);

    // Memory trend (last 24 hours, sampled every hour)
    const memoryTrend = this.getMemoryTrend();

    return {
      overview: {
        totalRequests,
        averageResponseTime: Math.round(averageResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        slowRequestRate: Math.round(slowRequestRate * 100) / 100,
        requestsPerMinute: Math.round(requestsPerMinute),
      },
      routes: Array.from(this.routeStats.values())
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, 20),
      slowestRequests,
      recentErrors,
      memoryTrend,
    };
  }

  static getRoutePerformance(route: string): RoutePerformance | undefined {
    return this.routeStats.get(route);
  }

  static clearMetrics(): void {
    this.metrics = [];
    this.routeStats.clear();
  }

  // Private methods
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }

  private static extractRoute(url: string): string {
    try {
      const urlObj = new URL(url);
      let pathname = urlObj.pathname;
      
      // Normalize dynamic routes
      pathname = pathname.replace(/\/\d+/g, '/[id]');
      pathname = pathname.replace(/\/[a-f0-9-]{36}/g, '/[uuid]');
      
      return pathname;
    } catch {
      return url;
    }
  }

  private static updateRouteStats(metrics: PerformanceMetrics): void {
    if (!metrics.route || !metrics.duration) return;

    const key = `${metrics.method}:${metrics.route}`;
    const existing = this.routeStats.get(key);

    if (existing) {
      // Update existing stats
      const totalTime = (existing.averageResponseTime * existing.requestCount) + metrics.duration;
      existing.requestCount++;
      existing.averageResponseTime = totalTime / existing.requestCount;
      existing.lastAccessed = new Date();
      
      if (metrics.statusCode && metrics.statusCode >= 400) {
        existing.errorCount++;
      }
      
      if (metrics.duration > this.slowRequestThreshold) {
        existing.slowRequestCount++;
      }

      // Update percentiles (simplified calculation)
      const routeMetrics = this.getRecentMetrics(24 * 60 * 60 * 1000)
        .filter(m => m.route === metrics.route && m.method === metrics.method && m.duration)
        .map(m => m.duration!)
        .sort((a, b) => a - b);

      if (routeMetrics.length > 0) {
        existing.p95ResponseTime = this.calculatePercentile(routeMetrics, 95);
        existing.p99ResponseTime = this.calculatePercentile(routeMetrics, 99);
      }
    } else {
      // Create new stats
      this.routeStats.set(key, {
        route: metrics.route,
        method: metrics.method,
        averageResponseTime: metrics.duration,
        requestCount: 1,
        errorCount: (metrics.statusCode && metrics.statusCode >= 400) ? 1 : 0,
        slowRequestCount: metrics.duration > this.slowRequestThreshold ? 1 : 0,
        lastAccessed: new Date(),
        p95ResponseTime: metrics.duration,
        p99ResponseTime: metrics.duration,
      });
    }
  }

  private static trackMetrics(metrics: PerformanceMetrics): void {
    if (!metrics.duration) return;

    // Track basic metrics
    MonitoringService.trackMetric('request_duration', metrics.duration);
    MonitoringService.trackMetric('request_count', 1);
    
    if (metrics.statusCode) {
      MonitoringService.trackMetric(`response_${Math.floor(metrics.statusCode / 100)}xx`, 1);
    }

    if (metrics.contentLength) {
      MonitoringService.trackMetric('response_size', metrics.contentLength);
    }

    // Track route-specific metrics
    if (metrics.route) {
      MonitoringService.trackMetric(`route_${metrics.route.replace(/[^a-zA-Z0-9]/g, '_')}_duration`, metrics.duration);
    }

    // Track memory usage
    if (metrics.memoryUsage) {
      MonitoringService.trackMetric('memory_heap_used', metrics.memoryUsage.heapUsed);
      MonitoringService.trackMetric('memory_heap_total', metrics.memoryUsage.heapTotal);
    }
  }

  private static checkPerformanceAlerts(metrics: PerformanceMetrics): void {
    if (!metrics.duration) return;

    // Slow request alert
    if (metrics.duration > this.slowRequestThreshold) {
      const alert = {
        level: metrics.duration > 5000 ? 'error' as const : 'warning' as const,
        message: `Slow request detected: ${metrics.duration}ms`,
        component: 'performance',
        details: {
          route: metrics.route,
          method: metrics.method,
          duration: metrics.duration,
          url: metrics.url,
          requestId: metrics.requestId,
        },
      };

      if (typeof HealthMonitor !== 'undefined') {
        (HealthMonitor as any).addAlert(alert);
      }
    }

    // High memory usage alert
    if (metrics.memoryUsage) {
      const heapUsedMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = metrics.memoryUsage.heapTotal / 1024 / 1024;
      const memoryPercentage = (heapUsedMB / heapTotalMB) * 100;

      if (memoryPercentage > 85) {
        const alert = {
          level: memoryPercentage > 95 ? 'critical' as const : 'warning' as const,
          message: `High memory usage during request: ${memoryPercentage.toFixed(1)}%`,
          component: 'performance',
          details: {
            memoryPercentage,
            heapUsedMB: Math.round(heapUsedMB),
            heapTotalMB: Math.round(heapTotalMB),
            route: metrics.route,
            requestId: metrics.requestId,
          },
        };

        if (typeof HealthMonitor !== 'undefined') {
          (HealthMonitor as any).addAlert(alert);
        }
      }
    }

    // Error rate alert for routes
    if (metrics.statusCode && metrics.statusCode >= 400 && metrics.route) {
      const routeKey = `${metrics.method}:${metrics.route}`;
      const routeStats = this.routeStats.get(routeKey);
      
      if (routeStats && routeStats.requestCount > 10) {
        const errorRate = (routeStats.errorCount / routeStats.requestCount) * 100;
        
        if (errorRate > 20) {
          const alert = {
            level: errorRate > 50 ? 'error' as const : 'warning' as const,
            message: `High error rate for route: ${errorRate.toFixed(1)}%`,
            component: 'performance',
            details: {
              route: metrics.route,
              method: metrics.method,
              errorRate,
              totalRequests: routeStats.requestCount,
              totalErrors: routeStats.errorCount,
            },
          };

          if (typeof HealthMonitor !== 'undefined') {
            (HealthMonitor as any).addAlert(alert);
          }
        }
      }
    }
  }

  private static getRecentMetrics(timeWindowMs: number): PerformanceMetrics[] {
    const cutoffTime = Date.now() - timeWindowMs;
    return this.metrics.filter(m => m.startTime > cutoffTime);
  }

  private static calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  private static getMemoryTrend(): { timestamp: number; heapUsed: number }[] {
    const hourlyMetrics: { timestamp: number; heapUsed: number }[] = [];
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Sample every hour for the last 24 hours
    for (let time = oneDayAgo; time <= now; time += (60 * 60 * 1000)) {
      const hourMetrics = this.metrics.filter(m => 
        m.startTime >= time && 
        m.startTime < time + (60 * 60 * 1000) &&
        m.memoryUsage
      );
      
      if (hourMetrics.length > 0) {
        const avgHeapUsed = hourMetrics.reduce((sum, m) => 
          sum + (m.memoryUsage?.heapUsed || 0), 0) / hourMetrics.length;
        
        hourlyMetrics.push({
          timestamp: time,
          heapUsed: Math.round(avgHeapUsed / 1024 / 1024), // Convert to MB
        });
      }
    }
    
    return hourlyMetrics;
  }
}

// Export for use in middleware
export { PerformanceMonitor };

// Middleware function
export function performanceMiddleware(request: NextRequest) {
  const metrics = PerformanceMonitor.startRequest(request);
  
  return {
    metrics,
    enhance: (response: NextResponse, userId?: string) => {
      PerformanceMonitor.endRequest(metrics, response, userId);
      return response;
    }
  };
}
