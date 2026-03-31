# Environment Setup Guide

**Version:** 1.0  
**Last Updated:** March 31, 2026

---

## Development Environment Setup

### Prerequisites

- Node.js 18+ (use NVM for version management)
- MySQL 8.0+
- Docker & Docker Compose (for containerized database)
- Git

### Quick Start

#### 1. Clone Repository

```bash
git clone <your-repo-url>
cd Football-Field-Booking-App
```

#### 2. Backend Setup

```bash
cd backend

# Create .env from template
cp .env.example .env

# Edit .env with local values
nano .env
# Or use VS Code:
code .env
```

#### 3. Frontend Setup

```bash
cd ../frontend

# Create .env from template
cp .env.example .env

# Verify values match backend
cat .env
```

#### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

#### 5. Database Setup (Choose One)

##### Option A: Docker (Recommended)

```bash
# Start MySQL in Docker
docker-compose up -d mysql

# Wait for MySQL to be ready
sleep 10

# Create database and tables
cd backend
npm run db:create
```

##### Option B: Local MySQL

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE football_booking;"

# Run migrations
cd backend
npm run db:migrate
```

### Running Locally

#### Terminal 1: Backend

```bash
cd backend
npm run dev
# Backend runs on http://localhost:5000
```

#### Terminal 2: Frontend

```bash
cd frontend
npm start
# Frontend runs on http://localhost:3000
```

#### Terminal 3 (Optional): Mock Server

```bash
cd backend
npm run dev:mock
# Mock server runs on http://localhost:5000
```

### Testing

```bash
# Backend tests
cd backend
npm test
npm run test:watch

# Frontend tests
cd frontend
npm test

# Run all tests
npm run test:all
```

---

## Production Environment Setup

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Docker installed
- kubectl (if using EKS)

### Environment Variables for Production

Create `backend/.env.production`:

```env
NODE_ENV=production
PORT=5000

# Database
DB_HOST=<RDS_ENDPOINT>
DB_PORT=3306
DB_NAME=football_booking_prod
DB_USER=<ADMIN_USER>
DB_PASSWORD=<FROM_SECRETS_MANAGER>
DB_SSL=true
DB_LOGGING=false

# JWT
JWT_SECRET=<FROM_SECRETS_MANAGER>
JWT_EXPIRES_IN=7d

# API Keys (retrieved from AWS Secrets Manager)
FOOTBALL_API_KEY=<FROM_SECRETS_MANAGER>
GOOGLE_CLIENT_ID=<FROM_SECRETS_MANAGER>
GOOGLE_CLIENT_SECRET=<FROM_SECRETS_MANAGER>

# Frontend
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
API_PROXY_TARGET=https://api.yourdomain.com

# Logging
LOG_LEVEL=info
HTTP_LOGGING=false
DB_LOGGING=false

# Security
RATE_LIMITING=true

# File uploads
MAX_FILE_SIZE=5242880
UPLOAD_DESTINATION=/var/uploads

# AWS
AWS_REGION=us-east-1
AWS_S3_BUCKET=football-booking-uploads

# Monitoring
SENTRY_DSN=<YOUR_SENTRY_DSN>
```

### Database Setup for Production

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier football-booking-mysql \
  --db-instance-class db.t3.small \
  --engine mysql \
  --engine-version 8.0 \
  --master-username admin \
  --master-user-password $(openssl rand -base64 32) \
  --allocated-storage 100 \
  --storage-type gp3 \
  --backup-retention-period 30 \
  --storage-encrypted

# Connect and verify
mysql -h <RDS_ENDPOINT> -u admin -p -e "SELECT 1;"

# Run migrations
NODE_ENV=production node scripts/migrate-to-production.js
```

---

## Docker Environment Setup

### Using Docker Compose (Local)

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v
```

### Environment Variables in Docker

.env variables are automatically passed to containers defined in docker-compose.yml

### Database Initialization in Docker

```bash
# Create tables
docker-compose exec backend npm run db:migrate

# Seed data
docker-compose exec backend npm run seed
```

---

## CI/CD Environment Setup

### GitHub Actions Example

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Security audit
        run: npm audit

  build-and-deploy:
    needs: test
    if: success()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push backend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/football-booking-backend:$IMAGE_TAG ./backend
          docker push $ECR_REGISTRY/football-booking-backend:$IMAGE_TAG
      
      - name: Build and push frontend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/football-booking-frontend:$IMAGE_TAG ./frontend
          docker push $ECR_REGISTRY/football-booking-frontend:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster football-booking-cluster \
            --service football-booking-backend \
            --force-new-deployment
```

---

## Environment Variables Reference

### Backend `.env` Variables

| Variable | Required | Default | Production | Description |
|----------|----------|---------|------------|-------------|
| `NODE_ENV` | Yes | development | production | Environment mode |
| `PORT` | Yes | 5000 | 5000 | Server port |
| `DB_HOST` | Yes | localhost | RDS endpoint | Database host |
| `DB_PORT` | No | 3306 | 3306 | Database port |
| `DB_NAME` | Yes | football_booking | football_booking_prod | Database name |
| `DB_USER` | Yes | root | admin | Database user |
| `DB_PASSWORD` | Yes | (empty) | Secrets Manager | Database password |
| `DB_SSL` | No | false | true | Enable SSL for DB |
| `DB_LOGGING` | No | false | false | Log SQL queries |
| `JWT_SECRET` | Yes | (generate) | Secrets Manager | JWT signing key (min 32 chars) |
| `JWT_EXPIRES_IN` | No | 7d | 7d | JWT expiration |
| `FOOTBALL_API_KEY` | No | (none) | Secrets Manager | Football data API key |
| `GOOGLE_CLIENT_ID` | No | (none) | Secrets Manager | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | (none) | Secrets Manager | Google OAuth secret |
| `CORS_ORIGIN` | No | localhost:3000 | yourdomain.com | Frontend URL for CORS |
| `RATE_LIMITING` | No | true | true | Enable rate limiting |
| `HTTP_LOGGING` | No | true | false | Log HTTP requests |
| `LOG_LEVEL` | No | dev | info | Logging level |
| `APP_TIMEZONE` | No | Asia/Bangkok | Asia/Bangkok | Application timezone |
| `MAX_FILE_SIZE` | No | 5242880 | 5242880 | Max upload size (bytes) |
| `UPLOAD_DESTINATION` | No | uploads/ | /var/uploads | Upload directory |

### Frontend `.env` Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_API_URL` | No | http://localhost:5000 | Backend API URL |
| `REACT_APP_API_PROXY_TARGET` | No | http://localhost:5000 | Proxy target for development |

---

## AWS Secrets Manager Setup

Store sensitive credentials in AWS Secrets Manager instead of .env files:

```bash
# Prerequisites: AWS CLI configured

# Store database credentials
aws secretsmanager create-secret \
  --name football-booking/db \
  --secret-string '{
    "host": "football-booking-mysql.xxxx.rds.amazonaws.com",
    "port": 3306,
    "database": "football_booking_prod",
    "username": "admin",
    "password": "your-secure-password"
  }'

# Store API keys
aws secretsmanager create-secret \
  --name football-booking/api-keys \
  --secret-string '{
    "jwt_secret": "your-jwt-secret-32-chars-min",
    "football_api_key": "your-api-key",
    "google_client_id": "your-client-id",
    "google_client_secret": "your-client-secret"
  }'

# Retrieve secrets (in application)
aws secretsmanager get-secret-value \
  --secret-id football-booking/db \
  --query SecretString \
  --output text
```

**Use in Node.js:**

```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecrets(secretName) {
  try {
    const result = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    return JSON.parse(result.SecretString);
  } catch (error) {
    console.error('Failed to retrieve secret:', error);
    throw error;
  }
}

// Usage
const dbSecrets = await getSecrets('football-booking/db');
process.env.DB_HOST = dbSecrets.host;
process.env.DB_USER = dbSecrets.username;
```

---

## Troubleshooting Environment Setup

### Issue: "Cannot find module 'dotenv'"

```bash
npm install dotenv
```

### Issue: "EADDRINUSE: address already in use :::5000"

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Issue: "connect ECONNREFUSED 127.0.0.1:3306"

```bash
# Check MySQL is running
mysql.server status

# Or using Docker
docker-compose ps

# Start MySQL if needed
docker-compose up -d mysql
```

### Issue: "Error: JWT_SECRET must be at least 32 characters"

```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env
JWT_SECRET=<generated-secret>
```

---

## Environment Variables Validation

The application validates required environment variables on startup. Missing variables will cause the server to exit:

```
Error: Missing required environment variables: NODE_ENV, PORT, JWT_SECRET, DB_HOST, DB_NAME, DB_USER
```

To fix, ensure all required variables are set in `.env`:

```bash
# Required variables
NODE_ENV=development
PORT=5000
JWT_SECRET=<32-char-minimum-secret>
DB_HOST=localhost
DB_NAME=football_booking
DB_USER=root
JWT_SECRET=<your-secret>
```

---

## Local Development Best Practices

1. **Always use `.env` for local development**
   - Never hardcode credentials in code
   - Use .env.example as template
   - Add .env to .gitignore

2. **Keep .env.example updated**
   - Add new variables promptly
   - Document each variable's purpose

3. **Use different databases for testing**
   - Development: `football_booking`
   - Testing: `football_booking_test`
   - Production: `football_booking_prod`

4. **Rotate secrets regularly**
   - Change JWT_SECRET monthly
   - Regenerate API keys quarterly
   - Audit access logs

5. **Never commit sensitive files**
   - .env files
   - Private keys (.pem, .key)
   - Google credentials JSON
   - AWS configuration files

---

For more information, see:
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)
- [SECURITY_HARDENING.md](SECURITY_HARDENING.md)
