/**
 * HealthCheck - System health monitoring and diagnostics
 * Monitors all critical systems and detects issues proactively
 */

class HealthCheck {
  constructor() {
    this.checks = new Map();
    this.history = [];
    this.interval = null;
    this.maxHistory = 100;
    this.setupDefaultChecks();
  }

  /**
   * Setup default health checks
   */
  setupDefaultChecks() {
    // Storage health
    this.register('storage', async () => {
      try {
        const test = 'health_check_' + Date.now();
        localStorage.setItem(test, 'ok');
        const value = localStorage.getItem(test);
        localStorage.removeItem(test);

        if (value !== 'ok') {
          throw new Error('Storage read/write failed');
        }

        // Check quota
        const stats = this._getStorageStats();
        const percentUsed = (stats.used / stats.quota) * 100;

        return {
          status: percentUsed > 90 ? 'warning' : 'healthy',
          message: `${percentUsed.toFixed(1)}% quota used`,
          details: {
            used: stats.used,
            quota: stats.quota,
            percent: percentUsed.toFixed(1)
          }
        };
      } catch (err) {
        return {
          status: 'critical',
          message: err.message,
          error: err.toString()
        };
      }
    });

    // Memory health
    this.register('memory', async () => {
      if (performance.memory) {
        const used = performance.memory.usedJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        const percentUsed = (used / limit) * 100;

        return {
          status: percentUsed > 85 ? 'warning' : 'healthy',
          message: `${percentUsed.toFixed(1)}% of heap used`,
          details: {
            used: Math.round(used / 1024 / 1024) + 'MB',
            limit: Math.round(limit / 1024 / 1024) + 'MB',
            percent: percentUsed.toFixed(1)
          }
        };
      }

      return {
        status: 'unknown',
        message: 'Memory API not available'
      };
    });

    // Network health
    this.register('network', async () => {
      try {
        if (!navigator.onLine) {
          return {
            status: 'critical',
            message: 'Network offline',
            online: false
          };
        }

        return {
          status: 'healthy',
          message: 'Network online',
          online: true,
          connectionType: navigator.connection?.effectiveType || 'unknown'
        };
      } catch (err) {
        return {
          status: 'unknown',
          message: 'Could not determine network status'
        };
      }
    });

    // DOM health
    this.register('dom', async () => {
      try {
        const elements = document.querySelectorAll('[id]').length;
        const errors = window.__ERRORS__ || [];

        return {
          status: errors.length > 10 ? 'warning' : 'healthy',
          message: `DOM ready with ${elements} indexed elements`,
          details: {
            elements,
            recentErrors: errors.length
          }
        };
      } catch (err) {
        return {
          status: 'warning',
          message: 'DOM check error: ' + err.message
        };
      }
    });

    // Browser health
    this.register('browser', async () => {
      const checks = {
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        fetch: !!window.fetch,
        crypto: !!window.crypto,
        promise: !!window.Promise
      };

      const missingFeatures = Object.entries(checks)
        .filter(([_, available]) => !available)
        .map(([feature, _]) => feature);

      return {
        status: missingFeatures.length > 0 ? 'warning' : 'healthy',
        message: missingFeatures.length === 0 ? 'All required APIs available' : `Missing: ${missingFeatures.join(', ')}`,
        features: checks
      };
    });

    console.log('[HealthCheck] Default checks registered');
  }

  /**
   * Register a health check
   */
  register(name, checkFn) {
    if (typeof checkFn !== 'function') {
      throw new Error('Check must be a function');
    }

    this.checks.set(name, {
      fn: checkFn,
      lastRun: null,
      lastResult: null,
      interval: null
    });

    console.log(`[HealthCheck] Registered check: ${name}`);
  }

  /**
   * Run a single check
   */
  async runCheck(name) {
    const check = this.checks.get(name);

    if (!check) {
      throw new Error(`Check not found: ${name}`);
    }

    try {
      const result = await Promise.race([
        check.fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        )
      ]);

      const fullResult = {
        name,
        timestamp: new Date().toISOString(),
        duration: Date.now() - check.lastRun,
        ...result
      };

      check.lastRun = Date.now();
      check.lastResult = fullResult;

      return fullResult;
    } catch (err) {
      const errorResult = {
        name,
        timestamp: new Date().toISOString(),
        status: 'error',
        message: err.message,
        error: err.toString()
      };

      check.lastResult = errorResult;
      return errorResult;
    }
  }

  /**
   * Run all checks
   */
  async runAll() {
    const results = [];
    const timestamp = new Date().toISOString();

    for (const [name, _] of this.checks) {
      const result = await this.runCheck(name);
      results.push(result);
    }

    const report = {
      timestamp,
      checks: results,
      overall: this._calculateOverallStatus(results),
      summary: this._summarizeResults(results)
    };

    // Add to history
    this.history.push(report);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return report;
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(intervalMs = 30000) {
    if (this.interval) {
      console.warn('[HealthCheck] Checks already running');
      return;
    }

    this.interval = setInterval(async () => {
      const report = await this.runAll();

      // Log if any issues
      if (report.overall.status !== 'healthy') {
        console.warn('[HealthCheck] Issues detected:', report.summary);

        // Notify app
        if (window.app && window.app.onHealthIssue) {
          window.app.onHealthIssue(report);
        }
      }
    }, intervalMs);

    console.log(`[HealthCheck] Periodic checks started (${intervalMs}ms)`);
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('[HealthCheck] Periodic checks stopped');
    }
  }

  /**
   * Get health report
   */
  getLatestReport() {
    return this.history[this.history.length - 1] || null;
  }

  /**
   * Get health history
   */
  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }

  /**
   * Generate health report
   */
  generateReport() {
    const latest = this.getLatestReport();

    if (!latest) {
      return 'No health checks have been run yet';
    }

    let report = `
=== System Health Report ===
Generated: ${latest.timestamp}
Overall Status: ${latest.overall.status.toUpperCase()}

Individual Checks:
${latest.checks.map(check => `- ${check.name}: ${check.status} - ${check.message}`).join('\n')}

Summary:
${Object.entries(latest.summary)
  .map(([status, count]) => `- ${status}: ${count}`)
  .join('\n')}

Recommendations:
${this._getRecommendations(latest)}
    `;

    return report;
  }

  /**
   * Calculate overall status
   */
  _calculateOverallStatus(results) {
    const statuses = results.map(r => r.status);

    const hasError = statuses.includes('error');
    const hasCritical = statuses.includes('critical');
    const hasWarning = statuses.includes('warning');

    return {
      status: hasError || hasCritical ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy',
      requiresAction: hasError || hasCritical
    };
  }

  /**
   * Summarize results
   */
  _summarizeResults(results) {
    const summary = {
      healthy: 0,
      warning: 0,
      critical: 0,
      error: 0,
      unknown: 0
    };

    results.forEach(result => {
      const status = result.status || 'unknown';
      if (status in summary) {
        summary[status]++;
      }
    });

    return summary;
  }

  /**
   * Get recommendations based on checks
   */
  _getRecommendations(report) {
    const recommendations = [];

    report.checks.forEach(check => {
      if (check.status === 'critical') {
        switch (check.name) {
          case 'storage':
            recommendations.push('- ⚠️ Storage quota critically low - clear old data');
            break;
          case 'network':
            recommendations.push('- ⚠️ Network offline - restore connectivity');
            break;
          default:
            recommendations.push(`- ⚠️ Critical issue in ${check.name}: ${check.message}`);
        }
      } else if (check.status === 'warning') {
        switch (check.name) {
          case 'storage':
            recommendations.push('- ℹ️ Storage quota approaching limit - consider cleanup');
            break;
          case 'memory':
            recommendations.push('- ℹ️ High memory usage - consider refreshing page');
            break;
          default:
            recommendations.push(`- ℹ️ Warning in ${check.name}: ${check.message}`);
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('- ✅ All systems operating normally');
    }

    return recommendations.join('\n');
  }

  /**
   * Get storage stats
   */
  _getStorageStats() {
    try {
      let used = 0;

      // Estimate by serializing all localStorage
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += key.length + localStorage[key].length;
        }
      }

      // Rough quota estimate (typically 5-10MB per domain)
      const quota = 10 * 1024 * 1024;

      return { used, quota };
    } catch (err) {
      return { used: 0, quota: 5 * 1024 * 1024 };
    }
  }

  /**
   * Export report as JSON
   */
  exportReport() {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      latestReport: this.getLatestReport(),
      history: this.getHistory(20)
    }, null, 2);
  }

  /**
   * Print report to console
   */
  printReport() {
    console.log(this.generateReport());
  }
}

// Create global instance
const healthCheck = new HealthCheck();

// Auto-start periodic checks
healthCheck.startPeriodicChecks(60000); // Every 60 seconds

console.log('[HealthCheck] Initialized and monitoring');
