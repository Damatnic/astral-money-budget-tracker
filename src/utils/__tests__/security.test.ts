import { 
  InputSanitizer, 
  RateLimiter, 
  CSRFProtection, 
  SecurityUtils,
  ValidationResult 
} from '../security';

describe('security', () => {
  describe('InputSanitizer', () => {
    describe('sanitizeString', () => {
      it('should sanitize valid strings correctly', () => {
        const result = InputSanitizer.sanitizeString('Hello World', {});
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedValue).toBe('Hello World');
        expect(result.errors).toHaveLength(0);
        expect(result.securityScore).toBe(100);
      });

      it('should handle required fields', () => {
        const emptyResult = InputSanitizer.sanitizeString('', { required: true });
        expect(emptyResult.isValid).toBe(false);
        expect(emptyResult.errors).toContain('This field is required');

        const nullResult = InputSanitizer.sanitizeString(null, { required: true });
        expect(nullResult.isValid).toBe(false);
        expect(nullResult.errors).toContain('This field is required');

        const undefinedResult = InputSanitizer.sanitizeString(undefined, { required: true });
        expect(undefinedResult.isValid).toBe(false);
        expect(undefinedResult.errors).toContain('This field is required');
      });

      it('should handle non-required empty fields', () => {
        const result = InputSanitizer.sanitizeString(null, { required: false });
        expect(result.isValid).toBe(true);
        expect(result.sanitizedValue).toBe('');
        expect(result.securityScore).toBe(100);
      });

      it('should enforce maximum length', () => {
        const longString = 'a'.repeat(50);
        const result = InputSanitizer.sanitizeString(longString, { maxLength: 10 });
        
        expect(result.sanitizedValue).toBe('aaaaaaaaaa');
        expect(result.errors).toContain('Input exceeds maximum length of 10 characters');
        expect(result.securityScore).toBe(80); // -20 for length violation
      });

      it('should detect and remove XSS patterns', () => {
        const maliciousInputs = [
          '<script>alert("xss")</script>',
          '<iframe src="javascript:alert(1)"></iframe>',
          'javascript:alert(1)',
          'onclick="alert(1)"',
        ];

        maliciousInputs.forEach(input => {
          const result = InputSanitizer.sanitizeString(input, {});
          expect(result.securityScore).toBeLessThan(100);
          expect(result.errors).toContain('Potentially dangerous content was removed');
        });
      });

      it('should allow XSS patterns when stripXss is false', () => {
        const result = InputSanitizer.sanitizeString('<script>test</script>', { stripXss: false });
        expect(result.sanitizedValue).toContain('&lt;script&gt;');
      });

      it('should escape HTML by default', () => {
        const result = InputSanitizer.sanitizeString('<div>Hello & "World"</div>', {});
        expect(result.sanitizedValue).toBe('&lt;div&gt;Hello &amp; &quot;World&quot;&lt;&#x2F;div&gt;');
      });

      it('should allow HTML when specified', () => {
        const result = InputSanitizer.sanitizeString('<div>Hello</div>', { allowHtml: true });
        expect(result.sanitizedValue).toBe('<div>Hello</div>');
      });

      it('should validate against patterns', () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        const validEmail = InputSanitizer.sanitizeString('user@example.com', { pattern: emailPattern });
        expect(validEmail.isValid).toBe(true);

        const invalidEmail = InputSanitizer.sanitizeString('invalid-email', { pattern: emailPattern });
        expect(invalidEmail.isValid).toBe(false);
        expect(invalidEmail.errors).toContain('Input does not match the required format');
      });

      it('should convert non-string inputs', () => {
        const numberResult = InputSanitizer.sanitizeString(123, {});
        expect(numberResult.sanitizedValue).toBe('123');
        expect(numberResult.securityScore).toBe(95); // -5 for type conversion

        const booleanResult = InputSanitizer.sanitizeString(true, {});
        expect(booleanResult.sanitizedValue).toBe('true');
      });

      it('should trim whitespace', () => {
        const result = InputSanitizer.sanitizeString('  Hello World  ', {});
        expect(result.sanitizedValue).toBe('Hello World');
      });
    });

    describe('sanitizeNumber', () => {
      it('should sanitize valid numbers correctly', () => {
        const result = InputSanitizer.sanitizeNumber(42, {});
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedValue).toBe(42);
        expect(result.errors).toHaveLength(0);
        expect(result.securityScore).toBe(100);
      });

      it('should handle required number fields', () => {
        const nullResult = InputSanitizer.sanitizeNumber(null, { required: true });
        expect(nullResult.isValid).toBe(false);
        expect(nullResult.errors).toContain('This field is required');

        const emptyStringResult = InputSanitizer.sanitizeNumber('', { required: true });
        expect(emptyStringResult.isValid).toBe(false);
        expect(emptyStringResult.errors).toContain('This field is required');
      });

      it('should handle non-required empty fields', () => {
        const result = InputSanitizer.sanitizeNumber(null, { required: false });
        expect(result.isValid).toBe(true);
        expect(result.sanitizedValue).toBe(null);
      });

      it('should validate number format', () => {
        const invalidResults = [
          InputSanitizer.sanitizeNumber('not a number', {}),
          InputSanitizer.sanitizeNumber(Infinity, {}),
          InputSanitizer.sanitizeNumber(NaN, {}),
        ];

        invalidResults.forEach(result => {
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Please enter a valid number');
          expect(result.securityScore).toBe(0);
        });
      });

      it('should enforce minimum and maximum values', () => {
        const belowMin = InputSanitizer.sanitizeNumber(5, { min: 10 });
        expect(belowMin.errors).toContain('Value must be at least 10');

        const aboveMax = InputSanitizer.sanitizeNumber(15, { max: 10 });
        expect(aboveMax.errors).toContain('Value must not exceed 10');
      });

      it('should enforce positive values', () => {
        const negativeResult = InputSanitizer.sanitizeNumber(-5, { positive: true });
        expect(negativeResult.errors).toContain('Value must be positive');
      });

      it('should enforce integer values', () => {
        const decimalResult = InputSanitizer.sanitizeNumber(3.14, { integer: true });
        expect(decimalResult.errors).toContain('Value must be a whole number');

        const integerResult = InputSanitizer.sanitizeNumber(42, { integer: true });
        expect(integerResult.isValid).toBe(true);
      });

      it('should convert string numbers', () => {
        const result = InputSanitizer.sanitizeNumber('42.5', {});
        expect(result.sanitizedValue).toBe(42.5);
        expect(result.isValid).toBe(true);
      });

      it('should handle default min/max ranges', () => {
        const extremelyLarge = InputSanitizer.sanitizeNumber(1e15, {});
        expect(extremelyLarge.errors).toContain('Value must not exceed 999999999.99');

        const extremelySmall = InputSanitizer.sanitizeNumber(-1e15, {});
        expect(extremelySmall.errors).toContain('Value must be at least -999999999.99');
      });
    });
  });

  describe('RateLimiter', () => {
    beforeEach(() => {
      // Clear the rate limiter store before each test
      RateLimiter.cleanup();
    });

    it('should allow requests within limits', () => {
      const result = RateLimiter.checkRateLimit('test-user', 5, 60000);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should block requests exceeding limits', () => {
      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        RateLimiter.checkRateLimit('test-user', 5, 60000);
      }
      
      // 6th request should be blocked
      const result = RateLimiter.checkRateLimit('test-user', 5, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset limits after time window', () => {
      // Mock Date.now to control time
      const originalDateNow = Date.now;
      let currentTime = 1000000000000;
      Date.now = jest.fn(() => currentTime);

      const result1 = RateLimiter.checkRateLimit('test-user', 1, 1000);
      expect(result1.allowed).toBe(true);

      const result2 = RateLimiter.checkRateLimit('test-user', 1, 1000);
      expect(result2.allowed).toBe(false);

      // Advance time past the window
      currentTime += 2000;
      
      const result3 = RateLimiter.checkRateLimit('test-user', 1, 1000);
      expect(result3.allowed).toBe(true);

      // Restore original Date.now
      Date.now = originalDateNow;
    });

    it('should handle multiple users independently', () => {
      const user1Result = RateLimiter.checkRateLimit('user1', 2, 60000);
      const user2Result = RateLimiter.checkRateLimit('user2', 2, 60000);
      
      expect(user1Result.allowed).toBe(true);
      expect(user2Result.allowed).toBe(true);
      expect(user1Result.remaining).toBe(1);
      expect(user2Result.remaining).toBe(1);
    });

    it('should cleanup expired entries', () => {
      // Mock Date.now to control time
      const originalDateNow = Date.now;
      let currentTime = 1000000000000;
      Date.now = jest.fn(() => currentTime);

      RateLimiter.checkRateLimit('test-user', 5, 1000);
      
      // Advance time past expiration
      currentTime += 2000;
      
      RateLimiter.cleanup();
      
      // After cleanup, expired entries should be removed
      const result = RateLimiter.checkRateLimit('test-user', 5, 60000);
      expect(result.remaining).toBe(4); // Should be treated as new user

      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });

  describe('CSRFProtection', () => {
    it('should generate unique tokens', () => {
      const token1 = CSRFProtection.generateToken('session1');
      const token2 = CSRFProtection.generateToken('session2');
      
      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(32);
    });

    it('should validate correct tokens', () => {
      const token = CSRFProtection.generateToken('test-session');
      const isValid = CSRFProtection.validateToken('test-session', token);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect tokens', () => {
      CSRFProtection.generateToken('test-session');
      const isValid = CSRFProtection.validateToken('test-session', 'wrong-token');
      
      expect(isValid).toBe(false);
    });

    it('should handle non-existent sessions', () => {
      const isValid = CSRFProtection.validateToken('non-existent', 'some-token');
      expect(isValid).toBe(false);
    });

    it('should generate tokens with proper format', () => {
      const token = CSRFProtection.generateToken('test-session');
      expect(token).toMatch(/^[a-z0-9]{32}$/);
    });
  });

  describe('SecurityUtils', () => {
    describe('generateSecureId', () => {
      it('should generate unique IDs', () => {
        const id1 = SecurityUtils.generateSecureId();
        const id2 = SecurityUtils.generateSecureId();
        
        expect(id1).toBeTruthy();
        expect(id2).toBeTruthy();
        expect(id1).not.toBe(id2);
        expect(id1.length).toBe(16);
        expect(id1).toMatch(/^[a-z0-9]+$/);
      });
    });

    describe('isSecureContext', () => {
      it('should return true in server environment', () => {
        // In Jest/Node environment, window is undefined
        const result = SecurityUtils.isSecureContext();
        expect(result).toBe(true);
      });

      it('should check window.isSecureContext when available', () => {
        // Mock window object
        global.window = {
          isSecureContext: true,
          location: { protocol: 'http:' }
        } as any;

        const result = SecurityUtils.isSecureContext();
        expect(result).toBe(true);

        delete (global as any).window;
      });

      it('should check HTTPS protocol when isSecureContext is false', () => {
        global.window = {
          isSecureContext: false,
          location: { protocol: 'https:' }
        } as any;

        const result = SecurityUtils.isSecureContext();
        expect(result).toBe(true);

        delete (global as any).window;
      });
    });

    describe('validatePasswordStrength', () => {
      it('should validate strong passwords', () => {
        const result = SecurityUtils.validatePasswordStrength('MyP@ssw0rd123');
        expect(result.score).toBe(100);
        expect(result.feedback).toHaveLength(0);
      });

      it('should identify weak passwords', () => {
        const result = SecurityUtils.validatePasswordStrength('weak');
        expect(result.score).toBeLessThan(100);
        expect(result.feedback).toContain('Password should be at least 8 characters long');
        expect(result.feedback).toContain('Include uppercase letters');
        expect(result.feedback).toContain('Include numbers');
        expect(result.feedback).toContain('Include special characters');
      });

      it('should award points for length', () => {
        const short = SecurityUtils.validatePasswordStrength('MyP@ss1');
        const medium = SecurityUtils.validatePasswordStrength('MyP@ssw0rd');
        const long = SecurityUtils.validatePasswordStrength('MyP@ssw0rd123456');

        expect(short.score).toBeLessThan(medium.score);
        expect(medium.score).toBeLessThan(long.score);
      });

      it('should check for character diversity', () => {
        const tests = [
          { password: 'alllowercase', missing: 'Include uppercase letters' },
          { password: 'ALLUPPERCASE', missing: 'Include lowercase letters' },
          { password: 'NoNumbers!', missing: 'Include numbers' },
          { password: 'NoSpecial123', missing: 'Include special characters' },
        ];

        tests.forEach(test => {
          const result = SecurityUtils.validatePasswordStrength(test.password);
          expect(result.feedback).toContain(test.missing);
        });
      });

      it('should handle empty passwords', () => {
        const result = SecurityUtils.validatePasswordStrength('');
        expect(result.score).toBe(0);
        expect(result.feedback.length).toBeGreaterThan(0);
      });

      it('should give bonus for very long passwords', () => {
        const regular = SecurityUtils.validatePasswordStrength('MyP@ssw0rd');
        const extraLong = SecurityUtils.validatePasswordStrength('MyP@ssw0rd123');
        
        expect(extraLong.score).toBeGreaterThanOrEqual(regular.score);
      });
    });
  });

  describe('Integration tests', () => {
    it('should handle comprehensive input validation scenario', () => {
      const userInput = {
        name: '  John Doe  ',
        email: 'john@example.com',
        age: '25',
        bio: '<script>alert("xss")</script>Safe content',
        amount: '123.45',
      };

      const nameValidation = InputSanitizer.sanitizeString(userInput.name, { 
        required: true, 
        maxLength: 50 
      });
      
      const emailValidation = InputSanitizer.sanitizeString(userInput.email, { 
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      });
      
      const ageValidation = InputSanitizer.sanitizeNumber(userInput.age, { 
        required: true,
        min: 0,
        max: 120,
        integer: true
      });
      
      const bioValidation = InputSanitizer.sanitizeString(userInput.bio, {
        maxLength: 500
      });
      
      const amountValidation = InputSanitizer.sanitizeNumber(userInput.amount, {
        required: true,
        min: 0,
        positive: true
      });

      expect(nameValidation.isValid).toBe(true);
      expect(nameValidation.sanitizedValue).toBe('John Doe');
      
      expect(emailValidation.isValid).toBe(true);
      
      expect(ageValidation.isValid).toBe(true);
      expect(ageValidation.sanitizedValue).toBe(25);
      
      expect(bioValidation.securityScore).toBeLessThan(100); // XSS detected
      expect(bioValidation.sanitizedValue).toContain('Safe content');
      expect(bioValidation.sanitizedValue).not.toContain('<script>');
      
      expect(amountValidation.isValid).toBe(true);
      expect(amountValidation.sanitizedValue).toBe(123.45);
    });
  });
});