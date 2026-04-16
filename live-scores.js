/**
 * AlexBET Lite - Live Score Fetcher
 * ESPN API Integration for real-time game scores
 */

class LiveScoreFetcher {
  constructor() {
    this.cache = {}; // { gameId: { score, status, lastUpdated } }
    this.cacheTimeout = 30000; // 30 seconds
    this.espnBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports';
    
    // Sport mapping: app sport -> ESPN sport/league
    this.sportMap = {
      'NBA': { sport: 'basketball', league: 'nba' },
      'NFL': { sport: 'football', league: 'nfl' },
      'MLB': { sport: 'baseball', league: 'mlb' },
      'NHL': { sport: 'hockey', league: 'nhl' },
      'ATP': { sport: 'tennis', league: 'atp' },
      'EPL': { sport: 'soccer', league: 'epl' }
    };
  }

  /**
   * Fetch all games for a sport from ESPN
   */
  async fetchSportGames(sport) {
    try {
      const espn = this.sportMap[sport];
      if (!espn) return [];

      const url = `${this.espnBaseUrl}/${espn.sport}/${espn.league}/events`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);
      
      const data = await response.json();
      return data.events || [];
    } catch (err) {
      console.error(`[LiveScore] Error fetching ${sport}:`, err.message);
      return [];
    }
  }

  /**
   * Normalize a team query so shorthand like "Heat" or "LAL" still matches.
   */
  normalizeTeamQuery(teamName) {
    const aliases = {
      'heat': ['miami heat', 'miami', 'heat', 'mia'],
      'celtics': ['boston celtics', 'boston', 'celtics', 'bos'],
      'lakers': ['los angeles lakers', 'la lakers', 'lakers', 'lal'],
      'warriors': ['golden state warriors', 'golden state', 'warriors', 'gsw'],
      'bucks': ['milwaukee bucks', 'milwaukee', 'bucks', 'mil'],
      'magic': ['orlando magic', 'orlando', 'magic', 'orl'],
      '76ers': ['philadelphia 76ers', 'philadelphia', '76ers', 'sixers', 'phi'],
      'sixers': ['philadelphia 76ers', 'philadelphia', '76ers', 'sixers', 'phi'],
      'chiefs': ['kansas city chiefs', 'kansas city', 'chiefs', 'kc'],
      'cowboys': ['dallas cowboys', 'dallas', 'cowboys', 'dal'],
      'patriots': ['new england patriots', 'new england', 'patriots', 'ne'],
      'yankees': ['new york yankees', 'new york', 'yankees', 'nyy'],
      'red sox': ['boston red sox', 'red sox'],
    };

    const rawQuery = (teamName || '').toLowerCase().trim();
    const cleanedQuery = rawQuery
      .replace(/@\s*[+-]?\d+(\.\d+)?/g, ' ')
      .replace(/[+-]\d+(\.\d+)?/g, ' ')
      .replace(/\b(ml|moneyline|spread|total|over|under)\b/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const candidates = new Set([rawQuery, cleanedQuery]);
    const tokens = cleanedQuery.split(' ').filter(Boolean);
    if (tokens.length >= 2) {
      candidates.add(tokens.slice(0, 2).join(' '));
      candidates.add(tokens.slice(-2).join(' '));
    }
    tokens.forEach(token => candidates.add(token));

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

  getHomeAwayTeams(competitors = []) {
    const home = competitors.find(team => team.homeAway === 'home') || competitors[0] || {};
    const away = competitors.find(team => team.homeAway === 'away') || competitors[1] || {};
    return {
      homeTeam: home.team?.displayName || home.displayName || '',
      awayTeam: away.team?.displayName || away.displayName || '',
      homeLogo: home.team?.logo || home.team?.logos?.[0]?.href || '',
      awayLogo: away.team?.logo || away.team?.logos?.[0]?.href || '',
      homeScore: parseInt(home.score || 0, 10),
      awayScore: parseInt(away.score || 0, 10),
    };
  }

  matchesPick(pick, homeTeam, awayTeam) {
    const aliases = this.normalizeTeamQuery(pick);
    const haystacks = [homeTeam, awayTeam].map(team => (team || '').toLowerCase());
    return aliases.some(alias => haystacks.some(team => team.includes(alias)));
  }

  /**
   * Get live score for a bet pick
   * Returns: { gameId, status: 'pending|live|final', score: { home, away }, homeTeam, awayTeam, quarter, timeRemaining }
   */
  async getScore(pick, sport, gameId = null) {
    try {
      const games = await this.fetchSportGames(sport);

      if (gameId) {
        const exactGame = games.find(game => String(game.id) === String(gameId));
        if (exactGame) {
          const competitors = exactGame.competitions?.[0]?.competitors || [];
          const { homeTeam, awayTeam, homeLogo, awayLogo, homeScore, awayScore } = this.getHomeAwayTeams(competitors);
          const status = exactGame.status?.type?.name || 'scheduled';

          let quarter = '';
          let timeRemaining = '';
          if (exactGame.status?.displayClock) {
            timeRemaining = exactGame.status.displayClock;
            if (exactGame.status?.period) {
              const periods = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4', 5: 'OT' };
              quarter = periods[exactGame.status.period] || `P${exactGame.status.period}`;
            }
          }

          return {
            gameId: exactGame.id,
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
            debugGameData: competitors.length === 0 ? exactGame : null // Add full game data for debugging
          };
        }
      }
      
      // Find matching game
      for (const game of games) {
        const competitors = game.competitions?.[0]?.competitors || [];
        const { homeTeam, awayTeam, homeLogo, awayLogo, homeScore, awayScore } = this.getHomeAwayTeams(competitors);
        
        // Check if pick matches either team, including shorthand/aliases
        if (this.matchesPick(pick, homeTeam, awayTeam)) {
          
          const status = game.status?.type?.name || 'scheduled';
          
          // Extract quarter/period info
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
            debugGameData: competitors.length === 0 ? game : null // Add full game data for debugging
          };
        }
      }

      return { status: 'not_found', score: null };
    } catch (err) {
      console.error('[LiveScore] Error getting score:', err.message);
      return { status: 'error', score: null };
    }
  }

  /**
   * Normalize ESPN status to our format
   */
  normalizeStatus(espnStatus) {
    if (espnStatus.includes('Scheduled') || espnStatus.includes('Postponed')) return 'pending';
    if (espnStatus.includes('In Progress') || espnStatus.includes('Live')) return 'live';
    if (espnStatus.includes('Final') || espnStatus.includes('Completed')) return 'final';
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
   * Returns: "Heat 45, Celtics 42 (Q2 5:32)"
   */
  formatScore(scoreData) {
    if (!scoreData || scoreData.status === 'not_found') return 'Game not found';
    if (scoreData.status === 'error') return 'Error fetching score';
    if (scoreData.status === 'pending') return 'Game pending';

    const { homeTeam, awayTeam, score, quarter, timeRemaining } = scoreData;
    let display = `${homeTeam.split(' ').pop()} ${score.home}, ${awayTeam.split(' ').pop()} ${score.away}`;
    
    if (scoreData.status === 'live' && quarter) {
      display += ` (${quarter} ${timeRemaining})`;
    } else if (scoreData.status === 'final') {
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
}

// Export for use in HTML
const liveScores = new LiveScoreFetcher();
