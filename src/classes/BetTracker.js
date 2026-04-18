/**
 * BetTracker - Core bet management and tracking
 * Handles all bet operations with validation and error handling
 */

class BetTracker {
  constructor(storageKey = 'alexbet_bets') {
    this.storageKey = storageKey;
    this.bets = this.loadBets();
    this.maxBets = 1000; // Prevent unbounded growth
  }

  /**
   * Load bets from storage with error handling
   */
  loadBets() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];

      const bets = JSON.parse(data);
      if (!Array.isArray(bets)) {
        console.warn('[BetTracker] Invalid bets data, resetting');
        return [];
      }

      return bets;
    } catch (err) {
      console.error('[BetTracker] Error loading bets:', err);
      return [];
    }
  }

  /**
   * Save bets with quota management
   */
  saveBets() {
    try {
      const serialized = JSON.stringify(this.bets);
      const sizeInBytes = new Blob([serialized]).size;

      // Warn if approaching quota
      if (sizeInBytes > 1048576) { // 1MB
        console.warn(`[BetTracker] Storage approaching limit: ${(sizeInBytes / 1024).toFixed(2)}KB`);
      }

      localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        console.error('[BetTracker] LocalStorage quota exceeded');
        this.cleanupOldBets();
        return false;
      } else {
        console.error('[BetTracker] Error saving bets:', err);
        return false;
      }
    }
  }

  /**
   * Clean up old bets (older than 6 months)
   */
  cleanupOldBets() {
    const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
    const filtered = this.bets.filter(bet => {
      try {
        return new Date(bet.entryTime).getTime() > sixMonthsAgo;
      } catch {
        return false;
      }
    });

    const removed = this.bets.length - filtered.length;
    this.bets = filtered;

    if (removed > 0) {
      this.saveBets();
      console.log(`[BetTracker] Cleaned up ${removed} old bets`);
    }

    return removed;
  }

  /**
   * Add a new bet with full validation
   */
  addBet(betData) {
    // Validate input
    const validation = BetValidator.validateBet(betData);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        bet: null
      };
    }

    // Check max bets
    if (this.bets.length >= this.maxBets) {
      return {
        success: false,
        errors: [`Maximum ${this.maxBets} bets reached. Archive old bets first.`],
        bet: null
      };
    }

    // Create bet object with safety
    const bet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pick: BetValidator.sanitizeInput(betData.pick),
      sport: betData.sport,
      betType: betData.betType,
      entryOdds: betData.entryOdds,
      stake: betData.stake,
      edge: betData.edge || 0,
      confidence: betData.confidence || 5,
      entryTime: new Date().toISOString(),
      status: 'PENDING',
      result: null,
      pnl: 0,
      clv: 0,
      gameId: betData.gameId || null,
      liveScore: null,
      notes: BetValidator.sanitizeInput(betData.notes || '')
    };

    this.bets.push(bet);

    if (this.saveBets()) {
      return {
        success: true,
        errors: [],
        bet
      };
    } else {
      // Remove the bet if save failed
      this.bets = this.bets.filter(b => b.id !== bet.id);
      return {
        success: false,
        errors: ['Failed to save bet to storage'],
        bet: null
      };
    }
  }

  /**
   * Update bet status with validation
   */
  updateBetStatus(betId, newStatus, resultData = {}) {
    const bet = this.bets.find(b => b.id === betId);
    if (!bet) {
      return {
        success: false,
        errors: ['Bet not found']
      };
    }

    // Validate status transition
    const validation = BetValidator.validateBetStatus(newStatus, bet.status);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // Update status
    bet.status = newStatus;
    bet.result = resultData.result || null;

    // Calculate P&L
    if (newStatus === 'WON') {
      bet.pnl = this.calculatePnL(bet, true);
    } else if (newStatus === 'LOST') {
      bet.pnl = -bet.stake;
    } else if (newStatus === 'PUSH') {
      bet.pnl = 0;
    } else if (newStatus === 'CANCELLED') {
      bet.pnl = 0;
    }

    // Update CLV if provided
    if (resultData.clv !== undefined) {
      bet.clv = resultData.clv;
    }

    bet.settleTime = newStatus !== 'PENDING' ? new Date().toISOString() : null;

    if (this.saveBets()) {
      return {
        success: true,
        errors: [],
        bet
      };
    } else {
      return {
        success: false,
        errors: ['Failed to save bet update']
      };
    }
  }

  /**
   * Calculate P&L based on odds
   */
  calculatePnL(bet, won) {
    if (!won) return -bet.stake;

    if (bet.entryOdds > 0) {
      // Positive odds: profit = stake * (odds / 100)
      return Math.round((bet.stake * bet.entryOdds) / 100);
    } else {
      // Negative odds: profit = stake * (100 / abs(odds))
      return Math.round((bet.stake * 100) / Math.abs(bet.entryOdds));
    }
  }

  /**
   * Update live score for a bet
   */
  updateLiveScore(betId, scoreData) {
    const bet = this.bets.find(b => b.id === betId);
    if (!bet) return false;

    bet.liveScore = scoreData;

    // Auto-settle if game is final
    if (scoreData?.status === 'final') {
      if (scoreData.winner === 'won') {
        this.updateBetStatus(betId, 'WON', { result: 'won' });
      } else if (scoreData.winner === 'lost') {
        this.updateBetStatus(betId, 'LOST', { result: 'lost' });
      } else if (scoreData.winner === 'push') {
        this.updateBetStatus(betId, 'PUSH', { result: 'push' });
      }
    }

    this.saveBets();
    return true;
  }

  /**
   * Delete a bet
   */
  deleteBet(betId) {
    const initialLength = this.bets.length;
    this.bets = this.bets.filter(b => b.id !== betId);

    if (this.bets.length < initialLength) {
      this.saveBets();
      return {
        success: true,
        errors: []
      };
    } else {
      return {
        success: false,
        errors: ['Bet not found']
      };
    }
  }

  /**
   * Get all bets with optional filtering
   */
  getBets(filters = {}) {
    let results = [...this.bets];

    if (filters.status) {
      results = results.filter(b => b.status === filters.status);
    }

    if (filters.sport) {
      results = results.filter(b => b.sport === filters.sport);
    }

    if (filters.betType) {
      results = results.filter(b => b.betType === filters.betType);
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      results = results.filter(b => {
        const betTime = new Date(b.entryTime).getTime();
        return betTime >= start && betTime <= end;
      });
    }

    // Sort by entry time (newest first)
    results.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));

    return results;
  }

  /**
   * Get a single bet by ID
   */
  getBetById(betId) {
    return this.bets.find(b => b.id === betId);
  }

  /**
   * Export bets as JSON
   */
  exportAsJSON() {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        totalBets: this.bets.length,
        bets: this.bets
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `alexbet-bets-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
      return { success: true, errors: [] };
    } catch (err) {
      console.error('[BetTracker] Error exporting:', err);
      return { success: false, errors: [err.message] };
    }
  }

  /**
   * Import bets from JSON
   */
  async importFromJSON(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data.bets)) {
        return { success: false, errors: ['Invalid import format'] };
      }

      let imported = 0;
      const errors = [];

      for (const betData of data.bets) {
        const validation = BetValidator.validateBet(betData);
        if (validation.valid) {
          this.bets.push(betData);
          imported++;
        } else {
          errors.push(`Skipped invalid bet: ${betData.pick}`);
        }
      }

      this.saveBets();
      return {
        success: imported > 0,
        imported,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (err) {
      console.error('[BetTracker] Error importing:', err);
      return { success: false, errors: [err.message] };
    }
  }

  /**
   * Clear all bets (requires confirmation)
   */
  clearAllBets(confirm = false) {
    if (!confirm) {
      return { success: false, errors: ['Confirmation required to clear all bets'] };
    }

    const count = this.bets.length;
    this.bets = [];
    this.saveBets();

    return {
      success: true,
      errors: [],
      message: `Cleared ${count} bets`
    };
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats() {
    try {
      const serialized = JSON.stringify(this.bets);
      const sizeInBytes = new Blob([serialized]).size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      const sizeInMB = (sizeInBytes / 1048576).toFixed(3);

      return {
        totalBets: this.bets.length,
        sizeBytes: sizeInBytes,
        sizeKB: parseFloat(sizeInKB),
        sizeMB: parseFloat(sizeInMB),
        quotaMB: 5, // Approximate LocalStorage quota
        percentUsed: ((sizeInBytes / (5 * 1048576)) * 100).toFixed(1)
      };
    } catch (err) {
      console.error('[BetTracker] Error calculating storage:', err);
      return null;
    }
  }
}
