/**
 * Analytics Unit Tests
 * Testing statistics calculations and analysis
 */

describe('Analytics', () => {
  let analytics;
  let sampleBets;

  beforeEach(() => {
    analytics = new Analytics();
    sampleBets = [
      { id: '1', status: 'WON', stake: 100, pnl: 100, entryOdds: 100, edge: 2 },
      { id: '2', status: 'WON', stake: 50, pnl: 40, entryOdds: -110, edge: 3 },
      { id: '3', status: 'LOST', stake: 75, pnl: -75, entryOdds: -150, edge: -2 },
      { id: '4', status: 'PUSH', stake: 100, pnl: 0, entryOdds: 0, edge: 0 },
      { id: '5', status: 'PENDING', stake: 50, pnl: 0, entryOdds: 110, edge: 1 }
    ];
    analytics.updateBets(sampleBets);
  });

  describe('getOverallStats', () => {
    test('should calculate correct total bets', () => {
      const stats = analytics.getOverallStats();
      expect(stats.totalBets).toBe(5);
    });

    test('should calculate correct settled bets', () => {
      const stats = analytics.getOverallStats();
      expect(stats.settledBets).toBe(4);
    });

    test('should calculate correct pending bets', () => {
      const stats = analytics.getOverallStats();
      expect(stats.pendingBets).toBe(1);
    });

    test('should calculate correct win count', () => {
      const stats = analytics.getOverallStats();
      expect(stats.wins).toBe(2);
    });

    test('should calculate correct loss count', () => {
      const stats = analytics.getOverallStats();
      expect(stats.losses).toBe(1);
    });

    test('should calculate correct push count', () => {
      const stats = analytics.getOverallStats();
      expect(stats.pushes).toBe(1);
    });

    test('should calculate correct win rate', () => {
      const stats = analytics.getOverallStats();
      expect(stats.winRate).toBe(50); // 2 wins / 4 settled
    });

    test('should calculate correct total wagered', () => {
      const stats = analytics.getOverallStats();
      expect(stats.totalWagered).toBe(325); // 100+50+75+100
    });

    test('should calculate correct total P&L', () => {
      const stats = analytics.getOverallStats();
      expect(stats.totalPnL).toBe(65); // 100+40-75+0
    });

    test('should calculate correct ROI', () => {
      const stats = analytics.getOverallStats();
      const expected = ((65 / 325) * 100).toFixed(2);
      expect(stats.roi).toBe(parseFloat(expected));
    });

    test('should determine profitability status', () => {
      const stats = analytics.getOverallStats();
      expect(stats.profitability).toBe('✅ Profitable');
    });
  });

  describe('getStatsByBySport', () => {
    test('should group bets by sport', () => {
      const betsWithSport = [
        { ...sampleBets[0], sport: 'NFL' },
        { ...sampleBets[1], sport: 'NFL' },
        { ...sampleBets[2], sport: 'NBA' },
        { ...sampleBets[3], sport: 'NBA' }
      ];
      analytics.updateBets(betsWithSport);

      const statsBySport = analytics.getStatsByBySport();
      expect(statsBySport['NFL']).toBeDefined();
      expect(statsBySport['NBA']).toBeDefined();
    });

    test('should calculate correct stats per sport', () => {
      const betsWithSport = [
        { ...sampleBets[0], sport: 'NFL', status: 'WON' },
        { ...sampleBets[2], sport: 'NFL', status: 'LOST' }
      ];
      analytics.updateBets(betsWithSport);

      const stats = analytics.getStatsByBySport();
      expect(stats['NFL'].total).toBe(2);
      expect(stats['NFL'].wins).toBe(1);
      expect(stats['NFL'].losses).toBe(1);
    });
  });

  describe('getStatsByBetType', () => {
    test('should group bets by bet type', () => {
      const betsWithType = [
        { ...sampleBets[0], betType: 'Spread' },
        { ...sampleBets[1], betType: 'Moneyline' },
        { ...sampleBets[2], betType: 'Total' }
      ];
      analytics.updateBets(betsWithType);

      const statsByType = analytics.getStatsByBetType();
      expect(statsByType['Spread']).toBeDefined();
      expect(statsByType['Moneyline']).toBeDefined();
      expect(statsByType['Total']).toBeDefined();
    });
  });

  describe('calculateEdge', () => {
    test('should calculate edge correctly', () => {
      const edge = analytics.calculateEdge(-110, 0.55);
      expect(edge).toBeGreaterThan(0);
    });

    test('should return negative edge for bad probability', () => {
      const edge = analytics.calculateEdge(-110, 0.40);
      expect(edge).toBeLessThan(0);
    });
  });

  describe('empty bets', () => {
    test('should handle zero bets gracefully', () => {
      analytics.updateBets([]);
      const stats = analytics.getOverallStats();

      expect(stats.totalBets).toBe(0);
      expect(stats.winRate).toBe(0);
      expect(stats.roi).toBe(0);
    });

    test('should handle all pending bets', () => {
      const pendingOnly = [
        { id: '1', status: 'PENDING', stake: 100, pnl: 0 },
        { id: '2', status: 'PENDING', stake: 50, pnl: 0 }
      ];
      analytics.updateBets(pendingOnly);
      const stats = analytics.getOverallStats();

      expect(stats.settledBets).toBe(0);
      expect(stats.pendingBets).toBe(2);
      expect(stats.winRate).toBe(0);
    });
  });
});

/**
 * DataExportImport Unit Tests
 * Testing export/import and data validation
 */

describe('DataExportImport', () => {
  let exporter;
  let betTracker;
  let validator;
  let errorHandler;
  let sampleBets;

  beforeEach(() => {
    betTracker = new BetTracker();
    validator = new BetValidator();
    errorHandler = new ErrorHandler();
    exporter = new DataExportImport(betTracker, validator, errorHandler);

    sampleBets = [
      {
        sport: 'NFL',
        event: 'KC vs SF',
        betType: 'Spread',
        pick: 'KC -3',
        stake: 100,
        entryOdds: -110,
        status: 'WON',
        pnl: 90
      }
    ];
  });

  describe('exportToCSV', () => {
    test('should export bets to CSV format', () => {
      const result = exporter.exportToCSV(sampleBets);
      expect(result.success).toBe(true);
      expect(result.data).toContain('NFL');
      expect(result.data).toContain('KC vs SF');
    });

    test('should include CSV headers', () => {
      const result = exporter.exportToCSV(sampleBets);
      expect(result.data).toContain('Sport');
      expect(result.data).toContain('Event');
      expect(result.data).toContain('Bet Type');
    });

    test('should escape CSV special characters', () => {
      const bet = { ...sampleBets[0], notes: 'Note with, comma' };
      const result = exporter.exportToCSV([bet]);
      expect(result.data).toContain('"Note with, comma"');
    });
  });

  describe('exportToJSON', () => {
    test('should export bets to JSON format', () => {
      const result = exporter.exportToJSON(sampleBets);
      expect(result.success).toBe(true);
      const data = JSON.parse(result.data);
      expect(data.bets).toBeDefined();
      expect(data.bets.length).toBe(1);
    });

    test('should include metadata', () => {
      const result = exporter.exportToJSON(sampleBets);
      const data = JSON.parse(result.data);
      expect(data.exportDate).toBeDefined();
      expect(data.version).toBe('1.0');
      expect(data.recordCount).toBe(1);
    });
  });

  describe('importFromCSV', () => {
    test('should import valid CSV data', () => {
      const csv = 'Sport,Event,Bet Type,Pick,Stake,Entry Odds,Status\nNFL,KC vs SF,Spread,KC -3,100,-110,WON';
      const result = exporter.importFromCSV(csv);
      expect(result.success).toBe(true);
      expect(result.imported).toBeGreaterThan(0);
    });

    test('should handle empty CSV', () => {
      const csv = '';
      const result = exporter.importFromCSV(csv);
      expect(result.success).toBe(false);
    });

    test('should validate imported data', () => {
      const csv = 'Sport,Event\nNFL'; // Missing required fields
      const result = exporter.importFromCSV(csv);
      expect(result.failed).toBeGreaterThan(0);
    });
  });

  describe('importFromJSON', () => {
    test('should import valid JSON data', () => {
      const json = {
        bets: [
          {
            sport: 'NFL',
            event: 'KC vs SF',
            betType: 'Spread',
            pick: 'KC -3',
            stake: 100,
            entryOdds: -110,
            status: 'WON',
            pnl: 90
          }
        ]
      };
      const result = exporter.importFromJSON(json);
      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
    });

    test('should reject invalid JSON structure', () => {
      const json = { data: [] }; // Missing 'bets' key
      const result = exporter.importFromJSON(json);
      expect(result.success).toBe(false);
    });
  });

  describe('createBackup', () => {
    test('should create valid backup', () => {
      const result = exporter.createBackup(sampleBets);
      expect(result.success).toBe(true);
      expect(result.backup.bets).toBeDefined();
      expect(result.backup.checksum).toBeDefined();
    });

    test('should include backup metadata', () => {
      const result = exporter.createBackup(sampleBets);
      expect(result.backup.timestamp).toBeDefined();
      expect(result.backup.version).toBe('1.0');
      expect(result.backup.recordCount).toBe(1);
    });
  });

  describe('restoreFromBackup', () => {
    test('should restore from valid backup', () => {
      const backup = exporter.createBackup(sampleBets).backup;
      const result = exporter.restoreFromBackup(backup);
      expect(result.success).toBe(true);
    });

    test('should detect corrupted backup', () => {
      const backup = exporter.createBackup(sampleBets).backup;
      backup.bets[0].stake = 999; // Corrupt data
      const result = exporter.restoreFromBackup(backup);
      expect(result.success).toBe(false);
    });
  });

  describe('mergeImports', () => {
    test('should merge multiple imports', () => {
      const import1 = { success: true, bets: sampleBets, imported: 1 };
      const import2 = { success: true, bets: [...sampleBets, { ...sampleBets[0], id: 'unique' }], imported: 2 };

      const result = exporter.mergeImports(import1, import2);
      expect(result.bets.length).toBeGreaterThan(0);
    });

    test('should deduplicate merged bets', () => {
      const bet = { ...sampleBets[0], id: 'same' };
      const import1 = { success: true, bets: [bet], imported: 1 };
      const import2 = { success: true, bets: [bet], imported: 1 };

      const result = exporter.mergeImports(import1, import2);
      expect(result.deduplicated).toBe(1);
    });
  });

  describe('validation', () => {
    test('should validate file size', () => {
      const file = { size: 60 * 1024 * 1024 }; // 60MB
      const result = exporter.validateImportFile(file);
      expect(result.valid).toBe(false);
    });

    test('should validate file format', () => {
      const file = { name: 'data.csv', size: 1000 };
      const result = exporter.validateImportFile(file);
      expect(result.valid).toBe(true);
      expect(result.format).toBe('csv');
    });

    test('should reject unsupported formats', () => {
      const file = { name: 'data.txt', size: 1000 };
      const result = exporter.validateImportFile(file);
      expect(result.valid).toBe(false);
    });
  });
});
