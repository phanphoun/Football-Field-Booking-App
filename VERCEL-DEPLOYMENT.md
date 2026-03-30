# 🚀 Vercel Deployment Guide

## 📋 Prerequisites

- Vercel account (free)
- GitHub account
- Database (Vercel Postgres recommended)

## 🗂️ Project Structure

Your project is now configured for Vercel deployment with:
- Frontend: React app (builds to static files)
- Backend: Express.js API (serverless functions)
- Database: PostgreSQL (Vercel Postgres or external)

## 🚀 Quick Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect the settings

### 3. Configure Environment Variables

In your Vercel project dashboard, go to **Settings → Environment Variables** and add:

#### Required Variables:
```
NODE_ENV=production
DATABASE_URL=your-postgres-connection-string
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
```

#### Optional Variables:
```
SERVER_MODE=production
APP_TIMEZONE=Asia/Bangkok
FOOTBALL_API_KEY=your-football-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Database Setup

#### Option A: Vercel Postgres (Recommended)
1. In Vercel dashboard, go to **Storage**
2. Click "Create Database"
3. Choose "Postgres"
4. Once created, copy the `DATABASE_URL` to your environment variables
5. Run the database initialization script

#### Option B: External Database
1. Use any PostgreSQL provider (Supabase, Railway, etc.)
2. Get the connection string
3. Add to environment variables as `DATABASE_URL`

### 5. Initialize Database

After deployment, visit your app and run:
```
https://your-app-name.vercel.app/api/db/create
```

Or use the Vercel CLI:
```bash
vercel env pull .env.production
cd backend && npm run db:create
```

## 🔧 Configuration Files Created

- `vercel.json` - Main Vercel configuration
- `frontend/vercel.json` - Frontend build settings
- `backend/vercel.json` - Backend serverless settings
- `backend/api/index.js` - Serverless API entry point
- `.env.vercel.example` - Environment variables template
- `frontend/.env.production` - Production frontend variables
- `backend/config/database.js` - Database configuration for Vercel

## 🌍 Deployment URLs

After deployment, your app will be available at:
- Main app: `https://your-app-name.vercel.app`
- API: `https://your-app-name.vercel.app/api`

## 🔄 Automatic Deployments

Vercel will automatically redeploy when you:
- Push to your main branch
- Update environment variables
- Modify Vercel configuration

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check if database allows Vercel IPs
   - Ensure SSL is configured properly

2. **Build Failures**
   - Check build logs in Vercel dashboard
   - Verify all dependencies are in package.json
   - Ensure environment variables are set

3. **API Not Working**
   - Check routes in `vercel.json`
   - Verify serverless function is properly exported
   - Check API logs in Vercel dashboard

### Debug Commands:

```bash
# Check deployment logs
vercel logs

# Test locally with Vercel
vercel dev

# Inspect environment variables
vercel env ls
```

## 📱 Mobile & Performance

Your deployed app includes:
- ✅ Responsive design
- ✅ Optimized builds
- ✅ CDN distribution
- ✅ Automatic HTTPS
- ✅ Global edge network

## 🎯 Next Steps

1. Set up custom domain (optional)
2. Configure analytics (Vercel Analytics included)
3. Set up monitoring
4. Add error tracking (Sentry recommended)

## 📞 Support

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Project Issues: Check GitHub Issues

---

**🎉 Your Football Field Booking App is ready for Vercel deployment!**
