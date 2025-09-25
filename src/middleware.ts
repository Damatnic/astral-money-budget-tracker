/**
 * Next.js Middleware - Enterprise Security Layer
 * Applies comprehensive security checks to all requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Configuration
const CONFIG = {
  // Rate limiting configuration
  RATE_LIMIT: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: {
      api: 100,        // API routes
      auth: 10,        // Auth routes (stricter)
      public: 200,     // Public routes
    },
  },
  
  // Security headers
  SECURITY_HEADERS: {
    'X-DNS-Prefetch-Control': 'off',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  },
  
  // CSP configuration
  CSP: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https:', 'data:'],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  },
  
  // Protected routes requiring authentication
  PROTECTED_ROUTES: [
    '/api/user',
    '/api/expenses',
    '/api/income',
    '/api/recurring',
    '/api/bills',
    '/dashboard',
  ],
  
  // Public routes (no auth required)
  PUBLIC_ROUTES: [
    '/api/auth',
    '/api/health',
    '/auth/signin',
    '/auth/signup',
    '/',
  ],
  
  // API routes requiring stricter validation
  STRICT_API_ROUTES: [
    '/api/user/balance',
    '/api/expenses',
    '/api/income',
  ],
};

// Rate limit storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    // 1. Apply security headers
    applySecurityHeaders(response);
    
    // 2. Apply CSP
    applyCSP(response);
    
    // 3. Check rate limiting
    const rateLimitCheck = await checkRateLimit(request);
    if (!rateLimitCheck.allowed) {
      return createRateLimitResponse(rateLimitCheck.retryAfter);
    }
    
    // 4. Authentication check for protected routes
    if (isProtectedRoute(path)) {
      const authCheck = await checkAuthentication(request);
      if (!authCheck.authenticated) {
        return createAuthRequiredResponse(path);
      }
      
      // Add user context to headers for API routes
      if (path.startsWith('/api/')) {
        response.headers.set('X-User-Id', authCheck.userId || '');
        response.headers.set('X-User-Email', authCheck.userEmail || '');
      }
    }
    
    // 5. Handle authenticated users accessing auth pages
    const authCheck = await checkAuthentication(request);
    if (authCheck.authenticated && path.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // 6. CORS handling for API routes
    if (path.startsWith('/api/')) {
      applyCORS(request, response);
    }
    
    // 7. Request ID generation for tracking
    const requestId = generateRequestId();
    response.headers.set('X-Request-Id', requestId);
    
    // 8. Security logging
    if (shouldLogRequest(path)) {
      logSecurityEvent(request, requestId);
    }
    
    // 9. Add security metadata
    response.headers.set('X-Security-Version', '1.0.0');
    response.headers.set('X-Protected', isProtectedRoute(path) ? 'true' : 'false');
    
    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    return createErrorResponse();
  }
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse): void {
  Object.entries(CONFIG.SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

/**
 * Apply Content Security Policy
 */
function applyCSP(response: NextResponse): void {
  const cspDirectives = Object.entries(CONFIG.CSP)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
  
  response.headers.set('Content-Security-Policy', cspDirectives);
}

/**
 * Check rate limiting
 */
async function checkRateLimit(request: NextRequest): Promise<{ allowed: boolean; retryAfter?: number }> {
  if (!CONFIG.RATE_LIMIT.enabled) {
    return { allowed: true };
  }
  
  const clientId = getClientIdentifier(request);
  const path = new URL(request.url).pathname;
  const limit = getRateLimitForPath(path);
  const now = Date.now();
  
  // Clean old entries
  cleanRateLimitStore(now);
  
  const key = `${clientId}:${path}`;
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + CONFIG.RATE_LIMIT.windowMs,
    });
    return { allowed: true };
  }
  
  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return { allowed: true };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp;
  if (cfConnectingIp) return cfConnectingIp;
  
  // Fallback to a hash of headers for development
  const userAgent = request.headers.get('user-agent') || '';
  return Buffer.from(userAgent).toString('base64').substring(0, 16);
}

/**
 * Get rate limit for path
 */
function getRateLimitForPath(path: string): number {
  if (path.startsWith('/api/auth')) return CONFIG.RATE_LIMIT.maxRequests.auth;
  if (path.startsWith('/api/')) return CONFIG.RATE_LIMIT.maxRequests.api;
  return CONFIG.RATE_LIMIT.maxRequests.public;
}

/**
 * Clean old rate limit entries
 */
function cleanRateLimitStore(now: number): void {
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
  
  // Prevent memory leak - keep max 10000 entries
  if (rateLimitStore.size > 10000) {
    const entriesToDelete = rateLimitStore.size - 9000;
    const keys = Array.from(rateLimitStore.keys());
    for (let i = 0; i < entriesToDelete; i++) {
      rateLimitStore.delete(keys[i]);
    }
  }
}

/**
 * Check if route is protected
 */
function isProtectedRoute(path: string): boolean {
  // Check public routes first
  for (const publicRoute of CONFIG.PUBLIC_ROUTES) {
    if (path.startsWith(publicRoute)) {
      return false;
    }
  }
  
  // Check protected routes
  for (const protectedRoute of CONFIG.PROTECTED_ROUTES) {
    if (path.startsWith(protectedRoute)) {
      return true;
    }
  }
  
  // API routes are protected by default
  if (path.startsWith('/api/')) {
    return !CONFIG.PUBLIC_ROUTES.some(route => path.startsWith(route));
  }
  
  return false;
}

/**
 * Check authentication
 */
async function checkAuthentication(request: NextRequest): Promise<{
  authenticated: boolean;
  userId?: string;
  userEmail?: string;
}> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token) {
      return { authenticated: false };
    }
    
    // Check token expiration
    if (token.exp && typeof token.exp === 'number' && token.exp < Date.now() / 1000) {
      return { authenticated: false };
    }
    
    return {
      authenticated: true,
      userId: token.id as string,
      userEmail: token.email as string,
    };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authenticated: false };
  }
}

/**
 * Apply CORS headers
 */
function applyCORS(request: NextRequest, response: NextResponse): void {
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  if (request.method === 'OPTIONS') {
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${randomStr}`;
}

/**
 * Check if request should be logged
 */
function shouldLogRequest(path: string): boolean {
  // Log all API requests
  if (path.startsWith('/api/')) return true;
  
  // Log authentication attempts
  if (path.startsWith('/auth/')) return true;
  
  // Log protected routes
  return isProtectedRoute(path);
}

/**
 * Log security event
 */
function logSecurityEvent(request: NextRequest, requestId: string): void {
  const url = new URL(request.url);
  const clientId = getClientIdentifier(request);
  
  // In production, this would go to a proper logging service
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    requestId,
    method: request.method,
    path: url.pathname,
    clientId,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    protected: isProtectedRoute(url.pathname),
  }));
}

/**
 * Create rate limit exceeded response
 */
function createRateLimitResponse(retryAfter?: number): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: retryAfter || 60,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter || 60),
      },
    }
  );
}

/**
 * Create authentication required response
 */
function createAuthRequiredResponse(path: string): NextResponse {
  // For API routes, return JSON error
  if (path.startsWith('/api/')) {
    return new NextResponse(
      JSON.stringify({
        error: 'Authentication required',
        message: 'Please sign in to access this resource.',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Bearer',
        },
      }
    );
  }
  
  // For web routes, redirect to sign in
  const url = new URL('/auth/signin', process.env.NEXTAUTH_URL || 'http://localhost:3000');
  url.searchParams.set('callbackUrl', path);
  return NextResponse.redirect(url);
}

/**
 * Create error response
 */
function createErrorResponse(): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Internal server error',
      message: 'An error occurred processing your request.',
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};