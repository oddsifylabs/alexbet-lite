/**
 * AlexBET Lite - Closed Line History Tracker
 * Tracks line movement to identify betting timing patterns
 */

class LineHistoryTracker {
  constructor() {
    this.history = JSON.parse(localStorage.getItem('alexbet_line_history')) || {};
  }

  /**
   * Record a closing line for analysis
   */
  recordClosingLine(betId, pick, entryOdds, closingOdds, daysBeforeGame) {
    if (!this.history[betId]) {
      this.history[betId] = {
        pick,
        entries: []
      };
    }

    this.history[betId].entries.push({
      entryOdds,
      closingOdds,
      daysBeforeGame,
      timestamp: new Date().toISOString()
    });

    localStorage.setItem('alexbet_line_history', JSON.stringify(this.history));
  }

  /**
   * Analyze betting timing
   * Returns: "You're betting too early/late" recommendations
   */
  analyzeBettingTiming(bets) {
    if (bets.length === 0) return null;

    let totalMovement = 0;
    let betsAnalyzed = 0;
    let tooEarlyCount = 0;
    let tooLateCount = 0;

    bets.forEach(bet => {
      if (bet.closingOdds && bet.entryOdds) {
        const movement = Math.abs(bet.closingOdds - bet.entryOdds);
        totalMovement += movement;
        betsAnalyzed++;

        // Analyze timing based on movement
        if (movement > 10) {
          if (bet.entryOdds > bet.closingOdds) {
            tooEarlyCount++; // Line moved against you
          } else {
            tooLateCount++; // Line moved for you
          }
        }
      }
    });

    const avgMovement = betsAnalyzed > 0 ? (totalMovement / betsAnalyzed).toFixed(1) : 0;
    const timing = tooEarlyCount > tooLateCount ? 'early' : tooLateCount > tooEarlyCount ? 'late' : 'optimal';

    return {
      avgMovement,
      timing,
      recommendation: timing === 'early' 
        ? 'You\'re betting too early. Wait closer to game time for better line quality.'
        : timing === 'late'
        ? 'You\'re betting too late. Lines have already moved against you.'
        : 'Your timing is optimal. Keep it up!',
      tooEarlyCount,
      tooLateCount
    };
  }

  /**
   * Get line movement chart data
   */
  getLineMovementStats(bets) {
    const movements = bets
      .filter(b => b.closingOdds && b.entryOdds)
      .map(b => ({
        pick: b.pick,
        movement: b.closingOdds - b.entryOdds,
        favorable: b.closingOdds > b.entryOdds
      }));

    return {
      totalBets: movements.length,
      avgMovement: movements.length > 0 
        ? (movements.reduce((sum, m) => sum + m.movement, 0) / movements.length).toFixed(2)
        : 0,
      favorableMoves: movements.filter(m => m.favorable).length,
      unfavorableMoves: movements.filter(m => !m.favorable).length,
      movements
    };
  }
}

const lineHistory = new LineHistoryTracker();
