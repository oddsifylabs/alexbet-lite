/**
 * AlexBET Lite - Custom Edge Calculator
 * Allows users to define custom betting formulas and blend with bot recommendations
 */

class CustomEdgeCalculator {
  constructor() {
    this.userFormula = localStorage.getItem('alexbet_user_formula') || null;
    this.formulaWeight = parseFloat(localStorage.getItem('alexbet_formula_weight')) || 0.5;
    this.botWeight = 1 - this.formulaWeight;
  }

  /**
   * Parse user formula string
   * Example: "WinProb=65, MarketProb=48"
   */
  parseFormula(formulaString) {
    try {
      const params = {};
      const pairs = formulaString.split(',').map(p => p.trim());
      
      pairs.forEach(pair => {
        const [key, value] = pair.split('=').map(s => s.trim());
        params[key] = parseFloat(value);
      });

      return params;
    } catch (err) {
      console.error('[Formula Parser] Error:', err.message);
      return null;
    }
  }

  /**
   * Calculate edge % from user input
   * Formula: (userWinProb - marketWinProb) / marketWinProb * 100
   */
  calculateUserEdge(userWinProb, marketWinProb) {
    if (userWinProb <= 0 || marketWinProb <= 0) return 0;
    
    const edge = ((userWinProb - marketWinProb) / marketWinProb) * 100;
    return Math.max(edge, -99); // Cap at -99%
  }

  /**
   * Blend user model with bot model
   * Result: (userEdge * userWeight) + (botEdge * botWeight)
   */
  blendModels(userEdge, botEdge, userWeight = this.formulaWeight) {
    const botWeight = 1 - userWeight;
    return (userEdge * userWeight) + (botEdge * botWeight);
  }

  /**
   * Compare two models and recommend
   */
  compareModels(userEdge, botEdge, blendedEdge) {
    let recommendation = '';
    let confidence = 'Medium';

    // Both agree
    if ((userEdge > 0 && botEdge > 0) || (userEdge < 0 && botEdge < 0)) {
      recommendation = `✅ Both models agree. Edge: ${blendedEdge.toFixed(2)}%. HIGH CONFIDENCE.`;
      confidence = 'High';
    }
    // User vs Bot disagreement
    else if ((userEdge > 0 && botEdge < 0) || (userEdge < 0 && botEdge > 0)) {
      recommendation = `⚠️ Models disagree. Use blended: ${blendedEdge.toFixed(2)}%. MODERATE risk.`;
      confidence = 'Low';
    }
    // One model near zero
    else {
      recommendation = `⚡ One model neutral. Favor the stronger signal at ${Math.max(Math.abs(userEdge), Math.abs(botEdge)).toFixed(2)}%.`;
      confidence = 'Medium';
    }

    return { recommendation, confidence, blendedEdge };
  }

  /**
   * Generate detailed comparison report
   */
  generateReport(pick, userEdge, botEdge, blendedEdge) {
    const comparison = this.compareModels(userEdge, botEdge, blendedEdge);
    
    return {
      pick,
      models: {
        user: {
          edge: userEdge.toFixed(2),
          weight: (this.formulaWeight * 100).toFixed(0),
          description: 'Your custom model'
        },
        bot: {
          edge: botEdge.toFixed(2),
          weight: (this.botWeight * 100).toFixed(0),
          description: 'AlexBET Sharp algorithm'
        },
        blended: {
          edge: blendedEdge.toFixed(2),
          weight: '100%',
          description: 'Recommended edge'
        }
      },
      recommendation: comparison.recommendation,
      confidence: comparison.confidence,
      actionable: blendedEdge > 3 ? '✅ Bet it' : blendedEdge > 0 ? '⚠️ Consider' : '❌ Skip'
    };
  }

  /**
   * Save user formula
   */
  saveFormula(formulaString, weight) {
    localStorage.setItem('alexbet_user_formula', formulaString);
    localStorage.setItem('alexbet_formula_weight', weight);
    this.userFormula = formulaString;
    this.formulaWeight = weight;
    this.botWeight = 1 - weight;
  }

  /**
   * Get formula status
   */
  getStatus() {
    return {
      formulaActive: !!this.userFormula,
      formula: this.userFormula,
      userWeight: (this.formulaWeight * 100).toFixed(0),
      botWeight: (this.botWeight * 100).toFixed(0)
    };
  }
}

const customEdgeCalc = new CustomEdgeCalculator();
