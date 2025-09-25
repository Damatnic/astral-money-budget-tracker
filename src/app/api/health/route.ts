/**
 * Enterprise Health Check Endpoint
 * Provides comprehensive system health monitoring and diagnostics
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/db';

// Health check configuration
const HEALTH_CONFIG = {
  version: process.env.APP_VERSION || '1.0.0',
  name: process.env.APP_NAME || 'Astral Money',
  environment: process.env.NODE_ENV || 'development',
  timeout: {
    database: 5000, // 5 second timeout for DB checks
    external: 3000, // 3 second timeout for external services
  },
  thresholds: {
    memory: {
      warning: 80,  // 80% memory usage warning
      critical: 95, // 95% memory usage critical
    },
    responseTime: {
      warning: 500,   // 500ms response time warning  
      critical: 2000, // 2000ms response time critical
    },
  },
};

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  environment: string;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
    security: HealthCheck;
    dependencies: HealthCheck;
  };
  metrics: {
    responseTime: number;
    memoryUsage: NodeJS.MemoryUsage;
    processUptime: number;
    requestCount?: number;
  };
}

interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: any;
  responseTime?: number;
  lastChecked: string;
}

const startTime = Date.now();
let requestCount = 0;

export async function GET(request: Request): Promise<NextResponse> {
  const checkStartTime = Date.now();
  requestCount++;
  
  try {
    // Verify health check token for security
    const url = new URL(request.url);
    const token = url.searchParams.get('token') || request.headers.get('x-health-token');
    
    if (process.env.NODE_ENV === 'production' && 
        process.env.HEALTH_CHECK_TOKEN && 
        token !== process.env.HEALTH_CHECK_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Perform all health checks
    const [
      databaseCheck,
      memoryCheck,
      diskCheck,
      securityCheck,
      dependenciesCheck,
    ] = await Promise.allSettled([
      checkDatabase(),
      checkMemory(),
      checkDisk(),
      checkSecurity(),
      checkDependencies(),
    ]);

    // Calculate overall status
    const checks = {
      database: getCheckResult(databaseCheck),
      memory: getCheckResult(memoryCheck),
      disk: getCheckResult(diskCheck),
      security: getCheckResult(securityCheck),
      dependencies: getCheckResult(dependenciesCheck),
    };

    const overallStatus = determineOverallStatus(checks);
    const responseTime = Date.now() - checkStartTime;

    const healthStatus: HealthStatus = {
      status: overallStatus,
      version: HEALTH_CONFIG.version,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      environment: HEALTH_CONFIG.environment,
      checks,
      metrics: {
        responseTime,
        memoryUsage: process.memoryUsage(),
        processUptime: process.uptime(),
        requestCount,
      },
    };

    // Return appropriate HTTP status code
    const httpStatus = getHttpStatus(overallStatus);
    
    return NextResponse.json(healthStatus, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Version': '1.0.0',
        'X-Response-Time': `${responseTime}ms`,
      },
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        version: HEALTH_CONFIG.version,
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * Check database connectivity and performance
 */
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    if (!process.env.DATABASE_URL) {
      return {
        status: 'fail',
        message: 'Database URL not configured',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }

    // Test database connection with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database timeout')), HEALTH_CONFIG.timeout.database);
    });

    const dbPromise = prisma.$queryRaw`SELECT 1 as test`;
    
    await Promise.race([dbPromise, timeoutPromise]);
    
    // Test basic query performance
    const userCount = await prisma.user.count();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime > 1000 ? 'warn' : 'pass',
      message: responseTime > 1000 ? 'Database responding slowly' : 'Database healthy',
      details: {
        userCount,
        connectionPool: 'active',
      },
      responseTime,
      lastChecked: new Date().toISOString(),
    };

  } catch (error) {
    return {
      status: 'fail',
      message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check memory usage
 */
async function checkMemory(): Promise<HealthCheck> {
  try {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = 'Memory usage normal';

    if (memoryPercentage >= HEALTH_CONFIG.thresholds.memory.critical) {
      status = 'fail';
      message = 'Critical memory usage';
    } else if (memoryPercentage >= HEALTH_CONFIG.thresholds.memory.warning) {
      status = 'warn';
      message = 'High memory usage';
    }

    return {
      status,
      message,
      details: {
        usedMB: Math.round(usedMemory / 1024 / 1024),
        totalMB: Math.round(totalMemory / 1024 / 1024),
        percentage: Math.round(memoryPercentage),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
      lastChecked: new Date().toISOString(),
    };

  } catch (error) {
    return {
      status: 'fail',
      message: `Memory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check disk space (simplified for Node.js environment)
 */
async function checkDisk(): Promise<HealthCheck> {
  try {
    // In a real production environment, you would check actual disk usage
    // For now, we'll check if we can write to the temp directory
    const fs = require('fs').promises;
    const path = require('path');
    const os = require('os');
    
    const testFile = path.join(os.tmpdir(), `health-check-${Date.now()}.tmp`);
    
    await fs.writeFile(testFile, 'health check test');
    await fs.unlink(testFile);
    
    return {
      status: 'pass',
      message: 'Disk write test successful',
      details: {
        tempDir: os.tmpdir(),
        writable: true,
      },
      lastChecked: new Date().toISOString(),
    };

  } catch (error) {
    return {
      status: 'fail',
      message: `Disk check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check security configuration
 */
async function checkSecurity(): Promise<HealthCheck> {
  try {
    const issues: string[] = [];
    
    // Check environment variables
    if (!process.env.NEXTAUTH_SECRET) {
      issues.push('NEXTAUTH_SECRET not configured');
    }
    
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('ssl')) {
      issues.push('Database SSL not configured for production');
    }
    
    if (process.env.NODE_ENV === 'development' && !process.env.NEXTAUTH_URL) {
      issues.push('NEXTAUTH_URL not configured for development');
    }

    // Check for secure session configuration
    const sessionMaxAge = parseInt(process.env.SESSION_MAX_AGE || '3600');
    if (sessionMaxAge > 86400) { // More than 24 hours
      issues.push('Session timeout too long for financial application');
    }

    const status = issues.length === 0 ? 'pass' : issues.length <= 2 ? 'warn' : 'fail';
    const message = issues.length === 0 
      ? 'Security configuration healthy' 
      : `Security issues found: ${issues.length}`;

    return {
      status,
      message,
      details: {
        issues,
        environment: process.env.NODE_ENV,
        sessionTimeout: `${sessionMaxAge}s`,
        sslConfigured: !!process.env.DATABASE_URL?.includes('ssl'),
      },
      lastChecked: new Date().toISOString(),
    };

  } catch (error) {
    return {
      status: 'fail',
      message: `Security check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check dependencies and external services
 */
async function checkDependencies(): Promise<HealthCheck> {
  try {
    const dependencies = {
      nextauth: 'required',
      prisma: 'required',
      bcryptjs: 'required',
      tailwindcss: 'required',
    };

    const issues: string[] = [];
    
    // Check if critical packages are available
    try {
      require('next-auth');
      require('@prisma/client');
      require('bcryptjs');
    } catch (error) {
      issues.push('Critical dependency missing');
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      issues.push(`Node.js version ${nodeVersion} is outdated (requires 18+)`);
    }

    const status = issues.length === 0 ? 'pass' : 'warn';
    const message = issues.length === 0 
      ? 'All dependencies healthy' 
      : `Dependency issues: ${issues.length}`;

    return {
      status,
      message,
      details: {
        nodeVersion,
        issues,
        dependencies,
      },
      lastChecked: new Date().toISOString(),
    };

  } catch (error) {
    return {
      status: 'fail',
      message: `Dependencies check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Extract health check result from Promise.allSettled result
 */
function getCheckResult(result: PromiseSettledResult<HealthCheck>): HealthCheck {
  if (result.status === 'fulfilled') {
    return result.value;
  } else {
    return {
      status: 'fail',
      message: `Check failed: ${result.reason}`,
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Determine overall system status
 */
function determineOverallStatus(checks: Record<string, HealthCheck>): 'healthy' | 'degraded' | 'unhealthy' {
  const checkResults = Object.values(checks);
  
  const failCount = checkResults.filter(check => check.status === 'fail').length;
  const warnCount = checkResults.filter(check => check.status === 'warn').length;
  
  if (failCount > 0) {
    return 'unhealthy';
  } else if (warnCount > 0) {
    return 'degraded';
  } else {
    return 'healthy';
  }
}

/**
 * Get HTTP status code based on health status
 */
function getHttpStatus(status: 'healthy' | 'degraded' | 'unhealthy'): number {
  switch (status) {
    case 'healthy': return 200;
    case 'degraded': return 200; // Still operational
    case 'unhealthy': return 503; // Service unavailable
    default: return 500;
  }
}

// Additional endpoint for simple ping check
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'X-Health': 'ok',
      'X-Version': HEALTH_CONFIG.version,
    },
  });
}