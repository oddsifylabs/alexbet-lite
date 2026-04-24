/**
 * AdvancedAnalytics - Enhanced dashboard analytics
 * - CLV trends over time (time-series data)
 * - Edge distribution (histogram)
 * - ROI by sportsbook (comparative analysis)
 * - Win rate confidence intervals (statistical uncertainty)
 */
class AdvancedAnalytics {
  constructor(betTracker) {
    this.betTracker = betTracker;
  }

  /**
   * Calculate CLV trends over time
   * Groups settled bets by date and calculates cumulative CLV
   */
  getCLVTrends(timeWindow = 'all') {
    const bets = this.betTracker.bets.filter(b => b.status !== 'PENDING');
    if (bets.length === 0) return { data: [], cumulativeCLV: 0 };

    // Sort bets by entry time
    const sortedBets = [...bets].sort((a, b) => 
      new Date(a.entryTime) - new Date(b.entryTime)
    );

    // Filter by time window
    const now = new Date();
    const filteredBets = sortedBets.filter(bet => {
      const betDate = new Date(bet.entryTime);
      switch(timeWindow) {
        case '7d': return (now - betDate) < 7 * 24 * 60 * 60 * 1000;
        case '30d': return (now - betDate) < 30 * 24 * 60 * 60 * 1000;
        case '90d': return (now - betDate) < 90 * 24 * 60 * 60 * 1000;
        case 'all': return true;
        default: return true;
      }
    });

    // Group by date
    const dateGroups = {};
    filteredBets.forEach(bet => {
      const date = bet.entryTime.split('T')[0];
      if (!dateGroups[date]) {
        dateGroups[date] = [];
      }
      dateGroups[date].push(bet);
    });

    // Calculate cumulative CLV
    let cumulativeCLV = 0;
    const trendData = [];

    Object.entries(dateGroups).sort().forEach(([date, dayBets]) => {
      const dayClv = dayBets.reduce((sum, bet) => sum + (bet.clv || 0), 0);
      cumulativeCLV += dayClv;
      
      trendData.push({
        date,
        dayClv: parseFloat(dayClv.toFixed(2)),
        cumulativeCLV: parseFloat(cumulativeCLV.toFixed(2)),
        betCount: dayBets.length,
        dayWins: dayBets.filter(b => b.status === 'WON').length
      });
    });

    return {
      data: trendData,
      cumulativeCLV: parseFloat(cumulativeCLV.toFixed(2)),
      avgDailyClv: trendData.length > 0 
        ? parseFloat((cumulativeCLV / trendData.length).toFixed(2))
        : 0,
      peakDay: trendData.length > 0
        ? trendData.reduce((max, d) => d.cumulativeCLV > max.cumulativeCLV ? d : max)
        : null
    };
  }

  /**
   * Calculate edge distribution (histogram)
   * Shows how many bets fall into each edge range
   */
  getEdgeDistribution() {
    const bets = this.betTracker.bets;
    if (bets.length === 0) return {};

    // Edge ranges: <0%, 0-1%, 1-3%, 3-5%, 5-10%, 10%+
    const ranges = {
      'negative': { min: -Infinity, max: 0, label: 'Negative Edge', bets: [], color: '#ff6464' },
      'minimal': { min: 0, max: 1, label: '0-1% Edge', bets: [], color: '#ffa726' },
      'low': { min: 1, max: 3, label: '1-3% Edge', bets: [], color: '#ffd93d' },
      'medium': { min: 3, max: 5, label: '3-5% Edge', bets: [], color: '#4dd0ff' },
      'high': { min: 5, max: 10, label: '5-10% Edge', bets: [], color: '#00d68f' },
      'excellent': { min: 10, max: Infinity, label: '10%+ Edge', bets: [], color: '#00ff88' }
    };

    // Distribute bets into ranges
    bets.forEach(bet => {
      const edge = parseFloat(bet.edge) || 0;
      Object.values(ranges).forEach(range => {
        if (edge > range.min && edge <= range.max) {
          range.bets.push(bet);
        }
      });
    });

    // Calculate stats for each range
    const distribution = {};
    Object.entries(ranges).forEach(([key, range]) => {
      const settledBets = range.bets.filter(b => b.status !== 'PENDING');
      const wins = settledBets.filter(b => b.status === 'WON').length;
      const totalPnL = settledBets.reduce((sum, b) => sum + (b.pnl || 0), 0);
      const totalStaked = range.bets.reduce((sum, b) => sum + b.stake, 0);

      distribution[key] = {
        label: range.label,
        count: range.bets.length,
        settledCount: settledBets.length,
        winRate: settledBets.length > 0 ? ((wins / settledBets.length) * 100).toFixed(1) : 0,
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        roi: totalStaked > 0 ? ((totalPnL / totalStaked) * 100).toFixed(1) : 0,
        avgEdge: range.bets.length > 0 
          ? parseFloat((range.bets.reduce((sum, b) => sum + parseFloat(b.edge || 0), 0) / range.bets.length).toFixed(2))
          : 0,
        color: range.color,
        percentage: parseFloat(((range.bets.length / bets.length) * 100).toFixed(1))
      };
    });

    return distribution;
  }

  /**
   * Calculate ROI by sportsbook
   * Shows performance across different sportsbooks
   */
  getROIBySportsbook() {
    const bets = this.betTracker.bets;
    if (bets.length === 0) return {};

    const sportsbookGroups = {};

    // Group bets by sportsbook
    bets.forEach(bet => {
      const book = bet.sportsbook || 'Unknown';
      if (!sportsbookGroups[book]) {
        sportsbookGroups[book] = [];
      }
      sportsbookGroups[book].push(bet);
    });

    // Calculate ROI for each sportsbook
    const roiBySportsbook = {};
    Object.entries(sportsbookGroups).forEach(([book, bookBets]) => {
      const settledBets = bookBets.filter(b => b.status !== 'PENDING');
      const wins = settledBets.filter(b => b.status === 'WON').length;
      const totalStaked = bookBets.reduce((sum, b) => sum + b.stake, 0);
      const totalPnL = settledBets.reduce((sum, b) => sum + (b.pnl || 0), 0);
      const totalClv = bookBets.reduce((sum, b) => sum + (b.clv || 0), 0);

      roiBySportsbook[book] = {
        sportsbook: book,
        betCount: bookBets.length,
        settledCount: settledBets.length,
        wins,
        losses: settledBets.filter(b => b.status === 'LOST').length,
        winRate: settledBets.length > 0 ? ((wins / settledBets.length) * 100).toFixed(1) : 0,
        totalStaked: parseFloat(totalStaked.toFixed(2)),
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        roi: totalStaked > 0 ? ((totalPnL / totalStaked) * 100).toFixed(1) : 0,
        totalClv: parseFloat(totalClv.toFixed(2)),
        avgOdds: this._calculateAverage(bookBets, 'entryOdds'),
        avgEdge: this._calculateAverage(bookBets, 'edge'),
        avgConfidence: this._calculateAverage(bookBets, 'confidence'),
        profitabilityRatio: settledBets.length > 0 
          ? (((totalPnL > 0 ? 1 : 0) + (totalClv > 0 ? 1 : 0)) / 2 * 100).toFixed(0)
          : 0
      };
    });

    return roiBySportsbook;
  }

  /**
   * Calculate win rate confidence intervals (95% CI using Wilson score)
   * Shows statistical confidence in win rate estimate
   */
  getWinRateConfidenceInterval() {
    const bets = this.betTracker.bets;
    const settledBets = bets.filter(b => b.status !== 'PENDING');
    
    if (settledBets.length === 0) {
      return {
        sampleSize: 0,
        observed: 0,
        lower: 0,
        upper: 0,
        margin: 0,
        confidence: 'Not enough data'
      };
    }

    const wins = settledBets.filter(b => b.status === 'WON').length;
    const n = settledBets.length;
    const p = wins / n;

    // Wilson score interval (more accurate for small samples)
    const z = 1.96; // 95% confidence level
    const z2 = z * z;
    
    const denominator = 1 + z2 / n;
    const center = (p + z2 / (2 * n)) / denominator;
    const margin = (z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))) / denominator;

    const lower = Math.max(0, center - margin);
    const upper = Math.min(1, center + margin);

    return {
      sampleSize: n,
      observed: parseFloat((p * 100).toFixed(1)),
      lower: parseFloat((lower * 100).toFixed(1)),
      upper: parseFloat((upper * 100).toFixed(1)),
      margin: parseFloat((margin * 100).toFixed(1)),
      range: `${parseFloat((lower * 100).toFixed(1))}% - ${parseFloat((upper * 100).toFixed(1))}%`,
      confidence: n >= 30 ? 'High' : n >= 10 ? 'Moderate' : 'Low',
      isSignificant: lower > 0.5 // Indicates edge over 50% baseline
    };
  }

  /**
   * Get top performing bets by CLV
   */
  getTopBetsBy(metric = 'clv', limit = 10) {
    let bets = this.betTracker.bets;

    if (metric === 'clv') {
      bets = bets.sort((a, b) => (b.clv || 0) - (a.clv || 0));
    } else if (metric === 'edge') {
      bets = bets.sort((a, b) => (b.edge || 0) - (a.edge || 0));
    } else if (metric === 'pnl') {
      bets = bets.sort((a, b) => (b.pnl || 0) - (a.pnl || 0));
    }

    return bets.slice(0, limit).map(bet => ({
      id: bet.id,
      pick: bet.pick,
      sport: bet.sport,
      betType: bet.betType,
      entryOdds: bet.entryOdds,
      stake: bet.stake,
      edge: bet.edge,
      clv: bet.clv || 0,
      pnl: bet.pnl || 0,
      status: bet.status,
      sportsbook: bet.sportsbook,
      confidence: bet.confidence
    }));
  }

  /**
   * Get performance summary for dashboard
   */
  getPerformanceSummary() {
    const bets = this.betTracker.bets;
    const settledBets = bets.filter(b => b.status !== 'PENDING');
    const wins = settledBets.filter(b => b.status === 'WON').length;
    const losses = settledBets.filter(b => b.status === 'LOST').length;

    const clvTrends = this.getCLVTrends();
    const edgeDistribution = this.getEdgeDistribution();
    const roiBySportsbook = this.getROIBySportsbook();
    const winRateCI = this.getWinRateConfidenceInterval();

    // Calculate best edge range
    const bestEdgeRange = Object.entries(edgeDistribution).reduce((best, [key, range]) => {
      return (range.roi > best.roi) ? { ...range, key } : best;
    }, { roi: -Infinity });

    // Calculate best sportsbook
    const bestSportsbook = Object.values(roiBySportsbook).reduce((best, book) => {
      return book.roi > best.roi ? book : best;
    }, { roi: -Infinity, sportsbook: 'N/A' });

    return {
      totalBets: bets.length,
      settledBets: settledBets.length,
      pendingBets: bets.length - settledBets.length,
      wins,
      losses,
      winRate: settledBets.length > 0 ? ((wins / settledBets.length) * 100).toFixed(1) : 0,
      cumulativeCLV: clvTrends.cumulativeCLV,
      avgDailyClv: clvTrends.avgDailyClv,
      bestEdgeRange: bestEdgeRange.key,
      bestEdgeRangeROI: bestEdgeRange.roi,
      bestSportsbook: bestSportsbook.sportsbook,
      bestSportsbookROI: bestSportsbook.roi,
      winRateCI: winRateCI,
      edgeDistributionCount: Object.keys(edgeDistribution).length,
      sportsbookCount: Object.keys(roiBySportsbook).length
    };
  }

  /**
   * Helper: Calculate average of numeric field
   */
  _calculateAverage(bets, field) {
    if (bets.length === 0) return 0;
    const sum = bets.reduce((acc, bet) => acc + parseFloat(bet[field] || 0), 0);
    return parseFloat((sum / bets.length).toFixed(2));
  }
}
