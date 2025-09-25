/**
 * Enterprise Input Validation System
 * Comprehensive validation for all API endpoints with security focus
 */

import { NextRequest, NextResponse } from 'next/server';
import { InputSanitizer, ValidationResult } from '@/utils/security';

// Validation schemas for different API endpoints
export const ValidationSchemas = {
  // Transaction validation
  transaction: {
    amount: {
      type: 'number' as const,
      required: true,
      min: -999999.99,
      max: 999999.99,
      precision: 2,
    },
    description: {
      type: 'string' as const,
      required: false,
      maxLength: 500,
      pattern: /^[a-zA-Z0-9\s\-_.,!?()]*$/,
    },
    category: {
      type: 'string' as const,
      required: true,
      maxLength: 50,
      enum: ['groceries', 'utilities', 'transportation', 'healthcare', 'entertainment', 'dining', 'shopping', 'income', 'other'],
    },
    date: {
      type: 'date' as const,
      required: false,
      minDate: new Date('2020-01-01'),
      maxDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year in future
    },
  },

  // User balance validation
  balance: {
    balance: {
      type: 'number' as const,
      required: true,
      min: -999999.99,
      max: 999999.99,
      precision: 2,
    },
  },

  // Recurring bill validation
  recurringBill: {
    name: {
      type: 'string' as const,
      required: true,
      minLength: 1,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_.,()]*$/,
    },
    amount: {
      type: 'number' as const,
      required: true,
      min: 0,
      max: 999999.99,
      precision: 2,
    },
    frequency: {
      type: 'string' as const,
      required: true,
      enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
    },
    category: {
      type: 'string' as const,
      required: true,
      maxLength: 50,
      enum: ['utilities', 'insurance', 'subscriptions', 'rent', 'mortgage', 'loan', 'other'],
    },
    startDate: {
      type: 'date' as const,
      required: true,
      minDate: new Date('2020-01-01'),
    },
    endDate: {
      type: 'date' as const,
      required: false,
      minDate: new Date(),
    },
    isVariableAmount: {
      type: 'boolean' as const,
      required: false,
    },
    provider: {
      type: 'string' as const,
      required: false,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_.,&()]*$/,
    },
    notes: {
      type: 'string' as const,
      required: false,
      maxLength: 1000,
    },
  },

  // Authentication validation
  auth: {
    email: {
      type: 'email' as const,
      required: true,
      maxLength: 254,
    },
    pin: {
      type: 'string' as const,
      required: true,
      pattern: /^\d{4}$/,
      exactLength: 4,
    },
    name: {
      type: 'string' as const,
      required: false,
      minLength: 1,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-']*$/,
    },
  },
};

// Validation rule interface
interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  exactLength?: number;
  min?: number;
  max?: number;
  precision?: number;
  pattern?: RegExp;
  enum?: string[];
  minDate?: Date;
  maxDate?: Date;
  items?: ValidationRule; // For array validation
}

// Enhanced validation result
export interface EnhancedValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData: any;
  securityScore: number;
  metadata: {
    fieldCount: number;
    securityFlags: string[];
    performanceMetrics: {
      validationTime: number;
      memoryUsed: number;
    };
  };
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: any;
}

/**
 * Enterprise Validation Engine
 */
export class ValidationEngine {
  private static securityPatterns = {
    xss: [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<object[^>]*>.*?<\/object>/gi,
    ],
    sqlInjection: [
      /(\b(select|union|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /(--|#|\/\*|\*\/)/g,
      /(\bor\b|\band\b).*(\b=\b|\blike\b)/gi,
      /(\bunion\b.*\bselect\b)/gi,
    ],
    pathTraversal: [
      /\.\.\//g,
      /\.\.\\+/g,
      /%2e%2e%2f/gi,
      /%252e%252e%252f/gi,
    ],
    commandInjection: [
      /[;&|`$(){}[\]]/g,
      /\b(eval|exec|system|shell_exec)\b/gi,
    ],
  };

  /**
   * Validate request data against a schema
   */
  static async validateRequest(
    data: any,
    schema: Record<string, ValidationRule>,
    options: {
      strictMode?: boolean;
      sanitize?: boolean;
      logViolations?: boolean;
    } = {}
  ): Promise<EnhancedValidationResult> {
    const startTime = Date.now();
    const initialMemory = process.memoryUsage().heapUsed;

    const errors: ValidationError[] = [];
    const sanitizedData: any = {};
    const securityFlags: string[] = [];
    let securityScore = 100;

    try {
      // Validate each field in the schema
      for (const [fieldName, rule] of Object.entries(schema)) {
        const fieldValue = data[fieldName];
        
        // Check required fields
        if (rule.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
          errors.push({
            field: fieldName,
            message: `${fieldName} is required`,
            code: 'REQUIRED_FIELD_MISSING',
            severity: 'high',
          });
          securityScore -= 10;
          continue;
        }

        // Skip validation for optional empty fields
        if (!rule.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
          continue;
        }

        // Validate field
        const fieldResult = await this.validateField(fieldName, fieldValue, rule, options);
        
        if (!fieldResult.isValid) {
          errors.push(...fieldResult.errors);
          securityScore -= fieldResult.securityPenalty;
        } else {
          sanitizedData[fieldName] = fieldResult.sanitizedValue;
        }

        // Add security flags
        securityFlags.push(...fieldResult.securityFlags);
      }

      // Check for unexpected fields in strict mode
      if (options.strictMode !== false) {
        const allowedFields = Object.keys(schema);
        const providedFields = Object.keys(data);
        const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));

        if (unexpectedFields.length > 0) {
          errors.push({
            field: 'root',
            message: `Unexpected fields: ${unexpectedFields.join(', ')}`,
            code: 'UNEXPECTED_FIELDS',
            severity: 'medium',
            details: { unexpectedFields },
          });
          securityScore -= unexpectedFields.length * 5;
          securityFlags.push('unexpected_fields');
        }
      }

      // Global security checks
      const globalSecurityResult = await this.performGlobalSecurityChecks(data);
      if (globalSecurityResult.violations.length > 0) {
        errors.push(...globalSecurityResult.violations.map(v => ({
          field: 'root',
          message: v.message,
          code: v.code,
          severity: v.severity as any,
          details: v.details,
        })));
        securityScore -= globalSecurityResult.securityPenalty;
        securityFlags.push(...globalSecurityResult.flags);
      }

      const endTime = Date.now();
      const finalMemory = process.memoryUsage().heapUsed;

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 ? sanitizedData : data,
        securityScore: Math.max(0, securityScore),
        metadata: {
          fieldCount: Object.keys(schema).length,
          securityFlags,
          performanceMetrics: {
            validationTime: endTime - startTime,
            memoryUsed: finalMemory - initialMemory,
          },
        },
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'root',
          message: 'Validation engine error',
          code: 'VALIDATION_ENGINE_ERROR',
          severity: 'critical',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        }],
        sanitizedData: data,
        securityScore: 0,
        metadata: {
          fieldCount: 0,
          securityFlags: ['validation_engine_error'],
          performanceMetrics: {
            validationTime: Date.now() - startTime,
            memoryUsed: 0,
          },
        },
      };
    }
  }

  /**
   * Validate individual field
   */
  private static async validateField(
    fieldName: string,
    value: any,
    rule: ValidationRule,
    options: any
  ): Promise<{
    isValid: boolean;
    errors: ValidationError[];
    sanitizedValue: any;
    securityPenalty: number;
    securityFlags: string[];
  }> {
    const errors: ValidationError[] = [];
    const securityFlags: string[] = [];
    let sanitizedValue = value;
    let securityPenalty = 0;

    // Type validation
    const typeResult = this.validateType(fieldName, value, rule.type);
    if (!typeResult.isValid) {
      errors.push(...typeResult.errors);
      securityPenalty += 15;
    } else {
      sanitizedValue = typeResult.convertedValue;
    }

    // String validations
    if (rule.type === 'string' || rule.type === 'email') {
      const stringResult = await this.validateString(fieldName, sanitizedValue, rule);
      if (!stringResult.isValid) {
        errors.push(...stringResult.errors);
        securityPenalty += stringResult.securityPenalty;
      } else {
        sanitizedValue = stringResult.sanitizedValue;
      }
      securityFlags.push(...stringResult.securityFlags);
    }

    // Number validations
    if (rule.type === 'number') {
      const numberResult = this.validateNumber(fieldName, sanitizedValue, rule);
      if (!numberResult.isValid) {
        errors.push(...numberResult.errors);
        securityPenalty += 10;
      }
    }

    // Date validations
    if (rule.type === 'date') {
      const dateResult = this.validateDate(fieldName, sanitizedValue, rule);
      if (!dateResult.isValid) {
        errors.push(...dateResult.errors);
        securityPenalty += 10;
      } else {
        sanitizedValue = dateResult.sanitizedValue;
      }
    }

    // Enum validation
    if (rule.enum) {
      if (!rule.enum.includes(sanitizedValue)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be one of: ${rule.enum.join(', ')}`,
          code: 'INVALID_ENUM_VALUE',
          severity: 'medium',
          details: { allowedValues: rule.enum, providedValue: sanitizedValue },
        });
        securityPenalty += 10;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
      securityPenalty,
      securityFlags,
    };
  }

  /**
   * Validate data type
   */
  private static validateType(fieldName: string, value: any, expectedType: string) {
    const errors: ValidationError[] = [];
    let convertedValue = value;

    switch (expectedType) {
      case 'string':
      case 'email':
        if (typeof value !== 'string') {
          if (typeof value === 'number' || typeof value === 'boolean') {
            convertedValue = String(value);
          } else {
            errors.push({
              field: fieldName,
              message: `${fieldName} must be a string`,
              code: 'INVALID_TYPE',
              severity: 'high',
            });
          }
        }
        break;

      case 'number':
        if (typeof value === 'string' && !isNaN(parseFloat(value))) {
          convertedValue = parseFloat(value);
        } else if (typeof value !== 'number' || isNaN(value)) {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be a valid number`,
            code: 'INVALID_TYPE',
            severity: 'high',
          });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          if (value === 'true' || value === 'false') {
            convertedValue = value === 'true';
          } else if (value === 1 || value === 0) {
            convertedValue = Boolean(value);
          } else {
            errors.push({
              field: fieldName,
              message: `${fieldName} must be a boolean`,
              code: 'INVALID_TYPE',
              severity: 'medium',
            });
          }
        }
        break;

      case 'date':
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be a valid date`,
            code: 'INVALID_DATE',
            severity: 'high',
          });
        } else {
          convertedValue = dateValue;
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      convertedValue,
    };
  }

  /**
   * Validate string with security checks
   */
  private static async validateString(fieldName: string, value: string, rule: ValidationRule) {
    const errors: ValidationError[] = [];
    const securityFlags: string[] = [];
    let sanitizedValue = value;
    let securityPenalty = 0;

    // Length validations
    if (rule.minLength && value.length < rule.minLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${rule.minLength} characters`,
        code: 'MIN_LENGTH_VIOLATION',
        severity: 'medium',
      });
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must not exceed ${rule.maxLength} characters`,
        code: 'MAX_LENGTH_VIOLATION',
        severity: 'medium',
      });
    }

    if (rule.exactLength && value.length !== rule.exactLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be exactly ${rule.exactLength} characters`,
        code: 'EXACT_LENGTH_VIOLATION',
        severity: 'medium',
      });
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} format is invalid`,
        code: 'PATTERN_VIOLATION',
        severity: 'medium',
      });
    }

    // Email validation
    if (rule.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be a valid email address`,
          code: 'INVALID_EMAIL',
          severity: 'high',
        });
      }
    }

    // Security checks
    for (const [attackType, patterns] of Object.entries(this.securityPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(value)) {
          errors.push({
            field: fieldName,
            message: `${fieldName} contains potentially malicious content`,
            code: `SECURITY_VIOLATION_${attackType.toUpperCase()}`,
            severity: 'critical',
            details: { attackType, pattern: pattern.source },
          });
          securityFlags.push(attackType);
          securityPenalty += 50;
          break;
        }
      }
    }

    // Sanitize if requested
    if (errors.length === 0) {
      const sanitizeResult = InputSanitizer.sanitizeString(value, {
        maxLength: rule.maxLength,
        stripXss: true,
        pattern: rule.pattern,
      });
      
      if (sanitizeResult.isValid) {
        sanitizedValue = sanitizeResult.sanitizedValue;
      } else {
        errors.push({
          field: fieldName,
          message: 'Failed to sanitize input',
          code: 'SANITIZATION_FAILED',
          severity: 'high',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
      securityPenalty,
      securityFlags,
    };
  }

  /**
   * Validate numbers
   */
  private static validateNumber(fieldName: string, value: number, rule: ValidationRule) {
    const errors: ValidationError[] = [];

    if (rule.min !== undefined && value < rule.min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${rule.min}`,
        code: 'MIN_VALUE_VIOLATION',
        severity: 'medium',
      });
    }

    if (rule.max !== undefined && value > rule.max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must not exceed ${rule.max}`,
        code: 'MAX_VALUE_VIOLATION',
        severity: 'medium',
      });
    }

    if (rule.precision !== undefined) {
      const decimals = (value.toString().split('.')[1] || '').length;
      if (decimals > rule.precision) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must have at most ${rule.precision} decimal places`,
          code: 'PRECISION_VIOLATION',
          severity: 'low',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate dates
   */
  private static validateDate(fieldName: string, value: Date, rule: ValidationRule) {
    const errors: ValidationError[] = [];

    if (rule.minDate && value < rule.minDate) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be after ${rule.minDate.toISOString().split('T')[0]}`,
        code: 'MIN_DATE_VIOLATION',
        severity: 'medium',
      });
    }

    if (rule.maxDate && value > rule.maxDate) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be before ${rule.maxDate.toISOString().split('T')[0]}`,
        code: 'MAX_DATE_VIOLATION',
        severity: 'medium',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: value,
    };
  }

  /**
   * Perform global security checks
   */
  private static async performGlobalSecurityChecks(data: any) {
    const violations: any[] = [];
    const flags: string[] = [];
    let securityPenalty = 0;

    // Check for suspicious payload size
    const payloadSize = JSON.stringify(data).length;
    if (payloadSize > 1024 * 1024) { // 1MB
      violations.push({
        message: 'Payload size exceeds limit',
        code: 'PAYLOAD_TOO_LARGE',
        severity: 'high',
        details: { size: payloadSize },
      });
      flags.push('large_payload');
      securityPenalty += 30;
    }

    // Check for suspicious nesting depth
    const maxDepth = this.getObjectDepth(data);
    if (maxDepth > 10) {
      violations.push({
        message: 'Object nesting depth exceeds limit',
        code: 'EXCESSIVE_NESTING',
        severity: 'medium',
        details: { depth: maxDepth },
      });
      flags.push('deep_nesting');
      securityPenalty += 20;
    }

    return {
      violations,
      flags,
      securityPenalty,
    };
  }

  /**
   * Calculate object depth
   */
  private static getObjectDepth(obj: any, depth = 0): number {
    if (obj === null || typeof obj !== 'object') {
      return depth;
    }

    let maxDepth = depth;
    for (const value of Object.values(obj)) {
      const currentDepth = this.getObjectDepth(value, depth + 1);
      maxDepth = Math.max(maxDepth, currentDepth);
    }

    return maxDepth;
  }
}

/**
 * Validation middleware wrapper for API routes
 */
export function withValidation(
  schema: Record<string, ValidationRule>,
  options?: { strictMode?: boolean; sanitize?: boolean }
) {
  return function validationMiddleware(handler: Function) {
    return async function (request: NextRequest, context?: any) {
      try {
        // Get request body
        let body: any = {};
        
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            body = await request.json();
          } catch (error) {
            return NextResponse.json(
              {
                error: 'Invalid JSON payload',
                code: 'INVALID_JSON',
                details: 'Request body must be valid JSON',
              },
              { status: 400 }
            );
          }
        }

        // Validate request body
        const validationResult = await ValidationEngine.validateRequest(body, schema, options);

        if (!validationResult.isValid) {
          // Log security violations
          const criticalErrors = validationResult.errors.filter(e => e.severity === 'critical');
          if (criticalErrors.length > 0) {
            console.error('Critical validation errors:', {
              url: request.url,
              method: request.method,
              errors: criticalErrors,
              securityFlags: validationResult.metadata.securityFlags,
            });
          }

          return NextResponse.json(
            {
              error: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: validationResult.errors.map(e => ({
                field: e.field,
                message: e.message,
                code: e.code,
              })),
              securityScore: validationResult.securityScore,
            },
            { status: 400 }
          );
        }

        // Add validated data to request context
        const validatedRequest = request as any;
        validatedRequest.validatedData = validationResult.sanitizedData;
        validatedRequest.validationMetadata = validationResult.metadata;

        // Continue to handler
        return await handler(validatedRequest, context);

      } catch (error) {
        console.error('Validation middleware error:', error);
        return NextResponse.json(
          {
            error: 'Validation system error',
            code: 'VALIDATION_SYSTEM_ERROR',
          },
          { status: 500 }
        );
      }
    };
  };
}