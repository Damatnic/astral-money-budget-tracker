/**
 * Enterprise Security Middleware
 * Comprehensive security layer for production API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { RateLimiter, CSRFProtection, SecurityHeaders, AuditLogger } from '@/utils/security';

// Security configuration
const SECURITY_CONFIG = {
  RATE_LIMIT: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  CSRF: {
    enabled: true,
    cookieName: '_csrf',
    headerName: 'x-csrf-token',
    excludePaths: ['/api/auth/', '/api/health'],
  },
  AUDIT: {
    enabled: process.env.ENABLE_AUDIT_LOGGING === 'true',
    sensitiveFields: ['pin', 'password', 'token', 'secret'],
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};

/**
 * Main security middleware function
 */
export async function securityMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const startTime = Date.now();
  const clientIp = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const url = new URL(request.url);
  
  try {
    // 1. Apply security headers
    addSecurityHeaders(response);
    
    // 2. Rate limiting check
    const rateLimitResult = await checkRateLimit(request, clientIp);
    if (!rateLimitResult.allowed) {
      await auditLog('RATE_LIMIT_EXCEEDED', request, {
        ip: clientIp,
        limit: SECURITY_CONFIG.RATE_LIMIT.max,
        window: SECURITY_CONFIG.RATE_LIMIT.windowMs,
      });
      
      return new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(SECURITY_CONFIG.RATE_LIMIT.windowMs / 1000).toString(),
        },
      });
    }
    
    // 3. CSRF protection for state-changing operations
    if (needsCSRFProtection(request)) {
      const csrfResult = await validateCSRF(request);
      if (!csrfResult.valid) {
        await auditLog('CSRF_VALIDATION_FAILED', request, {
          ip: clientIp,
          reason: csrfResult.reason,
        });
        
        return new NextResponse('CSRF validation failed', { status: 403 });
      }
    }
    
    // 4. Input validation and sanitization (for API routes)
    if (url.pathname.startsWith('/api/') && hasBody(request)) {
      const validationResult = await validateRequestBody(request);
      if (!validationResult.valid) {
        await auditLog('INPUT_VALIDATION_FAILED', request, {
          ip: clientIp,
          errors: validationResult.errors,
        });
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'Invalid input', 
            details: validationResult.errors 
          }), 
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    // 5. Authentication check for protected routes
    if (requiresAuth(url.pathname)) {
      const authResult = await validateAuthentication(request);
      if (!authResult.valid) {
        await auditLog('UNAUTHORIZED_ACCESS_ATTEMPT', request, {
          ip: clientIp,
          path: url.pathname,
          reason: authResult.reason,
        });
        
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }
    
    // 6. Audit logging for sensitive operations
    if (isSensitiveOperation(request)) {
      await auditLog('SENSITIVE_OPERATION', request, {
        ip: clientIp,
        userAgent,
        duration: Date.now() - startTime,
      });
    }
    
    // Add security metadata to response
    response.headers.set('X-Security-Check', 'passed');
    response.headers.set('X-Request-ID', generateRequestId());
    
    return response;
    
  } catch (error) {
    console.error('Security middleware error:', error);
    
    await auditLog('SECURITY_MIDDLEWARE_ERROR', request, {
      ip: clientIp,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return new NextResponse('Security check failed', { status: 500 });
  }
}

/**
 * Extract client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  return 'unknown';
}

/**
 * Apply security headers to response
 */
function addSecurityHeaders(response: NextResponse): void {
  // HSTS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Content Security Policy
  const csp = process.env.CONTENT_SECURITY_POLICY || 
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";
  response.headers.set('Content-Security-Policy', csp);
  
  // Other security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

/**
 * Check rate limiting
 */
async function checkRateLimit(request: NextRequest, clientIp: string): Promise<{ allowed: boolean; remaining?: number }> {
  // Implementation depends on your rate limiting strategy
  // This is a simplified version - in production, use Redis or similar
  const key = `rate_limit:${clientIp}`;
  
  try {
    const rateLimiter = new RateLimiter({
      windowMs: SECURITY_CONFIG.RATE_LIMIT.windowMs,
      max: SECURITY_CONFIG.RATE_LIMIT.max,
    });
    
    return await rateLimiter.isAllowed(key);
  } catch (error) {
    // Fail open for availability, but log the issue
    console.error('Rate limiting error:', error);
    return { allowed: true };
  }
}

/**
 * Check if request needs CSRF protection
 */
function needsCSRFProtection(request: NextRequest): boolean {
  const method = request.method;
  const url = new URL(request.url);
  
  // Only check CSRF for state-changing operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return false;
  }
  
  // Skip CSRF for excluded paths
  for (const excludePath of SECURITY_CONFIG.CSRF.excludePaths) {
    if (url.pathname.startsWith(excludePath)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validate CSRF token
 */
async function validateCSRF(request: NextRequest): Promise<{ valid: boolean; reason?: string }> {
  try {
    const token = request.headers.get(SECURITY_CONFIG.CSRF.headerName);
    
    if (!token) {
      return { valid: false, reason: 'Missing CSRF token' };
    }
    
    const csrfProtection = new CSRFProtection();
    const isValid = await csrfProtection.validateToken(token);
    
    return { 
      valid: isValid, 
      reason: isValid ? undefined : 'Invalid CSRF token' 
    };
    
  } catch (error) {
    return { valid: false, reason: 'CSRF validation error' };
  }
}

/**
 * Check if request has body
 */
function hasBody(request: NextRequest): boolean {
  return ['POST', 'PUT', 'PATCH'].includes(request.method);
}

/**
 * Validate request body
 */
async function validateRequestBody(request: NextRequest): Promise<{ valid: boolean; errors?: string[] }> {
  try {
    // Clone request to avoid consuming the body
    const body = await request.clone().json();
    
    // Basic validation - extend based on your needs
    const errors: string[] = [];
    
    // Check for XSS attempts
    const xssCheck = checkForXSS(body);
    if (xssCheck.detected) {
      errors.push(...xssCheck.messages);
    }
    
    // Check for SQL injection attempts
    const sqlCheck = checkForSQLInjection(body);
    if (sqlCheck.detected) {
      errors.push(...sqlCheck.messages);
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    return { valid: false, errors: ['Invalid JSON body'] };
  }
}

/**
 * Check for XSS attempts in request body
 */
function checkForXSS(data: any): { detected: boolean; messages: string[] } {
  const messages: string[] = [];
  
  const checkValue = (value: any, path: string = ''): void => {
    if (typeof value === 'string') {
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
      ];
      
      for (const pattern of xssPatterns) {
        if (pattern.test(value)) {
          messages.push(`Potential XSS detected in ${path || 'request'}`);
          break;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        checkValue(val, path ? `${path}.${key}` : key);
      }
    }
  };
  
  checkValue(data);
  
  return {
    detected: messages.length > 0,
    messages
  };
}

/**
 * Check for SQL injection attempts
 */
function checkForSQLInjection(data: any): { detected: boolean; messages: string[] } {
  const messages: string[] = [];
  
  const sqlInjectionPatterns = [
    /(\b(select|union|insert|update|delete|drop|create|alter)\b)/gi,
    /(--|#|\/\*|\*\/)/g,
    /(\bor\b|\band\b).*(\b=\b|\blike\b)/gi,
  ];
  
  const checkValue = (value: any, path: string = ''): void => {
    if (typeof value === 'string') {
      for (const pattern of sqlInjectionPatterns) {
        if (pattern.test(value)) {
          messages.push(`Potential SQL injection detected in ${path || 'request'}`);
          break;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        checkValue(val, path ? `${path}.${key}` : key);
      }
    }
  };
  
  checkValue(data);
  
  return {
    detected: messages.length > 0,
    messages
  };
}

/**
 * Check if route requires authentication
 */
function requiresAuth(pathname: string): boolean {
  const protectedRoutes = [
    '/api/user/',
    '/api/expenses',
    '/api/income',
    '/api/recurring',
  ];
  
  const publicRoutes = [
    '/api/auth/',
    '/api/health',
  ];
  
  // Check if it's a public route first
  for (const route of publicRoutes) {
    if (pathname.startsWith(route)) {
      return false;
    }
  }
  
  // Check if it's a protected route
  for (const route of protectedRoutes) {
    if (pathname.startsWith(route)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate authentication
 */
async function validateAuthentication(request: NextRequest): Promise<{ valid: boolean; reason?: string }> {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token) {
      return { valid: false, reason: 'No valid session token' };
    }
    
    // Check token expiration
    if (token.exp && token.exp < Date.now() / 1000) {
      return { valid: false, reason: 'Session expired' };
    }
    
    return { valid: true };
    
  } catch (error) {
    return { valid: false, reason: 'Authentication validation error' };
  }
}

/**
 * Check if operation is sensitive and requires audit logging
 */
function isSensitiveOperation(request: NextRequest): boolean {
  const url = new URL(request.url);
  const sensitiveOperations = [
    '/api/user/balance',
    '/api/expenses',
    '/api/income',
    '/api/recurring',
  ];
  
  return sensitiveOperations.some(op => url.pathname.startsWith(op)) &&
         ['POST', 'PUT', 'DELETE'].includes(request.method);
}

/**
 * Audit logging function
 */
async function auditLog(event: string, request: NextRequest, metadata: any = {}): Promise<void> {
  if (!SECURITY_CONFIG.AUDIT.enabled) {
    return;
  }
  
  try {
    const auditLogger = new AuditLogger();
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      ...metadata,
    };
    
    // Filter sensitive data
    const sanitizedEntry = sanitizeAuditData(logEntry);
    
    await auditLogger.log(sanitizedEntry);
    
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

/**
 * Sanitize audit data to remove sensitive information
 */
function sanitizeAuditData(data: any): any {
  const sanitized = { ...data };
  
  for (const field of SECURITY_CONFIG.AUDIT.sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}