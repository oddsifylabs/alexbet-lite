/**
 * AlexBET Lite - Player Props Tracker
 * Specialized tracking for NBA/NFL player props with CLV analysis
 */

class PropsTracker {
  constructor() {
    this.propTypes = {
      'NBA': ['Points', 'Rebounds', 'Assists', 'Threes', 'Steals', 'Blocks'],
      'NFL': ['Pass Yards', 'Rush Yards', 'Touchdowns', 'Interceptions', 'Receptions']
    };
    this.propsHistory = JSON.parse(localStorage.getItem('alexbet_props_history')) || {};
  }

  /**
   * Log a player prop bet
   */
  logPropBet(player, sport, propType, line, odds, edge, stake) {
    const propBetId = `${player}_${sport}_${propType}_${Date.now()}`;

    const propBet = {
      id: propBetId,
      player,
      sport,
      propType,
      line,
      odds,
      edge,
      stake,
      entryTime: new Date().toISOString(),
      status: 'PENDING',
      result: null, // OVER/UNDER
      clv: 0,
      pnl: 0
    };

    if (!this.propsHistory[sport]) {
      this.propsHistory[sport] = [];
    }

    this.propsHistory[sport].push(propBet);
    localStorage.setItem('alexbet_props_history', JSON.stringify(this.propsHistory));

    return propBet;
  }

  /**
   * Update prop bet result
   */
  updatePropResult(propBetId, result, finalLine) {
    // result: 'OVER' or 'UNDER'
    // finalLine: actual final value
    
    for (const sport in this.propsHistory) {
      const propBet = this.propsHistory[sport].find(p => p.id === propBetId);
      if (propBet) {
        propBet.result = result;
        propBet.status = 'SETTLED';
        propBet.finalLine = finalLine;

        // Determine if won
        const won = (result === 'OVER' && finalLine > propBet.line) || 
                   (result === 'UNDER' && finalLine < propBet.line);
        
        propBet.status = won ? 'WON' : 'LOST';

        // Calculate P&L
        if (won) {
          propBet.pnl = propBet.stake * (propBet.odds / 100);
        } else {
          propBet.pnl = -propBet.stake;
        }

        localStorage.setItem('alexbet_props_history', JSON.stringify(this.propsHistory));
        return propBet;
      }
    }

    return null;
  }

  /**
   * Get player prop stats
   */
  getPlayerStats(player, sport) {
    const playerProps = this.propsHistory[sport]?.filter(p => p.player === player) || [];
    
    if (playerProps.length === 0) {
      return null;
    }

    const won = playerProps.filter(p => p.status === 'WON').length;
    const total = playerProps.length;
    const totalPnl = playerProps.reduce((sum, p) => sum + (p.pnl || 0), 0);
    const avgEdge = playerProps.reduce((sum, p) => sum + (p.edge || 0), 0) / total;
    const avgClv = playerProps.reduce((sum, p) => sum + (p.clv || 0), 0) / total;

    return {
      player,
      sport,
      bets: total,
      wins: won,
      winRate: ((won / total) * 100).toFixed(1),
      pnl: totalPnl,
      avgEdge: avgEdge.toFixed(2),
      avgClv: avgClv.toFixed(2),
      profitability: totalPnl > 0 ? '✅ Profitable' : '❌ Losing'
    };
  }

  /**
   * Get hot players (high win rate)
   */
  getHotPlayers(sport, minBets = 5) {
    const playerMap = {};

    this.propsHistory[sport]?.forEach(prop => {
      if (!playerMap[prop.player]) {
        playerMap[prop.player] = [];
      }
      playerMap[prop.player].push(prop);
    });

    const hotPlayers = Object.keys(playerMap)
      .filter(player => playerMap[player].length >= minBets)
      .map(player => {
        const props = playerMap[player];
        const won = props.filter(p => p.status === 'WON').length;
        const winRate = (won / props.length) * 100;
        const pnl = props.reduce((sum, p) => sum + (p.pnl || 0), 0);

        return {
          player,
          bets: props.length,
          winRate: winRate.toFixed(1),
          pnl,
          emoji: winRate > 65 ? '🔥' : winRate > 56 ? '✅' : '⚠️'
        };
      })
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

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
          pnl: 0,
          avgEdge: 0,
          edges: []
        };
      }

      const stats = typeMap[prop.propType];
      stats.bets++;
      stats.pnl += prop.pnl || 0;
      stats.edges.push(prop.edge);
      if (prop.status === 'WON') stats.wins++;
    });

    // Calculate averages
    Object.keys(typeMap).forEach(type => {
      const stats = typeMap[type];
      stats.winRate = ((stats.wins / stats.bets) * 100).toFixed(1);
      stats.avgEdge = (stats.edges.reduce((a, b) => a + b, 0) / stats.bets).toFixed(2);
      delete stats.edges;
    });

    return typeMap;
  }

  /**
   * Generate prop bet summary
   */
  generateSummary(sport) {
    const allProps = this.propsHistory[sport] || [];
    const settled = allProps.filter(p => p.status !== 'PENDING');
    const pending = allProps.filter(p => p.status === 'PENDING');

    if (settled.length === 0) {
      return {
        sport,
        message: 'No player props logged yet. Start tracking to see stats!',
        total: allProps.length
      };
    }

    const won = settled.filter(p => p.status === 'WON').length;
    const totalPnl = settled.reduce((sum, p) => sum + (p.pnl || 0), 0);

    return {
      sport,
      total: allProps.length,
      pending: pending.length,
      settled: settled.length,
      wins: won,
      losses: settled.length - won,
      winRate: ((won / settled.length) * 100).toFixed(1),
      totalPnl,
      avgPnlPerBet: (totalPnl / settled.length).toFixed(2),
      profitability: totalPnl > 0 ? '✅ Profitable' : '❌ Losing'
    };
  }
}

const propsTracker = new PropsTracker();
