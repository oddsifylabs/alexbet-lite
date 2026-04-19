/**
 * SuggestionEngine - Smart bet suggestions and autocomplete
 * Provides player names, teams, and validation hints based on sport and bet type
 */

class SuggestionEngine {
  constructor() {
    // Real sports teams and major players
    this.database = {
      'NBA': {
        teams: [
          'Lakers', 'Celtics', 'Warriors', 'Heat', 'Nuggets', 'Suns', 'Bucks',
          'Mavericks', 'Nets', 'Grizzlies', 'Clippers', 'Knicks', 'Timberwolves',
          'Kings', 'Pacers', 'Hawks', '76ers', 'Raptors', 'Cavaliers', 'Spurs',
          'Rockets', 'Trail Blazers', 'Pelicans', 'Grizzlies', 'Pistons', 'Hornets',
          'Bulls', 'Wizards', 'Magic', 'Thunder', 'Jazz'
        ],
        players: [
          'LeBron James', 'Kevin Durant', 'Stephen Curry', 'Giannis Antetokounmpo',
          'Jayson Tatum', 'Luka Doncic', 'Nikola Jokic', 'Joel Embiid', 'Damian Lillard',
          'Shai Gilgeous-Alexander', 'Kawhi Leonard', 'Kyrie Irving', 'Jimmy Butler',
          'Jaylen Brown', 'Donovan Mitchell', 'Zion Williamson', 'Anthony Davis',
          'Chris Paul', 'Devin Booker', 'Jrue Holiday'
        ]
      },
      'NFL': {
        teams: [
          'Chiefs', 'Bills', 'Eagles', 'Cowboys', 'Packers', 'Seahawks', 'Ravens',
          'Lions', 'Texans', 'Broncos', 'Chargers', 'Steelers', 'Dolphins', 'Bucs',
          'Saints', 'Jaguars', 'Bengals', 'Colts', 'Titans', 'Patriots', 'Falcons',
          'Panthers', '49ers', 'Rams', 'Cardinals', 'Vikings', 'Buccaneers', 'Browns',
          'Raiders', 'Washingtonos', 'Giants'
        ],
        players: [
          'Patrick Mahomes', 'Josh Allen', 'Jalen Hurts', 'Lamar Jackson',
          'Dak Prescott', 'Aaron Rodgers', 'Travis Kelce', 'Cooper Kupp',
          'Tyreek Hill', 'Usher Jefferson', 'CeeDee Lamb', 'Micah Parsons',
          'Davante Adams', 'Mark Andrews', 'Austin Ekeler'
        ]
      },
      'MLB': {
        teams: [
          'Yankees', 'Red Sox', 'Dodgers', 'Giants', 'Cubs', 'Cardinals', 'Astros',
          'Mets', 'Phillies', 'Braves', 'White Sox', 'Orioles', 'Mariners', 'Tigers',
          'Pirates', 'Athletics', 'Reds', 'Twins', 'Rangers', 'Rockies', 'Padres',
          'Royals', 'Brewers', 'Indians', 'Blue Jays', 'Angels', 'Marlins', 'Nationals'
        ],
        players: [
          'Mike Trout', 'Mookie Betts', 'Freddie Freeman', 'Juan Soto',
          'Aaron Judge', 'Kyle Schwarber', 'Nolan Arenado', 'Brent Rooker',
          'Juan Carlos Rodon', 'Gerrit Cole', 'Justin Verlander', 'Shohei Ohtani'
        ]
      },
      'EPL': {
        teams: [
          'Arsenal', 'Manchester City', 'Liverpool', 'Manchester United', 'Chelsea',
          'Tottenham', 'Newcastle', 'Brighton', 'Aston Villa', 'West Ham', 'Fulham',
          'Brentford', 'Crystal Palace', 'Everton', 'Wolves', 'Leicester', 'Leeds',
          'Southampton', 'Nottingham Forest', 'Luton', 'Ipswich'
        ],
        players: [
          'Erling Haaland', 'Harry Kane', 'Kevin De Bruyne', 'Mo Salah',
          'Bukayo Saka', 'Son Heung-min', 'Phil Foden', 'Declan Rice',
          'Bruno Fernandes', 'Sadio Mane', 'Antoine Griezmann'
        ]
      },
      'ATP': {
        teams: [], // Tennis doesn't have teams
        players: [
          'Jannik Sinner', 'Carlos Alcaraz', 'Novak Djokovic', 'Rafael Nadal',
          'Andy Murray', 'Alexander Zverev', 'Daniil Medvedev', 'Stefanos Tsitsipas',
          'Matteo Berrettini', 'Cameron Norrie', 'Hubert Hurkacz', 'Lorenzo Musetti'
        ]
      }
    };

    // Odds ranges by bet type
    this.oddsRanges = {
      'MONEYLINE': { min: -10000, max: 10000, typical: '-110' },
      'SPREAD': { min: -130, max: -105, typical: '-110' },
      'TOTAL': { min: -130, max: -105, typical: '-110' },
      'PROP': { min: -300, max: 300, typical: '-110' }
    };
  }

  /**
   * Get suggestions for pick field
   */
  getSuggestionsForPick(input, sport, betType) {
    if (!input || input.length < 1) return [];

    const sport_Data = this.database[sport];
    if (!sport_Data) return [];

    let candidates = [];

    // For spreads, prioritize teams
    if (betType === 'SPREAD' || betType === 'MONEYLINE') {
      candidates = sport_Data.teams;
    }
    // For props and totals, mix both
    else if (betType === 'PROP' || betType === 'TOTAL') {
      candidates = [...sport_Data.teams, ...sport_Data.players];
    }

    // Fuzzy match
    const suggestions = candidates
      .filter(c => c.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 5);

    return suggestions;
  }

  /**
   * Get team suggestions for spread/moneyline
   */
  getTeamSuggestions(input, sport) {
    if (!input || input.length < 1) return [];

    const teams = this.database[sport]?.teams || [];
    return teams
      .filter(t => t.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 5);
  }

  /**
   * Get player suggestions for props
   */
  getPlayerSuggestions(input, sport) {
    if (!input || input.length < 1) return [];

    const players = this.database[sport]?.players || [];
    return players
      .filter(p => p.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 5);
  }

  /**
   * Validate odds against expected ranges
   */
  validateOdds(odds, betType) {
    const range = this.oddsRanges[betType];
    if (!range) {
      return {
        valid: true,
        message: null
      };
    }

    // Check if in reasonable range
    if (odds >= range.min && odds <= range.max) {
      return {
        valid: true,
        message: `✅ ${betType} odds look reasonable (typical: ${range.typical})`
      };
    }

    // Out of typical range but not impossible
    if (Math.abs(odds) <= 10000) {
      return {
        valid: true,
        message: `⚠️ ${betType} odds are outside typical range (${range.min} to ${range.max})`
      };
    }

    // Invalid
    return {
      valid: false,
      message: `❌ Odds exceed maximum allowed (${range.max})`
    };
  }

  /**
   * Get bet type recommendations based on pick
   */
  recommendBetType(pick, sport) {
    const sport_Data = this.database[sport];
    if (!sport_Data) return [];

    const recommendations = [];

    // Check if it's a team
    if (sport_Data.teams.some(t => t.toLowerCase() === pick.toLowerCase())) {
      recommendations.push('SPREAD', 'MONEYLINE');
      if (sport !== 'ATP') {
        recommendations.push('TOTAL');
      }
    }

    // Check if it's a player
    if (sport_Data.players.some(p => p.toLowerCase() === pick.toLowerCase())) {
      recommendations.push('PROP');
    }

    return recommendations;
  }

  /**
   * Get typical props for a sport
   */
  getTypicalProps(sport) {
    const propsBySport = {
      'NBA': [
        'Points Over/Under',
        'Rebounds Over/Under',
        'Assists Over/Under',
        '3-Pointers Made Over/Under',
        'Free Throws Made Over/Under'
      ],
      'NFL': [
        'Passing Yards Over/Under',
        'Rushing Yards Over/Under',
        'Touchdowns Over/Under',
        'Receptions Over/Under',
        'Interceptions Over/Under'
      ],
      'MLB': [
        'Hits Over/Under',
        'Home Runs Over/Under',
        'RBIs Over/Under',
        'Strikeouts Over/Under'
      ]
    };

    return propsBySport[sport] || [];
  }
}

// Initialize SuggestionEngine globally
const suggestionEngine = new SuggestionEngine();
