# 🚀 Quick Start Guide - After Critical Fixes

This guide helps you start the application after implementing the 4 critical fixes.

---

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development without Docker)
- Git

---

## Option 1: Using Docker (Recommended)

### Start Everything with One Command

```bash
# Clone and navigate
git clone <your-repo-url>
cd Football-Field-Booking-App

# Start all services (MySQL, Backend, Frontend)
docker-compose up -d

# Wait ~30 seconds for services to start
sleep 30

# View logs (in another terminal)
docker-compose logs -f backend

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# API Docs: http://localhost:5000/api
```

### Stop Services

```bash
docker-compose down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Just frontend
docker-compose logs -f frontend

# Just database
docker-compose logs -f mysql
```

### Rebuild Images

```bash
# If you changed code
docker-compose build
docker-compose up -d
```

---

## Option 2: Local Development (Without Docker)

### Setup Backend

```bash
cd backend

# Create environment file
cp .env.example .env

# Edit .env with your values (database, API keys)
nano .env

# Install dependencies
npm install

# Start MySQL locally (requires MySQL 8.0+ installed)
# On macOS: mysql.server start
# On Linux: sudo systemctl start mysql

# Run server
npm run dev

# Backend is now running on http://localhost:5000
```

### Setup Frontend (New Terminal)

```bash
cd frontend

# Create environment file
cp .env.example .env

# Install dependencies
npm install

# Start frontend
npm start

# Frontend is now running on http://localhost:3000
```

---

## Verify Everything Works

### Test Backend Health

```bash
curl http://localhost:5000/health
# Response: {"status":"OK","timestamp":"...","uptime":...,"environment":"development","version":"2.0.0"}
```

### Test API

```bash
curl http://localhost:5000/api
# Response: {"message":"Football Field Booking API","version":"2.0.0",...}
```

### Test Frontend

Open browser:
```
http://localhost:3000
```

---

## Common Issues

### Issue: Port Already in Use

```bash
# Kill process using port 5000
lsof -i :5000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Issue: Database Connection Error

```bash
# Check if MySQL is running
mysql -u root -e "SELECT 1;"

# Or with Docker
docker-compose logs mysql

# Restart MySQL
docker-compose down mysql
docker-compose up -d mysql
sleep 10
```

### Issue: Out of Memory

```bash
# Docker uses limited memory
# Increase Docker Desktop memory in Settings > Resources
```

### Issue: Cannot Connect to Frontend API

Check `.env` files:
```bash
# backend/.env should have:
CORS_ORIGIN=http://localhost:3000

# frontend/.env should have:
REACT_APP_API_URL=http://localhost:5000
```

---

## Development Workflow

### Making Code Changes

With `npm run dev` or Docker, file changes automatically reload:

1. Edit backend code → `npm run dev` auto-restarts
2. Edit frontend code → Frontend hot-reloads
3. Edit database models → Restart backend

### Running Tests

```bash
# Backend tests
cd backend
npm test
npm run test:watch

# Frontend tests
cd frontend
npm test
```

---

## Next Steps for Production

After you verify everything works locally:

1. **Rotate Credentials** (if not done yet)
   ```bash
   # See: URGENT_CREDENTIAL_CLEANUP.md
   ```

2. **Build Production Images**
   ```bash
   docker build -t football-booking-backend ./backend
   docker build -t football-booking-frontend ./frontend
   ```

3. **Deploy to AWS**
   ```bash
   # See: docs/AWS_DEPLOYMENT_GUIDE.md
   # See: docs/DEPLOYMENT_CHECKLIST.md
   ```

---

## Database Management

### View Database

```bash
mysql -h 127.0.0.1 -u root football_booking
```

### Run Migrations

With Docker:
```bash
docker-compose exec backend npm run db:migrate
```

Locally:
```bash
cd backend
npm run db:migrate
```

### Seed Demo Data

```bash
docker-compose exec backend npm run seed
# Or locally:
cd backend && npm run seed
```

---

## Monitoring

### View Application Logs

```bash
# Docker logs
docker-compose logs -f

# Or local logs
tail -f backend/logs/combined-*.log
```

### Check Health Status

```bash
# Backend
curl http://localhost:5000/health

# Frontend
curl http://localhost:3000/health
```

---

## Documentation

- 📖 [Production Audit Report](docs/PRODUCTION_AUDIT_REPORT.md)
- 🔧 [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)
- ☁️ [AWS Deployment Guide](docs/AWS_DEPLOYMENT_GUIDE.md)
- 🔒 [Security Hardening](docs/SECURITY_HARDENING.md)
- 📝 [Environment Setup](docs/ENVIRONMENT_SETUP.md)
- 📊 [Monitoring & Logging](docs/MONITORING_LOGGING.md)

---

## Need Help?

1. Check the documentation files above
2. Review the logs: `docker-compose logs -f`
3. Check `.env` configuration
4. Ensure all services are running: `docker-compose ps`

---

**Ready to deploy? Follow:** [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)
