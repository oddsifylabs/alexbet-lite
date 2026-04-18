# Security Implementation Guide

**Status:** ✅ Phase 2: Security Complete  
**Version:** v2026.04.18  
**Last Updated:** April 18, 2026

## 🔒 Security Architecture

AlexBET Lite implements a multi-layered security approach to protect user data and prevent common web vulnerabilities.

### Security Layers

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Content Security Policy (CSP)             │
│           - Restricts script sources                │
│           - Prevents inline code execution          │
│           - Controls external requests              │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│  Layer 2: SecurityManager                           │
│           - Input sanitization (XSS prevention)     │
│           - CSRF token generation/validation        │
│           - URL & email validation                  │
│           - Rate limiting utilities                 │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│  Layer 3: BetValidator                              │
│           - Input type validation                   │
│           - Range checking                          │
│           - Data sanitization                       │
│           - XSS pattern detection                   │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│  Layer 4: SecurityAudit                             │
│           - Event logging & monitoring              │
│           - Threat detection                        │
│           - Security scoring                        │
│           - Report generation                       │
└─────────────────────────────────────────────────────┘
```

## 🚨 Threat Prevention

### 1. Cross-Site Scripting (XSS) Prevention

**Threats Addressed:**
- Stored XSS (malicious scripts in data)
- Reflected XSS (injection via URL parameters)
- DOM-based XSS (JavaScript manipulation)

**Defenses Implemented:**
```javascript
// Pattern Detection
const patterns = securityManager.detectXSSPatterns(userInput);
// Removes: <script>, javascript:, event handlers, iframes, etc.

// Input Sanitization
const safe = securityManager.sanitizeInput(userInput);
// Removes: control characters, dangerous HTML, event handlers

// DOM Text Nodes (Safest)
element.textContent = userInput; // Never .innerHTML with user data

// XSS Audit
securityAudit.logXSSAttempt('field', patterns, userInput);
```

**Example:**
```javascript
// ❌ UNSAFE
element.innerHTML = user.pick; // Could execute scripts

// ✅ SAFE
element.textContent = securityManager.sanitizeInput(user.pick);
```

### 2. SQL Injection Prevention

**Status:** ✅ Protected (LocalStorage, no SQL)
- All data stored in LocalStorage (JSON)
- No server-side database queries
- No SQL execution possible

### 3. CSRF (Cross-Site Request Forgery) Prevention

**Defense:** CSRF Token System
```javascript
// Generate token
const token = securityManager.generateCSRFToken();

// Verify token
const valid = securityManager.verifyCSRFToken(token);

// Usage in forms
<form>
  <input type="hidden" name="csrf_token" value="${token}">
  <!-- form fields -->
</form>
```

**Expiry:** 1 hour per token, one-time use

### 4. Data Injection Prevention

**Protected Against:**
- Prototype pollution
- JSON injection
- Object literal injection

**Implementation:**
```javascript
// Sanitize imported JSON
const sanitized = securityManager.sanitizeJSON(importedData);
// Blocks: __proto__, constructor, prototype

// Validate before use
const validation = BetValidator.validateBet(sanitized);
```

### 5. Rate Limiting & DoS Prevention

**Rate Limiter:**
```javascript
const limiter = securityManager.createRateLimiter(
  10,      // maxAttempts
  60000    // timeWindowMs (1 minute)
);

const check = limiter.check('user_123');
if (!check.allowed) {
  // Reject request, wait check.resetIn seconds
}
```

### 6. Storage Security

**LocalStorage Quota Management:**
```javascript
const stats = betTracker.getStorageStats();
// Monitors: size, quota, percent used
// Alerts when > 90% quota used
// Auto-cleanup of old data (6+ months)
```

## 📋 Content Security Policy (CSP)

### Current Policy

```
default-src 'self'
├── script-src 'self'
├── style-src 'self' 'unsafe-inline' (for critical styles)
├── img-src 'self' data: https:
├── font-src 'self'
├── connect-src 'self' https://espn-api.herokuapp.com
├── frame-ancestors 'none' (no embedding)
├── base-uri 'self' (prevent base tag injection)
└── form-action 'self' (form submissions only to same origin)
```

### How It Works

1. **Restricts script sources:** Only scripts from same domain
2. **Prevents inline code:** `<script>` tags in HTML ignored
3. **Controls API calls:** Only ESPN API allowed for live scores
4. **Blocks framing:** Page cannot be embedded in iframes

### Testing CSP

```javascript
// View CSP policy
const csp = securityManager.getCSPHeader();
console.log(csp);

// Check security posture
const posture = securityManager.auditSecurityPosture();
console.log(posture);
```

## 🔐 Data Validation

### Input Validation Pipeline

```
User Input
    ↓
Length Check (0-200 chars)
    ↓
Type Validation (string, number)
    ↓
XSS Pattern Detection
    ↓
Sanitization (remove dangerous chars)
    ↓
Range Validation (for numbers)
    ↓
Business Logic Validation (sport, type)
    ↓
Storage (safe data)
```

### Validation Example

```javascript
const bet = {
  pick: 'Heat -5.5',
  sport: 'NBA',
  betType: 'SPREAD',
  entryOdds: -110,
  stake: 100,
  edge: 2.5
};

// Comprehensive validation
const validation = BetValidator.validateBet(bet);

if (!validation.valid) {
  validation.errors.forEach(error => {
    securityAudit.logValidationFailure('pick', [error]);
  });
  return;
}
```

## 🔍 Security Audit & Monitoring

### SecurityAudit Class

Tracks all security events with full logging:

```javascript
// Log XSS attempt
securityAudit.logXSSAttempt('pick', ['<script>'], 'alert(1)');

// Log validation failure
securityAudit.logValidationFailure('odds', ['Invalid number']);

// Log data access
securityAudit.logDataAccess('bets', 'CREATE', true);

// Get security score
const score = securityAudit.getSecurityScore();
// { score: 95, assessment: 'EXCELLENT', warnings: [] }

// View all logs
const logs = securityAudit.getLogs({ severity: 'WARNING' });

// Generate report
const report = securityAudit.generateReport();
console.log(report);
```

### Log Storage

- **Storage:** LocalStorage (up to 1000 events)
- **Retention:** 30 days (configurable)
- **Access:** Via SecurityAudit instance

### Monitoring Dashboard (Future)

```javascript
// Check security posture
const summary = securityAudit.getSummary();
console.log({
  totalEvents: summary.totalEvents,
  critical: summary.eventsBySeverity.CRITICAL,
  xssAttempts: summary.eventsByType.XSS_ATTEMPT
});
```

## 🛡️ Security Best Practices

### For Developers

1. **Always sanitize user input:**
   ```javascript
   const safe = securityManager.sanitizeInput(userInput);
   ```

2. **Use textContent, not innerHTML:**
   ```javascript
   element.textContent = userInput; // ✅ Safe
   element.innerHTML = userInput;   // ❌ Unsafe
   ```

3. **Validate before storage:**
   ```javascript
   const validation = BetValidator.validateBet(bet);
   if (!validation.valid) return;
   ```

4. **Log security events:**
   ```javascript
   securityAudit.logEvent('ACTION', 'INFO', details);
   ```

5. **Check CSRF tokens:**
   ```javascript
   const valid = securityManager.verifyCSRFToken(token);
   ```

### For Users

1. **Keep browser updated** - Security patches
2. **Clear data regularly** - Privacy
3. **Use strong passwords** - If implementing auth
4. **Review security logs** - Monitor activity
5. **Enable CSP warnings** - Browser DevTools

## 🚀 Security Checklist

- [x] XSS prevention (input sanitization)
- [x] CSRF protection (token-based)
- [x] CSP implementation (HTML meta tag)
- [x] Input validation (comprehensive)
- [x] Rate limiting (utility available)
- [x] Security audit logging (full tracking)
- [x] Data type validation (all fields)
- [x] Prototype pollution protection (JSON sanitization)
- [x] URL validation (trusted domains)
- [x] Email validation (regex + sanitization)

## 🔧 API Reference

### SecurityManager

```javascript
// Sanitization
securityManager.sanitizeInput(str)          // General input
securityManager.sanitizeHTML(str)           // HTML context
securityManager.sanitizeURL(url)            // URLs
securityManager.sanitizeEmail(email)        // Emails
securityManager.sanitizeJSON(obj)           // JSON objects

// Validation
securityManager.validateType(val, type)     // Type check
securityManager.validateNumberRange(n, min, max)
securityManager.validateStringLength(s, min, max)

// CSRF
securityManager.generateCSRFToken()         // Create token
securityManager.verifyCSRFToken(token)      // Verify token

// Detection
securityManager.detectXSSPatterns(str)      // Find patterns
securityManager.getCSPHeader()               // Get CSP string
securityManager.getSecurityHeaders()        // Security headers

// Rate Limiting
securityManager.createRateLimiter(max, window)
```

### BetValidator

```javascript
BetValidator.validateBet(bet)               // Full validation
BetValidator.validatePropBet(prop)          // Props validation
BetValidator.validateStatusTransition(curr, new)
BetValidator.sanitizeInput(str)             // Sanitize
BetValidator.sanitizeForHTML(str)           // HTML safe
BetValidator.sanitizeBet(bet)               // Full object
BetValidator.sanitizeImportData(array)      // Import data
```

### SecurityAudit

```javascript
securityAudit.logEvent(type, severity, details)
securityAudit.logXSSAttempt(field, patterns)
securityAudit.logValidationFailure(field, errors)
securityAudit.logDataAccess(resource, action)
securityAudit.getLogs(filters)              // Query logs
securityAudit.getSummary()                  // Stats
securityAudit.getSecurityScore()            // Scoring
securityAudit.generateReport()              // Full report
securityAudit.exportLogs()                  // JSON export
```

## 📊 Security Metrics

### Security Score Calculation

```
Base Score: 100

Deductions:
- XSS Attempt: -20 per event
- Injection Attempt: -30 per event
- Rate Limit Violation: -5 per event
- Validation Failure: -3 per event
- Storage Quota Issue: -2 per event

Max Impact per Category: 3 events (prevents negative scores)

Final Score: 0-100
- 90+: EXCELLENT
- 70+: GOOD
- 50+: FAIR
- <50: POOR
```

## 🔄 Security Updates

### Version 2026.04.18

✅ **Implemented:**
- SecurityManager class (11.8KB)
- SecurityAudit logging (10KB)
- Enhanced BetValidator
- CSP headers in HTML
- Input pattern detection
- CSRF token system
- Rate limiter utility
- Security event tracking

### Future Enhancements

- [ ] DOMPurify integration (stronger XSS)
- [ ] Rate limiting middleware
- [ ] Encryption for sensitive data
- [ ] Authentication system
- [ ] Access control lists (ACL)
- [ ] Intrusion detection
- [ ] Automated security scanning

## 📞 Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** post in public issues
2. **Email** with details and proof-of-concept
3. **Include** browser, version, reproduction steps
4. **Wait** for acknowledgment (24-48 hours)

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

---

**Built with security as a first-class concern** 🔐  
*Last Updated: April 18, 2026*
