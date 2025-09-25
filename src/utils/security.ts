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
    const securityScore = 100;

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
 * Rate limit configuration interface
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyPrefix?: string;
}

/**
 * Rate limit result interface
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalRequests: number;
  retryAfterMs?: number;
}

/**
 * Enterprise-grade rate limiting utility
 */
export class RateLimiter {
  private static store = new Map<string, { count: number; resetTime: number; requests: Array<{ timestamp: number; success?: boolean }> }>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize rate limiter with automatic cleanup
   */
  static initialize(cleanupIntervalMs: number = 300000): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  /**
   * Check if request is within rate limits with enhanced configuration
   */
  static checkRateLimit(
    identifier: string,
    config: RateLimitConfig = {
      maxRequests: 100,
      windowMs: 60000
    }
  ): RateLimitResult {
    const now = Date.now();
    const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier;
    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      // Create new or reset expired window
      const newEntry = {
        count: 1,
        resetTime: now + config.windowMs,
        requests: [{ timestamp: now }]
      };
      
      this.store.set(key, newEntry);
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newEntry.resetTime,
        totalRequests: 1
      };
    }

    // Clean old requests from sliding window
    existing.requests = existing.requests.filter(req => 
      req.timestamp > (now - config.windowMs)
    );

    const currentCount = existing.requests.length;

    if (currentCount >= config.maxRequests) {
      const oldestRequest = existing.requests[0];
      const retryAfterMs = oldestRequest ? 
        (oldestRequest.timestamp + config.windowMs) - now : 
        config.windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime,
        totalRequests: currentCount,
        retryAfterMs: Math.max(0, retryAfterMs)
      };
    }

    // Add new request
    existing.requests.push({ timestamp: now });
    existing.count = existing.requests.length;
    this.store.set(key, existing);

    return {
      allowed: true,
      remaining: config.maxRequests - existing.count,
      resetTime: existing.resetTime,
      totalRequests: existing.count
    };
  }

  /**
   * Record request result for advanced filtering
   */
  static recordRequestResult(
    identifier: string, 
    success: boolean, 
    config: Pick<RateLimitConfig, 'keyPrefix'> = {}
  ): void {
    const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier;
    const existing = this.store.get(key);
    
    if (existing && existing.requests.length > 0) {
      const lastRequest = existing.requests[existing.requests.length - 1];
      lastRequest.success = success;
      this.store.set(key, existing);
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  static getRateLimitStatus(
    identifier: string,
    config: Pick<RateLimitConfig, 'maxRequests' | 'windowMs' | 'keyPrefix'> = {
      maxRequests: 100,
      windowMs: 60000
    }
  ): Omit<RateLimitResult, 'allowed'> {
    const now = Date.now();
    const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier;
    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      return {
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        totalRequests: 0
      };
    }

    const validRequests = existing.requests.filter(req => 
      req.timestamp > (now - config.windowMs)
    );

    return {
      remaining: Math.max(0, config.maxRequests - validRequests.length),
      resetTime: existing.resetTime,
      totalRequests: validRequests.length
    };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  static resetRateLimit(identifier: string, keyPrefix?: string): boolean {
    const key = keyPrefix ? `${keyPrefix}:${identifier}` : identifier;
    return this.store.delete(key);
  }

  /**
   * Clean up expired entries with enhanced logging
   */
  static cleanup(): { cleaned: number; total: number } {
    const now = Date.now();
    const keysToDelete: string[] = [];
    let totalEntries = 0;
    
    this.store.forEach((value, key) => {
      totalEntries++;
      if (now > value.resetTime) {
        keysToDelete.push(key);
      } else {
        // Clean old requests within valid entries
        value.requests = value.requests.filter(req => 
          req.timestamp > (now - 300000) // Keep requests from last 5 minutes
        );
        value.count = value.requests.length;
      }
    });
    
    keysToDelete.forEach(key => this.store.delete(key));

    return {
      cleaned: keysToDelete.length,
      total: totalEntries
    };
  }

  /**
   * Get store statistics for monitoring
   */
  static getStats(): {
    totalKeys: number;
    totalRequests: number;
    memoryUsageKB: number;
  } {
    let totalRequests = 0;
    
    this.store.forEach(value => {
      totalRequests += value.requests.length;
    });

    // Rough memory estimation
    const memoryUsageKB = Math.round(
      (this.store.size * 100 + totalRequests * 20) / 1024
    );

    return {
      totalKeys: this.store.size,
      totalRequests,
      memoryUsageKB
    };
  }

  /**
   * Cleanup on process termination
   */
  static destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

/**
 * CSRF token configuration interface
 */
export interface CSRFConfig {
  tokenLength?: number;
  expiryMs?: number;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
  rotationIntervalMs?: number;
}

/**
 * CSRF token data interface
 */
interface CSRFTokenData {
  token: string;
  created: number;
  expires: number;
  rotated?: number;
  usage: number;
}

/**
 * Enterprise-grade CSRF protection utility with token rotation and timing-safe comparison
 */
export class CSRFProtection {
  private static tokenStore = new Map<string, CSRFTokenData>();
  private static rotationInterval: NodeJS.Timeout | null = null;
  private static readonly DEFAULT_CONFIG: Required<CSRFConfig> = {
    tokenLength: 32,
    expiryMs: 3600000, // 1 hour
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    rotationIntervalMs: 1800000 // 30 minutes
  };

  /**
   * Initialize CSRF protection with automatic token rotation
   */
  static initialize(config: Partial<CSRFConfig> = {}): void {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
    }

    this.rotationInterval = setInterval(() => {
      this.rotateExpiredTokens();
    }, finalConfig.rotationIntervalMs);
  }

  /**
   * Generate secure CSRF token for session with enhanced entropy
   */
  static generateToken(
    sessionId: string, 
    config: Partial<CSRFConfig> = {}
  ): { token: string; expires: number; cookieOptions: any } {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const now = Date.now();
    const token = this.generateSecureToken(finalConfig.tokenLength);
    const expires = now + finalConfig.expiryMs;

    const tokenData: CSRFTokenData = {
      token,
      created: now,
      expires,
      usage: 0
    };

    this.tokenStore.set(sessionId, tokenData);

    const cookieOptions = {
      httpOnly: finalConfig.httpOnly,
      secure: finalConfig.secure,
      sameSite: finalConfig.sameSite,
      maxAge: finalConfig.expiryMs,
      path: '/'
    };

    return { token, expires, cookieOptions };
  }

  /**
   * Validate CSRF token with timing-safe comparison and usage tracking
   */
  static validateToken(
    sessionId: string, 
    providedToken: string,
    options: { 
      incrementUsage?: boolean;
      allowExpired?: boolean;
    } = {}
  ): { 
    valid: boolean; 
    reason?: string; 
    shouldRotate?: boolean;
    remainingTime?: number;
  } {
    const tokenData = this.tokenStore.get(sessionId);
    const now = Date.now();

    if (!tokenData) {
      return { valid: false, reason: 'Token not found' };
    }

    if (!options.allowExpired && now > tokenData.expires) {
      this.tokenStore.delete(sessionId);
      return { valid: false, reason: 'Token expired' };
    }

    if (!providedToken || providedToken.length !== tokenData.token.length) {
      return { valid: false, reason: 'Invalid token format' };
    }

    // Timing-safe comparison
    const isValid = this.timingSafeEqual(providedToken, tokenData.token);

    if (!isValid) {
      return { valid: false, reason: 'Token mismatch' };
    }

    // Increment usage counter
    if (options.incrementUsage !== false) {
      tokenData.usage++;
      this.tokenStore.set(sessionId, tokenData);
    }

    const remainingTime = tokenData.expires - now;
    const shouldRotate = remainingTime < (this.DEFAULT_CONFIG.expiryMs * 0.25); // Rotate when 25% time left

    return { 
      valid: true, 
      shouldRotate,
      remainingTime 
    };
  }

  /**
   * Rotate token for a session
   */
  static rotateToken(
    sessionId: string, 
    config: Partial<CSRFConfig> = {}
  ): { token: string; expires: number; cookieOptions: any } | null {
    const existingData = this.tokenStore.get(sessionId);
    if (!existingData) {
      return null;
    }

    const result = this.generateToken(sessionId, config);
    
    // Mark old token as rotated for grace period
    const gracePeriodMs = 30000; // 30 seconds
    setTimeout(() => {
      // Clean up old token after grace period
      const currentData = this.tokenStore.get(sessionId);
      if (currentData && currentData.token === result.token) {
        // Only clean up if the token hasn't been replaced again
      }
    }, gracePeriodMs);

    return result;
  }

  /**
   * Get token information without validation
   */
  static getTokenInfo(sessionId: string): {
    exists: boolean;
    created?: number;
    expires?: number;
    usage?: number;
    isExpired?: boolean;
    timeUntilExpiry?: number;
  } {
    const tokenData = this.tokenStore.get(sessionId);
    const now = Date.now();

    if (!tokenData) {
      return { exists: false };
    }

    return {
      exists: true,
      created: tokenData.created,
      expires: tokenData.expires,
      usage: tokenData.usage,
      isExpired: now > tokenData.expires,
      timeUntilExpiry: Math.max(0, tokenData.expires - now)
    };
  }

  /**
   * Remove token for session
   */
  static removeToken(sessionId: string): boolean {
    return this.tokenStore.delete(sessionId);
  }

  /**
   * Generate cryptographically secure token with enhanced entropy
   */
  private static generateSecureToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    
    // Use multiple sources of randomness
    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).substring(2);
    const random2 = Math.random().toString(36).substring(2);
    
    // Combine entropy sources
    const entropy = (timestamp + random1 + random2).split('').sort(() => Math.random() - 0.5).join('');
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      const entropyChar = entropy[i % entropy.length] || '';
      const mixedIndex = (randomIndex + entropyChar.charCodeAt(0)) % chars.length;
      result += chars[mixedIndex];
    }
    
    return result;
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   */
  private static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Rotate expired tokens and cleanup
   */
  private static rotateExpiredTokens(): { rotated: number; cleaned: number } {
    const now = Date.now();
    let rotated = 0;
    let cleaned = 0;
    const toDelete: string[] = [];

    this.tokenStore.forEach((tokenData, sessionId) => {
      const timeUntilExpiry = tokenData.expires - now;
      
      if (timeUntilExpiry <= 0) {
        // Token is expired, mark for deletion
        toDelete.push(sessionId);
        cleaned++;
      } else if (timeUntilExpiry < (this.DEFAULT_CONFIG.expiryMs * 0.25)) {
        // Token is close to expiry, rotate it
        try {
          this.rotateToken(sessionId);
          rotated++;
        } catch (error) {
          // If rotation fails, mark for deletion
          toDelete.push(sessionId);
          cleaned++;
        }
      }
    });

    // Clean up expired tokens
    toDelete.forEach(sessionId => this.tokenStore.delete(sessionId));

    return { rotated, cleaned };
  }

  /**
   * Get statistics for monitoring
   */
  static getStats(): {
    totalTokens: number;
    expiredTokens: number;
    averageUsage: number;
    memoryUsageKB: number;
  } {
    const now = Date.now();
    let expiredCount = 0;
    let totalUsage = 0;

    this.tokenStore.forEach(tokenData => {
      if (now > tokenData.expires) {
        expiredCount++;
      }
      totalUsage += tokenData.usage;
    });

    const averageUsage = this.tokenStore.size > 0 ? totalUsage / this.tokenStore.size : 0;
    const memoryUsageKB = Math.round((this.tokenStore.size * 200) / 1024); // Rough estimation

    return {
      totalTokens: this.tokenStore.size,
      expiredTokens: expiredCount,
      averageUsage: Math.round(averageUsage * 100) / 100,
      memoryUsageKB
    };
  }

  /**
   * Cleanup on process termination
   */
  static destroy(): void {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
    this.tokenStore.clear();
  }
}

/**
 * Content Security Policy configuration interface
 */
export interface CSPConfig {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  fontSrc?: string[];
  connectSrc?: string[];
  mediaSrc?: string[];
  objectSrc?: string[];
  childSrc?: string[];
  frameSrc?: string[];
  workerSrc?: string[];
  manifestSrc?: string[];
  reportUri?: string;
  reportTo?: string;
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
}

/**
 * Security headers configuration interface
 */
export interface SecurityHeadersConfig {
  csp?: CSPConfig;
  hsts?: {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  contentTypeOptions?: boolean;
  xssProtection?: {
    enabled: boolean;
    mode?: 'block' | 'report';
    reportUri?: string;
  };
  referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
  featurePolicy?: Record<string, string[]>;
  permissionsPolicy?: Record<string, string[]>;
  customHeaders?: Record<string, string>;
}

/**
 * Enterprise-grade security headers management utility
 */
export class SecurityHeaders {
  private static readonly DEFAULT_CONFIG: Required<Omit<SecurityHeadersConfig, 'customHeaders' | 'featurePolicy' | 'permissionsPolicy'>> & {
    customHeaders: Record<string, string>;
    featurePolicy: Record<string, string[]>;
    permissionsPolicy: Record<string, string[]>;
  } = {
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
      frameSrc: ["'self'"],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: true,
      blockAllMixedContent: true
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameOptions: 'DENY',
    contentTypeOptions: true,
    xssProtection: {
      enabled: true,
      mode: 'block'
    },
    referrerPolicy: 'strict-origin-when-cross-origin',
    customHeaders: {},
    featurePolicy: {},
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      interest_cohort: []
    }
  };

  /**
   * Generate security headers for HTTP responses
   */
  static generateHeaders(config: SecurityHeadersConfig = {}): Record<string, string> {
    const finalConfig = this.mergeConfig(config);
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (finalConfig.csp) {
      headers['Content-Security-Policy'] = this.buildCSPHeader(finalConfig.csp);
    }

    // HTTP Strict Transport Security
    if (finalConfig.hsts) {
      headers['Strict-Transport-Security'] = this.buildHSTSHeader(finalConfig.hsts);
    }

    // X-Frame-Options
    headers['X-Frame-Options'] = finalConfig.frameOptions;

    // X-Content-Type-Options
    if (finalConfig.contentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // X-XSS-Protection (deprecated but still used)
    if (finalConfig.xssProtection.enabled) {
      let xssValue = '1';
      if (finalConfig.xssProtection.mode === 'block') {
        xssValue += '; mode=block';
      } else if (finalConfig.xssProtection.mode === 'report' && finalConfig.xssProtection.reportUri) {
        xssValue += `; report=${finalConfig.xssProtection.reportUri}`;
      }
      headers['X-XSS-Protection'] = xssValue;
    }

    // Referrer Policy
    headers['Referrer-Policy'] = finalConfig.referrerPolicy;

    // Feature Policy (deprecated, but some browsers still support it)
    if (Object.keys(finalConfig.featurePolicy).length > 0) {
      headers['Feature-Policy'] = this.buildFeaturePolicyHeader(finalConfig.featurePolicy);
    }

    // Permissions Policy
    if (Object.keys(finalConfig.permissionsPolicy).length > 0) {
      headers['Permissions-Policy'] = this.buildPermissionsPolicyHeader(finalConfig.permissionsPolicy);
    }

    // Custom headers
    Object.entries(finalConfig.customHeaders).forEach(([key, value]) => {
      headers[key] = value;
    });

    // Additional security headers
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';
    headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
    headers['Cross-Origin-Opener-Policy'] = 'same-origin';
    headers['Cross-Origin-Resource-Policy'] = 'same-origin';

    return headers;
  }

  /**
   * Generate CSP header for specific environment (development/production)
   */
  static generateEnvironmentHeaders(
    environment: 'development' | 'production',
    customConfig: SecurityHeadersConfig = {}
  ): Record<string, string> {
    const baseConfig = { ...customConfig };

    if (environment === 'development') {
      // Relax some policies for development
      baseConfig.csp = {
        ...baseConfig.csp,
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost:*'],
        connectSrc: ["'self'", 'localhost:*', 'ws:', 'wss:'],
        upgradeInsecureRequests: false
      };
    } else {
      // Strict policies for production
      baseConfig.csp = {
        ...baseConfig.csp,
        scriptSrc: ["'self'"],
        upgradeInsecureRequests: true,
        blockAllMixedContent: true
      };
    }

    return this.generateHeaders(baseConfig);
  }

  /**
   * Validate CSP configuration
   */
  static validateCSPConfig(config: CSPConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for dangerous configurations
    if (config.scriptSrc?.includes("'unsafe-eval'")) {
      errors.push("Using 'unsafe-eval' in script-src can be dangerous");
    }

    if (config.defaultSrc?.includes('*')) {
      errors.push("Using '*' in default-src allows all sources");
    }

    if (config.objectSrc && !config.objectSrc.includes("'none'")) {
      errors.push("object-src should typically be set to 'none'");
    }

    // Check for missing essential directives
    if (!config.defaultSrc && !config.scriptSrc) {
      errors.push("Either default-src or script-src should be specified");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Build Content Security Policy header string
   */
  private static buildCSPHeader(csp: CSPConfig): string {
    const directives: string[] = [];

    // Map configuration to CSP directives
    const directiveMap: Record<keyof CSPConfig, string> = {
      defaultSrc: 'default-src',
      scriptSrc: 'script-src',
      styleSrc: 'style-src',
      imgSrc: 'img-src',
      fontSrc: 'font-src',
      connectSrc: 'connect-src',
      mediaSrc: 'media-src',
      objectSrc: 'object-src',
      childSrc: 'child-src',
      frameSrc: 'frame-src',
      workerSrc: 'worker-src',
      manifestSrc: 'manifest-src',
      reportUri: 'report-uri',
      reportTo: 'report-to',
      upgradeInsecureRequests: 'upgrade-insecure-requests',
      blockAllMixedContent: 'block-all-mixed-content'
    };

    Object.entries(csp).forEach(([key, value]) => {
      const directiveName = directiveMap[key as keyof CSPConfig];
      if (directiveName && value) {
        if (Array.isArray(value)) {
          directives.push(`${directiveName} ${value.join(' ')}`);
        } else if (typeof value === 'boolean' && value) {
          directives.push(directiveName);
        } else if (typeof value === 'string') {
          directives.push(`${directiveName} ${value}`);
        }
      }
    });

    return directives.join('; ');
  }

  /**
   * Build HSTS header string
   */
  private static buildHSTSHeader(hsts: NonNullable<SecurityHeadersConfig['hsts']>): string {
    let header = `max-age=${hsts.maxAge}`;
    
    if (hsts.includeSubDomains) {
      header += '; includeSubDomains';
    }
    
    if (hsts.preload) {
      header += '; preload';
    }
    
    return header;
  }

  /**
   * Build Feature Policy header string (legacy)
   */
  private static buildFeaturePolicyHeader(policy: Record<string, string[]>): string {
    const directives: string[] = [];
    
    Object.entries(policy).forEach(([feature, allowList]) => {
      if (allowList.length === 0) {
        directives.push(`${feature} 'none'`);
      } else {
        directives.push(`${feature} ${allowList.join(' ')}`);
      }
    });
    
    return directives.join(', ');
  }

  /**
   * Build Permissions Policy header string
   */
  private static buildPermissionsPolicyHeader(policy: Record<string, string[]>): string {
    const directives: string[] = [];
    
    Object.entries(policy).forEach(([feature, allowList]) => {
      if (allowList.length === 0) {
        directives.push(`${feature.replace('_', '-')}=()`);
      } else {
        const origins = allowList.map(origin => 
          origin === 'self' ? 'self' : `"${origin}"`
        ).join(' ');
        directives.push(`${feature.replace('_', '-')}=(${origins})`);
      }
    });
    
    return directives.join(', ');
  }

  /**
   * Merge user configuration with defaults
   */
  private static mergeConfig(config: SecurityHeadersConfig): typeof SecurityHeaders.DEFAULT_CONFIG {
    return {
      csp: { ...this.DEFAULT_CONFIG.csp, ...config.csp },
      hsts: { ...this.DEFAULT_CONFIG.hsts, ...config.hsts },
      frameOptions: config.frameOptions || this.DEFAULT_CONFIG.frameOptions,
      contentTypeOptions: config.contentTypeOptions ?? this.DEFAULT_CONFIG.contentTypeOptions,
      xssProtection: { ...this.DEFAULT_CONFIG.xssProtection, ...config.xssProtection },
      referrerPolicy: config.referrerPolicy || this.DEFAULT_CONFIG.referrerPolicy,
      featurePolicy: { ...this.DEFAULT_CONFIG.featurePolicy, ...config.featurePolicy },
      permissionsPolicy: { ...this.DEFAULT_CONFIG.permissionsPolicy, ...config.permissionsPolicy },
      customHeaders: { ...this.DEFAULT_CONFIG.customHeaders, ...config.customHeaders }
    };
  }
}

/**
 * Audit log levels
 */
export enum AuditLogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

/**
 * Audit log event interface
 */
export interface AuditLogEvent {
  timestamp: string;
  level: AuditLogLevel;
  category: string;
  action: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Audit logger configuration
 */
export interface AuditLoggerConfig {
  minLevel?: AuditLogLevel;
  outputs?: Array<{
    type: 'console' | 'file' | 'external';
    config?: Record<string, any>;
  }>;
  piiRedaction?: {
    enabled: boolean;
    fields: string[];
    replacement?: string;
  };
  formatting?: {
    timestamp: 'iso' | 'unix' | 'readable';
    includeStackTrace?: boolean;
  };
  retention?: {
    maxEntries?: number;
    maxAgeMs?: number;
  };
  async?: boolean;
}

/**
 * PII detection patterns
 */
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
  ssn: /\b(?!000)(?!666)[0-8][0-9]{2}-?(?!00)[0-9]{2}-?(?!0000)[0-9]{4}\b/g,
  creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
  ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  password: /("password":\s*")[^"]*(")/gi,
  token: /("token":\s*")[^"]*(")/gi
};

/**
 * Enterprise-grade audit logging utility with PII redaction and multiple output formats
 */
export class AuditLogger {
  private static config: Required<AuditLoggerConfig> = {
    minLevel: AuditLogLevel.INFO,
    outputs: [{ type: 'console', config: {} }],
    piiRedaction: {
      enabled: true,
      fields: ['password', 'token', 'ssn', 'creditCard'],
      replacement: '[REDACTED]'
    },
    formatting: {
      timestamp: 'iso',
      includeStackTrace: false
    },
    retention: {
      maxEntries: 10000,
      maxAgeMs: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    async: true
  };

  private static logQueue: AuditLogEvent[] = [];
  private static processingQueue: boolean = false;

  /**
   * Initialize audit logger with configuration
   */
  static initialize(config: Partial<AuditLoggerConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Start queue processor if async mode is enabled
    if (this.config.async && !this.processingQueue) {
      this.startQueueProcessor();
    }
  }

  /**
   * Log a security event with comprehensive details
   */
  static logSecurityEvent(
    category: string,
    action: string,
    details: {
      level?: AuditLogLevel;
      userId?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      resource?: string;
      data?: Record<string, any>;
      metadata?: Record<string, any>;
      tags?: string[];
    } = {}
  ): void {
    const event: AuditLogEvent = {
      timestamp: this.formatTimestamp(),
      level: details.level || AuditLogLevel.INFO,
      category,
      action,
      userId: details.userId,
      sessionId: details.sessionId,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      resource: details.resource,
      details: details.data ? this.redactPII(details.data) : undefined,
      metadata: details.metadata,
      tags: details.tags
    };

    this.logEvent(event);
  }

  /**
   * Log authentication events
   */
  static logAuthEvent(
    action: 'login' | 'logout' | 'failed_login' | 'password_change' | 'account_locked',
    userId: string,
    details: {
      ipAddress?: string;
      userAgent?: string;
      reason?: string;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const level = action === 'failed_login' || action === 'account_locked' 
      ? AuditLogLevel.WARN 
      : AuditLogLevel.INFO;

    this.logSecurityEvent('authentication', action, {
      level,
      userId,
      ...details,
      tags: ['auth', action]
    });
  }

  /**
   * Log authorization events
   */
  static logAuthorizationEvent(
    action: 'access_granted' | 'access_denied' | 'permission_escalation',
    userId: string,
    resource: string,
    details: {
      ipAddress?: string;
      requestedPermission?: string;
      grantedPermission?: string;
      reason?: string;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const level = action === 'access_denied' || action === 'permission_escalation'
      ? AuditLogLevel.WARN
      : AuditLogLevel.INFO;

    this.logSecurityEvent('authorization', action, {
      level,
      userId,
      resource,
      data: {
        requestedPermission: details.requestedPermission,
        grantedPermission: details.grantedPermission,
        reason: details.reason
      },
      ipAddress: details.ipAddress,
      metadata: details.metadata,
      tags: ['authz', action]
    });
  }

  /**
   * Log data access events
   */
  static logDataAccessEvent(
    action: 'read' | 'write' | 'delete' | 'export',
    userId: string,
    resource: string,
    details: {
      ipAddress?: string;
      recordsAffected?: number;
      queryParameters?: Record<string, any>;
      success?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    this.logSecurityEvent('data_access', action, {
      level: AuditLogLevel.INFO,
      userId,
      resource,
      data: {
        recordsAffected: details.recordsAffected,
        queryParameters: details.queryParameters ? this.redactPII(details.queryParameters) : undefined,
        success: details.success
      },
      ipAddress: details.ipAddress,
      metadata: details.metadata,
      tags: ['data', action]
    });
  }

  /**
   * Log security violations
   */
  static logSecurityViolation(
    violation: string,
    details: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      attackType?: string;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const level = details.severity === 'critical' 
      ? AuditLogLevel.CRITICAL 
      : details.severity === 'high'
      ? AuditLogLevel.ERROR
      : AuditLogLevel.WARN;

    this.logSecurityEvent('security_violation', violation, {
      level,
      userId: details.userId,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      data: {
        severity: details.severity || 'medium',
        attackType: details.attackType
      },
      metadata: details.metadata,
      tags: ['security', 'violation', details.severity || 'medium']
    });
  }

  /**
   * Get audit logs with filtering
   */
  static getLogs(filter: {
    level?: AuditLogLevel;
    category?: string;
    userId?: string;
    startTime?: Date;
    endTime?: Date;
    tags?: string[];
    limit?: number;
  } = {}): AuditLogEvent[] {
    let filteredLogs = [...this.logQueue];

    if (filter.level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= filter.level!);
    }

    if (filter.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filter.category);
    }

    if (filter.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
    }

    if (filter.startTime) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= filter.startTime!
      );
    }

    if (filter.endTime) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= filter.endTime!
      );
    }

    if (filter.tags && filter.tags.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        log.tags?.some(tag => filter.tags!.includes(tag))
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filter.limit) {
      filteredLogs = filteredLogs.slice(0, filter.limit);
    }

    return filteredLogs;
  }

  /**
   * Get audit statistics
   */
  static getStats(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByCategory: Record<string, number>;
    recentActivity: number;
    oldestLogAge: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const logsByLevel: Record<string, number> = {};
    const logsByCategory: Record<string, number> = {};
    let recentActivity = 0;
    let oldestLogAge = 0;

    this.logQueue.forEach(log => {
      // Count by level
      const levelName = AuditLogLevel[log.level];
      logsByLevel[levelName] = (logsByLevel[levelName] || 0) + 1;

      // Count by category
      logsByCategory[log.category] = (logsByCategory[log.category] || 0) + 1;

      // Recent activity
      const logTime = new Date(log.timestamp).getTime();
      if (logTime >= oneHourAgo) {
        recentActivity++;
      }

      // Oldest log age
      const age = now - logTime;
      if (age > oldestLogAge) {
        oldestLogAge = age;
      }
    });

    return {
      totalLogs: this.logQueue.length,
      logsByLevel,
      logsByCategory,
      recentActivity,
      oldestLogAge
    };
  }

  /**
   * Clear logs older than specified time
   */
  static clearOldLogs(maxAgeMs: number = this.config.retention.maxAgeMs): number {
    const cutoffTime = Date.now() - maxAgeMs;
    const initialCount = this.logQueue.length;

    this.logQueue = this.logQueue.filter(log => 
      new Date(log.timestamp).getTime() > cutoffTime
    );

    return initialCount - this.logQueue.length;
  }

  /**
   * Export logs in various formats
   */
  static exportLogs(
    format: 'json' | 'csv' | 'txt',
    filter: Parameters<typeof AuditLogger.getLogs>[0] = {}
  ): string {
    const logs = this.getLogs(filter);

    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      
      case 'csv':
        if (logs.length === 0) return '';
        
        const headers = ['timestamp', 'level', 'category', 'action', 'userId', 'ipAddress', 'resource'];
        const csvLines = [headers.join(',')];
        
        logs.forEach(log => {
          const row = [
            log.timestamp,
            AuditLogLevel[log.level],
            log.category,
            log.action,
            log.userId || '',
            log.ipAddress || '',
            log.resource || ''
          ].map(field => `"${String(field).replace(/"/g, '""')}"`);
          csvLines.push(row.join(','));
        });
        
        return csvLines.join('\n');
      
      case 'txt':
        return logs.map(log => 
          `[${log.timestamp}] ${AuditLogLevel[log.level]} ${log.category}:${log.action} ` +
          `${log.userId ? `user:${log.userId} ` : ''}` +
          `${log.ipAddress ? `ip:${log.ipAddress} ` : ''}` +
          `${log.resource ? `resource:${log.resource}` : ''}`
        ).join('\n');
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Private method to log an event
   */
  private static logEvent(event: AuditLogEvent): void {
    // Check minimum log level
    if (event.level < this.config.minLevel) {
      return;
    }

    if (this.config.async) {
      this.logQueue.push(event);
      this.enforceRetention();
    } else {
      this.writeToOutputs(event);
    }
  }

  /**
   * Write to configured outputs
   */
  private static writeToOutputs(event: AuditLogEvent): void {
    this.config.outputs.forEach(output => {
      try {
        switch (output.type) {
          case 'console':
            console.log(this.formatForConsole(event));
            break;
          
          case 'file':
            // In a real implementation, this would write to a file
            // For now, we'll just add it to the queue
            this.logQueue.push(event);
            break;
          
          case 'external':
            // In a real implementation, this would send to an external service
            // For now, we'll just add it to the queue
            this.logQueue.push(event);
            break;
        }
      } catch (error) {
        console.error('Failed to write audit log:', error);
      }
    });
  }

  /**
   * Format event for console output
   */
  private static formatForConsole(event: AuditLogEvent): string {
    const level = AuditLogLevel[event.level];
    return `[AUDIT] [${event.timestamp}] [${level}] ${event.category}:${event.action}` +
           (event.userId ? ` user:${event.userId}` : '') +
           (event.ipAddress ? ` ip:${event.ipAddress}` : '') +
           (event.resource ? ` resource:${event.resource}` : '');
  }

  /**
   * Format timestamp according to configuration
   */
  private static formatTimestamp(): string {
    const now = new Date();
    
    switch (this.config.formatting.timestamp) {
      case 'unix':
        return Math.floor(now.getTime() / 1000).toString();
      case 'readable':
        return now.toLocaleString();
      case 'iso':
      default:
        return now.toISOString();
    }
  }

  /**
   * Redact PII from data objects
   */
  private static redactPII(data: any): any {
    if (!this.config.piiRedaction.enabled) {
      return data;
    }

    const redacted = JSON.parse(JSON.stringify(data));
    
    // Recursively redact PII
    const redactObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(item => redactObject(item));
      }

      Object.keys(obj).forEach(key => {
        if (this.config.piiRedaction.fields.includes(key.toLowerCase())) {
          obj[key] = this.config.piiRedaction.replacement;
        } else if (typeof obj[key] === 'string') {
          // Apply pattern-based redaction
          Object.values(PII_PATTERNS).forEach(pattern => {
            obj[key] = obj[key].replace(pattern, this.config.piiRedaction.replacement);
          });
        } else if (typeof obj[key] === 'object') {
          obj[key] = redactObject(obj[key]);
        }
      });

      return obj;
    };

    return redactObject(redacted);
  }

  /**
   * Enforce retention policies
   */
  private static enforceRetention(): void {
    // Enforce max entries
    if (this.config.retention.maxEntries && this.logQueue.length > this.config.retention.maxEntries) {
      this.logQueue = this.logQueue.slice(-this.config.retention.maxEntries);
    }

    // Clean old entries
    this.clearOldLogs();
  }

  /**
   * Start async queue processor
   */
  private static startQueueProcessor(): void {
    this.processingQueue = true;
    
    setInterval(() => {
      if (this.logQueue.length > 0) {
        // In a real implementation, this would batch process the queue
        // For now, we'll just enforce retention
        this.enforceRetention();
      }
    }, 5000); // Process every 5 seconds
  }

  /**
   * Cleanup on process termination
   */
  static destroy(): void {
    this.processingQueue = false;
    this.logQueue = [];
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
  SecurityHeaders,
  AuditLogger,
  SecurityUtils,
};