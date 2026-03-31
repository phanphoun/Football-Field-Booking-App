# Production Checklist & Deployment Steps

**Status:** Pre-Production  
**Last Updated:** March 31, 2026

---

## Critical Fixes Required BEFORE Deployment

### Phase 1: Security Hardening (DO FIRST - 2-3 Hours)

#### ✅ Task 1.1: Remove Exposed Credentials from Git

```bash
# 1. Check if .env is tracked in git
git log --oneline -- backend/.env

# 2. Permanently remove from history (CAREFUL - this rewrites history)
git filter-branch --tree-filter 'rm -f backend/.env' -- --all

# 3. Force push to origin (WARNING: affects all collaborators)
git push origin --force --all
git push origin --force --tags

# 4. Notify team members to re-clone repository

# 5. Revoke all exposed credentials immediately:
# - Generate new JWT_SECRET
# - Regenerate Football API key  
# - Reset Google OAuth credentials
# - Change database passwords
```

#### ✅ Task 1.2: Create Environment Files Template

**File:** `backend/.env.example`

```env
# Backend Configuration
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=football_booking
DB_USER=root
DB_PASSWORD=your_secure_password_here
DB_DIALECT=mysql
DB_SSL=false
DB_LOGGING=false

# JWT Configuration (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_jwt_secret_here_min_32_chars
JWT_EXPIRES_IN=7d

# API Keys (Request from respective services)
FOOTBALL_API_KEY=your_football_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# CORS
CORS_ORIGIN=http://localhost:3000

# Features
RATE_LIMITING=true
HTTP_LOGGING=true
DB_SYNC_ALTER=false
APP_TIMEZONE=Asia/Bangkok

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DESTINATION=uploads/

# Frontend
FRONTEND_URL=http://localhost:3000
API_PROXY_TARGET=http://localhost:5000
```

**File:** `frontend/.env.example`

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_PROXY_TARGET=http://localhost:5000
```

#### ✅ Task 1.3: Update .gitignore

**Add to:** `.gitignore`

```
# Environment variables - NEVER commit these!
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*.local

# Secrets and credentials
secrets/
*.key
*.pem
*.p12

# AWS credentials
~/.aws/
.aws/credentials

# IDE
.vscode/
.idea/
*.swp
*.swo
*.bak
*~

# Node
node_modules/
npm-debug.log
yarn-error.log

# Build outputs
/backend/dist
/backend/build
/frontend/build
/frontend/dist
coverage/

# OS
.DS_Store
Thumbs.db
desktop.ini

# Uploads and logs
uploads/
logs/
*.log

# Testing
.nyc_output/
.jest-cache/
```

---

### Phase 2: Create Deployment Files (2-3 Hours)

#### ✅ Task 2.1: Create Backend Dockerfile

**File:** `backend/Dockerfile`

```dockerfile
# ================== BUILD STAGE ==================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --omit=dev

# ================== RUNTIME STAGE ==================
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl

# Create app directories
RUN mkdir -p uploads && chmod 777 uploads

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY . .

# Copy startup script
COPY scripts/start-backend.sh /start.sh
RUN chmod +x /start.sh

# Health check (required for AWS)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5000}/health || exit 1

EXPOSE ${PORT:-5000}

# Run with startup script
CMD ["/start.sh"]
```

#### ✅ Task 2.2: Create Frontend Dockerfile

**File:** `frontend/Dockerfile`

```dockerfile
# ================== BUILD STAGE ==================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Build optimized production bundle
RUN npm run build

# ================== RUNTIME STAGE ==================
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built frontend
COPY --from=builder /app/build .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

#### ✅ Task 2.3: Create Nginx Configuration

**File:** `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html index.htm;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    gzip_vary on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Cache busting for static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # React SPA routing - send all routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Health check endpoint
    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Hide nginx version
    server_tokens off;
}
```

#### ✅ Task 2.4: Create .dockerignore

**File:** `.dockerignore`

```
node_modules
npm-debug.log
yarn-error.log
.git
.gitignore
README.md
.env
.env.local
.env.*.local
.DS_Store
.vscode
.idea
*.swp
*.swo
coverage
build
dist
.next
.nuxt
.cache
.parcel-cache
.netlify
.vercel
.env*.local
.env
.cache/
.vuepress/dist/
.serverless/
.fusebox/
.dynamodb/
.tern-port
.venv
env/
venv/
```

#### ✅ Task 2.5: Create docker-compose.yml for Local Development

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: football_booking_mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: football_booking
      MYSQL_USER: football_user
      MYSQL_PASSWORD: secure_password_123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: football_booking_backend
    environment:
      NODE_ENV: development
      PORT: 5000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: football_booking
      DB_USER: football_user
      DB_PASSWORD: secure_password_123
      DB_DIALECT: mysql
      JWT_SECRET: development_secret_at_least_32_characters_long
      CORS_ORIGIN: http://localhost:3000
      FOOTBALL_API_KEY: ${FOOTBALL_API_KEY}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
    ports:
      - "5000:5000"
    depends_on:
      mysql:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: football_booking_frontend
    environment:
      REACT_APP_API_URL: http://localhost:5000
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

#### ✅ Task 2.6: Create Backend Startup Script

**File:** `backend/scripts/start-backend.sh`

```bash
#!/bin/bash

set -e  # Exit on error

# Log startup
echo "=== Starting Football Booking Backend ==="
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Database: $DB_HOST:$DB_PORT"

# Wait for database to be ready
DB_READY=0
ATTEMPTS=0
MAX_ATTEMPTS=30

echo "Waiting for database to be ready..."
while [ $DB_READY -eq 0 ] && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  if nc -z $DB_HOST $DB_PORT 2>/dev/null; then
    DB_READY=1
    echo "✅ Database is ready"
  else
    ATTEMPTS=$((ATTEMPTS + 1))
    echo "Database not ready yet... ($ATTEMPTS/$MAX_ATTEMPTS)"
    sleep 2
  fi
done

if [ $DB_READY -eq 0 ]; then
  echo "❌ Database failed to become ready after $MAX_ATTEMPTS attempts"
  exit 1
fi

# Run database migrations if needed
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  node scripts/migrate-to-production.js || true
fi

# Start application
echo "🚀 Starting application..."
exec node server.js
```

---

### Phase 3: Production Configuration (1-2 Hours)

#### ✅ Task 3.1: Create Production Environment File

**File:** `backend/.env.production`

```env
# Production Configuration
NODE_ENV=production
PORT=5000

# Database (AWS RDS)
DB_HOST=football-booking-mysql.xxxxxxxxxxxx.rds.amazonaws.com
DB_PORT=3306
DB_NAME=football_booking_prod
DB_USER=admin
DB_PASSWORD=${DB_PASSWORD}  # To be filled from AWS Secrets Manager
DB_DIALECT=mysql
DB_SSL=true
DB_LOGGING=false

# JWT (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=${JWT_SECRET}  # To be filled from AWS Secrets Manager
JWT_EXPIRES_IN=7d

# API Keys
FOOTBALL_API_KEY=${FOOTBALL_API_KEY}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

# CORS
CORS_ORIGIN=https://yourdomain.com

# Features
RATE_LIMITING=true
HTTP_LOGGING=false
DB_SYNC_ALTER=false
APP_TIMEZONE=Asia/Bangkok
LOG_LEVEL=info

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DESTINATION=/var/uploads

# Frontend
FRONTEND_URL=https://yourdomain.com
API_PROXY_TARGET=https://api.yourdomain.com

# AWS
AWS_REGION=us-east-1
AWS_S3_BUCKET=football-booking-uploads

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
```

#### ✅ Task 3.2: Verify All Services Health

Create health check endpoint test:

**File:** `backend/scripts/health-check.sh`

```bash
#!/bin/bash

echo "Testing health check endpoints..."

# Backend health
echo "Checking backend health..."
curl -f http://localhost:5000/health || {
  echo "❌ Backend health check failed"
  exit 1
}
echo "✅ Backend health check passed"

# API documentation
echo "Checking API documentation..."
curl -f http://localhost:5000/api || {
  echo "❌ API documentation failed"
  exit 1
}
echo "✅ API documentation available"

# Frontend (if available)
echo "Checking frontend..."
curl -f http://localhost:3000 || {
  echo "⚠️  Frontend not available yet"
}

echo "✅ All health checks completed"
```

---

## Pre-Deployment Testing (1-2 Hours)

### ✅ Task 4.1: Local Docker Testing

```bash
# Build images locally
docker-compose build

# Start services
docker-compose up -d

# Wait for services to start
sleep 10

# Run health checks
docker-compose exec backend bash /scripts/health-check.sh

# Check database connectivity
docker-compose exec backend npm run db:migrate

# Run tests
docker-compose exec backend npm test

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

### ✅ Task 4.2: Security Audit

```bash
# Check for vulnerabilities in dependencies
npm audit
npm audit fix

# Check for exposed secrets
git log --all --grep="password\|secret\|key\|token" --oneline

# Scan code for hard-coded credentials
grep -r "password\|secret\|api.key" backend/src --exclude-dir=node_modules

# Verify no console.log in production code
grep -n "console\\.log" backend/src/**/*.js
```

### ✅ Task 4.3: Load Testing

```bash
# Install load testing tool
npm install -g autocannon

# Run load test
autocannon -c 100 -d 30 http://localhost:5000/health

# Expected results:
# - Should handle 100+ concurrent connections
# - Latency < 100ms on average
# - Error rate < 1%
```

---

## AWS Deployment Steps (2-3 Hours)

### ✅ Task 5.1: Build and Push Docker Images

```bash
# Set AWS account and region
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1
export IMAGE_TAG=latest

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Create ECR repositories (if not exists)
aws ecr create-repository --repository-name football-booking-backend --region $AWS_REGION || true
aws ecr create-repository --repository-name football-booking-frontend --region $AWS_REGION || true

# Build and tag images
docker build -t football-booking-backend:${IMAGE_TAG} ./backend
docker build -t football-booking-frontend:${IMAGE_TAG} ./frontend

# Tag for ECR
docker tag football-booking-backend:${IMAGE_TAG} \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/football-booking-backend:${IMAGE_TAG}

docker tag football-booking-frontend:${IMAGE_TAG} \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/football-booking-frontend:${IMAGE_TAG}

# Push to ECR
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/football-booking-backend:${IMAGE_TAG}
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/football-booking-frontend:${IMAGE_TAG}
```

### ✅ Task 5.2: Set Up AWS Infrastructure

Follow detailed steps in [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)

---

## Post-Deployment Verification

### ✅ Task 6.1: Verify All Services Running

```bash
# Check backend health
curl https://api.yourdomain.com/health

# Check API documentation
curl https://api.yourdomain.com/api

# Check frontend
curl https://yourdomain.com/

# Check CloudWatch logs
aws logs tail /football-booking/backend --follow

# Check database
mysql -h your-rds-endpoint -u admin -p -e "SELECT 1;"
```

### ✅ Task 6.2: Verify Backups

```bash
# List RDS backups
aws rds describe-db-snapshots --db-instance-identifier football-booking-mysql

# List S3 backups
aws s3 ls s3://football-booking-backups/uploads/
```

### ✅ Task 6.3: Monitor & Alert Configuration

```bash
# Create SNS topic for alerts
aws sns create-topic --name football-booking-alerts

# Subscribe to alerts
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:football-booking-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

---

## Rollback Plan (In Case of Issues)

```bash
# If deployment fails, rollback to previous version
aws ecs update-service \
  --cluster football-booking-cluster \
  --service football-booking-backend \
  --force-new-deployment \
  --task-definition football-booking-backend:PREVIOUS_REVISION

# Check service status
aws ecs describe-services \
  --cluster football-booking-cluster \
  --services football-booking-backend
```

---

## Completion Checklist

- [ ] All exposed credentials removed from git
- [ ] Docker images built and tested locally
- [ ] Dockerfile and docker-compose.yml created
- [ ] Production environment files created
- [ ] AWS infrastructure provisioned
- [ ] Database migrated and verified
- [ ] Secrets stored in AWS Secrets Manager
- [ ] RDS backups configured
- [ ] ALB and CloudFront configured
- [ ] SSL/TLS certificates installed (ACM)
- [ ] CloudWatch monitoring configured
- [ ] Health checks verified
- [ ] Load testing passed
- [ ] Security audit completed
- [ ] Team trained on deployment process
- [ ] Rollback procedure tested and documented

---

**Estimated Timeline:** 5-7 business days from start to production  
**Estimated AWS Cost:** $200-400/month for recommended setup  
**Recommended Go-Live Time:** Tuesday-Wednesday morning (avoid weekends/holidays)
