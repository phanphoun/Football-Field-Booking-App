# Deployment Guide

## Overview

This project offers multiple deployment options:

- `frontend/`: React app built to static files
- `backend/`: Express API with three server variants
- Database: MySQL (for production server) or in-memory (for simple/mock servers)
- Realtime: Server-Sent Events at `/api/realtime/stream`
- File uploads: stored on server filesystem (production) or in-memory (mock)

### Server Deployment Options

**Production Server (`server.js`)**
- Full database integration with MySQL
- Complete authentication and authorization
- All features including file uploads, notifications, etc.
- Recommended for production environments

**Simple Server (`server-simple.js`)**
- In-memory mock data
- Basic JWT authentication
- Lightweight and fast startup
- Good for staging or demo environments

**Mock Server (`mock-server.js`)**
- Complete mock API
- No database required
- Full frontend isolation
- Ideal for frontend development and testing

The backend does **not** serve the React build. In production, deploy frontend and backend as separate services, or place them behind a reverse proxy on the same domain.

## Recommended Topology

- Static frontend host for `frontend/build`
- Node.js host for `backend/server.js`
- Managed MySQL database
- Persistent writable storage for uploads

Two working URL patterns:

1. Separate domains
   - Frontend: `https://app.example.com`
   - Backend: `https://api.example.com`
   - Frontend env: `REACT_APP_API_URL=https://api.example.com/api`
   - Backend env: `CORS_ORIGIN=https://app.example.com`

2. Same domain behind a reverse proxy
   - Frontend: `https://example.com/`
   - Backend proxied at `https://example.com/api` and `https://example.com/uploads`
   - Frontend env: `REACT_APP_API_URL=/api`
   - Backend env: `CORS_ORIGIN=https://example.com`

## Important Project Constraints

These are specific to the current codebase and affect deployment:

- The backend reads and writes files inside `frontend/public/uploads` and also serves fallback assets from `frontend/public`.
- The backend also serves `backend/uploads` for backward compatibility.
- Several frontend files fall back to `http://localhost:5000/api` if `REACT_APP_API_URL` is not set, so production builds must set it explicitly.
- The backend runs `sequelize.sync()` on startup in production. That is convenient, but it is not a replacement for formal migrations.
- Realtime notifications use SSE. If you use a proxy, do not buffer `/api/realtime/stream`.

## Prerequisites

- Node.js 18+ recommended
- MySQL 8+ (required only for production server)
- A production database already created (only for production server)
- A frontend URL and a backend URL decided before building
- Writable persistent storage available to backend process (production server only)

## Backend Deployment

### Choose Your Server

**Production Deployment (Recommended)**
```bash
cd backend
npm ci
npm start
```

**Simple Server Deployment (Staging/Demo)**
```bash
cd backend
npm ci
npm run start:simple
```

**Mock Server Deployment (Development/Testing)**
```bash
cd backend
npm ci
npm run start:mock
```

### Environment Configuration

Start from [backend/.env.example](c:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/.env.example) and use production values.

**Production Server Required Environment Variables:**

```env
NODE_ENV=production
PORT=5000

DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=football_booking
DB_SSL=false

JWT_SECRET=replace_with_a_secure_minimum_32_character_secret
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://app.example.com
FRONTEND_URL=https://app.example.com
APP_TIMEZONE=Asia/Bangkok
```

**Simple Server Environment Variables:**

```env
NODE_ENV=production
PORT=5000

JWT_SECRET=replace_with_a_secure_minimum_32_character_secret
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://app.example.com
FRONTEND_URL=https://app.example.com
APP_TIMEZONE=Asia/Bangkok
```

**Mock Server Environment Variables:**

```env
NODE_ENV=production
PORT=5000

JWT_SECRET=replace_with_a_secure_minimum_32_character_secret
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://app.example.com
FRONTEND_URL=https://app.example.com
APP_TIMEZONE=Asia/Bangkok
```

**Optional Environment Variables (All Servers):**

```env
FOOTBALL_API_KEY=
GOOGLE_CLIENT_ID=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_SECURE=false

INVITATION_EXPIRE_HOURS=168
RATE_LIMITING=true
HTTP_LOGGING=true
LOG_LEVEL=info
DB_LOGGING=false
DB_SYNC_ALTER=false
MAX_FILE_SIZE=5242880
```

### Backend notes

- Health check: `GET /health`
- API root: `GET /`
- Set `CORS_ORIGIN` to the exact frontend origin, or a comma-separated list of allowed origins.
- Set `FRONTEND_URL` correctly or password reset links will point to the wrong site.
- Keep `DB_SYNC_ALTER=false` in production unless you fully understand the schema change risk.

## Frontend Deployment

### Build

```bash
cd frontend
npm ci
npm run build
```

Start from [frontend/.env.example](c:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/frontend/.env.example).

### Required frontend environment variables

For separate frontend and backend domains:

```env
REACT_APP_API_URL=https://api.example.com/api
```

For same-domain reverse proxy:

```env
REACT_APP_API_URL=/api
```

### Optional frontend environment variables

```env
REACT_APP_GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
REACT_APP_GOOGLE_MAPS_API_KEY=
REACT_APP_TIMEZONE=Asia/Bangkok
```

### Frontend notes

- Publish the contents of `frontend/build`.
- Configure SPA routing so unknown routes rewrite to `index.html`.
- Build the frontend only after the final backend URL is known.

## Upload Storage Requirements

This app currently stores uploaded files on the local filesystem.

The backend expects these paths to exist and remain available:

- `frontend/public/uploads`
- `backend/uploads`

Because of that:

- Do not deploy the backend to a read-only filesystem.
- Do not rely on ephemeral storage if you need uploads to survive restarts or redeploys.
- If your platform supports persistent disks, mount one where these upload folders are writable.
- If your platform does not support persistent storage, refactor uploads to object storage before production use.

## Reverse Proxy Notes

If you run frontend and backend on the same domain:

- Serve the React build at `/`
- Proxy `/api` to the backend
- Proxy `/uploads` to the backend
- Preserve long-lived connections for `/api/realtime/stream`
- Avoid proxy buffering on the SSE endpoint

Using the same domain simplifies CORS and lets the frontend use `REACT_APP_API_URL=/api`.

## Deployment Checklist

After deployment, verify:

### Common Verification (All Servers)
1. `GET /health` returns `200 OK`
2. The frontend loads without requests to `localhost`
3. Public pages load without CORS errors
4. Google Sign-In only if `GOOGLE_CLIENT_ID` is configured

### Production Server (`server.js`)
5. Login and registration work with database
6. Uploaded profile images, team logos, and field images are visible after upload
7. Password reset links open production frontend
8. Realtime notifications work if your proxy supports SSE
9. League pages only if `FOOTBALL_API_KEY` is configured
10. Database connections are stable

### Simple Server (`server-simple.js`)
5. Basic authentication works with mock data
6. Mock data loads correctly
7. File uploads simulate properly (if implemented)

### Mock Server (`mock-server.js`)
5. All API endpoints return mock data
6. Authentication flow works end-to-end
7. No backend dependencies required

## Known Caveats In This Repo

- Backend asset paths currently depend on the frontend tree being present at runtime. Deploy the backend from the whole repository, not as an isolated `backend/` artifact without those files.
- Production image uploads are not object-storage-backed yet.
- Production startup still uses `sequelize.sync()`. Back up the database before first deploy.
- Stripe payment code is not deployment-ready yet because `backend/src/controllers/paymentController.js` requires `stripe`.
- `stripe` is not listed in [backend/package.json](c:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/package.json).
- Payment routes are defined in [backend/src/routes/paymentRoutes.js](c:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/src/routes/paymentRoutes.js) but are not mounted in [backend/server.js](c:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/server.js).

## Verification Performed

The following checks passed locally in the current repository:

```bash
cd backend
npm test -- --runInBand

cd ../frontend
npm run build
```

I did not start the production backend in this review because that requires a live MySQL instance and production environment values.
