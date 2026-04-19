/**
 * BetAnalytics - Comprehensive betting analytics and statistics
 * Provides sport-specific breakdowns, streak tracking, ROI calculations, and insights
 */
class BetAnalytics {
  constructor(betTracker) {
    this.betTracker = betTracker;
  }

  /**
   * Get overall statistics
   */
  getOverallStats() {
    const bets = this.betTracker.bets;
    const settledBets = bets.filter(b => b.status !== 'PENDING');
    
    if (settledBets.length === 0) {
      return {
        totalBets: 0,
        settledBets: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        winRate: 0,
        totalStaked: 0,
        totalPnL: 0,
        roi: 0,
        avgOdds: 0,
        avgConfidence: 0,
        avgEdge: 0,
        profitableStreak: 0,
        longestWinStreak: 0,
        longestLossStreak: 0
      };
    }

    const wins = settledBets.filter(b => b.status === 'WON').length;
    const losses = settledBets.filter(b => b.status === 'LOST').length;
    const pushes = settledBets.filter(b => b.status === 'PUSH').length;
    const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
    const totalPnL = settledBets.reduce((sum, b) => sum + (b.pnl || 0), 0);

    return {
      totalBets: bets.length,
      settledBets: settledBets.length,
      wins,
      losses,
      pushes,
      winRate: settledBets.length > 0 ? ((wins / settledBets.length) * 100).toFixed(1) : 0,
      totalStaked: totalStaked.toFixed(2),
      totalPnL: totalPnL.toFixed(2),
      roi: totalStaked > 0 ? ((totalPnL / totalStaked) * 100).toFixed(1) : 0,
      avgOdds: this._calculateAverage(bets, 'entryOdds'),
      avgConfidence: this._calculateAverage(bets, 'confidence'),
      avgEdge: this._calculateAverage(bets, 'edge'),
      profitableStreak: this._calculateProfitableStreak(settledBets),
      longestWinStreak: this._calculateLongestWinStreak(settledBets),
      longestLossStreak: this._calculateLongestLossStreak(settledBets)
    };
  }

  /**
   * Get statistics by sport
   */
  getStatsBySport() {
    const bets = this.betTracker.bets;
    const sportGroups = {};

    bets.forEach(bet => {
      if (!sportGroups[bet.sport]) {
        sportGroups[bet.sport] = [];
      }
      sportGroups[bet.sport].push(bet);
    });

    const statsBySport = {};
    Object.entries(sportGroups).forEach(([sport, sportBets]) => {
      const settledBets = sportBets.filter(b => b.status !== 'PENDING');
      const wins = settledBets.filter(b => b.status === 'WON').length;
      const totalStaked = sportBets.reduce((sum, b) => sum + b.stake, 0);
      const totalPnL = settledBets.reduce((sum, b) => sum + (b.pnl || 0), 0);

      statsBySport[sport] = {
        sport,
        bets: sportBets.length,
        settledBets: settledBets.length,
        wins,
        winRate: settledBets.length > 0 ? ((wins / settledBets.length) * 100).toFixed(1) : 0,
        totalStaked: totalStaked.toFixed(2),
        totalPnL: totalPnL.toFixed(2),
        roi: totalStaked > 0 ? ((totalPnL / totalStaked) * 100).toFixed(1) : 0
      };
    });

    return statsBySport;
  }

  /**
   * Get statistics by bet type
   */
  getStatsByBetType() {
    const bets = this.betTracker.bets;
    const typeGroups = {};

    bets.forEach(bet => {
      const betType = bet.betType || 'UNKNOWN';
      if (!typeGroups[betType]) {
        typeGroups[betType] = [];
      }
      typeGroups[betType].push(bet);
    });

    const statsByType = {};
    Object.entries(typeGroups).forEach(([betType, typeBets]) => {
      const settledBets = typeBets.filter(b => b.status !== 'PENDING');
      const wins = settledBets.filter(b => b.status === 'WON').length;
      const totalStaked = typeBets.reduce((sum, b) => sum + b.stake, 0);
      const totalPnL = settledBets.reduce((sum, b) => sum + (b.pnl || 0), 0);

      statsByType[betType] = {
        betType,
        bets: typeBets.length,
        settledBets: settledBets.length,
        wins,
        winRate: settledBets.length > 0 ? ((wins / settledBets.length) * 100).toFixed(1) : 0,
        totalStaked: totalStaked.toFixed(2),
        totalPnL: totalPnL.toFixed(2),
        roi: totalStaked > 0 ? ((totalPnL / totalStaked) * 100).toFixed(1) : 0
      };
    });

    return statsByType;
  }

  /**
   * Get recent streak status
   */
  getStreaks() {
    const bets = this.betTracker.bets
      .filter(b => b.status !== 'PENDING')
      .sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));

    let currentStreak = 0;
    let currentStreakType = null;
    let longestWinStreak = 0;
    let longestLossStreak = 0;

    bets.forEach(bet => {
      const isWin = bet.status === 'WON';
      if (currentStreakType === null) {
        currentStreakType = isWin ? 'WIN' : 'LOSS';
        currentStreak = 1;
      } else if ((isWin && currentStreakType === 'WIN') || (!isWin && currentStreakType === 'LOSS')) {
        currentStreak++;
      } else {
        if (currentStreakType === 'WIN' && currentStreak > longestWinStreak) {
          longestWinStreak = currentStreak;
        }
        if (currentStreakType === 'LOSS' && currentStreak > longestLossStreak) {
          longestLossStreak = currentStreak;
        }
        currentStreakType = isWin ? 'WIN' : 'LOSS';
        currentStreak = 1;
      }
    });

    // Check final streak
    if (currentStreakType === 'WIN' && currentStreak > longestWinStreak) {
      longestWinStreak = currentStreak;
    }
    if (currentStreakType === 'LOSS' && currentStreak > longestLossStreak) {
      longestLossStreak = currentStreak;
    }

    return {
      currentStreak,
      currentStreakType,
      longestWinStreak,
      longestLossStreak,
      currentStreakEmoji: currentStreakType === 'WIN' ? '✅' : currentStreakType === 'LOSS' ? '❌' : '⚪'
    };
  }

  /**
   * Get confidence-based performance
   */
  getPerformanceByConfidence() {
    const bets = this.betTracker.bets.filter(b => b.status !== 'PENDING');
    const confidenceBuckets = {};

    // Create buckets: 1-3, 4-6, 7-8, 9-10
    const buckets = [
      { min: 1, max: 3, label: 'Low (1-3)' },
      { min: 4, max: 6, label: 'Medium (4-6)' },
      { min: 7, max: 8, label: 'High (7-8)' },
      { min: 9, max: 10, label: 'Very High (9-10)' }
    ];

    buckets.forEach(bucket => {
      const bucketBets = bets.filter(b => b.confidence >= bucket.min && b.confidence <= bucket.max);
      const wins = bucketBets.filter(b => b.status === 'WON').length;
      const totalStaked = bucketBets.reduce((sum, b) => sum + b.stake, 0);
      const totalPnL = bucketBets.reduce((sum, b) => sum + (b.pnl || 0), 0);

      confidenceBuckets[bucket.label] = {
        count: bucketBets.length,
        wins,
        winRate: bucketBets.length > 0 ? ((wins / bucketBets.length) * 100).toFixed(1) : 0,
        totalStaked: totalStaked.toFixed(2),
        totalPnL: totalPnL.toFixed(2),
        roi: totalStaked > 0 ? ((totalPnL / totalStaked) * 100).toFixed(1) : 0
      };
    });

    return confidenceBuckets;
  }

  /**
   * Get insight recommendations
   */
  getInsights() {
    const stats = this.getOverallStats();
    const byConfidence = this.getPerformanceByConfidence();
    const streaks = this.getStreaks();
    const insights = [];

    // Check win rate
    if (stats.settledBets > 5) {
      const winRate = parseFloat(stats.winRate);
      if (winRate > 55) {
        insights.push({
          type: 'positive',
          emoji: '🚀',
          message: `Excellent win rate of ${stats.winRate}% - Keep up the discipline!`
        });
      } else if (winRate < 45) {
        insights.push({
          type: 'warning',
          emoji: '⚠️',
          message: `Win rate below 45% - Review your selection criteria`
        });
      }
    }

    // Check ROI
    const roi = parseFloat(stats.roi);
    if (roi < -10) {
      insights.push({
        type: 'danger',
        emoji: '📉',
        message: `Negative ROI of ${stats.roi}% - Consider adjusting strategy`
      });
    } else if (roi > 10) {
      insights.push({
        type: 'positive',
        emoji: '📈',
        message: `Strong ROI of ${stats.roi}% - Your edge is working!`
      });
    }

    // Check confidence alignment
    const veryHighConf = byConfidence['Very High (9-10)'];
    if (veryHighConf && parseFloat(veryHighConf.winRate) > 60) {
      insights.push({
        type: 'positive',
        emoji: '🎯',
        message: `High confidence bets (9-10) hitting at ${veryHighConf.winRate}% - Trust your analysis`
      });
    }

    // Check current streak
    if (streaks.currentStreak >= 3) {
      if (streaks.currentStreakType === 'WIN') {
        insights.push({
          type: 'positive',
          emoji: '🔥',
          message: `Hot streak! ${streaks.currentStreak} wins in a row - Momentum is on your side`
        });
      } else {
        insights.push({
          type: 'warning',
          emoji: '❄️',
          message: `Cold streak! ${streaks.currentStreak} losses - Take a break and review`
        });
      }
    }

    return insights;
  }

  // Helper methods
  _calculateAverage(bets, field) {
    if (bets.length === 0) return 0;
    const sum = bets.reduce((acc, bet) => acc + (bet[field] || 0), 0);
    return (sum / bets.length).toFixed(2);
  }

  _calculateProfitableStreak(settledBets) {
    let streak = 0;
    let sortedBets = settledBets.sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
    for (let bet of sortedBets) {
      if ((bet.pnl || 0) > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  _calculateLongestWinStreak(settledBets) {
    let maxStreak = 0;
    let currentStreak = 0;
    let sortedBets = settledBets.sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
    for (let bet of sortedBets) {
      if (bet.status === 'WON') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  }

  _calculateLongestLossStreak(settledBets) {
    let maxStreak = 0;
    let currentStreak = 0;
    let sortedBets = settledBets.sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
    for (let bet of sortedBets) {
      if (bet.status === 'LOST') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  }
}
