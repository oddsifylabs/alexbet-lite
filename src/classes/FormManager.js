/**
 * FormManager - Enhanced form behavior with dynamic fields and validation
 * Handles form field visibility, validation feedback, and conditional logic
 */

class FormManager {
  constructor() {
    this.betForm = {
      sport: document.getElementById('sport'),
      betType: document.getElementById('betType'),
      pick: document.getElementById('pick'),
      odds: document.getElementById('odds'),
      stake: document.getElementById('stake'),
      edge: document.getElementById('edge'),
      confidence: document.getElementById('confidence'),
      notes: document.getElementById('notes'),
      // Spread-specific
      spreadLine: document.getElementById('spreadLine'),
      spreadTeam: document.getElementById('spreadTeam'),
      // Total/O-U specific
      totalLine: document.getElementById('totalLine'),
      overUnder: document.getElementById('overUnder'),
      // Prop-specific
      playerName: document.getElementById('playerName'),
      propType: document.getElementById('propType'),
      propLine: document.getElementById('propLine')
    };

    this.fieldGroups = {
      spread: document.getElementById('spreadFields'),
      total: document.getElementById('totalFields'),
      prop: document.getElementById('propFields')
    };

    this.validationDisplay = document.getElementById('formValidation');

    // Initialize event listeners
    this.initEventListeners();
  }

  /**
   * Initialize all event listeners
   */
  initEventListeners() {
    // Bet type change - show/hide conditional fields
    this.betForm.betType.addEventListener('change', (e) => {
      this.handleBetTypeChange(e.target.value);
    });

    // Real-time validation on focus/blur
    Object.values(this.betForm).forEach(field => {
      if (field) {
        field.addEventListener('blur', () => this.validateField(field));
        field.addEventListener('input', () => {
          if (this.validationDisplay.classList.contains('show')) {
            this.validateField(field);
          }
        });
      }
    });

    // Sport selection - populate team suggestions
    this.betForm.sport.addEventListener('change', () => {
      this.updateTeamSuggestions();
    });
  }

  /**
   * Handle bet type selection changes
   */
  handleBetTypeChange(betType) {
    // Hide all conditional fields
    Object.values(this.fieldGroups).forEach(group => {
      if (group) group.style.display = 'none';
    });

    // Show relevant fields based on bet type
    switch (betType) {
      case 'SPREAD':
        this.fieldGroups.spread.style.display = 'block';
        this.betForm.pick.placeholder = 'e.g., Lakers (taking the spread)';
        this.updatePickHint('Team taking the spread bet');
        break;

      case 'TOTAL':
        this.fieldGroups.total.style.display = 'block';
        this.betForm.pick.placeholder = 'e.g., Lakers vs Warriors';
        this.updatePickHint('Game or matchup for this total');
        break;

      case 'MONEYLINE':
        this.betForm.pick.placeholder = 'e.g., Lakers to win';
        this.updatePickHint('Team or player you\'re picking to win');
        break;

      case 'PROP':
        this.fieldGroups.prop.style.display = 'block';
        this.betForm.pick.placeholder = 'e.g., LeBron James';
        this.updatePickHint('Prop selection (use Player Name field for clarity)');
        break;

      default:
        this.updatePickHint('');
    }

    // Update odds hint
    this.updateOddsHint(betType);
  }

  /**
   * Update pick field hint text
   */
  updatePickHint(text) {
    const hint = document.getElementById('pickHint');
    if (hint) {
      hint.textContent = text;
    }
  }

  /**
   * Update odds field hint based on bet type
   */
  updateOddsHint(betType) {
    const hint = document.getElementById('oddsHint');
    if (!hint) return;

    switch (betType) {
      case 'MONEYLINE':
        hint.textContent = 'e.g., -110 (favorite) or +200 (underdog)';
        break;
      case 'SPREAD':
      case 'TOTAL':
        hint.textContent = 'Usually -110 or -120';
        break;
      case 'PROP':
        hint.textContent = 'Prop odds vary (e.g., -130, +110)';
        break;
      default:
        hint.textContent = '';
    }
  }

  /**
   * Update team suggestions in spread team dropdown
   */
  updateTeamSuggestions() {
    const sport = this.betForm.sport.value;
    const teams = this.getTeamsForSport(sport);

    // Clear current options (except default)
    while (this.betForm.spreadTeam.options.length > 1) {
      this.betForm.spreadTeam.remove(1);
    }

    // Add team options
    teams.forEach(team => {
      const option = document.createElement('option');
      option.value = team;
      option.textContent = team;
      this.betForm.spreadTeam.appendChild(option);
    });
  }

  /**
   * Get teams for a given sport
   */
  getTeamsForSport(sport) {
    const teamsBySport = {
      'NBA': [
        'Lakers', 'Celtics', 'Warriors', 'Heat', 'Nuggets', 'Suns', 'Bucks',
        'Mavericks', 'Nets', 'Grizzlies', 'Clippers', 'Knicks', 'Timberwolves',
        'Kings', 'Pacers', 'Hawks', '76ers', 'Raptors', 'Cavaliers', 'Spurs'
      ],
      'NFL': [
        'Chiefs', 'Bills', 'Eagles', 'Cowboys', 'Packers', 'Seahawks', 'Ravens',
        'Lions', 'Texans', 'Broncos', 'Chargers', 'Steelers', 'Dolphins', 'Bucs',
        'Saints', 'Jaguars', 'Bengals', 'Colts', 'Titans', 'Patriots'
      ],
      'MLB': [
        'Yankees', 'Red Sox', 'Dodgers', 'Giants', 'Cubs', 'Cardinals', 'Astros',
        'Mets', 'Phillies', 'Braves', 'White Sox', 'Orioles', 'Mariners', 'Tigers',
        'Pirates', 'Athletics', 'Reds', 'Twins', 'Rangers', 'Rockies'
      ],
      'EPL': [
        'Arsenal', 'Manchester City', 'Liverpool', 'Manchester United', 'Chelsea',
        'Tottenham', 'Newcastle', 'Brighton', 'Aston Villa', 'West Ham', 'Fulham',
        'Brentford', 'Crystal Palace', 'Everton', 'Wolves', 'Leicester', 'Leeds',
        'Southampton', 'Nottingham', 'Forest'
      ],
      'ATP': [
        'Djokovic', 'Alcaraz', 'Sinner', 'Zverev', 'Medvedev', 'Nadal', 'Federer',
        'Murray', 'Rublev', 'Tsitsipas', 'Ruud', 'Norrie', 'de Minaur', 'Paul'
      ]
    };

    return teamsBySport[sport] || [];
  }

  /**
   * Validate a single field
   */
  validateField(field) {
    if (!field) return true;

    const fieldId = field.id;
    let error = null;

    switch (fieldId) {
      case 'stake':
        const stake = parseFloat(field.value);
        if (isNaN(stake) || stake <= 0) {
          error = 'Stake must be greater than $0';
        } else if (stake > 1000000) {
          error = 'Stake must be less than $1,000,000';
        }
        break;

      case 'odds':
        const odds = parseFloat(field.value);
        if (isNaN(odds) || odds === 0) {
          error = 'Odds cannot be zero';
        } else if (Math.abs(odds) > 10000) {
          error = 'Odds must be between -10000 and +10000';
        }
        break;

      case 'edge':
        const edge = parseFloat(field.value);
        if (field.value && (isNaN(edge) || edge < -100 || edge > 100)) {
          error = 'Edge must be between -100 and 100';
        }
        break;

      case 'confidence':
        const confidence = parseInt(field.value);
        if (field.value && (isNaN(confidence) || confidence < 1 || confidence > 10)) {
          error = 'Confidence must be 1-10';
        }
        break;

      case 'pick':
        if (field.value.trim().length === 0) {
          error = 'Pick is required';
        } else if (field.value.length > 200) {
          error = 'Pick must be less than 200 characters';
        }
        break;

      case 'spreadLine':
        if (this.betForm.betType.value === 'SPREAD' && !field.value) {
          error = 'Spread line is required for spread bets';
        }
        break;

      case 'totalLine':
        if (this.betForm.betType.value === 'TOTAL' && !field.value) {
          error = 'Total line is required for total bets';
        }
        break;

      case 'overUnder':
        if (this.betForm.betType.value === 'TOTAL' && !field.value) {
          error = 'Please select Over or Under';
        }
        break;

      case 'sport':
        if (!field.value) {
          error = 'Sport is required';
        }
        break;

      case 'betType':
        if (!field.value) {
          error = 'Bet type is required';
        }
        break;
    }

    // Visual feedback
    if (error) {
      field.style.borderColor = 'var(--error)';
      field.style.backgroundColor = 'rgba(255, 100, 100, 0.05)';
    } else {
      field.style.borderColor = '';
      field.style.backgroundColor = '';
    }

    return !error;
  }

  /**
   * Validate entire form and show feedback
   */
  validateForm() {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!this.betForm.sport.value) errors.push('❌ Sport is required');
    if (!this.betForm.betType.value) errors.push('❌ Bet type is required');
    if (!this.betForm.pick.value.trim()) errors.push('❌ Pick is required');
    if (!this.betForm.odds.value) errors.push('❌ Odds is required');
    if (!this.betForm.stake.value) errors.push('❌ Stake is required');

    // Bet-type specific validation
    const betType = this.betForm.betType.value;
    if (betType === 'SPREAD' && !this.betForm.spreadLine.value) {
      errors.push('❌ Spread line is required');
    }
    if (betType === 'TOTAL') {
      if (!this.betForm.totalLine.value) errors.push('❌ Total line is required');
      if (!this.betForm.overUnder.value) errors.push('❌ Over/Under is required');
    }
    if (betType === 'PROP' && !this.betForm.playerName.value) {
      errors.push('❌ Player name is required for props');
    }

    // Numeric validations
    const odds = parseFloat(this.betForm.odds.value);
    if (odds === 0) errors.push('❌ Odds cannot be zero');
    if (isNaN(odds) || Math.abs(odds) > 10000) {
      errors.push('❌ Odds out of valid range');
    }

    const stake = parseFloat(this.betForm.stake.value);
    if (isNaN(stake) || stake <= 0) errors.push('❌ Stake must be > $0');
    if (stake > 1000000) errors.push('❌ Stake must be < $1,000,000');

    // Warnings (non-blocking)
    const edge = parseFloat(this.betForm.edge.value) || 0;
    if (edge > 10) warnings.push('⚠️ Edge > 10% is very high, double-check');

    const confidence = parseInt(this.betForm.confidence.value) || 5;
    if (confidence < 3) warnings.push('⚠️ Very low confidence bet - reconsider?');

    // Display feedback
    this.displayValidationFeedback(errors, warnings);

    return errors.length === 0;
  }

  /**
   * Display validation feedback with errors and warnings
   */
  displayValidationFeedback(errors, warnings) {
    if (!this.validationDisplay) return;

    // Clear previous feedback
    this.validationDisplay.innerHTML = '';
    this.validationDisplay.classList.remove('show', 'success', 'warning');

    if (errors.length === 0 && warnings.length === 0) {
      this.validationDisplay.classList.remove('show');
      return;
    }

    let html = '';

    if (errors.length > 0) {
      html += '<div><strong>Errors:</strong><ul>';
      errors.forEach(err => {
        html += `<li>${err}</li>`;
      });
      html += '</ul></div>';
    }

    if (warnings.length > 0) {
      html += '<div><strong>Warnings:</strong><ul>';
      warnings.forEach(warn => {
        html += `<li>${warn}</li>`;
      });
      html += '</ul></div>';
    }

    this.validationDisplay.innerHTML = html;
    this.validationDisplay.classList.add('show');

    if (errors.length > 0) {
      this.validationDisplay.classList.remove('warning');
    } else {
      this.validationDisplay.classList.add('warning');
    }
  }

  /**
   * Get current form data as object
   */
  getFormData() {
    const betType = this.betForm.betType.value;

    const data = {
      sport: this.betForm.sport.value,
      betType: betType,
      pick: this.betForm.pick.value.trim(),
      entryOdds: parseInt(this.betForm.odds.value) || 0,
      stake: parseFloat(this.betForm.stake.value) || 0,
      edge: parseFloat(this.betForm.edge.value) || 0,
      confidence: parseInt(this.betForm.confidence.value) || 5,
      notes: this.betForm.notes.value.trim()
    };

    // Add type-specific fields
    if (betType === 'SPREAD') {
      data.spreadLine = parseFloat(this.betForm.spreadLine.value) || null;
      data.spreadTeam = this.betForm.spreadTeam.value || null;
    }

    if (betType === 'TOTAL') {
      data.totalLine = parseFloat(this.betForm.totalLine.value) || null;
      data.overUnder = this.betForm.overUnder.value || null;
    }

    if (betType === 'PROP') {
      data.playerName = this.betForm.playerName.value.trim() || null;
      data.propType = this.betForm.propType.value.trim() || null;
      data.propLine = parseFloat(this.betForm.propLine.value) || null;
    }

    return data;
  }

  /**
   * Reset form to defaults
   */
  resetForm() {
    // Clear all form fields
    Object.values(this.betForm).forEach(field => {
      if (field) {
        if (field.tagName === 'TEXTAREA') {
          field.value = '';
        } else if (field.tagName === 'SELECT') {
          field.selectedIndex = 0;
        } else if (field.type !== 'number') {
          field.value = '';
        } else {
          field.value = '';
        }
        field.style.borderColor = '';
        field.style.backgroundColor = '';
      }
    });

    // Hide conditional fields
    Object.values(this.fieldGroups).forEach(group => {
      if (group) group.style.display = 'none';
    });

    // Clear validation feedback
    this.validationDisplay.classList.remove('show');
    this.validationDisplay.innerHTML = '';

    // Reset hints
    this.updatePickHint('');
    this.updateOddsHint('');
  }
}

// Initialize FormManager when DOM is ready
let formManager;
document.addEventListener('DOMContentLoaded', () => {
  formManager = new FormManager();
});
