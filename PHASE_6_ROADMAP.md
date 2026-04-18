# Phase 6: Telegram Bot Integration & Multi-Tier Subscription Model

**Date:** April 18, 2026  
**Status:** Ready to Begin  
**Estimated Duration:** 4-6 weeks  
**Confidence:** 95%

---

## Executive Summary

Phase 6 integrates the **multi-tier subscription model** (designed in earlier session) into the **Telegram bot** (currently live at @alexbet_sharp_bot).

This requires:
1. Refactoring the bot (security, modularization, error handling)
2. Integrating tier-based feature gating
3. Setting up Supabase persistence (user data, subscriptions)
4. Connecting Whop payment processor
5. Wiring everything together

**Result:** Production-grade Telegram bot with profitable subscription model

---

## What's Already Built

### Multi-Tier Subscription Model ✅

**4 Tiers Designed:**

| Tier | Price | Gems/Day | Features |
|------|-------|----------|----------|
| **Free** | $0 | 5 | Basic scanning, email support |
| **Sharp** | $49/mo | 100 | Haiku Claude, player props |
| **Elite** | $99/mo | ∞ | Sonnet Claude, team props, API, Ask Alex |
| **Enterprise** | Custom | ∞ | Opus Claude, white-label, dedicated support |

**Revenue Model (1,000 users):**
```
Free (60%):       600 users × $0    = $0
Sharp (30%):      300 users × $49   = $14,700/month
Elite (8%):       80 users × $99    = $7,920/month
Enterprise (2%):  20 users × $500   = $10,000/month
                                      ──────────────
TOTAL:                               $32,620/month
ANNUAL:                              $391,440/year
```

### Components Already Built ✅

1. **src/models/tiers.js**
   - Tier configuration with feature matrix
   - Limits and quotas per tier
   - Rate limiting rules

2. **src/services/tier-service.js**
   - Feature gating logic
   - Quota checking
   - Limit enforcement

3. **docs/SUPABASE_SCHEMA.sql**
   - 7 database tables
   - Row-level security (RLS)
   - User, subscription, usage tracking

4. **docs/PRICING.md**
   - Marketing copy
   - Feature comparison
   - Pricing justification

5. **docs/TIER_IMPLEMENTATION.md**
   - 8-phase integration guide
   - Code examples
   - Migration steps

6. **TIER_MODEL_SUMMARY.md**
   - Quick reference
   - Implementation checklist

---

## Current Telegram Bot State

### Repository
```
GitHub: https://github.com/oddsifylabs/alexbet-sharp-bot
Status: Live at @alexbet_sharp_bot (production)
Tech: Node.js, node-telegram-bot-api, Railway deployment
```

### Working Features ✅
- ✅ `/start` — Bankroll setup
- ✅ `/scan` — Find gems (main feature)
- ✅ `/timezone` — Set timezone
- ✅ Odds API integration
- ✅ Claude AI analysis (Haiku-only)
- ✅ Telegram bot API stable

### Issues Identified ⚠️
- 🚨 **CRITICAL:** API keys hardcoded in code
- ⚠️ Zero test coverage
- ⚠️ No error handling (silent failures)
- ⚠️ No input validation
- ⚠️ In-memory storage (lost on restart)
- ⚠️ Monolithic 936-line file
- ❌ `/stats` — Placeholder only
- ❌ `/pending` — Not implemented
- ❌ `/subscribe` — No payment integration
- ❌ Whop integration incomplete

### Current Tech Stack
```
Runtime:      Node.js 18.x
Bot Library:  node-telegram-bot-api (polling)
Odds API:     the-odds-api.com
AI:           Anthropic Claude (Haiku-only)
Database:     Supabase PostgreSQL (unused)
Payments:     Whop (not integrated)
Hosting:      Railway (auto-deploy on push)
```

---

## Phase 6 Roadmap

### Week 1: Security & Stabilization (8 hours)

**Goals:**
- Move API keys to environment variables
- Add error handling & logging
- Add input validation
- Set up basic testing

**Tasks:**
1. **Security fixes**
   - Extract hardcoded API keys
   - Create `.env` file structure
   - Add environment variable validation
   - Rotate exposed keys (optional)

2. **Error handling**
   - Add try-catch blocks
   - Log errors to console
   - Graceful degradation on API failures
   - User-friendly error messages

3. **Input validation**
   - Validate bankroll amounts
   - Validate timezone input
   - Sanitize user messages
   - Rate limiting on commands

4. **Basic logging**
   - Log all API calls
   - Log errors with context
   - Track user interactions
   - Monitor bot health

**Deliverables:**
- Secure codebase (no hardcoded secrets)
- Error handling throughout
- Input validation on all endpoints
- Logging infrastructure

**Effort:** 8 hours | **Priority:** CRITICAL

---

### Week 2-3: Modularization & Data Persistence (20 hours)

**Goals:**
- Split monolithic code into services
- Integrate Supabase for data persistence
- Migrate from in-memory to database
- Set up user/subscription tracking

**Tasks:**

1. **Modular refactoring**
   ```
   services/
   ├── odds-service.js      (odds API integration)
   ├── claude-service.js    (AI analysis)
   ├── user-service.js      (user management)
   ├── subscription-service.js (billing & tiers)
   └── analytics-service.js (tracking & stats)
   ```

2. **Supabase integration**
   - Create database tables (users, subscriptions, usage)
   - Set up RLS policies
   - Initialize Supabase client
   - Migrate user data

3. **User management**
   - User creation on `/start`
   - Profile updates (bankroll, timezone)
   - User data persistence
   - Subscription tracking

4. **Usage tracking**
   - Log every scan (gems used)
   - Track daily limits
   - Monitor API costs
   - Usage analytics dashboard

**Deliverables:**
- Modular, maintainable codebase
- Supabase fully integrated
- User data persisted
- Usage tracking complete

**Effort:** 20 hours | **Priority:** HIGH

---

### Week 4: Tier Integration & Feature Gating (16 hours)

**Goals:**
- Integrate multi-tier model
- Implement feature gating
- Add quota enforcement
- Set up tier upgrade flow

**Tasks:**

1. **Tier service integration**
   - Import tier-service.js
   - Implement quota checking
   - Feature gating on all endpoints
   - Limit enforcement

2. **Feature gating**
   ```javascript
   // Check user tier before allowing feature
   if (userTier === 'free' && gemsUsed >= 5) {
     return "Upgrade to Sharp for more gems";
   }
   if (userTier !== 'elite') {
     return "Ask Alex requires Elite tier";
   }
   ```

3. **Quota enforcement**
   - Track daily gem usage
   - Reset limits at midnight (per timezone)
   - Prevent overage
   - Warn on approaching limit

4. **Tier upgrade flow**
   - `/subscribe` command implemented
   - Show tier comparison
   - Link to payment (Whop)
   - Track upgrade request

5. **Stats endpoint**
   - `/stats` shows usage
   - Gems used/remaining
   - Win rate stats
   - Upgrade suggestion

**Deliverables:**
- Feature gating functional
- Quota enforcement working
- Tier upgrade flow operational
- Stats dashboard working

**Effort:** 16 hours | **Priority:** HIGH

---

### Week 5: Payment Integration (20 hours)

**Goals:**
- Integrate Whop payment processor
- Set up subscription webhooks
- Automate tier assignment
- Handle upgrades/cancellations

**Tasks:**

1. **Whop integration**
   - Get Whop API credentials
   - Create product listings (Sharp, Elite, Enterprise)
   - Set up webhook receiver
   - Implement tier assignment on purchase

2. **Webhook handling**
   - Listen for `purchase.created`
   - Listen for `subscription.cancelled`
   - Update user tier in Supabase
   - Notify user of upgrade

3. **Subscription management**
   - Check Whop subscription status
   - Sync with local database
   - Handle refunds/cancellations
   - Track MRR/ARR

4. **User notifications**
   - Notify on successful upgrade
   - Confirm tier downgrade
   - Remind of subscription expiration
   - Suggest upgrades based on usage

**Deliverables:**
- Whop fully integrated
- Webhooks operational
- Subscription tracking working
- Billing automation complete

**Effort:** 20 hours | **Priority:** CRITICAL

---

### Week 6: Testing & Optimization (16 hours)

**Goals:**
- Add comprehensive testing
- Optimize performance
- Set up monitoring
- Deploy to production

**Tasks:**

1. **Unit tests**
   - Test tier service logic
   - Test quota calculations
   - Test API integrations
   - Aim for 80%+ coverage

2. **Integration tests**
   - Test full user flow (/start → /scan → /subscribe)
   - Test payment webhook
   - Test tier upgrades
   - Test edge cases

3. **Performance optimization**
   - Optimize Supabase queries
   - Add caching for odds data
   - Reduce API calls
   - Profile memory usage

4. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor API costs
   - Track user metrics
   - Alert on critical issues

5. **Documentation**
   - Update README
   - Add deployment guide
   - Create troubleshooting guide
   - Document APIs

**Deliverables:**
- 80%+ test coverage
- Optimized performance
- Production monitoring
- Complete documentation

**Effort:** 16 hours | **Priority:** MEDIUM

---

## Implementation Phases

### Phase 6.1: Foundation (Weeks 1-3)
- ✅ Security hardening
- ✅ Modular refactoring
- ✅ Supabase integration
- ✅ User data persistence

### Phase 6.2: Tier Integration (Weeks 4-5)
- ✅ Feature gating
- ✅ Quota enforcement
- ✅ Payment integration
- ✅ Subscription management

### Phase 6.3: Polish (Week 6)
- ✅ Comprehensive testing
- ✅ Performance optimization
- ✅ Monitoring setup
- ✅ Documentation

---

## File Structure After Phase 6

```
alexbet-sharp-bot/
├── src/
│  ├── bot.js                    # Main bot handler
│  ├── config.js                 # Config & env setup
│  ├── services/
│  │  ├── odds-service.js        # Odds API integration
│  │  ├── claude-service.js      # AI analysis
│  │  ├── user-service.js        # User management
│  │  ├── subscription-service.js # Billing
│  │  ├── tier-service.js        # Feature gating
│  │  └── analytics-service.js   # Tracking
│  ├── models/
│  │  ├── user.js
│  │  ├── subscription.js
│  │  ├── usage.js
│  │  └── tiers.js
│  ├── commands/
│  │  ├── start.js               # /start
│  │  ├── scan.js                # /scan
│  │  ├── stats.js               # /stats
│  │  ├── subscribe.js           # /subscribe
│  │  ├── pending.js             # /pending
│  │  ├── timezone.js            # /timezone
│  │  └── help.js                # /help
│  └── middleware/
│     ├── auth.js                # User validation
│     ├── rateLimit.js           # Rate limiting
│     └── errorHandler.js        # Error handling
├── tests/
│  ├── unit/
│  │  ├── tier-service.test.js
│  │  ├── user-service.test.js
│  │  └── subscription-service.test.js
│  └── integration/
│     ├── bot-flow.test.js
│     ├── payment-webhook.test.js
│     └── upgrade-flow.test.js
├── config/
│  ├── database.sql              # Schema
│  ├── supabase.js               # Client setup
│  └── whop.js                   # Payment config
├── docs/
│  ├── DEPLOYMENT.md
│  ├── API.md
│  ├── TROUBLESHOOTING.md
│  └── MONITORING.md
├── .env.example                 # Environment template
├── package.json
└── README.md
```

---

## Required API Credentials

To start Phase 6 development, you'll need:

```
TELEGRAM_BOT_TOKEN          # From @BotFather on Telegram
ODDS_API_KEY                # From the-odds-api.com
ANTHROPIC_API_KEY           # From Anthropic console
SUPABASE_URL                # From Supabase project
SUPABASE_SERVICE_ROLE_KEY   # From Supabase project
WHOP_API_KEY                # From Whop dashboard (new)
WHOP_WEBHOOK_SECRET         # From Whop dashboard (new)
```

---

## Success Metrics

### By End of Phase 6

**Code Quality:**
- ✅ Security score: A (0 critical issues)
- ✅ Test coverage: 80%+
- ✅ Code modularity: 8+ focused services
- ✅ Documentation: 100% coverage

**Feature Completeness:**
- ✅ All 7 commands functional
- ✅ Feature gating working
- ✅ Payment integration live
- ✅ User tracking accurate

**Business Metrics:**
- ✅ Conversion flow operational
- ✅ Subscription tracking working
- ✅ Usage analytics complete
- ✅ Revenue tracking accurate

**Performance:**
- ✅ Response time: < 2 seconds
- ✅ API costs tracked
- ✅ Error rate: < 1%
- ✅ Uptime: 99.9%+

---

## Next Steps

1. **Review** this Phase 6 plan
2. **Provide** API credentials when ready
3. **Confirm** you want to proceed with bot refactoring
4. **Start** Week 1 (security & stabilization)

---

## Questions?

- Want to start Phase 6 now?
- Need clarification on any part?
- Want to adjust the timeline?
- Have other priorities?

**Let me know what you'd like to do!**

---

**Phase 6 Roadmap Document**  
**Created:** April 18, 2026  
**Status:** Ready to Begin  
**Duration:** 4-6 weeks (80 hours estimated)
