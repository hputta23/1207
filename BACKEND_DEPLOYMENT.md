# Backend Deployment Guide - Terminal Pro API

This guide will help you deploy the Terminal Pro Python backend to Render's free tier.

## 🚀 Quick Deploy to Render (Free)

### Option 1: Deploy via Render Dashboard (Easiest)

1. **Visit Render**: Go to https://render.com and sign up with GitHub

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository (`hputta23/1207`)
   - Render will detect your repository

3. **Configure Build Settings**:
   ```
   Name: terminal-pro-api
   Region: Oregon (US West)
   Branch: claude/fix-charts-add-data-sources-bq0ik (or your main branch)
   Root Directory: (leave blank)
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: ./start.sh
   ```

4. **Select Free Plan**:
   - Plan: Free
   - Instance Type: Free

5. **Environment Variables** (Optional):
   - Add any API keys if needed
   - `PORT` is automatically set by Render

6. **Deploy**:
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Your API will be live at: `https://terminal-pro-api.onrender.com`

---

### Option 2: Deploy via Render.yaml (Infrastructure as Code)

1. **Push Code**: Make sure your code is pushed to GitHub

2. **Create Blueprint**:
   - Go to https://dashboard.render.com/blueprints
   - Click "New Blueprint Instance"
   - Connect your repository
   - Select the `render.yaml` file from root
   - Click "Apply"

3. **Done!** Render will automatically configure everything from `render.yaml`

---

## 📋 What's Included

Your backend deployment includes:

- ✅ **FastAPI Backend** - High-performance async API
- ✅ **ML Models** - Random Forest, SVR, Gradient Boosting
- ✅ **Monte Carlo Simulation** - GBM, Jump Diffusion, Heston models
- ✅ **Backtesting Engine** - Technical strategy testing
- ✅ **Real-time Data** - Yahoo Finance integration
- ✅ **CORS Enabled** - Works with frontend on different domain
- ✅ **Health Check** - `/health` endpoint for monitoring

---

## 🔗 API Endpoints

Once deployed, your API will have these endpoints:

```
GET  /                  - API info and endpoint list
GET  /health           - Health check (returns status)
POST /history          - Get historical stock data
GET  /news/{ticker}    - Get news for a ticker
POST /predict          - AI price predictions
POST /simulate         - Monte Carlo simulations
POST /backtest         - Strategy backtesting
```

**Example Request:**
```bash
curl https://terminal-pro-api.onrender.com/health
```

**Response:**
```json
{
  "status": "online",
  "timestamp": "2024-01-11T01:30:00",
  "service": "stonks-daily"
}
```

---

## 🌐 Connect Frontend to Backend

After deploying your backend, update your frontend to use the new API URL:

### Update API Client

Edit `/src/services/api-client.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://terminal-pro-api.onrender.com';
```

Then redeploy your frontend to Vercel.

**OR** set environment variable in Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://terminal-pro-api.onrender.com`
3. Redeploy

---

## ⚙️ Files Created for Deployment

- **`backend/`** - Python backend code
  - `main.py` - FastAPI application
  - `model.py` - ML models
  - `data_service.py` - Data fetching

- **`requirements.txt`** - Python dependencies
- **`start.sh`** - Startup script for Render
- **`render.yaml`** - Render configuration (optional)
- **`.python-version`** - Python version specification

---

## 📊 Free Tier Limits (Render)

- ✅ **750 hours/month** of runtime (enough for 24/7)
- ✅ **512 MB RAM** - Sufficient for ML models
- ✅ **Automatic HTTPS** - Free SSL certificate
- ⚠️ **Spins down after 15 min** of inactivity (first request may be slow)
- ⚠️ **500 MB disk space** - Enough for dependencies

**Tips:**
- First request after inactivity takes ~30 seconds (cold start)
- Keep API active with a simple ping service (optional)
- Upgrade to paid plan ($7/month) for always-on service

---

## 🐛 Troubleshooting

### Build Fails

**Issue**: Dependency installation fails

**Solution**:
- Check `requirements.txt` has all dependencies
- Verify Python version compatibility
- Check Render build logs for specific errors

### App Crashes on Startup

**Issue**: Application won't start

**Solution**:
- Check start command: `./start.sh`
- Verify `start.sh` is executable: `chmod +x start.sh`
- Check logs in Render dashboard

### CORS Errors from Frontend

**Issue**: Frontend can't call API

**Solution**:
- Verify CORS is enabled in `backend/main.py`
- Check `allow_origins=["*"]` in CORSMiddleware
- Update to specific origins in production:
  ```python
  allow_origins=[
      "https://your-app.vercel.app",
      "http://localhost:5173"
  ]
  ```

### Models Loading Slow

**Issue**: First prediction takes too long

**Solution**:
- This is normal for cold starts on free tier
- Models are loaded on first request
- Consider upgrading to paid plan for better performance

---

## 🔒 Production Considerations

For production deployment, consider:

1. **Environment Variables**: Store API keys securely
2. **CORS**: Restrict to your frontend domain only
3. **Rate Limiting**: Add rate limits to prevent abuse
4. **Monitoring**: Use Render metrics or external monitoring
5. **Scaling**: Upgrade to paid plan for better performance
6. **Database**: Add PostgreSQL for caching predictions

---

## 📈 Alternative Backend Hosts

If Render doesn't meet your needs:

### Railway ($5/month credit)
- Better performance on free tier
- No cold starts
- PostgreSQL included
- Deploy: https://railway.app

### Fly.io (Free tier)
- 3 shared VMs free
- Better for global deployment
- No sleep on free tier
- Deploy: https://fly.io

### Heroku ($5/month)
- Classic PaaS
- Easy deployment
- Good documentation
- Deploy: https://heroku.com

---

## ✅ Deployment Checklist

- [ ] Backend code pushed to GitHub
- [ ] Render account created
- [ ] Web service created on Render
- [ ] Build completed successfully
- [ ] Health check endpoint responding
- [ ] Frontend API URL updated
- [ ] Frontend redeployed with new API URL
- [ ] Test prediction/simulation features
- [ ] Monitor for errors in Render logs

---

## 🎯 Next Steps

1. **Deploy backend** to Render using instructions above
2. **Get your API URL** (e.g., `https://terminal-pro-api.onrender.com`)
3. **Update frontend** API client with new URL
4. **Redeploy frontend** to Vercel
5. **Test all features** - especially Analytics tab
6. **Monitor logs** in Render dashboard

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Check Logs**: Render Dashboard → Your Service → Logs

Your backend will be live and ready to serve predictions in just a few minutes! 🚀
