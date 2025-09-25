/**
 * Comprehensive Security Utility Tests
 * Tests for advanced security features and input validation
 */

import {
  InputSanitizer,
  SecurityUtils,
  CSRFProtection,
  RateLimiter,
  AuditLogger
} from '../security';

describe('InputSanitizer', () => {
  describe('sanitizeString', () => {
    it('should sanitize basic strings', () => {
      const result = InputSanitizer.sanitizeString('hello world');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('hello world');
      expect(result.securityScore).toBe(100);
    });

    it('should remove XSS patterns', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const result = InputSanitizer.sanitizeString(maliciousInput, { stripXss: true });
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).not.toContain('<script>');
      expect(result.securityScore).toBeLessThan(100);
      expect(result.errors).toContain('Potentially dangerous content was removed');
    });

    it('should handle required field validation', () => {
      const result = InputSanitizer.sanitizeString('', { required: true });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('This field is required');
      expect(result.securityScore).toBe(0);
    });

    it('should enforce length limits', () => {
      const longString = 'a'.repeat(1001);
      const result = InputSanitizer.sanitizeString(longString, { maxLength: 100 });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('maximum length'))).toBe(true);
      expect(result.sanitizedValue?.length).toBe(100);
      expect(result.securityScore).toBeLessThan(100);
    });

    it('should validate patterns', () => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const result = InputSanitizer.sanitizeString('invalid-email', { pattern: emailPattern });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input does not match the required format');
    });

    it('should handle null and undefined inputs', () => {
      const nullResult = InputSanitizer.sanitizeString(null);
      const undefinedResult = InputSanitizer.sanitizeString(undefined);
      
      expect(nullResult.isValid).toBe(true);
      expect(nullResult.sanitizedValue).toBe('');
      expect(undefinedResult.isValid).toBe(true);
      expect(undefinedResult.sanitizedValue).toBe('');
    });
  });

  describe('sanitizeNumber', () => {
    it('should sanitize valid numbers', () => {
      const result = InputSanitizer.sanitizeNumber(42);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(42);
      expect(result.securityScore).toBe(100);
    });

    it('should handle string numbers', () => {
      const result = InputSanitizer.sanitizeNumber('123.45');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(123.45);
    });

    it('should enforce min/max limits', () => {
      const minResult = InputSanitizer.sanitizeNumber(-10, { min: 0 });
      const maxResult = InputSanitizer.sanitizeNumber(1000, { max: 100 });
      
      expect(minResult.isValid).toBe(false);
      expect(maxResult.isValid).toBe(false);
    });

    it('should handle invalid numbers', () => {
      const result = InputSanitizer.sanitizeNumber('not-a-number');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid number format');
    });
  });
});

describe('SecurityUtils', () => {
  describe('validatePasswordStrength', () => {
    it('should validate strong passwords', () => {
      const result = SecurityUtils.validatePasswordStrength('StrongP@ssw0rd123');
      expect(result.score).toBeGreaterThan(80);
      expect(result.isStrong).toBe(true);
      expect(result.feedback).toHaveLength(0);
    });

    it('should identify weak passwords', () => {
      const result = SecurityUtils.validatePasswordStrength('123');
      expect(result.score).toBeLessThan(30);
      expect(result.isStrong).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should provide specific feedback', () => {
      const result = SecurityUtils.validatePasswordStrength('password');
      expect(result.feedback).toContain('Add uppercase letters');
      expect(result.feedback).toContain('Add numbers');
      expect(result.feedback).toContain('Add special characters');
    });

    it('should handle empty passwords', () => {
      const result = SecurityUtils.validatePasswordStrength('');
      expect(result.score).toBe(0);
      expect(result.isStrong).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate tokens of specified length', () => {
      const token = SecurityUtils.generateSecureToken(32);
      expect(token).toHaveLength(32);
      expect(typeof token).toBe('string');
    });

    it('should generate unique tokens', () => {
      const token1 = SecurityUtils.generateSecureToken(16);
      const token2 = SecurityUtils.generateSecureToken(16);
      expect(token1).not.toBe(token2);
    });

    it('should handle different lengths', () => {
      const shortToken = SecurityUtils.generateSecureToken(8);
      const longToken = SecurityUtils.generateSecureToken(64);
      
      expect(shortToken).toHaveLength(8);
      expect(longToken).toHaveLength(64);
    });
  });

  describe('hashData', () => {
    it('should hash data consistently', () => {
      const data = 'test-data';
      const hash1 = SecurityUtils.hashData(data);
      const hash2 = SecurityUtils.hashData(data);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1).toHaveLength(64); // SHA-256 hex length
    });

    it('should produce different hashes for different data', () => {
      const hash1 = SecurityUtils.hashData('data1');
      const hash2 = SecurityUtils.hashData('data2');
      
      expect(hash1).not.toBe(hash2);
    });
  });
});

describe('CSRFProtection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('token generation', () => {
    it('should generate CSRF tokens', () => {
      const token = CSRFProtection.generateToken('session-123');
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens for different sessions', () => {
      const token1 = CSRFProtection.generateToken('session-1');
      const token2 = CSRFProtection.generateToken('session-2');
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('token validation', () => {
    it('should validate correct tokens', () => {
      const sessionId = 'test-session';
      const token = CSRFProtection.generateToken(sessionId);
      const isValid = CSRFProtection.validateToken(sessionId, token);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid tokens', () => {
      const sessionId = 'test-session';
      const isValid = CSRFProtection.validateToken(sessionId, 'invalid-token');
      
      expect(isValid).toBe(false);
    });

    it('should reject tokens for different sessions', () => {
      const token = CSRFProtection.generateToken('session-1');
      const isValid = CSRFProtection.validateToken('session-2', token);
      
      expect(isValid).toBe(false);
    });
  });

  describe('token expiration', () => {
    it('should handle token expiration', () => {
      const sessionId = 'test-session';
      const token = CSRFProtection.generateToken(sessionId, 1); // 1ms expiry
      
      // Wait for expiration
      setTimeout(() => {
        const isValid = CSRFProtection.validateToken(sessionId, token);
        expect(isValid).toBe(false);
      }, 2);
    });
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    RateLimiter.clearAll(); // Clear rate limit data
  });

  describe('basic rate limiting', () => {
    it('should allow requests within limit', () => {
      const result = RateLimiter.checkRateLimit('user-1', 5, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should block requests exceeding limit', () => {
      // Make requests up to limit
      for (let i = 0; i < 5; i++) {
        RateLimiter.checkRateLimit('user-1', 5, 60000);
      }
      
      // This should be blocked
      const result = RateLimiter.checkRateLimit('user-1', 5, 60000);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should track different users separately', () => {
      // User 1 hits limit
      for (let i = 0; i < 5; i++) {
        RateLimiter.checkRateLimit('user-1', 5, 60000);
      }
      
      // User 2 should still be allowed
      const result = RateLimiter.checkRateLimit('user-2', 5, 60000);
      expect(result.allowed).toBe(true);
    });
  });

  describe('window reset', () => {
    it('should reset limits after window expires', () => {
      // Hit limit
      for (let i = 0; i < 5; i++) {
        RateLimiter.checkRateLimit('user-1', 5, 1); // 1ms window
      }
      
      // Should be blocked
      let result = RateLimiter.checkRateLimit('user-1', 5, 1);
      expect(result.allowed).toBe(false);
      
      // Wait for window reset
      setTimeout(() => {
        result = RateLimiter.checkRateLimit('user-1', 5, 1);
        expect(result.allowed).toBe(true);
      }, 2);
    });
  });
});

describe('AuditLogger', () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('security event logging', () => {
    it('should log security events', async () => {
      await AuditLogger.logSecurityEvent('auth', 'failed_login', {
        level: 'warn',
        data: { userId: 'test-user', ip: '127.0.0.1' }
      });
      
      // Should log in development
      if (process.env.NODE_ENV === 'development') {
        expect(console.log).toHaveBeenCalled();
      }
    });

    it('should handle different event types', async () => {
      const events = [
        { type: 'auth', action: 'login' },
        { type: 'api', action: 'request' },
        { type: 'validation', action: 'failed' }
      ];
      
      for (const event of events) {
        await AuditLogger.logSecurityEvent(event.type, event.action, {
          level: 'info',
          data: {}
        });
      }
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('data access logging', () => {
    it('should log data access events', async () => {
      await AuditLogger.logDataAccessEvent('read', 'user-123', 'transactions', {
        recordsAffected: 10,
        success: true,
        metadata: { query: 'SELECT * FROM transactions' }
      });
      
      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should log different operation types', async () => {
      const operations = ['read', 'write', 'update', 'delete'];
      
      for (const operation of operations) {
        await AuditLogger.logDataAccessEvent(operation, 'user-123', 'test-table', {
          recordsAffected: 1,
          success: true
        });
      }
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('error formatting', () => {
    it('should format events for console output', () => {
      const event = {
        timestamp: new Date().toISOString(),
        type: 'auth',
        action: 'failed_login',
        level: 'warn',
        data: { userId: 'test' }
      };
      
      const formatted = AuditLogger.formatForConsole(event);
      
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('auth');
      expect(formatted).toContain('failed_login');
    });

    it('should handle events without data', () => {
      const event = {
        timestamp: new Date().toISOString(),
        type: 'system',
        action: 'startup',
        level: 'info'
      };
      
      const formatted = AuditLogger.formatForConsole(event);
      
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('system');
    });
  });
});
