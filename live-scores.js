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
   * Extract team name from pick (simple heuristic)
   * Examples: "Heat" -> "Miami Heat", "Lakers" -> "Los Angeles Lakers"
   */
  findGameByTeam(sport, teamName) {
    // Common team abbreviations
    const teamMap = {
      'Heat': 'Miami Heat', 'Heat': 'Miami', 'MIA': 'Miami Heat',
      'Celtics': 'Boston Celtics', 'BOS': 'Boston Celtics',
      'Lakers': 'Los Angeles Lakers', 'LAL': 'Los Angeles Lakers',
      'Warriors': 'Golden State Warriors', 'GSW': 'Golden State Warriors',
      'Bucks': 'Milwaukee Bucks', 'MIL': 'Milwaukee Bucks',
      'Chiefs': 'Kansas City Chiefs', 'KC': 'Kansas City Chiefs',
      'Cowboys': 'Dallas Cowboys', 'DAL': 'Dallas Cowboys',
      'Patriots': 'New England Patriots', 'NE': 'New England Patriots',
      'Yankees': 'New York Yankees', 'NYY': 'New York Yankees',
      'Red Sox': 'Boston Red Sox', 'BOS': 'Boston Red Sox'
    };

    const normalizedTeam = teamMap[teamName] || teamName;
    return { team: normalizedTeam, sport };
  }

  /**
   * Get live score for a bet pick
   * Returns: { gameId, status: 'pending|live|final', score: { home, away }, homeTeam, awayTeam, quarter, timeRemaining }
   */
  async getScore(pick, sport) {
    try {
      const games = await this.fetchSportGames(sport);
      
      // Find matching game
      for (const game of games) {
        const competitors = game.competitions?.[0]?.competitors || [];
        const homeTeam = competitors[0]?.team?.displayName || '';
        const awayTeam = competitors[1]?.team?.displayName || '';
        
        // Check if pick matches either team
        if (homeTeam.toLowerCase().includes(pick.toLowerCase()) || 
            awayTeam.toLowerCase().includes(pick.toLowerCase())) {
          
          const status = game.status?.type?.name || 'scheduled';
          const homeScore = competitors[0]?.score || 0;
          const awayScore = competitors[1]?.score || 0;
          
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
            quarter,
            timeRemaining,
            picked: pick,
            winner: this.determineWinner(pick, homeTeam, awayTeam, homeScore, awayScore, status)
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
    const isHome = homeTeam.toLowerCase().includes(pickedTeam.toLowerCase());
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
  getStatusBadge(status) {
    const badges = {
      'pending': '⚪',
      'live': '🔵',
      'final': status.winner === 'won' ? '✅' : '❌'
    };
    return badges[status] || '❓';
  }
}

// Export for use in HTML
const liveScores = new LiveScoreFetcher();
