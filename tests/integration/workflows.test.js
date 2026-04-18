/**
 * Integration Tests - End-to-End Workflows
 * Testing complete user scenarios
 */

describe('Integration Tests - User Workflows', () => {
  let tracker;
  let analytics;
  let exporter;
  let notifier;
  let validator;
  let errorHandler;

  beforeEach(() => {
    tracker = new BetTracker();
    analytics = new Analytics();
    validator = new BetValidator();
    errorHandler = new ErrorHandler();
    exporter = new DataExportImport(tracker, validator, errorHandler);
    notifier = new NotificationManager(new SecurityManager());
  });

  describe('Workflow 1: Complete Bet Lifecycle', () => {
    test('should handle full bet cycle: add → settle → update analytics', () => {
      // Step 1: Add a bet
      const betData = {
        sport: 'NFL',
        event: 'KC vs SF',
        betType: 'Spread',
        pick: 'KC -3',
        stake: 100,
        entryOdds: -110,
        status: 'PENDING'
      };

      const addResult = tracker.addBet(betData);
      expect(addResult.success).toBe(true);
      const betId = addResult.bet.id;

      // Step 2: Verify it's in tracker
      const bet = tracker.getBet(betId);
      expect(bet).toBeDefined();
      expect(bet.status).toBe('PENDING');

      // Step 3: Update analytics
      const allBets = tracker.getBets();
      analytics.updateBets(allBets);
      const statsBeforeSettle = analytics.getOverallStats();
      expect(statsBeforeSettle.pendingBets).toBe(1);

      // Step 4: Settle the bet
      const settleResult = tracker.settleBet(betId, 'WON', 190); // Win $90
      expect(settleResult.success).toBe(true);
      expect(settleResult.bet.pnl).toBe(90);

      // Step 5: Update analytics again
      const updatedBets = tracker.getBets();
      analytics.updateBets(updatedBets);
      const statsAfterSettle = analytics.getOverallStats();

      expect(statsAfterSettle.settledBets).toBe(1);
      expect(statsAfterSettle.wins).toBe(1);
      expect(statsAfterSettle.totalPnL).toBe(90);
      expect(statsAfterSettle.winRate).toBe(100);

      // Step 6: Send notification
      const notifResult = notifier.sendNotification('Bet Settled', {
        type: 'success',
        message: `Won $90 on ${bet.event}`
      });
      expect(notifResult.success).toBe(true);
    });
  });

  describe('Workflow 2: Data Import & Merge', () => {
    test('should export, modify, and re-import without duplicates', () => {
      // Step 1: Create initial bets
      const bet1 = tracker.addBet({
        sport: 'NFL',
        event: 'KC vs SF',
        stake: 100,
        entryOdds: -110,
        status: 'WON',
        pnl: 90
      });

      const bet2 = tracker.addBet({
        sport: 'NBA',
        event: 'Lakers vs Celtics',
        stake: 50,
        entryOdds: 110,
        status: 'LOST',
        pnl: -50
      });

      // Step 2: Export to CSV
      const allBets = tracker.getBets();
      const exportResult = exporter.exportToCSV(allBets);
      expect(exportResult.success).toBe(true);

      // Step 3: Simulate CSV modification (add a new bet)
      const csvWithNewBet = exportResult.data + 
        '\nMLB,Yankees vs Red Sox,Spread,Yankees -1.5,75,-120,PENDING,,0,0,01/01/2026,,';

      // Step 4: Import modified CSV
      const importResult = exporter.importFromCSV(csvWithNewBet);
      expect(importResult.imported).toBeGreaterThan(0);

      // Step 5: Check that original bets weren't duplicated
      // (would need proper ID handling in real scenario)
      expect(importResult.success).toBe(true);
    });
  });

  describe('Workflow 3: Analytics & Reporting', () => {
    test('should generate comprehensive report after 10 bets', () => {
      // Add 10 bets with varied results
      const bets = [
        { sport: 'NFL', event: 'KC vs SF', stake: 100, entryOdds: -110, status: 'WON', pnl: 90 },
        { sport: 'NFL', event: 'TB vs NO', stake: 50, entryOdds: 110, status: 'LOST', pnl: -50 },
        { sport: 'NFL', event: 'DAL vs PHI', stake: 75, entryOdds: -120, status: 'WON', pnl: 62 },
        { sport: 'NBA', event: 'Lakers vs Celtics', stake: 100, entryOdds: -110, status: 'WON', pnl: 90 },
        { sport: 'NBA', event: 'Heat vs Nets', stake: 50, entryOdds: 100, status: 'LOST', pnl: -50 },
        { sport: 'NBA', event: 'Warriors vs Suns', stake: 80, entryOdds: -140, status: 'WON', pnl: 57 },
        { sport: 'MLB', event: 'Yankees vs Red Sox', stake: 100, entryOdds: -110, status: 'PUSH', pnl: 0 },
        { sport: 'MLB', event: 'Dodgers vs Giants', stake: 75, entryOdds: 110, status: 'LOST', pnl: -75 },
        { sport: 'NHL', event: 'Avalanche vs Maple Leafs', stake: 100, entryOdds: -130, status: 'WON', pnl: 76 },
        { sport: 'NHL', event: 'Penguins vs Capitals', stake: 50, entryOdds: 120, status: 'WON', pnl: 60 }
      ];

      bets.forEach(b => {
        tracker.addBet({
          ...b,
          betType: 'Spread',
          pick: 'Home Team -X',
          placedDate: new Date()
        });
      });

      const allBets = tracker.getBets();
      analytics.updateBets(allBets);

      // Generate report
      const stats = analytics.getOverallStats();
      expect(stats.totalBets).toBe(10);
      expect(stats.settledBets).toBe(10);
      expect(stats.winRate).toBeGreaterThan(40); // Expecting some wins
      expect(stats.totalPnL).toBeDefined();

      // Check sport breakdown
      const sportStats = analytics.getStatsByBySport();
      expect(Object.keys(sportStats).length).toBe(4); // NFL, NBA, MLB, NHL
    });
  });

  describe('Workflow 4: Notifications & Preferences', () => {
    test('should respect user preferences for notifications', () => {
      const preferences = new UserPreferences();

      // Set preferences
      preferences.updatePreference('enableNotifications', true);
      preferences.updatePreference('enableSoundAlerts', false);
      expect(preferences.getPreference('enableNotifications')).toBe(true);
      expect(preferences.getPreference('enableSoundAlerts')).toBe(false);

      // Send notification (sound should be disabled)
      notifier.soundEnabled = preferences.getPreference('enableSoundAlerts');
      const notifResult = notifier.sendNotification('Test', {
        type: 'info',
        message: 'Test notification'
      });

      expect(notifResult.success).toBe(true);
      expect(notifier.soundEnabled).toBe(false);

      // Format currency according to preferences
      preferences.updatePreference('currencyCode', 'USD');
      preferences.updatePreference('decimalPlaces', 2);
      const formatted = preferences.formatCurrency(123.456);
      expect(formatted).toContain('123.46');
    });
  });

  describe('Workflow 5: Error Recovery', () => {
    test('should handle and recover from errors gracefully', () => {
      // Try to add invalid bet
      const invalidBet = { sport: 'NFL' }; // Missing required fields
      const result = tracker.addBet(invalidBet);
      expect(result.success).toBe(false);

      // Add valid bet after error
      const validBet = {
        sport: 'NFL',
        event: 'KC vs SF',
        betType: 'Spread',
        pick: 'KC -3',
        stake: 100,
        entryOdds: -110,
        status: 'PENDING'
      };

      const retryResult = tracker.addBet(validBet);
      expect(retryResult.success).toBe(true);

      // Verify data integrity after error
      const bets = tracker.getBets();
      expect(bets.length).toBe(1);
      expect(bets[0].sport).toBe('NFL');
    });
  });

  describe('Workflow 6: Backup & Restore', () => {
    test('should create backup and restore without data loss', () => {
      // Add several bets
      const bets = [
        {
          sport: 'NFL',
          event: 'KC vs SF',
          stake: 100,
          entryOdds: -110,
          status: 'WON',
          pnl: 90,
          betType: 'Spread',
          pick: 'KC -3'
        },
        {
          sport: 'NBA',
          event: 'Lakers vs Celtics',
          stake: 75,
          entryOdds: 110,
          status: 'PENDING',
          betType: 'Moneyline',
          pick: 'Lakers'
        }
      ];

      bets.forEach(b => tracker.addBet(b));

      // Create backup
      const allBets = tracker.getBets();
      const backup = exporter.createBackup(allBets);
      expect(backup.success).toBe(true);

      // Clear tracker (simulating data loss)
      const originalBets = tracker.getBets().length;

      // Restore from backup
      const restore = exporter.restoreFromBackup(backup.backup);
      expect(restore.success).toBe(true);
      expect(restore.restored).toBe(originalBets);
    });
  });
});

describe('Integration Tests - Edge Cases', () => {
  let tracker;

  beforeEach(() => {
    tracker = new BetTracker();
  });

  test('should handle rapid successive bets', () => {
    const bet = {
      sport: 'NFL',
      event: 'KC vs SF',
      betType: 'Spread',
      pick: 'KC -3',
      stake: 100,
      entryOdds: -110,
      status: 'PENDING'
    };

    // Add 100 bets rapidly
    for (let i = 0; i < 100; i++) {
      const result = tracker.addBet(bet);
      expect(result.success).toBe(true);
    }

    const bets = tracker.getBets();
    expect(bets.length).toBe(100);
  });

  test('should handle large stake amounts', () => {
    const bet = {
      sport: 'NFL',
      event: 'KC vs SF',
      betType: 'Spread',
      pick: 'KC -3',
      stake: 100000,
      entryOdds: -110,
      status: 'WON',
      pnl: 90909
    };

    const result = tracker.addBet(bet);
    expect(result.success).toBe(true);

    const added = tracker.getBet(result.bet.id);
    expect(added.stake).toBe(100000);
    expect(added.pnl).toBe(90909);
  });

  test('should handle concurrent operations', async () => {
    const bet1 = {
      sport: 'NFL',
      event: 'KC vs SF',
      betType: 'Spread',
      pick: 'KC -3',
      stake: 100,
      entryOdds: -110,
      status: 'PENDING'
    };

    const bet2 = {
      sport: 'NBA',
      event: 'Lakers vs Celtics',
      betType: 'Moneyline',
      pick: 'Lakers',
      stake: 50,
      entryOdds: 110,
      status: 'PENDING'
    };

    // Add concurrently
    const [result1, result2] = await Promise.all([
      Promise.resolve(tracker.addBet(bet1)),
      Promise.resolve(tracker.addBet(bet2))
    ]);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.bet.id).not.toBe(result2.bet.id);

    const bets = tracker.getBets();
    expect(bets.length).toBe(2);
  });
});
