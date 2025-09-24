/**
 * Advanced Security and Input Validation Utilities
 * Provides comprehensive protection against common web vulnerabilities
 */

// Security constants
const SECURITY_CONFIG = {
  MAX_STRING_LENGTH: 1000,
  MAX_NUMBER_VALUE: 999999999.99,
  MIN_NUMBER_VALUE: -999999999.99,
  XSS_PATTERNS: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ],
};

/**
 * Input validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
  securityScore: number; // 0-100, higher is more secure
}

/**
 * Advanced input sanitizer
 */
export class InputSanitizer {
  /**
   * Sanitize and validate a string input
   */
  static sanitizeString(
    input: any,
    options: {
      maxLength?: number;
      allowHtml?: boolean;
      stripXss?: boolean;
      required?: boolean;
      pattern?: RegExp;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue = '';
    let securityScore = 100;

    // Type validation
    if (typeof input !== 'string') {
      if (input === null || input === undefined) {
        if (options.required) {
          errors.push('This field is required');
          return { isValid: false, errors, securityScore: 0 };
        }
        return { isValid: true, errors: [], sanitizedValue: '', securityScore: 100 };
      }
      input = String(input);
      securityScore -= 5;
    }

    // Length validation
    const maxLength = options.maxLength || SECURITY_CONFIG.MAX_STRING_LENGTH;
    if (input.length > maxLength) {
      errors.push(`Input exceeds maximum length of ${maxLength} characters`);
      input = input.substring(0, maxLength);
      securityScore -= 20;
    }

    // XSS detection and removal
    if (options.stripXss !== false) {
      const originalLength = input.length;
      input = this.removeXssPatterns(input);
      if (input.length < originalLength) {
        securityScore -= 30;
        errors.push('Potentially dangerous content was removed');
      }
    }

    // HTML sanitization
    if (!options.allowHtml) {
      input = this.escapeHtml(input);
    }

    // Pattern validation
    if (options.pattern && !options.pattern.test(input)) {
      errors.push('Input does not match the required format');
    }

    sanitizedValue = input.trim();

    // Required field validation
    if (options.required && !sanitizedValue) {
      errors.push('This field is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
      securityScore: Math.max(0, securityScore),
    };
  }

  /**
   * Sanitize and validate numeric input
   */
  static sanitizeNumber(
    input: any,
    options: {
      min?: number;
      max?: number;
      integer?: boolean;
      positive?: boolean;
      required?: boolean;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue: number | null = null;
    let securityScore = 100;

    // Handle null/undefined
    if (input === null || input === undefined || input === '') {
      if (options.required) {
        errors.push('This field is required');
        return { isValid: false, errors, securityScore: 0 };
      }
      return { isValid: true, errors: [], sanitizedValue: null, securityScore: 100 };
    }

    // Convert to number
    const numValue = Number(input);

    // Validate number
    if (isNaN(numValue) || !isFinite(numValue)) {
      errors.push('Please enter a valid number');
      return { isValid: false, errors, securityScore: 0 };
    }

    // Range validation
    const min = options.min ?? SECURITY_CONFIG.MIN_NUMBER_VALUE;
    const max = options.max ?? SECURITY_CONFIG.MAX_NUMBER_VALUE;

    if (numValue < min) {
      errors.push(`Value must be at least ${min}`);
    }

    if (numValue > max) {
      errors.push(`Value must not exceed ${max}`);
    }

    // Positive number validation
    if (options.positive && numValue < 0) {
      errors.push('Value must be positive');
    }

    // Integer validation
    if (options.integer && !Number.isInteger(numValue)) {
      errors.push('Value must be a whole number');
    }

    sanitizedValue = numValue;

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
      securityScore,
    };
  }

  /**
   * Remove XSS patterns from input
   */
  private static removeXssPatterns(input: string): string {
    let sanitized = input;
    
    SECURITY_CONFIG.XSS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized;
  }

  /**
   * Escape HTML characters
   */
  private static escapeHtml(input: string): string {
    const htmlEscapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
  }
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private static store = new Map<string, { count: number; resetTime: number }>();

  /**
   * Check if request is within rate limits
   */
  static checkRateLimit(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const existing = this.store.get(identifier);

    if (!existing || now > existing.resetTime) {
      // Create new or reset expired window
      this.store.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs,
      };
    }

    if (existing.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime,
      };
    }

    // Increment count
    existing.count++;
    this.store.set(identifier, existing);

    return {
      allowed: true,
      remaining: maxRequests - existing.count,
      resetTime: existing.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  static cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.store.forEach((value, key) => {
      if (now > value.resetTime) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.store.delete(key));
  }
}

/**
 * CSRF protection utility
 */
export class CSRFProtection {
  private static tokenStore = new Map<string, string>();

  /**
   * Generate CSRF token for session
   */
  static generateToken(sessionId: string): string {
    const token = this.generateRandomToken();
    this.tokenStore.set(sessionId, token);
    return token;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(sessionId: string, providedToken: string): boolean {
    const storedToken = this.tokenStore.get(sessionId);
    return storedToken === providedToken;
  }

  /**
   * Generate random token
   */
  private static generateRandomToken(): string {
    return Array.from(
      { length: 32 },
      () => Math.random().toString(36)[2]
    ).join('');
  }
}

/**
 * Utility functions for common security operations
 */
export const SecurityUtils = {
  /**
   * Generate a secure random ID
   */
  generateSecureId: (): string => {
    return Array.from(
      { length: 16 },
      () => Math.random().toString(36)[2]
    ).join('');
  },

  /**
   * Check if running in secure context
   */
  isSecureContext: (): boolean => {
    if (typeof window === 'undefined') return true; // Server-side is considered secure
    return window.isSecureContext || window.location.protocol === 'https:';
  },

  /**
   * Validate password strength
   */
  validatePasswordStrength: (password: string): {
    score: number;
    feedback: string[];
  } => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 25;
    else feedback.push('Password should be at least 8 characters long');

    if (/[a-z]/.test(password)) score += 15;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score += 15;
    else feedback.push('Include numbers');

    if (/[^\w\s]/.test(password)) score += 20;
    else feedback.push('Include special characters');

    if (password.length >= 12) score += 10;

    return { score, feedback };
  },
};

export default {
  InputSanitizer,
  RateLimiter,
  CSRFProtection,
  SecurityUtils,
};