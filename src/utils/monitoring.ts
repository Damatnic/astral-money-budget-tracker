/**
 * Advanced Performance Monitoring and Error Logging System
 * Provides comprehensive tracking of application performance and errors
 */

import React from 'react';

// Types for monitoring data
interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  timestamp: number;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  metadata: Record<string, any>;
  componentStack?: string;
  errorBoundary?: string;
}

interface UserAction {
  id: string;
  action: string;
  component: string;
  timestamp: number;
  sessionId: string;
  duration?: number;
  metadata: Record<string, any>;
}

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private startTime: number;

  private constructor() {
    this.sessionId = this.generateId();
    this.startTime = performance.now();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record a custom metric
   */
  recordMetric(
    name: string,
    value: number,
    tags: Record<string, string> = {},
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      id: this.generateId(),
      name,
      value,
      timestamp: Date.now(),
      tags: {
        sessionId: this.sessionId,
        ...tags,
      },
      metadata,
    };

    this.metrics.push(metric);
    this.limitMetricsStorage();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Metric: ${name} = ${value}`, tags);
    }
  }

  /**
   * Start timing an operation
   */
  startTimer(name: string, tags?: Record<string, string>): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_duration`, duration, tags);
    };
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return this.metrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  private limitMetricsStorage(): void {
    const maxMetrics = 1000;
    if (this.metrics.length > maxMetrics) {
      this.metrics = this.metrics.slice(-maxMetrics);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Error logging class
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLog[] = [];
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateId();
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error
   */
  logError(
    message: string,
    error?: Error,
    level: 'error' | 'warning' | 'info' | 'debug' = 'error',
    metadata: Record<string, any> = {}
  ): void {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      message,
      stack: error?.stack,
      level,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      metadata,
    };

    this.logs.push(errorLog);
    this.limitLogStorage();

    console.error(`🚨 ${level.toUpperCase()}: ${message}`, {
      error,
      metadata,
    });
  }

  /**
   * Log API error
   */
  logApiError(
    endpoint: string,
    statusCode: number,
    error: any,
    metadata: Record<string, any> = {}
  ): void {
    this.logError(
      `API Error: ${endpoint}`,
      error instanceof Error ? error : new Error(String(error)),
      'error',
      {
        endpoint,
        statusCode,
        ...metadata,
      }
    );
  }

  /**
   * Get error logs
   */
  getLogs(): ErrorLog[] {
    return this.logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  private limitLogStorage(): void {
    const maxLogs = 500;
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(-maxLogs);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * User action tracker
 */
export class UserActionTracker {
  private static instance: UserActionTracker;
  private actions: UserAction[] = [];
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateId();
  }

  static getInstance(): UserActionTracker {
    if (!UserActionTracker.instance) {
      UserActionTracker.instance = new UserActionTracker();
    }
    return UserActionTracker.instance;
  }

  /**
   * Track user action
   */
  trackAction(
    action: string,
    component: string,
    metadata: Record<string, any> = {},
    duration?: number
  ): void {
    const userAction: UserAction = {
      id: this.generateId(),
      action,
      component,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      duration,
      metadata,
    };

    this.actions.push(userAction);
    this.limitActionStorage();

    if (process.env.NODE_ENV === 'development') {
      console.log(`👆 User Action: ${action} in ${component}`, metadata);
    }
  }

  /**
   * Get user actions
   */
  getActions(): UserAction[] {
    return this.actions.sort((a, b) => b.timestamp - a.timestamp);
  }

  private limitActionStorage(): void {
    const maxActions = 1000;
    if (this.actions.length > maxActions) {
      this.actions = this.actions.slice(-maxActions);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const errorLogger = ErrorLogger.getInstance();
export const userActionTracker = UserActionTracker.getInstance();

// Export unified monitoring service for compatibility
export const MonitoringService = {
  trackMetric: (name: string, value: number, tags?: Record<string, string>) => {
    performanceMonitor.trackMetric(name, value, tags);
  },
  
  trackError: (error: Error, metadata?: Record<string, any>) => {
    errorLogger.logError(error, metadata);
  },
  
  trackUserAction: (action: string, component: string, metadata?: Record<string, any>) => {
    userActionTracker.trackAction(action, component, metadata);
  },
  
  getMetrics: () => performanceMonitor.getMetrics(),
  getErrors: () => errorLogger.getErrors(),
  getActions: () => userActionTracker.getActions(),
};