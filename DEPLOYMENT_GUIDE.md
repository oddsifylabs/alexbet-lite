# Railway Deployment Guide - AlexBET Lite Phase 5

**Date:** April 18, 2026  
**Status:** ✅ READY FOR DEPLOYMENT  
**Estimated Deployment Time:** 15-20 minutes  
**Confidence:** 99%

---

## Pre-Deployment Checklist

### Before You Start

- [ ] GitHub account with access to `oddsifylabs/alexbet-lite` repo
- [ ] Railway account (free tier sufficient)
- [ ] Verify all code is pushed to GitHub (`git push origin main`)
- [ ] All tests passing locally (`npm test`)
- [ ] Node.js environment compatible (v18+)

### Verify Code Ready

```bash
cd /tmp/alexbet-lite

# 1. Check git status
git status
# Expected: working tree clean, 0 commits ahead

# 2. Check all changes pushed
git log -1 --pretty=format:"%h %s"
# Latest commit should be visible

# 3. Run tests
npm test
# All tests should pass

# 4. Build verification (if applicable)
npm run build
# No errors
```

---

## Step 1: Prepare Railway

### 1.1 Create Railway Project

1. Go to https://railway.app
2. Sign in or create account
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Authenticate with GitHub (if not already connected)
6. Select repository:
   - Search for `oddsifylabs/alexbet-lite`
   - Click to select
7. Click **"Deploy Now"**

### 1.2 Configure Environment

Railway detects a static web app. No environment variables needed for Phase 5 (database integration comes in Phase 6).

**Next screen:** Environment variables (skip for Phase 5)

### 1.3 Review & Confirm

- Project name: `alexbet-lite` (or your preference)
- Region: Closest to users (default: `us-west`)
- Confirm deployment

---

## Step 2: Deployment Execution

### 2.1 Automatic Deployment

Railway automatically:
1. ✅ Clones your GitHub repo
2. ✅ Installs dependencies (`npm install`)
3. ✅ Detects Node.js project
4. ✅ Serves static files from `dist/` or root
5. ✅ Generates HTTPS certificate
6. ✅ Assigns custom domain

**Deployment Progress:**
- Building... (2-3 minutes)
- Deploying... (1-2 minutes)
- Live! (automatic)

### 2.2 Monitor Deployment

**In Railway Dashboard:**
1. Click project → Deployments tab
2. Watch build logs in real-time
3. Deployments tab shows: Building → Deployed → Live

**Expected Output:**
```
> Cloning repository...
> Installing dependencies...
> Running build...
> Deployment complete!
> Domain: https://alexbet-lite.railway.app
```

### 2.3 Verify Live Deployment

```bash
# After deployment shows "Live"
curl https://alexbet-lite.railway.app/index.html

# Or visit in browser
# https://alexbet-lite.railway.app

# Expected: HTML page loads, no 404/500 errors
```

---

## Step 3: Post-Deployment Verification

### 3.1 Test Core Functionality

**In browser (Chrome recommended):**

1. **Page Load**
   - [ ] Navigate to `https://alexbet-lite.railway.app`
   - [ ] Page loads in < 2 seconds
   - [ ] No console errors (F12 → Console)

2. **Core Features**
   - [ ] Create a test bet (add a bet)
   - [ ] View bet list
   - [ ] Update bet (click edit)
   - [ ] Delete bet (click delete)
   - [ ] Data persists in localStorage

3. **Analytics**
   - [ ] Click "Analytics" tab
   - [ ] Dashboard loads charts
   - [ ] Charts render without errors
   - [ ] Statistics calculate correctly

4. **Import/Export**
   - [ ] Export data (CSV and JSON)
   - [ ] Files download successfully
   - [ ] Import CSV file back
   - [ ] Data merges correctly

5. **Notifications**
   - [ ] Browser notifications enabled
   - [ ] Alert shows on significant bet
   - [ ] Sound alerts play

### 3.2 Test on Multiple Browsers

**Desktop:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if Mac)
- [ ] Edge (if Windows)

**Mobile:**
- [ ] Chrome on Android
- [ ] Safari on iOS

### 3.3 Test on Multiple Devices

**Breakpoints:**
- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1920px width)

### 3.4 Performance Verification

**Open DevTools (F12):**

1. **Network Tab**
   - Page load < 2 seconds
   - All assets load (index.html, CSS, JS, images)
   - No failed requests (404/500)

2. **Console Tab**
   - No red errors
   - No warnings (JavaScript)
   - SecurityAudit logs show normal activity

3. **Performance Tab**
   - Run Lighthouse audit
   - Target score: 80+
   - Focus on Performance & Accessibility

---

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Custom Domain

**If you want `alexbet.example.com` instead of Railway's auto-generated domain:**

1. In Railway Dashboard → Project Settings
2. Go to **"Domains"** tab
3. Click **"Add Custom Domain"**
4. Enter your domain: `alexbet.example.com`
5. Railway provides DNS records to add

### 4.2 Update DNS Records

At your domain registrar (e.g., GoDaddy, Namecheap):

1. Add DNS record:
   - Type: CNAME
   - Name: `alexbet` (or subdomain)
   - Value: `[railway-domain].railway.app`
2. Save and wait 5-15 minutes for DNS propagation
3. Verify: `ping alexbet.example.com` should resolve

---

## Step 5: Continuous Deployment Setup

### 5.1 Enable Auto-Deployment

**Already enabled!** Railway automatically:
- Watches your GitHub repo
- Deploys on every push to `main`
- Rolls back on failed builds

### 5.2 Deployment Triggers

**Automatic deployments on:**
- ✅ Push to `main` branch
- ✅ Merge pull requests to `main`

**To trigger manually:**
1. Railway Dashboard → Deployments
2. Click **"Redeploy"** next to latest deployment

### 5.3 Monitor Deployments

**Check deployment status:**
```bash
# View recent deployments
# Railway Dashboard → Deployments tab
# Shows: commit hash, timestamp, status
```

---

## Step 6: Monitoring & Logs

### 6.1 View Logs

**In Railway Dashboard:**
1. Click project → Logs tab
2. Filters:
   - Build logs (deployment logs)
   - Runtime logs (application errors)
3. Search for errors or warnings

### 6.2 Set Up Alerts

**For critical errors** (Phase 6):
- Railway Pro plan includes error tracking
- Set alerts for 500 errors
- Integrate with Slack/email

### 6.3 Monitor Usage

**View metrics:**
1. Dashboard → Metrics tab
2. Watch:
   - CPU usage (should be < 30%)
   - Memory usage (should be < 200MB)
   - Request count
   - Error rate (should be 0%)

---

## Step 7: Troubleshooting

### 7.1 Deployment Failed

**Symptom:** Red X next to deployment

**Common Causes & Fixes:**

**1. Build failed**
```
Error: npm ERR! missing script: "build"
```
- Check `package.json` has `"build"` script
- Or remove build step from Railway config
- For static apps, no build needed

**2. Dependencies not installed**
```
Error: Module not found: chart.js
```
```bash
# Fix: Add to dependencies
npm install chart.js papaparse --save
git push origin main
# Railway will auto-redeploy
```

**3. Port conflict**
```
Error: listen EADDRINUSE :::3000
```
- Static apps don't need ports
- Remove port binding from code
- Use Railway's automatic static serving

**Fix:** Use Railway's built-in static hosting, not a custom server.

### 7.2 Page Not Loading

**Symptom:** 404 Not Found or blank page

**Checks:**

1. **Verify files exist**
   ```bash
   git ls-files | grep "\.html\|\.js\|\.css"
   # Should show index.html and all resources
   ```

2. **Check index.html location**
   - Must be in root directory
   - Or in public/dist folder

3. **Check paths in index.html**
   ```html
   <!-- These should work: -->
   <script src="src/app.js"></script>
   <link rel="stylesheet" href="src/main.css">
   
   <!-- Not: -->
   <script src="/usr/local/app.js"></script> ❌
   ```

4. **Verify on Railway**
   - Check Logs tab for file not found errors
   - Verify build output shows all files

### 7.3 JavaScript Errors

**Symptom:** Console shows red errors, features don't work

**Checks:**

1. **View error in console (F12)**
   ```
   Uncaught ReferenceError: BetTracker is not defined
   ```

2. **Verify script loading order in index.html**
   ```html
   <!-- Dependencies first -->
   <script src="src/classes/BetValidator.js"></script>
   <script src="src/classes/BetTracker.js"></script>
   
   <!-- Then app -->
   <script src="src/app.js"></script>
   ```

3. **Check paths are correct**
   - Use relative paths: `src/app.js`
   - Not absolute: `/src/app.js` (unless in subdirectory)

### 7.4 Charts Not Rendering

**Symptom:** Analytics tab blank, no charts

**Causes:**

1. **Chart.js not loaded**
   ```bash
   # Verify in index.html
   <script src="https://cdn.jsdelivr.net/npm/chart.js@3.x"></script>
   ```

2. **DOM not ready**
   - Ensure all JS code waits for `DOMContentLoaded`
   - Use `document.addEventListener('DOMContentLoaded', ...)`

3. **Canvas elements not found**
   ```javascript
   // Check if canvas exists
   const canvas = document.getElementById('winRateChart');
   console.log(canvas); // Should not be null
   ```

### 7.5 Data Not Persisting

**Symptom:** Refresh page and bets are gone

**Causes:**

1. **localStorage disabled**
   - Check browser privacy settings
   - Try Chrome/Firefox in incognito mode
   - localStorage must be enabled

2. **Check key names**
   ```javascript
   // localStorage keys should be consistent
   const key = 'alexbet_lite_bets';
   localStorage.setItem(key, JSON.stringify(bets));
   ```

3. **Quota exceeded**
   - localStorage has 5-10MB limit
   - Check DevTools → Application → Storage
   - If full, export data and clear old entries

---

## Step 8: Rollback Procedure

### 8.1 If Deployment Has Issues

**Quick Rollback:**

1. **In Railway Dashboard:**
   - Deployments tab
   - Find previous working deployment
   - Click **"Redeploy"**

2. **Or revert code:**
   ```bash
   git revert HEAD  # Undo last commit
   git push origin main
   # Railway auto-deploys reverted code
   ```

### 8.2 Verify Rollback

- [ ] Page loads
- [ ] Core features work
- [ ] No console errors
- [ ] Data persists

---

## Step 9: SSL/HTTPS Certificate

### 9.1 Automatic HTTPS

**Railway automatically provides:**
- ✅ Free SSL/TLS certificate
- ✅ Auto-renewal (no action needed)
- ✅ HTTPS on both custom and auto-generated domains
- ✅ Redirects HTTP → HTTPS

**No manual configuration needed!**

### 9.2 Verify HTTPS

```bash
# Should show secure certificate
curl -I https://alexbet-lite.railway.app/
# HTTP/2 200 OK
# (green lock in browser)
```

---

## Step 10: Maintenance & Updates

### 10.1 Regular Updates

**Weekly:**
- [ ] Check Logs for errors
- [ ] Monitor CPU/memory usage

**Monthly:**
- [ ] Review error patterns
- [ ] Update dependencies: `npm update`
- [ ] Run security audit: `npm audit`

**Quarterly:**
- [ ] Full security review
- [ ] Performance optimization
- [ ] Browser compatibility check

### 10.2 Deploy Updates

**Standard workflow:**
```bash
# 1. Make code changes locally
nano src/app.js

# 2. Test locally
npm test

# 3. Commit and push
git add .
git commit -m "✨ Feature: Add new analytics metric"
git push origin main

# 4. Railway auto-deploys
# Monitor in Railway Dashboard → Deployments
```

### 10.3 Emergency Patches

**If critical bug found:**
```bash
# 1. Fix the bug
nano src/classes/BetValidator.js

# 2. Test the fix
npm test

# 3. Push immediately
git add .
git commit -m "🐛 Fix: Critical validation bug"
git push origin main

# 4. Monitor deployment
# Railway deploys in < 5 minutes
```

---

## Appendix: Railway Configuration Files

### Railway.json (if needed)

Most projects don't need this. Only if custom build/start is needed:

```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npx http-server -p 3000"
  }
}
```

**For AlexBET Lite:** Not needed - use Railway's static hosting.

### package.json Scripts

Ensure these exist:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

Railway will auto-detect static hosting. No `start` script needed.

---

## Appendix: Environment Variables (Phase 6)

### For Future Phases

When adding database/API keys:

**In Railway Dashboard:**
1. Project Settings → Environment
2. Add variable: `KEY=value`
3. Example (Phase 6):
   ```
   DATABASE_URL=postgresql://...
   ANTHROPIC_API_KEY=sk-...
   ODDS_API_KEY=...
   ```

4. Redeploy: Dashboard → Redeploy button

**In code:**
```javascript
const apiKey = process.env.ANTHROPIC_API_KEY;
```

---

## Appendix: Custom Domain DNS

### Example: Using GoDaddy

**1. Get Railway domain:**
- Railway Dashboard → Domains
- Copy provided domain (e.g., `alexbet-lite.railway.app`)

**2. Update GoDaddy:**
- Login to GoDaddy
- DNS Management
- Add CNAME record:
  ```
  Host: alexbet
  Points to: alexbet-lite.railway.app
  TTL: 600 (or default)
  ```

**3. Verify:**
```bash
nslookup alexbet.youromain.com
# Should resolve to Railway IP
```

**4. In Railway:**
- Domains tab
- Add: `alexbet.yourdomain.com`
- Railway auto-generates certificate

---

## Quick Deployment Checklist

```bash
# Final checks before deployment
[ ] git status → clean
[ ] npm test → all pass
[ ] git push origin main → pushed
[ ] Check GitHub: main branch is latest

# Railway deployment
[ ] Create Railway project
[ ] Connect GitHub repo
[ ] Auto-deployment starts
[ ] Monitor Deployments tab
[ ] All builds pass

# Post-deployment
[ ] Test in browser: https://alexbet-lite.railway.app
[ ] Create test bet
[ ] Export data
[ ] Import data
[ ] Check analytics
[ ] Test on mobile
[ ] Verify no console errors
```

---

## Support & Escalation

### If Issues Occur

1. **Check Railway Logs**
   - Dashboard → Logs tab
   - Search for error messages

2. **Check GitHub**
   - Verify commit pushed
   - Check build status (if enabled)

3. **Manual Redeploy**
   - Dashboard → Deployments
   - Click "Redeploy" button

4. **Rollback**
   - Select previous working deployment
   - Click "Redeploy"

### Contact

- **Railway Support:** https://railway.app/support
- **GitHub Issues:** Create issue in repo
- **Documentation:** See QUICK_REFERENCE.md

---

## Deployment Complete! 🎉

**Status:** ✅ Ready for production deployment  
**Time Estimate:** 15-20 minutes  
**Risk Level:** Low  

Once deployed, monitor for 24 hours and check logs daily for the first week.

---

**Deployment Guide Completed:** April 18, 2026  
**Next Step:** Execute deployment steps 1-10 above  
**Support:** See support section above
