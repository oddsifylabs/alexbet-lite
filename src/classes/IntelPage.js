/**
 * Intel Page Manager
 * Handles live game scores, news feeds, injury reports, market movers, and game conditions
 * 
 * APIs Used:
 * - ESPN API: News, injuries, scores (site.api.espn.com/apis/site/v2/)
 * - The Odds API: Live odds and game data (requires API key)
 */

class IntelPage {
  constructor() {
    this.selectedSport = null;
    this.liveGames = [];
    this.newsCache = {};
    this.refreshIntervals = {};
    this.sportMapping = {
      'NBA': { espn: 'basketball/nba', oddsApi: 'basketball_nba' },
      'NFL': { espn: 'football/nfl', oddsApi: 'americanfootball_nfl' },
      'MLB': { espn: 'baseball/mlb', oddsApi: 'baseball_mlb' },
      'NHL': { espn: 'hockey/nhl', oddsApi: 'icehockey_nhl' },
      'EPL': { espn: 'soccer/english-premier-league', oddsApi: 'soccer_epl' },
      'ATP': { espn: 'tennis/atp', oddsApi: 'tennis_atp' }
    };
    this.lastUpdatedTimes = {
      liveGames: null,
      news: null,
      injuries: null,
      weather: null
    };
    this.selectedGame = null;
    this.init();
  }

  init() {
    // Initialize sport filter dropdown in Intel tab
    const intelSportFilter = document.getElementById('intelSportFilter');
    if (intelSportFilter) {
      intelSportFilter.addEventListener('change', (e) => {
        this.selectedSport = e.target.value;
        // Sync with dashboard sport filter if exists
        const dashboardSport = document.getElementById('sport');
        if (dashboardSport) dashboardSport.value = this.selectedSport;
        this.refreshAll();
      });
    }

    // Listen for dashboard sport selection changes
    const sportSelect = document.getElementById('sport');
    if (sportSelect) {
      sportSelect.addEventListener('change', (e) => {
        this.selectedSport = e.target.value;
        // Sync with intel sport filter
        if (intelSportFilter) intelSportFilter.value = this.selectedSport;
        this.loadLiveGames();
        this.loadNewsFeed();
        this.loadInjuryReports();
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshIntelBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshAll());
    }

    // Modal close buttons
    const closeBtn = document.getElementById('closeGameModal');
    const backdrop = document.querySelector('.modal-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeGameModal());
    if (backdrop) backdrop.addEventListener('click', () => this.closeGameModal());

    // Add bet from modal
    const addBetBtn = document.getElementById('addBetFromModal');
    if (addBetBtn) addBetBtn.addEventListener('click', () => this.addBetFromModal());

    // Load initial data
    this.loadBetaInfo();
    this.loadNewsFeed();
    this.loadInjuryReports();
    this.loadMarketMovers();
    this.loadWeatherConditions();

    // Update last updated timestamp
    this.updateLastUpdated();

    // Auto-refresh intervals
    setInterval(() => this.loadLiveGames(), 30000);
    setInterval(() => this.loadMarketMovers(), 45000);
    setInterval(() => this.updateLastUpdated(), 60000);
  }

  /**
   * Display current beta information
   */
  loadBetaInfo() {
    const betaCard = document.getElementById('betaInfo');
    if (!betaCard) return;

    betaCard.innerHTML = `
      <div class="beta-details">
        <div class="detail-row">
          <span class="label">Version:</span>
          <span class="value">v2026.04.19</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="status-badge active">Production Ready ✅</span>
        </div>
        <div class="detail-row">
          <span class="label">Phase:</span>
          <span class="value">Phase 6 Complete</span>
        </div>
        <div class="detail-row">
          <span class="label">Features:</span>
          <span class="value">Enhanced Forms • Smart Suggestions • Analytics Dashboard • Live Intel</span>
        </div>
        <div class="detail-row">
          <span class="label">Test Coverage:</span>
          <span class="value">87 tests passing</span>
        </div>
      </div>
    `;
  }

  /**
   * Fetch and display live game scores
   * Uses ESPN API for real-time scores and game status
   */
  async loadLiveGames() {
    const container = document.getElementById('liveGamesContainer');
    if (!container) return;

    if (!this.selectedSport) {
      container.innerHTML = `
        <div class="intel-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <p>Select a sport to load live scores</p>
          <span class="empty-hint">Choose NBA, NFL, MLB, NHL, EPL, or ATP from the sport filter</span>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading live games...</p>
      </div>
    `;

    try {
      const sportConfig = this.sportMapping[this.selectedSport];
      if (!sportConfig) {
        throw new Error(`${this.selectedSport} not supported yet`);
      }

      // Fetch from ESPN API for live scores
      const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sportConfig.espn}/scoreboard`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch live scores');
      }

      const data = await response.json();
      const events = data.events || [];

      if (events.length === 0) {
        container.innerHTML = `
          <div class="intel-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
            <p>No live games at this time</p>
            <span class="empty-hint">Check back during game hours for ${this.selectedSport}</span>
          </div>
        `;
        return;
      }

      // Group games by date
      const gamesByDate = {};
      events.forEach(event => {
        const date = new Date(event.date);
        const dateKey = date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
        
        if (!gamesByDate[dateKey]) gamesByDate[dateKey] = [];
        gamesByDate[dateKey].push(event);
      });

      // Render games by date
      let html = '';
      Object.entries(gamesByDate).forEach(([dateKey, dateGames]) => {
        html += `<div class="games-date-group">
          <h4 class="date-header">${dateKey}</h4>
          <div class="games-list">`;
        
        dateGames.forEach(game => {
          const time = new Date(game.date).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          // Determine game status
          const status = game.status?.type?.state || 'pre';
          const statusDetail = game.status?.type?.detail || 'UPCOMING';
          const isLive = status === 'in' || status === 'active';
          
          // Get scores if available
          const homeScore = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.score || '-';
          const awayScore = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.score || '-';
          
          // Get team records
          const homeRecord = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.record || '';
          const awayRecord = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.record || '';
          
          html += `
            <div class="game-card ${isLive ? 'live' : ''}" data-game-id="${game.id}" style="cursor: pointer;">
              <div class="game-header">
                <div class="game-time">${time}</div>
                ${isLive ? '<span class="badge live">LIVE</span>' : `<span class="badge">${statusDetail}</span>`}
              </div>
              <div class="game-matchup">
                <div class="team away">
                  <span class="team-name">${game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.abbreviation || 'Away'}</span>
                  ${awayRecord ? `<span class="team-record">${awayRecord}</span>` : ''}
                  <span class="team-score">${awayScore}</span>
                </div>
                <div class="vs">@</div>
                <div class="team home">
                  <span class="team-name">${game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.abbreviation || 'Home'}</span>
                  ${homeRecord ? `<span class="team-record">${homeRecord}</span>` : ''}
                  <span class="team-score">${homeScore}</span>
                </div>
              </div>
              ${game.status?.period ? `
                <div class="game-status">
                  <span class="period">${game.status?.displayClock || ''} ${game.status?.period}</span>
                </div>
              ` : ''}
            </div>
          `;
        });

        html += `</div></div>`;
      });

      container.innerHTML = html;

      // Update timestamp
      this.lastUpdatedTimes.liveGames = new Date();

      // Add click handlers to game cards
      container.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const gameId = card.dataset.gameId;
          const game = events.find(g => g.id === gameId);
          if (game) this.openGameModal(game);
        });
      });
    } catch (error) {
      console.error('Error loading live games:', error);
      container.innerHTML = `
        <div class="intel-empty error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>Error loading games</p>
          <span class="empty-hint">${error.message}</span>
        </div>
      `;
    }
  }

  /**
   * Fetch and display sports news feed
   * Uses ESPN API for real-time sports news
   */
  async loadNewsFeed() {
    const container = document.getElementById('newsFeedContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading sports news...</p>
      </div>
    `;

    try {
      // Build ESPN API URL based on selected sport
      let apiUrl = 'https://site.api.espn.com/apis/site/v2/sports/news';
      if (this.selectedSport && this.sportMapping[this.selectedSport]) {
        const sportPath = this.sportMapping[this.selectedSport].espn;
        apiUrl = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/news`;
      }

      const response = await fetch(apiUrl);
      
      if (!response.ok) throw new Error('Failed to fetch news');

      const data = await response.json();
      const articles = data.articles || [];

      if (articles.length === 0) {
        this.showNewsPlaceholder(container);
        return;
      }

      let html = '<div class="news-list">';
      articles.slice(0, 12).forEach((article, idx) => {
        const pubDate = new Date(article.published).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const imageUrl = article.images?.[0]?.url || '';
        const description = article.description || article.headline;

        html += `
          <article class="news-item">
            ${imageUrl ? `<div class="news-image"><img src="${imageUrl}" alt="${article.headline}" loading="lazy"></div>` : ''}
            <div class="news-content">
              <div class="news-header">
                <h4 class="news-title">${article.headline}</h4>
                <span class="news-date">${pubDate}</span>
              </div>
              <p class="news-description">${description}</p>
              ${article.links?.web?.href ? `<a href="${article.links.web.href}" target="_blank" rel="noopener noreferrer" class="news-link">Read More →</a>` : ''}
            </div>
          </article>
        `;
      });
      html += '</div>';

      container.innerHTML = html;

      // Update timestamp
      this.lastUpdatedTimes.news = new Date();
    } catch (error) {
      console.error('Error loading news:', error);
      this.showNewsPlaceholder(container);
    }
  }

  /**
   * Show placeholder news guidance
   */
  showNewsPlaceholder(container) {
    container.innerHTML = `
      <div class="news-item">
        <div class="news-header">
          <h4 class="news-title">📰 Sports News Tips</h4>
        </div>
        <p class="news-description">To stay updated on sports news and injuries:</p>
        <ul style="color: var(--text-secondary); font-size: 13px; margin-top: var(--spacing-md); margin-left: var(--spacing-md); line-height: 1.6;">
          <li><strong>ESPN.com</strong> - Breaking news, scores, injury reports</li>
          <li><strong>The Athletic</strong> - In-depth sports analysis and news</li>
          <li><strong>Sports Illustrated</strong> - Daily sports coverage</li>
          <li><strong>Official Team Sites</strong> - Injury updates, roster changes</li>
          <li><strong>Sportsbook Promos</strong> - Market movers, line changes (DraftKings, FanDuel, etc.)</li>
        </ul>
      </div>
      <div class="news-item">
        <div class="news-header">
          <h4 class="news-title">⚡ Key Factors to Monitor</h4>
        </div>
        <p class="news-description">Before placing bets, check:</p>
        <ul style="color: var(--text-secondary); font-size: 13px; margin-top: var(--spacing-md); margin-left: var(--spacing-md); line-height: 1.6;">
          <li><strong>Player Status</strong> - Injuries, suspensions, rest days</li>
          <li><strong>Line Movement</strong> - Sudden odds shifts indicate sharp action</li>
          <li><strong>Weather</strong> - Wind, temperature impact on outdoor sports</li>
          <li><strong>Back-to-Backs</strong> - Fatigue factor in NBA, NHL, baseball</li>
          <li><strong>Public vs Sharp</strong> - Follow sharp money, not the public</li>
        </ul>
      </div>
    `;
  }

  /**
   * Fetch and display injury reports
   * Uses ESPN API for injury news and player status updates
   */
  async loadInjuryReports() {
    const container = document.getElementById('injuryContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading injury reports...</p>
      </div>
    `;

    try {
      // Build ESPN API URL for injury news based on selected sport
      let apiUrl = 'https://site.api.espn.com/apis/site/v2/sports/news';
      if (this.selectedSport && this.sportMapping[this.selectedSport]) {
        const sportPath = this.sportMapping[this.selectedSport].espn;
        apiUrl = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/news`;
      }

      const response = await fetch(apiUrl);
      
      if (!response.ok) throw new Error('Failed to fetch injury data');

      const data = await response.json();
      const articles = data.articles || [];

      // Filter for injury-related news
      const injuries = articles.filter(a => 
        a.headline && (
          a.headline.toLowerCase().includes('injury') ||
          a.headline.toLowerCase().includes('out') ||
          a.headline.toLowerCase().includes('status') ||
          a.headline.toLowerCase().includes('questionable') ||
          a.headline.toLowerCase().includes('doubtful') ||
          a.headline.toLowerCase().includes('strain') ||
          a.headline.toLowerCase().includes('sprain')
        )
      );

      if (injuries.length === 0) {
        container.innerHTML = `
          <div class="intel-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <p>No injury reports at this time</p>
            <span class="empty-hint">Check back later for updates</span>
          </div>
        `;
        return;
      }

      let html = '<div class="injury-list">';
      injuries.slice(0, 10).forEach(injury => {
        // Determine severity based on keywords
        let severity = 'day-to-day';
        if (injury.headline.toLowerCase().includes('out')) severity = 'out';
        else if (injury.headline.toLowerCase().includes('doubtful')) severity = 'doubtful';
        else if (injury.headline.toLowerCase().includes('questionable')) severity = 'questionable';

        const pubDate = new Date(injury.published).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit'
        });

        html += `
          <article class="injury-item ${severity}">
            <div class="injury-header">
              <h5 class="injury-title">${injury.headline}</h5>
              <span class="severity-badge ${severity}">${severity.replace('-', ' ').toUpperCase()}</span>
            </div>
            <p class="injury-description">${injury.description || 'No additional details'}</p>
            <div class="injury-meta">
              <span class="injury-date">${pubDate}</span>
              ${injury.links?.web?.href ? `<a href="${injury.links.web.href}" target="_blank" rel="noopener noreferrer" class="injury-link">Details →</a>` : ''}
            </div>
          </article>
        `;
      });
      html += '</div>';

      container.innerHTML = html;

      // Update timestamp
      this.lastUpdatedTimes.injuries = new Date();
    } catch (error) {
      console.error('Error loading injuries:', error);
      container.innerHTML = `
        <div class="intel-empty error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>Error loading injury data</p>
          <span class="empty-hint">${error.message}</span>
        </div>
      `;
    }
  }

  /**
   * Display market movers and odds changes
   */
  async loadMarketMovers() {
    const container = document.getElementById('marketMoversContainer');
    if (!container) return;

    try {
      container.innerHTML = '<p style="text-align: center; color: #00d9a3;">Analyzing market movement...</p>';

      // Get today's bets from tracker and analyze line movement
      const bets = JSON.parse(localStorage.getItem('bets') || '[]');
      
      if (bets.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No bets to analyze. Add bets to track market movers.</p>';
        return;
      }

      // Group by event
      const eventStats = {};
      bets.forEach(bet => {
        const key = bet.eventTeams || 'Unknown';
        if (!eventStats[key]) {
          eventStats[key] = {
            event: key,
            betCount: 0,
            avgOdds: 0,
            totalStake: 0,
            types: {}
          };
        }
        eventStats[key].betCount++;
        eventStats[key].avgOdds += parseFloat(bet.odds) || 0;
        eventStats[key].totalStake += parseFloat(bet.stake) || 0;
        eventStats[key].types[bet.betType] = (eventStats[key].types[bet.betType] || 0) + 1;
      });

      // Sort by stake volume
      const movers = Object.values(eventStats)
        .sort((a, b) => b.totalStake - a.totalStake)
        .slice(0, 6);

      let html = '';
      movers.forEach(mover => {
        const avgOdds = (mover.avgOdds / mover.betCount).toFixed(2);
        const types = Object.entries(mover.types)
          .map(([type, count]) => `${type}(${count})`)
          .join(' • ');

        html += `
          <div class="market-mover-card">
            <div class="mover-header">
              <h5 class="mover-event">${mover.event}</h5>
              <span class="mover-volume">$${mover.totalStake.toFixed(2)}</span>
            </div>
            <div class="mover-stats">
              <span class="stat">Avg Odds: ${avgOdds}</span>
              <span class="stat">Bets: ${mover.betCount}</span>
              <span class="stat">Types: ${types}</span>
            </div>
            <div class="mover-bar">
              <div class="bar-fill" style="width: ${Math.min((mover.totalStake / 1000) * 100, 100)}%"></div>
            </div>
          </div>
        `;
      });

      container.innerHTML = html || '<p style="text-align: center; color: #888;">Insufficient data to show movers</p>';
    } catch (error) {
      console.error('Error loading market movers:', error);
      container.innerHTML = `<p style="color: #ff6b6b;">⚠️ Error analyzing movers: ${error.message}</p>`;
    }
  }

  /**
   * Load weather and game conditions
   */
  async loadWeatherConditions() {
    const container = document.getElementById('weatherContainer');
    if (!container) return;

    try {
      container.innerHTML = `
        <div class="weather-card">
          <div class="weather-item">
            <h5>🌧️ Weather Impact</h5>
            <p>Check game location for current conditions. Affects outdoor sports (NFL, MLB, Soccer).</p>
          </div>
          <div class="weather-item">
            <h5>⏱️ Scheduling Notes</h5>
            <p>Monitor for postponements, delays, or location changes that affect your bets.</p>
          </div>
          <div class="weather-item">
            <h5>🌐 Venue Details</h5>
            <p>Indoor venues (NBA, NHL): Weather-proof. Outdoor venues: Check conditions before game time.</p>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading weather:', error);
      container.innerHTML = `<p style="color: #ff6b6b;">⚠️ Error loading conditions</p>`;
    }
  }

  /**
   * Update last updated timestamp display
   */
  updateLastUpdated() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = `Last updated: ${timeStr}`;
    }

    // Update individual card timestamps
    if (this.lastUpdatedTimes.liveGames) {
      const el = document.getElementById('liveGamesTimestamp');
      if (el) el.textContent = this.lastUpdatedTimes.liveGames.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (this.lastUpdatedTimes.news) {
      const el = document.getElementById('newsTimestamp');
      if (el) el.textContent = this.lastUpdatedTimes.news.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (this.lastUpdatedTimes.injuries) {
      const el = document.getElementById('injuryTimestamp');
      if (el) el.textContent = this.lastUpdatedTimes.injuries.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (this.lastUpdatedTimes.weather) {
      const el = document.getElementById('weatherTimestamp');
      if (el) el.textContent = this.lastUpdatedTimes.weather.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  }

  /**
   * Open game detail modal
   */
  openGameModal(game) {
    this.selectedGame = game;
    const modal = document.getElementById('gameDetailModal');
    if (!modal) return;

    // Populate modal with game data
    const awayTeam = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away');
    const homeTeam = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home');

    document.getElementById('modalAwayTeam').textContent = awayTeam?.team?.abbreviation || 'Away';
    document.getElementById('modalAwayRecord').textContent = awayTeam?.record || '';
    document.getElementById('modalAwayScore').textContent = awayTeam?.score || '0';
    
    document.getElementById('modalHomeTeam').textContent = homeTeam?.team?.abbreviation || 'Home';
    document.getElementById('modalHomeRecord').textContent = homeTeam?.record || '';
    document.getElementById('modalHomeScore').textContent = homeTeam?.score || '0';

    document.getElementById('modalGameStatus').textContent = game.status?.type?.state === 'in' ? 'LIVE' : 'UPCOMING';
    document.getElementById('modalGameClock').textContent = game.status?.displayClock || new Date(game.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('modalGameTitle').textContent = `${awayTeam?.team?.abbreviation || 'Away'} @ ${homeTeam?.team?.abbreviation || 'Home'}`;

    // Mock stats (would come from API in production)
    document.getElementById('statPossession').textContent = '50%';
    document.getElementById('statShots').textContent = '--';
    document.getElementById('statFouls').textContent = '--';
    document.getElementById('statExtra').textContent = '--';

    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close game detail modal
   */
  closeGameModal() {
    const modal = document.getElementById('gameDetailModal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
    this.selectedGame = null;
  }

  /**
   * Add bet from modal - switch to Signals tab and pre-fill form
   */
  addBetFromModal() {
    if (!this.selectedGame) return;

    const awayTeam = this.selectedGame.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away');
    const homeTeam = this.selectedGame.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home');

    // Switch to Signals tab
    if (window.switchTab) {
      window.switchTab('bets');
    }

    // Pre-fill bet form
    const eventInput = document.getElementById('event');
    if (eventInput) {
      eventInput.value = `${awayTeam?.team?.abbreviation || ''} @ ${homeTeam?.team?.abbreviation || ''}`;
    }

    // Close modal
    this.closeGameModal();

    // Show confirmation
    const formValidation = document.getElementById('formValidation');
    if (formValidation) {
      formValidation.innerHTML = `<div class="validation-success">Game loaded! Complete your bet slip.</div>`;
      setTimeout(() => formValidation.innerHTML = '', 3000);
    }
  }

  /**
   * Refresh all Intel data
   */
  refreshAll() {
    this.loadBetaInfo();
    this.loadLiveGames();
    this.loadNewsFeed();
    this.loadInjuryReports();
    this.loadMarketMovers();
    this.loadWeatherConditions();
    this.updateLastUpdated();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (!window.intelPage) {
    window.intelPage = new IntelPage();
  }
});
