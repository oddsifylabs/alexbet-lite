# Security Policy 🔒

## Security & Privacy Principles

AlexBET Lite is built with security and user privacy as core principles. This document outlines our security practices and how to responsibly report vulnerabilities.

## Data Privacy 🛡️

### What We Collect
AlexBET Lite is a **client-side only application**. We do NOT:
- Send your betting data to any server
- Track your betting history
- Collect personal information
- Use cookies for analytics
- Share data with third parties

### Where Your Data Lives
- **Browser LocalStorage** — All your data stays in your browser
- **No cloud sync** — No accounts, no servers, no cloud storage
- **Export as CSV** — You can download your data anytime

### Data Security
- CSRF tokens protect forms from cross-site attacks
- LocalStorage data is isolated per-domain
- No sensitive information stored in local variables
- Secure random token generation for all operations

## Privacy by Design

1. **Minimal Data Collection** — Only what you explicitly enter
2. **No Tracking** — No analytics, no user profiling
3. **Local Processing** — All calculations happen in your browser
4. **User Control** — Clear cache anytime in settings
5. **Transparency** — Open source, review the code yourself

## API Security 🔑

### The Odds API Integration
We use The Odds API for real-time sports odds data:

- **API Key Handling** — Keys stored securely in Netlify environment variables
- **HTTPS Only** — All API calls use encrypted connections
- **Rate Limiting** — Respects API rate limits to prevent abuse
- **Data Validation** — Validates all API responses before use
- **Error Handling** — Graceful fallback on API failures

### No Credential Exposure
- API keys **never** appear in front-end code
- API keys **never** appear in repository
- API requests proxied through Netlify Functions (if needed)
- Client-side code uses public endpoints only

## Reporting Security Vulnerabilities 🚨

If you discover a security vulnerability, **please report it responsibly**:

### DO
- Email: **security@alexbet.io**
- Provide detailed description of the vulnerability
- Include steps to reproduce
- Allow 90 days for a fix before public disclosure
- Reference the vulnerability in your email subject

### DON'T
- Open a public GitHub issue for security bugs
- Share vulnerability details on social media
- Attempt to exploit vulnerabilities further
- Demand immediate payment or acknowledgment

### What to Include in Report

```
Subject: Security Vulnerability Report — [vulnerability type]

1. Description:
   [Clear description of the vulnerability]

2. Affected Component:
   [Which part of the app is affected]

3. Steps to Reproduce:
   1. [Step 1]
   2. [Step 2]
   3. [Step 3]

4. Impact:
   [What an attacker could do with this]

5. Proof of Concept:
   [Code or screenshots demonstrating the issue]

6. Recommended Fix:
   [If you have a solution]
```

## Security Response Process

1. **Acknowledgment** (within 24 hours) — We confirm receipt
2. **Assessment** (within 48 hours) — We verify the vulnerability
3. **Fix Development** (within 7 days) — We create a patch
4. **Testing** (within 14 days) — We thoroughly test the fix
5. **Release** (within 30 days) — We deploy the fix to production
6. **Disclosure** (after fix deployed) — We announce the fix and credit the reporter

### Security Update Process

Critical security patches are:
- Released as immediate updates
- Announced on all channels (GitHub, Telegram, email)
- Deployed to Netlify within hours
- Tested in production within 24 hours

## Security Best Practices 🛡️

### For Users
- Keep browser updated (auto-updates recommended)
- Clear browser cache regularly
- Use HTTPS (always on alexbet-lite.netlify.app)
- Don't share your browser with untrusted users
- Review exported CSVs before sharing

### For Developers
- Never commit API keys or secrets
- Use `.env.local` for sensitive configuration
- Validate all user inputs
- Escape output in DOM operations
- Use HTTPS for all external requests
- Keep dependencies updated

### Dependencies

All dependencies are reviewed for security:

```bash
npm audit
npm audit fix
```

We use:
- **Vite** — Build tool (security updates automatic)
- **Vitest** — Test runner (no production dependency)
- **ESLint** — Code quality (no production dependency)

## Browser Security

### Compatible Browsers
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ❌ Internet Explorer (not supported)

### Security Features
- Content Security Policy (CSP) headers
- X-Frame-Options to prevent clickjacking
- X-Content-Type-Options to prevent MIME-sniffing
- Cross-Origin Resource Sharing (CORS) validation

## Code Security Practices 📋

### Input Validation
All user inputs are validated:
```javascript
// Example: Bankroll validation
if (bankroll < 10) {
  throw new Error('Minimum bankroll is $10')
}
```

### Output Escaping
DOM operations safely escape HTML:
```javascript
// Safe: Uses textContent, not innerHTML
element.textContent = userInput
```

### Secure Random Generation
Cryptographically secure tokens:
```javascript
function generateToken() {
  return crypto.getRandomValues(new Uint8Array(32)).join('')
}
```

## HTTPS & Encryption 🔐

- **Live App:** All traffic encrypted (HTTPS)
- **Netlify CDN:** Global HTTPS, TLS 1.2+
- **No Mixed Content:** Never loads HTTP from HTTPS context
- **HSTS:** HTTP Strict Transport Security enabled

## Incident Response 🚨

If we detect a security incident:
1. **Immediate action** — Take affected feature offline if needed
2. **Investigation** — Assess scope and impact
3. **Notification** — Email users if data exposure likely
4. **Remediation** — Deploy fix and verify
5. **Post-mortem** — Document lessons learned publicly

## Security Audit Trail

- Last full security audit: April 2026
- Code review: Completed ✅
- Dependency audit: Passing ✅
- Penetration testing: Scheduled Q2 2026

## Open Source Security

Being open source provides benefits:
- **Transparency** — Anyone can review the code
- **Community Review** — Security researchers can audit
- **Fast Patches** — Community can report issues quickly
- **No Secret Vulnerabilities** — Code is publicly visible

## Compliance 📋

AlexBET Lite complies with:
- **GDPR** — No user data collection
- **CCPA** — No personal information storage
- **MIT License** — Open source, transparent
- **Security Standards** — OWASP Top 10 guidelines

## Security Checklist ✅

Before each release, we verify:
- [ ] No API keys in code or git history
- [ ] All inputs validated
- [ ] Output properly escaped
- [ ] Dependencies up-to-date
- [ ] No console errors/warnings
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Security headers present
- [ ] Tests passing (100%)
- [ ] Code reviewed for vulnerabilities

## Third-Party Security

We only integrate with trusted services:

### The Odds API
- Industry-standard sports data provider
- HTTPS encrypted
- No storage of user data
- Rate limited and monitored

### Netlify
- Industry-leading CDN and hosting
- DDoS protection
- Automatic HTTPS
- Security scanning
- Zero-knowledge hosting (we don't see user data)

## Questions About Security? 🤔

- **GitHub Issues:** Public security discussions (non-sensitive)
- **Email:** security@alexbet.io (sensitive issues)
- **Telegram:** [@AlexBETBot](https://t.me/AlexBETBot) (general questions)

---

**Your security and privacy matter to us.** Thank you for using AlexBET Lite responsibly. 🙏
