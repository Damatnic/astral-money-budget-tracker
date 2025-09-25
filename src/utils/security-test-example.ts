/**
 * Example usage of the enhanced security utilities
 * This file demonstrates how to use the new enterprise-grade security classes
 */

import { 
  RateLimiter, 
  CSRFProtection, 
  SecurityHeaders, 
  AuditLogger, 
  AuditLogLevel 
} from './security';

// Example: Rate Limiter Usage
export function exampleRateLimiter() {
  console.log('=== Rate Limiter Example ===');
  
  // Initialize rate limiter with cleanup
  RateLimiter.initialize(60000); // 1 minute cleanup interval
  
  // Check rate limit for user
  const userId = 'user123';
  const result = RateLimiter.checkRateLimit(userId, {
    maxRequests: 10,
    windowMs: 60000, // 1 minute window
    keyPrefix: 'api'
  });
  
  console.log('Rate limit result:', result);
  
  // Record request success/failure
  RateLimiter.recordRequestResult(userId, true, { keyPrefix: 'api' });
  
  // Get statistics
  console.log('Rate limiter stats:', RateLimiter.getStats());
}

// Example: CSRF Protection Usage
export function exampleCSRFProtection() {
  console.log('=== CSRF Protection Example ===');
  
  // Initialize CSRF protection
  CSRFProtection.initialize({
    tokenLength: 32,
    expiryMs: 3600000, // 1 hour
    rotationIntervalMs: 1800000 // 30 minutes
  });
  
  // Generate token
  const sessionId = 'session123';
  const { token, expires, cookieOptions } = CSRFProtection.generateToken(sessionId);
  
  console.log('Generated CSRF token:', { token, expires, cookieOptions });
  
  // Validate token
  const validation = CSRFProtection.validateToken(sessionId, token);
  console.log('Token validation:', validation);
  
  // Get token info
  console.log('Token info:', CSRFProtection.getTokenInfo(sessionId));
  
  // Get statistics
  console.log('CSRF stats:', CSRFProtection.getStats());
}

// Example: Security Headers Usage
export function exampleSecurityHeaders() {
  console.log('=== Security Headers Example ===');
  
  // Generate headers for production
  const productionHeaders = SecurityHeaders.generateEnvironmentHeaders('production', {
    csp: {
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:']
    },
    customHeaders: {
      'X-Custom-Security': 'enabled'
    }
  });
  
  console.log('Production headers:', productionHeaders);
  
  // Generate headers for development
  const devHeaders = SecurityHeaders.generateEnvironmentHeaders('development');
  console.log('Development headers:', devHeaders);
  
  // Validate CSP configuration
  const cspValidation = SecurityHeaders.validateCSPConfig({
    scriptSrc: ["'self'", "'unsafe-eval'"], // This will trigger a warning
    defaultSrc: ["'self'"]
  });
  
  console.log('CSP validation:', cspValidation);
}

// Example: Audit Logger Usage
export function exampleAuditLogger() {
  console.log('=== Audit Logger Example ===');
  
  // Initialize audit logger
  AuditLogger.initialize({
    minLevel: AuditLogLevel.INFO,
    piiRedaction: {
      enabled: true,
      fields: ['password', 'ssn', 'creditCard'],
      replacement: '[REDACTED]'
    },
    retention: {
      maxEntries: 1000,
      maxAgeMs: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  });
  
  // Log authentication events
  AuditLogger.logAuthEvent('login', 'user123', {
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...'
  });
  
  AuditLogger.logAuthEvent('failed_login', 'user456', {
    ipAddress: '192.168.1.101',
    reason: 'Invalid password'
  });
  
  // Log authorization events
  AuditLogger.logAuthorizationEvent('access_denied', 'user789', '/admin/users', {
    ipAddress: '192.168.1.102',
    requestedPermission: 'admin',
    reason: 'Insufficient privileges'
  });
  
  // Log data access
  AuditLogger.logDataAccessEvent('read', 'user123', '/api/transactions', {
    recordsAffected: 25,
    success: true
  });
  
  // Log security violation
  AuditLogger.logSecurityViolation('rate_limit_exceeded', {
    userId: 'user999',
    ipAddress: '192.168.1.103',
    severity: 'high',
    attackType: 'brute_force'
  });
  
  // Get recent logs
  const recentLogs = AuditLogger.getLogs({
    level: AuditLogLevel.WARN,
    limit: 10
  });
  
  console.log('Recent warning logs:', recentLogs);
  
  // Get statistics
  console.log('Audit logger stats:', AuditLogger.getStats());
  
  // Export logs as JSON
  const jsonExport = AuditLogger.exportLogs('json', { limit: 5 });
  console.log('JSON export sample:', jsonExport.substring(0, 200) + '...');
}

// Example: Complete Security Setup
export function exampleCompleteSecuritySetup() {
  console.log('=== Complete Security Setup Example ===');
  
  // Initialize all security components
  RateLimiter.initialize();
  CSRFProtection.initialize();
  AuditLogger.initialize({ environment: 'test' });
  
  // Simulate a secure request handling
  const handleSecureRequest = (req: any, res: any) => {
    const userId = req.user?.id;
    const sessionId = req.sessionID;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    // 1. Check rate limit
    const rateLimitResult = RateLimiter.checkRateLimit(userId || ipAddress, {
      maxRequests: 100,
      windowMs: 60000
    });
    
    if (!rateLimitResult.allowed) {
      // Log security violation
      AuditLogger.logSecurityViolation('rate_limit_exceeded', {
        userId,
        ipAddress,
        severity: 'medium'
      });
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfterMs
      });
    }
    
    // 2. Validate CSRF token (for state-changing operations)
    if (req.method !== 'GET') {
      const csrfToken = req.headers['x-csrf-token'];
      const csrfValidation = CSRFProtection.validateToken(sessionId, csrfToken);
      
      if (!csrfValidation.valid) {
        // Log security violation
        AuditLogger.logSecurityViolation('csrf_token_invalid', {
          userId,
          ipAddress,
          userAgent,
          severity: 'high'
        });
        
        return res.status(403).json({ error: 'CSRF token validation failed' });
      }
    }
    
    // 3. Set security headers
    const securityHeaders = SecurityHeaders.generateEnvironmentHeaders('production');
    Object.entries(securityHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // 4. Log successful access
    AuditLogger.logDataAccessEvent('read', userId, req.path, {
      ipAddress,
      success: true
    });
    
    // Record successful rate limit usage
    RateLimiter.recordRequestResult(userId || ipAddress, true);
    
    return res.json({ success: true, data: 'Secure response' });
  };
  
  console.log('Secure request handler created');
  
  // Simulate cleanup on application shutdown
  const cleanupSecurity = () => {
    RateLimiter.destroy();
    CSRFProtection.destroy();
    AuditLogger.destroy();
    console.log('Security utilities cleaned up');
  };
  
  console.log('Security setup complete');
  
  return { handleSecureRequest, cleanupSecurity };
}