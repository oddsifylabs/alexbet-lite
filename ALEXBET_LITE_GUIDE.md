# AlexBET Lite — Complete User Guide

## What is AlexBET Lite?

AlexBET Lite is a professional sports betting tracker with **Closing Line Value (CLV)** analysis. It helps you:

1. ✅ Log every bet you place
2. ✅ Track entry odds vs closing odds
3. ✅ Calculate CLV (Closing Line Value)
4. ✅ Monitor win rate & P&L
5. ✅ Validate your edge before scaling

**Goal:** Achieve 56-65% win rate with positive CLV, proving your algorithm works before launching publicly.

---

## Step-by-Step Instructions

### Step 1: Access AlexBET Lite

**URL:** https://alexbetlite.netlify.app

**Browser:** Works in any modern browser (Chrome, Safari, Firefox, Edge)

**No login required** — All data stored locally on your device

---

### Step 2: Understanding the Main Tabs

AlexBET Lite has 4 tabs:

#### 📊 **Bet Tracker** (Default)
Where you log new bets and see your betting history

#### 📈 **Analytics**
Real-time stats: Win rate, P&L, CLV, ROI, edge tracking

#### ✅ **Validation**
Progress toward launch (56-65% win rate target)

#### ℹ️ **About**
Product info, related links, gambling disclaimer

---

### Step 3: Logging a New Bet

#### Before You Bet:

1. **Get a gem from the bot** (`/scan` in Telegram @AlexBetSharp_Bot)
   - Write down the odds you're betting at

2. **Decide your bet size**
   - Rule: Never exceed 1% of bankroll per bet
   - Example: $1,000 bankroll = max $10 bet

#### In AlexBET Lite (Bet Tracker Tab):

**Fill out the form:**

1. **Pick** — Team/player name
   - Example: `Miami Heat`

2. **Entry Odds** — Odds you're betting at RIGHT NOW
   - Example: `-110` (for spreads/moneylines)
   - Or: `150` (for positive odds)

3. **Edge %** — Your estimated edge on this bet
   - Example: `6.5` (meaning 6.5% advantage)
   - This comes from your analysis

4. **Stake ($)** — How much money you're risking
   - Example: `50` (meaning $50)

5. **Bet Type** — Type of bet
   - ✅ Moneyline (ML) — Pick winner
   - ✅ Spread — Pick winner + points
   - ✅ Total (Over/Under) — Pick score range
   - ✅ Player Prop — Individual player stat
   - ✅ Team Prop — Team-specific stat

6. **Sport** — Which sport
   - NBA, NFL, MLB, NHL, Tennis, Soccer

**Click "➕ Add Bet"**

✅ Bet is now logged!

---

### Step 4: Game Settles — Update Closing Odds

**When the game finishes:**

1. Find the bet in the table (sorted by date)
2. Click the **"Set: [odds]"** button in the **Closing Odds** column
3. Enter the final closing line odds
   - Example: `-115` (the odds when the game started)
4. **CLV% auto-calculates** ✨

**What is CLV?**
- Positive CLV (green) = you got better odds than closing ✅
- Negative CLV (red) = you got worse odds than closing ❌
- Example: You bet at -110, closes at -115 = +1.11% CLV

---

### Step 5: Mark the Result

**Change Status** from PENDING to:

| Status | Meaning |
|--------|---------|
| **WON** | Your pick hit (green) |
| **LOST** | Your pick didn't hit (red) |
| **PUSH** | Game tied or void (neutral) |

✅ **P&L calculates automatically**
- Won: Shows profit based on your odds
- Lost: Shows loss amount
- Push: Shows $0

---

### Step 6: Check Analytics

**Go to 📈 Analytics tab**

### Key Metrics:

| Metric | What It Means |
|--------|---------------|
| **Win Rate** | Percentage of settled bets won (target: 56-65%) |
| **Avg CLV** | Average closing line value across bets (target: 0% to +2%) |
| **P&L** | Total profit/loss |
| **ROI %** | Return on investment (profit ÷ total wagered) |
| **Avg Edge** | Average edge % across all bets |
| **Avg Stake** | Average bet size |

### What These Mean Together:

```
GOOD PERFORMANCE:
✅ Win Rate: 56% (above breakeven at -110)
✅ Avg CLV: +1.5% (beating the market)
✅ P&L: +$120 (profitable)
✅ ROI: +2.1% (sustainable)

NEEDS WORK:
❌ Win Rate: 48% (below breakeven)
❌ Avg CLV: -0.8% (losing to market)
❌ P&L: -$200 (losing money)
❌ ROI: -1.8% (not sustainable)
```

---

### Step 7: Track Progress to Launch

**Go to ✅ Validation tab**

### Checklist:

- ✅ Gem algorithm working (already done)
- ✅ Bot placing bets (already done)
- ✅ Tracker logging results (you're doing this)
- ⏳ Win rate > 56% (check after 30+ bets)
- ⏳ 30+ bets (sample size for confidence)
- ⏳ Avg CLV > 0% (beating the market)

**You're ready to launch when:**
- 30+ bets logged
- Win rate ≥ 56%
- Avg CLV > 0%

---

### Step 8: Export Your Data

**After collecting bets:**

1. Go to **Bet Tracker** tab
2. Click **"📥 Export JSON"**
3. A `.json` file downloads with all your bet history

**Use for:**
- Backup/records
- Share with team
- Import to analytics tools
- Proof of performance

---

## Understanding CLV (Critical!)

### What is Closing Line Value?

CLV measures if you got better odds than the final market price.

### Example:

```
SCENARIO: Celtics vs Warriors
- You bet: Celtics at -110
- Game starts (closing line): Celtics at -115

CLV CALCULATION:
Entry odds: -110 = 52.38% implied probability
Closing: -115 = 53.49% implied probability
CLV = 53.49% - 52.38% = +1.11%

YOU GOT +1.11% CLV ✅ (good!)
```

### Why CLV Matters:

> "Professional bettors care more about CLV than win rate.
> A 51% bettor with +1.5% CLV beats a 55% bettor with -0.5% CLV."

**How to get positive CLV:**
1. ✅ Bet early (right after lines open)
2. ✅ Line shop (compare multiple sportsbooks)
3. ✅ React to news before market adjusts
4. ✅ Identify sharp money movements

---

## Common Questions

### Q: Why does my CLV show 0%?

**A:** You haven't entered the closing odds yet.
- Click "Set: [odds]" in the Closing Odds column
- Enter the final line when the game starts

### Q: What if I can't find the closing odds?

**A:** Use the opening line of the game on the sportsbook:
- Go to the sportsbook at game start time
- Screenshot the odds
- Enter them in ALexBET Lite

### Q: Should I track every bet?

**A:** YES. Only track bets you actually placed.
- Don't log theoretical bets
- Only real money wagered
- This proves your actual edge

### Q: How long until I can launch?

**A:** Minimum 30 bets, but realistically:
- Week 1: 10-15 bets
- Week 2: 20-30 bets
- Week 3: 40-50 bets (ready to launch at 50+ if metrics hit)

### Q: What if my win rate is below 56%?

**A:** Keep testing, don't launch yet.
- Review losing bets for patterns
- Adjust your gem algorithm
- Track what markets work best
- Get to 56%+ before going public

### Q: Can I delete a bet?

**A:** Yes, click the "✕" button.
- But only delete if it was a mistake
- Don't delete losing bets (that's not how records work)

---

## Tips for Success

### 1. Log Immediately
- Log the bet RIGHT WHEN YOU PLACE IT
- Don't wait until after the game
- This captures accurate entry odds

### 2. Update Closing Odds When Game Starts
- Check the sportsbook at kickoff/tip-off
- That's your closing line
- Enter it in ALexBET Lite for CLV calculation

### 3. Mark Results Honestly
- Don't fudge results
- If you lost, mark LOST
- Your numbers are only useful if they're honest

### 4. Review Weekly
- Every Sunday, check your Analytics tab
- Look for patterns in winning/losing bets
- Identify which sports/bet types work best

### 5. Search & Filter
- Use the search bar to find bets by:
  - Team name (`Celtics`)
  - Sport (`NBA`)
  - Date (`2026-04-15`)
- Filter by status (Won/Lost/Pending)

### 6. Focus on CLV + Win Rate
- Don't obsess over individual bets
- Focus on the 30-bet average
- Win rate ≥ 56% + CLV > 0% = launch ready

---

## Success Metrics Timeline

### Week 1 (10-15 bets)
- Getting a feel for the tracker
- Identifying your best sports/bet types
- Check: Is win rate trending toward 55%+?

### Week 2 (20-30 bets)
- Real patterns emerging
- CLV should be visible (positive or negative)
- Check: Hit 56%+ win rate yet?

### Week 3+ (30-50 bets)
- Confident in your metrics
- Ready to launch if hit targets
- If not hit, keep testing
- No rush — better to be sure

---

## Before You Go Live

When you hit 56%+ win rate + positive CLV:

1. ✅ Export all bet data
2. ✅ Screenshot your analytics
3. ✅ Review your edge by sport
4. ✅ Plan marketing campaign
5. ✅ Set up Stripe payments
6. ✅ Create Discord community
7. ✅ Launch bot publicly

---

## Support & Help

**Bot issues?**
- Check Railway logs: https://railway.app

**Lite tracker questions?**
- Reload the page (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
- Clear browser cache if data lost

**Want to share your results?**
- Export JSON from Lite
- Share with team via GitHub

---

## Key Rules

1. ✅ **1% Rule:** Never bet more than 1% of bankroll per bet
2. ✅ **Real Data Only:** Log actual bets, not theoretical
3. ✅ **Track Everything:** Every bet gets logged, won or lost
4. ✅ **Check CLV:** Know if you're beating the market
5. ✅ **Don't Launch Early:** Hit 56%+ before going public
6. ✅ **Honest Records:** Results are only valuable if accurate

---

## Next Steps

1. Open https://alexbetlite.netlify.app
2. Get a gem from @AlexBetSharp_Bot (`/scan`)
3. Log your first bet
4. Set closing odds when game starts
5. Mark result (won/lost)
6. Check your CLV & analytics
7. Repeat for 30+ bets
8. When ready: Launch! 🚀

---

**Remember:** You're not trying to be perfect. You're trying to prove your edge is real.
CLV + win rate don't lie. Let the data speak.

Good luck! 💪
