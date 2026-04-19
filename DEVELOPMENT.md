# Development Guide 🛠️

Complete guide to setting up your local development environment and working with AlexBET Lite.

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher (or yarn/pnpm)
- **Git** 2.30.0 or higher
- **Modern browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

Check versions:
```bash
node --version
npm --version
git --version
```

## Setup 🚀

### 1. Clone Repository
```bash
git clone https://github.com/oddsifylabs/alexbet-lite.git
cd alexbet-lite
```

### 2. Install Dependencies
```bash
npm install
```

This installs:
- **Vite** — Build tool & dev server
- **Vitest** — Unit test runner
- **ESLint** — Code quality
- **Prettier** — Code formatting

### 3. Environment Configuration (Optional)

Create `.env.local` for development overrides:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5173
VITE_ODDS_API_KEY=your_test_key_here

# Caching
VITE_CACHE_TTL=300000

# Debug
VITE_DEBUG=true
```

Available variables:
- `VITE_API_BASE_URL` — API endpoint (default: production)
- `VITE_ODDS_API_KEY` — The Odds API key (optional in dev)
- `VITE_CACHE_TTL` — Cache duration in ms (default: 5 min)
- `VITE_DEBUG` — Enable debug logging (default: false)

**Note:** Environment variables are loaded at build time. Restart dev server to apply changes.

### 4. Start Development Server
```bash
npm run dev
```

Output:
```
VITE v4.x.x building for development...

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Open http://localhost:5173 in your browser.

## Development Workflow 📋

### Directory Structure

```
src/
├── app.js                 # Main application (50 KB)
├── utils/
│   ├── api.js            # Odds API integration
│   ├── cache.js          # LocalStorage/IndexedDB caching
│   ├── validation.js     # Input validation, bankroll logic
│   ├── security.js       # CSRF token, form protection
│   └── date-utils.js     # Date/timezone helpers
├── components/
│   ├── gameSelector.js   # Sport → Date → Event cascade dropdowns
│   ├── lineTracker.js    # Real-time line movement tracker
│   ├── edgeDetector.js   # Sharp opportunity detection
│   ├── heatMap.js        # Visual money flow heatmaps
│   ├── injuryAlerts.js   # Real-time injury tracking
│   ├── propsTracker.js   # Player prop monitoring
│   └── performanceChart.js # ROI/win-rate visualization
├── pages/
│   ├── dashboard.html    # Main dashboard (7100 lines)
│   ├── intel.html        # News & market intelligence
│   └── calculator.html   # Bankroll & Kelly calculator
└── styles/
    ├── dashboard.css     # Dashboard styles
    ├── components.css    # Component styles
    └── responsive.css    # Mobile responsive

tests/
├── unit/                 # Unit tests (Vitest)
├── integration/          # Integration tests
└── setup.js              # Test configuration

docs/                     # Documentation
netlify.toml             # Netlify deployment config
vitest.config.js         # Vitest configuration
vite.config.js           # Vite build configuration
package.json             # Dependencies and scripts
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)
npm run dev -- --host   # Expose to network

# Building
npm run build            # Production build (creates dist/)
npm run preview          # Preview production build locally

# Testing
npm run test             # Run all tests
npm run test -- --watch # Watch mode for tests
npm run test -- --ui    # Visual test UI
npm run test -- --coverage # Code coverage report

# Code Quality
npm run lint             # Check code with ESLint
npm run lint -- --fix   # Auto-fix linting issues
npm run format           # Format code with Prettier

# Utility
npm run clean           # Delete dist/ and node_modules/
npm run analyze         # Bundle size analysis
```

## Code Style & Quality 🎨

### ESLint Configuration

Rules are defined in `.eslintrc.json`. Key rules:

- No `console.log` in production code
- Require semicolons
- Single quotes for strings
- 2-space indentation
- No unused variables

Check code:
```bash
npm run lint
```

Auto-fix issues:
```bash
npm run lint -- --fix
```

### Prettier Formatting

Code formatting rules (2 spaces, single quotes, 80-char lines):

```bash
npm run format
```

### Git Hooks (Pre-commit)

Optional: Set up Husky for automatic code quality checks before commit:

```bash
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm run test"
```

## Testing 🧪

### Running Tests

```bash
npm run test
```

**Modes:**
```bash
npm run test              # Run once
npm run test -- --watch  # Watch for changes (auto-rerun on save)
npm run test -- --ui     # Visual UI in browser
npm run test -- --coverage # Code coverage report
```

### Writing Tests

Tests are in `tests/` directory. Use Vitest syntax:

```javascript
// tests/unit/feature.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { calculateEdge } from '../../src/utils/validation.js'

describe('Edge Calculation', () => {
  let userBankroll

  beforeEach(() => {
    userBankroll = 1000
  })

  it('should calculate positive edge correctly', () => {
    const odds = -110  // Standard -110 moneyline
    const result = calculateEdge(odds, userBankroll)
    
    expect(result.edge).toBeGreaterThan(0)
    expect(result.confidence).toBeDefined()
  })

  it('should handle edge cases', () => {
    const result = calculateEdge(-100, 10)
    expect(result).toBeDefined()
    expect(result.confidence).toBeLessThanOrEqual(100)
  })
})
```

### Test Structure

```
tests/
├── unit/                          # Unit tests
│   ├── api.test.js               # API integration tests
│   ├── validation.test.js        # Input validation tests
│   ├── cache.test.js             # Caching logic tests
│   ├── security.test.js          # Security/CSRF tests
│   └── components.test.js        # Component tests
├── integration/                   # Integration tests
│   ├── gameflow.test.js          # Full user workflows
│   └── api-fallback.test.js      # API failure scenarios
└── setup.js                       # Test configuration & mocks
```

### Current Test Coverage

```
✓ Core Functions (19/19 passing)
  ✓ Moneyline EV calculation
  ✓ Confidence scoring
  ✓ Bankroll validation (min $10)
  ✓ Kelly Criterion calculation
  ✓ Market type filtering
  ✓ Odds format conversion
  ✓ Cache TTL logic
  ✓ API fallback scenarios

✓ Components (8/8 passing)
  ✓ Game selector cascade dropdowns
  ✓ Line tracker real-time updates
  ✓ Edge detector scoring
  ✓ Heat map visualization
  ✓ Props tracker filtering
  ✓ Injury alerts parsing
  ✓ Performance chart rendering
  ✓ Form validation

Coverage: 87% statements, 84% branches, 89% functions, 86% lines
```

### Mocking APIs

```javascript
// tests/setup.js
import { vi } from 'vitest'

// Mock The Odds API
global.fetch = vi.fn((url) => {
  if (url.includes('the-odds-api')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockOddsResponse)
    })
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock
```

## Debugging 🐛

### Browser DevTools

**Chrome/Edge:**
1. Open DevTools: `F12` or `Ctrl+Shift+I`
2. **Sources** tab: Set breakpoints, step through code
3. **Console** tab: Check errors and logs
4. **Network** tab: Monitor API calls and caching

**Firefox:**
1. Open DevTools: `F12`
2. **Debugger** tab: Breakpoints and stepping
3. **Console** tab: Errors and logging
4. **Network** tab: Monitor requests

### Debug Logging

Enable debug mode in `.env.local`:
```env
VITE_DEBUG=true
```

Then in code:
```javascript
if (import.meta.env.VITE_DEBUG) {
  console.log('Debug:', data)
}
```

### Common Issues

**Issue:** App doesn't load
- Check browser console (F12) for errors
- Verify dev server running: `npm run dev`
- Clear cache: `Ctrl+Shift+Delete`
- Check network tab for failed API calls

**Issue:** API calls failing
- Verify internet connection
- Check The Odds API status page
- Try fallback ESPN API (auto-fallback in code)
- Check API rate limits

**Issue:** Styles not updating
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Delete `.vite` cache folder
- Restart dev server: `Ctrl+C` then `npm run dev`

## Building for Production 🚀

### Local Build

```bash
npm run build
```

Outputs to `dist/` folder:
- `dist/index.html` — Main HTML file
- `dist/app.js` — Bundled & minified JavaScript
- `dist/style.css` — Optimized CSS
- `dist/favicon.svg` — App icon

### Build Optimization

Vite automatically:
- Minifies JavaScript & CSS
- Tree-shakes unused code
- Optimizes images
- Generates source maps for debugging

Check bundle size:
```bash
npm run analyze
```

### Preview Production Build

Test production build locally:
```bash
npm run build
npm run preview
```

Then open http://localhost:5173

## Deployment 🌍

### Deploy to Netlify (Recommended)

**Via GitHub:**
1. Push code to GitHub
2. Log in to Netlify
3. Click "New site from Git"
4. Select your repo
5. Set build command: `npm run build`
6. Set publish directory: `dist`
7. Deploy!

**Via CLI:**
```bash
npm install -g netlify-cli
netlify login
netlify deploy
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to GitHub Pages

```bash
npm run build
npm run deploy  # If configured in package.json
```

## Performance Optimization ⚡

### Monitoring

Use Lighthouse in DevTools:
1. Open DevTools: `F12`
2. Go to "Lighthouse" tab
3. Click "Analyze page load"

Target metrics:
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **Time to Interactive:** < 3.5s

### Optimization Tips

1. **Lazy load components:**
```javascript
const dynamicComponent = () => import('./components/heavy.js')
```

2. **Cache API responses:**
```javascript
const cacheResponse = (key, data, ttl = 5 * 60 * 1000) => {
  localStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + ttl }))
}
```

3. **Debounce event handlers:**
```javascript
function debounce(fn, delay = 300) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}
```

4. **Use Web Workers for heavy compute:**
```javascript
const worker = new Worker('/src/workers/calculator.js')
worker.postMessage({ bankroll: 1000, odds: -110 })
```

## Version Management

Current version: **v2026.04.19** (see `VERSION.txt`)

Format: `vYYYY.MM.DD`

When releasing:
1. Update `VERSION.txt`
2. Tag in git: `git tag v2026.04.19`
3. Push: `git push origin v2026.04.19`

## Troubleshooting 🔧

### Development Issues

**Module not found error:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Port 5173 already in use:**
```bash
npm run dev -- --port 3000
```

**Hot reload not working:**
- Restart dev server: `Ctrl+C` then `npm run dev`
- Check firewall settings if on network
- Clear browser cache

**Tests failing:**
```bash
npm run test -- --reporter=verbose
```

## Additional Resources 📚

- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [The Odds API Docs](https://the-odds-api.com/liveapi)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [MDN Web Docs](https://developer.mozilla.org/)

## Getting Help 💬

- **GitHub Issues:** Report bugs and ask questions
- **GitHub Discussions:** General questions and ideas
- **Telegram:** [@AlexBETBot](https://t.me/AlexBETBot)
- **Email:** dev@alexbet.io

---

Happy coding! 🚀
