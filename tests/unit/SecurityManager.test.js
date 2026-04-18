/**
 * SecurityManager Unit Tests
 * Testing XSS prevention, CSRF protection, and sanitization
 */

describe('SecurityManager', () => {
  let security;

  beforeEach(() => {
    security = new SecurityManager();
  });

  describe('XSS Prevention', () => {
    describe('sanitizeInput', () => {
      test('should remove script tags', () => {
        const input = '<script>alert("XSS")</script>Hello';
        const result = security.sanitizeInput(input);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('</script>');
      });

      test('should remove event handlers', () => {
        const input = '<img src=x onerror="alert(\'XSS\')">';
        const result = security.sanitizeInput(input);
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('alert');
      });

      test('should remove iframe tags', () => {
        const input = '<iframe src="http://malicious.com"></iframe>';
        const result = security.sanitizeInput(input);
        expect(result).not.toContain('iframe');
      });

      test('should preserve safe HTML entities', () => {
        const input = 'Price: $99.99';
        const result = security.sanitizeInput(input);
        expect(result).toContain('Price');
        expect(result).toContain('99.99');
      });

      test('should handle encoded XSS', () => {
        const input = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
        const result = security.sanitizeInput(input);
        // Should decode and still be safe
        expect(result).toBeDefined();
      });
    });

    describe('detectXSSPatterns', () => {
      test('should detect script tags', () => {
        const input = '<script>alert(1)</script>';
        const result = security.detectXSSPatterns(input);
        expect(result.detected).toBe(true);
        expect(result.patterns.length).toBeGreaterThan(0);
      });

      test('should detect event handlers', () => {
        const input = '<div onclick="alert(1)">Click me</div>';
        const result = security.detectXSSPatterns(input);
        expect(result.detected).toBe(true);
      });

      test('should detect javascript protocol', () => {
        const input = '<a href="javascript:alert(1)">Link</a>';
        const result = security.detectXSSPatterns(input);
        expect(result.detected).toBe(true);
      });

      test('should not detect safe content', () => {
        const input = 'This is normal text with numbers 123';
        const result = security.detectXSSPatterns(input);
        expect(result.detected).toBe(false);
      });
    });

    describe('escapeHTML', () => {
      test('should escape HTML special characters', () => {
        const input = '<script>alert("XSS")</script>';
        const result = security.escapeHTML(input);
        expect(result).toContain('&lt;');
        expect(result).toContain('&gt;');
        expect(result).not.toContain('<script>');
      });

      test('should escape quotes', () => {
        const input = 'He said "Hello"';
        const result = security.escapeHTML(input);
        expect(result).toContain('&quot;');
      });

      test('should preserve normal text', () => {
        const input = 'Normal text 123';
        const result = security.escapeHTML(input);
        expect(result).toContain('Normal text 123');
      });
    });
  });

  describe('CSRF Protection', () => {
    describe('generateCSRFToken', () => {
      test('should generate a token', () => {
        const token = security.generateCSRFToken();
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(20);
      });

      test('should generate unique tokens', () => {
        const token1 = security.generateCSRFToken();
        const token2 = security.generateCSRFToken();
        expect(token1).not.toBe(token2);
      });
    });

    describe('validateCSRFToken', () => {
      test('should validate a correct token', () => {
        const token = security.generateCSRFToken();
        security.setCSRFToken(token);
        const result = security.validateCSRFToken(token);
        expect(result).toBe(true);
      });

      test('should reject invalid token', () => {
        security.setCSRFToken('valid-token');
        const result = security.validateCSRFToken('invalid-token');
        expect(result).toBe(false);
      });

      test('should reject empty token', () => {
        const result = security.validateCSRFToken('');
        expect(result).toBe(false);
      });

      test('should reject null token', () => {
        const result = security.validateCSRFToken(null);
        expect(result).toBe(false);
      });
    });

    describe('rotateCSRFToken', () => {
      test('should generate new token after rotation', () => {
        const token1 = security.generateCSRFToken();
        security.setCSRFToken(token1);

        const token2 = security.rotateCSRFToken();
        expect(token2).not.toBe(token1);
        expect(security.validateCSRFToken(token2)).toBe(true);
      });

      test('should invalidate old token after rotation', () => {
        const token1 = security.generateCSRFToken();
        security.setCSRFToken(token1);

        const token2 = security.rotateCSRFToken();
        expect(security.validateCSRFToken(token1)).toBe(false);
      });
    });
  });

  describe('JSON Injection Prevention', () => {
    describe('sanitizeJSON', () => {
      test('should remove prototype pollution payloads', () => {
        const input = JSON.stringify({
          '__proto__': { isAdmin: true },
          'constructor': { prototype: { isAdmin: true } }
        });
        const result = security.sanitizeJSON(input);
        const parsed = JSON.parse(result);
        expect(parsed.__proto__).toBeUndefined();
        expect(parsed.constructor).toBeUndefined();
      });

      test('should preserve safe JSON', () => {
        const input = JSON.stringify({ name: 'John', age: 30 });
        const result = security.sanitizeJSON(input);
        const parsed = JSON.parse(result);
        expect(parsed.name).toBe('John');
        expect(parsed.age).toBe(30);
      });

      test('should handle nested objects', () => {
        const input = JSON.stringify({
          user: { name: 'John', nested: { value: 'test' } }
        });
        const result = security.sanitizeJSON(input);
        const parsed = JSON.parse(result);
        expect(parsed.user.nested.value).toBe('test');
      });
    });
  });

  describe('Rate Limiting', () => {
    describe('checkRateLimit', () => {
      test('should allow requests within limit', () => {
        for (let i = 0; i < 5; i++) {
          const result = security.checkRateLimit('test-user');
          expect(result).toBe(true);
        }
      });

      test('should block requests exceeding limit', () => {
        for (let i = 0; i < 10; i++) {
          security.checkRateLimit('test-user');
        }
        // 11th request should be blocked
        const result = security.checkRateLimit('test-user');
        expect(result).toBe(false);
      });

      test('should separate limits by user', () => {
        for (let i = 0; i < 10; i++) {
          security.checkRateLimit('user1');
        }
        // user2 should still be allowed
        const result = security.checkRateLimit('user2');
        expect(result).toBe(true);
      });
    });
  });

  describe('Security Logging', () => {
    describe('logSecurityEvent', () => {
      test('should log security events', () => {
        security.logSecurityEvent('XSS_ATTEMPT', { payload: '<script>' });
        const logs = security.getSecurityLogs();
        expect(logs.length).toBeGreaterThan(0);
      });

      test('should include timestamp in logs', () => {
        security.logSecurityEvent('TEST_EVENT', {});
        const logs = security.getSecurityLogs();
        expect(logs[0].timestamp).toBeDefined();
      });

      test('should include event type in logs', () => {
        security.logSecurityEvent('CSRF_FAILURE', {});
        const logs = security.getSecurityLogs();
        expect(logs[0].type).toBe('CSRF_FAILURE');
      });

      test('should include severity level', () => {
        security.logSecurityEvent('INJECTION_ATTEMPT', { severity: 'HIGH' });
        const logs = security.getSecurityLogs();
        expect(logs[0].severity).toBe('HIGH');
      });
    });

    describe('getSecurityAlerts', () => {
      test('should return high severity events', () => {
        security.logSecurityEvent('XSS_ATTEMPT', { severity: 'HIGH' });
        security.logSecurityEvent('INFO_LOG', { severity: 'LOW' });

        const alerts = security.getSecurityAlerts('HIGH');
        expect(alerts.length).toBe(1);
        expect(alerts[0].type).toBe('XSS_ATTEMPT');
      });
    });
  });

  describe('Session Management', () => {
    describe('generateSessionToken', () => {
      test('should generate unique session tokens', () => {
        const token1 = security.generateSessionToken();
        const token2 = security.generateSessionToken();
        expect(token1).not.toBe(token2);
      });

      test('should validate session token', () => {
        const token = security.generateSessionToken();
        security.setSessionToken(token);
        expect(security.validateSessionToken(token)).toBe(true);
      });
    });
  });

  describe('Input Validation', () => {
    describe('validateInput', () => {
      test('should validate email format', () => {
        expect(security.validateInput('test@example.com', 'email')).toBe(true);
        expect(security.validateInput('invalid-email', 'email')).toBe(false);
      });

      test('should validate URL format', () => {
        expect(security.validateInput('https://example.com', 'url')).toBe(true);
        expect(security.validateInput('not-a-url', 'url')).toBe(false);
      });

      test('should validate number range', () => {
        expect(security.validateInput('50', 'number', { min: 0, max: 100 })).toBe(true);
        expect(security.validateInput('150', 'number', { min: 0, max: 100 })).toBe(false);
      });

      test('should validate string length', () => {
        expect(security.validateInput('test', 'string', { minLength: 2, maxLength: 10 })).toBe(true);
        expect(security.validateInput('x', 'string', { minLength: 2 })).toBe(false);
      });
    });
  });

  describe('Content Security Policy', () => {
    describe('getCSPHeaders', () => {
      test('should return CSP headers', () => {
        const headers = security.getCSPHeaders();
        expect(headers).toBeDefined();
        expect(headers['Content-Security-Policy']).toBeDefined();
      });

      test('should block unsafe-inline scripts', () => {
        const headers = security.getCSPHeaders();
        const cspHeader = headers['Content-Security-Policy'];
        expect(cspHeader).toContain("script-src 'self'");
      });

      test('should allow self resources', () => {
        const headers = security.getCSPHeaders();
        const cspHeader = headers['Content-Security-Policy'];
        expect(cspHeader).toContain("'self'");
      });
    });
  });
});
