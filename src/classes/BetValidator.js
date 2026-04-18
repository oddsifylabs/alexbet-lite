/**
 * BetValidator - Input validation for all bet operations
 * Ensures data integrity and security
 */

class BetValidator {
  /**
   * Validate a complete bet object
   * @param {Object} bet - Bet data to validate
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validateBet(bet) {
    const errors = [];

    // Pick validation
    if (!bet.pick || typeof bet.pick !== 'string') {
      errors.push('Pick name is required and must be a string');
    } else if (bet.pick.trim().length === 0) {
      errors.push('Pick cannot be empty');
    } else if (bet.pick.length > 100) {
      errors.push('Pick name too long (max 100 characters)');
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
    if (typeof bet.entryOdds !== 'number') {
      errors.push('Odds must be a number');
    } else if (bet.entryOdds < -5000 || bet.entryOdds > 5000) {
      errors.push('Odds must be between -5000 and +5000');
    } else if (bet.entryOdds === 0) {
      errors.push('Odds cannot be zero');
    }

    // Stake validation
    if (typeof bet.stake !== 'number') {
      errors.push('Stake must be a number');
    } else if (bet.stake <= 0) {
      errors.push('Stake must be greater than 0');
    } else if (bet.stake > 100000) {
      errors.push('Stake exceeds maximum ($100,000)');
    } else if (!Number.isFinite(bet.stake)) {
      errors.push('Stake must be a valid number');
    }

    // Edge validation (optional but if provided, validate)
    if (bet.edge !== undefined && typeof bet.edge !== 'number') {
      errors.push('Edge must be a number');
    } else if (bet.edge !== undefined && (bet.edge < -100 || bet.edge > 100)) {
      errors.push('Edge must be between -100% and 100%');
    }

    // Confidence (optional)
    if (bet.confidence !== undefined && typeof bet.confidence !== 'number') {
      errors.push('Confidence must be a number');
    } else if (bet.confidence !== undefined && (bet.confidence < 1 || bet.confidence > 10)) {
      errors.push('Confidence must be between 1 and 10');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a prop bet
   */
  static validatePropBet(propBet) {
    const errors = [];

    if (!propBet.player || typeof propBet.player !== 'string' || propBet.player.trim().length === 0) {
      errors.push('Player name is required');
    }

    if (!propBet.sport || !['NBA', 'NFL', 'MLB', 'NHL'].includes(propBet.sport)) {
      errors.push('Invalid sport for prop bet');
    }

    if (!propBet.propType || propBet.propType.trim().length === 0) {
      errors.push('Prop type is required (e.g., "Points Over", "Rebounds")');
    }

    if (typeof propBet.line !== 'number' || propBet.line <= 0) {
      errors.push('Line must be a positive number');
    }

    if (typeof propBet.odds !== 'number' || propBet.odds === 0) {
      errors.push('Odds must be a valid non-zero number');
    }

    if (typeof propBet.stake !== 'number' || propBet.stake <= 0) {
      errors.push('Stake must be a positive number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize user input to prevent XSS
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .substring(0, 200); // Limit length
  }

  /**
   * Validate player name for injury tracker
   */
  static validatePlayerName(playerName) {
    const errors = [];

    if (!playerName || typeof playerName !== 'string') {
      errors.push('Player name must be a string');
    } else if (playerName.trim().length === 0) {
      errors.push('Player name cannot be empty');
    } else if (playerName.length > 100) {
      errors.push('Player name too long');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate bet status update
   */
  static validateBetStatus(status, currentStatus) {
    const validStatuses = ['PENDING', 'WON', 'LOST', 'PUSH', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return {
        valid: false,
        errors: [`Invalid status. Must be one of: ${validStatuses.join(', ')}`]
      };
    }

    // Prevent invalid transitions
    const invalidTransitions = {
      'WON': ['LOST', 'PUSH'],
      'LOST': ['WON', 'PUSH'],
      'PUSH': ['WON', 'LOST']
    };

    if (invalidTransitions[currentStatus] && invalidTransitions[currentStatus].includes(status)) {
      return {
        valid: false,
        errors: [`Cannot change status from ${currentStatus} to ${status}`]
      };
    }

    return {
      valid: true,
      errors: []
    };
  }
}
