/**
 * BetValidator Unit Tests
 * Testing input validation and sanitization
 */

describe('BetValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new BetValidator();
  });

  describe('validateBet', () => {
    test('should validate a correct bet', () => {
      const bet = {
        sport: 'NFL',
        event: 'KC vs SF',
        betType: 'Spread',
        pick: 'KC -3',
        stake: 100,
        entryOdds: -110,
        status: 'PENDING'
      };

      const result = validator.validateBet(bet);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject bet with missing required fields', () => {
      const bet = { sport: 'NFL' }; // Missing other fields

      const result = validator.validateBet(bet);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject invalid stake', () => {
      const bet = {
        sport: 'NFL',
        event: 'KC vs SF',
        betType: 'Spread',
        pick: 'KC -3',
        stake: -100, // Negative stake
        entryOdds: -110,
        status: 'PENDING'
      };

      const result = validator.validateBet(bet);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('stake'))).toBe(true);
    });

    test('should reject invalid status', () => {
      const bet = {
        sport: 'NFL',
        event: 'KC vs SF',
        betType: 'Spread',
        pick: 'KC -3',
        stake: 100,
        entryOdds: -110,
        status: 'INVALID_STATUS'
      };

      const result = validator.validateBet(bet);
      expect(result.isValid).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('should remove HTML tags', () => {
      const input = '<script>alert("XSS")</script>KC';
      const result = validator.sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    test('should handle SQL injection attempts', () => {
      const input = "NFL'; DROP TABLE bets; --";
      const result = validator.sanitizeInput(input);
      expect(result).not.toContain('DROP TABLE');
    });

    test('should preserve safe text', () => {
      const input = 'Kansas City Chiefs -3.5';
      const result = validator.sanitizeInput(input);
      expect(result).toContain('Kansas City Chiefs');
      expect(result).toContain('-3.5');
    });

    test('should handle special characters', () => {
      const input = 'Test & Co. (123)';
      const result = validator.sanitizeInput(input);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('validateOdds', () => {
    test('should accept valid American odds', () => {
      expect(validator.validateOdds(-110)).toBe(true);
      expect(validator.validateOdds(110)).toBe(true);
      expect(validator.validateOdds(-500)).toBe(true);
      expect(validator.validateOdds(500)).toBe(true);
    });

    test('should reject zero odds', () => {
      expect(validator.validateOdds(0)).toBe(false);
    });

    test('should reject extreme odds', () => {
      expect(validator.validateOdds(-10000)).toBe(false);
      expect(validator.validateOdds(10000)).toBe(false);
    });

    test('should reject decimal odds in American format', () => {
      expect(validator.validateOdds(-110.5)).toBe(false);
    });
  });

  describe('validateStake', () => {
    test('should accept valid stakes', () => {
      expect(validator.validateStake(10)).toBe(true);
      expect(validator.validateStake(100)).toBe(true);
      expect(validator.validateStake(1000)).toBe(true);
    });

    test('should reject zero stake', () => {
      expect(validator.validateStake(0)).toBe(false);
    });

    test('should reject negative stake', () => {
      expect(validator.validateStake(-50)).toBe(false);
    });

    test('should reject very large stakes', () => {
      expect(validator.validateStake(1000000)).toBe(false);
    });

    test('should handle decimal stakes', () => {
      expect(validator.validateStake(10.50)).toBe(true);
      expect(validator.validateStake(0.01)).toBe(true);
    });
  });
});
