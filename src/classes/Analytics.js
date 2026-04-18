/**
 * Analytics - Comprehensive bet analytics and statistics
 * Calculates win rate, ROI, P&L, edge analysis, and more
 */

class Analytics {
  constructor(bets = []) {
    this.bets = bets;
  }

  /**
   * Update bets reference
   */
  updateBets(bets) {
    this.bets = bets;
  }

  /**
   * Get overall statistics
   */
  getOverallStats() {
    const settled = this.bets.filter(b => b.status !== 'PENDING');

    if (settled.length === 0) {
      return {
        totalBets: 0,
        settledBets: 0,
        pendingBets: this.bets.length,
        winRate: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        totalWagered: 0,
        totalPnL: 0,
        roi: 0,
        avgOdds: 0,
        avgStake: 0,
        avgEdge: 0
      };
    }

    const wins = settled.filter(b => b.status === 'WON').length;
    const losses = settled.filter(b => b.status === 'LOST').length;
    const pushes = settled.filter(b => b.status === 'PUSH').length;
    const totalWagered = settled.reduce((sum, b) => sum + b.stake, 0);
    const totalPnL = settled.reduce((sum, b) => sum + (b.pnl || 0), 0);
    const roi = totalWagered > 0 ? ((totalPnL / totalWagered) * 100).toFixed(2) : 0;
    const winRate = ((wins / settled.length) * 100).toFixed(2);
    const avgOdds = (settled.reduce((sum, b) => sum + b.entryOdds, 0) / settled.length).toFixed(1);
    const avgStake = (totalWagered / settled.length).toFixed(2);
    const avgEdge = (settled.reduce((sum, b) => sum + (b.edge || 0), 0) / settled.length).toFixed(2);

    return {
      totalBets: this.bets.length,
      settledBets: settled.length,
      pendingBets: this.bets.filter(b => b.status === 'PENDING').length,
      winRate: parseFloat(winRate),
      wins,
      losses,
      pushes,
      totalWagered: Math.round(totalWagered),
      totalPnL: Math.round(totalPnL),
      roi: parseFloat(roi),
      avgOdds: parseFloat(avgOdds),
      avgStake: parseFloat(avgStake),
      avgEdge: parseFloat(avgEdge),
      profitability: totalPnL > 0 ? '✅ Profitable' : totalPnL < 0 ? '❌ Losing' : '➖ Breakeven'
    };
  }

  /**
   * Get statistics by sport
   */
  getStatsByBySport() {
    const sportGroups = {};

    this.bets.forEach(bet => {
      if (!sportGroups[bet.sport]) {
        sportGroups[bet.sport] = [];
      }
      sportGroups[bet.sport].push(bet);
    });

    const stats = {};

    Object.keys(sportGroups).forEach(sport => {
      const bets = sportGroups[sport];
      const settled = bets.filter(b => b.status !== 'PENDING');

      const wins = settled.filter(b => b.status === 'WON').length;
      const totalWagered = settled.reduce((sum, b) => sum + b.stake, 0);
      const totalPnL = settled.reduce((sum, b) => sum + (b.pnl || 0), 0);

      stats[sport] = {
        total: bets.length,
        settled: settled.length,
        pending: bets.filter(b => b.status === 'PENDING').length,
        wins,
        losses: settled.filter(b => b.status === 'LOST').length,
        pushes: settled.filter(b => b.status === 'PUSH').length,
        winRate: settled.length > 0 ? ((wins / settled.length) * 100).toFixed(1) : 0,
        totalWagered: Math.round(totalWagered),
        totalPnL: Math.round(totalPnL),
        roi: totalWagered > 0 ? ((totalPnL / totalWagered) * 100).toFixed(2) : 0,
        avgOdds: settled.length > 0 ? (bets.reduce((sum, b) => sum + b.entryOdds, 0) / bets.length).toFixed(1) : 0,
        avgEdge: settled.length > 0 ? (bets.reduce((sum, b) => sum + (b.edge || 0), 0) / bets.length).toFixed(2) : 0
      };
    });

    return stats;
  }

  /**
   * Get statistics by bet type
   */
  getStatsByBetType() {
    const typeGroups = {};

    this.bets.forEach(bet => {
      if (!typeGroups[bet.betType]) {
        typeGroups[bet.betType] = [];
      }
      typeGroups[bet.betType].push(bet);
    });

    const stats = {};

    Object.keys(typeGroups).forEach(type => {
      const bets = typeGroups[type];
      const settled = bets.filter(b => b.status !== 'PENDING');

      const wins = settled.filter(b => b.status === 'WON').length;
      const totalWagered = settled.reduce((sum, b) => sum + b.stake, 0);
      const totalPnL = settled.reduce((sum, b) => sum + (b.pnl || 0), 0);

      stats[type] = {
        total: bets.length,
        settled: settled.length,
        wins,
        losses: settled.filter(b => b.status === 'LOST').length,
        pushes: settled.filter(b => b.status === 'PUSH').length,
        winRate: settled.length > 0 ? ((wins / settled.length) * 100).toFixed(1) : 0,
        totalWagered: Math.round(totalWagered),
        totalPnL: Math.round(totalPnL),
        roi: totalWagered > 0 ? ((totalPnL / totalWagered) * 100).toFixed(2) : 0
      };
    });

    return stats;
  }

  /**
   * Get winning and losing streaks
   */
  getStreaks() {
    const settled = this.bets
      .filter(b => b.status !== 'PENDING')
      .sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));

    if (settled.length === 0) {
      return {
        currentStreak: { type: 'none', count: 0 },
        longestWinStreak: 0,
        longestLossStreak: 0
      };
    }

    let currentStreak = { type: 'none', count: 0 };
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;

    settled.forEach(bet => {
      if (bet.status === 'WON') {
        tempWinStreak++;
        tempLossStreak = 0;
      } else if (bet.status === 'LOST') {
        tempLossStreak++;
        tempWinStreak = 0;
      } else if (bet.status === 'PUSH') {
        tempWinStreak = 0;
        tempLossStreak = 0;
      }

      longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
      longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
    });

    // Determine current streak
    const lastBet = settled[settled.length - 1];
    if (lastBet.status === 'WON' && tempWinStreak > 0) {
      currentStreak = { type: 'wins', count: tempWinStreak };
    } else if (lastBet.status === 'LOST' && tempLossStreak > 0) {
      currentStreak = { type: 'losses', count: tempLossStreak };
    }

    return {
      currentStreak,
      longestWinStreak,
      longestLossStreak
    };
  }

  /**
   * Get best and worst performing bets
   */
  getPerformanceOutliers() {
    const settled = this.bets.filter(b => b.status !== 'PENDING');

    if (settled.length === 0) {
      return { bestBet: null, worstBet: null };
    }

    const bestBet = settled.reduce((best, current) => {
      const currentPnL = current.pnl || 0;
      const bestPnL = best.pnl || 0;
      return currentPnL > bestPnL ? current : best;
    });

    const worstBet = settled.reduce((worst, current) => {
      const currentPnL = current.pnl || 0;
      const worstPnL = worst.pnl || 0;
      return currentPnL < worstPnL ? current : worst;
    });

    return { bestBet, worstBet };
  }

  /**
   * Get edge analysis
   */
  getEdgeAnalysis() {
    const settled = this.bets.filter(b => b.status !== 'PENDING');

    if (settled.length === 0) {
      return {
        avgEdge: 0,
        positiveEdgeBets: 0,
        negativeEdgeBets: 0,
        positiveEdgeWinRate: 0,
        negativeEdgeWinRate: 0
      };
    }

    const positiveEdgeBets = settled.filter(b => (b.edge || 0) > 0);
    const negativeEdgeBets = settled.filter(b => (b.edge || 0) <= 0);

    const positiveEdgeWins = positiveEdgeBets.filter(b => b.status === 'WON').length;
    const negativeEdgeWins = negativeEdgeBets.filter(b => b.status === 'WON').length;

    return {
      avgEdge: (settled.reduce((sum, b) => sum + (b.edge || 0), 0) / settled.length).toFixed(2),
      positiveEdgeBets: positiveEdgeBets.length,
      negativeEdgeBets: negativeEdgeBets.length,
      positiveEdgeWinRate: positiveEdgeBets.length > 0 ? ((positiveEdgeWins / positiveEdgeBets.length) * 100).toFixed(1) : 0,
      negativeEdgeWinRate: negativeEdgeBets.length > 0 ? ((negativeEdgeWins / negativeEdgeBets.length) * 100).toFixed(1) : 0
    };
  }

  /**
   * Get ROI by confidence level
   */
  getROIByConfidence() {
    const confidenceGroups = {};

    this.bets.forEach(bet => {
      const confidence = bet.confidence || 5;
      if (!confidenceGroups[confidence]) {
        confidenceGroups[confidence] = [];
      }
      confidenceGroups[confidence].push(bet);
    });

    const stats = {};

    Object.keys(confidenceGroups)
      .sort((a, b) => a - b)
      .forEach(confidence => {
        const bets = confidenceGroups[confidence];
        const settled = bets.filter(b => b.status !== 'PENDING');

        const totalWagered = settled.reduce((sum, b) => sum + b.stake, 0);
        const totalPnL = settled.reduce((sum, b) => sum + (b.pnl || 0), 0);

        stats[confidence] = {
          bets: bets.length,
          settled: settled.length,
          winRate: settled.length > 0 ? ((settled.filter(b => b.status === 'WON').length / settled.length) * 100).toFixed(1) : 0,
          roi: totalWagered > 0 ? ((totalPnL / totalWagered) * 100).toFixed(2) : 0,
          totalPnL: Math.round(totalPnL)
        };
      });

    return stats;
  }

  /**
   * Get daily stats
   */
  getDailyStats(days = 7) {
    const dailyGroups = {};
    const now = Date.now();
    const timeWindow = days * 24 * 60 * 60 * 1000;

    this.bets
      .filter(b => (now - new Date(b.entryTime).getTime()) <= timeWindow)
      .forEach(bet => {
        const date = new Date(bet.entryTime).toISOString().split('T')[0];
        if (!dailyGroups[date]) {
          dailyGroups[date] = [];
        }
        dailyGroups[date].push(bet);
      });

    const stats = {};

    Object.keys(dailyGroups)
      .sort()
      .forEach(date => {
        const bets = dailyGroups[date];
        const settled = bets.filter(b => b.status !== 'PENDING');
        const wins = settled.filter(b => b.status === 'WON').length;
        const totalWagered = settled.reduce((sum, b) => sum + b.stake, 0);
        const totalPnL = settled.reduce((sum, b) => sum + (b.pnl || 0), 0);

        stats[date] = {
          bets: bets.length,
          settled: settled.length,
          wins,
          losses: settled.filter(b => b.status === 'LOST').length,
          winRate: settled.length > 0 ? ((wins / settled.length) * 100).toFixed(1) : 0,
          totalWagered: Math.round(totalWagered),
          totalPnL: Math.round(totalPnL)
        };
      });

    return stats;
  }

  /**
   * Calculate win rate percentage with target analysis
   */
  getWinRateStatus() {
    const overall = this.getOverallStats();
    const target = 56; // 56-65% win rate target

    return {
      current: parseFloat(overall.winRate),
      target,
      targetHigh: 65,
      onTrack: overall.winRate >= target,
      status: overall.winRate >= 65 ? '🔥 Exceeding target!' : overall.winRate >= 56 ? '✅ On track!' : '⚠️ Below target',
      betsNeeded: overall.settledBets > 0 ? Math.ceil(((target * overall.settledBets) - overall.wins) / (1 - (target / 100))) : 0,
      message: this._getWinRateMessage(overall.winRate, overall.wins, overall.losses, overall.settledBets)
    };
  }

  /**
   * Generate win rate message
   */
  _getWinRateMessage(winRate, wins, losses, settled) {
    if (settled < 10) {
      return `Too few settled bets (${settled}). Need at least 10 for statistical significance.`;
    }

    if (winRate >= 65) {
      return `Excellent! ${wins}W-${losses}L. Ready for launch!`;
    } else if (winRate >= 56) {
      return `Good progress! ${wins}W-${losses}L. Continuing validation.`;
    } else if (winRate >= 52) {
      return `Getting closer. ${wins}W-${losses}L. Keep testing.`;
    } else {
      return `Below target. ${wins}W-${losses}L. Review strategy.`;
    }
  }

  /**
   * Export analytics report
   */
  generateReport() {
    return {
      generatedAt: new Date().toISOString(),
      overall: this.getOverallStats(),
      bySport: this.getStatsByBySport(),
      byBetType: this.getStatsByBetType(),
      streaks: this.getStreaks(),
      outliers: this.getPerformanceOutliers(),
      edgeAnalysis: this.getEdgeAnalysis(),
      roiByConfidence: this.getROIByConfidence(),
      winRateStatus: this.getWinRateStatus()
    };
  }
}
