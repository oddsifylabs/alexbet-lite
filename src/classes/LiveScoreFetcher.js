/**
 * LiveScoreFetcher - Improved ESPN API integration with rate limiting
 * Handles retry logic, caching, and exponential backoff
 */

class LiveScoreFetcher {
  constructor() {
    this.cache = {}; // { sport: { data, timestamp } }
    this.cacheTimeout = 30000; // 30 seconds
    this.espnBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports';

    // Sport mapping
    this.sportMap = {
      'NBA': { sport: 'basketball', league: 'nba' },
      'NFL': { sport: 'football', league: 'nfl' },
      'MLB': { sport: 'baseball', league: 'mlb' },
      'NHL': { sport: 'hockey', league: 'nhl' },
      'ATP': { sport: 'tennis', league: 'atp' },
      'EPL': { sport: 'soccer', league: 'epl' }
    };

    // Rate limiting
    this.requestQueue = [];
    this.isRequesting = false;
    this.rateLimitDelay = 1000; // ms between requests
    this.maxRetries = 3;
    this.retryDelays = [1000, 3000, 9000]; // Exponential backoff
    this.requestErrors = {}; // Track errors per sport
  }

  /**
   * Fetch with retry logic and exponential backoff
   */
  async _fetchWithRetry(url, maxAttempts = 3) {
    let lastError;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // 10-second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = (retryAfter ? parseInt(retryAfter) : this.retryDelays[attempt]) * 1000;

          console.warn(`[LiveScore] Rate limited, retrying after ${delay}ms`);
          await this._sleep(delay);
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (err) {
        lastError = err;

        if (attempt < maxAttempts - 1) {
          const delay = this.retryDelays[Math.min(attempt, this.retryDelays.length - 1)];
          console.warn(`[LiveScore] Attempt ${attempt + 1}/${maxAttempts} failed, retrying in ${delay}ms:`, err.message);
          await this._sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Queue and execute fetch with rate limiting
   */
  async _executeWithRateLimit(fetchFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ fetchFn, resolve, reject });
      this._processQueue();
    });
  }

  /**
   * Process queued requests
   */
  async _processQueue() {
    if (this.isRequesting || this.requestQueue.length === 0) return;

    this.isRequesting = true;
    const { fetchFn, resolve, reject } = this.requestQueue.shift();

    try {
      const result = await fetchFn();
      resolve(result);
    } catch (err) {
      reject(err);
    }

    await this._sleep(this.rateLimitDelay);
    this.isRequesting = false;

    if (this.requestQueue.length > 0) {
      this._processQueue();
    }
  }

  /**
   * Fetch all games for a sport from ESPN
   */
  async fetchSportGames(sport) {
    try {
      // Check cache first
      if (this.cache[sport] && Date.now() - this.cache[sport].timestamp < this.cacheTimeout) {
        console.log(`[LiveScore] Using cached data for ${sport}`);
        return this.cache[sport].data;
      }

      const espn = this.sportMap[sport];
      if (!espn) {
        throw new Error(`Unsupported sport: ${sport}`);
      }

      const url = `${this.espnBaseUrl}/${espn.sport}/${espn.league}/events`;

      const data = await this._executeWithRateLimit(
        () => this._fetchWithRetry(url, this.maxRetries)
      );

      const events = data.events || [];

      // Update cache
      this.cache[sport] = {
        data: events,
        timestamp: Date.now()
      };

      // Clear error state
      this.requestErrors[sport] = null;

      return events;
    } catch (err) {
      console.error(`[LiveScore] Error fetching ${sport}:`, {
        message: err.message,
        sport,
        timestamp: new Date().toISOString()
      });

      // Track error
      this.requestErrors[sport] = {
        message: err.message,
        timestamp: Date.now()
      };

      // Return cached data if available, even if stale
      if (this.cache[sport]) {
        console.warn(`[LiveScore] Returning stale cache for ${sport}`);
        return this.cache[sport].data;
      }

      return [];
    }
  }

  /**
   * Normalize team name for matching
   */
  normalizeTeamQuery(teamName) {
    const aliases = {
      // NBA
      'heat': ['miami heat', 'miami', 'heat', 'mia'],
      'celtics': ['boston celtics', 'boston', 'celtics', 'bos'],
      'lakers': ['los angeles lakers', 'la lakers', 'lakers', 'lal'],
      'warriors': ['golden state warriors', 'golden state', 'warriors', 'gsw'],
      'bucks': ['milwaukee bucks', 'milwaukee', 'bucks', 'mil'],
      'suns': ['phoenix suns', 'phoenix', 'suns', 'phx'],
      'nuggets': ['denver nuggets', 'denver', 'nuggets', 'den'],
      'kings': ['sacramento kings', 'sacramento', 'kings', 'sac'],
      'magic': ['orlando magic', 'orlando', 'magic', 'orl'],
      '76ers': ['philadelphia 76ers', 'philadelphia', '76ers', 'sixers', 'phi'],

      // NFL
      'chiefs': ['kansas city chiefs', 'kansas city', 'chiefs', 'kc'],
      'cowboys': ['dallas cowboys', 'dallas', 'cowboys', 'dal'],
      'patriots': ['new england patriots', 'new england', 'patriots', 'ne'],
      '49ers': ['san francisco 49ers', 'san francisco', '49ers', 'sf'],
      'packers': ['green bay packers', 'green bay', 'packers', 'gb'],
      'ravens': ['baltimore ravens', 'baltimore', 'ravens', 'bal'],

      // MLB
      'yankees': ['new york yankees', 'new york', 'yankees', 'nyy'],
      'red sox': ['boston red sox', 'boston', 'red sox', 'bos'],
      'dodgers': ['los angeles dodgers', 'los angeles', 'dodgers', 'lad'],
      'cubs': ['chicago cubs', 'chicago', 'cubs', 'chc'],
    };

    const rawQuery = (teamName || '').toLowerCase().trim();

    // Clean the query
    const cleanedQuery = rawQuery
      .replace(/@\s*[+-]?\d+(\.\d+)?/g, ' ')
      .replace(/[+-]\d+(\.\d+)?/g, ' ')
      .replace(/\b(ml|moneyline|spread|total|over|under|o\/u)\b/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Build candidate set
    const candidates = new Set([rawQuery, cleanedQuery]);
    const tokens = cleanedQuery.split(' ').filter(Boolean);

    if (tokens.length >= 2) {
      candidates.add(tokens.slice(0, 2).join(' '));
      candidates.add(tokens.slice(-2).join(' '));
    }

    tokens.forEach(token => candidates.add(token));

    // Expand with aliases
    const expanded = new Set();
    for (const candidate of candidates) {
      if (!candidate) continue;
      expanded.add(candidate);

      for (const values of Object.values(aliases)) {
        if (values.includes(candidate)) {
          values.forEach(value => expanded.add(value));
        }
      }
    }

    return [...expanded].filter(Boolean);
  }

  /**
   * Extract home and away teams from competitors
   */
  getHomeAwayTeams(competitors = []) {
    const home = competitors.find(team => team.homeAway === 'home') || competitors[0] || {};
    const away = competitors.find(team => team.homeAway === 'away') || competitors[1] || {};

    return {
      homeTeam: home.displayName || '',
      awayTeam: away.displayName || '',
      homeLogo: home.logo || '',
      awayLogo: away.logo || '',
      homeScore: parseInt(home.score || 0, 10),
      awayScore: parseInt(away.score || 0, 10),
    };
  }

  /**
   * Check if a pick matches a team
   */
  matchesPick(pick, homeTeam, awayTeam) {
    const aliases = this.normalizeTeamQuery(pick);
    const haystacks = [homeTeam, awayTeam].map(team => (team || '').toLowerCase());
    return aliases.some(alias => haystacks.some(team => team.includes(alias)));
  }

  /**
   * Get live score for a bet pick
   */
  async getScore(pick, sport, gameId = null) {
    try {
      const startTime = performance.now();
      const games = await this.fetchSportGames(sport);

      console.log(`[LiveScore] Fetched ${games.length} games for ${sport} in ${Math.round(performance.now() - startTime)}ms`);

      // Try exact game ID match first
      if (gameId) {
        const exactGame = games.find(game => String(game.id) === String(gameId));
        if (exactGame) {
          return this._buildScoreData(exactGame, pick);
        }
      }

      // Find matching game by team
      for (const game of games) {
        const competitors = game.competitions?.[0]?.competitors || [];
        const { homeTeam, awayTeam } = this.getHomeAwayTeams(competitors);

        if (this.matchesPick(pick, homeTeam, awayTeam)) {
          console.log(`[LiveScore] Matched pick "${pick}" to ${homeTeam} vs ${awayTeam}`);
          return this._buildScoreData(game, pick);
        }
      }

      console.warn(`[LiveScore] No game found for pick: "${pick}" (${sport})`);
      return {
        status: 'not_found',
        score: null,
        pick,
        sport,
        message: `No game found for ${pick}`
      };
    } catch (err) {
      console.error('[LiveScore ERROR]', {
        pick,
        sport,
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });

      return {
        status: 'error',
        score: null,
        error: err.message
      };
    }
  }

  /**
   * Build score data from game object
   */
  _buildScoreData(game, pick) {
    try {
      const competitors = game.competitions?.[0]?.competitors || [];
      const { homeTeam, awayTeam, homeLogo, awayLogo, homeScore, awayScore } = this.getHomeAwayTeams(competitors);
      const status = game.status?.type?.name || 'scheduled';

      let quarter = '';
      let timeRemaining = '';

      if (game.status?.displayClock) {
        timeRemaining = game.status.displayClock;
        if (game.status?.period) {
          const periods = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4', 5: 'OT' };
          quarter = periods[game.status.period] || `P${game.status.period}`;
        }
      }

      return {
        gameId: game.id,
        status: this.normalizeStatus(status),
        score: {
          home: homeScore,
          away: awayScore
        },
        homeTeam,
        awayTeam,
        homeLogo,
        awayLogo,
        quarter,
        timeRemaining,
        picked: pick,
        winner: this.determineWinner(pick, homeTeam, awayTeam, homeScore, awayScore, status),
        message: this.formatScore({
          homeTeam,
          awayTeam,
          score: { home: homeScore, away: awayScore },
          status: this.normalizeStatus(status),
          quarter,
          timeRemaining
        })
      };
    } catch (err) {
      console.error('[LiveScore] Error building score data:', err);
      return {
        status: 'error',
        error: 'Failed to process game data'
      };
    }
  }

  /**
   * Normalize ESPN status
   */
  normalizeStatus(espnStatus) {
    if (!espnStatus) return 'pending';
    if (espnStatus.includes('Scheduled') || espnStatus.includes('Postponed')) return 'pending';
    if (espnStatus.includes('In Progress') || espnStatus.includes('Live')) return 'live';
    if (espnStatus.includes('Final') || espnStatus.includes('Completed') || espnStatus === 'STATUS_FINAL') return 'final';
    return 'pending';
  }

  /**
   * Determine if picked team won
   */
  determineWinner(pickedTeam, homeTeam, awayTeam, homeScore, awayScore, status) {
    const pickedHome = this.matchesPick(pickedTeam, homeTeam, '');
    const isHome = pickedHome || !this.matchesPick(pickedTeam, awayTeam, '');
    const pickedScore = isHome ? homeScore : awayScore;
    const oppositeScore = isHome ? awayScore : homeScore;

    return pickedScore > oppositeScore ? 'won' : pickedScore < oppositeScore ? 'lost' : 'push';
  }

  /**
   * Format score display
   */
  formatScore(scoreData) {
    if (!scoreData || scoreData.status === 'not_found') return 'Game not found';
    if (scoreData.status === 'error') return 'Error fetching score';
    if (scoreData.status === 'pending') return 'Game pending';

    const { homeTeam, awayTeam, score, quarter, timeRemaining, status } = scoreData;
    let display = `${homeTeam.split(' ').pop()} ${score.home}, ${awayTeam.split(' ').pop()} ${score.away}`;

    if (status === 'live' && quarter) {
      display += ` (${quarter} ${timeRemaining})`;
    } else if (status === 'final') {
      display += ' (Final)';
    }

    return display;
  }

  /**
   * Get status badge
   */
  getStatusBadge(scoreData) {
    if (!scoreData) return '❓';
    if (scoreData.status === 'pending') return '⚪';
    if (scoreData.status === 'live') return '🔵';
    if (scoreData.status === 'final') {
      return scoreData.winner === 'won' ? '✅' : scoreData.winner === 'push' ? '➖' : '❌';
    }
    return '❓';
  }

  /**
   * Get request errors
   */
  getErrors() {
    return this.requestErrors;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {};
  }
}

// Export
const liveScores = new LiveScoreFetcher();
