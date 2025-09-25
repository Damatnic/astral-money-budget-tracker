/**
 * Client-Safe Logger
 * Simple logging for client-side components
 */

'use client';

export interface ClientLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  data?: Record<string, any>;
  context?: Record<string, any>;
}

class ClientLogger {
  private static instance: ClientLogger;
  private logs: ClientLogEntry[] = [];
  private maxLogs = 100;

  private constructor() {}

  public static getInstance(): ClientLogger {
    if (!ClientLogger.instance) {
      ClientLogger.instance = new ClientLogger();
    }
    return ClientLogger.instance;
  }

  public log(level: ClientLogEntry['level'], message: string, data?: Record<string, any>, context?: Record<string, any>) {
    const entry: ClientLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = level === 'error' || level === 'critical' ? 'error' : 
                       level === 'warn' ? 'warn' : 'log';
      console[logMethod](`[${level.toUpperCase()}] ${message}`, data || '');
    }

    // Send to monitoring in production (if available)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      try {
        // Could send to analytics service here
        if (level === 'error' || level === 'critical') {
          // Track errors
        }
      } catch (error) {
        // Fail silently
      }
    }
  }

  public error(message: string, data?: Record<string, any>, context?: Record<string, any>) {
    this.log('error', message, data, context);
  }

  public warn(message: string, data?: Record<string, any>, context?: Record<string, any>) {
    this.log('warn', message, data, context);
  }

  public info(message: string, data?: Record<string, any>, context?: Record<string, any>) {
    this.log('info', message, data, context);
  }

  public getLogs(): ClientLogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
  }
}

export const clientLogger = ClientLogger.getInstance();
