/**
 * AnalyticsDashboard - Enhanced dashboard UI component
 * Renders CLV trends, edge distribution, ROI by sportsbook, and win rate CI
 */
class AnalyticsDashboard {
  constructor(betTracker, containerId = 'analyticsDashboardContainer') {
    this.betTracker = betTracker;
    this.advancedAnalytics = new AdvancedAnalytics(betTracker);
    this.container = document.getElementById(containerId);
    this.currentTimeWindow = 'all';
    this.currentSportFilter = '';
    this.currentSportsbookFilter = '';
  }

  /**
   * Render the full analytics dashboard
   */
  render() {
    if (!this.container) {
      console.warn('[AnalyticsDashboard] Container not found');
      return;
    }

    this.container.innerHTML = `
      <div class="analytics-dashboard">
        <!-- Control Bar -->
        <div class="analytics-controls">
          <div class="analytics-controls-left">
            <div class="form-group inline">
              <label for="analyticsSportFilter">Sport</label>
              <select id="analyticsSportFilter">
                <option value="">All Sports</option>
                <option value="NBA">NBA</option>
                <option value="NFL">NFL</option>
                <option value="MLB">MLB</option>
                <option value="NHL">NHL</option>
                <option value="MMA">MMA</option>
                <option value="EPL">EPL (Soccer)</option>
                <option value="ATP">ATP (Tennis)</option>
                <option value="College Basketball">College Basketball</option>
                <option value="College Football">College Football</option>
              </select>
            </div>
            <div class="form-group inline">
              <label for="analyticsSportsbookFilter">Sportsbook</label>
              <select id="analyticsSportsbookFilter">
                <option value="">All Sportsbooks</option>
                <option value="DraftKings">DraftKings</option>
                <option value="FanDuel">FanDuel</option>
                <option value="BetMGM">BetMGM</option>
                <option value="Caesars">Caesars</option>
                <option value="Bet365">Bet365</option>
                <option value="PointsBet">PointsBet</option>
                <option value="Hard Rock Bet">Hard Rock Bet</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div class="analytics-controls-right">
            <button id="exportAnalyticsBtn" class="btn secondary">
              <svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Export
            </button>
          </div>
        </div>

        <!-- Time Window Selector -->
        <div class="dashboard-controls">
          <div class="time-window-selector">
            <button class="time-btn active" data-window="all">All Time</button>
            <button class="time-btn" data-window="90d">90 Days</button>
            <button class="time-btn" data-window="30d">30 Days</button>
            <button class="time-btn" data-window="7d">7 Days</button>
          </div>
        </div>

        <!-- Performance Summary Cards -->
        <div class="dashboard-row">
          <div id="summaryCardsContainer"></div>
        </div>

        <!-- CLV Trends Section -->
        <div class="dashboard-section">
          <h3 class="section-header">📈 CLV Trends Over Time</h3>
          <div id="clvTrendsContainer" class="chart-container"></div>
        </div>

        <!-- Edge Distribution Section -->
        <div class="dashboard-row">
          <div class="dashboard-section" style="flex: 1;">
            <h3 class="section-header">📊 Edge Distribution</h3>
            <div id="edgeDistributionContainer" class="chart-container"></div>
          </div>
        </div>

        <!-- ROI by Sportsbook Section -->
        <div class="dashboard-section">
          <h3 class="section-header">💰 ROI by Sportsbook</h3>
          <div id="roiBySportsbookContainer" class="table-container"></div>
        </div>

        <!-- Win Rate Confidence Interval Section -->
        <div class="dashboard-section">
          <h3 class="section-header">📉 Win Rate Confidence Interval (95%)</h3>
          <div id="winRateCIContainer" class="ci-container"></div>
        </div>

        <!-- Top Bets Section -->
        <div class="dashboard-row">
          <div class="dashboard-section" style="flex: 1;">
            <h3 class="section-header">🏆 Top Bets by CLV</h3>
            <div id="topBetsContainer" class="table-container"></div>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    this.container.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.container.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentTimeWindow = e.target.dataset.window;
        this.refreshDashboard();
      });
    });

    // Sport filter
    const sportFilter = document.getElementById('analyticsSportFilter');
    if (sportFilter) {
      sportFilter.addEventListener('change', (e) => {
        this.currentSportFilter = e.target.value;
        this.refreshDashboard();
      });
    }

    // Sportsbook filter
    const sportsbookFilter = document.getElementById('analyticsSportsbookFilter');
    if (sportsbookFilter) {
      sportsbookFilter.addEventListener('change', (e) => {
        this.currentSportsbookFilter = e.target.value;
        this.refreshDashboard();
      });
    }

    // Export button
    const exportBtn = document.getElementById('exportAnalyticsBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportAnalytics());
    }

    // Initial render
    this.refreshDashboard();
  }

  /**
   * Refresh all dashboard sections
   */
  refreshDashboard() {
    this.renderSummaryCards();
    this.renderCLVTrends();
    this.renderEdgeDistribution();
    this.renderROIBySportsbook();
    this.renderWinRateCI();
    this.renderTopBets();
  }

  /**
   * Render summary cards (enhanced with gradients and icons)
   */
  renderSummaryCards() {
    const summary = this.advancedAnalytics.getPerformanceSummary();
    const container = document.getElementById('summaryCardsContainer');

    const cards = `
      <div class="summary-cards-grid">
        <div class="summary-card" data-metric="total-bets">
          <div class="card-icon">📊</div>
          <div class="card-label">Total Bets</div>
          <div class="card-value">${summary.totalBets}</div>
          <div class="card-detail">${summary.settledBets} settled, ${summary.pendingBets} pending</div>
        </div>

        <div class="summary-card" data-metric="win-rate">
          <div class="card-icon">🎯</div>
          <div class="card-label">Win Rate</div>
          <div class="card-value" style="color: ${summary.winRate >= 52 ? '#00d68f' : summary.winRate >= 45 ? '#ffd93d' : '#ff6464'}">${summary.winRate || 0}%</div>
          <div class="card-detail">${summary.wins}W - ${summary.losses}L</div>
          ${summary.winRate >= 52 ? '<div class="card-badge positive">Above Target</div>' : '<div class="card-badge neutral">Target: 52%+</div>'}
        </div>

        <div class="summary-card" data-metric="clv">
          <div class="card-icon">📈</div>
          <div class="card-label">Cumulative CLV</div>
          <div class="card-value" style="color: ${(summary.cumulativeCLV || 0) >= 0 ? '#00d68f' : '#ff6464'}">
            $${Math.abs(summary.cumulativeCLV || 0).toFixed(2)}
          </div>
          <div class="card-detail">Avg: $${(summary.avgDailyClv || 0).toFixed(2)}/day</div>
        </div>

        <div class="summary-card" data-metric="edge">
          <div class="card-icon">⚡</div>
          <div class="card-label">Best Edge Range</div>
          <div class="card-value">${summary.bestEdgeRange || 'N/A'}</div>
          <div class="card-detail">ROI: ${summary.bestEdgeRangeROI !== -Infinity ? summary.bestEdgeRangeROI + '%' : 'N/A'}</div>
        </div>

        <div class="summary-card" data-metric="sportsbook">
          <div class="card-icon">🏪</div>
          <div class="card-label">Best Sportsbook</div>
          <div class="card-value">${summary.bestSportsbook || 'N/A'}</div>
          <div class="card-detail">ROI: ${summary.bestSportsbookROI !== -Infinity ? summary.bestSportsbookROI + '%' : 'N/A'}</div>
        </div>

        <div class="summary-card" data-metric="confidence">
          <div class="card-icon">📉</div>
          <div class="card-label">Win Rate Confidence</div>
          <div class="card-value">${summary.winRateCI.confidence}</div>
          <div class="card-detail">n=${summary.winRateCI.sampleSize}</div>
        </div>
      </div>
    `;

    container.innerHTML = cards;
  }

  /**
   * Render CLV trends (CSS-based animated chart)
   */
  renderCLVTrends() {
    const trends = this.advancedAnalytics.getCLVTrends(this.currentTimeWindow);
    const container = document.getElementById('clvTrendsContainer');

    if (trends.data.length === 0) {
      container.innerHTML = '<div class="empty-message">No data available</div>';
      return;
    }

    const maxCLV = Math.max(...trends.data.map(d => Math.abs(d.cumulativeCLV)), 1);
    
    let html = `
      <div class="clv-trends-chart">
        <div class="chart-header">
          <div class="trend-stat">
            <span class="stat-label">Total CLV</span>
            <span class="stat-value" style="color: ${trends.cumulativeCLV >= 0 ? '#00d68f' : '#ff6464'};">
              $${trends.cumulativeCLV.toFixed(2)}
            </span>
          </div>
          <div class="trend-stat">
            <span class="stat-label">Avg/Day</span>
            <span class="stat-value" style="color: ${trends.avgDailyClv >= 0 ? '#00d68f' : '#ff6464'};">
              $${trends.avgDailyClv.toFixed(2)}
            </span>
          </div>
        </div>
        <div class="chart-body">
          <div class="chart-bars">
    `;

    // Render bars with animation
    trends.data.forEach((day, index) => {
      const barHeight = (Math.abs(day.cumulativeCLV) / maxCLV) * 100;
      const barColor = day.cumulativeCLV >= 0 ? '#00d68f' : '#ff6464';
      const delay = index * 0.05;
      
      html += `
        <div class="chart-bar-wrapper">
          <div class="chart-bar" style="
            height: ${barHeight}%;
            background: linear-gradient(180deg, ${barColor} 0%, ${barColor}88 100%);
            animation: growUp 0.6s ease-out ${delay}s both;
          "></div>
          <div class="bar-label">${day.date.slice(5)}</div>
          <div class="bar-value" style="color: ${barColor};">$${day.cumulativeCLV.toFixed(2)}</div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </div>
      <style>
        @keyframes growUp {
          from { transform: scaleY(0); opacity: 0; }
          to { transform: scaleY(1); opacity: 1; }
        }
        .clv-trends-chart {
          background: var(--surface);
          border-radius: var(--radius);
          padding: 20px;
        }
        .chart-header {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        .trend-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-label {
          font-size: 11px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          font-family: var(--font-mono);
        }
        .chart-body {
          overflow-x: auto;
        }
        .chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          min-height: 200px;
          padding: 20px 10px;
          background: linear-gradient(180deg, var(--void) 0%, transparent 100%);
          border-radius: var(--radius);
          position: relative;
        }
        .chart-bars::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--border);
        }
        .chart-bar-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-width: 60px;
          flex: 1;
        }
        .chart-bar {
          width: 100%;
          max-width: 40px;
          border-radius: 4px 4px 0 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .chart-bar:hover {
          filter: brightness(1.2);
          transform: scaleY(1.05);
        }
        .bar-label {
          font-size: 11px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }
        .bar-value {
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font-mono);
        }
      </style>
    `;

    container.innerHTML = html;
  }

  /**
   * Render edge distribution (CSS-based histogram)
   */
  renderEdgeDistribution() {
    const distribution = this.advancedAnalytics.getEdgeDistribution();
    const container = document.getElementById('edgeDistributionContainer');

    const entries = Object.values(distribution).filter(range => range.count > 0);
    
    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-message">No edge data available</div>';
      return;
    }

    const maxCount = Math.max(...entries.map(e => e.count));
    
    let html = `<div class="edge-distribution-viz">`;

    entries.forEach((range, index) => {
      const barWidth = (range.count / maxCount) * 100;
      const delay = index * 0.08;
      const roiColor = range.roi >= 0 ? '#00d68f' : '#ff6464';
      
      html += `
        <div class="edge-dist-row" style="animation: slideIn 0.5s ease-out ${delay}s both;">
          <div class="edge-dist-label">
            <div class="dist-label-text">${range.label}</div>
            <div class="dist-label-count">${range.count} bets</div>
          </div>
          <div class="edge-dist-bar-container">
            <div class="edge-dist-bar" style="
              width: ${barWidth}%;
              background: linear-gradient(90deg, ${range.color} 0%, ${range.color}88 100%);
            ">
              <span class="bar-percentage">${range.percentage}%</span>
            </div>
          </div>
          <div class="edge-dist-stats">
            <div class="edge-stat">
              <span class="stat-icon">🎯</span>
              <span class="stat-value">${range.winRate}% WR</span>
            </div>
            <div class="edge-stat">
              <span class="stat-icon">💰</span>
              <span class="stat-value" style="color: ${roiColor};">ROI: ${range.roi}%</span>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .edge-distribution-viz {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: var(--surface);
          border-radius: var(--radius);
        }
        .edge-dist-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background: var(--surface-hover);
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .edge-dist-row:hover {
          background: var(--surface);
          transform: translateX(4px);
        }
        .edge-dist-label {
          min-width: 140px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dist-label-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }
        .dist-label-count {
          font-size: 11px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }
        .edge-dist-bar-container {
          flex: 1;
          height: 32px;
          background: var(--void);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }
        .edge-dist-bar {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 12px;
          transition: width 0.6s ease-out;
          min-width: 60px;
        }
        .bar-percentage {
          font-size: 12px;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }
        .edge-dist-stats {
          min-width: 180px;
          display: flex;
          gap: 16px;
        }
        .edge-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font-mono);
        }
        .stat-icon {
          font-size: 14px;
        }
        .stat-value {
          white-space: nowrap;
        }
      </style>
    `;
    
    container.innerHTML = html;
  }

  /**
   * Render ROI by sportsbook (enhanced table)
   */
  renderROIBySportsbook() {
    const roiData = this.advancedAnalytics.getROIBySportsbook();
    const container = document.getElementById('roiBySportsbookContainer');

    if (Object.keys(roiData).length === 0) {
      container.innerHTML = '<div class="empty-message">No sportsbook data</div>';
      return;
    }

    let html = `
      <div class="sportsbook-table-viz">
        <div class="table-header-row">
          <div class="col col-1">Sportsbook</div>
          <div class="col col-2">Bets</div>
          <div class="col col-3">Win %</div>
          <div class="col col-4">Staked</div>
          <div class="col col-5">P&L</div>
          <div class="col col-6">ROI</div>
          <div class="col col-7">CLV</div>
        </div>
    `;

    Object.values(roiData)
      .sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi))
      .forEach((book, index) => {
        const roiColor = parseFloat(book.roi) >= 0 ? '#00d68f' : '#ff6464';
        const pnlColor = parseFloat(book.totalPnL) >= 0 ? '#00d68f' : '#ff6464';
        const delay = index * 0.05;
        
        // Performance indicator
        let perfIndicator = '➖';
        if (parseFloat(book.roi) > 5) perfIndicator = '🟢';
        else if (parseFloat(book.roi) > 0) perfIndicator = '🟡';
        else if (parseFloat(book.roi) < -5) perfIndicator = '🔴';

        html += `
          <div class="table-row-viz" style="animation: fadeInUp 0.4s ease-out ${delay}s both;">
            <div class="col col-1">
              <div class="book-name">
                <span class="perf-indicator">${perfIndicator}</span>
                <strong>${book.sportsbook}</strong>
              </div>
            </div>
            <div class="col col-2">${book.betCount}</div>
            <div class="col col-3">
              <div class="winrate-badge" style="background: ${parseFloat(book.winRate) >= 52 ? 'rgba(0, 214, 143, 0.2)' : 'rgba(255, 100, 100, 0.2)'}; color: ${parseFloat(book.winRate) >= 52 ? '#00d68f' : '#ff6464'};">
                ${book.winRate}%
              </div>
            </div>
            <div class="col col-4">$${book.totalStaked}</div>
            <div class="col col-5" style="color: ${pnlColor}; font-weight: 600;">$${book.totalPnL}</div>
            <div class="col col-6" style="color: ${roiColor}; font-weight: 700; font-size: 14px;">${book.roi}%</div>
            <div class="col col-7" style="color: ${parseFloat(book.totalClv) >= 0 ? '#4dd0ff' : '#ff6464'};">$${book.totalClv}</div>
          </div>
        `;
      });

    html += `</div>
      <style>
        @keyframes fadeInUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .sportsbook-table-viz {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .table-header-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
          gap: 12px;
          padding: 12px 16px;
          background: var(--void);
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .table-row-viz {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
          gap: 12px;
          padding: 14px 16px;
          background: var(--surface-hover);
          border-radius: 8px;
          border: 1px solid var(--border);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .table-row-viz:hover {
          background: var(--surface);
          border-color: var(--accent);
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(77, 208, 255, 0.1);
        }
        .col {
          display: flex;
          align-items: center;
          font-size: 13px;
          font-family: var(--font-mono);
        }
        .book-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-sans);
          font-weight: 600;
        }
        .perf-indicator {
          font-size: 14px;
        }
        .winrate-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
          font-family: var(--font-mono);
        }
      </style>
    `;
    
    container.innerHTML = html;
  }

  /**
   * Render win rate confidence interval
   */
  renderWinRateCI() {
    const ci = this.advancedAnalytics.getWinRateConfidenceInterval();
    const container = document.getElementById('winRateCIContainer');

    if (ci.sampleSize === 0) {
      container.innerHTML = '<div class="empty-message">Need at least 1 settled bet for analysis</div>';
      return;
    }

    // Calculate bar positions
    const total = 100;
    const lowerPercent = ci.lower;
    const upperPercent = ci.upper;
    const observedPercent = ci.observed;

    html = `
      <div class="ci-visual">
        <div class="ci-bar-container">
          <div class="ci-background">
            <div class="ci-null-line" style="left: 50%;"></div>
            <div class="ci-range" style="left: ${lowerPercent}%; right: ${100 - upperPercent}%;"></div>
            <div class="ci-point" style="left: ${observedPercent}%;"></div>
          </div>
        </div>

        <div class="ci-labels">
          <div class="ci-label">Lower Bound: ${ci.lower.toFixed(1)}%</div>
          <div class="ci-label">Observed: ${ci.observed.toFixed(1)}%</div>
          <div class="ci-label">Upper Bound: ${ci.upper.toFixed(1)}%</div>
        </div>

        <div class="ci-info">
          <p><strong>95% Confidence Interval:</strong> Win rate is between ${ci.lower.toFixed(1)}% and ${ci.upper.toFixed(1)}%</p>
          <p><strong>Sample Size:</strong> ${ci.sampleSize} settled bets</p>
          <p><strong>Confidence Level:</strong> ${ci.confidence}</p>
          <p><strong>Margin of Error:</strong> ±${ci.margin.toFixed(1)}%</p>
          ${ci.isSignificant ? '<p style="color: #00d68f;">✅ <strong>Significant Edge:</strong> Win rate exceeds 50% baseline</strong></p>' : '<p style="color: #ff6464;">⚠️ <strong>No Significant Edge:</strong> Cannot confidently claim edge over 50%</p>'}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Render top bets by CLV (enhanced table)
   */
  renderTopBets() {
    const topBets = this.advancedAnalytics.getTopBetsBy('clv', 10);
    const container = document.getElementById('topBetsContainer');

    if (topBets.length === 0) {
      container.innerHTML = '<div class="empty-message">No bets yet</div>';
      return;
    }

    let html = `
      <div class="top-bets-table-viz">
        <div class="table-header-row">
          <div class="col col-pick">Pick</div>
          <div class="col col-sport">Sport</div>
          <div class="col col-edge">Edge</div>
          <div class="col col-clv">CLV</div>
          <div class="col col-status">Status</div>
        </div>
    `;

    topBets.forEach((bet, index) => {
      const statusColor = bet.status === 'WON' ? '#00d68f' : bet.status === 'LOST' ? '#ff6464' : '#4dd0ff';
      const clvColor = parseFloat(bet.clv) >= 0 ? '#00d68f' : '#ff6464';
      const delay = index * 0.05;
      
      // Status badge
      const statusBadge = bet.status === 'WON' ? '✅' : bet.status === 'LOST' ? '❌' : bet.status === 'PUSH' ? '➖' : '⏳';

      html += `
        <div class="top-bet-row-viz" style="animation: fadeInUp 0.4s ease-out ${delay}s both;">
          <div class="col col-pick">
            <div class="bet-info">
              <div class="bet-pick">${bet.pick}</div>
              <div class="bet-event">${bet.event || 'N/A'}</div>
            </div>
          </div>
          <div class="col col-sport">
            <span class="sport-badge">${bet.sport}</span>
          </div>
          <div class="col col-edge">
            <div class="edge-badge" style="background: ${parseFloat(bet.edge) >= 4 ? 'rgba(0, 214, 143, 0.2)' : parseFloat(bet.edge) >= 2 ? 'rgba(255, 215, 61, 0.2)' : 'rgba(255, 100, 100, 0.2)'}; color: ${parseFloat(bet.edge) >= 4 ? '#00d68f' : parseFloat(bet.edge) >= 2 ? '#ffd93d' : '#ff6464'};">
              ${bet.edge}%
            </div>
          </div>
          <div class="col col-clv" style="color: ${clvColor}; font-weight: 700; font-size: 14px;">
            $${bet.clv.toFixed(2)}
          </div>
          <div class="col col-status">
            <span class="status-badge" style="background: ${statusColor}22; color: ${statusColor};">
              ${statusBadge} ${bet.status}
            </span>
          </div>
        </div>
      `;
    });

    html += `</div>
      <style>
        .top-bets-table-viz {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .top-bet-row-viz {
          display: grid;
          grid-template-columns: 2.5fr 1fr 1fr 1fr 1.2fr;
          gap: 12px;
          padding: 14px 16px;
          background: var(--surface-hover);
          border-radius: 8px;
          border: 1px solid var(--border);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .top-bet-row-viz:hover {
          background: var(--surface);
          border-color: var(--accent);
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(77, 208, 255, 0.1);
        }
        .bet-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .bet-pick {
          font-weight: 600;
          color: var(--text);
          font-family: var(--font-sans);
        }
        .bet-event {
          font-size: 11px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }
        .sport-badge {
          padding: 4px 8px;
          background: var(--void);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }
        .edge-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
          font-family: var(--font-mono);
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font-mono);
        }
      </style>
    `;

    container.innerHTML = html;
  }

  /**
   * Export analytics data to CSV
   */
  exportAnalytics() {
    const bets = this.betTracker.bets;
    
    // Apply filters
    const filteredBets = bets.filter(bet => {
      const sportMatch = !this.currentSportFilter || bet.sport === this.currentSportFilter;
      const sportsbookMatch = !this.currentSportsbookFilter || bet.sportsbook === this.currentSportsbookFilter;
      
      // Time window filter
      const now = new Date();
      const betDate = new Date(bet.entryTime);
      let timeMatch = true;
      switch(this.currentTimeWindow) {
        case '7d': timeMatch = (now - betDate) < 7 * 24 * 60 * 60 * 1000; break;
        case '30d': timeMatch = (now - betDate) < 30 * 24 * 60 * 60 * 1000; break;
        case '90d': timeMatch = (now - betDate) < 90 * 24 * 60 * 60 * 1000; break;
      }
      
      return sportMatch && sportsbookMatch && timeMatch;
    });

    if (filteredBets.length === 0) {
      alert('No data to export with current filters');
      return;
    }

    // Create CSV
    const headers = ['Date', 'Sport', 'Event', 'Pick', 'Bet Type', 'Sportsbook', 'Odds', 'Stake', 'Edge', 'Confidence', 'Status', 'P&L', 'CLV', 'Notes'];
    const rows = filteredBets.map(bet => [
      bet.entryTime.split('T')[0],
      bet.sport,
      bet.event || 'N/A',
      bet.pick,
      bet.betType,
      bet.sportsbook,
      bet.entryOdds,
      bet.stake,
      bet.edge,
      bet.confidence,
      bet.status,
      bet.pnl || 0,
      bet.clv || 0,
      `"${(bet.notes || '').replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alexbet-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
