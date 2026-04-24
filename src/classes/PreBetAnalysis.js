/**
 * PreBetAnalysis - Real-time pre-bet analysis panel
 * Calculates EV, Kelly Fraction, Required Win Rate, and Risk Assessment
 * Updates live as form fields change
 */
class PreBetAnalysis {
  constructor() {
    this.analysisPanel = document.getElementById('analysisPanelContainer');
    this.projectedCLV = document.getElementById('projectedCLV');
    this.edgeAssessment = document.getElementById('edgeAssessment');
    this.edgeMessage = document.getElementById('edgeMessage');
    this.requiredWinRate = document.getElementById('requiredWinRate');
    this.kellyFraction = document.getElementById('kellyFraction');
    this.confidenceAdjusted = document.getElementById('confidenceAdjusted');
    this.confidenceMessage = document.getElementById('confidenceMessage');
    this.riskLevel = document.getElementById('riskLevel');
    this.riskMessage = document.getElementById('riskMessage');
    this.insightsList = document.getElementById('insightsList');
    this.analysisInsights = document.getElementById('analysisInsights');
  }

  /**
   * Update analysis panel with current form values
   * Called on every form field change
   */
  update(formData) {
    const stake = parseFloat(formData.stake) || 0;
    const odds = parseInt(formData.entryOdds) || 0;
    const edge = parseFloat(formData.edge) || 0;
    const confidence = parseInt(formData.confidence) || 5;

    // Hide panel if no stake entered
    if (stake <= 0) {
      this.analysisPanel.style.display = 'none';
      return;
    }

    this.analysisPanel.style.display = 'block';

    // Calculate metrics
    const clv = this._calculateCLV(stake, edge);
    const requiredWinRate = this._calculateRequiredWinRate(odds);
    const kellyFraction = this._calculateKelly(stake, edge, odds);
    const confidenceAdjusted = this._adjustedStakeSize(stake, confidence);
    const riskAssessment = this._assessRisk(edge, confidence, stake);

    // Update CLV display
    this._updateCLVDisplay(clv);

    // Update Edge Assessment
    this._updateEdgeAssessment(edge);

    // Update Required Win Rate
    this.requiredWinRate.textContent = requiredWinRate >= 0
      ? requiredWinRate.toFixed(1) + '%'
      : '--';

    // Update Kelly Fraction (25% conservative)
    this.kellyFraction.style.color = kellyFraction > 0 ? '#00d68f' : '#888';
    this.kellyFraction.textContent = kellyFraction > 0
      ? '$' + kellyFraction.toFixed(2)
      : '$0.00';

    // Update Confidence Adjusted
    const adjustedPercentage = ((confidenceAdjusted / stake) * 100).toFixed(0);
    this.confidenceAdjusted.textContent = adjustedPercentage + '%';
    this.confidenceAdjusted.style.color = confidence >= 7 ? '#00d68f' : '#fff';
    this.confidenceMessage.textContent = confidence >= 7
      ? `High confidence: ${confidence}/10`
      : `Low confidence: ${confidence}/10`;

    // Update Risk Level
    this._updateRiskLevel(riskAssessment);

    // Update Insights
    this._generateInsights(clv, edge, requiredWinRate, confidence, odds);
  }

  /**
   * Calculate CLV: Cumulative Live Value
   * CLV = (Stake × Edge%) / 100
   */
  _calculateCLV(stake, edge) {
    if (stake <= 0 || edge === 0) return 0;
    return (stake * edge) / 100;
  }

  /**
   * Calculate required win rate to break even
   * For negative odds: win% = |odds| / (100 + |odds|)
   * For positive odds: win% = 100 / (odds + 100)
   */
  _calculateRequiredWinRate(odds) {
    if (odds === 0) return -1;
    if (odds < 0) {
      return (Math.abs(odds) / (100 + Math.abs(odds))) * 100;
    } else {
      return (100 / (odds + 100)) * 100;
    }
  }

  /**
   * Calculate Kelly Fraction (25% conservative)
   * Full Kelly: f* = (p × b - q) / b
   * 25% Kelly = f* × 0.25 (more conservative)
   * where p = win%, q = loss%, b = odds/100
   */
  _calculateKelly(stake, edge, odds) {
    if (stake <= 0 || edge <= 0 || odds === 0) return 0;

    // Estimate win probability from edge
    // More sophisticated: use break-even plus edge
    const baseWinRate = this._calculateRequiredWinRate(odds);
    if (baseWinRate < 0) return 0;

    // Edge increases win rate
    const actualWinRate = (baseWinRate / 100) + (edge / 200);
    if (actualWinRate <= 0.5) return 0; // No edge

    const p = Math.min(actualWinRate, 0.99); // Cap at 99%
    const q = 1 - p;
    const b = Math.abs(odds) / 100;

    // Full Kelly
    const fullKelly = (p * b - q) / b;
    
    // 25% conservative Kelly
    const conservativeKelly = Math.max(fullKelly * 0.25, 0);
    
    return conservativeKelly * stake;
  }

  /**
   * Calculate stake size adjusted by confidence level
   * 1-3: 25%, 4-6: 50%, 7-8: 75%, 9-10: 100%
   */
  _adjustedStakeSize(stake, confidence) {
    if (confidence <= 3) return stake * 0.25;
    if (confidence <= 6) return stake * 0.50;
    if (confidence <= 8) return stake * 0.75;
    return stake;
  }

  /**
   * Assess risk level based on edge and confidence
   */
  _assessRisk(edge, confidence, stake) {
    let riskScore = 0;

    // Edge contributes to safety
    if (edge < 1) riskScore += 3;        // Minimal edge: risky
    else if (edge < 3) riskScore += 2;   // Low edge: moderate
    else if (edge < 5) riskScore += 1;   // Medium edge: safer
    // else: high edge is safe

    // Low confidence increases risk
    if (confidence <= 3) riskScore += 3; // Very risky
    else if (confidence <= 5) riskScore += 2;
    else if (confidence <= 7) riskScore += 1;
    // else: high confidence is safe

    // Large stakes relative to edge
    if (stake > 500 && edge < 3) riskScore += 1;

    return riskScore;
  }

  /**
   * Update CLV display with color coding
   */
  _updateCLVDisplay(clv) {
    if (clv > 5) {
      this.projectedCLV.style.color = '#00d68f';
      this.projectedCLV.textContent = '+$' + clv.toFixed(2);
    } else if (clv > 0) {
      this.projectedCLV.style.color = '#4dd0ff';
      this.projectedCLV.textContent = '+$' + clv.toFixed(2);
    } else if (clv < 0) {
      this.projectedCLV.style.color = '#ff6464';
      this.projectedCLV.textContent = '-$' + Math.abs(clv).toFixed(2);
    } else {
      this.projectedCLV.style.color = '#888';
      this.projectedCLV.textContent = '+$0.00';
    }
  }

  /**
   * Update edge assessment with message
   */
  _updateEdgeAssessment(edge) {
    this.edgeAssessment.textContent = (edge > 0 ? '+' : '') + edge.toFixed(1) + '%';

    if (edge <= 0) {
      this.edgeMessage.textContent = '⚠️ No edge';
      this.edgeAssessment.style.color = '#ff6464';
    } else if (edge < 2) {
      this.edgeMessage.textContent = 'Low edge - risky';
      this.edgeAssessment.style.color = '#ffa726';
    } else if (edge < 5) {
      this.edgeMessage.textContent = 'Moderate edge - OK';
      this.edgeAssessment.style.color = '#4dd0ff';
    } else {
      this.edgeMessage.textContent = 'Strong edge - good!';
      this.edgeAssessment.style.color = '#00d68f';
    }
  }

  /**
   * Update risk level based on assessment
   */
  _updateRiskLevel(riskScore) {
    let level, color, message;

    if (riskScore <= 1) {
      level = 'LOW';
      color = '#00d68f';
      message = 'Safe bet with edge';
    } else if (riskScore === 2) {
      level = 'MEDIUM';
      color = '#4dd0ff';
      message = 'Acceptable risk';
    } else if (riskScore === 3) {
      level = 'HIGH';
      color = '#ffa726';
      message = 'Risky - consider pass';
    } else {
      level = 'VERY HIGH';
      color = '#ff6464';
      message = 'Too risky';
    }

    this.riskLevel.textContent = level;
    this.riskLevel.style.color = color;
    this.riskMessage.textContent = message;
  }

  /**
   * Generate smart insights based on analysis
   */
  _generateInsights(clv, edge, requiredWinRate, confidence, odds) {
    const insights = [];

    // CLV insights
    if (clv > 10) {
      insights.push({
        emoji: '🚀',
        text: 'Excellent CLV! Strong expected value on this bet.',
        type: 'positive'
      });
    } else if (clv > 0) {
      insights.push({
        emoji: '✅',
        text: `Good CLV: +$${clv.toFixed(2)} expected value.`,
        type: 'positive'
      });
    } else if (clv === 0) {
      insights.push({
        emoji: '⚠️',
        text: 'No edge on this bet - consider passing.',
        type: 'warning'
      });
    } else {
      insights.push({
        emoji: '❌',
        text: `Negative CLV: -$${Math.abs(clv).toFixed(2)} expected loss.`,
        type: 'negative'
      });
    }

    // Edge insights
    if (edge >= 5) {
      insights.push({
        emoji: '🎯',
        text: `Strong ${edge}% edge - high confidence in analysis.`,
        type: 'positive'
      });
    } else if (edge <= 0) {
      insights.push({
        emoji: '⚠️',
        text: 'No edge entered. Markets may already price this outcome.',
        type: 'warning'
      });
    }

    // Confidence insights
    if (confidence <= 3) {
      insights.push({
        emoji: '❓',
        text: 'Low confidence - reduce stake or pass this bet.',
        type: 'warning'
      });
    } else if (confidence >= 8) {
      insights.push({
        emoji: '💪',
        text: 'High confidence - consider maximum position size.',
        type: 'positive'
      });
    }

    // Odds insights
    if (Math.abs(odds) >= 200) {
      insights.push({
        emoji: '📊',
        text: 'Long odds - higher variance, but bigger payoff if correct.',
        type: 'info'
      });
    }

    // Display insights
    if (insights.length > 0) {
      this.analysisInsights.style.display = 'block';
      this.insightsList.innerHTML = insights.map(insight => `
        <div style="display: flex; gap: 12px; align-items: start; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 18px; min-width: 24px;">${insight.emoji}</span>
          <span style="color: var(--text-secondary); font-size: 13px; line-height: 1.4;">${insight.text}</span>
        </div>
      `).join('');
    } else {
      this.analysisInsights.style.display = 'none';
    }
  }
}

// Initialize on page load
const preBetAnalysis = new PreBetAnalysis();
