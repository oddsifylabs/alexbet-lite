/**
 * AlexBET Lite - Competitor Line Tracker
 * Tracks picks against Vegas consensus and public opinion
 */

class CompetitorTracker {
  constructor() {
    this.consensusHistory = JSON.parse(localStorage.getItem('alexbet_consensus_history')) || {};
    this.publicOpinion = JSON.parse(localStorage.getItem('alexbet_public_opinion')) || {};
  }

  /**
   * Record a pick vs Vegas consensus
   */
  recordPickVsConsensus(betId, pick, userLine, vegasConsensus) {
    if (!this.consensusHistory[betId]) {
      this.consensusHistory[betId] = {
        pick,
        entries: []
      };
    }

    const beatConsensus = Math.abs(userLine - vegasConsensus);
    
    this.consensusHistory[betId].entries.push({
      userLine,
      vegasConsensus,
      beatConsensus,
      timestamp: new Date().toISOString()
    });

    localStorage.setItem('alexbet_consensus_history', JSON.stringify(this.consensusHistory));
  }

  /**
   * Calculate beat rate % vs consensus
   */
  calculateBeatRate(bets) {
    if (bets.length === 0) return 0;

    let betsAgainstConsensus = 0;
    let beatConsensusCount = 0;

    bets.forEach(bet => {
      // Simulate consensus (in production, would fetch from Odds API)
      const estimatedConsensus = bet.closingOdds + (Math.random() * 10 - 5);
      
      if (Math.abs(bet.entryOdds - estimatedConsensus) > 0) {
        betsAgainstConsensus++;
        
        // If you beat the consensus, it's a positive sign
        if (bet.status === 'WON' && Math.abs(bet.entryOdds) > Math.abs(estimatedConsensus)) {
          beatConsensusCount++;
        }
      }
    });

    return betsAgainstConsensus > 0 
      ? Math.round((beatConsensusCount / betsAgainstConsensus) * 100)
      : 0;
  }

  /**
   * Track public opinion on picks
   */
  recordPublicOpinion(pick, publicPercentage) {
    if (!this.publicOpinion[pick]) {
      this.publicOpinion[pick] = [];
    }

    this.publicOpinion[pick].push({
      percentage: publicPercentage,
      timestamp: new Date().toISOString()
    });

    localStorage.setItem('alexbet_public_opinion', JSON.stringify(this.publicOpinion));
  }

  /**
   * Analyze if you're contrarian vs public
   */
  analyzeContrarian(bets) {
    let contrarianWins = 0;
    let totalBets = 0;

    bets.forEach(bet => {
      if (bet.status === 'WON') {
        totalBets++;
        
        // Simulate public opinion (usually 55-60% on heavy favorites)
        const estimatedPublicOpinion = 58;
        const userConfidence = Math.abs(bet.edge);
        
        // If user went against public and won, it's contrarian
        if (userConfidence > estimatedPublicOpinion) {
          contrarianWins++;
        }
      }
    });

    return totalBets > 0 
      ? Math.round((contrarianWins / totalBets) * 100)
      : 0;
  }

  /**
   * Generate consensus report
   */
  generateConsensusReport(bets) {
    const beatRate = this.calculateBeatRate(bets);
    const contrarianRate = this.analyzeContrarian(bets);
    
    let insight = '';
    
    if (beatRate > 60) {
      insight = '🎯 You consistently beat Vegas consensus. Your line selection is sharp!';
    } else if (beatRate > 50) {
      insight = '✅ You beat consensus more often than not. Keep it up!';
    } else if (beatRate > 40) {
      insight = '⚠️ You match Vegas most of the time. Look for consensus gaps.';
    } else {
      insight = '📊 You follow consensus closely. Consider contrarian plays.';
    }

    if (contrarianRate > 50) {
      insight += ' 🔥 Your contrarian picks win at high rates!';
    }

    return {
      beatRate,
      contrarianRate,
      totalBets: bets.length,
      insight,
      recommendation: beatRate > 50 
        ? 'Favor your line selections over Vegas'
        : 'Study Vegas moves more carefully'
    };
  }

  /**
   * Get competitive edge metrics
   */
  getCompetitiveEdge(bets) {
    const winRate = bets.filter(b => b.status === 'WON').length / Math.max(bets.length, 1);
    const avgClv = bets.length > 0
      ? bets.reduce((sum, b) => sum + (b.clv || 0), 0) / bets.length
      : 0;

    const beatRate = this.calculateBeatRate(bets);

    return {
      winRate: (winRate * 100).toFixed(1),
      avgClv: avgClv.toFixed(2),
      beatRate,
      edgeScore: (beatRate + (winRate * 100) / 2).toFixed(1),
      status: beatRate > 55 ? '🎯 Sharp' : beatRate > 45 ? '✅ Average' : '📊 Study more'
    };
  }
}

const competitorTracker = new CompetitorTracker();
