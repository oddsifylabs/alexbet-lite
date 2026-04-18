/**
 * EnhancedStatistics - Advanced statistical analysis and reporting
 * Provides variance, Sharpe ratio, confidence intervals, and advanced metrics
 */

class EnhancedStatistics {
  constructor(analytics) {
    this.analytics = analytics;
  }

  /**
   * Calculate variance and standard deviation of returns
   */
  calculateVariance() {
    const settled = this.analytics.bets.filter(b => b.status !== 'PENDING');
    if (settled.length < 2) {
      return { variance: 0, stdDev: 0, mean: 0 };
    }

    const returns = settled.map(b => {
      return b.stake > 0 ? (b.pnl / b.stake) * 100 : 0;
    });

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    return {
      variance: variance.toFixed(2),
      stdDev: stdDev.toFixed(2),
      mean: mean.toFixed(2),
      min: Math.min(...returns).toFixed(2),
      max: Math.max(...returns).toFixed(2)
    };
  }

  /**
   * Calculate Sharpe Ratio (risk-adjusted returns)
   * Assumes 0% risk-free rate for simplicity
   */
  calculateSharpeRatio(riskFreeRate = 0) {
    const stats = this.analytics.getOverallStats();
    const variance = this.calculateVariance();

    if (parseFloat(variance.stdDev) === 0) return 0;

    const meanReturn = parseFloat(variance.mean);
    const sharpeRatio = (meanReturn - riskFreeRate) / parseFloat(variance.stdDev);

    return isFinite(sharpeRatio) ? sharpeRatio.toFixed(2) : 0;
  }

  /**
   * Calculate Sortino Ratio (downside risk-adjusted returns)
   */
  calculateSortinoRatio(targetReturn = 0) {
    const settled = this.analytics.bets.filter(b => b.status !== 'PENDING');
    if (settled.length < 2) return 0;

    const returns = settled.map(b => {
      return b.stake > 0 ? (b.pnl / b.stake) * 100 : 0;
    });

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;

    // Downside deviation (only negative deviations)
    const downsideVariance = returns.reduce((sum, r) => {
      const downside = Math.min(r - targetReturn, 0);
      return sum + Math.pow(downside, 2);
    }, 0) / returns.length;

    const downsideDeviation = Math.sqrt(downsideVariance);

    if (downsideDeviation === 0) return 0;

    const sortinoRatio = (mean - targetReturn) / downsideDeviation;
    return isFinite(sortinoRatio) ? sortinoRatio.toFixed(2) : 0;
  }

  /**
   * Calculate Win Rate Confidence Interval
   */
  calculateWinRateConfidenceInterval(confidence = 0.95) {
    const stats = this.analytics.getOverallStats();
    const n = stats.settledBets;
    const p = stats.winRate / 100;

    if (n === 0) return { lower: 0, upper: 0, margin: 0 };

    // Standard error
    const se = Math.sqrt((p * (1 - p)) / n);

    // Z-score for 95% confidence
    const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;

    const margin = (zScore * se * 100).toFixed(2);
    const lower = Math.max(0, (p * 100 - margin).toFixed(2));
    const upper = Math.min(100, (p * 100 + parseFloat(margin)).toFixed(2));

    return {
      winRate: stats.winRate,
      confidence: `${confidence * 100}%`,
      lower: parseFloat(lower),
      upper: parseFloat(upper),
      margin: parseFloat(margin),
      sampleSize: n
    };
  }

  /**
   * Calculate ROI Confidence Interval
   */
  calculateROIConfidenceInterval(confidence = 0.95) {
    const variance = this.calculateVariance();
    const stats = this.analytics.getOverallStats();
    const settled = this.analytics.bets.filter(b => b.status !== 'PENDING');

    if (settled.length < 2) {
      return { roi: 0, lower: 0, upper: 0, margin: 0 };
    }

    const mean = parseFloat(variance.mean);
    const stdDev = parseFloat(variance.stdDev);
    const n = settled.length;

    // Standard error of mean
    const se = stdDev / Math.sqrt(n);

    // T-score (using Z as approximation for large n)
    const tScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;

    const margin = (tScore * se).toFixed(2);
    const lower = (mean - parseFloat(margin)).toFixed(2);
    const upper = (mean + parseFloat(margin)).toFixed(2);

    return {
      roi: stats.roi,
      confidence: `${confidence * 100}%`,
      lower: parseFloat(lower),
      upper: parseFloat(upper),
      margin: parseFloat(margin),
      sampleSize: n
    };
  }

  /**
   * Calculate Max Drawdown
   */
  calculateMaxDrawdown() {
    const settled = this.analytics.bets
      .filter(b => b.status !== 'PENDING')
      .sort((a, b) => new Date(a.placedDate) - new Date(b.placedDate));

    if (settled.length === 0) return { maxDrawdown: 0, period: null, recovery: null };

    let peak = 0;
    let maxDrawdown = 0;
    let drawdownStart = null;
    let drawdownEnd = null;
    let cumulativePnL = 0;

    settled.forEach((bet, idx) => {
      cumulativePnL += bet.pnl || 0;

      if (cumulativePnL > peak) {
        peak = cumulativePnL;
      }

      const drawdown = ((cumulativePnL - peak) / Math.max(Math.abs(peak), 1)) * 100;

      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
        drawdownStart = new Date(bet.placedDate);
        drawdownEnd = idx;
      }
    });

    // Find recovery
    let recoveryIdx = null;
    if (drawdownEnd) {
      for (let i = drawdownEnd + 1; i < settled.length; i++) {
        let testPnL = settled.slice(drawdownEnd + 1, i + 1)
          .reduce((sum, b) => sum + (b.pnl || 0), cumulativePnL);

        if (testPnL >= peak) {
          recoveryIdx = i;
          break;
        }
      }
    }

    return {
      maxDrawdown: maxDrawdown.toFixed(2),
      percentage: Math.abs(maxDrawdown).toFixed(2),
      startDate: drawdownStart,
      recoveryDays: recoveryIdx ? (recoveryIdx - drawdownEnd) : null
    };
  }

  /**
   * Calculate Consecutive Wins/Losses
   */
  calculateConsecutiveStats() {
    const settled = this.analytics.bets
      .filter(b => b.status !== 'PENDING')
      .sort((a, b) => new Date(a.placedDate) - new Date(b.placedDate));

    if (settled.length === 0) {
      return {
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        currentStreak: 0,
        streakType: null
      };
    }

    let maxWins = 0;
    let maxLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;
    let currentStreak = 0;
    let streakType = null;

    settled.forEach((bet, idx) => {
      if (bet.status === 'WON') {
        currentWins++;
        currentLosses = 0;
        currentStreak++;

        if (currentWins > maxWins) {
          maxWins = currentWins;
        }

        if (idx === settled.length - 1) {
          streakType = 'Win';
        }
      } else if (bet.status === 'LOST') {
        currentLosses++;
        currentWins = 0;
        currentStreak++;

        if (currentLosses > maxLosses) {
          maxLosses = currentLosses;
        }

        if (idx === settled.length - 1) {
          streakType = 'Loss';
        }
      }
    });

    return {
      maxConsecutiveWins: maxWins,
      maxConsecutiveLosses: maxLosses,
      currentStreak: currentStreak,
      streakType: streakType
    };
  }

  /**
   * Calculate Kelly Criterion recommendation
   */
  calculateKellyCriterion() {
    const stats = this.analytics.getOverallStats();

    if (stats.settledBets === 0) {
      return { kellyPercentage: 0, recommendation: 'Insufficient data' };
    }

    const p = stats.winRate / 100; // Win probability
    const q = 1 - p; // Loss probability
    const b = Math.abs(stats.avgOdds); // Average odds (simplified)

    // Kelly formula: f = (bp - q) / b
    const kellyPercentage = ((p * b - q) / b) * 100;

    let recommendation;
    if (kellyPercentage <= 0) {
      recommendation = 'No positive edge detected';
    } else if (kellyPercentage < 1) {
      recommendation = 'Very conservative sizing (< 1%)';
    } else if (kellyPercentage < 3) {
      recommendation = 'Conservative sizing (1-3%)';
    } else if (kellyPercentage < 5) {
      recommendation = 'Standard sizing (3-5%)';
    } else {
      recommendation = `Aggressive sizing (${kellyPercentage.toFixed(1)}%) - Consider half Kelly`;
    }

    return {
      kellyPercentage: Math.max(0, kellyPercentage).toFixed(2),
      recommendation,
      note: 'Half-Kelly (50%) is often recommended for safety'
    };
  }

  /**
   * Generate comprehensive statistics report
   */
  generateReport() {
    const stats = this.analytics.getOverallStats();
    const variance = this.calculateVariance();
    const sharpeRatio = this.calculateSharpeRatio();
    const sortinoRatio = this.calculateSortinoRatio();
    const winRateCI = this.calculateWinRateConfidenceInterval();
    const roiCI = this.calculateROIConfidenceInterval();
    const maxDrawdown = this.calculateMaxDrawdown();
    const consecutiveStats = this.calculateConsecutiveStats();
    const kellyCriterion = this.calculateKellyCriterion();

    return {
      timestamp: new Date().toISOString(),
      basicStats: stats,
      variance: variance,
      riskMetrics: {
        sharpeRatio,
        sortinoRatio,
        maxDrawdown: maxDrawdown.maxDrawdown,
        maxDrawdownPercentage: maxDrawdown.percentage
      },
      confidenceIntervals: {
        winRate: winRateCI,
        roi: roiCI
      },
      streaks: consecutiveStats,
      kellyCriterion: kellyCriterion,
      recommendations: this.generateRecommendations(stats, variance)
    };
  }

  /**
   * Generate recommendations based on statistics
   */
  generateRecommendations(stats, variance) {
    const recommendations = [];

    // Volatility analysis
    if (parseFloat(variance.stdDev) > 50) {
      recommendations.push('⚠️ High volatility detected. Consider increasing sample size or diversifying bets.');
    } else if (parseFloat(variance.stdDev) < 20) {
      recommendations.push('✅ Low volatility. Consistent performance.');
    }

    // Consistency
    if (stats.winRate > 52 && stats.roi > 0) {
      recommendations.push('🎯 Strong consistency. Your system shows edge.');
    }

    // Risk/Reward
    const avgWin = this.calculateAverageWin();
    const avgLoss = this.calculateAverageLoss();

    if (avgWin > avgLoss * 1.5) {
      recommendations.push('✅ Good risk/reward ratio. Wins are larger than losses.');
    }

    // Frequency
    if (stats.settledBets > 50 && stats.roi > 5) {
      recommendations.push('🚀 You can scale up with confidence.');
    }

    return recommendations;
  }

  /**
   * Calculate average win size
   */
  calculateAverageWin() {
    const wins = this.analytics.bets.filter(b => b.status === 'WON');
    if (wins.length === 0) return 0;

    const totalWin = wins.reduce((sum, b) => sum + (b.pnl || 0), 0);
    return (totalWin / wins.length).toFixed(2);
  }

  /**
   * Calculate average loss size
   */
  calculateAverageLoss() {
    const losses = this.analytics.bets.filter(b => b.status === 'LOST');
    if (losses.length === 0) return 0;

    const totalLoss = losses.reduce((sum, b) => sum + Math.abs(b.pnl || 0), 0);
    return (totalLoss / losses.length).toFixed(2);
  }

  /**
   * Get pro/amateur comparison
   */
  getProfessionalComparison() {
    const stats = this.analytics.getOverallStats();

    return {
      yourStats: {
        winRate: stats.winRate,
        roi: stats.roi,
        sharpeRatio: parseFloat(this.calculateSharpeRatio())
      },
      professionalBenchmarks: {
        winRate: 52.5, // Professional sharp expectation
        roi: 5,
        sharpeRatio: 1.5
      },
      evaluation: {
        winRateComparison: stats.winRate >= 52.5 ? '✅ Professional level' : '📈 Keep improving',
        roiComparison: stats.roi >= 5 ? '✅ Professional level' : '📈 Keep improving',
        sharpeComparison: parseFloat(this.calculateSharpeRatio()) >= 1.5 ? '✅ Professional level' : '📈 Keep improving'
      }
    };
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedStatistics;
}
