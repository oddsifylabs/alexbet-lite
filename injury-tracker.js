/**
 * AlexBET Lite - Injury Report Tracker
 * ESPN API Integration for player injury updates
 */

class InjuryTracker {
  constructor() {
    this.cache = {};
    this.cacheTimeout = 60000; // 1 minute
    this.espnBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports';
    
    // Sport mapping
    this.sportMap = {
      'NBA': { sport: 'basketball', league: 'nba' },
      'NFL': { sport: 'football', league: 'nfl' },
      'MLB': { sport: 'baseball', league: 'mlb' },
      'NHL': { sport: 'hockey', league: 'nhl' }
    };
  }

  /**
   * Check if a player has an injury status
   */
  async checkPlayerInjury(playerName, sport) {
    try {
      const espn = this.sportMap[sport];
      if (!espn) return null;

      const url = `${this.espnBaseUrl}/${espn.sport}/${espn.league}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);
      
      const data = await response.json();
      const events = data.events || [];
      
      for (const event of events) {
        const competitors = event.competitions?.[0]?.competitors || [];
        
        for (const competitor of competitors) {
          const roster = competitor.roster || [];
          
          for (const player of roster) {
            if (player.displayName?.toLowerCase().includes(playerName.toLowerCase())) {
              const injuryStatus = player.injuryStatus || null;
              
              if (injuryStatus) {
                return {
                  player: player.displayName,
                  status: injuryStatus.status, // 'Out', 'Probable', 'Questionable'
                  type: injuryStatus.type || 'Injury',
                  detail: injuryStatus.description || 'Check official source'
                };
              }
            }
          }
        }
      }
      
      return null; // No injury found
    } catch (err) {
      console.error('[InjuryTracker] Error checking injury:', err.message);
      return null;
    }
  }

  /**
   * Get severity badge
   */
  getSeverityBadge(status) {
    const badges = {
      'Out': { emoji: '🔴', color: '#ff6464', text: 'OUT' },
      'Probable': { emoji: '🟡', color: '#ffd700', text: 'PROBABLE' },
      'Questionable': { emoji: '🟠', color: '#ffb366', text: 'QUESTIONABLE' }
    };
    return badges[status] || { emoji: '⚪', color: '#aaa', text: 'UNKNOWN' };
  }

  /**
   * Format injury alert
   */
  formatAlert(injuryData) {
    if (!injuryData) return null;
    
    const badge = this.getSeverityBadge(injuryData.status);
    return {
      player: injuryData.player,
      status: injuryData.status,
      emoji: badge.emoji,
      color: badge.color,
      text: badge.text,
      message: `${badge.emoji} ${injuryData.player} is ${badge.text}. Reconsider this bet.`
    };
  }
}

const injuryTracker = new InjuryTracker();
