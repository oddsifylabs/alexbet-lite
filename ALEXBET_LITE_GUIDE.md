# AlexBET Lite — Complete User Guide (v2.0)

## What is AlexBET Lite?

AlexBET Lite is a professional sports betting tracker with **Closing Line Value (CLV)** analysis. It helps you:

1. ✅ Log every bet you place (with entry odds)
2. ✅ Track closing odds when games start
3. ✅ Calculate CLV (Closing Line Value automatically)
4. ✅ Monitor win rate, P&L, ROI, avg CLV
5. ✅ Validate your edge before scaling to paid users

**Goal:** Achieve 56-65% win rate with positive CLV, proving your algorithm works before launching publicly.

**Bot Connection:** Use `/scan` in @AlexBetSharp_Bot to find gems, then log them in ALexBET Lite!

---

## Step 1: Access AlexBET Lite

**URL:** https://alexbetlite.netlify.app

**Browser:** Works in any modern browser (Chrome, Safari, Firefox, Edge)

**No login required** — All data stored locally on your device (survives refreshes)

---

## Step 2: Understanding the Main Tabs

AlexBET Lite has 4 tabs:

#### 📊 **Bet Tracker** (Default)
Where you log new bets and see your betting history with CLV tracking

#### 📈 **Analytics**
Real-time stats: Win rate, P&L, CLV, ROI, avg edge, avg stake, sample size

#### ✅ **Validation**
Progress toward launch (56-65% win rate + 30+ bets + positive CLV)

#### ℹ️ **About**
Product info, AlexBET Sharp Bot link, related products, gambling disclaimer

---

## Step 3: Logging a New Bet

### Before You Bet:

1. **Get a gem from the bot** (`/scan` in Telegram @AlexBetSharp_Bot)
   - Bot shows: Pick, odds, league (🏀 NBA, 🏈 NFL, etc), market type (ML/Spread/Total)
   - Game date & start time in YOUR timezone (set with `/timezone`)
   - Example: "🏀 *NBA* | Spread, Heat @ -110, 04/15/26 at 7:30 PM EST"

2. **Place the bet and note your entry odds**
   - Example: You bet Miami Heat Spread at -110

3. **Log it immediately in ALexBET Lite**

### In ALexBET Lite (Bet Tracker Tab):

**Fill out the form:**

1. **Pick** — Team/player name
   - Example: `Miami Heat` (copy from bot)

2. **Entry Odds** — Odds you're betting at RIGHT NOW
   - Example: `-110` (exact odds from your sportsbook)
   - This is what the bot showed you

3. **Edge %** — Your estimated edge on this bet
   - Example: `6.5` (meaning 6.5% advantage)
   - This comes from your analysis/algorithm

4. **Stake ($)** — How much money you're risking
   - Example: `50` (meaning $50)
   - Rule: Never exceed 1% of bankroll per bet

5. **Bet Type** — Type of bet
   - ✅ Moneyline (ML) — Pick winner straight up
   - ✅ Spread — Pick winner with point spread
   - ✅ Total (Over/Under) — Pick final score over/under
   - ✅ Player Prop — Individual player stat (points, assists, etc)
   - ✅ Team Prop — Team-specific stat

6. **Sport** — Which sport
   - NBA, NFL, MLB, NHL, Tennis, Soccer (USA only)

**Click "➕ Add Bet"**

✅ Bet is now logged with entry odds!

---

## Step 4: Game Starts — Update Closing Odds

**When the game starts (NOT when it finishes):**

1. Find the bet in the **Bet Tracker** table (sorted by date)
2. Look for **Closing Odds** column with blue "Set: [odds]" button
3. Go to your sportsbook RIGHT AT KICKOFF/TIPOFF
4. Check what the line is showing (opening line when game started)
5. Click "Set: [odds]" and enter the closing line odds
   - Example: You bet at -110, line opens at -115 when game starts
   - Enter: `-115`
6. **CLV% auto-calculates** ✨ (appears in CLV% column, color-coded)

**What is CLV?**
- **Positive CLV (green)** = You got better odds than market = ✅ GOOD
- **Negative CLV (red)** = You got worse odds than market = ❌ BAD
- **Example:** 
  - You bet Miami at -110
  - When game starts, line is -115
  - CLV = +1.11% (you got +1.11% value vs closing)

**Why This Matters:** Professional bettors track CLV over 30+ bets. Positive CLV + 56%+ win rate = proof your edge is real

---

## Step 5: Mark the Result

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

## Step 6: Check Analytics

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

## Step 7: Track Progress to Launch

**Go to ✅ Validation tab**

### Launch Readiness Checklist:

- ✅ Bot `/scan` working (6 sports × 3 markets)
- ✅ Lite tracker logging bets correctly
- ⏳ **30+ bets logged** (minimum sample size)
- ⏳ **Win rate ≥ 56%** (beating -110 breakeven)
- ⏳ **Avg CLV > 0%** (positive closing line value)

**When ALL 3 ⏳ are green → Ready to launch paid tiers!**

The validation tab shows your progress in real-time with color coding.

---

## Step 8: Export Your Data

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

## Understanding CLV (Critical for Success!)

### What is Closing Line Value (CLV)?

CLV measures **if you got better odds than the opening line when the game started**.

### Example:

```
SCENARIO: Heat vs Celtics (Spread)

YOU:
- Bet: Heat -3.5 at -110
- Time: Monday 2pm (3 days before game)

WHEN GAME STARTS (Thursday 7pm):
- Opening line: Heat -4.0 at -115
- This is your "closing line"

CLV CALCULATION:
-110 odds = 52.38% implied probability
-115 odds = 53.49% implied probability  
CLV = 53.49% - 52.38% = +1.11%

YOU GOT +1.11% CLV ✅
```

### Why CLV Matters (The Secret):

> "Professional bettors track CLV, not just wins.
> A 51% bettor with +2% avg CLV beats a 60% bettor with -1% avg CLV.
> Win rate regresses to chance. CLV proves your edge is real."

**Your Path to Profitability:**
1. ✅ Get positive CLV (prove you're beating the market)
2. ✅ Maintain 56%+ win rate (basic breakeven at -110)
3. ✅ Combine both = sustainable profits

**How to Get Positive CLV:**
1. ✅ Identify value before market does
2. ✅ Bet early in the week
3. ✅ Line shop (compare multiple sportsbooks)
4. ✅ React to injury news before odds adjust
5. ✅ Use your gem algorithm to find edges

---

## Setting Your Timezone

**Bot shows all game times in YOUR timezone!**

### To Set Timezone:

1. Open Telegram: @AlexBetSharp_Bot
2. Type `/timezone`
3. Select your US timezone:
   - 🗽 EST (New York)
   - ⏰ CST (Chicago)
   - 🏔️ MST (Denver)
   - 🌲 PST (Los Angeles)
   - Alaska or Hawaii options available

4. All future game times will show in your local time

**Example:**
- If you select PST, Miami vs Boston at 7:30 PM ET shows as 4:30 PM PT

---

## Common Questions

### Q: Why does my CLV show 0%?

**A:** You haven't entered the closing odds yet.
- Click the blue "Set: [odds]" button in Closing Odds column
- Enter the line when the game STARTS (at kickoff/tipoff)
- CLV% will auto-calculate and display in green/red

### Q: What if I can't find the closing odds?

**A:** Go to your sportsbook at game start time:
- Open DraftKings, FanDuel, etc RIGHT at kickoff
- Screenshot or write down the line
- Enter it in ALexBET Lite immediately
- This is the "opening line" = "closing line" for CLV purposes

### Q: Should I track every bet?

**A:** YES. Only track bets you ACTUALLY placed.
- Don't add theoretical bets
- Don't add bets you "wish" you made
- Only real money wagered counts
- Honest records = accurate edge measurement

### Q: How long until I can launch paid tiers?

**A:** Minimum is 30 bets with metrics hitting:
- Realistic timeline: **2-3 weeks**
- Week 1: Get 10-15 bets logged
- Week 2: Reach 25-30 bets, check win rate
- Week 3+: 40-50 bets (if metrics hit, launch!)

### Q: What if my win rate is below 56%?

**A:** Don't launch yet. Keep refining:
- Review your losing bets for patterns
- Adjust your gem algorithm
- Test different sports/markets
- Get to 56%+ AND positive CLV before going public
- Better to be right than rush

### Q: Can I delete a bet?

**A:** Yes, click the "✕" button on any row.
- Only delete if it was logged wrong (typo in odds, etc)
- DO NOT delete losing bets to manipulate your numbers
- Honesty = the only accurate edge measurement

### Q: My CLV is negative. Am I doing something wrong?

**A:** Not necessarily, but it's a warning sign:
- Negative CLV = betting WORSE than market (not good)
- Check if your entry odds were actually as good as you thought
- Consider if you're betting too late (line already moved)
- Focus on betting EARLY in the week for positive CLV

### Q: How do I know if 56% is enough?

**A:** It depends on your average odds:
- **At -110 odds:** 56% = breakeven (before juice costs)
- **At better odds** (like -105): 56% = profitable
- **Your CLV** makes up the difference
- Example: 52% win rate + 2% avg CLV = profitable!

---

## Next Steps - Start Now!

### Day 1: Setup
1. ✅ Open https://alexbetlite.netlify.app in your browser
2. ✅ Bookmark it (you'll use it daily)
3. ✅ Open Telegram: @AlexBetSharp_Bot
4. ✅ Run `/start` in bot (set your bankroll)
5. ✅ Run `/timezone` to set your local timezone

### Day 1-2: Your First Bet
1. ✅ Run `/scan` in bot → See 5 gems
2. ✅ Pick ONE gem (e.g., Heat Spread at -110)
3. ✅ Place the bet on your sportsbook
4. ✅ Go to ALexBET Lite → Click "Add Bet"
5. ✅ Fill in: Pick, Entry Odds (-110), Edge, Stake, Type (Spread), Sport (NBA)
6. ✅ Click "➕ Add Bet"

### When Game Starts
1. ✅ Open your sportsbook at kickoff
2. ✅ Check what the line is
3. ✅ Go to ALexBET Lite → Find your bet
4. ✅ Click "Set: [odds]" → Enter closing odds
5. ✅ CLV % auto-calculates! 🎯

### When Game Ends
1. ✅ Find your bet in tracker
2. ✅ Change Status to WON or LOST
3. ✅ P&L auto-calculates

### Repeat for 30+ Bets
1. ✅ Keep scanning, logging, tracking
2. ✅ Check Analytics tab weekly
3. ✅ When you hit 30+ bets + 56%+ win rate + positive CLV → Ready to launch! 🚀

---

## Key Rules for Success

1. ✅ **1% Bankroll Rule:** Max stake = 1% of total bankroll per bet
   - Example: $5,000 bankroll = max $50 per bet
   - Keeps you safe during losing streaks

2. ✅ **Real Data Only:** Log only bets you actually placed
   - No theoretical bets
   - No "what if" scenarios
   - Only real money wagered counts

3. ✅ **Log Immediately:** Log bet RIGHT when you place it
   - Don't wait until after game
   - Captures accurate entry odds
   - Prevents "memory adjustments"

4. ✅ **Update Closing Odds Early:** Set closing odds at game start
   - Check sportsbook at kickoff
   - Don't wait until end of game
   - Opening line when game starts = closing line for CLV

5. ✅ **Track Everything:** Log every single bet
   - Wins and losses
   - Good calls and bad calls
   - This is the ONLY way to measure edge

6. ✅ **Check CLV:** Positive CLV is your real edge
   - Win rate can regress
   - CLV proves you're beating the market
   - Target: Avg CLV > 0%

7. ✅ **Don't Launch Early:** Wait for 30+ bets + metrics
   - Minimum: 30 bets, 56% win rate, positive CLV
   - Don't rush to paid tiers
   - Better to be sure than sorry

8. ✅ **Honest Records:** Never manipulate your numbers
   - Don't delete losing bets
   - Don't fudge odds
   - Your credibility = your most valuable asset

---

**The Truth:** You're not trying to be perfect.

You're trying to **prove your edge is real** with honest data.

**CLV + Win Rate don't lie. Let the numbers speak.** 📊

Good luck! 💪
