/**
 * Database Optimization and Connection Management
 * Provides connection pooling, query optimization, and performance monitoring
 */

import { PrismaClient } from '@prisma/client';
import { MonitoringService } from '@/utils/monitoring';

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  userId?: string;
  resultCount?: number;
}

interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  connectionTimeoutMs: number;
  idleTimeoutMs: number;
  maxLifetimeMs: number;
}

class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private prisma: PrismaClient;
  private queryMetrics: QueryMetrics[] = [];
  private connectionPool: ConnectionPoolConfig;
  private slowQueryThreshold: number = 1000; // 1 second
  private isHealthy: boolean = true;
  private lastHealthCheck: Date = new Date();

  private constructor() {
    this.connectionPool = {
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
      minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '2'),
      connectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
      idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT || '10000'),
      maxLifetimeMs: parseInt(process.env.DB_MAX_LIFETIME || '3600000'), // 1 hour
    };

    this.initializePrisma();
  }

  public static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  private initializePrisma(): void {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Monitor query performance (disabled due to Prisma type compatibility)
    // this.prisma.$on('query', (e) => {
    //   const duration = e.duration;
    //   const query = e.query;
    //   
    //   this.trackQuery({
    //     query,
    //     duration,
    //     timestamp: new Date(),
    //   });

    //   // Alert on slow queries
    //   if (duration > this.slowQueryThreshold) {
    //     this.handleSlowQuery(query, duration);
    //   }
    // });

    // Monitor errors (disabled due to Edge Runtime compatibility)
    // this.prisma.$on('error', (e) => {
    //   console.error('Database Error:', e);
    //   MonitoringService.trackError(new Error(e.message), {
    //     source: 'database',
    //     severity: 'high',
    //   });
    //   this.isHealthy = false;
    // });

    // Monitor warnings (disabled due to Edge Runtime compatibility)
    // this.prisma.$on('warn', (e) => {
    //   console.warn('Database Warning:', e);
    //   MonitoringService.trackMetric('database_warning', 1);
    // });
  }

  /**
   * Get optimized Prisma client instance
   */
  public getPrisma(): PrismaClient {
    return this.prisma;
  }

  /**
   * Execute query with performance monitoring
   */
  public async executeWithMonitoring<T>(
    operation: () => Promise<T>,
    operationName: string,
    userId?: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      this.trackQuery({
        query: operationName,
        duration,
        timestamp: new Date(),
        userId,
        resultCount: Array.isArray(result) ? result.length : undefined,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      MonitoringService.trackError(error as Error, {
        operation: operationName,
        duration,
        userId,
        source: 'database',
      });
      
      throw error;
    }
  }

  /**
   * Execute transaction with retry logic
   */
  public async executeTransaction<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          return await operation(tx as PrismaClient);
        });
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on validation errors or unique constraint violations
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          await this.sleep(delay);
          console.log(`Transaction retry ${attempt}/${maxRetries} after ${delay}ms`);
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Batch operations for improved performance
   */
  public async batchCreate<T>(
    model: any,
    data: T[],
    batchSize: number = 100
  ): Promise<void> {
    const batches = this.chunkArray(data, batchSize);
    
    for (const batch of batches) {
      await this.executeWithMonitoring(
        () => model.createMany({ data: batch, skipDuplicates: true }),
        `batch_create_${model.name}`,
      );
    }
  }

  /**
   * Optimized pagination with cursor-based approach
   */
  public async paginateWithCursor<T>(
    model: any,
    options: {
      where?: any;
      orderBy?: any;
      take: number;
      cursor?: any;
      select?: any;
      include?: any;
    }
  ): Promise<{
    data: T[];
    nextCursor?: any;
    hasMore: boolean;
  }> {
    const { take, cursor, ...queryOptions } = options;
    
    // Fetch one extra record to determine if there are more
    const results = await this.executeWithMonitoring(
      () => model.findMany({
        ...queryOptions,
        take: take + 1,
        ...(cursor && { cursor, skip: 1 }),
      }),
      `paginate_${model.name}`,
    );

    const resultsArray = Array.isArray(results) ? results : [];
    const hasMore = resultsArray.length > take;
    const data = hasMore ? resultsArray.slice(0, -1) : resultsArray;
    const nextCursor = hasMore ? resultsArray[resultsArray.length - 1] : null;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Check database health
   */
  public async checkHealth(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    connectionCount: number;
    slowQueries: number;
    lastError?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Simple query to test connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes
      const slowQueries = recentMetrics.filter(m => m.duration > this.slowQueryThreshold).length;
      
      this.isHealthy = true;
      this.lastHealthCheck = new Date();
      
      return {
        isHealthy: true,
        responseTime,
        connectionCount: await this.getActiveConnections(),
        slowQueries,
      };
    } catch (error) {
      this.isHealthy = false;
      
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        connectionCount: 0,
        slowQueries: 0,
        lastError: (error as Error).message,
      };
    }
  }

  /**
   * Get query performance metrics
   */
  public getPerformanceMetrics(): {
    averageQueryTime: number;
    slowQueryCount: number;
    totalQueries: number;
    queriesPerSecond: number;
    topSlowQueries: QueryMetrics[];
  } {
    const recentMetrics = this.getRecentMetrics(60 * 60 * 1000); // Last hour
    
    const totalQueries = recentMetrics.length;
    const averageQueryTime = totalQueries > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries 
      : 0;
    
    const slowQueries = recentMetrics.filter(m => m.duration > this.slowQueryThreshold);
    const queriesPerSecond = totalQueries / 3600; // Queries per second over the hour
    
    const topSlowQueries = [...slowQueries]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      averageQueryTime,
      slowQueryCount: slowQueries.length,
      totalQueries,
      queriesPerSecond,
      topSlowQueries,
    };
  }

  /**
   * Optimize query based on patterns
   */
  public getQueryOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const metrics = this.getRecentMetrics(24 * 60 * 60 * 1000); // Last 24 hours
    
    // Analyze query patterns
    const queryPatterns = new Map<string, QueryMetrics[]>();
    metrics.forEach(metric => {
      const pattern = this.extractQueryPattern(metric.query);
      if (!queryPatterns.has(pattern)) {
        queryPatterns.set(pattern, []);
      }
      queryPatterns.get(pattern)!.push(metric);
    });

    queryPatterns.forEach((queries, pattern) => {
      const avgDuration = queries.reduce((sum, q) => sum + q.duration, 0) / queries.length;
      
      if (avgDuration > this.slowQueryThreshold) {
        if (pattern.includes('SELECT') && !pattern.includes('WHERE')) {
          suggestions.push(`Consider adding WHERE clause to query: ${pattern}`);
        }
        
        if (pattern.includes('ORDER BY') && !pattern.includes('INDEX')) {
          suggestions.push(`Consider adding index for ORDER BY in: ${pattern}`);
        }
        
        if (queries.length > 100) {
          suggestions.push(`Frequent slow query detected: ${pattern} (${queries.length} times)`);
        }
      }
    });

    return suggestions;
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  public cleanupMetrics(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Keep 24 hours
    this.queryMetrics = this.queryMetrics.filter(m => m.timestamp > cutoffTime);
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down database connections...');
    await this.prisma.$disconnect();
  }

  // Private helper methods
  private trackQuery(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    
    // Keep only recent metrics in memory
    if (this.queryMetrics.length > 10000) {
      this.queryMetrics = this.queryMetrics.slice(-5000);
    }

    // Track metrics in monitoring system
    MonitoringService.trackMetric('database_query_duration', metrics.duration);
    MonitoringService.trackMetric('database_query_count', 1);
  }

  private handleSlowQuery(query: string, duration: number): void {
    console.warn(`Slow query detected (${duration}ms):`, query.substring(0, 200));
    
    MonitoringService.trackMetric('database_slow_query', 1);
    MonitoringService.trackError(new Error('Slow query detected'), {
      query: query.substring(0, 500),
      duration,
      severity: 'medium',
    });
  }

  private getRecentMetrics(timeWindowMs: number): QueryMetrics[] {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    return this.queryMetrics.filter(m => m.timestamp > cutoffTime);
  }

  private async getActiveConnections(): Promise<number> {
    try {
      // This is database-specific. For PostgreSQL:
      const result = await this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'active'
      `;
      return result[0]?.count || 0;
    } catch {
      // Fallback for other databases or if query fails
      return 1;
    }
  }

  private extractQueryPattern(query: string): string {
    // Remove specific values and normalize query for pattern matching
    return query
      .replace(/\$\d+/g, '$?') // Replace parameter placeholders
      .replace(/\d+/g, 'N') // Replace numbers
      .replace(/'[^']*'/g, "'?'") // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100); // Limit length
  }

  private isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      'P2002', // Unique constraint violation
      'P2003', // Foreign key constraint violation
      'P2025', // Record not found
    ];
    
    return nonRetryableCodes.includes(error?.code) || 
           error?.message?.includes('validation') ||
           error?.message?.includes('Invalid');
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const dbOptimizer = DatabaseOptimizer.getInstance();

// Export optimized Prisma client
export const prisma = dbOptimizer.getPrisma();

// Health check endpoint helper
export const createHealthCheckResponse = async () => {
  const health = await dbOptimizer.checkHealth();
  const performance = dbOptimizer.getPerformanceMetrics();
  const suggestions = dbOptimizer.getQueryOptimizationSuggestions();
  
  return {
    database: {
      status: health.isHealthy ? 'healthy' : 'unhealthy',
      responseTime: health.responseTime,
      activeConnections: health.connectionCount,
      lastError: health.lastError,
    },
    performance: {
      averageQueryTime: Math.round(performance.averageQueryTime),
      slowQueries: performance.slowQueryCount,
      queriesPerSecond: Math.round(performance.queriesPerSecond * 100) / 100,
      totalQueries: performance.totalQueries,
    },
    optimizations: suggestions.slice(0, 5), // Top 5 suggestions
    timestamp: new Date().toISOString(),
  };
};

// Cleanup interval
setInterval(() => {
  dbOptimizer.cleanupMetrics();
}, 60 * 60 * 1000); // Cleanup every hour

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await dbOptimizer.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await dbOptimizer.shutdown();
  process.exit(0);
});
