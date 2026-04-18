/**
 * PropsTracker - Player props tracking with CLV and advanced analytics
 * Specialized tracking for player props with detailed performance analysis
 */

class PropsTracker {
  constructor(storageKey = 'alexbet_props_history') {
    this.storageKey = storageKey;
    this.propsHistory = this.loadPropsHistory();

    this.propTypes = {
      'NBA': [
        'Points Over', 'Points Under',
        'Rebounds Over', 'Rebounds Under',
        'Assists Over', 'Assists Under',
        'Threes Over', 'Threes Under',
        'Steals Over', 'Steals Under',
        'Blocks Over', 'Blocks Under',
        'PRA Over', 'PRA Under',
        'Double Double'
      ],
      'NFL': [
        'Pass Yards Over', 'Pass Yards Under',
        'Rush Yards Over', 'Rush Yards Under',
        'Touchdowns Over', 'Touchdowns Under',
        'Receptions Over', 'Receptions Under',
        'Receiving Yards Over', 'Receiving Yards Under',
        'Interceptions Over', 'Interceptions Under'
      ],
      'MLB': [
        'Hits Over', 'Hits Under',
        'Home Runs Over', 'Home Runs Under',
        'RBIs Over', 'RBIs Under',
        'Strikeouts Over', 'Strikeouts Under'
      ]
    };

    // Cache for performance
    this._hotPlayersCache = {};
    this._lastCalcTime = {};
  }

  /**
   * Load props history from storage
   */
  loadPropsHistory() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return {};

      const history = JSON.parse(data);
      if (typeof history !== 'object') return {};

      return history;
    } catch (err) {
      console.error('[PropsTracker] Error loading props history:', err);
      return {};
    }
  }

  /**
   * Save props history to storage
   */
  savePropsHistory() {
    try {
      const serialized = JSON.stringify(this.propsHistory);
      localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        console.error('[PropsTracker] Storage quota exceeded');
        return false;
      }
      console.error('[PropsTracker] Error saving props:', err);
      return false;
    }
  }

  /**
   * Log a player prop bet with validation
   */
  logPropBet(player, sport, propType, line, odds, edge, stake, entryPrice = null) {
    // Validate inputs
    const validation = BetValidator.validatePropBet({
      player,
      sport,
      propType,
      line,
      odds,
      stake,
      edge
    });

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        propBet: null
      };
    }

    const propBetId = `${player}_${sport}_${propType}_${Date.now()}`;

    const propBet = {
      id: propBetId,
      player: BetValidator.sanitizeInput(player),
      sport,
      propType,
      line,
      odds,
      edge: edge || 0,
      stake,
      entryPrice: entryPrice || null,
      entryTime: new Date().toISOString(),
      status: 'PENDING',
      result: null, // OVER/UNDER
      finalLine: null,
      clv: 0,
      pnl: 0
    };

    if (!this.propsHistory[sport]) {
      this.propsHistory[sport] = [];
    }

    this.propsHistory[sport].push(propBet);

    if (this.savePropsHistory()) {
      // Clear cache
      this._clearCache();

      return {
        success: true,
        errors: [],
        propBet
      };
    } else {
      // Remove the prop if save failed
      this.propsHistory[sport] = this.propsHistory[sport].filter(p => p.id !== propBetId);
      return {
        success: false,
        errors: ['Failed to save prop bet'],
        propBet: null
      };
    }
  }

  /**
   * Update prop bet result with CLV calculation
   */
  updatePropResult(propBetId, result, finalLine, resultOdds = null) {
    // result: 'OVER' or 'UNDER' or 'PUSH'
    // finalLine: actual final value
    // resultOdds: actual closing odds (for CLV calculation)

    for (const sport in this.propsHistory) {
      const propBet = this.propsHistory[sport].find(p => p.id === propBetId);
      if (propBet) {
        propBet.result = result;
        propBet.finalLine = finalLine;
        propBet.status = 'SETTLED';

        // Determine if won
        let won = false;
        if (result === 'OVER' && finalLine > propBet.line) {
          won = true;
        } else if (result === 'UNDER' && finalLine < propBet.line) {
          won = true;
        } else if (result === 'PUSH' || finalLine === propBet.line) {
          propBet.status = 'PUSH';
          propBet.pnl = 0;
          this.savePropsHistory();
          this._clearCache();
          return { success: true, propBet };
        }

        propBet.status = won ? 'WON' : 'LOST';

        // Calculate P&L
        if (won) {
          propBet.pnl = propBet.odds > 0
            ? Math.round((propBet.stake * propBet.odds) / 100)
            : Math.round((propBet.stake * 100) / Math.abs(propBet.odds));
        } else {
          propBet.pnl = -propBet.stake;
        }

        // Calculate CLV (Closing Line Value)
        if (resultOdds !== null) {
          propBet.clv = this._calculateCLV(propBet.odds, resultOdds, won);
        }

        this.savePropsHistory();
        this._clearCache();

        return { success: true, propBet };
      }
    }

    return { success: false, errors: ['Prop bet not found'] };
  }

  /**
   * Calculate CLV (Closing Line Value)
   * Measures if you got better or worse odds than closing line
   */
  _calculateCLV(entryOdds, closingOdds, won) {
    // Convert to decimal odds for comparison
    const entryDecimal = this._oddsToDecimal(entryOdds);
    const closingDecimal = this._oddsToDecimal(closingOdds);

    // Profit or loss from CLV
    const clv = (closingDecimal - entryDecimal) * (won ? 1 : -1);
    return Math.round(clv * 100) / 100;
  }

  /**
   * Convert American odds to decimal
   */
  _oddsToDecimal(americanOdds) {
    if (americanOdds > 0) {
      return 1 + (americanOdds / 100);
    } else {
      return 1 + (100 / Math.abs(americanOdds));
    }
  }

  /**
   * Get player prop stats
   */
  getPlayerStats(player, sport) {
    const playerProps = this.propsHistory[sport]?.filter(p => p.player === player) || [];

    if (playerProps.length === 0) {
      return null;
    }

    const settled = playerProps.filter(p => p.status !== 'PENDING');
    const won = settled.filter(p => p.status === 'WON').length;
    const lost = settled.filter(p => p.status === 'LOST').length;
    const pushed = settled.filter(p => p.status === 'PUSH').length;
    const totalPnL = settled.reduce((sum, p) => sum + (p.pnl || 0), 0);
    const avgEdge = playerProps.reduce((sum, p) => sum + (p.edge || 0), 0) / playerProps.length;
    const avgClv = settled.reduce((sum, p) => sum + (p.clv || 0), 0) / (settled.length || 1);
    const totalWagered = settled.reduce((sum, p) => sum + p.stake, 0);

    return {
      player,
      sport,
      totalBets: playerProps.length,
      settledBets: settled.length,
      pendingBets: playerProps.filter(p => p.status === 'PENDING').length,
      wins: won,
      losses: lost,
      pushes: pushed,
      winRate: settled.length > 0 ? ((won / settled.length) * 100).toFixed(1) : 0,
      totalWagered: Math.round(totalWagered),
      pnl: Math.round(totalPnL),
      roi: totalWagered > 0 ? ((totalPnL / totalWagered) * 100).toFixed(2) : 0,
      avgEdge: avgEdge.toFixed(2),
      avgClv: avgClv.toFixed(2),
      profitability: totalPnL > 0 ? '✅ Profitable' : totalPnL < 0 ? '❌ Losing' : '➖ Breakeven',
      trend: this._calculateTrend(playerProps)
    };
  }

  /**
   * Calculate win rate trend
   */
  _calculateTrend(props) {
    if (props.length < 2) return 'neutral';

    const recent = props.slice(-5).filter(p => p.status !== 'PENDING');
    const older = props.slice(0, -5).filter(p => p.status !== 'PENDING');

    if (recent.length === 0 || older.length === 0) return 'neutral';

    const recentWinRate = recent.filter(p => p.status === 'WON').length / recent.length;
    const olderWinRate = older.filter(p => p.status === 'WON').length / older.length;

    if (recentWinRate > olderWinRate) {
      return 'up';
    } else if (recentWinRate < olderWinRate) {
      return 'down';
    }

    return 'neutral';
  }

  /**
   * Get hot players with caching
   */
  getHotPlayers(sport, minBets = 5, forceRefresh = false) {
    const cacheKey = `${sport}_${minBets}`;
    const now = Date.now();

    if (!forceRefresh && this._hotPlayersCache[cacheKey] &&
      (now - this._lastCalcTime[cacheKey]) < 60000) {
      return this._hotPlayersCache[cacheKey];
    }

    const sportProps = this.propsHistory[sport] || [];
    const playerMap = {};

    sportProps.forEach(prop => {
      if (!playerMap[prop.player]) {
        playerMap[prop.player] = [];
      }
      playerMap[prop.player].push(prop);
    });

    const hotPlayers = Object.keys(playerMap)
      .filter(player => playerMap[player].length >= minBets)
      .map(player => {
        const props = playerMap[player];
        const settled = props.filter(p => p.status !== 'PENDING');
        const won = settled.filter(p => p.status === 'WON').length;
        const winRate = settled.length > 0 ? (won / settled.length) * 100 : 0;
        const pnl = settled.reduce((sum, p) => sum + (p.pnl || 0), 0);
        const avgClv = settled.reduce((sum, p) => sum + (p.clv || 0), 0) / (settled.length || 1);

        return {
          player,
          totalBets: props.length,
          settledBets: settled.length,
          winRate: winRate.toFixed(1),
          pnl: Math.round(pnl),
          avgClv: avgClv.toFixed(2),
          emoji: winRate > 65 ? '🔥' : winRate > 56 ? '✅' : '⚠️'
        };
      })
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

    this._hotPlayersCache[cacheKey] = hotPlayers;
    this._lastCalcTime[cacheKey] = now;

    return hotPlayers;
  }

  /**
   * Get prop type analysis
   */
  getPropTypeStats(sport) {
    const typeMap = {};

    this.propsHistory[sport]?.forEach(prop => {
      if (!typeMap[prop.propType]) {
        typeMap[prop.propType] = {
          bets: 0,
          wins: 0,
          losses: 0,
          pushes: 0,
          pnl: 0,
          edges: [],
          clvs: []
        };
      }

      const stats = typeMap[prop.propType];
      stats.bets++;
      stats.pnl += prop.pnl || 0;
      stats.edges.push(prop.edge || 0);

      if (prop.status === 'WON') {
        stats.wins++;
      } else if (prop.status === 'LOST') {
        stats.losses++;
      } else if (prop.status === 'PUSH') {
        stats.pushes++;
      }

      if (prop.clv) {
        stats.clvs.push(prop.clv);
      }
    });

    // Calculate averages
    const result = {};
    Object.keys(typeMap).forEach(type => {
      const stats = typeMap[type];
      const settled = stats.wins + stats.losses + stats.pushes;

      result[type] = {
        totalBets: stats.bets,
        settledBets: settled,
        wins: stats.wins,
        losses: stats.losses,
        pushes: stats.pushes,
        winRate: settled > 0 ? ((stats.wins / settled) * 100).toFixed(1) : 0,
        totalPnL: Math.round(stats.pnl),
        avgEdge: (stats.edges.reduce((a, b) => a + b, 0) / stats.bets).toFixed(2),
        avgClv: stats.clvs.length > 0 ? (stats.clvs.reduce((a, b) => a + b, 0) / stats.clvs.length).toFixed(2) : 0
      };
    });

    return result;
  }

  /**
   * Generate comprehensive prop summary
   */
  generateSummary(sport) {
    const allProps = this.propsHistory[sport] || [];

    if (allProps.length === 0) {
      return {
        sport,
        message: 'No player props logged yet.',
        total: 0,
        pending: 0,
        settled: 0
      };
    }

    const settled = allProps.filter(p => p.status !== 'PENDING');
    const pending = allProps.filter(p => p.status === 'PENDING');
    const won = settled.filter(p => p.status === 'WON').length;
    const lost = settled.filter(p => p.status === 'LOST').length;
    const pushed = settled.filter(p => p.status === 'PUSH').length;
    const totalPnL = settled.reduce((sum, p) => sum + (p.pnl || 0), 0);
    const totalWagered = settled.reduce((sum, p) => sum + p.stake, 0);

    return {
      sport,
      total: allProps.length,
      pending: pending.length,
      settled: settled.length,
      wins: won,
      losses: lost,
      pushes: pushed,
      winRate: settled.length > 0 ? ((won / settled.length) * 100).toFixed(1) : 0,
      totalWagered: Math.round(totalWagered),
      totalPnL: Math.round(totalPnL),
      roi: totalWagered > 0 ? ((totalPnL / totalWagered) * 100).toFixed(2) : 0,
      avgPnlPerBet: settled.length > 0 ? (totalPnL / settled.length).toFixed(2) : 0,
      profitability: totalPnL > 0 ? '✅ Profitable' : totalPnL < 0 ? '❌ Losing' : '➖ Breakeven',
      uniquePlayers: new Set(allProps.map(p => p.player)).size,
      propTypes: new Set(allProps.map(p => p.propType)).size
    };
  }

  /**
   * Clear cache
   */
  _clearCache() {
    this._hotPlayersCache = {};
    this._lastCalcTime = {};
  }

  /**
   * Get all prop bets for export
   */
  getAllProps() {
    const allProps = [];
    for (const sport in this.propsHistory) {
      allProps.push(...this.propsHistory[sport]);
    }
    return allProps;
  }

  /**
   * Delete a prop bet
   */
  deletePropBet(propBetId) {
    for (const sport in this.propsHistory) {
      const index = this.propsHistory[sport].findIndex(p => p.id === propBetId);
      if (index !== -1) {
        this.propsHistory[sport].splice(index, 1);
        this.savePropsHistory();
        this._clearCache();
        return { success: true };
      }
    }
    return { success: false, errors: ['Prop bet not found'] };
  }
}

// Export
const propsTracker = new PropsTracker();
