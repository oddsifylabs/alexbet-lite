/**
 * AdvancedAnalyticsDashboard - Interactive analytics visualization system
 * Provides charts, detailed metrics, performance tracking, and actionable insights
 * Integrates with Chart.js for rendering interactive visualizations
 */

class AdvancedAnalyticsDashboard {
  constructor(analytics, security) {
    this.analytics = analytics;
    this.security = security;
    this.charts = {};
    this.updateFrequency = 5000; // 5 seconds
    this.chartConfig = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#e0e0e0',
            font: { size: 12, weight: '500' },
            padding: 15
          }
        }
      },
      scales: {
        y: {
          ticks: { color: '#b0b0b0' },
          grid: { color: 'rgba(100, 100, 100, 0.1)' }
        },
        x: {
          ticks: { color: '#b0b0b0' },
          grid: { color: 'rgba(100, 100, 100, 0.1)' }
        }
      }
    };
  }

  /**
   * Initialize dashboard with all charts
   */
  initializeDashboard() {
    try {
      this.createWinRateChart();
      this.createROITrendChart();
      this.createPnLDistributionChart();
      this.createSportPerformanceChart();
      this.createBetTypeDistributionChart();
      this.createMonthlyPerformanceChart();
      this.createOddsVsOutcomeChart();
      this.createEdgeAnalysisChart();
      return { success: true, message: 'Dashboard initialized successfully' };
    } catch (error) {
      return {
        success: false,
        error: `Dashboard initialization failed: ${error.message}`
      };
    }
  }

  /**
   * Create win rate and hit rate chart
   */
  createWinRateChart() {
    const stats = this.analytics.getOverallStats();
    const byBetType = this.analytics.getStatsByBetType();

    const ctx = document.getElementById('winRateChart');
    if (!ctx) return;

    const chartData = {
      labels: Object.keys(byBetType),
      datasets: [
        {
          label: 'Win Rate (%)',
          data: Object.values(byBetType).map(b => {
            const settled = b.settled || 1;
            return ((b.wins / settled) * 100).toFixed(1);
          }),
          backgroundColor: [
            'rgba(76, 175, 80, 0.7)',
            'rgba(33, 150, 243, 0.7)',
            'rgba(255, 193, 7, 0.7)',
            'rgba(244, 67, 54, 0.7)',
            'rgba(156, 39, 176, 0.7)'
          ],
          borderColor: [
            'rgba(76, 175, 80, 1)',
            'rgba(33, 150, 243, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(244, 67, 54, 1)',
            'rgba(156, 39, 176, 1)'
          ],
          borderWidth: 2
        }
      ]
    };

    this.charts.winRate = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        ...this.chartConfig,
        indexAxis: 'y',
        plugins: {
          ...this.chartConfig.plugins,
          title: {
            display: true,
            text: 'Win Rate by Bet Type',
            color: '#ffffff',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          x: {
            min: 0,
            max: 100,
            ticks: { color: '#b0b0b0' },
            grid: { color: 'rgba(100, 100, 100, 0.1)' }
          },
          y: {
            ticks: { color: '#b0b0b0' },
            grid: { display: false }
          }
        }
      }
    });
  }

  /**
   * Create ROI trend chart
   */
  createROITrendChart() {
    const roiTrend = this.calculateROITrend();
    const ctx = document.getElementById('roiTrendChart');
    if (!ctx) return;

    const chartData = {
      labels: roiTrend.labels,
      datasets: [
        {
          label: 'ROI (%)',
          data: roiTrend.values,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#4CAF50',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }
      ]
    };

    this.charts.roiTrend = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        ...this.chartConfig,
        plugins: {
          ...this.chartConfig.plugins,
          title: {
            display: true,
            text: 'ROI Trend Over Time',
            color: '#ffffff',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            ticks: {
              color: '#b0b0b0',
              callback: function(value) {
                return value + '%';
              }
            },
            grid: { color: 'rgba(100, 100, 100, 0.1)' }
          }
        }
      }
    });
  }

  /**
   * Create P&L distribution chart
   */
  createPnLDistributionChart() {
    const pnlBuckets = this.calculatePnLBuckets();
    const ctx = document.getElementById('pnlDistributionChart');
    if (!ctx) return;

    const chartData = {
      labels: pnlBuckets.labels,
      datasets: [
        {
          label: 'Number of Bets',
          data: pnlBuckets.counts,
          backgroundColor: pnlBuckets.colors,
          borderColor: pnlBuckets.borderColors,
          borderWidth: 2
        }
      ]
    };

    this.charts.pnlDistribution = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        ...this.chartConfig,
        plugins: {
          ...this.chartConfig.plugins,
          title: {
            display: true,
            text: 'P&L Distribution (Bet Outcomes)',
            color: '#ffffff',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            ticks: { color: '#b0b0b0' },
            grid: { color: 'rgba(100, 100, 100, 0.1)' }
          }
        }
      }
    });
  }

  /**
   * Create sport performance chart
   */
  createSportPerformanceChart() {
    const stats = this.analytics.getStatsByBySport();
    const ctx = document.getElementById('sportPerformanceChart');
    if (!ctx) return;

    const sports = Object.keys(stats);
    const roiValues = sports.map(sport => {
      const bets = stats[sport];
      const totalWagered = bets.totalWagered || 1;
      return ((bets.totalPnL / totalWagered) * 100).toFixed(1);
    });

    const chartData = {
      labels: sports,
      datasets: [
        {
          label: 'ROI by Sport (%)',
          data: roiValues,
          backgroundColor: 'rgba(33, 150, 243, 0.7)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 2
        }
      ]
    };

    this.charts.sportPerformance = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        ...this.chartConfig,
        plugins: {
          ...this.chartConfig.plugins,
          title: {
            display: true,
            text: 'ROI by Sport',
            color: '#ffffff',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            ticks: { color: '#b0b0b0' },
            grid: { color: 'rgba(100, 100, 100, 0.1)' }
          }
        }
      }
    });
  }

  /**
   * Create bet type distribution chart
   */
  createBetTypeDistributionChart() {
    const byBetType = this.analytics.getStatsByBetType();
    const ctx = document.getElementById('betTypeDistributionChart');
    if (!ctx) return;

    const chartData = {
      labels: Object.keys(byBetType),
      datasets: [
        {
          label: 'Bets Placed',
          data: Object.values(byBetType).map(b => b.total),
          backgroundColor: [
            'rgba(255, 107, 107, 0.7)',
            'rgba(66, 165, 245, 0.7)',
            'rgba(129, 199, 132, 0.7)',
            'rgba(255, 213, 79, 0.7)',
            'rgba(171, 71, 188, 0.7)'
          ],
          borderColor: [
            'rgba(255, 107, 107, 1)',
            'rgba(66, 165, 245, 1)',
            'rgba(129, 199, 132, 1)',
            'rgba(255, 213, 79, 1)',
            'rgba(171, 71, 188, 1)'
          ],
          borderWidth: 2
        }
      ]
    };

    this.charts.betTypeDistribution = new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: {
        ...this.chartConfig,
        plugins: {
          ...this.chartConfig.plugins,
          title: {
            display: true,
            text: 'Bet Type Distribution',
            color: '#ffffff',
            font: { size: 16, weight: 'bold' }
          }
        }
      }
    });
  }

  /**
   * Create monthly performance chart
   */
  createMonthlyPerformanceChart() {
    const monthlyStats = this.calculateMonthlyStats();
    const ctx = document.getElementById('monthlyPerformanceChart');
    if (!ctx) return;

    const chartData = {
      labels: monthlyStats.labels,
      datasets: [
        {
          label: 'Monthly P&L',
          data: monthlyStats.pnl,
          backgroundColor: monthlyStats.colors,
          borderColor: 'rgba(200, 200, 200, 1)',
          borderWidth: 2
        }
      ]
    };

    this.charts.monthlyPerformance = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        ...this.chartConfig,
        plugins: {
          ...this.chartConfig.plugins,
          title: {
            display: true,
            text: 'Monthly P&L Performance',
            color: '#ffffff',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            ticks: { color: '#b0b0b0' },
            grid: { color: 'rgba(100, 100, 100, 0.1)' }
          }
        }
      }
    });
  }

  /**
   * Create odds vs outcome correlation chart
   */
  createOddsVsOutcomeChart() {
    const oddsData = this.calculateOddsVsOutcome();
    const ctx = document.getElementById('oddsVsOutcomeChart');
    if (!ctx) return;

    const chartData = {
      labels: oddsData.oddsBuckets,
      datasets: [
        {
          label: 'Win Rate by Odds',
          data: oddsData.winRates,
          borderColor: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#FF6B6B',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }
      ]
    };

    this.charts.oddsVsOutcome = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        ...this.chartConfig,
        plugins: {
          ...this.chartConfig.plugins,
          title: {
            display: true,
            text: 'Win Rate by Odds (Expecting Favorites)',
            color: '#ffffff',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { color: '#b0b0b0' },
            grid: { color: 'rgba(100, 100, 100, 0.1)' }
          }
        }
      }
    });
  }

  /**
   * Create edge analysis chart
   */
  createEdgeAnalysisChart() {
    const edgeAnalysis = this.calculateEdgeAnalysis();
    const ctx = document.getElementById('edgeAnalysisChart');
    if (!ctx) return;

    const chartData = {
      labels: edgeAnalysis.labels,
      datasets: [
        {
          label: 'Positive Edge',
          data: edgeAnalysis.positiveEdge,
          backgroundColor: 'rgba(76, 175, 80, 0.7)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 2
        },
        {
          label: 'Negative Edge',
          data: edgeAnalysis.negativeEdge,
          backgroundColor: 'rgba(244, 67, 54, 0.7)',
          borderColor: 'rgba(244, 67, 54, 1)',
          borderWidth: 2
        }
      ]
    };

    this.charts.edgeAnalysis = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        ...this.chartConfig,
        indexAxis: 'y',
        plugins: {
          ...this.chartConfig.plugins,
          title: {
            display: true,
            text: 'Edge Distribution (Positive vs Negative)',
            color: '#ffffff',
            font: { size: 16, weight: 'bold' }
          }
        }
      }
    });
  }

  /**
   * Calculate ROI trend over time
   */
  calculateROITrend() {
    const settled = this.analytics.bets.filter(b => b.status !== 'PENDING');
    if (settled.length === 0) {
      return { labels: [], values: [] };
    }

    // Sort by date
    const sorted = [...settled].sort((a, b) => {
      return new Date(a.placedDate) - new Date(b.placedDate);
    });

    const labels = [];
    const values = [];
    let cumulativePnL = 0;
    let cumulativeWagered = 0;

    sorted.forEach((bet, index) => {
      cumulativePnL += bet.pnl || 0;
      cumulativeWagered += bet.stake;

      // Add data point every 10 bets or at the end
      if ((index + 1) % 10 === 0 || index === sorted.length - 1) {
        const roi = cumulativeWagered > 0 ? ((cumulativePnL / cumulativeWagered) * 100).toFixed(1) : 0;
        labels.push(`Bet ${index + 1}`);
        values.push(parseFloat(roi));
      }
    });

    return { labels, values };
  }

  /**
   * Calculate P&L distribution buckets
   */
  calculatePnLBuckets() {
    const buckets = {
      'High Win (>200%)': 0,
      'Medium Win (50-200%)': 0,
      'Small Win (0-50%)': 0,
      'Breakeven': 0,
      'Small Loss (-50-0%)': 0,
      'Medium Loss (-200--50%)': 0,
      'High Loss (<-200%)': 0
    };

    const colors = [];
    const borderColors = [];

    this.analytics.bets.forEach(bet => {
      if (bet.status === 'PENDING') return;
      const roi = bet.stake > 0 ? ((bet.pnl / bet.stake) * 100) : 0;

      if (roi > 200) buckets['High Win (>200%)']++;
      else if (roi > 50) buckets['Medium Win (50-200%)']++;
      else if (roi > 0) buckets['Small Win (0-50%)']++;
      else if (roi === 0) buckets['Breakeven']++;
      else if (roi > -50) buckets['Small Loss (-50-0%)']++;
      else if (roi > -200) buckets['Medium Loss (-200--50%)']++;
      else buckets['High Loss (<-200%)']++;
    });

    const colorMap = {
      'High Win (>200%)': ['rgba(76, 175, 80, 0.8)', 'rgba(76, 175, 80, 1)'],
      'Medium Win (50-200%)': ['rgba(129, 199, 132, 0.8)', 'rgba(129, 199, 132, 1)'],
      'Small Win (0-50%)': ['rgba(197, 225, 165, 0.8)', 'rgba(197, 225, 165, 1)'],
      'Breakeven': ['rgba(158, 158, 158, 0.8)', 'rgba(158, 158, 158, 1)'],
      'Small Loss (-50-0%)': ['rgba(255, 179, 71, 0.8)', 'rgba(255, 179, 71, 1)'],
      'Medium Loss (-200--50%)': ['rgba(255, 112, 67, 0.8)', 'rgba(255, 112, 67, 1)'],
      'High Loss (<-200%)': ['rgba(244, 67, 54, 0.8)', 'rgba(244, 67, 54, 1)']
    };

    const labels = Object.keys(buckets);
    const counts = Object.values(buckets);

    labels.forEach(label => {
      const [bg, border] = colorMap[label];
      colors.push(bg);
      borderColors.push(border);
    });

    return { labels, counts, colors, borderColors };
  }

  /**
   * Calculate monthly statistics
   */
  calculateMonthlyStats() {
    const monthlyData = {};

    this.analytics.bets.forEach(bet => {
      if (bet.status === 'PENDING') return;

      const date = new Date(bet.placedDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += bet.pnl || 0;
    });

    const labels = Object.keys(monthlyData).sort();
    const pnl = labels.map(m => monthlyData[m]);

    const colors = pnl.map(val => val > 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)');

    return { labels, pnl, colors };
  }

  /**
   * Calculate odds vs outcome correlation
   */
  calculateOddsVsOutcome() {
    const oddsBuckets = {
      '-500 or worse': { wins: 0, total: 0 },
      '-300 to -500': { wins: 0, total: 0 },
      '-100 to -300': { wins: 0, total: 0 },
      '-100 to 100': { wins: 0, total: 0 },
      '100 to 300': { wins: 0, total: 0 },
      '300 or better': { wins: 0, total: 0 }
    };

    this.analytics.bets.forEach(bet => {
      if (bet.status === 'PENDING') return;

      const odds = bet.entryOdds;
      let bucket;

      if (odds <= -500) bucket = '-500 or worse';
      else if (odds <= -300) bucket = '-300 to -500';
      else if (odds <= -100) bucket = '-100 to -300';
      else if (odds <= 100) bucket = '-100 to 100';
      else if (odds <= 300) bucket = '100 to 300';
      else bucket = '300 or better';

      oddsBuckets[bucket].total++;
      if (bet.status === 'WON') oddsBuckets[bucket].wins++;
    });

    const winRates = Object.values(oddsBuckets).map(b => {
      return b.total > 0 ? ((b.wins / b.total) * 100).toFixed(1) : 0;
    });

    return {
      oddsBuckets: Object.keys(oddsBuckets),
      winRates: winRates.map(Number)
    };
  }

  /**
   * Calculate edge analysis
   */
  calculateEdgeAnalysis() {
    const byBetType = this.analytics.getStatsByBetType();
    const labels = Object.keys(byBetType);

    const positiveEdge = [];
    const negativeEdge = [];

    labels.forEach(type => {
      const bets = byBetType[type];
      const avgEdge = bets.avgEdge || 0;

      if (avgEdge > 0) {
        positiveEdge.push(avgEdge.toFixed(1));
        negativeEdge.push(0);
      } else {
        positiveEdge.push(0);
        negativeEdge.push(Math.abs(avgEdge).toFixed(1));
      }
    });

    return {
      labels,
      positiveEdge: positiveEdge.map(Number),
      negativeEdge: negativeEdge.map(Number)
    };
  }

  /**
   * Get dashboard summary with key metrics
   */
  getDashboardSummary() {
    const stats = this.analytics.getOverallStats();
    const roiTrend = this.calculateROITrend();
    const monthlyStats = this.calculateMonthlyStats();

    return {
      overall: stats,
      roiTrend: {
        current: roiTrend.values[roiTrend.values.length - 1] || 0,
        peak: Math.max(...roiTrend.values) || 0,
        lowest: Math.min(...roiTrend.values) || 0
      },
      monthlyTrend: {
        current: monthlyStats.pnl[monthlyStats.pnl.length - 1] || 0,
        average: (monthlyStats.pnl.reduce((a, b) => a + b, 0) / monthlyStats.pnl.length || 0).toFixed(2),
        profitable: monthlyStats.pnl.filter(p => p > 0).length
      },
      insights: this.generateInsights(stats)
    };
  }

  /**
   * Generate actionable insights based on performance
   */
  generateInsights(stats) {
    const insights = [];

    // Win rate insights
    if (stats.winRate > 55) {
      insights.push('✅ Excellent win rate! Consider increasing bet sizes slightly.');
    } else if (stats.winRate < 45) {
      insights.push('⚠️ Win rate below 45%. Review selection criteria and bet quality.');
    }

    // ROI insights
    if (stats.roi > 10) {
      insights.push('🚀 Strong ROI performance. Your edge is showing.');
    } else if (stats.roi > 0) {
      insights.push('✅ Positive ROI. Keep refining selection process.');
    } else if (stats.roi < -10) {
      insights.push('🔴 Negative ROI. Consider taking a break and analyzing bets.');
    }

    // Volume insights
    if (stats.settledBets < 20) {
      insights.push('📊 Limited data. Aim for 50+ settled bets for reliable analysis.');
    } else if (stats.settledBets > 100) {
      insights.push('📈 Solid sample size. Results are becoming more reliable.');
    }

    // Edge insights
    if (stats.avgEdge < 1) {
      insights.push('💡 Low average edge. Focus on higher-edge opportunities.');
    } else if (stats.avgEdge > 3) {
      insights.push('⭐ Strong average edge. This is what you aim for.');
    }

    return insights;
  }

  /**
   * Update all charts with fresh data
   */
  updateAllCharts() {
    try {
      Object.values(this.charts).forEach(chart => {
        if (chart && typeof chart.update === 'function') {
          chart.update();
        }
      });
      return { success: true, message: 'All charts updated' };
    } catch (error) {
      return { success: false, error: `Chart update failed: ${error.message}` };
    }
  }

  /**
   * Export dashboard data as JSON
   */
  exportDashboardData() {
    return {
      timestamp: new Date().toISOString(),
      summary: this.getDashboardSummary(),
      roiTrend: this.calculateROITrend(),
      monthlyStats: this.calculateMonthlyStats(),
      oddsVsOutcome: this.calculateOddsVsOutcome(),
      edgeAnalysis: this.calculateEdgeAnalysis()
    };
  }

  /**
   * Destroy charts and cleanup
   */
  destroyCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    this.charts = {};
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedAnalyticsDashboard;
}
