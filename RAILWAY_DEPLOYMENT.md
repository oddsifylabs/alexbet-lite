# Deploy AlexBET Lite to Railway (30 seconds)

## Quick Start (Easiest Way)

### 1. Go to Railway Dashboard
Visit: https://railway.app/dashboard

### 2. Click "New Project" → "Deploy from GitHub"

### 3. Select Repository
- Search for: `oddsifylabs/alexbet-lite`
- Click to authorize if needed
- Click "Deploy Now"

**That's it!** Railway will:
- ✅ Auto-detect `Procfile` + `server.js`
- ✅ Install npm dependencies automatically
- ✅ Start the Express server
- ✅ Generate a live URL (e.g., `https://alexbet-lite.railway.app`)

---

## What Gets Deployed

```
server.js           → Express server (serves static files + SPA routing)
package.json        → Node dependencies (express only)
Procfile            → Railway configuration
index.html          → Your app (served as static)
src/                → All JavaScript/CSS/assets
```

---

## Auto-Deploy Future Commits

Once connected:
- Every push to `main` → Auto-redeploys in 30-60 seconds
- Check deployment status in Railway dashboard → "Deployments" tab
- View logs: Dashboard → "Logs" tab

---

## Environment Variables (if needed later)

In Railway dashboard:
1. Go to your project → "Variables"
2. Add any needed vars (none required for Lite currently)

---

## Domain Setup (Optional)

Railway gives you a free `railway.app` subdomain.

To use your own domain:
1. Railway dashboard → Project settings → Domains
2. Add your domain
3. Update DNS records (Railway shows instructions)

---

## Troubleshooting

**Deploy failed?**
- Check "Deployments" tab → click failed deploy → "View logs"
- Common issues:
  - Port conflict? Railway auto-assigns PORT env var ✅
  - Dependencies missing? We included express in package.json ✅
  - SPA routing issue? server.js has fallback to index.html ✅

**Site shows old version?**
- Click "Redeploy" in Railway dashboard
- Or push a new commit to trigger auto-deploy

---

## Commands for Local Testing

```bash
# Install dependencies
npm install

# Start server locally
npm start

# Visit http://localhost:3000
```

---

## Summary

| What | Result |
|------|--------|
| **Deploy Time** | 30-60 seconds |
| **Cost** | $5/month baseline |
| **URL** | `https://alexbet-lite.railway.app` |
| **Auto-redeploy** | Yes, on every push |
| **Logs access** | Dashboard → Logs tab |

---

**Ready to deploy?** Go to https://railway.app/dashboard and follow steps 1-3 above!
