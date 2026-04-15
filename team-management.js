/**
 * AlexBET Lite - Team Management
 * Multi-user collaboration, shared bets, and leaderboards
 */

class TeamManager {
  constructor() {
    this.team = JSON.parse(localStorage.getItem('alexbet_team')) || {
      name: 'My Team',
      members: [],
      createdAt: new Date().toISOString(),
      settings: {
        minWinRate: 56,
        minEdge: 3,
        maxDrawdown: 15,
        shareBets: true
      }
    };

    this.members = JSON.parse(localStorage.getItem('alexbet_team_members')) || [];
    this.sharedBets = JSON.parse(localStorage.getItem('alexbet_shared_bets')) || [];
    this.leaderboard = JSON.parse(localStorage.getItem('alexbet_leaderboard')) || [];
  }

  /**
   * Add team member
   */
  addMember(name, email, role = 'member') {
    // role: owner, manager, member
    
    const member = {
      id: `member_${Date.now()}`,
      name,
      email,
      role,
      joinedAt: new Date().toISOString(),
      stats: {
        bets: 0,
        wins: 0,
        pnl: 0,
        winRate: 0
      }
    };

    this.members.push(member);
    localStorage.setItem('alexbet_team_members', JSON.stringify(this.members));

    return member;
  }

  /**
   * Share bet with team
   */
  shareBet(bet, userId, notes = '') {
    const sharedBet = {
      id: `shared_${Date.now()}`,
      ...bet,
      userId,
      sharedAt: new Date().toISOString(),
      notes,
      reactions: {
        likes: [],
        concerns: []
      },
      comments: []
    };

    this.sharedBets.push(sharedBet);
    localStorage.setItem('alexbet_shared_bets', JSON.stringify(this.sharedBets));

    return sharedBet;
  }

  /**
   * Add comment to shared bet
   */
  addComment(betId, userId, comment) {
    const sharedBet = this.sharedBets.find(b => b.id === betId);
    
    if (sharedBet) {
      sharedBet.comments.push({
        userId,
        text: comment,
        timestamp: new Date().toISOString()
      });

      localStorage.setItem('alexbet_shared_bets', JSON.stringify(this.sharedBets));
      return true;
    }

    return false;
  }

  /**
   * React to shared bet
   */
  reactToBet(betId, userId, reaction) {
    // reaction: 'like' or 'concern'
    
    const sharedBet = this.sharedBets.find(b => b.id === betId);

    if (sharedBet) {
      if (reaction === 'like') {
        if (!sharedBet.reactions.likes.includes(userId)) {
          sharedBet.reactions.likes.push(userId);
        }
      } else if (reaction === 'concern') {
        if (!sharedBet.reactions.concerns.includes(userId)) {
          sharedBet.reactions.concerns.push(userId);
        }
      }

      localStorage.setItem('alexbet_shared_bets', JSON.stringify(this.sharedBets));
      return sharedBet;
    }

    return null;
  }

  /**
   * Generate team leaderboard
   */
  generateLeaderboard(bets = []) {
    const standings = {};

    // Initialize standings for each member
    this.members.forEach(member => {
      standings[member.id] = {
        name: member.name,
        bets: 0,
        wins: 0,
        losses: 0,
        pnl: 0,
        winRate: 0,
        avgEdge: 0,
        edges: [],
        rank: 0
      };
    });

    // Add member bets (in production, would fetch from database)
    // For now, using shared bets as reference
    this.sharedBets.forEach(bet => {
      const member = standings[bet.userId];
      if (member) {
        member.bets++;
        member.pnl += bet.pnl || 0;
        member.edges.push(bet.edge || 0);

        if (bet.status === 'WON') {
          member.wins++;
        } else if (bet.status === 'LOST') {
          member.losses++;
        }
      }
    });

    // Calculate win rate and avg edge
    Object.keys(standings).forEach(memberId => {
      const member = standings[memberId];
      if (member.bets > 0) {
        member.winRate = ((member.wins / member.bets) * 100).toFixed(1);
        member.avgEdge = (member.edges.reduce((a, b) => a + b, 0) / member.bets).toFixed(2);
      }
    });

    // Sort by P&L (descending)
    const sorted = Object.values(standings)
      .sort((a, b) => b.pnl - a.pnl)
      .map((member, index) => ({
        ...member,
        rank: index + 1,
        medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  '
      }));

    localStorage.setItem('alexbet_leaderboard', JSON.stringify(sorted));
    return sorted;
  }

  /**
   * Get team insights
   */
  getTeamInsights() {
    const allBets = this.sharedBets.filter(b => b.status !== 'PENDING');
    
    if (allBets.length === 0) {
      return {
        message: 'No settled bets yet. Start sharing to see team insights!',
        memberCount: this.members.length
      };
    }

    const totalPnl = allBets.reduce((sum, b) => sum + (b.pnl || 0), 0);
    const won = allBets.filter(b => b.status === 'WON').length;
    const winRate = ((won / allBets.length) * 100).toFixed(1);

    // Most profitable member
    const memberPnl = {};
    allBets.forEach(bet => {
      memberPnl[bet.userId] = (memberPnl[bet.userId] || 0) + (bet.pnl || 0);
    });

    const topMember = Object.keys(memberPnl).reduce((a, b) => 
      memberPnl[a] > memberPnl[b] ? a : b
    );

    const topMemberName = this.members.find(m => m.id === topMember)?.name || 'Unknown';

    return {
      memberCount: this.members.length,
      totalBets: allBets.length,
      teamWinRate: winRate,
      teamPnl: totalPnl,
      topMember: { name: topMemberName, pnl: memberPnl[topMember] },
      profitability: totalPnl > 0 ? '✅ Team is profitable!' : '❌ Team is negative',
      avgBetsPerMember: (allBets.length / this.members.length).toFixed(1)
    };
  }

  /**
   * Update team settings
   */
  updateTeamSettings(settings) {
    this.team.settings = { ...this.team.settings, ...settings };
    localStorage.setItem('alexbet_team', JSON.stringify(this.team));
    return this.team.settings;
  }

  /**
   * Get team summary
   */
  getTeamSummary() {
    const leaderboard = this.generateLeaderboard();
    const insights = this.getTeamInsights();

    return {
      team: this.team,
      memberCount: this.members.length,
      leaderboard,
      insights,
      settings: this.team.settings
    };
  }
}

const teamManager = new TeamManager();
