/**
 * BetTracker Unit Tests
 * Testing core bet management functionality
 */

describe('BetTracker', () => {
  let tracker;
  let sampleBet;

  beforeEach(() => {
    tracker = new BetTracker();
    sampleBet = {
      sport: 'NFL',
      event: 'KC vs SF',
      betType: 'Spread',
      pick: 'KC -3',
      stake: 100,
      entryOdds: -110,
      status: 'PENDING'
    };
  });

  describe('addBet', () => {
    test('should add a valid bet', () => {
      const result = tracker.addBet(sampleBet);
      expect(result.success).toBe(true);
      expect(result.bet.id).toBeDefined();
    });

    test('should assign unique IDs', () => {
      const result1 = tracker.addBet(sampleBet);
      const result2 = tracker.addBet(sampleBet);

      expect(result1.bet.id).not.toBe(result2.bet.id);
    });

    test('should reject invalid bets', () => {
      const invalidBet = { sport: 'NFL' };
      const result = tracker.addBet(invalidBet);
      expect(result.success).toBe(false);
    });

    test('should set placedDate to current time', () => {
      const before = Date.now();
      const result = tracker.addBet(sampleBet);
      const after = Date.now();

      const betTime = new Date(result.bet.placedDate).getTime();
      expect(betTime).toBeGreaterThanOrEqual(before);
      expect(betTime).toBeLessThanOrEqual(after);
    });
  });

  describe('getBet', () => {
    test('should retrieve a bet by ID', () => {
      const added = tracker.addBet(sampleBet);
      const retrieved = tracker.getBet(added.bet.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(added.bet.id);
      expect(retrieved.sport).toBe('NFL');
    });

    test('should return null for non-existent ID', () => {
      const result = tracker.getBet('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getBets', () => {
    test('should return all bets', () => {
      tracker.addBet(sampleBet);
      tracker.addBet({ ...sampleBet, event: 'TB vs NO' });
      tracker.addBet({ ...sampleBet, event: 'DAL vs PHI' });

      const bets = tracker.getBets();
      expect(bets.length).toBe(3);
    });

    test('should return empty array when no bets', () => {
      const bets = tracker.getBets();
      expect(Array.isArray(bets)).toBe(true);
      expect(bets.length).toBe(0);
    });

    test('should accept filter function', () => {
      tracker.addBet({ ...sampleBet, sport: 'NFL' });
      tracker.addBet({ ...sampleBet, sport: 'NBA', event: 'Lakers vs Celtics' });
      tracker.addBet({ ...sampleBet, sport: 'MLB', event: 'Yankees vs Red Sox' });

      const nflBets = tracker.getBets(b => b.sport === 'NFL');
      expect(nflBets.length).toBe(1);
      expect(nflBets[0].sport).toBe('NFL');
    });
  });

  describe('updateBet', () => {
    test('should update existing bet', () => {
      const added = tracker.addBet(sampleBet);
      const updated = tracker.updateBet(added.bet.id, { notes: 'Updated notes' });

      expect(updated.success).toBe(true);
      expect(updated.bet.notes).toBe('Updated notes');
    });

    test('should return error for non-existent bet', () => {
      const result = tracker.updateBet('non-existent', { notes: 'test' });
      expect(result.success).toBe(false);
    });

    test('should preserve existing fields when updating', () => {
      const added = tracker.addBet(sampleBet);
      tracker.updateBet(added.bet.id, { notes: 'New notes' });

      const bet = tracker.getBet(added.bet.id);
      expect(bet.sport).toBe(sampleBet.sport);
      expect(bet.stake).toBe(sampleBet.stake);
    });
  });

  describe('settleBet', () => {
    test('should settle a pending bet as WON', () => {
      const added = tracker.addBet(sampleBet);
      const settled = tracker.settleBet(added.bet.id, 'WON', 190); // $100 bet wins $90

      expect(settled.success).toBe(true);
      expect(settled.bet.status).toBe('WON');
      expect(settled.bet.exitOdds).toBe(190);
      expect(settled.bet.pnl).toBe(90);
    });

    test('should settle a pending bet as LOST', () => {
      const added = tracker.addBet(sampleBet);
      const settled = tracker.settleBet(added.bet.id, 'LOST', -110);

      expect(settled.success).toBe(true);
      expect(settled.bet.status).toBe('LOST');
      expect(settled.bet.pnl).toBe(-100); // Lose the stake
    });

    test('should settle a pending bet as PUSH', () => {
      const added = tracker.addBet(sampleBet);
      const settled = tracker.settleBet(added.bet.id, 'PUSH', -110);

      expect(settled.success).toBe(true);
      expect(settled.bet.status).toBe('PUSH');
      expect(settled.bet.pnl).toBe(0);
    });

    test('should set settledDate on settlement', () => {
      const added = tracker.addBet(sampleBet);
      const settled = tracker.settleBet(added.bet.id, 'WON', 190);

      expect(settled.bet.settledDate).toBeDefined();
    });

    test('should not settle already settled bets', () => {
      const added = tracker.addBet(sampleBet);
      tracker.settleBet(added.bet.id, 'WON', 190);

      const result = tracker.settleBet(added.bet.id, 'LOST', -110);
      expect(result.success).toBe(false);
    });
  });

  describe('deleteBet', () => {
    test('should delete an existing bet', () => {
      const added = tracker.addBet(sampleBet);
      const result = tracker.deleteBet(added.bet.id);

      expect(result.success).toBe(true);
      expect(tracker.getBet(added.bet.id)).toBeNull();
    });

    test('should return error for non-existent bet', () => {
      const result = tracker.deleteBet('non-existent');
      expect(result.success).toBe(false);
    });
  });

  describe('filterBets', () => {
    beforeEach(() => {
      tracker.addBet({ ...sampleBet, sport: 'NFL', status: 'PENDING' });
      tracker.addBet({ ...sampleBet, sport: 'NBA', status: 'WON' });
      tracker.addBet({ ...sampleBet, sport: 'MLB', status: 'LOST' });
    });

    test('should filter by sport', () => {
      const nflBets = tracker.filterBets({ sport: 'NFL' });
      expect(nflBets.length).toBe(1);
      expect(nflBets[0].sport).toBe('NFL');
    });

    test('should filter by status', () => {
      const pending = tracker.filterBets({ status: 'PENDING' });
      expect(pending.length).toBe(1);
      expect(pending[0].status).toBe('PENDING');
    });

    test('should filter by multiple criteria', () => {
      tracker.addBet({ ...sampleBet, sport: 'NFL', status: 'WON' });

      const nflWins = tracker.filterBets({ sport: 'NFL', status: 'WON' });
      expect(nflWins.length).toBe(1);
    });
  });

  describe('calculateTotalWagered', () => {
    test('should calculate total wagered amount', () => {
      tracker.addBet({ ...sampleBet, stake: 100 });
      tracker.addBet({ ...sampleBet, stake: 50 });
      tracker.addBet({ ...sampleBet, stake: 25 });

      const total = tracker.calculateTotalWagered();
      expect(total).toBe(175);
    });

    test('should return 0 for no bets', () => {
      const total = tracker.calculateTotalWagered();
      expect(total).toBe(0);
    });
  });

  describe('data persistence', () => {
    test('should save bets to localStorage', () => {
      tracker.addBet(sampleBet);
      expect(localStorage.getItem('alexbet_bets')).toBeDefined();
    });

    test('should load bets from localStorage', () => {
      const tracker1 = new BetTracker();
      tracker1.addBet(sampleBet);

      const tracker2 = new BetTracker();
      const bets = tracker2.getBets();
      expect(bets.length).toBe(1);
    });
  });
});
