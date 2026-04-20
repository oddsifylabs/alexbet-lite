# Contributing to AlexBET Lite 🤝

Thank you for your interest in contributing to AlexBET Lite! This document provides guidelines and instructions for contributing.

## Code of Conduct 📋

We are committed to providing a welcoming and inclusive environment for all contributors. Please:

- Be respectful and constructive
- Welcome diverse perspectives
- Focus on what is best for the community
- Show empathy and patience with others
- Adhere to our values of transparency and integrity

## Getting Started 🚀

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/alexbet-lite.git
cd alexbet-lite
git remote add upstream https://github.com/oddsifylabs/alexbet-lite.git
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix-name
```

Use clear branch names:
- `feature/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation updates
- `refactor/` — Code improvements
- `test/` — Test additions

### 3. Install Dependencies
```bash
npm install
```

### 4. Make Your Changes
Follow the guidelines below.

## Development Guidelines 💻

### Code Style
- Use **vanilla JavaScript** (ES6+)
- Follow ESLint rules in `.eslintrc.json`
- Use meaningful variable/function names
- Keep functions small and focused
- Add comments for complex logic

### File Organization
```
src/
├── app.js              # Main application logic
├── utils/              # Utility functions
│   ├── api.js         # API integration
│   ├── cache.js       # Caching logic
│   ├── validation.js  # Input validation
│   └── security.js    # Security utilities
├── pages/             # HTML pages
└── components/        # Reusable components
```

### Commit Messages
Follow the Conventional Commits format:

```
feat: add real-time notifications
fix: resolve line movement cache bug
docs: update README with new features
refactor: simplify edge calculation
test: add unit tests for bankroll calculator
```

**Format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `chore`

**Example:**
```
feat: add Intel page with injury alerts

- Fetch injury data from ESPN API
- Display real-time news feed
- Add injury severity filtering
- Cache updates every 5 minutes

Closes #45
```

### Testing Requirements

**All new features must include tests:**

```bash
npm run test
```

Test structure:
```javascript
// tests/unit/feature.test.js
import { describe, it, expect } from 'vitest'
import { yourFunction } from '../../src/utils/feature.js'

describe('Feature Name', () => {
  it('should do something', () => {
    const result = yourFunction(input)
    expect(result).toBe(expectedValue)
  })

  it('should handle edge cases', () => {
    const result = yourFunction(edgeCase)
    expect(result).toBeDefined()
  })
})
```

**Coverage targets:**
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

Check coverage:
```bash
npm run test -- --coverage
```

### Documentation
- Update README.md for new features
- Add JSDoc comments to functions:
```javascript
/**
 * Calculates betting edge for a given moneyline
 * @param {number} odds - American format odds
 * @param {number} bankroll - User's betting bankroll
 * @returns {object} Edge and confidence score
 */
function calculateEdge(odds, bankroll) {
  // implementation
}
```

## Types of Contributions 🎯

### Bug Reports
1. Search existing issues first
2. Provide detailed reproduction steps
3. Include:
   - Browser & version
   - Sport/date where issue occurred
   - Console error messages
   - Screenshots if applicable

**Example issue:**
```
Title: Line movement doesn't update for late games

Description:
Games starting after 9 PM EST are not refreshing odds.

Steps:
1. Select NBA game starting at 9:30 PM EST
2. Click "Track Line Movement"
3. Wait 10 seconds for API refresh
4. Actual: Odds stay the same
Expected: Odds update to latest

Console error: [none]
Browser: Chrome 125.0
```

### Feature Requests
Provide:
- Clear use case / problem statement
- Proposed solution
- Alternative approaches considered
- Why it benefits the community

**Example:**
```
Title: Add filtering by confidence threshold

Use Case:
I want to only see bets with 75%+ confidence scores

Proposed:
- Add slider in dashboard: "Min Confidence: 0-100%"
- Filter gem results before display
- Save preference in LocalStorage

Benefits:
- Reduces noise for conservative bettors
- Helps risk management
```

### Documentation Improvements
- Fix typos and grammar
- Improve clarity of instructions
- Add examples
- Update outdated information

## Pull Request Process 📝

### Before Submitting

1. **Update from main:**
```bash
git fetch upstream
git rebase upstream/main
```

2. **Run tests:**
```bash
npm run test
npm run lint
```

3. **Test manually:**
   - Test in Chrome, Firefox, Safari
   - Test on mobile (use DevTools)
   - Verify performance (> 60 FPS on interactions)

### Opening the PR

1. **Create descriptive PR title:**
   - ✅ `feat: add real-time line tracking for NBA`
   - ❌ `Update stuff`

2. **Fill PR template:**
```markdown
## Description
What does this PR do?

## Motivation
Why are these changes needed?

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Related Issue
Closes #123

## Testing
How was this tested?

## Screenshots
[If applicable]

## Checklist
- [ ] Tests pass locally
- [ ] New tests added
- [ ] Documentation updated
- [ ] No console warnings/errors
```

3. **Link to related issues:**
```
Closes #45
Related to #123
```

### Review Process

- Maintainers will review within 2-3 days
- Address feedback promptly
- Keep the PR focused (one feature per PR)
- Be open to suggestions and changes

## Project Structure 📁

```
alexbet-lite/
├── src/                    # Source code
│   ├── app.js             # Main app controller
│   ├── utils/
│   │   ├── api.js         # Odds API integration
│   │   ├── cache.js       # LocalStorage caching
│   │   ├── validation.js  # Input validation
│   │   └── security.js    # CSRF tokens
│   └── components/        # UI components
├── tests/                  # Test files
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── docs/                   # Documentation
├── netlify.toml           # Netlify config
├── vite.config.js         # Vite build config
├── vitest.config.js       # Test runner config
├── package.json
└── README.md
```

## Common Tasks 🛠️

### Add a New Sport
1. Add to sports list in `src/utils/api.js`:
```javascript
const SPORTS = {
  basketball_nba: { name: 'NBA', key: 'basketball_nba' },
  // Add here:
  soccer_serie_a: { name: 'Serie A', key: 'soccer_serie_a' }
}
```

2. Update UI to display in dropdowns
3. Add test case for new sport
4. Update README

### Fix a Bug
1. Create issue with reproduction steps
2. Create fix branch: `git checkout -b fix/issue-description`
3. Make minimal changes
4. Add test to prevent regression
5. Open PR with clear description

### Improve Performance
1. Profile with DevTools (Performance tab)
2. Document baseline metrics
3. Make targeted changes
4. Measure improvement
5. Update documentation

## Questions? 💬

- **GitHub Discussions:** Ask questions in public
- **GitHub Issues:** Report bugs
- **Telegram:** [@AlexBETBot](https://t.me/AlexBETBot)
- **Support:** support@oddsifylabs.com
- **Website:** https://officiants.com/alexbetlite
## Recognition 🌟

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Featured in community updates

Thank you for contributing to AlexBET Lite! 🙌
