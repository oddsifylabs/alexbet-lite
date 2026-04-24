/**
 * AlexBET Lite - Main Application Logic
 * Orchestrates all modules and handles UI interactions
 */

// ===================================================
// Utility Functions
// ===================================================

/**
 * Copy text to clipboard with visual feedback
 * @param {HTMLElement} element - The element containing text to copy
 */
function copyToClipboard(element) {
  const text = element.textContent.trim();
  
  // Copy to clipboard
  navigator.clipboard.writeText(text).then(() => {
    // Show feedback
    const originalText = element.textContent;
    element.textContent = '✓ Copied!';
    element.style.color = 'var(--primary)';
    
    // Reset after 2 seconds
    setTimeout(() => {
      element.textContent = originalText;
      element.style.color = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    // Fallback: select and copy
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      element.textContent = '✓ Copied!';
      setTimeout(() => {
        element.textContent = originalText;
      }, 2000);
    } catch (e) {
      console.error('Fallback copy failed:', e);
    }
    document.body.removeChild(textarea);
  });
}

// ===================================================
// Global State
// ===================================================

const app = {
  betTracker: new BetTracker(),
  analytics: new Analytics(),
  betAnalytics: null,  // Initialized after BetTracker
  propsTracker: propsTracker,
  liveScores: liveScores,
  currentTab: 'dashboard',
  liveScoreInterval: null,
  isUpdating: false
};

// Initialize BetAnalytics after BetTracker is created
app.betAnalytics = new BetAnalytics(app.betTracker);

// ===================================================
// Initialization
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  updateDisplays();
});

function initializeApp() {
  console.log('[AlexBET] Initializing application...');

  // Load version
  document.getElementById('headerVersion').textContent = 'v2026.04.19';
  document.getElementById('appVersion').textContent = 'v2026.04.19';

  // Initialize UI
  renderStats();
  renderBets();
  renderProps();
  updateStorageInfo();

  // Start live score updates
  startLiveScoreUpdates();

  console.log('[AlexBET] Application ready');
}

function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Form submission
  document.getElementById('addBetBtn').addEventListener('click', addBet);
  document.getElementById('pick').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBet();
  });

  // Bet type change - show/hide conditional fields
  document.getElementById('betType').addEventListener('change', (e) => {
    const betType = e.target.value;
    // Hide all conditional fields
    document.getElementById('spreadFields').style.display = 'none';
    document.getElementById('totalFields').style.display = 'none';
    document.getElementById('propFields').style.display = 'none';
    
    // Show relevant fields based on bet type
    if (betType === 'SPREAD') {
      document.getElementById('spreadFields').style.display = 'block';
    } else if (betType === 'TOTAL') {
      document.getElementById('totalFields').style.display = 'block';
    } else if (betType === 'PROP') {
      document.getElementById('propFields').style.display = 'block';
    }
  });

  // Auto-populate game dates when sport is selected, then events when date is selected
  document.getElementById('sport').addEventListener('change', populateDatesByGameDates);
  document.getElementById('gameDate').addEventListener('change', populateEventsByDate);

  console.log('[AlexBET] Event listeners setup complete');
}

// ===================================================
// ESPN API Fallback
// ===================================================

function fetchFromESPNAPI(sport, gameDate) {
  const eventSelect = document.getElementById('event');
  
  // ESPN sport IDs
  const espnSportMap = {
    'NBA': 'basketball_nba',
    'NFL': 'football_nfl',
    'MLB': 'baseball_mlb',
    'NHL': 'hockey_nhl',
    'EPL': 'soccer_eng_premier_league',
    'ATP': 'tennis_atp'
  };
  
  const espnSport = espnSportMap[sport];
  if (!espnSport) {
    eventSelect.innerHTML = '<option value="">⚠️ Sport not supported</option>';
    return;
  }
  
  const espnUrl = `https://espn-api.herokuapp.com/games?league=${espnSport}&date=${gameDate.replace(/-/g, '')}`;
  
  fetch(espnUrl)
    .then(res => res.json())
    .then(data => {
      const games = data || [];
      
      if (games.length === 0) {
        eventSelect.innerHTML = '<option value="">⚠️ No games found</option>';
        return;
      }
      
      // Populate event dropdown
      let html = '<option value="">-- Select game --</option>';
      games.forEach(game => {
        const home = game.home || game.homeTeam || 'Team A';
        const away = game.away || game.awayTeam || 'Team B';
        const matchup = `${away} vs ${home}`;
        const gameTime = game.gameTime || game.date || '';
        html += `<option value="${matchup}">${matchup} ${gameTime ? '(' + gameTime + ')' : ''}</option>`;
      });
      
      eventSelect.innerHTML = html;
      console.log(`[AlexBET] ESPN API: Populated ${games.length} games for ${sport} on ${gameDate}`);
    })
    .catch(error => {
      console.error('[AlexBET] ESPN API Error:', error);
      eventSelect.innerHTML = '<option value="">⚠️ No live data. Please try again.</option>';
    });
}

function fetchDatesFromESPNAPI(sport) {
  const dateSelect = document.getElementById('gameDate');
  const eventSelect = document.getElementById('event');
  
  // ESPN sport IDs
  const espnSportMap = {
    'NBA': 'basketball_nba',
    'NFL': 'football_nfl',
    'MLB': 'baseball_mlb',
    'NHL': 'hockey_nhl',
    'EPL': 'soccer_eng_premier_league',
    'ATP': 'tennis_atp'
  };
  
  const espnSport = espnSportMap[sport];
  if (!espnSport) {
    dateSelect.innerHTML = '<option value="">⚠️ Sport not supported</option>';
    return;
  }
  
  // Try to get games from ESPN for today and next few days
  const today = new Date();
  const datesWithGames = [];
  
  // Try to fetch for each of the next 5 days
  let datePromises = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dateNum = dateStr.replace(/-/g, '');
    
    const espnUrl = `https://espn-api.herokuapp.com/games?league=${espnSport}&date=${dateNum}`;
    datePromises.push(
      fetch(espnUrl)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            datesWithGames.push({ date: dateStr, count: data.length });
          }
        })
        .catch(error => console.warn(`[AlexBET] ESPN date check failed for ${dateStr}:`, error))
    );
  }
  
  Promise.all(datePromises).then(() => {
    if (datesWithGames.length === 0) {
      dateSelect.innerHTML = '<option value="">⚠️ No games in next 5 days</option>';
      return;
    }
    
    // Populate date dropdown
    let html = '<option value="">-- Select date with games --</option>';
    datesWithGames.forEach(item => {
      // Parse UTC date string (YYYY-MM-DD) without timezone conversion
      const [year, month, day] = item.date.split('-');
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      const displayDate = utcDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      html += `<option value="${item.date}">${displayDate} (${item.date})</option>`;
    });
    
    dateSelect.innerHTML = html;
    eventSelect.innerHTML = '<option value="">-- Select date first --</option>';
    console.log(`[AlexBET] ESPN API: Found ${datesWithGames.length} dates with games for ${sport}`);
  });
}

// ===================================================
// Auto-populate Game Dates and Events based on Sport
// ===================================================
function populateDatesByGameDates() {
  const sport = document.getElementById('sport').value;
  const dateSelect = document.getElementById('gameDate');
  const eventSelect = document.getElementById('event');
  
  // Reset dropdowns
  dateSelect.innerHTML = '<option value="">-- Loading dates with games... --</option>';
  eventSelect.innerHTML = '<option value="">-- Select date first --</option>';
  
  if (!sport) {
    dateSelect.innerHTML = '<option value="">Select sport first</option>';
    return;
  }
  
  // Map sport names to Odds API sport keys
  const sportMap = {
    'NBA': 'basketball_nba',
    'NFL': 'americanfootball_nfl',
    'MLB': 'baseball_mlb',
    'NHL': 'icehockey_nhl',
    'EPL': 'soccer_epl',
    'ATP': 'tennis_atp'
  };
  
  const apiSport = sportMap[sport];
  if (!apiSport) {
    dateSelect.innerHTML = '<option value="">Invalid sport</option>';
    return;
  }
  
  // Fetch games from Odds API
  const apiKey = '6f46bbb3b2fb69b5e14980a57e9909da';
  const url = `https://api.the-odds-api.com/v4/sports/${apiSport}/events?apiKey=${apiKey}`;
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      // Check for API error - show error message
      if (data.error_code) {
        console.error('[AlexBET] API Error:', data.message || data.error_code);
        dateSelect.innerHTML = `<option value="">⚠️ API Error: ${data.message || 'Unable to load games'}</option>`;
        return;
      }
      
      // Odds API returns an array directly, not wrapped in .data
      const games = Array.isArray(data) ? data : (data.data || []);
      
      if (games.length === 0) {
        dateSelect.innerHTML = '<option value="">⚠️ No games found</option>';
        return;
      }
      
      // Extract unique dates from ALL games (not filtered by time)
      // Users want to see all games including past/in-progress to add to bet tracker
      const datesWithGames = new Set();
      games.forEach(game => {
        // Extract UTC date directly from timestamp (YYYY-MM-DD) without timezone conversion
        const dateStr = game.commence_time.split('T')[0];
        datesWithGames.add(dateStr);
      });
      
      if (datesWithGames.size === 0) {
        dateSelect.innerHTML = '<option value="">⚠️ No games in next 5 days</option>';
        return;
      }
      
      // Populate date dropdown
      let html = '<option value="">-- Select date with games --</option>';
      Array.from(datesWithGames).sort().forEach(date => {
        // Parse UTC date string (YYYY-MM-DD) without timezone conversion
        const [year, month, day] = date.split('-');
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        const displayDate = utcDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        html += `<option value="${date}">${displayDate} (${date})</option>`;
      });
      
      dateSelect.innerHTML = html;
      console.log(`[AlexBET] Found ${datesWithGames.size} dates with games for ${sport}`);
    })
    .catch(error => {
      console.error('[AlexBET] Error fetching games:', error);
      console.warn('[AlexBET] Trying ESPN API fallback for dates...');
      fetchDatesFromESPNAPI(sport);
    });
}

function populateEventsByDate() {
  const sport = document.getElementById('sport').value;
  const gameDate = document.getElementById('gameDate').value;
  const eventSelect = document.getElementById('event');
  
  if (!sport || !gameDate) {
    eventSelect.innerHTML = '<option value="">Select sport and date first</option>';
    return;
  }
  
  eventSelect.innerHTML = '<option value="">-- Loading games... --</option>';
  
  // Map sport names to Odds API sport keys
  const sportMap = {
    'NBA': 'basketball_nba',
    'NFL': 'americanfootball_nfl',
    'MLB': 'baseball_mlb',
    'NHL': 'icehockey_nhl',
    'EPL': 'soccer_epl',
    'ATP': 'tennis_atp'
  };
  
  const apiSport = sportMap[sport];
  
  // Fetch games from Odds API
  const apiKey = '6f46bbb3b2fb69b5e14980a57e9909da';
  const url = `https://api.the-odds-api.com/v4/sports/${apiSport}/events?apiKey=${apiKey}`;
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      // Check for API error - try ESPN fallback
      if (data.error_code) {
        console.warn('[AlexBET] Odds API failed, trying ESPN API fallback...');
        fetchFromESPNAPI(sport, gameDate);
        return;
      }
      
      // Odds API returns an array directly, not wrapped in .data
      const games = Array.isArray(data) ? data : (data.data || []);
      
      if (games.length === 0) {
        eventSelect.innerHTML = '<option value="">⚠️ No games found</option>';
        return;
      }
      
      // Filter games for the selected date
      // FIX: Convert UTC times to local date for proper matching
      const selectedDate = gameDate; // Already in YYYY-MM-DD format
      const filteredGames = games.filter(game => {
        // Convert UTC time to local date (don't use toISOString which stays in UTC)
        const gameTime = new Date(game.commence_time);
        const localDate = gameTime.toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
        return localDate === selectedDate;
      });
      
      if (filteredGames.length === 0) {
        eventSelect.innerHTML = '<option value="">⚠️ No games on this date</option>';
        return;
      }
      
      // Populate event dropdown
      let html = '<option value="">-- Select game --</option>';
      filteredGames.forEach(game => {
        const matchup = `${game.home_team} vs ${game.away_team}`;
        const gameTime = new Date(game.commence_time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        html += `<option value="${matchup}">${matchup} (${gameTime})</option>`;
      });
      
      eventSelect.innerHTML = html;
      console.log(`[AlexBET] Populated ${filteredGames.length} games for ${sport} on ${gameDate}`);
    })
    .catch(error => {
      console.error('[AlexBET] Error fetching games:', error);
      console.warn('[AlexBET] Trying ESPN API fallback...');
      fetchFromESPNAPI(sport, gameDate);
    });
}

// ===================================================
// Tab Management
// ===================================================

function switchTab(tabName) {
  app.currentTab = tabName;

  // Update tab buttons
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabName).classList.add('active');

  // Refresh data when switching tabs
  if (tabName === 'analysis') {
    renderAnalysis();
  } else if (tabName === 'bets') {
    renderBetsTable();
  } else if (tabName === 'props') {
    renderPropsAnalysis();
  }
}

// ===================================================
// Bet Management
// ===================================================

function addBet() {
  // Validate form using FormManager
  if (!formManager.validateForm()) {
    securityAudit.logValidationFailure('betForm', ['Validation errors - see feedback below']);
    return;
  }

  // Get form data
  const betData = formManager.getFormData();

  // Add bet
  const result = app.betTracker.addBet(betData);

  if (result.success) {
    securityAudit.logDataAccess('bets', 'CREATE', true);
    
    // Build description for alert
    const betDescription = buildBetDescription(betData);
    showAlert(`✅ ${betDescription}`, 'success');
    
    // Clear form and reset
    resetBetForm();
    updateDisplays();
  } else {
    securityAudit.logValidationFailure('betForm', result.errors);
    showAlert(`❌ Error: ${result.errors.join(', ')}`, 'error');
  }
}

/**
 * Build a readable description of the bet for the alert message
 */
function buildBetDescription(betData) {
  const { pick, betType, spreadLine, overUnder, totalLine, entryOdds, stake } = betData;
  
  let desc = `Bet added: ${pick}`;
  
  if (betType === 'SPREAD' && spreadLine) {
    desc += ` (${spreadLine > 0 ? '+' : ''}${spreadLine})`;
  } else if (betType === 'TOTAL' && totalLine && overUnder) {
    desc += ` ${overUnder} ${totalLine}`;
  }
  
  desc += ` @ ${entryOdds > 0 ? '+' : ''}${entryOdds} | Stake: $${stake}`;
  
  return desc;
}

function resetBetForm() {
  if (formManager) {
    formManager.resetForm();
  } else {
    clearBetForm();
  }
}

function clearBetForm() {
  document.getElementById('pick').value = '';
  document.getElementById('sport').value = '';
  document.getElementById('betType').value = '';
  document.getElementById('odds').value = '';
  document.getElementById('stake').value = '';
  document.getElementById('edge').value = '';
  document.getElementById('confidence').value = '';
  document.getElementById('pick').focus();
}

function updateBetStatus(betId, newStatus) {
  const result = app.betTracker.updateBetStatus(betId, newStatus);

  if (result.success) {
    showAlert(`✅ Bet status updated to ${newStatus}`, 'success');
    updateDisplays();
  } else {
    showAlert(`❌ Error: ${result.errors.join(', ')}`, 'error');
  }
}

function deleteBet(betId) {
  if (!confirm('Delete this bet? This action cannot be undone.')) {
    return;
  }

  const result = app.betTracker.deleteBet(betId);

  if (result.success) {
    showAlert('✅ Bet deleted', 'success');
    updateDisplays();
  } else {
    showAlert('❌ Error deleting bet', 'error');
  }
}

function filterBets() {
  renderBetsTable();
}

function exportBets() {
  const result = app.betTracker.exportAsJSON();

  if (result.success) {
    showAlert('✅ Bets exported successfully', 'success');
  } else {
    showAlert(`❌ Error: ${result.errors.join(', ')}`, 'error');
  }
}

async function importBets() {
  const fileInput = document.getElementById('importFile');
  const file = fileInput.files[0];

  if (!file) return;

  const result = await app.betTracker.importFromJSON(file);

  if (result.success) {
    showAlert(`✅ Imported ${result.imported} bets`, 'success');
    updateDisplays();
  } else {
    showAlert(`❌ Error: ${result.errors[0]}`, 'error');
  }

  fileInput.value = '';
}

function clearAllBets() {
  const confirmed = confirm(
    `⚠️ This will delete ALL ${app.betTracker.bets.length} bets!\n\nExport first to backup data.\n\nAre you sure?`
  );

  if (!confirmed) return;

  const result = app.betTracker.clearAllBets(true);

  if (result.success) {
    showAlert('✅ All bets cleared', 'success');
    updateDisplays();
  }
}

// ===================================================
// Props Management
// ===================================================

function addPropBet() {
  const player = document.getElementById('propPlayer').value;
  const sport = document.getElementById('propSport').value;
  const propType = document.getElementById('propType').value;
  const line = parseFloat(document.getElementById('propLine').value);
  const odds = parseFloat(document.getElementById('propOdds').value);
  const stake = parseFloat(document.getElementById('propStake').value);

  if (!player || !sport || !propType || !line || !odds || !stake) {
    showAlert('Please fill in all prop fields', 'error');
    return;
  }

  const result = app.propsTracker.logPropBet(player, sport, propType, line, odds, 0, stake);

  if (result.success) {
    showAlert(`✅ Prop added: ${player} ${propType}`, 'success');
    clearPropForm();
    renderProps();
  } else {
    showAlert(`❌ Error: ${result.errors.join(', ')}`, 'error');
  }
}

function clearPropForm() {
  document.getElementById('propPlayer').value = '';
  document.getElementById('propSport').value = '';
  document.getElementById('propType').value = '';
  document.getElementById('propLine').value = '';
  document.getElementById('propOdds').value = '';
  document.getElementById('propStake').value = '';
}

// ===================================================
// Display Rendering
// ===================================================

function updateDisplays() {
  app.analytics.updateBets(app.betTracker.bets);
  renderStats();
  renderBets();
  updateStorageInfo();
}

function renderStats() {
  const stats = app.analytics.getOverallStats();
  const winRateStatus = app.analytics.getWinRateStatus();

  const statsGrid = document.getElementById('statsGrid');

  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Win Rate</div>
      <div class="stat-value">${stats.winRate.toFixed(1)}%</div>
      <div class="stat-detail">${stats.wins}W - ${stats.losses}L - ${stats.pushes}P</div>
    </div>

    <div class="stat-card ${stats.totalPnL > 0 ? 'positive' : stats.totalPnL < 0 ? 'negative' : ''}">
      <div class="stat-label">P&L</div>
      <div class="stat-value" style="color: ${stats.totalPnL > 0 ? '#00d68f' : stats.totalPnL < 0 ? '#ff6464' : '#fff'}">
        ${stats.totalPnL > 0 ? '+' : ''}$${stats.totalPnL}
      </div>
      <div class="stat-detail">ROI: ${stats.roi}%</div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Wagered</div>
      <div class="stat-value">$${stats.totalWagered}</div>
      <div class="stat-detail">${stats.settledBets} settled, ${stats.pendingBets} pending</div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Avg Edge</div>
      <div class="stat-value">${parseFloat(stats.avgEdge) > 0 ? '+' : ''}${stats.avgEdge}%</div>
      <div class="stat-detail">Target: 56-65%</div>
    </div>

    <div class="stat-card ${winRateStatus.onTrack ? 'positive' : 'negative'}">
      <div class="stat-label">Status</div>
      <div class="stat-value" style="font-size: 16px;">${winRateStatus.status}</div>
      <div class="stat-detail">${winRateStatus.message}</div>
    </div>
  `;

  // Show/hide empty state
  const bets = app.betTracker.bets;
  if (bets.length === 0) {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('betsCards').style.display = 'none';
  } else {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('betsCards').style.display = 'grid';
  }

  // Render advanced analytics if available
  renderAdvancedAnalytics();
}

function renderAdvancedAnalytics() {
  if (!app.betAnalytics || app.betTracker.bets.length < 3) {
    return;
  }

  const container = document.getElementById('analyticsPanel');
  if (!container) {
    return;
  }

  const overallStats = app.betAnalytics.getOverallStats();
  const streaks = app.betAnalytics.getStreaks();
  const insights = app.betAnalytics.getInsights();
  const statsBySport = app.betAnalytics.getStatsBySport();

  let analyticsHTML = `
    <div class="analytics-section">
      <div class="analytics-header">📊 Advanced Analytics</div>
      
      <div class="analytics-grid">
        <div class="analytics-card">
          <div class="analytics-label">Win Rate</div>
          <div class="analytics-value">${overallStats.winRate}%</div>
          <div class="analytics-detail">${overallStats.wins}W / ${overallStats.losses}L / ${overallStats.pushes}P</div>
        </div>

        <div class="analytics-card">
          <div class="analytics-label">Current Streak</div>
          <div class="analytics-value">${streaks.currentStreakEmoji} ${streaks.currentStreak}</div>
          <div class="analytics-detail">${streaks.currentStreakType} streak</div>
        </div>

        <div class="analytics-card">
          <div class="analytics-label">ROI</div>
          <div class="analytics-value" style="color: ${parseFloat(overallStats.roi) > 0 ? '#00d68f' : '#ff6464'};">${overallStats.roi}%</div>
          <div class="analytics-detail">P&L: ${overallStats.roi > 0 ? '+' : ''}$${overallStats.totalPnL}</div>
        </div>

        <div class="analytics-card">
          <div class="analytics-label">Avg Edge</div>
          <div class="analytics-value">${overallStats.avgEdge}%</div>
          <div class="analytics-detail">Confidence: ${overallStats.avgConfidence}/10</div>
        </div>
      </div>

      ${insights.length > 0 ? `
      <div class="insights-section">
        <div class="insights-header">💡 Insights</div>
        ${insights.map(insight => `
          <div class="insight-item insight-${insight.type}">
            ${insight.emoji} ${insight.message}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${Object.keys(statsBySport).length > 1 ? `
      <div class="sport-breakdown">
        <div class="breakdown-header">🏟️ By Sport</div>
        <div class="breakdown-grid">
          ${Object.values(statsBySport).map(sport => `
            <div class="breakdown-card">
              <div class="breakdown-sport">${sport.sport}</div>
              <div class="breakdown-stat">${sport.wins}/${sport.settledBets} (${sport.winRate}%)</div>
              <div class="breakdown-stat">ROI: ${sport.roi}%</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
  `;

  container.innerHTML = analyticsHTML;
}

function renderBets() {
  const bets = app.betTracker.bets.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));
  const container = document.getElementById('betsCards');

  if (bets.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = bets.map(bet => {
    const time = new Date(bet.entryTime).toLocaleDateString();
    const statusClass = bet.status.toLowerCase();
    const statusEmoji = {
      'pending': '⚪',
      'won': '✅',
      'lost': '❌',
      'push': '➖'
    }[statusClass] || '❓';

    return `
      <div class="bet-card ${statusClass}">
        <div class="bet-card-header">
          <div class="bet-card-pick">${bet.pick}${bet.betType === 'SPREAD' && bet.spreadLine ? ` (${bet.spreadLine > 0 ? '+' : ''}${bet.spreadLine})` : ''}${bet.betType === 'TOTAL' && bet.totalLine && bet.overUnder ? ` ${bet.overUnder} ${bet.totalLine}` : ''}</div>
          <span class="bet-card-date">${time}</span>
        </div>

        <div class="bet-card-grid">
          <div class="bet-field">
            <div class="bet-field-label">Sport</div>
            <div class="bet-field-value">${bet.sport}</div>
          </div>
          <div class="bet-field">
            <div class="bet-field-label">Type</div>
            <div class="bet-field-value">${bet.betType}</div>
          </div>
          <div class="bet-field">
            <div class="bet-field-label">Odds</div>
            <div class="bet-field-value">${bet.entryOdds > 0 ? '+' : ''}${bet.entryOdds}</div>
          </div>
          <div class="bet-field">
            <div class="bet-field-label">Stake</div>
            <div class="bet-field-value">$${bet.stake}</div>
          </div>
          <div class="bet-field">
            <div class="bet-field-label">Edge</div>
            <div class="bet-field-value">${bet.edge > 0 ? '+' : ''}${bet.edge}%</div>
          </div>
          <div class="bet-field">
            <div class="bet-field-label">Confidence</div>
            <div class="bet-field-value">${bet.confidence}/10</div>
          </div>
          <div class="bet-field">
            <div class="bet-field-label">P&L</div>
            <div class="bet-field-value" style="color: ${bet.pnl > 0 ? '#00d68f' : bet.pnl < 0 ? '#ff6464' : '#fff'}">
              ${bet.pnl > 0 ? '+' : ''}$${bet.pnl}
            </div>
          </div>
          ${bet.notes ? `
          <div class="bet-field" style="grid-column: 1 / -1;">
            <div class="bet-field-label">Notes</div>
            <div class="bet-field-value" style="font-size: 12px; color: var(--text-tertiary); font-style: italic;">${bet.notes}</div>
          </div>
          ` : ''}
        </div>

        <div class="bet-card-footer">
          <span class="bet-status-badge ${statusClass}">
            ${statusEmoji} ${bet.status}
          </span>
          ${bet.status === 'PENDING' ? `
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <select onchange="updateBetStatus('${bet.id}', this.value)" style="font-size: 12px; padding: 6px 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: white; cursor: pointer;">
                <option value="">Mark as...</option>
                <option value="WON">✅ Won</option>
                <option value="LOST">❌ Lost</option>
                <option value="PUSH">➖ Push</option>
              </select>
              <button onclick="deleteBet('${bet.id}')" class="danger" style="padding: 6px 8px; font-size: 12px; cursor: pointer;">🗑️ Delete</button>
            </div>
          ` : `
            <button onclick="deleteBet('${bet.id}')" class="danger" style="padding: 6px 8px; font-size: 12px; cursor: pointer;">🗑️ Delete</button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function renderBetsTable() {
  const status = document.getElementById('filterStatus').value;
  const sport = document.getElementById('filterSport').value;

  const filters = {};
  if (status) filters.status = status;
  if (sport) filters.sport = sport;

  const bets = app.betTracker.getBets(filters);
  const container = document.getElementById('betsTable');

  if (bets.length === 0) {
    container.innerHTML = '<div class="empty-state">No bets match the selected filters</div>';
    return;
  }

  let html = `
    <table style="width: 100%; border-collapse: collapse; color: #fff;">
      <thead>
        <tr style="border-bottom: 1px solid #333; background: rgba(0,214,143,0.05);">
          <th style="padding: 12px; text-align: left;">Pick</th>
          <th style="padding: 12px; text-align: left;">Sport</th>
          <th style="padding: 12px; text-align: center;">Odds</th>
          <th style="padding: 12px; text-align: center;">Stake</th>
          <th style="padding: 12px; text-align: center;">P&L</th>
          <th style="padding: 12px; text-align: center;">Status</th>
          <th style="padding: 12px; text-align: center;">Date</th>
        </tr>
      </thead>
      <tbody>
  `;

  bets.forEach(bet => {
    const time = new Date(bet.entryTime).toLocaleDateString();
    const statusEmoji = {
      'pending': '⚪',
      'won': '✅',
      'lost': '❌',
      'push': '➖'
    }[bet.status.toLowerCase()] || '❓';

    html += `
      <tr style="border-bottom: 1px solid #222;">
        <td style="padding: 12px;">${bet.pick}</td>
        <td style="padding: 12px;">${bet.sport}</td>
        <td style="padding: 12px; text-align: center;">${bet.entryOdds > 0 ? '+' : ''}${bet.entryOdds}</td>
        <td style="padding: 12px; text-align: center;">$${bet.stake}</td>
        <td style="padding: 12px; text-align: center; color: ${bet.pnl > 0 ? '#00d68f' : bet.pnl < 0 ? '#ff6464' : '#fff'}">
          ${bet.pnl > 0 ? '+' : ''}$${bet.pnl}
        </td>
        <td style="padding: 12px; text-align: center;">${statusEmoji} ${bet.status}</td>
        <td style="padding: 12px; text-align: center;">${time}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

function renderProps() {
  const sports = ['NBA', 'NFL', 'MLB'];
  const container = document.getElementById('propsContainer');

  let html = '';

  sports.forEach(sport => {
    const summary = app.propsTracker.generateSummary(sport);

    html += `
      <h3>${sport} Props</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total</div>
          <div class="stat-value">${summary.total}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Win Rate</div>
          <div class="stat-value">${summary.winRate}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">P&L</div>
          <div class="stat-value" style="color: ${summary.totalPnL > 0 ? '#00d68f' : summary.totalPnL < 0 ? '#ff6464' : '#fff'}">
            ${summary.totalPnL > 0 ? '+' : ''}$${summary.totalPnL}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">ROI</div>
          <div class="stat-value">${summary.roi}%</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderPropsAnalysis() {
  renderProps();
}

function renderAnalysis() {
  const report = app.analytics.generateReport();
  const container = document.getElementById('analysisContainer');

  const streaks = report.streaks;
  const outliers = report.outliers;
  const edgeAnalysis = report.edgeAnalysis;

  let html = `
    <h3>Advanced Analytics</h3>

    <h4>Streaks</h4>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Current Streak</div>
        <div class="stat-value">${streaks.currentStreak.count}</div>
        <div class="stat-detail">${streaks.currentStreak.type}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Longest Win</div>
        <div class="stat-value">${streaks.longestWinStreak}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Longest Loss</div>
        <div class="stat-value">${streaks.longestLossStreak}</div>
      </div>
    </div>

    <h4>Edge Analysis</h4>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Avg Edge</div>
        <div class="stat-value">${edgeAnalysis.avgEdge}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Positive Edge Win Rate</div>
        <div class="stat-value">${edgeAnalysis.positiveEdgeWinRate}%</div>
        <div class="stat-detail">${edgeAnalysis.positiveEdgeBets} bets</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Negative Edge Win Rate</div>
        <div class="stat-value">${edgeAnalysis.negativeEdgeWinRate}%</div>
        <div class="stat-detail">${edgeAnalysis.negativeEdgeBets} bets</div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// ===================================================
// Live Scores
// ===================================================

function startLiveScoreUpdates() {
  // Check for pending bets every 30 seconds
  if (app.liveScoreInterval) clearInterval(app.liveScoreInterval);

  app.liveScoreInterval = setInterval(updateLiveScores, 30000);

  console.log('[AlexBET] Live score updates started');
}

async function updateLiveScores() {
  if (app.isUpdating) return;

  app.isUpdating = true;

  try {
    const pendingBets = app.betTracker.bets.filter(b => b.status === 'PENDING');

    for (const bet of pendingBets) {
      try {
        const scoreData = await app.liveScores.getScore(bet.pick, bet.sport, bet.gameId);
        app.betTracker.updateLiveScore(bet.id, scoreData);
      } catch (err) {
        console.error(`[AlexBET] Error updating score for ${bet.pick}:`, err);
      }
    }

    if (pendingBets.length > 0) {
      updateDisplays();
    }
  } finally {
    app.isUpdating = false;
  }
}

// ===================================================
// Utilities
// ===================================================

function showAlert(message, type = 'info') {
  const container = document.getElementById('alertContainer');
  const alertClass = `${type}-message`;

  const alert = document.createElement('div');
  alert.className = alertClass;
  alert.textContent = message;

  container.innerHTML = '';
  container.appendChild(alert);

  setTimeout(() => {
    alert.remove();
  }, 5000);
}

function updateStorageInfo() {
  const stats = app.betTracker.getStorageStats();

  if (stats) {
    document.getElementById('storageUsage').textContent = 
      `${stats.sizeKB}KB / ${stats.quotaMB}MB (${stats.percentUsed}%)`;
  }
}

function showSettings() {
  const stats = app.betTracker.getStorageStats();
  const panel = document.getElementById('settingsPanel');

  panel.innerHTML = `
    <h4>Storage Details</h4>
    <p>Total Bets: ${stats.totalBets}</p>
    <p>Size: ${stats.sizeKB}KB (${stats.sizeMB}MB)</p>
    <p>Used: ${stats.percentUsed}% of quota</p>

    <h4>About</h4>
    <p>AlexBET Lite v2026.04.19 - Phase 6 Complete ✅</p>
    <p>Standalone bet tracking & analytics app</p>
    <p>All data stored locally in your browser</p>
  `;
}

// ===================================================
// Initialize on load
// ===================================================

console.log('[AlexBET] Script loaded successfully');
