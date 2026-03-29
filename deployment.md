# Deployment Guide

## Overview

This project is a split deployment:

- `frontend/`: React app built to static files
- `backend/`: Express API
- Database: MySQL
- Realtime: Server-Sent Events at `/api/realtime/stream`
- File uploads: stored on the server filesystem

The backend does **not** serve the React build. In production, deploy the frontend and backend as separate services, or place them behind a reverse proxy on the same domain.

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
- MySQL 8+ recommended
- A production database already created
- A frontend URL and a backend URL decided before building
- Writable persistent storage available to the backend process

## Backend Deployment

### Build and start

```bash
cd backend
npm ci
npm start
```

Start from [backend/.env.example](c:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/.env.example) and use production values.

### Required backend environment variables

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

### Optional backend environment variables

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

1. `GET /health` returns `200 OK`
2. The frontend loads without requests to `localhost`
3. Login and registration work
4. Uploaded profile images, team logos, and field images are visible after upload
5. Password reset links open the production frontend
6. Public pages load without CORS errors
7. Realtime notifications work if your proxy supports SSE
8. League pages only if `FOOTBALL_API_KEY` is configured
9. Google Sign-In only if `GOOGLE_CLIENT_ID` is configured

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
