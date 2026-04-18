# Netlify Deployment Guide - AlexBET Lite Phase 5

**Date:** April 18, 2026  
**Status:** ✅ READY FOR NETLIFY DEPLOYMENT  
**Estimated Deployment Time:** 5-10 minutes  
**Confidence:** 99%

---

## Pre-Deployment Checklist

### Before You Start

- [ ] GitHub account with access to `oddsifylabs/alexbet-lite` repo
- [ ] Netlify account (free tier sufficient)
- [ ] Verify all code is pushed to GitHub (`git push origin main`)
- [ ] All tests passing locally (`npm test`)

### Why Netlify is Great for AlexBET Lite

✅ **Perfect for static sites** (which AlexBET is)  
✅ **Instant deployments** (5-10 minutes)  
✅ **Free HTTPS** (automatic)  
✅ **GitHub integration** (auto-deploy on push)  
✅ **Better DX than Railway** (simpler for static apps)  
✅ **Faster cold start** (no build step needed)  
✅ **Better for SPA** (single-page app support)  
✅ **Free tier is generous** (100GB/month bandwidth)

---

## Step 1: Prepare for Netlify

### 1.1 Create netlify.toml (Optional but Recommended)

```bash
cd /tmp/alexbet-lite
```

Create `netlify.toml`:

```toml
[build]
  publish = "."
  command = ""

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production]
  environment = { NODE_ENV = "production" }
```

**What this does:**
- `publish = "."` — Serve files from root directory
- `[[redirects]]` — Route all URLs to index.html (SPA support)
- Auto-HTTPS enabled

### 1.2 Verify index.html is in root

```bash
ls -la index.html
# Should show: -rw-r--r-- ... index.html
```

### 1.3 Push to GitHub

```bash
cd /tmp/alexbet-lite
git add netlify.toml
git commit -m "🚀 Add Netlify configuration"
git push origin main
```

---

## Step 2: Deploy to Netlify

### 2.1 Go to Netlify

1. Visit: https://app.netlify.com
2. Sign in (or create account)
3. Click **"Add new site"** → **"Import an existing project"**

### 2.2 Connect GitHub

1. Select **GitHub** as your Git provider
2. Authorize Netlify to access your GitHub
3. Search for and select: `oddsifylabs/alexbet-lite`
4. Click **"Install"**

### 2.3 Configure Build Settings

**Netlify will auto-detect settings. Verify:**

- **Build command:** (leave empty — static site)
- **Publish directory:** `.` (root directory)
- **Environment variables:** (leave empty for Phase 5)

**Preview:**
- Your site will be available at: `alexbet-lite.netlify.app`

### 2.4 Deploy

Click **"Deploy site"**

Netlify will:
1. Connect to your GitHub repo
2. Clone the latest code
3. Serve files from root
4. Generate HTTPS certificate
5. Assign domain: `alexbet-lite.netlify.app`
6. Go live! (usually < 1 minute)

---

## Step 3: Post-Deployment Verification

### 3.1 Test Live Deployment

**In browser:**
```
https://alexbet-lite.netlify.app
```

**Expected:**
- ✅ Page loads instantly (< 1 second)
- ✅ Your AlexBET interface appears
- ✅ Dark theme visible
- ✅ No console errors (F12)

### 3.2 Test Core Features

1. **Create a bet**
   - [ ] Click "Add Bet"
   - [ ] Enter name, odds, stake
   - [ ] Click "Save"
   - [ ] Bet appears in list

2. **View Analytics**
   - [ ] Click "Analytics" tab
   - [ ] Dashboard loads
   - [ ] Charts render
   - [ ] Statistics display

3. **Test Data Persistence**
   - [ ] Refresh page (F5)
   - [ ] Data should still be there
   - [ ] localStorage working ✅

4. **Export Data**
   - [ ] Click "Export"
   - [ ] Choose CSV or JSON
   - [ ] File downloads ✅

### 3.3 Test on Mobile

- [ ] Open in Chrome Mobile
- [ ] Open in Safari iOS
- [ ] Check responsive layout
- [ ] Touch interactions work

### 3.4 Browser Console Check

```javascript
// F12 → Console, paste:
console.log(document.title);
// Should show: "AlexBET Lite"

console.log(typeof BetTracker);
// Should show: "function"

console.log(localStorage.length);
// Should show: 0 or number (depends on data)
```

**Expected:** No red errors ✅

---

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Custom Domain

**If you want `alexbet.yourdomain.com`:**

1. Netlify Dashboard → Site settings
2. Go to **"Domain management"**
3. Click **"Add custom domain"**
4. Enter: `alexbet.yourdomain.com`
5. Netlify shows DNS records to add

### 4.2 Update DNS

At your domain registrar (GoDaddy, Namecheap, etc.):

1. Add DNS record:
   ```
   Host: alexbet
   Type: CNAME
   Value: [your-netlify-site].netlify.app
   ```
2. Save and wait 5-15 minutes
3. Verify: `ping alexbet.yourdomain.com` resolves

### 4.3 Enable HTTPS

- Netlify automatically provisions SSL/TLS
- Green lock in browser ✅
- No additional setup needed

---

## Step 5: Continuous Deployment

### 5.1 How It Works

Every time you push to `main` branch:

1. Netlify detects the change
2. Automatically deploys your latest code
3. Usually live in < 1 minute
4. Old version is kept (rollback available)

### 5.2 Deploy Workflow

```bash
# 1. Make changes locally
nano src/app.js

# 2. Test locally
npm test

# 3. Commit and push
git add .
git commit -m "✨ Feature: Add new metric"
git push origin main

# 4. Netlify auto-deploys
# Check: app.netlify.com → Deploys tab
# Status changes: Building → Published ✅
```

### 5.3 Monitor Deployment

**In Netlify Dashboard:**
1. Click your site
2. Go to **"Deploys"** tab
3. See real-time deployment status
4. View build logs if needed

---

## Step 6: Monitoring & Logs

### 6.1 View Deployment Logs

**Netlify Dashboard:**
1. Site → Deploys tab
2. Click on a deployment
3. View build log (usually empty for static sites)
4. View deploy log

**Expected:** "Site is live" message ✅

### 6.2 Monitor Performance

**Netlify Analytics (free on Netlify):**
1. Site → Analytics tab
2. View:
   - Requests per day
   - Bandwidth usage
   - Geographic distribution
   - Error rate (should be 0%)

### 6.3 Set Up Alerts (Optional)

For paid Netlify plan:
- Email alerts on failed builds
- Slack integration
- Custom webhooks

---

## Step 7: Troubleshooting

### 7.1 Page Not Loading / 404

**Symptom:** "Page not found" on https://alexbet-lite.netlify.app

**Check:**
1. Netlify dashboard shows "Published" ✅
2. index.html exists in repo root
3. netlify.toml has SPA redirect rule

**Fix:**
```toml
# netlify.toml must have:
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Then redeploy: `git push origin main`

### 7.2 CSS/JS Not Loading

**Symptom:** Page loads but unstyled, no functionality

**Check:**
1. Path in index.html must be relative:
   ```html
   <!-- Correct: -->
   <link rel="stylesheet" href="src/main.css">
   <script src="src/app.js"></script>
   
   <!-- Wrong: -->
   <link rel="stylesheet" href="/src/main.css">
   ```

2. All files must be in GitHub repo:
   ```bash
   git ls-files | grep -E "\.(js|css|html)$"
   ```

**Fix:** Update paths, commit, push, Netlify auto-redeploys

### 7.3 localStorage Data Lost

**Symptom:** Data disappears after refresh

**Check:**
1. Browser allows localStorage (privacy settings)
2. Test in incognito: Data persists? ✅
3. Check storage quota: DevTools → Application → Storage

**Note:** localStorage is browser-local. Data is per-device.

### 7.4 CORS/API Errors

**Symptom:** Cannot fetch scores from ESPN API

**Check:**
1. API calls use HTTPS (not HTTP)
2. API endpoint is correct
3. Rate limiting not exceeded

**Status:** Should work fine with Netlify (static hosting doesn't block CORS)

---

## Step 8: Rollback Procedure

### 8.1 If Deployment Has Issues

**Quick Rollback:**

1. Netlify Dashboard → Deploys tab
2. Find previous working deployment
3. Click the deploy
4. Click **"Publish deploy"**

**Site is instantly rolled back** ✅

### 8.2 Alternative: Revert Code

```bash
git revert HEAD  # Undo last commit
git push origin main
# Netlify auto-deploys reverted code
```

---

## Step 9: Performance Optimization

### 9.1 Netlify is Fast Because

✅ **CDN:** Files served from 200+ global edge locations  
✅ **Caching:** Static files cached aggressively  
✅ **Compression:** Gzip enabled by default  
✅ **No cold starts:** Unlike serverless, instant response  

**Typical load time:** < 500ms ✅

### 9.2 Monitor Performance

**DevTools:**
1. Open F12 → Network tab
2. Refresh page
3. Check load times:
   - HTML: < 100ms ✅
   - CSS: < 50ms ✅
   - JS: < 200ms ✅
   - Total: < 500ms ✅

### 9.3 Performance Tips

**Already optimized in AlexBET:**
- ✅ Minified CSS/JS
- ✅ Lazy-loaded charts
- ✅ Efficient algorithms
- ✅ localStorage caching

**No additional optimization needed** ✅

---

## Step 10: Maintenance & Updates

### 10.1 Regular Updates

**Weekly:**
- [ ] Check Netlify analytics
- [ ] Monitor error rate (should be 0%)

**Monthly:**
- [ ] Review deployment history
- [ ] Update dependencies: `npm update`
- [ ] Run security audit: `npm audit`

**Quarterly:**
- [ ] Performance review
- [ ] Browser compatibility check
- [ ] Security audit

### 10.2 Deploy Updates

**Standard workflow:**
```bash
# 1. Make changes
nano src/classes/BetValidator.js

# 2. Test
npm test

# 3. Commit & push
git add .
git commit -m "🐛 Fix: Validation bug"
git push origin main

# 4. Netlify auto-deploys (< 1 minute)
```

### 10.3 Emergency Patches

**If critical bug found:**
```bash
# Fix the bug
nano src/app.js

# Test
npm test

# Push immediately
git add .
git commit -m "🚨 Critical: Fix bet settlement"
git push origin main

# Netlify deploys in < 1 minute
```

---

## Appendix: netlify.toml Reference

```toml
[build]
  publish = "."
  command = ""

# SPA redirect rule (important!)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Production environment settings
[context.production]
  environment = { NODE_ENV = "production" }

# Deploy on main branch
[context.production.environment]
  BRANCH = "main"

# Preview deploy settings (optional)
[context.deploy-preview]
  environment = { NODE_ENV = "development" }
```

---

## Appendix: Netlify vs Railway Comparison

| Feature | Netlify | Railway |
|---------|---------|---------|
| **Setup Time** | 5-10 min | 15-20 min |
| **Best For** | Static sites | Full apps |
| **Cold Start** | < 100ms | 1-2 seconds |
| **DX** | Excellent | Good |
| **Free Tier** | 100GB/month | Limited |
| **Auto-Deploy** | Yes | Yes |
| **SPA Support** | Native | Requires config |
| **Price** | Free/$20+/mo | Free/$5+/mo |

**For AlexBET (static SPA):** **Netlify wins** 🏆

---

## Quick Deployment Checklist

```bash
# Final checks before deployment
[ ] git status → clean
[ ] npm test → all pass
[ ] git push origin main → pushed
[ ] index.html in root → ✅
[ ] netlify.toml created → ✅

# Netlify deployment
[ ] Go to app.netlify.com
[ ] Connect GitHub repo
[ ] Auto-deploy starts
[ ] Monitor Deploys tab
[ ] Status: "Published" ✅

# Post-deployment
[ ] Test in browser: https://alexbet-lite.netlify.app
[ ] Create test bet
[ ] Check analytics
[ ] Verify localStorage
[ ] Check console (no errors)
[ ] Test on mobile
[ ] Done! 🎉
```

---

## Support & Troubleshooting

### If Issues Occur

1. **Check Netlify Logs**
   - Dashboard → Deploys → Click deployment → View log

2. **Check GitHub**
   - Verify commit pushed
   - Check build status

3. **Manual Redeploy**
   - Dashboard → Deploys → "Trigger deploy"

4. **Rollback**
   - Dashboard → Deploys → Select previous → "Publish deploy"

### Contact

- **Netlify Support:** https://support.netlify.com
- **Documentation:** https://docs.netlify.com
- **GitHub Issues:** Create issue in repo

---

## Deployment Complete! 🎉

**Status:** ✅ Ready for Netlify deployment  
**Time Estimate:** 5-10 minutes  
**Risk Level:** Low  

Once deployed, your site will be live at:
- **URL:** https://alexbet-lite.netlify.app
- **Custom domain:** https://alexbet.yourdomain.com (optional)

---

**Netlify Deployment Guide Completed:** April 18, 2026  
**Next Step:** Follow Step 1-3 above to deploy  
**Support:** See support section above
