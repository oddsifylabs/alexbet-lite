# Quick Reference Guide - AlexBET Lite Architecture

## 🎯 Getting Started

### Installation
```bash
# Clone repo
git clone <repo>
cd alexbet-lite

# Run locally
cd src
python -m http.server 8000
# Visit http://localhost:8000
```

### Project Structure
```
src/
├── index.html              # Main application
├── app.js                  # UI orchestration (635 lines)
├── classes/
│   ├── BetValidator.js     # Input validation
│   ├── BetTracker.js       # Bet management
│   ├── LiveScoreFetcher.js # ESPN API
│   ├── Analytics.js        # Statistics
│   ├── PropsTracker.js     # Player props
│   ├── SecurityManager.js  # Security
│   ├── SecurityAudit.js    # Audit logging
│   ├── ErrorHandler.js     # Error handling
│   └── HealthCheck.js      # Health monitoring
└── styles/
    └── main.css            # Styles (682 lines)
```

## 📚 Module Reference

### BetValidator
```javascript
// Validate bet
const validation = BetValidator.validateBet({
  pick: 'Heat -5',
  sport: 'NBA',
  betType: 'SPREAD',
  entryOdds: -110,
  stake: 100
});

// Sanitize input
const safe = BetValidator.sanitizeInput(userInput);

// Check XSS patterns
const patterns = securityManager.detectXSSPatterns(input);
```

### BetTracker
```javascript
// Add bet
const result = betTracker.addBet({
  pick, sport, betType, entryOdds, stake, edge, confidence
});

// Get filtered bets
const pending = betTracker.getBets({ status: 'PENDING' });

// Update status
betTracker.updateBetStatus(betId, 'WON');

// Export/import
betTracker.exportAsJSON();
await betTracker.importFromJSON(file);
```

### Analytics
```javascript
// Get stats
const stats = analytics.getOverallStats();
// { wins, losses, winRate, roi, totalPnL, ... }

// Get report
const report = analytics.generateReport();
// { streaks, outliers, edgeAnalysis, ... }

// By sport
const nba = analytics.getStatsByBySport()['NBA'];
```

### PropsTracker
```javascript
// Log prop
const result = propsTracker.logPropBet(
  player, sport, propType, line, odds, edge, stake
);

// Get player stats
const stats = propsTracker.getPlayerStats('LeBron', 'NBA');
// { wins, losses, winRate, pnl, roi, ... }

// Hot players
const hot = propsTracker.getHotPlayers('NBA', 5);
```

### SecurityManager
```javascript
// Sanitize
const safe = securityManager.sanitizeInput(input);
const safeURL = securityManager.sanitizeURL(url);
const safeJSON = securityManager.sanitizeJSON(obj);

// CSRF
const token = securityManager.generateCSRFToken();
const valid = securityManager.verifyCSRFToken(token);

// Detect patterns
const patterns = securityManager.detectXSSPatterns(input);
```

### ErrorHandler
```javascript
// Retry with backoff
const result = await errorHandler.retry(
  () => riskyOperation(),
  { maxAttempts: 3, initialDelay: 100 }
);

// Try-fallback
const result = await errorHandler.tryWithFallback(
  () => fetchLive(),
  () => getCached()
);

// Get errors
const errors = errorHandler.getErrors({ type: 'api_error' });
```

### HealthCheck
```javascript
// Run all checks
const report = await healthCheck.runAll();

// Start monitoring
healthCheck.startPeriodicChecks(60000);

// Get latest
const latest = healthCheck.getLatestReport();

// Custom check
healthCheck.register('myCheck', async () => ({
  status: 'healthy',
  message: 'All good'
}));
```

## 🔍 Common Tasks

### Add a New Bet
```javascript
const result = app.betTracker.addBet({
  pick: 'Lakers +3',
  sport: 'NBA',
  betType: 'SPREAD',
  entryOdds: -110,
  stake: 100,
  edge: 2.5,
  confidence: 7
});

if (result.success) {
  console.log('Bet added:', result.bet);
  app.updateDisplays();
}
```

### Track a Prop Bet
```javascript
const result = app.propsTracker.logPropBet(
  'LeBron James',    // player
  'NBA',             // sport
  'Points Over',     // prop type
  30.5,              // line
  -110,              // odds
  0,                 // edge
  50                 // stake
);
```

### Monitor Health
```javascript
// One-time check
const report = await healthCheck.runAll();
console.log(report.overall.status); // 'healthy'|'degraded'|'unhealthy'

// Continuous monitoring
healthCheck.startPeriodicChecks(60000);

// When issues detected
healthCheck.onHealthIssue((report) => {
  if (report.summary.critical > 0) {
    showAlert('System issues detected');
  }
});
```

### Handle Errors
```javascript
// Automatic retry
const result = await errorHandler.retry(
  async () => {
    return await liveScores.getScore('Heat', 'NBA');
  },
  {
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 5000,
    backoffMultiplier: 2
  }
);

if (result.success) {
  useData(result.data);
} else {
  console.error('Failed after retries:', result.error);
}
```

## 📊 Data Structures

### Bet Object
```javascript
{
  id: 'bet_123',
  pick: 'Heat -5',
  sport: 'NBA',
  betType: 'SPREAD',
  entryOdds: -110,
  stake: 100,
  edge: 2.5,
  confidence: 7,
  entryTime: '2026-04-18T...',
  status: 'PENDING', // or WON, LOST, PUSH
  pnl: 0
}
```

### Prop Bet Object
```javascript
{
  id: 'prop_123',
  player: 'LeBron James',
  sport: 'NBA',
  propType: 'Points Over',
  line: 30.5,
  odds: -110,
  stake: 50,
  status: 'PENDING',
  clv: 0,           // Closing Line Value
  pnl: 0
}
```

### Error Object
```javascript
{
  id: 'err_123',
  timestamp: '2026-04-18T...',
  type: 'api_error',
  message: 'Failed to fetch',
  stack: '...',
  context: {
    url: '...',
    userAgent: '...'
  }
}
```

## 🚀 API Endpoints

### Local Development
```
http://localhost:8000/src/index.html
```

### ESPN APIs (Used)
```
GET https://espn-api.herokuapp.com (fallback)
GET https://api.espn.com/* (primary)
```

## 📋 Keyboard Shortcuts (Future)

*(Not yet implemented)*
- `Ctrl+S` - Save/export
- `Ctrl+Z` - Undo last bet
- `Ctrl+Shift+D` - Dashboard
- `/` - Focus search

## 🔐 Security Checklist

- [x] XSS prevention (3 layers)
- [x] CSRF tokens
- [x] Input validation
- [x] Output encoding
- [x] CSP headers
- [x] Storage quota checks
- [x] Error logging (no sensitive data)
- [x] Rate limiting

## 📊 Testing Checklist

- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] E2E tests (Cypress)
- [ ] Performance tests
- [ ] Security tests
- [ ] Accessibility tests
- [ ] Browser compatibility

## 🆘 Troubleshooting

### "Storage Quota Exceeded"
```javascript
// Clear old data
betTracker.clearOldBets(30); // 30+ days old

// Check usage
const stats = betTracker.getStorageStats();
console.log(`${stats.percentUsed}% used`);
```

### "API Error - Rate Limited"
```javascript
// Already handled with retry + backoff
// Wait 60s and try again, or
// Switch to cached data automatically
```

### "Memory Usage High"
```javascript
// Check health
const report = await healthCheck.runCheck('memory');

// Solution: Refresh page to clear memory
location.reload();
```

### "App Not Loading"
```javascript
// Check console errors
console.log(errorHandler.getSummary());

// Check browser console (F12)
// Check network tab for failed requests
```

## 📞 Support Commands

```javascript
// View all data
console.log('All bets:', betTracker.bets);
console.log('All errors:', errorHandler.errors);
console.log('Health report:', healthCheck.generateReport());

// Security audit
console.log('Security score:', securityAudit.getSecurityScore());
console.log('Security posture:', securityManager.auditSecurityPosture());

// Export everything
console.log(betTracker.exportAsJSON());
console.log(errorHandler.exportErrors());
console.log(healthCheck.exportReport());
```

## 🎓 Learning Resources

1. **SECURITY.md** - Security deep dive
2. **RELIABILITY.md** - Error handling & recovery
3. **REFACTORING_COMPLETE.md** - Architecture overview
4. **Code comments** - Inline documentation
5. **Class JSDoc** - Method documentation

## 🔄 Development Workflow

```bash
# 1. Make changes
vim src/classes/BetTracker.js

# 2. Test locally
# Reload browser: http://localhost:8000/src/index.html

# 3. Check console
# F12 → Console tab

# 4. Commit when ready
git add -A
git commit -m "Feature: description"

# 5. Push to deploy
git push origin main
```

## 📈 Performance Tips

1. **Cache data** - Use localStorage for frequent reads
2. **Batch updates** - Group multiple operations
3. **Lazy load** - Load data only when needed
4. **Debounce** - Prevent excessive API calls
5. **Monitor health** - Use HealthCheck to proactively detect issues

---

**Last Updated:** April 18, 2026  
**Version:** v2026.04.18  
**Status:** Production Ready
