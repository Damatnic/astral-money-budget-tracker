/**
 * Enterprise Database Connection Pool
 * Production-ready database management with connection pooling,
 * monitoring, health checks, and graceful shutdown
 */

import { PrismaClient, Prisma } from '@prisma/client';

// Database configuration interface
interface DatabaseConfig {
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  healthCheckInterval: number;
  retryAttempts: number;
  retryDelay: number;
  enableLogging: boolean;
  enableMetrics: boolean;
}

// Database metrics interface
interface DatabaseMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  connectionPoolSize: number;
  activeConnections: number;
  healthCheckStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastHealthCheck: Date;
  uptime: number;
}

// Query performance tracking
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private prismaClient: PrismaClient | null = null;
  private config: DatabaseConfig;
  private metrics: DatabaseMetrics;
  private queryHistory: QueryMetrics[] = [];
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private startTime: Date = new Date();
  private isShuttingDown: boolean = false;

  constructor() {
    this.config = {
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10'),
      connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000'),
      idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '10000'),
      healthCheckInterval: parseInt(process.env.DATABASE_HEALTH_CHECK_INTERVAL || '30000'),
      retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY || '1000'),
      enableLogging: process.env.NODE_ENV === 'development',
      enableMetrics: process.env.ENABLE_DATABASE_METRICS === 'true',
    };

    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      connectionPoolSize: 0,
      activeConnections: 0,
      healthCheckStatus: 'healthy',
      lastHealthCheck: new Date(),
      uptime: 0,
    };

    this.initializeClient();
    this.startHealthChecks();
    this.setupGracefulShutdown();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Get Prisma client instance
   */
  public getClient(): PrismaClient {
    if (!this.prismaClient || this.isShuttingDown) {
      throw new Error('Database connection not available');
    }
    return this.prismaClient;
  }

  /**
   * Initialize Prisma client with enhanced configuration
   */
  private async initializeClient(): Promise<void> {
    try {
      // Enhanced Prisma client configuration
      this.prismaClient = new PrismaClient({
        // Database URL with connection pooling parameters
        datasources: {
          db: {
            url: this.buildConnectionString(),
          },
        },
        
        // Logging configuration
        log: this.getLogConfig(),
        
        // Error formatting
        errorFormat: 'pretty',
        
        // Transaction options
        transactionOptions: {
          maxWait: this.config.connectionTimeout,
          timeout: this.config.connectionTimeout,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      });

      // Add query middleware for metrics
      if (this.config.enableMetrics) {
        this.prismaClient.$use(this.createMetricsMiddleware());
      }

      // Test connection
      await this.testConnection();

      console.log('✅ Database connection established successfully');
      console.log(`📊 Pool configuration: max=${this.config.maxConnections}, timeout=${this.config.connectionTimeout}ms`);

    } catch (error) {
      console.error('❌ Failed to initialize database connection:', error);
      throw error;
    }
  }

  /**
   * Build connection string with pooling parameters
   */
  private buildConnectionString(): string {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Parse existing URL to add/modify parameters
    const url = new URL(baseUrl);
    
    // Add connection pool parameters
    url.searchParams.set('connection_limit', this.config.maxConnections.toString());
    url.searchParams.set('pool_timeout', (this.config.connectionTimeout / 1000).toString());
    url.searchParams.set('statement_cache_size', '100');
    url.searchParams.set('prepared_statement_cache_size', '100');
    
    // Ensure SSL in production
    if (process.env.NODE_ENV === 'production' && !url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require');
    }

    // Add schema if specified
    if (process.env.DATABASE_SCHEMA) {
      url.searchParams.set('schema', process.env.DATABASE_SCHEMA);
    }

    return url.toString();
  }

  /**
   * Get logging configuration based on environment
   */
  private getLogConfig(): Prisma.LogLevel[] {
    if (process.env.NODE_ENV === 'production') {
      return ['error'];
    } else if (process.env.NODE_ENV === 'test') {
      return [];
    } else {
      return this.config.enableLogging ? ['query', 'info', 'warn', 'error'] : ['error'];
    }
  }

  /**
   * Create metrics middleware for query tracking
   */
  private createMetricsMiddleware(): Prisma.Middleware {
    return async (params, next) => {
      const start = Date.now();
      let success = true;
      let error: string | undefined;

      try {
        const result = await next(params);
        return result;
      } catch (e) {
        success = false;
        error = e instanceof Error ? e.message : 'Unknown error';
        throw e;
      } finally {
        const duration = Date.now() - start;
        this.recordQueryMetrics({
          query: `${params.model}.${params.action}`,
          duration,
          timestamp: new Date(),
          success,
          error,
        });
      }
    };
  }

  /**
   * Record query metrics
   */
  private recordQueryMetrics(queryMetric: QueryMetrics): void {
    this.queryHistory.push(queryMetric);
    
    // Keep only last 1000 queries
    if (this.queryHistory.length > 1000) {
      this.queryHistory = this.queryHistory.slice(-1000);
    }

    // Update metrics
    this.metrics.totalQueries++;
    if (queryMetric.success) {
      this.metrics.successfulQueries++;
    } else {
      this.metrics.failedQueries++;
    }

    // Update average query time (rolling average)
    const totalTime = this.metrics.averageQueryTime * (this.metrics.totalQueries - 1) + queryMetric.duration;
    this.metrics.averageQueryTime = totalTime / this.metrics.totalQueries;

    // Log slow queries in development
    if (this.config.enableLogging && queryMetric.duration > 1000) {
      console.warn(`🐌 Slow query detected: ${queryMetric.query} took ${queryMetric.duration}ms`);
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    if (!this.prismaClient) {
      throw new Error('Prisma client not initialized');
    }

    try {
      await this.prismaClient.$queryRaw`SELECT 1`;
    } catch (error) {
      throw new Error(`Database connection test failed: ${error}`);
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform database health check
   */
  private async performHealthCheck(): Promise<void> {
    if (!this.prismaClient || this.isShuttingDown) {
      return;
    }

    const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    try {
      // Basic connectivity test
      await this.prismaClient.$queryRaw`SELECT 1`;

      // Check query performance
      const queryTime = Date.now() - startTime;
      if (queryTime > 2000) {
        status = 'degraded';
      } else if (queryTime > 5000) {
        status = 'unhealthy';
      }

      // Check error rate
      const recentQueries = this.queryHistory.slice(-100);
      const errorRate = recentQueries.length > 0 
        ? recentQueries.filter(q => !q.success).length / recentQueries.length
        : 0;

      if (errorRate > 0.1) { // More than 10% error rate
        status = 'degraded';
      } else if (errorRate > 0.25) { // More than 25% error rate
        status = 'unhealthy';
      }

      this.metrics.healthCheckStatus = status;
      this.metrics.lastHealthCheck = new Date();
      this.metrics.uptime = Date.now() - this.startTime.getTime();

      // Log health status changes
      if (status !== 'healthy' && this.config.enableLogging) {
        console.warn(`⚠️ Database health check: ${status} (query time: ${queryTime}ms, error rate: ${(errorRate * 100).toFixed(1)}%)`);
      }

    } catch (error) {
      this.metrics.healthCheckStatus = 'unhealthy';
      this.metrics.lastHealthCheck = new Date();
      
      if (this.config.enableLogging) {
        console.error('❌ Database health check failed:', error);
      }
    }
  }

  /**
   * Get database metrics
   */
  public getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  /**
   * Get query performance statistics
   */
  public getQueryStats(limit: number = 100): {
    slowQueries: QueryMetrics[];
    failedQueries: QueryMetrics[];
    recentQueries: QueryMetrics[];
  } {
    const recent = this.queryHistory.slice(-limit);
    return {
      slowQueries: recent.filter(q => q.duration > 1000).sort((a, b) => b.duration - a.duration),
      failedQueries: recent.filter(q => !q.success),
      recentQueries: recent,
    };
  }

  /**
   * Execute query with retry logic
   */
  public async executeWithRetry<T>(
    operation: (client: PrismaClient) => Promise<T>,
    maxAttempts: number = this.config.retryAttempts
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (!this.prismaClient) {
          throw new Error('Database connection not available');
        }
        return await operation(this.prismaClient);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxAttempts) {
          break;
        }

        // Log retry attempt
        if (this.config.enableLogging) {
          console.warn(`🔄 Database operation retry ${attempt}/${maxAttempts}:`, lastError.message);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
      }
    }

    throw lastError;
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`📡 Received ${signal}. Starting graceful database shutdown...`);
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    
    try {
      // Stop health checks
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
      }

      // Close database connections
      if (this.prismaClient) {
        await this.prismaClient.$disconnect();
        console.log('✅ Database connections closed gracefully');
      }

      // Log final metrics
      if (this.config.enableMetrics) {
        console.log('📊 Final database metrics:', {
          totalQueries: this.metrics.totalQueries,
          successfulQueries: this.metrics.successfulQueries,
          failedQueries: this.metrics.failedQueries,
          averageQueryTime: `${this.metrics.averageQueryTime.toFixed(2)}ms`,
          uptime: `${Math.round(this.metrics.uptime / 1000)}s`,
        });
      }

    } catch (error) {
      console.error('❌ Error during database shutdown:', error);
    }
  }

  /**
   * Reset connection (for testing or recovery)
   */
  public async resetConnection(): Promise<void> {
    if (this.prismaClient) {
      await this.prismaClient.$disconnect();
    }
    await this.initializeClient();
  }
}

// Export singleton instance
const databaseManager = DatabaseManager.getInstance();

// Export Prisma client for backward compatibility
const prisma = databaseManager.getClient();

// Export enhanced database utilities
export { 
  databaseManager as DatabaseManager, 
  prisma as default,
  type DatabaseMetrics,
  type QueryMetrics,
};

// Health check endpoint helper
export async function getDatabaseHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: DatabaseMetrics;
  queryStats: any;
}> {
  const metrics = databaseManager.getMetrics();
  const queryStats = databaseManager.getQueryStats(50);
  
  return {
    status: metrics.healthCheckStatus,
    metrics,
    queryStats,
  };
}