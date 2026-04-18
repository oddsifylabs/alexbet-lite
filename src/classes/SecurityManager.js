/**
 * SecurityManager - Comprehensive security operations
 * Handles XSS prevention, input sanitization, CSRF protection, and data validation
 */

class SecurityManager {
  constructor() {
    this.trustedDomains = ['localhost', 'alexbet.dev', 'alexbet-lite.netlify.app'];
    this.cspNonce = this._generateNonce();
    this.csrfTokens = new Map();
    this.contentSecurityPolicy = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'nonce-" + this.cspNonce + "'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'", 'https://espn-api.herokuapp.com', 'https://api.espn.com'],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    };
  }

  /**
   * Generate cryptographically secure random nonce
   */
  _generateNonce() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate CSRF token for session
   */
  generateCSRFToken() {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const timestamp = Date.now();
    this.csrfTokens.set(token, timestamp);

    // Expire tokens after 1 hour
    setTimeout(() => {
      this.csrfTokens.delete(token);
    }, 3600000);

    return token;
  }

  /**
   * Verify CSRF token
   */
  verifyCSRFToken(token) {
    if (!this.csrfTokens.has(token)) {
      return {
        valid: false,
        error: 'Invalid or expired CSRF token'
      };
    }

    const timestamp = this.csrfTokens.get(token);
    const age = Date.now() - timestamp;

    // Token must be less than 1 hour old
    if (age > 3600000) {
      this.csrfTokens.delete(token);
      return {
        valid: false,
        error: 'CSRF token expired'
      };
    }

    // Consume token (one-time use)
    this.csrfTokens.delete(token);

    return {
      valid: true,
      error: null
    };
  }

  /**
   * Sanitize HTML string - remove dangerous tags and attributes
   * This is a lightweight sanitizer; consider DOMPurify for production
   */
  sanitizeHTML(html) {
    if (typeof html !== 'string') {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Sanitize user input - prevent XSS
   */
  sanitizeInput(input, allowedTags = []) {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove control characters
    let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');

    // Remove potentially dangerous HTML
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers
      /<iframe/gi,
      /<embed/gi,
      /<object/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /<style[^>]*>.*?<\/style>/gi
    ];

    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    sanitized = sanitized.substring(0, 1000);

    return sanitized;
  }

  /**
   * Validate and sanitize email
   */
  sanitizeEmail(email) {
    if (typeof email !== 'string') {
      return '';
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return '';
    }

    return email.toLowerCase().trim().substring(0, 254);
  }

  /**
   * Validate and sanitize URL
   */
  sanitizeURL(url) {
    if (typeof url !== 'string') {
      return '';
    }

    try {
      const parsed = new URL(url);

      // Only allow http and https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '';
      }

      // Check if domain is trusted
      const hostname = parsed.hostname;
      const isTrusted = this.trustedDomains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );

      if (!isTrusted) {
        console.warn('[Security] Untrusted URL attempted:', url);
        return '';
      }

      return parsed.toString();
    } catch (err) {
      console.warn('[Security] Invalid URL:', url);
      return '';
    }
  }

  /**
   * Sanitize JSON data - prevent prototype pollution
   */
  sanitizeJSON(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = {};
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

    for (const key in data) {
      // Skip dangerous keys
      if (dangerousKeys.includes(key)) {
        continue;
      }

      // Skip non-enumerable properties
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        continue;
      }

      if (typeof data[key] === 'object' && data[key] !== null) {
        sanitized[key] = this.sanitizeJSON(data[key]);
      } else if (typeof data[key] === 'string') {
        sanitized[key] = this.sanitizeInput(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }

    return sanitized;
  }

  /**
   * Validate data type
   */
  validateType(value, expectedType) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (expectedType === 'integer') {
      return Number.isInteger(value);
    }

    return actualType === expectedType;
  }

  /**
   * Validate number range
   */
  validateNumberRange(value, min = null, max = null) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return false;
    }

    if (min !== null && value < min) {
      return false;
    }

    if (max !== null && value > max) {
      return false;
    }

    return true;
  }

  /**
   * Validate string length
   */
  validateStringLength(value, minLength = 1, maxLength = 1000) {
    if (typeof value !== 'string') {
      return false;
    }

    const length = value.trim().length;

    return length >= minLength && length <= maxLength;
  }

  /**
   * Get CSP header value
   */
  getCSPHeader() {
    let header = '';

    for (const [directive, values] of Object.entries(this.contentSecurityPolicy)) {
      header += `${directive} ${values.join(' ')}; `;
    }

    return header.trim();
  }

  /**
   * Get CSP meta tag for HTML
   */
  getCSPMetaTag() {
    return `<meta http-equiv="Content-Security-Policy" content="${this.getCSPHeader()}">`;
  }

  /**
   * Check for common XSS patterns
   */
  detectXSSPatterns(input) {
    if (typeof input !== 'string') {
      return [];
    }

    const xssPatterns = [
      { name: 'script tag', pattern: /<script[^>]*>/gi },
      { name: 'event handler', pattern: /on\w+\s*=/gi },
      { name: 'javascript protocol', pattern: /javascript:/gi },
      { name: 'data uri', pattern: /data:text\/html/gi },
      { name: 'iframe', pattern: /<iframe[^>]*>/gi },
      { name: 'object tag', pattern: /<object[^>]*>/gi },
      { name: 'embed tag', pattern: /<embed[^>]*>/gi }
    ];

    const detected = [];

    xssPatterns.forEach(({ name, pattern }) => {
      if (pattern.test(input)) {
        detected.push(name);
      }
    });

    return detected;
  }

  /**
   * Rate limiting helper
   */
  createRateLimiter(maxAttempts, timeWindowMs) {
    const attempts = new Map();

    return {
      check: (key) => {
        const now = Date.now();
        const userAttempts = attempts.get(key) || [];

        // Remove old attempts outside time window
        const recentAttempts = userAttempts.filter(time => now - time < timeWindowMs);

        if (recentAttempts.length >= maxAttempts) {
          return {
            allowed: false,
            remaining: 0,
            resetIn: Math.ceil((recentAttempts[0] + timeWindowMs - now) / 1000)
          };
        }

        // Add new attempt
        recentAttempts.push(now);
        attempts.set(key, recentAttempts);

        return {
          allowed: true,
          remaining: maxAttempts - recentAttempts.length,
          resetIn: 0
        };
      },

      reset: (key) => {
        attempts.delete(key);
      },

      getAttempts: (key) => {
        const attempts = attempts.get(key) || [];
        return attempts.filter(time => Date.now() - time < timeWindowMs).length;
      }
    };
  }

  /**
   * Hash string using SHA-256 (for fingerprinting, not password storage!)
   */
  async hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Secure random string generation
   */
  generateRandomString(length = 32) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }

    return result;
  }

  /**
   * Get security headers object
   */
  getSecurityHeaders() {
    return {
      'Content-Security-Policy': this.getCSPHeader(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    };
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, details = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      userAgent: navigator.userAgent,
      location: window.location.href,
      ...details
    };

    console.warn('[Security Event]', event);

    // Could send to security monitoring service
    // fetch('/api/security-events', { method: 'POST', body: JSON.stringify(event) });
  }

  /**
   * Validate origin (for postMessage security)
   */
  validateOrigin(receivedOrigin, expectedOrigin) {
    return receivedOrigin === expectedOrigin;
  }

  /**
   * Create secure context for trusted code execution
   */
  createTrustedContext(code, dependencies = {}) {
    // This is a simplified example - never use eval in production!
    // For production, use Web Workers or separate contexts
    console.warn('[Security] Trusted context execution - use with caution');

    return new Function(...Object.keys(dependencies), code)
      .apply(null, Object.values(dependencies));
  }

  /**
   * Audit security posture
   */
  auditSecurityPosture() {
    const audit = {
      timestamp: new Date().toISOString(),
      checks: {
        csrfProtection: this.csrfTokens.size > 0,
        csrfTokensValid: Array.from(this.csrfTokens.values()).every(
          time => Date.now() - time < 3600000
        ),
        contentSecurityPolicy: Object.keys(this.contentSecurityPolicy).length > 0,
        nounceGenerated: this.cspNonce !== null && this.cspNonce.length > 0,
        trustedDomainsConfigured: this.trustedDomains.length > 0,
        securityHeadersAvailable: Object.keys(this.getSecurityHeaders()).length > 0
      },
      issues: []
    };

    // Check for issues
    if (audit.checks.csrfTokensValid === false) {
      audit.issues.push('Expired CSRF tokens detected');
    }

    if (!audit.checks.contentSecurityPolicy) {
      audit.issues.push('CSP not configured');
    }

    if (audit.issues.length === 0) {
      audit.status = 'SECURE';
    } else {
      audit.status = 'WARNINGS';
    }

    return audit;
  }
}

// Create global instance
const securityManager = new SecurityManager();

console.log('[SecurityManager] Initialized with CSP nonce:', securityManager.cspNonce);
