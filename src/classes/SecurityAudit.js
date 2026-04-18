/**
 * SecurityAudit - Logging and monitoring of security events
 * Tracks suspicious activity and security posture
 */

class SecurityAudit {
  constructor(maxLogSize = 1000) {
    this.maxLogSize = maxLogSize;
    this.logs = this.loadLogs();
    this.sessionId = this._generateSessionId();
    this.startTime = Date.now();

    console.log(`[SecurityAudit] Session ${this.sessionId} started`);
  }

  /**
   * Load logs from localStorage
   */
  loadLogs() {
    try {
      const data = localStorage.getItem('alexbet_security_logs');
      if (!data) return [];

      const logs = JSON.parse(data);
      if (!Array.isArray(logs)) return [];

      // Keep only last 1000 logs
      return logs.slice(-1000);
    } catch (err) {
      console.error('[SecurityAudit] Error loading logs:', err);
      return [];
    }
  }

  /**
   * Save logs to localStorage
   */
  saveLogs() {
    try {
      const data = JSON.stringify(this.logs.slice(-this.maxLogSize));
      localStorage.setItem('alexbet_security_logs', data);
    } catch (err) {
      console.error('[SecurityAudit] Error saving logs:', err);
    }
  }

  /**
   * Log security event
   */
  logEvent(eventType, severity = 'INFO', details = {}) {
    const logEntry = {
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      eventType,
      severity, // INFO, WARNING, ERROR, CRITICAL
      userAgent: navigator.userAgent.substring(0, 100),
      url: window.location.href,
      ...details
    };

    this.logs.push(logEntry);

    // Log to console
    const logLevel = severity === 'CRITICAL' ? 'error' : severity === 'ERROR' ? 'error' : 'warn';
    console[logLevel](`[SecurityAudit] ${eventType}:`, logEntry);

    // Save immediately for important events
    if (['ERROR', 'CRITICAL'].includes(severity)) {
      this.saveLogs();
    }

    return logEntry;
  }

  /**
   * Log XSS attempt
   */
  logXSSAttempt(field, patterns, value = null) {
    return this.logEvent('XSS_ATTEMPT', 'WARNING', {
      field,
      patterns,
      valuePreview: value ? value.substring(0, 100) : null
    });
  }

  /**
   * Log injection attempt
   */
  logInjectionAttempt(type, value = null) {
    return this.logEvent('INJECTION_ATTEMPT', 'ERROR', {
      type, // SQL_INJECTION, COMMAND_INJECTION, etc.
      valuePreview: value ? value.substring(0, 100) : null
    });
  }

  /**
   * Log authentication event
   */
  logAuthEvent(status, details = {}) {
    return this.logEvent('AUTH_EVENT', 'INFO', {
      status, // SUCCESS, FAILURE, EXPIRED
      ...details
    });
  }

  /**
   * Log data access
   */
  logDataAccess(resource, action, success = true) {
    return this.logEvent('DATA_ACCESS', 'INFO', {
      resource,
      action, // READ, CREATE, UPDATE, DELETE
      success
    });
  }

  /**
   * Log rate limit violation
   */
  logRateLimit(endpoint, attempts, limit) {
    return this.logEvent('RATE_LIMIT', 'WARNING', {
      endpoint,
      attempts,
      limit
    });
  }

  /**
   * Log storage quota issue
   */
  logStorageQuota(used, available) {
    return this.logEvent('STORAGE_QUOTA', 'WARNING', {
      usedBytes: used,
      availableBytes: available,
      percentUsed: ((used / available) * 100).toFixed(1)
    });
  }

  /**
   * Log validation failure
   */
  logValidationFailure(field, errors) {
    return this.logEvent('VALIDATION_FAILURE', 'WARNING', {
      field,
      errorCount: errors.length,
      errors: errors.slice(0, 3) // Log first 3 errors
    });
  }

  /**
   * Get logs filtered by criteria
   */
  getLogs(filters = {}) {
    let filtered = [...this.logs];

    if (filters.eventType) {
      filtered = filtered.filter(log => log.eventType === filters.eventType);
    }

    if (filters.severity) {
      const severities = Array.isArray(filters.severity) ? filters.severity : [filters.severity];
      filtered = filtered.filter(log => severities.includes(log.severity));
    }

    if (filters.sessionId) {
      filtered = filtered.filter(log => log.sessionId === filters.sessionId);
    }

    if (filters.startTime) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.startTime));
    }

    if (filters.endTime) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.endTime));
    }

    // Return sorted by timestamp (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const summary = {
      totalEvents: this.logs.length,
      sessionId: this.sessionId,
      sessionDuration: Math.round((Date.now() - this.startTime) / 1000),
      eventsByType: {},
      eventsBySeverity: {},
      recentEvents: this.logs.slice(-10)
    };

    // Count by type
    this.logs.forEach(log => {
      summary.eventsByType[log.eventType] = (summary.eventsByType[log.eventType] || 0) + 1;
      summary.eventsBySeverity[log.severity] = (summary.eventsBySeverity[log.severity] || 0) + 1;
    });

    return summary;
  }

  /**
   * Get security posture score
   */
  getSecurityScore() {
    const summary = this.getSummary();

    let score = 100;

    // Deduct points for security events
    const weights = {
      'XSS_ATTEMPT': -20,
      'INJECTION_ATTEMPT': -30,
      'RATE_LIMIT': -5,
      'VALIDATION_FAILURE': -3,
      'STORAGE_QUOTA': -2
    };

    for (const [eventType, weight] of Object.entries(weights)) {
      const count = summary.eventsByType[eventType] || 0;
      score += weight * Math.min(count, 3); // Cap impact at 3 occurrences
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      assessment: score >= 90 ? 'EXCELLENT' : score >= 70 ? 'GOOD' : score >= 50 ? 'FAIR' : 'POOR',
      warnings: this._getSecurityWarnings(summary)
    };
  }

  /**
   * Get security warnings
   */
  _getSecurityWarnings(summary) {
    const warnings = [];

    if ((summary.eventsBySeverity['CRITICAL'] || 0) > 0) {
      warnings.push('Critical security events detected');
    }

    if ((summary.eventsBySeverity['ERROR'] || 0) > 2) {
      warnings.push('Multiple security errors detected');
    }

    if ((summary.eventsByType['XSS_ATTEMPT'] || 0) > 0) {
      warnings.push('XSS attempts detected - review input validation');
    }

    if ((summary.eventsByType['INJECTION_ATTEMPT'] || 0) > 0) {
      warnings.push('Injection attempts detected - review sanitization');
    }

    if ((summary.eventsByType['RATE_LIMIT'] || 0) > 5) {
      warnings.push('Multiple rate limit violations - possible attack');
    }

    return warnings;
  }

  /**
   * Clear old logs (older than X days)
   */
  clearOldLogs(days = 30) {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const initialLength = this.logs.length;

    this.logs = this.logs.filter(log => new Date(log.timestamp) > new Date(cutoffTime));

    const removed = initialLength - this.logs.length;
    console.log(`[SecurityAudit] Cleared ${removed} logs older than ${days} days`);

    this.saveLogs();
    return removed;
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    const data = {
      exportedAt: new Date().toISOString(),
      sessionId: this.sessionId,
      totalEvents: this.logs.length,
      logs: this.logs
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Generate security report
   */
  generateReport() {
    const summary = this.getSummary();
    const score = this.getSecurityScore();

    return `
=== AlexBET Security Audit Report ===
Generated: ${new Date().toISOString()}
Session: ${this.sessionId}

Security Score: ${score.score}/100 (${score.assessment})

Event Summary:
- Total Events: ${summary.totalEvents}
- Critical: ${summary.eventsBySeverity['CRITICAL'] || 0}
- Errors: ${summary.eventsBySeverity['ERROR'] || 0}
- Warnings: ${summary.eventsBySeverity['WARNING'] || 0}
- Info: ${summary.eventsBySeverity['INFO'] || 0}

Events by Type:
${Object.entries(summary.eventsByType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

Security Warnings:
${score.warnings.length > 0 
  ? score.warnings.map(w => `- ⚠️ ${w}`).join('\n')
  : '- No security warnings'}

Recommendations:
${this._getRecommendations(summary)}

Session Duration: ${summary.sessionDuration} seconds
    `;
  }

  /**
   * Get security recommendations
   */
  _getRecommendations(summary) {
    const recommendations = [];

    if ((summary.eventsByType['XSS_ATTEMPT'] || 0) > 0) {
      recommendations.push('- Review all user input sanitization routines');
      recommendations.push('- Consider adding Content Security Policy headers');
      recommendations.push('- Implement input length limits on all forms');
    }

    if ((summary.eventsByType['RATE_LIMIT'] || 0) > 0) {
      recommendations.push('- Consider adding rate limiting to API calls');
      recommendations.push('- Implement exponential backoff for retries');
    }

    if ((summary.eventsByType['VALIDATION_FAILURE'] || 0) > 5) {
      recommendations.push('- Review form validation logic');
      recommendations.push('- Provide better user feedback on validation errors');
    }

    if (recommendations.length === 0) {
      recommendations.push('- Continue monitoring security events');
      recommendations.push('- Regularly audit security logs');
      recommendations.push('- Keep security libraries up to date');
    }

    return recommendations.join('\n');
  }

  /**
   * Generate utility ID
   */
  _generateId() {
    return `log_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate session ID
   */
  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Print report to console
   */
  printReport() {
    console.log(this.generateReport());
  }
}

// Create global audit instance
const securityAudit = new SecurityAudit();

console.log('[SecurityAudit] Initialized - monitoring security events');
