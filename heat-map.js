/**
 * AlexBET Lite - Heat Map Visualization
 * Visualizes edge distribution and win rate by sport & market
 */

class HeatMapGenerator {
  constructor() {
    this.sports = ['NBA', 'NFL', 'MLB', 'NHL', 'ATP', 'EPL'];
    this.markets = ['ML', 'SPREAD', 'TOTAL'];
  }

  /**
   * Generate heatmap data from bets
   */
  generateHeatMap(bets) {
    const heatData = {};

    // Initialize grid
    this.sports.forEach(sport => {
      heatData[sport] = {};
      this.markets.forEach(market => {
        heatData[sport][market] = {
          edge: 0,
          winRate: 0,
          count: 0,
          pnl: 0
        };
      });
    });

    // Populate with bet data
    bets.forEach(bet => {
      const sport = bet.sport || 'UNKNOWN';
      const market = bet.betType || 'ML';

      if (heatData[sport] && heatData[sport][market]) {
        const cell = heatData[sport][market];
        cell.edge += bet.edge || 0;
        cell.count++;
        cell.pnl += bet.pnl || 0;

        if (bet.status === 'WON') {
          cell.winRate++;
        }
      }
    });

    // Normalize data
    Object.keys(heatData).forEach(sport => {
      Object.keys(heatData[sport]).forEach(market => {
        const cell = heatData[sport][market];
        if (cell.count > 0) {
          cell.edge = (cell.edge / cell.count).toFixed(2);
          cell.winRate = ((cell.winRate / cell.count) * 100).toFixed(1);
        }
      });
    });

    return heatData;
  }

  /**
   * Get color for heatmap cell
   * Green = high edge, Red = low/negative edge
   */
  getHeatColor(edge) {
    const edgeNum = parseFloat(edge);

    if (edgeNum > 5) return '#00d68f'; // Bright green
    if (edgeNum > 3) return '#4ddb7d'; // Light green
    if (edgeNum > 1) return '#99e6cc'; // Pale green
    if (edgeNum > -1) return '#ffb366'; // Light orange
    if (edgeNum > -3) return '#ff8c42'; // Orange
    return '#ff6464'; // Red

  }

  /**
   * Get intensity for win rate
   */
  getWinRateIntensity(winRate) {
    const rate = parseFloat(winRate);

    if (rate > 65) return 'Very Hot 🔥🔥🔥';
    if (rate > 56) return 'Hot 🔥🔥';
    if (rate > 50) return 'Warm 🔥';
    if (rate > 45) return 'Cool ❄️';
    return 'Cold ❄️❄️';
  }

  /**
   * Generate HTML table for heatmap
   */
  renderHeatMap(heatData) {
    let html = '<table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">';

    // Header row
    html += '<tr>';
    html += '<th style="padding: 10px; border: 1px solid #333; background: #1a1f3a; color: #aaa;">Sport/Market</th>';
    this.markets.forEach(market => {
      html += `<th style="padding: 10px; border: 1px solid #333; background: #1a1f3a; color: #00d68f;">${market}</th>`;
    });
    html += '</tr>';

    // Data rows
    this.sports.forEach(sport => {
      html += '<tr>';
      html += `<td style="padding: 10px; border: 1px solid #333; background: #0a0e27; color: #aaa; font-weight: bold;">${sport}</td>`;

      this.markets.forEach(market => {
        const cell = heatData[sport]?.[market];
        if (!cell || cell.count === 0) {
          html += '<td style="padding: 10px; border: 1px solid #333; background: #0a0e27; color: #555;">—</td>';
        } else {
          const color = this.getHeatColor(cell.edge);
          const intensity = this.getWinRateIntensity(cell.winRate);
          
          html += `
            <td style="padding: 10px; border: 1px solid #333; background: ${color}22; color: ${color}; text-align: center; cursor: pointer;" 
                title="Edge: ${cell.edge}% | Win Rate: ${cell.winRate}% | Bets: ${cell.count} | P&L: $${cell.pnl}">
              <div style="font-weight: bold; font-size: 14px;">${cell.edge}%</div>
              <div style="font-size: 11px; color: #aaa;">${cell.winRate}% (${cell.count})</div>
              <div style="font-size: 10px; margin-top: 3px;">${intensity}</div>
            </td>
          `;
        }
      });

      html += '</tr>';
    });

    html += '</table>';
    return html;
  }

  /**
   * Generate insights from heatmap
   */
  generateInsights(heatData) {
    let insights = [];

    // Find best sport
    let bestSport = { sport: '', avgEdge: -999 };
    Object.keys(heatData).forEach(sport => {
      const edges = Object.values(heatData[sport])
        .filter(cell => cell.count > 0)
        .map(cell => parseFloat(cell.edge));
      
      if (edges.length > 0) {
        const avg = edges.reduce((a, b) => a + b) / edges.length;
        if (avg > bestSport.avgEdge) {
          bestSport = { sport, avgEdge: avg };
        }
      }
    });

    if (bestSport.sport) {
      insights.push(`🎯 Best sport: ${bestSport.sport} (${bestSport.avgEdge.toFixed(2)}% avg edge)`);
    }

    // Find best market
    let bestMarket = { market: '', avgEdge: -999 };
    this.markets.forEach(market => {
      const edges = this.sports
        .map(sport => heatData[sport]?.[market])
        .filter(cell => cell && cell.count > 0)
        .map(cell => parseFloat(cell.edge));
      
      if (edges.length > 0) {
        const avg = edges.reduce((a, b) => a + b) / edges.length;
        if (avg > bestMarket.avgEdge) {
          bestMarket = { market, avgEdge: avg };
        }
      }
    });

    if (bestMarket.market) {
      insights.push(`📊 Best market: ${bestMarket.market} (${bestMarket.avgEdge.toFixed(2)}% avg edge)`);
    }

    return insights;
  }
}

const heatMapGen = new HeatMapGenerator();
