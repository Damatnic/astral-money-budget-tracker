/**
 * System Health Check API
 * Comprehensive monitoring of all system components
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { APIErrorHandler } from '@/lib/api-error-handler';
import { createHealthCheckResponse } from '@/lib/database-optimizer';
import { MonitoringService } from '@/utils/monitoring';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  components: {
    database: ComponentHealth;
    api: ComponentHealth;
    memory: ComponentHealth;
    disk: ComponentHealth;
    external: ComponentHealth;
  };
  metrics: SystemMetrics;
  alerts: HealthAlert[];
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  details?: any;
  lastCheck: string;
  uptime?: number;
}

interface SystemMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage?: number;
  activeConnections: number;
}

interface HealthAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  component: string;
  timestamp: string;
  details?: any;
}

class HealthMonitor {
  private static alerts: HealthAlert[] = [];
  private static startTime = Date.now();
  private static requestCount = 0;
  private static errorCount = 0;
  private static responseTimes: number[] = [];

  static trackRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    if (isError) this.errorCount++;
    
    this.responseTimes.push(responseTime);
    
    // Keep only recent response times (last 1000 requests)
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-500);
    }
  }

  static addAlert(alert: Omit<HealthAlert, 'timestamp'>): void {
    this.alerts.push({
      ...alert,
      timestamp: new Date().toISOString(),
    });

    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-50);
    }

    // Log critical alerts
    if (alert.level === 'critical' || alert.level === 'error') {
      console.error(`Health Alert [${alert.level.toUpperCase()}]:`, alert.message);
      MonitoringService.trackError(new Error(alert.message), {
        component: alert.component,
        level: alert.level,
        details: alert.details,
      });
    }
  }

  static async checkDatabaseHealth(): Promise<ComponentHealth> {
    try {
      const dbHealth = await createHealthCheckResponse();
      const isHealthy = dbHealth.database.status === 'healthy';
      const responseTime = dbHealth.database.responseTime;

      if (!isHealthy) {
        this.addAlert({
          level: 'error',
          message: `Database unhealthy: ${dbHealth.database.lastError}`,
          component: 'database',
          details: dbHealth.database,
        });
      } else if (responseTime > 1000) {
        this.addAlert({
          level: 'warning',
          message: `Database slow response: ${responseTime}ms`,
          component: 'database',
          details: { responseTime },
        });
      }

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        details: dbHealth.database,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      this.addAlert({
        level: 'critical',
        message: `Database check failed: ${(error as Error).message}`,
        component: 'database',
        details: { error: (error as Error).message },
      });

      return {
        status: 'unhealthy',
        details: { error: (error as Error).message },
        lastCheck: new Date().toISOString(),
      };
    }
  }

  static checkAPIHealth(): ComponentHealth {
    const uptime = Date.now() - this.startTime;
    const minutesUp = uptime / (1000 * 60);
    const requestsPerMinute = minutesUp > 0 ? this.requestCount / minutesUp : 0;
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (errorRate > 10) {
      status = 'unhealthy';
      this.addAlert({
        level: 'error',
        message: `High error rate: ${errorRate.toFixed(2)}%`,
        component: 'api',
        details: { errorRate, requestCount: this.requestCount, errorCount: this.errorCount },
      });
    } else if (errorRate > 5) {
      status = 'degraded';
      this.addAlert({
        level: 'warning',
        message: `Elevated error rate: ${errorRate.toFixed(2)}%`,
        component: 'api',
        details: { errorRate },
      });
    }

    if (avgResponseTime > 2000) {
      status = status === 'healthy' ? 'degraded' : status;
      this.addAlert({
        level: 'warning',
        message: `Slow API response time: ${avgResponseTime.toFixed(0)}ms`,
        component: 'api',
        details: { avgResponseTime },
      });
    }

    return {
      status,
      responseTime: avgResponseTime,
      uptime,
      details: {
        requestsPerMinute: requestsPerMinute.toFixed(2),
        errorRate: errorRate.toFixed(2),
        totalRequests: this.requestCount,
        totalErrors: this.errorCount,
      },
      lastCheck: new Date().toISOString(),
    };
  }

  static checkMemoryHealth(): ComponentHealth {
    const usage = process.memoryUsage();
    const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const percentage = (usedMB / totalMB) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (percentage > 90) {
      status = 'unhealthy';
      this.addAlert({
        level: 'critical',
        message: `Critical memory usage: ${percentage.toFixed(1)}%`,
        component: 'memory',
        details: { usedMB, totalMB, percentage },
      });
    } else if (percentage > 80) {
      status = 'degraded';
      this.addAlert({
        level: 'warning',
        message: `High memory usage: ${percentage.toFixed(1)}%`,
        component: 'memory',
        details: { usedMB, totalMB, percentage },
      });
    }

    return {
      status,
      details: {
        used: usedMB,
        total: totalMB,
        percentage: percentage.toFixed(1),
        rss: Math.round(usage.rss / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
      },
      lastCheck: new Date().toISOString(),
    };
  }

  static async checkExternalHealth(): Promise<ComponentHealth> {
    // Check critical external dependencies
    const checks = [];

    // Check if we can resolve DNS
    try {
      const dns = require('dns').promises;
      await dns.lookup('google.com');
      checks.push({ name: 'DNS', status: 'healthy' });
    } catch {
      checks.push({ name: 'DNS', status: 'unhealthy' });
    }

    // Check environment variables
    const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      checks.push({ name: 'Environment', status: 'unhealthy', details: { missing: missingEnvVars } });
      this.addAlert({
        level: 'critical',
        message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
        component: 'external',
        details: { missingEnvVars },
      });
    } else {
      checks.push({ name: 'Environment', status: 'healthy' });
    }

    const unhealthyChecks = checks.filter(c => c.status === 'unhealthy');
    const status = unhealthyChecks.length > 0 ? 'unhealthy' : 'healthy';

    return {
      status,
      details: { checks },
      lastCheck: new Date().toISOString(),
    };
  }

  static getSystemMetrics(): SystemMetrics {
    const uptime = Date.now() - this.startTime;
    const minutesUp = uptime / (1000 * 60);
    const requestsPerMinute = minutesUp > 0 ? this.requestCount / minutesUp : 0;
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;

    const memUsage = process.memoryUsage();
    const memoryUsage = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };

    return {
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
      averageResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      memoryUsage,
      activeConnections: this.requestCount, // Simplified
    };
  }

  static getOverallStatus(components: HealthStatus['components']): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(components).map(c => c.status);
    
    if (statuses.includes('unhealthy')) return 'unhealthy';
    if (statuses.includes('degraded')) return 'degraded';
    return 'healthy';
  }
}

// Note: Middleware removed to avoid Next.js build issues

// Health check endpoint
export const GET = APIErrorHandler.withErrorHandling(async (request: NextRequest) => {
  const startTime = Date.now();
  
  // Check query parameters for detailed health check
  const url = new URL(request.url);
  const detailed = url.searchParams.get('detailed') === 'true';
  const component = url.searchParams.get('component');

  try {
    // Perform health checks
    const [databaseHealth, externalHealth] = await Promise.all([
      HealthMonitor.checkDatabaseHealth(),
      HealthMonitor.checkExternalHealth(),
    ]);

    const apiHealth = HealthMonitor.checkAPIHealth();
    const memoryHealth = HealthMonitor.checkMemoryHealth();
    
    const components = {
      database: databaseHealth,
      api: apiHealth,
      memory: memoryHealth,
      disk: { status: 'healthy' as const, lastCheck: new Date().toISOString() }, // Placeholder
      external: externalHealth,
    };

    // If specific component requested, return only that
    if (component && components[component as keyof typeof components]) {
      return APIErrorHandler.createSuccessResponse({
        component,
        ...components[component as keyof typeof components],
      });
    }

    const overallStatus = HealthMonitor.getOverallStatus(components);
    const responseTime = Date.now() - startTime;

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - HealthMonitor['startTime'],
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      components,
      metrics: HealthMonitor.getSystemMetrics(),
      alerts: detailed ? HealthMonitor['alerts'].slice(-20) : [], // Last 20 alerts if detailed
    };

    // Set appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': overallStatus,
        'X-Response-Time': responseTime.toString(),
      }
    });

  } catch (error) {
    HealthMonitor.addAlert({
      level: 'critical',
      message: `Health check failed: ${(error as Error).message}`,
      component: 'health-system',
      details: { error: (error as Error).message },
    });

    throw error;
  }
}, { route: '/api/health' });

// Export health monitor for use in other parts of the application
export { HealthMonitor };