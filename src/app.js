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
  document.getElementById('headerVersion').textContent = 'v2026.04.23';
  document.getElementById('appVersion').textContent = 'v2026.04.23';

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

function fetchFromSportsDataIO(sport, gameDate) {
  const eventSelect = document.getElementById('event');
  
  // SportsDataIO sport IDs
  const sportDataIOMap = {
    'NBA': 'nba',
    'NCAAB': 'ncaab',
    'NFL': 'nfl',
    'NCAAF': 'ncaaf',
    'MLB': 'mlb',
    'NHL': 'nhl',
    'MMA': 'mma',
    'EPL': 'soccer'
  };
  
  const sdioSport = sportDataIOMap[sport];
  if (!sdioSport) {
    eventSelect.innerHTML = '<option value=\"\">⚠️ Sport not supported</option>';
    return;
  }
  
  // Use SportsDataIO API endpoint
  const apiKey = 'acdea7c8923843c4a1a00d1a0cde9adf';
  const dateFormatted = gameDate; // Already in YYYY-MM-DD format
  const sdioUrl = `https://api.sportsdata.io/v3/${sdioSport}/scores/json/GamesByDate/${dateFormatted}?key=${apiKey}`;
  
  console.log(`[AlexBET] Fetching games from SportsDataIO for ${sport} on ${gameDate}: ${sdioUrl}`);
  
  fetch(sdioUrl, { method: 'GET' })
    .then(res => res.json())
    .then(data => {
      console.log(`[AlexBET] SportsDataIO API response:`, data);
      
      // Navigate through SportsDataIO's response structure
      const games = Array.isArray(data) ? data : [];
      
      if (games.length === 0) {
        console.warn(`[AlexBET] No games found for ${sport} on ${gameDate}, trying ESPN fallback...`);
        fetchFromESPNAPI(sport, gameDate);
        return;
      }
      
      // Populate event dropdown
      let html = '<option value=\"\">-- Select game --</option>';
      games.forEach(game => {
        const homeTeam = game.HomeTeam || game.home_team || 'Team A';
        const awayTeam = game.AwayTeam || game.away_team || 'Team B';
        const matchup = `${awayTeam} vs ${homeTeam}`;
        
        const gameTime = game.DateTime ? new Date(game.DateTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }) : '';
        
        html += `<option value=\"${matchup}\">${matchup} ${gameTime ? '(' + gameTime + ')' : ''}</option>`;
      });
      
      eventSelect.innerHTML = html;
      console.log(`[AlexBET] SportsDataIO: Populated ${games.length} games for ${sport} on ${gameDate}`);
    })
    .catch(error => {
      console.error('[AlexBET] SportsDataIO API Error:', error);
      console.warn('[AlexBET] Trying ESPN fallback...');
      fetchFromESPNAPI(sport, gameDate);
    });
}

function fetchFromESPNAPI(sport, gameDate) {
  const eventSelect = document.getElementById('event');
  
  // ESPN sport IDs for the official API
  const espnSportMap = {
    'NBA': 'nba',
    'NCAAB': 'college-basketball',
    'NFL': 'nfl',
    'NCAAF': 'college-football',
    'MLB': 'mlb',
    'NHL': 'nhl',
    'MMA': 'mma',
    'EPL': 'soccer'
  };
  
  const espnSport = espnSportMap[sport];
  if (!espnSport) {
    eventSelect.innerHTML = '<option value=\"\">⚠️ Sport not supported</option>';
    return;
  }
  
  // Use official ESPN API endpoint with proper date formatting (YYYYMMDD)
  const dateFormatted = gameDate.replace(/-/g, ''); // Convert YYYY-MM-DD to YYYYMMDD
  const espnUrl = `https://site.api.espn.com/v2/site/en/sports/${espnSport}/schedule?dates=${dateFormatted}`;
  
  console.log(`[AlexBET] Fetching games from ESPN for ${sport} on ${gameDate}: ${espnUrl}`);
  
  fetch(espnUrl, { method: 'GET' })
    .then(res => res.json())
    .then(data => {
      console.log(`[AlexBET] ESPN API response:`, data);
      
      // Navigate through ESPN's response structure
      const games = data.events || [];
      
      if (games.length === 0) {
        eventSelect.innerHTML = '<option value=\"\">⚠️ No games found</option>';
        console.warn(`[AlexBET] No games found for ${sport} on ${gameDate}`);
        return;
      }
      
      // Populate event dropdown
      let html = '<option value=\"\">-- Select game --</option>';
      games.forEach(game => {
        // Extract team names from the competition
        const competition = game.competitions ? game.competitions[0] : null;
        if (!competition) return;
        
        const homeTeam = competition.competitors && competition.competitors[1] ? competition.competitors[1].team.displayName : 'Team A';
        const awayTeam = competition.competitors && competition.competitors[0] ? competition.competitors[0].team.displayName : 'Team B';
        const matchup = `${awayTeam} vs ${homeTeam}`;
        
        const gameTime = new Date(game.date).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        html += `<option value=\"${matchup}\">${matchup} (${gameTime})</option>`;
      });
      
      eventSelect.innerHTML = html;
      console.log(`[AlexBET] ESPN API: Populated ${games.length} games for ${sport} on ${gameDate}`);
    })
    .catch(error => {
      console.error('[AlexBET] ESPN API Error:', error);
      eventSelect.innerHTML = '<option value=\"\">⚠️ No live data. Please try again.</option>';
    });
}

function fetchDatesFromSportsDataIO(sport) {
  const dateSelect = document.getElementById('gameDate');
  const eventSelect = document.getElementById('event');
  
  // SportsDataIO sport IDs
  const sportDataIOMap = {
    'NBA': 'nba',
    'NCAAB': 'ncaab',
    'NFL': 'nfl',
    'NCAAF': 'ncaaf',
    'MLB': 'mlb',
    'NHL': 'nhl',
    'MMA': 'mma',
    'EPL': 'soccer'
  };
  
  const sdioSport = sportDataIOMap[sport];
  if (!sdioSport) {
    dateSelect.innerHTML = '<option value=\"\">⚠️ Sport not supported</option>';
    return;
  }
  
  // Try to get games from SportsDataIO for today and next few days
  const today = new Date();
  const datesWithGames = [];
  const apiKey = 'acdea7c8923843c4a1a00d1a0cde9adf';
  
  // Try to fetch for each of the next 5 days using SportsDataIO API
  let datePromises = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    // Use local date format (not UTC) to avoid timezone shift
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD in local time
    
    const sdioUrl = `https://api.sportsdata.io/v3/${sdioSport}/scores/json/GamesByDate/${dateStr}?key=${apiKey}`;
    
    datePromises.push(
      fetch(sdioUrl, { method: 'GET' })
        .then(res => res.json())
        .then(data => {
          const games = Array.isArray(data) ? data : [];
          console.log(`[AlexBET] SportsDataIO check for ${sport} on ${dateStr}:`, games.length, 'games');
          if (games && games.length > 0) {
            datesWithGames.push({ date: dateStr, count: games.length });
          }
        })
        .catch(error => {
          console.warn(`[AlexBET] SportsDataIO date check failed for ${dateStr}:`, error);
          // Fall back to ESPN if SportsDataIO fails
        })
    );
  }
  
  Promise.all(datePromises).then(() => {
    if (datesWithGames.length === 0) {
      console.warn(`[AlexBET] No games found in next 5 days for ${sport} via SportsDataIO, trying ESPN...`);
      fetchDatesFromESPNAPI(sport);
      return;
    }
    
    // Sort dates chronologically (YYYY-MM-DD format sorts naturally)
    datesWithGames.sort((a, b) => a.date.localeCompare(b.date));
    
    // Populate date dropdown
    let html = '<option value="">-- Select date with games --</option>';
    datesWithGames.forEach(item => {
      // Parse date string directly without timezone conversion
      const [year, month, day] = item.date.split('-');
      // Use local date to avoid UTC timezone shift
      const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const displayDate = localDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
      html += `<option value="${item.date}">${displayDate} (${item.count} games)</option>`;
    });
    
    dateSelect.innerHTML = html;
    eventSelect.innerHTML = '<option value="">-- Select date first --</option>';
    console.log(`[AlexBET] SportsDataIO: Found ${datesWithGames.length} dates with games for ${sport}`);
  });
}

function fetchDatesFromESPNAPI(sport) {
  const dateSelect = document.getElementById('gameDate');
  const eventSelect = document.getElementById('event');
  
  // ESPN sport IDs for the official API
  const espnSportMap = {
    'NBA': 'nba',
    'NCAAB': 'college-basketball',
    'NFL': 'nfl',
    'NCAAF': 'college-football',
    'MLB': 'mlb',
    'NHL': 'nhl',
    'MMA': 'mma',
    'EPL': 'soccer'
  };
  
  const espnSport = espnSportMap[sport];
  if (!espnSport) {
    dateSelect.innerHTML = '<option value=\"\">⚠️ Sport not supported</option>';
    return;
  }
  
  // Try to get games from ESPN for today and next few days
  const today = new Date();
  const datesWithGames = [];
  
  // Try to fetch for each of the next 5 days using the official ESPN API
  let datePromises = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const dateNum = dateStr.replace(/-/g, ''); // YYYYMMDD format for ESPN API
    
    const espnUrl = `https://site.api.espn.com/v2/site/en/sports/${espnSport}/schedule?dates=${dateNum}`;
    
    datePromises.push(
      fetch(espnUrl, { method: 'GET' })
        .then(res => res.json())
        .then(data => {
          const games = data.events || [];
          console.log(`[AlexBET] ESPN API check for ${sport} on ${dateStr}:`, games.length, 'games');
          if (games && games.length > 0) {
            datesWithGames.push({ date: dateStr, count: games.length });
          }
        })
        .catch(error => console.warn(`[AlexBET] ESPN date check failed for ${dateStr}:`, error))
    );
  }
  
  Promise.all(datePromises).then(() => {
    if (datesWithGames.length === 0) {
      dateSelect.innerHTML = '<option value=\"\">⚠️ No games in next 5 days</option>';
      console.warn(`[AlexBET] No games found in next 5 days for ${sport}`);
      return;
    }
    
    // Populate date dropdown
    let html = '<option value=\"\">-- Select date with games --</option>';
    datesWithGames.forEach(item => {
      // Parse UTC date string (YYYY-MM-DD) without timezone conversion
      const [year, month, day] = item.date.split('-');
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      const displayDate = utcDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
      html += `<option value=\"${item.date}\">${displayDate} (${item.count} games)</option>`;
    });
    
    dateSelect.innerHTML = html;
    eventSelect.innerHTML = '<option value=\"\">-- Select date first --</option>';
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
  dateSelect.innerHTML = '<option value=\"\">-- Loading dates with games... --</option>';
  eventSelect.innerHTML = '<option value=\"\">-- Select date first --</option>';
  
  if (!sport) {
    dateSelect.innerHTML = '<option value=\"\">Select sport first</option>';
    return;
  }
  
  console.log(`[AlexBET] === Fetching dates for ${sport} using SportsDataIO API (PRIMARY) ===`);
  // Use SportsDataIO API as PRIMARY source for real game schedules (most reliable)
  fetchDatesFromSportsDataIO(sport);
}

function populateEventsByDate() {
  const sport = document.getElementById('sport').value;
  const gameDate = document.getElementById('gameDate').value;
  const eventSelect = document.getElementById('event');
  
  console.log(`[AlexBET] === populateEventsByDate called ===`);
  console.log(`[AlexBET] Sport selected: ${sport}`);
  console.log(`[AlexBET] Game date selected: ${gameDate}`);
  
  if (!sport || !gameDate) {
    eventSelect.innerHTML = '<option value=\"\">Select sport and date first</option>';
    return;
  }
  
  eventSelect.innerHTML = '<option value=\"\">-- Loading games... --</option>';
  
  console.log(`[AlexBET] === Fetching events for ${sport} on ${gameDate} using SportsDataIO API (PRIMARY) ===`);
  // Use SportsDataIO API as PRIMARY source for real game data (most reliable)
  fetchFromSportsDataIO(sport, gameDate);
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
    <p>AlexBET Lite v2026.04.23 - Phase 6 Complete ✅</p>
    <p>Standalone bet tracking & analytics app</p>
    <p>All data stored locally in your browser</p>
  `;
}

// ===================================================
// Initialize on load
// ===================================================

console.log('[AlexBET] Script loaded successfully');
