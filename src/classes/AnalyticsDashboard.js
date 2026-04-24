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
   * Render summary cards
   */
  renderSummaryCards() {
    const summary = this.advancedAnalytics.getPerformanceSummary();
    const container = document.getElementById('summaryCardsContainer');

    const cards = `
      <div class="summary-cards-grid">
        <div class="summary-card">
          <div class="card-label">Total Bets</div>
          <div class="card-value">${summary.totalBets}</div>
          <div class="card-detail">${summary.settledBets} settled, ${summary.pendingBets} pending</div>
        </div>

        <div class="summary-card">
          <div class="card-label">Win Rate</div>
          <div class="card-value" style="color: ${summary.winRate >= 52 ? '#00d68f' : '#ff6464'}">${summary.winRate}%</div>
          <div class="card-detail">${summary.wins}W - ${summary.losses}L</div>
        </div>

        <div class="summary-card">
          <div class="card-label">Cumulative CLV</div>
          <div class="card-value" style="color: ${summary.cumulativeCLV >= 0 ? '#00d68f' : '#ff6464'}">
            $${Math.abs(summary.cumulativeCLV).toFixed(2)}
          </div>
          <div class="card-detail">Avg: $${summary.avgDailyClv.toFixed(2)}/day</div>
        </div>

        <div class="summary-card">
          <div class="card-label">Best Edge Range</div>
          <div class="card-value">${summary.bestEdgeRange || 'N/A'}</div>
          <div class="card-detail">ROI: ${summary.bestEdgeRangeROI ? summary.bestEdgeRangeROI + '%' : 'N/A'}</div>
        </div>

        <div class="summary-card">
          <div class="card-label">Best Sportsbook</div>
          <div class="card-value">${summary.bestSportsbook}</div>
          <div class="card-detail">ROI: ${summary.bestSportsbookROI ? summary.bestSportsbookROI + '%' : 'N/A'}</div>
        </div>

        <div class="summary-card">
          <div class="card-label">Win Rate Confidence</div>
          <div class="card-value">${summary.winRateCI.confidence}</div>
          <div class="card-detail">n=${summary.winRateCI.sampleSize}</div>
        </div>
      </div>
    `;

    container.innerHTML = cards;
  }

  /**
   * Render CLV trends (text-based chart)
   */
  renderCLVTrends() {
    const trends = this.advancedAnalytics.getCLVTrends(this.currentTimeWindow);
    const container = document.getElementById('clvTrendsContainer');

    if (trends.data.length === 0) {
      container.innerHTML = '<div class="empty-message">No data available</div>';
      return;
    }

    // Create text-based chart
    const maxCLV = Math.max(...trends.data.map(d => d.cumulativeCLV), 1);
    const chartHeight = 15;
    
    let html = `
      <div class="clv-trends-chart">
        <div class="chart-header">
          <div class="trend-stat">Total: $${trends.cumulativeCLV.toFixed(2)}</div>
          <div class="trend-stat">Avg/Day: $${trends.avgDailyClv.toFixed(2)}</div>
        </div>
        <div class="chart-body">
    `;

    // Render bars
    trends.data.forEach(day => {
      const barHeight = (day.cumulativeCLV / maxCLV) * chartHeight;
      const barColor = day.cumulativeCLV >= 0 ? '#00d68f' : '#ff6464';
      const bars = Array(Math.max(1, Math.round(barHeight))).fill('█').join('');
      
      html += `
        <div class="chart-bar">
          <div class="bar-label">${day.date}</div>
          <div class="bar-display" style="color: ${barColor};">${bars}</div>
          <div class="bar-value">$${day.cumulativeCLV.toFixed(2)}</div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Render edge distribution (histogram-style)
   */
  renderEdgeDistribution() {
    const distribution = this.advancedAnalytics.getEdgeDistribution();
    const container = document.getElementById('edgeDistributionContainer');

    let html = `<div class="edge-distribution">`;

    Object.values(distribution).forEach(range => {
      if (range.count === 0) return;

      const barWidth = Math.max(5, (range.percentage / 100) * 200);
      
      html += `
        <div class="distribution-row">
          <div class="dist-label">${range.label}</div>
          <div class="dist-bar-container">
            <div class="dist-bar" style="width: ${barWidth}px; background-color: ${range.color};">
              <span class="bar-text">${range.count}</span>
            </div>
          </div>
          <div class="dist-stats">
            <span class="stat-item">${range.percentage}%</span>
            <span class="stat-item">W: ${range.winRate}%</span>
            <span class="stat-item" style="color: ${range.roi >= 0 ? '#00d68f' : '#ff6464'};">
              ROI: ${range.roi}%
            </span>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  /**
   * Render ROI by sportsbook
   */
  renderROIBySportsbook() {
    const roiData = this.advancedAnalytics.getROIBySportsbook();
    const container = document.getElementById('roiBySportsbookContainer');

    if (Object.keys(roiData).length === 0) {
      container.innerHTML = '<div class="empty-message">No sportsbook data</div>';
      return;
    }

    let html = `
      <div class="sportsbook-table">
        <div class="table-header">
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
      .forEach(book => {
        const roiColor = parseFloat(book.roi) >= 0 ? '#00d68f' : '#ff6464';
        const pnlColor = parseFloat(book.totalPnL) >= 0 ? '#00d68f' : '#ff6464';

        html += `
          <div class="table-row">
            <div class="col col-1"><strong>${book.sportsbook}</strong></div>
            <div class="col col-2">${book.betCount}</div>
            <div class="col col-3">${book.winRate}%</div>
            <div class="col col-4">$${book.totalStaked}</div>
            <div class="col col-5" style="color: ${pnlColor};">$${book.totalPnL}</div>
            <div class="col col-6" style="color: ${roiColor}; font-weight: 600;">${book.roi}%</div>
            <div class="col col-7">$${book.totalClv}</div>
          </div>
        `;
      });

    html += `</div>`;
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
   * Render top bets by CLV
   */
  renderTopBets() {
    const topBets = this.advancedAnalytics.getTopBetsBy('clv', 10);
    const container = document.getElementById('topBetsContainer');

    if (topBets.length === 0) {
      container.innerHTML = '<div class="empty-message">No bets yet</div>';
      return;
    }

    let html = `
      <div class="bets-table">
        <div class="table-header">
          <div class="col col-pick">Pick</div>
          <div class="col col-sport">Sport</div>
          <div class="col col-edge">Edge</div>
          <div class="col col-clv">CLV</div>
          <div class="col col-status">Status</div>
        </div>
    `;

    topBets.forEach(bet => {
      const statusColor = bet.status === 'WON' ? '#00d68f' : bet.status === 'LOST' ? '#ff6464' : '#4dd0ff';
      const clvColor = parseFloat(bet.clv) >= 0 ? '#00d68f' : '#ff6464';

      html += `
        <div class="table-row">
          <div class="col col-pick">${bet.pick}</div>
          <div class="col col-sport">${bet.sport}</div>
          <div class="col col-edge">${bet.edge}%</div>
          <div class="col col-clv" style="color: ${clvColor};">$${bet.clv.toFixed(2)}</div>
          <div class="col col-status" style="color: ${statusColor};">${bet.status}</div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }
}
