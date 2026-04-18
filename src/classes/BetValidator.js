/**
 * BetValidator - Input validation with Security Integration
 * Ensures data integrity and security with XSS detection
 */

class BetValidator {
  /**
   * Validate a complete bet object
   */
  static validateBet(bet) {
    const errors = [];

    // Pick validation
    if (!bet.pick || typeof bet.pick !== 'string') {
      errors.push('Pick name is required and must be a string');
    } else if (bet.pick.trim().length === 0) {
      errors.push('Pick cannot be empty');
    } else if (bet.pick.length > 200) {
      errors.push('Pick name too long (max 200 characters)');
    } else {
      // Check for XSS patterns
      const xssDetected = securityManager.detectXSSPatterns(bet.pick);
      if (xssDetected.length > 0) {
        errors.push(`Suspicious patterns detected: ${xssDetected.join(', ')}`);
        securityManager.logSecurityEvent('XSS_ATTEMPT', {
          field: 'pick',
          patterns: xssDetected,
          value: bet.pick.substring(0, 50)
        });
      }
    }

    // Sport validation
    const validSports = ['NBA', 'NFL', 'MLB', 'NHL', 'ATP', 'EPL', 'NCAAB', 'NCAAF'];
    if (!bet.sport || !validSports.includes(bet.sport)) {
      errors.push(`Invalid sport. Must be one of: ${validSports.join(', ')}`);
    }

    // Bet type validation
    const validBetTypes = ['SPREAD', 'MONEYLINE', 'TOTAL', 'PROP'];
    if (!bet.betType || !validBetTypes.includes(bet.betType)) {
      errors.push(`Invalid bet type. Must be one of: ${validBetTypes.join(', ')}`);
    }

    // Odds validation
    if (typeof bet.entryOdds !== 'number' || !Number.isFinite(bet.entryOdds)) {
      errors.push('Odds must be a valid number');
    } else if (bet.entryOdds < -10000 || bet.entryOdds > 10000) {
      errors.push('Odds must be between -10000 and +10000');
    } else if (bet.entryOdds === 0) {
      errors.push('Odds cannot be zero');
    }

    // Stake validation
    if (typeof bet.stake !== 'number' || !Number.isFinite(bet.stake)) {
      errors.push('Stake must be a valid number');
    } else if (bet.stake <= 0) {
      errors.push('Stake must be greater than 0');
    } else if (bet.stake > 1000000) {
      errors.push('Stake is unreasonably large (max $1,000,000)');
    }

    // Edge validation (optional)
    if (bet.edge !== undefined && bet.edge !== null) {
      if (typeof bet.edge !== 'number' || !Number.isFinite(bet.edge)) {
        errors.push('Edge must be a valid number');
      } else if (bet.edge < -100 || bet.edge > 100) {
        errors.push('Edge must be between -100 and 100');
      }
    }

    // Confidence validation (optional)
    if (bet.confidence !== undefined && bet.confidence !== null) {
      if (!Number.isInteger(bet.confidence) || bet.confidence < 1 || bet.confidence > 10) {
        errors.push('Confidence must be an integer between 1 and 10');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate player name for prop bets
   */
  static validatePlayerName(name) {
    const errors = [];

    if (!name || typeof name !== 'string') {
      errors.push('Player name is required');
    } else if (name.trim().length === 0) {
      errors.push('Player name cannot be empty');
    } else if (name.length > 100) {
      errors.push('Player name too long (max 100 characters)');
    } else {
      // Check for XSS patterns
      const xssDetected = securityManager.detectXSSPatterns(name);
      if (xssDetected.length > 0) {
        errors.push('Invalid characters in player name');
        securityManager.logSecurityEvent('XSS_ATTEMPT', {
          field: 'playerName',
          patterns: xssDetected
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate prop bet
   */
  static validatePropBet(prop) {
    const errors = [];

    // Player validation
    const playerValidation = this.validatePlayerName(prop.player);
    if (!playerValidation.valid) {
      errors.push(...playerValidation.errors);
    }

    // Sport validation
    if (!prop.sport || !['NBA', 'NFL', 'MLB'].includes(prop.sport)) {
      errors.push('Sport must be NBA, NFL, or MLB');
    }

    // Prop type validation
    if (!prop.propType || typeof prop.propType !== 'string' || prop.propType.length === 0) {
      errors.push('Prop type is required');
    } else if (prop.propType.length > 100) {
      errors.push('Prop type too long');
    }

    // Line validation
    if (typeof prop.line !== 'number' || !Number.isFinite(prop.line)) {
      errors.push('Line must be a valid number');
    } else if (prop.line < 0 || prop.line > 500) {
      errors.push('Line must be between 0 and 500');
    }

    // Odds validation
    if (typeof prop.odds !== 'number' || !Number.isFinite(prop.odds)) {
      errors.push('Odds must be a valid number');
    } else if (Math.abs(prop.odds) > 10000) {
      errors.push('Odds value is unreasonably large');
    }

    // Stake validation
    if (typeof prop.stake !== 'number' || !Number.isFinite(prop.stake)) {
      errors.push('Stake must be a valid number');
    } else if (prop.stake <= 0 || prop.stake > 100000) {
      errors.push('Stake must be between 0 and $100,000');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate bet status transition
   */
  static validateStatusTransition(currentStatus, newStatus) {
    const validStatuses = ['PENDING', 'WON', 'LOST', 'PUSH'];

    if (!validStatuses.includes(currentStatus)) {
      return {
        valid: false,
        errors: [`Invalid current status: ${currentStatus}`]
      };
    }

    if (!validStatuses.includes(newStatus)) {
      return {
        valid: false,
        errors: [`Invalid new status: ${newStatus}`]
      };
    }

    // You can add status transition rules here if needed
    // For example: SETTLED bets cannot change status
    // if (['WON', 'LOST', 'PUSH'].includes(currentStatus) && newStatus !== currentStatus) {
    //   return { valid: false, errors: ['Settled bets cannot change status'] };
    // }

    return {
      valid: true,
      errors: []
    };
  }

  /**
   * Sanitize user input - remove dangerous characters
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return '';
    }

    // Use SecurityManager's sanitization
    return securityManager.sanitizeInput(input);
  }

  /**
   * Sanitize for HTML context
   */
  static sanitizeForHTML(input) {
    if (typeof input !== 'string') {
      return '';
    }

    // Create a text node and append to DOM to safely escape HTML
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Sanitize bet data before storage
   */
  static sanitizeBet(bet) {
    return {
      ...bet,
      pick: this.sanitizeInput(bet.pick),
      sport: bet.sport, // Already validated as enum
      betType: bet.betType, // Already validated as enum
      notes: this.sanitizeInput(bet.notes || '')
    };
  }

  /**
   * Sanitize JSON import data
   */
  static sanitizeImportData(data) {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(item => {
      if (typeof item !== 'object' || item === null) {
        return null;
      }

      // Use SecurityManager's JSON sanitization
      const sanitized = securityManager.sanitizeJSON(item);

      // Validate the sanitized item
      const validation = this.validateBet(sanitized);
      if (!validation.valid) {
        console.warn('[BetValidator] Imported bet failed validation:', sanitized);
        return null;
      }

      return sanitized;
    }).filter(item => item !== null);
  }

  /**
   * Validate email (for future use)
   */
  static validateEmail(email) {
    const errors = [];
    const sanitized = securityManager.sanitizeEmail(email);

    if (!sanitized) {
      errors.push('Invalid email address');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Validate URL (for future use)
   */
  static validateURL(url) {
    const errors = [];
    const sanitized = securityManager.sanitizeURL(url);

    if (!sanitized) {
      errors.push('Invalid or untrusted URL');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized
    };
  }
}

console.log('[BetValidator] Loaded and integrated with SecurityManager');
