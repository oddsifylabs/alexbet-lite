# Reliability & Error Handling Guide

**Status:** ✅ Phase 3: Reliability Complete  
**Version:** v2026.04.18  
**Last Updated:** April 18, 2026

## 🛡️ Reliability Architecture

AlexBET Lite implements multiple layers of error handling, recovery, and monitoring to ensure reliability under adverse conditions.

### Architecture Layers

```
┌──────────────────────────────────────────────────────┐
│  Layer 1: Error Handler (Global)                     │
│           - Uncaught errors                          │
│           - Unhandled promise rejections             │
│           - Structured logging                       │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│  Layer 2: Retry Logic                                │
│           - Exponential backoff                      │
│           - Configurable delays                      │
│           - Max attempt limits                       │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│  Layer 3: Graceful Degradation                       │
│           - Fallback mechanisms                      │
│           - Cache-based recovery                     │
│           - Circuit breaker pattern                  │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│  Layer 4: Health Check                               │
│           - Continuous monitoring                    │
│           - Issue detection                          │
│           - Proactive warnings                       │
└──────────────────────────────────────────────────────┘
```

## 🔧 Error Handler

### Features

**Global Error Capture:**
```javascript
// Automatically captures:
- window.onerror events
- Unhandled promise rejections
- Custom error logs

// Access via:
const errors = errorHandler.getErrors();
const summary = errorHandler.getSummary();
```

### Retry Logic with Exponential Backoff

```javascript
// Automatic retry with backoff
const result = await errorHandler.retry(
  async () => {
    return await riskyOperation();
  },
  {
    maxAttempts: 3,           // Try 3 times
    initialDelay: 100,        // Start with 100ms
    maxDelay: 10000,          // Cap at 10 seconds
    backoffMultiplier: 2,     // Double each time
    onRetry: (info) => {
      console.log(`Retry attempt ${info.attempt}`);
    }
  }
);

if (result.success) {
  console.log('Succeeded on attempt', result.attempts);
} else {
  console.error('Failed after', result.attempts, 'attempts');
}
```

**Backoff Timeline:**
```
Attempt 1: Immediate
Attempt 2: Wait 100ms, then try
Attempt 3: Wait 200ms, then try
(caps at 10000ms)
```

### Safe Function Calls

```javascript
// Wrap any function with automatic error handling
const result = await errorHandler.safeCall(
  async () => {
    return await fetchUserData();
  },
  {
    name: 'fetchUserData',
    defaultReturn: [],
    shouldRetry: true,
    retryOptions: { maxAttempts: 2 }
  }
);

if (result.success) {
  processData(result.data);
} else {
  useDefault(result.data);
}
```

### API Error Handling

```javascript
// Validate API responses
const validation = errorHandler.validateAPIResponse(response, {
  expectedStatus: 200,
  requireJson: true,
  maxSize: 10485760 // 10MB
});

if (!validation.valid) {
  console.log('Response validation failed:', validation.errors);
}

// Handle API errors with recovery suggestions
const handled = errorHandler.handleAPIError(error, {
  endpoint: '/api/scores',
  sport: 'NBA'
});

console.log(handled.suggestedAction);
// Example: "Too many requests, please wait before retrying"
```

## 🔄 Graceful Degradation

### Try-Fallback Pattern

```javascript
// Try primary, fall back to secondary
const result = await errorHandler.tryWithFallback(
  async () => {
    // Primary: Fetch from live API
    return await liveScores.getScore('Heat', 'NBA');
  },
  async () => {
    // Fallback: Use cached data
    return getCachedScore('Heat', 'NBA');
  },
  { name: 'liveScores' }
);

if (result.success) {
  console.log('Data source:', result.source); // 'primary' or 'fallback'
  useScoreData(result.data);
}
```

### Circuit Breaker Pattern

```javascript
// Automatically disable failing services
const safeFetch = errorHandler.createCircuitBreaker(
  async (url) => {
    return await fetch(url).then(r => r.json());
  },
  {
    failureThreshold: 5,    // Open after 5 failures
    resetTimeout: 60000,    // Try again after 60s
    name: 'ESPN API'
  }
);

// Usage
const result = await safeFetch('https://api.espn.com/scores');

if (result.circuitState === 'OPEN') {
  console.log('Circuit broken - service recovering');
  // Use fallback data
}
```

**States:**
- **CLOSED:** Normal operation
- **OPEN:** Too many failures, rejecting requests
- **HALF_OPEN:** Testing if service recovered

## 📊 Health Monitoring

### Built-in Health Checks

**1. Storage Health**
```javascript
// Monitors LocalStorage quota
// Status: healthy (< 90%), warning (90-95%), critical (> 95%)
const report = await healthCheck.runCheck('storage');
// { status: 'healthy', message: '42.5% quota used', ... }
```

**2. Memory Health**
```javascript
// Monitors heap usage
const report = await healthCheck.runCheck('memory');
// { status: 'warning', message: '85.3% of heap used', ... }
```

**3. Network Health**
```javascript
// Checks connectivity
const report = await healthCheck.runCheck('network');
// { status: 'healthy', online: true, ... }
```

**4. DOM Health**
```javascript
// Verifies DOM is functioning
const report = await healthCheck.runCheck('dom');
// { status: 'healthy', message: 'DOM ready', ... }
```

**5. Browser Health**
```javascript
// Checks required APIs available
const report = await healthCheck.runCheck('browser');
// { status: 'healthy', features: { localStorage: true, ... }, ... }
```

### Running Health Checks

```javascript
// Run all checks once
const report = await healthCheck.runAll();

console.log(report.overall);  // { status: 'healthy', requiresAction: false }
console.log(report.summary);  // { healthy: 5, warning: 0, critical: 0, error: 0 }

// Start periodic checks (every 60 seconds)
healthCheck.startPeriodicChecks(60000);

// Stop periodic checks
healthCheck.stopPeriodicChecks();

// Get latest report
const latest = healthCheck.getLatestReport();

// Get history (last 10 checks)
const history = healthCheck.getHistory(10);

// Print report
healthCheck.printReport();
```

### Custom Health Checks

```javascript
// Add your own check
healthCheck.register('databaseConnection', async () => {
  try {
    // Check your custom system
    const response = await fetch('/api/health');

    return {
      status: response.ok ? 'healthy' : 'critical',
      message: `API returned ${response.status}`,
      details: { response: response.status }
    };
  } catch (err) {
    return {
      status: 'error',
      message: err.message,
      error: err.toString()
    };
  }
});

// Run the new check
await healthCheck.runCheck('databaseConnection');
```

## 🚨 Error Tracking & Monitoring

### Log Errors

```javascript
// Log error with context
errorHandler.logError('api_failure', error, {
  endpoint: '/api/scores',
  retries: 3,
  lastAttemptTime: Date.now()
});

// Get all errors of a type
const apiErrors = errorHandler.getErrors({
  type: 'api_failure',
  since: new Date(Date.now() - 3600000) // Last hour
});

// Get summary
const summary = errorHandler.getSummary();
console.log(summary.totalErrors);        // 42
console.log(summary.byType);             // { api_failure: 5, timeout: 3, ... }
console.log(summary.trends.last1hour);   // 8 errors in last hour
```

### Register Error Handlers

```javascript
// Run callback when errors occur
errorHandler.onError((errorEntry) => {
  if (errorEntry.type === 'api_failure') {
    // Notify user
    showAlert('⚠️ API error - retrying...', 'warning');

    // Send to monitoring
    sendToErrorTracking(errorEntry);
  }

  if (errorEntry.type === 'uncaught_error') {
    // Critical - notify support
    alertSupport(errorEntry);
  }
});
```

### Export Logs

```javascript
// Export all errors as JSON
const json = errorHandler.exportErrors();
downloadFile('errors.json', json);

// Generate report
const report = errorHandler.generateReport();
console.log(report);
```

## 🎯 Reliability Best Practices

### For Developers

**1. Always use error handler for risky operations:**
```javascript
// ❌ BAD
try {
  await fetchData();
} catch (err) {
  console.error(err); // Silent failure
}

// ✅ GOOD
const result = await errorHandler.retry(
  () => fetchData(),
  { maxAttempts: 3 }
);
if (!result.success) {
  errorHandler.logError('fetch_failed', result.error);
  showFallback();
}
```

**2. Implement fallback mechanisms:**
```javascript
// ✅ GOOD - Try primary, fall back to cached
const data = await errorHandler.tryWithFallback(
  () => fetchLive(),
  () => getFromCache(),
  { name: 'scoreData' }
);
```

**3. Monitor health proactively:**
```javascript
// Start monitoring at app startup
healthCheck.startPeriodicChecks(30000);

// React to issues
healthCheck.onHealthIssue((report) => {
  if (report.summary.critical > 0) {
    notifyUser('System having issues, some features limited');
  }
});
```

**4. Log important events:**
```javascript
// Log user actions
errorHandler.logError('user_action', null, {
  action: 'place_bet',
  sport: 'NBA',
  amount: 100
});
```

### For Users

1. **Monitor notifications** - Watch for warnings
2. **Check health** - Access health reports when issues occur
3. **Clear cache** - Periodically clear old data
4. **Update browser** - Keep browser current
5. **Refresh page** - If experiencing issues, refresh

## 📋 Error Types

| Type | Severity | Recoverable | Action |
|------|----------|-------------|--------|
| Network Error | Warning | Yes | Retry with backoff |
| Rate Limited (429) | Warning | Yes | Wait and retry |
| Auth Failed (401) | Error | No | Refresh and login |
| Forbidden (403) | Error | No | Check permissions |
| Not Found (404) | Warning | No | Check URL |
| Server Error (500) | Error | Yes | Retry later |
| Storage Full | Error | Maybe | Cleanup data |
| Memory High | Warning | Yes | Refresh page |

## 🔍 Monitoring Dashboard

```javascript
// Create a monitoring dashboard
function displayMonitoring() {
  const health = healthCheck.getLatestReport();
  const errors = errorHandler.getSummary();

  console.log(`
    === System Status ===
    Health: ${health.overall.status}
    Total Errors: ${errors.totalErrors}
    Recent Errors: ${errors.trends.last5min}
    
    Health Issues:
    ${health.summary}
  `);
}

// Call periodically
setInterval(displayMonitoring, 60000);
```

## 🚀 API Reference

### ErrorHandler

```javascript
// Retry logic
errorHandler.retry(fn, options)        // Retry with backoff
errorHandler.safeCall(fn, options)     // Wrap with error handling

// API handling
errorHandler.validateAPIResponse(response, options)
errorHandler.handleAPIError(error, context)

// Patterns
errorHandler.tryWithFallback(primary, fallback, options)
errorHandler.createCircuitBreaker(fn, options)

// Tracking
errorHandler.logError(type, error, context)
errorHandler.getErrors(filters)        // Query logs
errorHandler.getSummary()               // Error statistics
errorHandler.exportErrors()             // JSON export
errorHandler.generateReport()           // Full report
errorHandler.onError(callback)          // Register handler
```

### HealthCheck

```javascript
// Checks
healthCheck.register(name, checkFn)    // Add custom check
healthCheck.runCheck(name)              // Run single check
healthCheck.runAll()                    // Run all checks

// Monitoring
healthCheck.startPeriodicChecks(ms)    // Start auto-check
healthCheck.stopPeriodicChecks()       // Stop auto-check

// History
healthCheck.getLatestReport()           // Most recent
healthCheck.getHistory(limit)           // Recent history

// Reports
healthCheck.generateReport()            // Full report
healthCheck.printReport()               // Print to console
healthCheck.exportReport()              // JSON export
```

## 📈 Metrics & KPIs

**Reliability Metrics:**
- Error rate (errors per 1000 operations)
- Mean time to recovery (MTTR)
- Success rate of retries
- Cache hit rate
- Fallback usage rate

**Health Metrics:**
- Storage utilization %
- Memory usage %
- Network connectivity
- DOM responsiveness
- Browser API availability

## 🔄 Future Enhancements

- [ ] Automated backups
- [ ] Service worker integration
- [ ] Offline mode
- [ ] Real-time monitoring UI
- [ ] Error trend analysis
- [ ] Predictive alerts
- [ ] Performance metrics
- [ ] Dependency health tracking

---

**Built for reliability** 🛡️  
*Production-grade error handling and recovery*

Last Updated: April 18, 2026
