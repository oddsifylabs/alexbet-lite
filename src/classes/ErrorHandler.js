/**
 * ErrorHandler - Comprehensive error handling and recovery
 * Implements graceful degradation, retry logic, and detailed logging
 */

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 500;
    this.globalErrorHandlers = [];
    this.setupGlobalHandlers();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Uncaught errors
    window.addEventListener('error', (event) => {
      this.logError(
        'uncaught_error',
        event.error || event.message,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        'unhandled_promise_rejection',
        event.reason,
        {
          promise: event.promise.toString()
        }
      );
    });

    console.log('[ErrorHandler] Global handlers installed');
  }

  /**
   * Log an error with full context
   */
  logError(type, error, context = {}) {
    const errorEntry = {
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      type,
      message: error?.message || String(error),
      stack: error?.stack || null,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent.substring(0, 100),
        ...context
      }
    };

    this.errors.push(errorEntry);

    // Keep only last 500 errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console
    console.error(`[${type}]`, error, context);

    // Call handlers
    this.globalErrorHandlers.forEach(handler => {
      try {
        handler(errorEntry);
      } catch (err) {
        console.error('Error in error handler:', err);
      }
    });

    return errorEntry;
  }

  /**
   * Retry a function with exponential backoff
   */
  async retry(fn, options = {}) {
    const {
      maxAttempts = 3,
      initialDelay = 100,
      maxDelay = 10000,
      backoffMultiplier = 2,
      onRetry = null,
      context = {}
    } = options;

    let lastError = null;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Retry] Attempt ${attempt}/${maxAttempts}`, context);
        const result = await fn();
        return { success: true, data: result, attempts: attempt };
      } catch (err) {
        lastError = err;

        if (attempt < maxAttempts) {
          // Call retry handler
          if (onRetry) {
            onRetry({ attempt, maxAttempts, delay, error: err });
          }

          // Wait before retry
          await this._sleep(delay);

          // Increase delay exponentially, cap at maxDelay
          delay = Math.min(delay * backoffMultiplier, maxDelay);
        }
      }
    }

    // All attempts failed
    this.logError('retry_exhausted', lastError, {
      attempts: maxAttempts,
      context
    });

    return {
      success: false,
      error: lastError,
      attempts: maxAttempts
    };
  }

  /**
   * Wrap async function with error handling
   */
  async safeCall(fn, options = {}) {
    const {
      name = 'operation',
      defaultReturn = null,
      shouldRetry = false,
      retryOptions = {}
    } = options;

    try {
      if (shouldRetry) {
        return await this.retry(fn, retryOptions);
      }

      const result = await fn();
      return { success: true, data: result };
    } catch (err) {
      this.logError(`${name}_failed`, err);
      return { success: false, error: err, data: defaultReturn };
    }
  }

  /**
   * Validate and handle API response
   */
  validateAPIResponse(response, options = {}) {
    const {
      expectedStatus = 200,
      requireJson = false,
      maxSize = 10485760 // 10MB
    } = options;

    const errors = [];

    // Status check
    if (response.status !== expectedStatus) {
      errors.push(`Expected status ${expectedStatus}, got ${response.status}`);
    }

    // Content-Type check
    if (requireJson) {
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        errors.push(`Expected JSON response, got ${contentType}`);
      }
    }

    // Size check
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      errors.push(`Response too large: ${contentLength} bytes (max ${maxSize})`);
    }

    if (errors.length > 0) {
      this.logError('api_response_invalid', new Error(errors.join('; ')), {
        status: response.status,
        url: response.url
      });

      return {
        valid: false,
        errors
      };
    }

    return {
      valid: true,
      errors: []
    };
  }

  /**
   * Handle API error with recovery
   */
  handleAPIError(error, context = {}) {
    let errorType = 'api_error';
    let severity = 'error';
    let recoverable = false;
    let suggestedAction = null;

    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      errorType = 'network_error';
      severity = 'warning';
      recoverable = true;
      suggestedAction = 'Check internet connection and retry';
    } else if (error.message.includes('429')) {
      errorType = 'rate_limit_exceeded';
      severity = 'warning';
      recoverable = true;
      suggestedAction = 'Too many requests, please wait before retrying';
    } else if (error.message.includes('401')) {
      errorType = 'authentication_failed';
      severity = 'error';
      recoverable = false;
      suggestedAction = 'Authentication required. Please refresh and login.';
    } else if (error.message.includes('403')) {
      errorType = 'forbidden';
      severity = 'error';
      recoverable = false;
      suggestedAction = 'Access denied to this resource';
    } else if (error.message.includes('404')) {
      errorType = 'not_found';
      severity = 'warning';
      recoverable = false;
      suggestedAction = 'Resource not found';
    } else if (error.message.includes('500')) {
      errorType = 'server_error';
      severity = 'error';
      recoverable = true;
      suggestedAction = 'Server error, please try again later';
    }

    const errorEntry = this.logError(errorType, error, {
      severity,
      recoverable,
      suggestedAction,
      ...context
    });

    return {
      type: errorType,
      severity,
      recoverable,
      suggestedAction,
      error: errorEntry
    };
  }

  /**
   * Register global error handler
   */
  onError(callback) {
    this.globalErrorHandlers.push(callback);
  }

  /**
   * Get errors filtered by criteria
   */
  getErrors(filters = {}) {
    let filtered = [...this.errors];

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters.since) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(filters.since));
    }

    // Return newest first
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get error summary
   */
  getSummary() {
    const summary = {
      totalErrors: this.errors.length,
      byType: {},
      recent: this.errors.slice(-10),
      trends: {
        last5min: 0,
        last1hour: 0,
        last24hours: 0
      }
    };

    const now = Date.now();
    const fiveMinAgo = now - (5 * 60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    this.errors.forEach(err => {
      const time = new Date(err.timestamp).getTime();

      // Count by type
      summary.byType[err.type] = (summary.byType[err.type] || 0) + 1;

      // Trends
      if (time > fiveMinAgo) summary.trends.last5min++;
      if (time > oneHourAgo) summary.trends.last1hour++;
      if (time > oneDayAgo) summary.trends.last24hours++;
    });

    return summary;
  }

  /**
   * Clear errors
   */
  clear() {
    const count = this.errors.length;
    this.errors = [];
    console.log(`[ErrorHandler] Cleared ${count} errors`);
    return count;
  }

  /**
   * Export errors as JSON
   */
  exportErrors() {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      errors: this.errors,
      summary: this.getSummary()
    }, null, 2);
  }

  /**
   * Generate error report
   */
  generateReport() {
    const summary = this.getSummary();

    let report = `
=== Error Report ===
Generated: ${new Date().toISOString()}

Total Errors: ${summary.totalErrors}

By Type:
${Object.entries(summary.byType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

Trends:
- Last 5 minutes: ${summary.trends.last5min}
- Last 1 hour: ${summary.trends.last1hour}
- Last 24 hours: ${summary.trends.last24hours}

Recent Errors (last 10):
${summary.recent.map(e => `- [${e.type}] ${e.message} (${e.timestamp})`).join('\n')}
    `;

    return report;
  }

  /**
   * Graceful degradation helper
   */
  async tryWithFallback(primaryFn, fallbackFn, options = {}) {
    const {
      name = 'operation',
      logErrors = true
    } = options;

    try {
      console.log(`[Fallback] Attempting primary: ${name}`);
      const result = await primaryFn();
      console.log(`[Fallback] Primary succeeded: ${name}`);
      return { success: true, data: result, source: 'primary' };
    } catch (primaryErr) {
      if (logErrors) {
        this.logError(`${name}_primary_failed`, primaryErr);
      }

      try {
        console.log(`[Fallback] Attempting fallback: ${name}`);
        const result = await fallbackFn();
        console.log(`[Fallback] Fallback succeeded: ${name}`);
        return { success: true, data: result, source: 'fallback' };
      } catch (fallbackErr) {
        if (logErrors) {
          this.logError(`${name}_fallback_failed`, fallbackErr);
        }

        return {
          success: false,
          error: fallbackErr,
          source: 'fallback',
          primaryError: primaryErr
        };
      }
    }
  }

  /**
   * Circuit breaker for failing services
   */
  createCircuitBreaker(fn, options = {}) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000,
      name = 'service'
    } = options;

    const state = {
      failures: 0,
      successes: 0,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      lastFailTime: null,
      lastResetTime: Date.now()
    };

    return async (...args) => {
      // Check if should reset
      if (state.state === 'OPEN') {
        const timeSinceLastFail = Date.now() - state.lastFailTime;
        if (timeSinceLastFail > resetTimeout) {
          console.log(`[CircuitBreaker] ${name} - transitioning to HALF_OPEN`);
          state.state = 'HALF_OPEN';
          state.successes = 0;
        } else {
          return {
            success: false,
            error: new Error(`Circuit breaker OPEN for ${name}`),
            circuitState: 'OPEN'
          };
        }
      }

      // Try to execute
      try {
        const result = await fn(...args);

        if (state.state === 'HALF_OPEN') {
          state.successes++;
          if (state.successes >= 2) {
            console.log(`[CircuitBreaker] ${name} - closed`);
            state.state = 'CLOSED';
            state.failures = 0;
            state.successes = 0;
          }
        } else {
          state.failures = 0;
        }

        return { success: true, data: result, circuitState: state.state };
      } catch (err) {
        state.failures++;
        state.lastFailTime = Date.now();

        if (state.failures >= failureThreshold) {
          console.log(`[CircuitBreaker] ${name} - opened after ${state.failures} failures`);
          state.state = 'OPEN';
        }

        return {
          success: false,
          error: err,
          failures: state.failures,
          circuitState: state.state
        };
      }
    };
  }

  /**
   * Utility: Sleep/delay
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate ID
   */
  _generateId() {
    return `err_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

// Create global instance
const errorHandler = new ErrorHandler();

console.log('[ErrorHandler] Initialized with global error capture');
