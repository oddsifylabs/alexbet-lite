# AlexBET Lite — Phase 6 Action Plan

**Current Status:** A- Grade (92/100) — Production Ready  
**Live URL:** https://alexbetlite.netlify.app/  
**GitHub:** https://github.com/oddsifylabs/alexbet-lite

---

## Phase 6 Roadmap (2-4 weeks)

### Week 1: Foundation (8 hours)
- [ ] **Add Jest test framework** (2h)
  ```bash
  npm install --save-dev jest @babel/preset-env
  npm init jest@latest
  ```
- [ ] **Add API rate limiter** (3h)
  - Create `src/classes/RateLimiter.js`
  - Integrate into `LiveScoreFetcher.js`
  - Max 10 API calls/min

- [ ] **Set up Sentry error tracking** (3h)
  - Create Sentry account at sentry.io
  - Add `@sentry/browser` package
  - Initialize in `src/app.js`
  - Get DSN and add to Netlify env vars

**Deliverable:** Foundation for improved monitoring and testing

---

### Week 2: Test Coverage (12 hours)
- [ ] **Increase unit test coverage to 70%** (8h)
  - Focus on `Analytics.js`, `BetValidator.js`, `EnhancedStatistics.js`
  - Add error handling tests
  - Test edge cases (empty arrays, invalid inputs)

- [ ] **Add integration tests** (4h)
  - Full workflow tests (add bet → mark won → check ROI)
  - API integration tests
  - Data persistence tests

**Deliverable:** Comprehensive test suite with 70%+ coverage

---

### Week 3: Code Quality (10 hours)
- [ ] **Refactor app.js** (6h)
  - Extract tab management → `TabManager.js`
  - Extract form handling → `FormHandler.js`
  - Extract UI rendering → `UIRenderer.js`
  - Keep app.js < 200 lines

- [ ] **Clean up console logging** (2h)
  - Replace with proper logging levels
  - Create `Logger.js` utility
  - DEBUG/INFO/WARN/ERROR levels

- [ ] **Add JSDoc comments** (2h)
  - Document all public methods
  - Add parameter and return types
  - Improve IDE autocomplete

**Deliverable:** Cleaner, more maintainable codebase

---

### Week 4: Operations (12 hours)
- [ ] **Add cloud backup** (6h)
  - Optional Supabase integration
  - Sync bets on demand
  - Privacy-first approach

- [ ] **Performance optimization** (4h)
  - Minify CSS/JS in build
  - Optimize images (already SVG)
  - Add gzip compression

- [ ] **Documentation updates** (2h)
  - Update README with new features
  - Add developer guide
  - Document API contracts

**Deliverable:** Production-grade operations setup

---

## Quick Wins (Can do in parallel)

### 1. API Rate Limiting (High Priority) - 3 hours
```javascript
// src/classes/RateLimiter.js
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = {};
  }
  
  isAllowed(key = 'default') {
    const now = Date.now();
    if (!this.requests[key]) {
      this.requests[key] = [];
    }
    
    // Remove old requests
    this.requests[key] = this.requests[key].filter(
      time => now - time < this.windowMs
    );
    
    // Check limit
    if (this.requests[key].length < this.maxRequests) {
      this.requests[key].push(now);
      return true;
    }
    return false;
  }
  
  getRemaining(key = 'default') {
    if (!this.requests[key]) return this.maxRequests;
    return Math.max(0, this.maxRequests - this.requests[key].length);
  }
}
```

### 2. Sentry Error Tracking (Medium Priority) - 2 hours
```javascript
// In src/app.js
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Capture errors
try {
  addBet();
} catch (error) {
  Sentry.captureException(error);
  showUserError('Failed to add bet');
}
```

### 3. Test Framework Setup (High Priority) - 2 hours
```bash
npm install --save-dev jest @babel/preset-env babel-jest
echo 'module.exports = {testEnvironment: "jsdom"};' > jest.config.js

# Add to package.json scripts
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

---

## KPIs to Track

After Phase 6 completion:

| Metric | Current | Target | Impact |
|--------|---------|--------|--------|
| Test Coverage | 23% | 70%+ | Reduce bugs 30-40% |
| API Rate Limits | None | 10/min | Prevent abuse |
| Error Tracking | Console only | Sentry | Production visibility |
| Code Modularity | 1 large file | Split into modules | 40% faster changes |
| Performance | Good | Optimized | 20-30% faster load |

---

## Effort Estimate

| Phase | Tasks | Hours | Weeks |
|-------|-------|-------|-------|
| **Phase 6** | Jest, Rate Limiter, Sentry, Tests, Refactoring | 40h | 2-3 |
| **Phase 7** | TypeScript, Cloud Backup, Advanced Analytics | 60h | 4-6 |
| **Phase 8** | Mobile App, Multi-user, Premium Features | 80h+ | 6-8 |

---

## Success Criteria for Phase 6

✅ Test coverage ≥ 70%  
✅ Zero Sentry errors in production  
✅ API calls rate limited  
✅ app.js modularized < 250 lines  
✅ All deployment checklist items passing  
✅ Mobile responsive verified  

---

## Notes

- **Backward Compatibility:** All Phase 6 changes maintain backward compatibility
- **User Impact:** No UI/UX changes—purely backend improvements
- **Migration:** No data migration needed
- **Deployment:** Auto-deploy from GitHub on merge to main

---

## Questions?

Review audit report: `AUDIT_REPORT_PRODUCTION.md`

