/**
 * Advanced Logging and Alerting System
 * Enterprise-grade logging with structured data, alerting, and integrations
 */

// Server-side only logger - not for client use
const MonitoringService = {
  trackMetric: () => {},
  trackError: () => {},
};

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  data?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    memory: number;
    cpu?: number;
  };
  context?: {
    userAgent?: string;
    ip?: string;
    route?: string;
    method?: string;
  };
  tags?: string[];
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  actions: AlertAction[];
  enabled: boolean;
  cooldownMs: number;
  lastTriggered?: Date;
}

export interface AlertCondition {
  type: 'threshold' | 'pattern' | 'anomaly' | 'composite';
  metric?: string;
  operator?: 'gt' | 'lt' | 'eq' | 'contains' | 'matches';
  threshold?: number;
  pattern?: string;
  timeWindow?: number; // milliseconds
  aggregation?: 'count' | 'sum' | 'avg' | 'max' | 'min';
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'console' | 'database';
  config: Record<string, any>;
}

export interface LoggerConfig {
  level: LogLevel;
  service: string;
  enableConsole: boolean;
  enableFile: boolean;
  enableDatabase: boolean;
  enableRemote: boolean;
  filePath?: string;
  remoteEndpoint?: string;
  bufferSize: number;
  flushInterval: number;
  enableStructuredLogging: boolean;
  enablePerformanceLogging: boolean;
  enableSecurityLogging: boolean;
}

class AdvancedLogger {
  private static instance: AdvancedLogger;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private alertCooldowns: Map<string, number> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;
  private performanceStartTimes: Map<string, number> = new Map();

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      service: 'astral-money',
      enableConsole: true,
      enableFile: false,
      enableDatabase: false,
      enableRemote: false,
      bufferSize: 100,
      flushInterval: 5000, // 5 seconds
      enableStructuredLogging: true,
      enablePerformanceLogging: true,
      enableSecurityLogging: true,
      ...config,
    };

    this.initializeDefaultAlerts();
    this.startFlushInterval();
  }

  public static getInstance(config?: Partial<LoggerConfig>): AdvancedLogger {
    if (!AdvancedLogger.instance) {
      AdvancedLogger.instance = new AdvancedLogger(config);
    }
    return AdvancedLogger.instance;
  }

  /**
   * Log methods for different levels
   */
  public debug(message: string, data?: Record<string, any>, context?: Partial<LogEntry>): void {
    this.log('debug', message, data, context);
  }

  public info(message: string, data?: Record<string, any>, context?: Partial<LogEntry>): void {
    this.log('info', message, data, context);
  }

  public warn(message: string, data?: Record<string, any>, context?: Partial<LogEntry>): void {
    this.log('warn', message, data, context);
  }

  public error(message: string, error?: Error, data?: Record<string, any>, context?: Partial<LogEntry>): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    } : undefined;

    this.log('error', message, data, { ...context, error: errorData });
  }

  public fatal(message: string, error?: Error, data?: Record<string, any>, context?: Partial<LogEntry>): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    } : undefined;

    this.log('fatal', message, data, { ...context, error: errorData });
  }

  /**
   * Specialized logging methods
   */
  public logSecurity(event: string, details: Record<string, any>, context?: Partial<LogEntry>): void {
    if (!this.config.enableSecurityLogging) return;

    this.log('warn', `Security Event: ${event}`, details, {
      ...context,
      component: 'security',
      tags: ['security', event],
    });
  }

  public logPerformance(operation: string, duration: number, data?: Record<string, any>, context?: Partial<LogEntry>): void {
    if (!this.config.enablePerformanceLogging) return;

    const memoryUsage = process.memoryUsage();
    
    this.log('info', `Performance: ${operation}`, data, {
      ...context,
      component: 'performance',
      performance: {
        duration,
        memory: memoryUsage.heapUsed,
      },
      tags: ['performance', operation],
    });
  }

  public logUserAction(action: string, userId: string, data?: Record<string, any>, context?: Partial<LogEntry>): void {
    this.log('info', `User Action: ${action}`, data, {
      ...context,
      userId,
      component: 'user-action',
      tags: ['user-action', action],
    });
  }

  public logApiRequest(method: string, route: string, statusCode: number, duration: number, context?: Partial<LogEntry>): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.log(level, `API ${method} ${route} - ${statusCode}`, {
      method,
      route,
      statusCode,
      duration,
    }, {
      ...context,
      component: 'api',
      performance: { duration, memory: process.memoryUsage().heapUsed },
      tags: ['api', method.toLowerCase(), `status-${statusCode}`],
    });
  }

  public logDatabaseQuery(query: string, duration: number, rowCount?: number, context?: Partial<LogEntry>): void {
    const level: LogLevel = duration > 1000 ? 'warn' : 'debug';
    
    this.log(level, `Database Query - ${duration}ms`, {
      query: query.substring(0, 200), // Truncate long queries
      duration,
      rowCount,
    }, {
      ...context,
      component: 'database',
      performance: { duration, memory: process.memoryUsage().heapUsed },
      tags: ['database', duration > 1000 ? 'slow-query' : 'query'],
    });
  }

  /**
   * Performance timing utilities
   */
  public startTimer(operationId: string): void {
    this.performanceStartTimes.set(operationId, Date.now());
  }

  public endTimer(operationId: string, operation: string, data?: Record<string, any>, context?: Partial<LogEntry>): void {
    const startTime = this.performanceStartTimes.get(operationId);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.logPerformance(operation, duration, data, context);
      this.performanceStartTimes.delete(operationId);
    }
  }

  /**
   * Alert management
   */
  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  public removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
  }

  public getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: Record<string, any>, context?: Partial<LogEntry>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.config.service,
      data,
      ...context,
    };

    // Add to buffer
    this.logBuffer.push(entry);

    // Console logging (immediate)
    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }

    // Check buffer size
    if (this.logBuffer.length >= this.config.bufferSize) {
      this.flush();
    }

    // Check alert rules
    this.checkAlerts(entry);

    // Send to monitoring service (disabled for Edge Runtime compatibility)
    if (MonitoringService && (level === 'error' || level === 'fatal')) {
      MonitoringService.trackError();
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= currentLevelIndex;
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableStructuredLogging) {
      // Simple console logging
      const method = entry.level === 'debug' ? 'debug' :
                    entry.level === 'info' ? 'info' :
                    entry.level === 'warn' ? 'warn' :
                    'error';
      
      console[method](`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`);
      return;
    }

    // Structured console logging
    const logObject = {
      '@timestamp': entry.timestamp,
      level: entry.level,
      message: entry.message,
      service: entry.service,
      ...(entry.component && { component: entry.component }),
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.requestId && { requestId: entry.requestId }),
      ...(entry.data && { data: entry.data }),
      ...(entry.error && { error: entry.error }),
      ...(entry.performance && { performance: entry.performance }),
      ...(entry.context && { context: entry.context }),
      ...(entry.tags && { tags: entry.tags }),
    };

    const method = entry.level === 'debug' ? 'debug' :
                  entry.level === 'info' ? 'info' :
                  entry.level === 'warn' ? 'warn' :
                  'error';

    console[method](JSON.stringify(logObject));
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const entries = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // File logging
      if (this.config.enableFile && this.config.filePath) {
        await this.writeToFile(entries);
      }

      // Database logging
      if (this.config.enableDatabase) {
        await this.writeToDatabase(entries);
      }

      // Remote logging
      if (this.config.enableRemote && this.config.remoteEndpoint) {
        await this.writeToRemote(entries);
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Put entries back in buffer for retry
      this.logBuffer.unshift(...entries);
    }
  }

  private async writeToFile(entries: LogEntry[]): Promise<void> {
    // Implementation would depend on your file system setup
    // For now, we'll skip file writing in the web environment
    if (typeof window !== 'undefined') return;

    try {
      const fs = require('fs').promises;
      const logLines = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      await fs.appendFile(this.config.filePath!, logLines);
    } catch (error) {
      console.error('File logging error:', error);
    }
  }

  private async writeToDatabase(entries: LogEntry[]): Promise<void> {
    // Implementation would integrate with your database
    // For now, we'll use local storage in browser or skip in Node.js
    if (typeof window !== 'undefined') {
      try {
        const existingLogs = JSON.parse(localStorage.getItem('app-logs') || '[]');
        const updatedLogs = [...existingLogs, ...entries].slice(-1000); // Keep last 1000 entries
        localStorage.setItem('app-logs', JSON.stringify(updatedLogs));
      } catch (error) {
        console.error('Local storage logging error:', error);
      }
    }
  }

  private async writeToRemote(entries: LogEntry[]): Promise<void> {
    try {
      await fetch(this.config.remoteEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries }),
      });
    } catch (error) {
      console.error('Remote logging error:', error);
    }
  }

  private checkAlerts(entry: LogEntry): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown
      const lastTriggered = this.alertCooldowns.get(rule.id);
      if (lastTriggered && Date.now() - lastTriggered < rule.cooldownMs) {
        continue;
      }

      if (this.evaluateAlertCondition(rule.condition, entry)) {
        this.triggerAlert(rule, entry);
      }
    }
  }

  private evaluateAlertCondition(condition: AlertCondition, entry: LogEntry): boolean {
    switch (condition.type) {
      case 'threshold':
        return this.evaluateThresholdCondition(condition, entry);
      case 'pattern':
        return this.evaluatePatternCondition(condition, entry);
      case 'anomaly':
        return this.evaluateAnomalyCondition(condition, entry);
      default:
        return false;
    }
  }

  private evaluateThresholdCondition(condition: AlertCondition, entry: LogEntry): boolean {
    if (!condition.metric || !condition.operator || condition.threshold === undefined) {
      return false;
    }

    const value = this.extractMetricValue(condition.metric, entry);
    if (value === undefined) return false;

    switch (condition.operator) {
      case 'gt':
        return value > condition.threshold;
      case 'lt':
        return value < condition.threshold;
      case 'eq':
        return value === condition.threshold;
      default:
        return false;
    }
  }

  private evaluatePatternCondition(condition: AlertCondition, entry: LogEntry): boolean {
    if (!condition.pattern) return false;

    const searchText = `${entry.message} ${JSON.stringify(entry.data || {})}`;
    
    if (condition.operator === 'contains') {
      return searchText.toLowerCase().includes(condition.pattern.toLowerCase());
    }
    
    if (condition.operator === 'matches') {
      try {
        const regex = new RegExp(condition.pattern, 'i');
        return regex.test(searchText);
      } catch {
        return false;
      }
    }

    return false;
  }

  private evaluateAnomalyCondition(condition: AlertCondition, entry: LogEntry): boolean {
    // Simple anomaly detection based on error level
    return entry.level === 'error' || entry.level === 'fatal';
  }

  private extractMetricValue(metric: string, entry: LogEntry): number | undefined {
    switch (metric) {
      case 'response_time':
        return entry.performance?.duration;
      case 'memory_usage':
        return entry.performance?.memory;
      case 'error_count':
        return entry.level === 'error' || entry.level === 'fatal' ? 1 : 0;
      default:
        return undefined;
    }
  }

  private async triggerAlert(rule: AlertRule, entry: LogEntry): Promise<void> {
    console.warn(`🚨 ALERT: ${rule.name} - ${entry.message}`);
    
    this.alertCooldowns.set(rule.id, Date.now());

    for (const action of rule.actions) {
      try {
        await this.executeAlertAction(action, rule, entry);
      } catch (error) {
        console.error(`Failed to execute alert action ${action.type}:`, error);
      }
    }

    // Track alert in monitoring (disabled for Edge Runtime compatibility)
    if (MonitoringService) {
      MonitoringService.trackMetric();
    }
  }

  private async executeAlertAction(action: AlertAction, rule: AlertRule, entry: LogEntry): Promise<void> {
    switch (action.type) {
      case 'console':
        console.error(`🚨 ${rule.name}: ${entry.message}`, entry);
        break;
      
      case 'webhook':
        if (action.config.url) {
          await fetch(action.config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rule, entry, timestamp: new Date().toISOString() }),
          });
        }
        break;
      
      case 'email':
        // Email integration would be implemented here
        console.log(`Would send email alert: ${rule.name}`);
        break;
      
      case 'slack':
        // Slack integration would be implemented here
        console.log(`Would send Slack alert: ${rule.name}`);
        break;
      
      case 'database':
        // Database alert storage would be implemented here
        console.log(`Would store alert in database: ${rule.name}`);
        break;
    }
  }

  private initializeDefaultAlerts(): void {
    // High error rate alert
    this.addAlertRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      description: 'Triggered when error rate exceeds threshold',
      condition: {
        type: 'threshold',
        metric: 'error_count',
        operator: 'gt',
        threshold: 0,
      },
      actions: [
        { type: 'console', config: {} },
      ],
      enabled: true,
      cooldownMs: 60000, // 1 minute
    });

    // Slow response time alert
    this.addAlertRule({
      id: 'slow-response',
      name: 'Slow Response Time',
      description: 'Triggered when response time is too slow',
      condition: {
        type: 'threshold',
        metric: 'response_time',
        operator: 'gt',
        threshold: 2000, // 2 seconds
      },
      actions: [
        { type: 'console', config: {} },
      ],
      enabled: true,
      cooldownMs: 300000, // 5 minutes
    });

    // Security event alert
    this.addAlertRule({
      id: 'security-event',
      name: 'Security Event',
      description: 'Triggered on security-related events',
      condition: {
        type: 'pattern',
        pattern: 'security',
        operator: 'contains',
      },
      actions: [
        { type: 'console', config: {} },
      ],
      enabled: true,
      cooldownMs: 60000, // 1 minute
    });
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  public async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Final flush
    await this.flush();
  }
}

// Export singleton instance
export const logger = AdvancedLogger.getInstance({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: true,
  enableDatabase: process.env.NODE_ENV === 'production',
  enableRemote: process.env.NODE_ENV === 'production',
  remoteEndpoint: process.env.LOGGING_ENDPOINT,
});

// Export class for custom instances
export { AdvancedLogger };

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    await logger.shutdown();
  });

  process.on('SIGINT', async () => {
    await logger.shutdown();
  });
}
