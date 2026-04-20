# AlexBET Lite 🎯

A free, open-source sports betting tracker that helps you monitor line movements, identify value opportunities, and track your betting performance in real-time.

**Live Demo:** https://alexbet-lite.netlify.app

## Features ✨

### Real-Time Game Tracking
- Live scores and game updates for NBA, NFL, MLB, NHL, and EPL
- Automatic game detection for upcoming 5-day window
- **Intel Page** with live game feeds, injury reports, and market movers

### Betting Insights
- **Line Movement Tracking** — See how odds shift in real-time
- **Sharp Edge Detection** — Identify undervalued bets with confidence scores
- **Props Tracking** — Monitor player prop value across sportsbooks
- **Heat Maps** — Visual breakdown of where sharp money is flowing
- **News & Injury Alerts** — Beta feed of breaking sports news and roster changes

### Performance Analytics
- Bankroll management with Kelly Criterion calculations
- ROI and win-rate tracking
- CSV export for external analysis
- 100+ betting signal scanners

### Multi-Sport Support
- 🏀 NBA
- 🏈 NFL
- ⚾ MLB
- 🏒 NHL
- ⚽ EPL (English Premier League)
- 🎾 ATP Tennis

## Getting Started 🚀

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Active internet connection
- No backend server required — runs entirely in the browser

### Installation (Local Development)

1. **Clone the repository:**
```bash
git clone https://github.com/oddsifylabs/alexbet-lite.git
cd alexbet-lite
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open in browser:**
```
http://localhost:5173
```

### Live Deployment
The app is deployed on Netlify and available at: https://alexbet-lite.netlify.app

## Architecture 🏗️

### Frontend Structure
```
src/
├── app.js              # Main application controller
├── utils/
│   ├── api.js         # Odds API integration
│   ├── cache.js       # LocalStorage caching
│   ├── validation.js  # Input validation & bankroll logic
│   └── security.js    # CSRF token management
├── pages/
│   ├── dashboard.html # Main dashboard
│   ├── intel.html     # News & injury tracking
│   └── calculator.html # Bankroll & Kelly calculator
└── components/
    ├── gameSelector.js    # Sport → Date → Event cascade dropdowns
    ├── lineTracker.js     # Real-time line movement
    ├── edgeDetector.js    # Sharp opportunity detection
    └── performanceChart.js # ROI/win-rate visualization
```

### Data Flow
1. **Game Selection** — User selects Sport → Auto-populated Available Dates (next 5 days with games) → Auto-populated Events (games for that date)
2. **Real-Time Updates** — Odds API polls every 5 seconds for latest lines
3. **Local Caching** — Browser LocalStorage keeps 7-day history and user preferences
4. **Edge Detection** — Moneyline odds calculated against user bankroll for confidence score
5. **Export** — CSV generation with filtering by sport, confidence, and date range

## Configuration ⚙️

### Environment Variables (Optional)
Create a `.env` file for local development:

```env
VITE_API_BASE_URL=http://localhost:5173
VITE_ODDS_API_KEY=your_api_key_here
VITE_CACHE_TTL=300000
```

### API Integration
AlexBET Lite uses **The Odds API** for real-time sports data:
- Endpoint: `https://api.the-odds-api.com/v4`
- Sports supported: `basketball_nba`, `americanfootball_nfl`, `baseball_mlb`, `icehockey_nhl`, `soccer_epl`, `tennis_atp`
- Rate limit: Check The Odds API docs for free tier limits

## Usage 📖

### Finding Sharp Opportunities
1. Select a **Sport** from dropdown
2. Choose a **Date** (auto-populated with dates having upcoming games)
3. Select a **Game** (auto-populated with events for that date)
4. View **Edge & Confidence** scores
5. Check **Market Movers** tab for recent line shifts

### Bankroll Management
1. Navigate to **Calculator**
2. Enter starting bankroll (minimum $10)
3. Input Kelly Criterion percentage (default: 25%)
4. See recommended bet sizes for each confidence level

### Tracking Performance
1. Log wins/losses from your picks
2. View **ROI %** and **Win Rate** in dashboard
3. Export CSV for season-long analysis

## Testing 🧪

Run the test suite:

```bash
npm run test
```

**Test Coverage:**
- Unit tests for validation, caching, and calculations
- Integration tests for Odds API fallback scenarios
- UI component tests with Vitest

Current status: **19/19 tests passing** ✅

## Deployment 🌍

### Deploy to Netlify (Recommended)
1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy! App will be live at `https://your-site.netlify.app`

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to GitHub Pages
```bash
npm run build
npm run deploy
```

## API Reference 📡

### Odds API Integration
```javascript
// Example: Fetch upcoming NBA games
const games = await fetchGames('basketball_nba', targetDate);

// Response includes:
{
  id: "...",
  sport_key: "basketball_nba",
  sport_title: "NBA",
  commence_time: "2026-04-20T00:30:00Z",
  home_team: "Boston Celtics",
  away_team: "Miami Heat",
  bookmakers: [
    {
      key: "draftkings",
      markets: [
        {
          key: "h2h",  // Moneyline
          outcomes: [
            { name: "Boston Celtics", price: -110 },
            { name: "Miami Heat", price: -110 }
          ]
        }
      ]
    }
  ]
}
```

## Contributing 🤝

We welcome community contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and test thoroughly
4. **Commit with clear messages:**
   ```bash
   git commit -m "feat: add real-time notifications"
   ```
5. **Push to your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** with:
   - Clear description of changes
   - Link to relevant issues
   - Screenshots for UI changes
   - Test results

### Code Standards
- Use vanilla JavaScript (no framework dependencies)
- Follow ESLint configuration in `.eslintrc.json`
- Write tests for new features
- Update documentation

## Security 🔒

### Data Privacy
- **No server backend** — Your betting data stays in your browser
- **LocalStorage only** — No cloud storage or tracking
- **CSRF protection** — Token-based form validation
- **No API key exposure** — Keys handled server-side for Netlify deployment

### Reporting Security Issues
Please report security vulnerabilities to: `security@alexbet.io`

**Do NOT** open public issues for security bugs.

## Roadmap 🗺️

### Phase 1 (Current) ✅
- [x] Real-time line tracking
- [x] Edge detection with confidence scores
- [x] Bankroll calculator
- [x] Multi-sport support
- [x] CSV export
- [x] Intel page with news/injuries

### Phase 2 (Q3 2026)
- [ ] Browser notifications for market movers
- [ ] Multi-device sync via cloud backup (optional)
- [ ] Community picks leaderboard
- [ ] Historical odds comparison
- [ ] Mobile app (React Native)

### Phase 3 (Q4 2026)
- [ ] Advanced filtering (confidence thresholds, ROI targets)
- [ ] Sportsbook integration (DraftKings, FanDuel APIs)
- [ ] Custom edge formulas
- [ ] Team/league specific scanners

## Performance ⚡

- **First Paint:** < 2 seconds
- **Interactive:** < 3 seconds
- **API Response:** < 1 second (with caching)
- **Browser Support:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** Fully responsive on phones/tablets

## Troubleshooting 🔧

### Games Not Loading
- Check internet connection
- Verify Odds API is accessible
- Clear browser cache: `Ctrl+Shift+Delete` → Clear all data
- Check console for errors: `F12` → Console tab

### Edge Scores Look Wrong
- Minimum bankroll is $10 (not lower)
- Confidence calculation uses actual moneyline odds from API
- Kelly Criterion default is 25% (adjustable in calculator)

### Export Not Working
- Check if export is premium-only in your tier
- Verify data exists for selected date range
- Try a smaller date range first

## License 📄

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) file for details.

**Important:** AlexBET Lite is open source and free to use. The proprietary edge detection algorithm in AlexBET Sharp Bot remains closed-source and is available only via paid subscription on Telegram.

## Support 💬

- **GitHub Issues:** Report bugs and request features
- **Telegram:** Join our community at [@AlexBETBot](https://t.me/AlexBETBot)
- **Support Email:** support@oddsifylabs.com
- **General Inquiries:** general@oddsifylabs.com
- **Website:** https://officiants.com/alexbetlite

## Credits 🙏

Built with:
- [The Odds API](https://the-odds-api.com) — Real-time sports odds
- [Vite](https://vitejs.dev) — Lightning-fast build tool
- [Vitest](https://vitest.dev) — Unit testing framework
- [Netlify](https://netlify.com) — Deployment platform

## Disclaimer ⚠️

AlexBET Lite is a tracking and analysis tool for sports betting education. It is **not gambling advice**. Always:
- Bet responsibly
- Set loss limits
- Never chase losses
- Understand the odds before betting
- Check local gambling laws

The authors assume no liability for betting losses. Use at your own risk.

---

**Questions?** Open an issue on GitHub or reach out on Telegram.

**Happy betting! 🎯**
