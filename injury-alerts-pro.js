/**
 * AlexBET Lite - Injury Alerts Pro
 * Advanced team-wide injury monitoring with impact analysis
 */

class InjuryAlertsPro {
  constructor() {
    this.teamInjuries = {};
    this.injuryImpact = JSON.parse(localStorage.getItem('alexbet_injury_impact')) || {};
    this.notificationHistory = [];
  }

  /**
   * Track team injuries with impact scoring
   */
  trackTeamInjury(team, player, position, severity, impact) {
    // impact: 1-10 scale (10 = critical to team)
    
    if (!this.teamInjuries[team]) {
      this.teamInjuries[team] = [];
    }

    const injury = {
      player,
      position,
      severity, // Out, Probable, Questionable
      impact,
      dateReported: new Date().toISOString(),
      status: 'ACTIVE'
    };

    this.teamInjuries[team].push(injury);

    // Calculate team impact score
    this.updateTeamImpactScore(team);

    return injury;
  }

  /**
   * Calculate overall team impact from injuries
   */
  updateTeamImpactScore(team) {
    const injuries = this.teamInjuries[team] || [];
    const activeInjuries = injuries.filter(i => i.status === 'ACTIVE');

    if (activeInjuries.length === 0) {
      this.injuryImpact[team] = { score: 0, level: 'Healthy' };
      return;
    }

    // Weight impact by severity
    let totalImpact = 0;
    activeInjuries.forEach(inj => {
      const severityWeight = inj.severity === 'Out' ? 1.0 : inj.severity === 'Probable' ? 0.5 : 0.25;
      totalImpact += inj.impact * severityWeight;
    });

    const score = Math.min(totalImpact, 100);
    let level = 'Healthy';

    if (score > 60) level = 'Critical';
    else if (score > 40) level = 'Moderate';
    else if (score > 20) level = 'Minor';

    this.injuryImpact[team] = { score, level, injuriesCount: activeInjuries.length };
    localStorage.setItem('alexbet_injury_impact', JSON.stringify(this.injuryImpact));
  }

  /**
   * Get team health status
   */
  getTeamHealth(team) {
    return this.injuryImpact[team] || { score: 0, level: 'Healthy' };
  }

  /**
   * Alert if team injuries affect bet picks
   */
  checkBetImpact(team, betType, odds) {
    const health = this.getTeamHealth(team);

    if (health.score > 50) {
      return {
        alert: true,
        severity: health.level,
        message: `⚠️ ${team} has ${health.level.toLowerCase()} injuries (Impact: ${health.score}). ${betType} odds may be mispriced.`,
        recommendation: 'Consider line shopping or reducing bet size'
      };
    }

    return { alert: false };
  }

  /**
   * Compare team health for matchups
   */
  compareTeamHealth(team1, team2) {
    const health1 = this.getTeamHealth(team1);
    const health2 = this.getTeamHealth(team2);

    const advantage = health1.score < health2.score ? team1 : team2;
    const disadvantage = health1.score >= health2.score ? team1 : team2;

    return {
      team1,
      health1,
      team2,
      health2,
      advantage: {
        team: advantage,
        reason: `Healthier team (${advantage} has lower injury impact)`
      },
      note: Math.abs(health1.score - health2.score) > 30 ? '🔥 Major advantage' : '⚠️ Slight advantage'
    };
  }

  /**
   * Get injury alerts for upcoming games
   */
  getUpcomingInjuryAlerts(games) {
    // games: array of {homeTeam, awayTeam, sport, date}
    
    const alerts = [];

    games.forEach(game => {
      const homeHealth = this.getTeamHealth(game.homeTeam);
      const awayHealth = this.getTeamHealth(game.awayTeam);

      if (homeHealth.score > 30 || awayHealth.score > 30) {
        alerts.push({
          game: `${game.awayTeam} @ ${game.homeTeam}`,
          date: game.date,
          homeTeamImpact: homeHealth,
          awayTeamImpact: awayHealth,
          recommendation: homeHealth.score > awayHealth.score 
            ? `Favor ${game.awayTeam} (healthier team)`
            : `Favor ${game.homeTeam} (healthier team)`
        });
      }
    });

    return alerts;
  }

  /**
   * Generate injury report
   */
  generateInjuryReport() {
    const report = {};

    Object.keys(this.teamInjuries).forEach(team => {
      const injuries = this.teamInjuries[team];
      const activeInjuries = injuries.filter(i => i.status === 'ACTIVE');

      if (activeInjuries.length > 0) {
        report[team] = {
          health: this.getTeamHealth(team),
          injuries: activeInjuries.map(inj => ({
            player: inj.player,
            position: inj.position,
            status: inj.severity,
            impact: inj.impact
          }))
        };
      }
    });

    return report;
  }

  /**
   * Mark injury as resolved
   */
  resolveInjury(team, player) {
    if (this.teamInjuries[team]) {
      const injury = this.teamInjuries[team].find(i => i.player === player);
      if (injury) {
        injury.status = 'RESOLVED';
        this.updateTeamImpactScore(team);
        return true;
      }
    }
    return false;
  }
}

const injuryAlertsPro = new InjuryAlertsPro();
