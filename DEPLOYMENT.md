# Railway Deployment Guide

This guide provides step-by-step instructions for deploying the Cricket Trading Platform on Railway.

## Project Overview

The project is a monorepo with:
- **Backend API**: Node.js + Express + Socket.io (port 4000)
- **Frontend Web**: Next.js (port 3000)
- **Shared Package**: TypeScript shared types and utilities

## Prerequisites

1. Railway account (https://railway.app)
2. GitHub account with repository access
3. MongoDB database (Railway MongoDB or external)
4. Redis instance (Railway Redis or external)

## Deployment Architecture

We use a **multi-service architecture** on Railway:
- **API Service**: Backend with WebSocket support
- **Web Service**: Frontend Next.js application

## Step 1: Prepare Environment Variables

Copy `.env.example` to `.env` and configure the following critical variables:

### Required Variables
```bash
# Security
JWT_SECRET=generate-a-64-byte-random-hex-string

# Database Connections
MONGODB_URI=mongodb://your-mongo-connection-string
REDIS_URL=redis://your-redis-connection-string

# External APIs (optional)
RAPIDAPI_KEY=your-rapidapi-key
BETFAIR_APP_KEY=your-betfair-app-key
BETFAIR_SESSION_TOKEN=your-betfair-session-token
```

### Generate Secure Secrets
```bash
# Generate JWT_SECRET (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate ENCRYPTION_KEY (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 2: Deploy to Railway

### Option A: Deploy via Railway Dashboard
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will automatically detect the `railway.json` configuration
5. Configure environment variables in Railway dashboard

### Option B: Deploy via Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to existing project or create new
railway link

# Deploy
railway up
```

## Step 3: Configure Services

### API Service Configuration
- **Root Directory**: `./apps/api`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: Automatically assigned by Railway (uses `PORT` env var)
- **Health Check**: `/api/health`

### Web Service Configuration
- **Root Directory**: `./apps/web`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: Automatically assigned by Railway

## Step 4: Set Environment Variables in Railway

### API Service Variables
```bash
PORT=4000
NODE_ENV=production
JWT_SECRET=your-generated-secret
MONGODB_URI=your-mongodb-uri
REDIS_URL=your-redis-url
WEB_ORIGIN=https://your-web-service-url.railway.app
```

### Web Service Variables
```bash
NEXT_PUBLIC_API_URL=https://your-api-service-url.railway.app
NEXT_PUBLIC_WS_URL=https://your-api-service-url.railway.app
NODE_ENV=production
```

Railway will automatically inject:
- `RAILWAY_STATIC_URL` for web service
- `RAILWAY_PUBLIC_DOMAIN` for API service
- Service URLs via `{{services.api.url}}` and `{{services.web.url}}` templates

## Step 5: Database Setup

### MongoDB on Railway
1. Add "MongoDB" service from Railway template
2. Copy the connection string
3. Set as `MONGODB_URI` environment variable

### Redis on Railway
1. Add "Redis" service from Railway template
2. Copy the connection URL
3. Set as `REDIS_URL` environment variable

## Step 6: Verify Deployment

### Check API Health
```bash
curl https://your-api-service-url.railway.app/api/health
```

### Check WebSocket Connection
```bash
# Using wscat
wscat -c wss://your-api-service-url.railway.app
```

### Access Frontend
Open `https://your-web-service-url.railway.app` in browser.

## Step 7: Monitoring and Logs

### View Logs
```bash
# Railway CLI
railway logs

# Or via dashboard
# → Project → Service → Logs
```

### Monitor Performance
- Railway dashboard provides CPU, memory, and network metrics
- Set up alerts for error rates and resource usage

## Production Considerations

### 1. Scaling
- API service: Scale based on WebSocket connections
- Web service: Scale based on traffic
- Consider enabling auto-scaling in Railway

### 2. WebSocket Support
- Railway fully supports WebSocket connections
- No special configuration needed
- Socket.io will automatically use WebSocket transport

### 3. CORS Configuration
- Backend is configured to accept requests from frontend origin
- Update `WEB_ORIGIN` and `CORS_ORIGINS` if using custom domains

### 4. SSL/TLS
- Railway provides automatic SSL certificates
- All connections are HTTPS/WSS by default

### 5. Domain Configuration
1. Go to Railway dashboard → Project → Settings → Domains
2. Add custom domain
3. Update DNS records as instructed

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs
railway logs --service api --build
railway logs --service web --build
```

#### 2. WebSocket Connection Issues
- Verify `NEXT_PUBLIC_WS_URL` points to API service
- Check that Socket.io server is running on API
- Verify CORS configuration allows frontend origin

#### 3. Database Connection Issues
- Verify connection strings are correct
- Check if database is accessible from Railway network
- Ensure MongoDB and Redis are running

#### 4. Environment Variables Not Loading
- Verify variables are set in Railway dashboard
- Check variable names match code expectations
- Restart services after changing environment variables

### Debug Commands
```bash
# SSH into service
railway ssh --service api

# View environment variables
railway vars --service api

# Restart service
railway restart --service api
```

## Maintenance

### Updating Deployment
1. Push changes to GitHub
2. Railway automatically deploys new version
3. Monitor deployment logs for errors

### Database Backups
- Configure automatic backups in Railway MongoDB service
- Regular export of critical data

### Security Updates
- Keep dependencies updated
- Regularly rotate JWT_SECRET and other secrets
- Monitor for security vulnerabilities

## Alternative Deployment Options

### Vercel (Frontend Only)
- Deploy frontend to Vercel
- Keep backend on Railway for WebSocket support
- Update `NEXT_PUBLIC_API_URL` to point to Railway API

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## Support

For issues with Railway deployment:
1. Check Railway documentation: https://docs.railway.app
2. Review project logs in Railway dashboard
3. Check GitHub repository for latest updates

## Project Structure Reference

```
.
├── railway.json          # Railway configuration
├── package.json         # Root package with workspaces
├── apps/
│   ├── api/            # Backend API service
│   └── web/            # Frontend web service
├── packages/
│   └── shared/         # Shared TypeScript package
└── scripts/
    └── copy-dist.js    # Build helper script
```

---

**Deployment Status**: ✅ Ready for Railway deployment  
**Last Updated**: $(date)  
**Commit**: $(git rev-parse --short HEAD)