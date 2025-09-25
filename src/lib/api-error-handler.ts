/**
 * Centralized API Error Handler
 * Provides consistent error responses and logging across all API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
// Note: PrismaClientKnownRequestError import removed to support Edge Runtime
import { MonitoringService } from '@/utils/monitoring';

export interface APIError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
  timestamp: string;
  requestId?: string;
}

export class APIErrorHandler {
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Main error handler for API routes
   */
  static async handleError(
    error: unknown,
    request: NextRequest,
    context?: { route?: string; userId?: string }
  ): Promise<NextResponse> {
    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();

    // Log error for monitoring
    await this.logError(error, request, requestId, context);

    // Handle different error types
    if (error instanceof ValidationError) {
      return this.createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.details,
        statusCode: 400,
        timestamp,
        requestId
      });
    }

    if (error instanceof ZodError) {
      return this.createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code
        })),
        statusCode: 400,
        timestamp,
        requestId
      });
    }

    // Check for Prisma errors by error code (Edge Runtime compatible)
    if (error && typeof error === 'object' && 'code' in error && typeof (error as any).code === 'string') {
      const prismaError = error as any;
      if (prismaError.code.startsWith('P')) {
        return this.handlePrismaError(prismaError, timestamp, requestId);
      }
    }

    if (error instanceof AuthenticationError) {
      return this.createErrorResponse({
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication required',
        statusCode: 401,
        timestamp,
        requestId
      });
    }

    if (error instanceof AuthorizationError) {
      return this.createErrorResponse({
        code: 'AUTHORIZATION_ERROR',
        message: 'Insufficient permissions',
        statusCode: 403,
        timestamp,
        requestId
      });
    }

    if (error instanceof NotFoundError) {
      return this.createErrorResponse({
        code: 'NOT_FOUND',
        message: error.message || 'Resource not found',
        statusCode: 404,
        timestamp,
        requestId
      });
    }

    if (error instanceof RateLimitError) {
      return this.createErrorResponse({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        details: { retryAfter: error.retryAfter },
        statusCode: 429,
        timestamp,
        requestId
      });
    }

    // Handle unknown errors
    console.error('Unhandled API Error:', error);
    
    return this.createErrorResponse({
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : String(error),
      statusCode: 500,
      timestamp,
      requestId
    });
  }

  /**
   * Handle Prisma-specific errors
   */
  private static handlePrismaError(
    error: any,
    timestamp: string,
    requestId: string
  ): NextResponse {
    switch (error.code) {
      case 'P2002':
        return this.createErrorResponse({
          code: 'DUPLICATE_RECORD',
          message: 'A record with this data already exists',
          details: { fields: error.meta?.target },
          statusCode: 409,
          timestamp,
          requestId
        });

      case 'P2025':
        return this.createErrorResponse({
          code: 'RECORD_NOT_FOUND',
          message: 'The requested record was not found',
          statusCode: 404,
          timestamp,
          requestId
        });

      case 'P2003':
        return this.createErrorResponse({
          code: 'FOREIGN_KEY_CONSTRAINT',
          message: 'Cannot delete record due to related data',
          statusCode: 409,
          timestamp,
          requestId
        });

      case 'P2014':
        return this.createErrorResponse({
          code: 'INVALID_RELATION',
          message: 'Invalid relation in the request',
          statusCode: 400,
          timestamp,
          requestId
        });

      default:
        return this.createErrorResponse({
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
          statusCode: 500,
          timestamp,
          requestId
        });
    }
  }

  /**
   * Create standardized error response
   */
  private static createErrorResponse(error: APIError): NextResponse {
    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
        requestId: error.requestId
      }
    }, { status: error.statusCode });
  }

  /**
   * Log error for monitoring and debugging
   */
  private static async logError(
    error: unknown,
    request: NextRequest,
    requestId: string,
    context?: { route?: string; userId?: string }
  ): Promise<void> {
    const errorInfo = {
      requestId,
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      route: context?.route,
      userId: context?.userId,
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    };

    // Log to monitoring service
    if (process.env.NODE_ENV === 'production') {
      await MonitoringService.trackError(error as Error, {
        ...errorInfo,
        severity: this.getErrorSeverity(error)
      });
    } else {
      console.error('API Error:', errorInfo);
    }
  }

  /**
   * Determine error severity for monitoring
   */
  private static getErrorSeverity(error: unknown): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof ValidationError || error instanceof ZodError) {
      return 'low';
    }
    
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return 'medium';
    }
    
    if (error && typeof error === 'object' && 'code' in error && typeof (error as any).code === 'string' && (error as any).code.startsWith('P')) {
      return 'high';
    }
    
    return 'critical'; // Unknown errors
  }

  /**
   * Wrapper for API route handlers with automatic error handling
   */
  static withErrorHandling(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
    options?: { route?: string }
  ) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
      try {
        return await handler(request, context);
      } catch (error) {
        return this.handleError(error, request, {
          route: options?.route,
          userId: context?.userId
        });
      }
    };
  }

  /**
   * Create success response with consistent format
   */
  static createSuccessResponse<T>(
    data: T,
    message?: string,
    statusCode: number = 200
  ): NextResponse {
    return NextResponse.json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}

// Custom Error Classes
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Utility functions for common validations
export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
};

export const validatePositiveNumber = (value: number, fieldName: string): void => {
  if (typeof value !== 'number' || value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`);
  }
};

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const validateDateRange = (startDate: Date, endDate: Date): void => {
  if (startDate >= endDate) {
    throw new ValidationError('Start date must be before end date');
  }
};
