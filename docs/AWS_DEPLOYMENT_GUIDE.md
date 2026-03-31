# AWS Deployment Guide - Football Field Booking App

**Version:** 2.0  
**Last Updated:** March 31, 2026  
**Target:** AWS (EC2, RDS, S3, CloudFront, ECR)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Database Setup](#database-setup)
5. [Secrets Management](#secrets-management)
6. [Auto-Scaling & Load Balancing](#auto-scaling--load-balancing)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Disaster Recovery](#backup--disaster-recovery)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### AWS Account Setup
```bash
# Required AWS Services:
- IAM (for credentials and permissions)
- EC2 (for compute)
- RDS (for managed MySQL database)
- ECR (for Docker image registry)
- ECS (for container orchestration) OR EKS (for Kubernetes)
- ALB (Application Load Balancer)
- CloudFront (CDN)
- S3 (for file uploads)
- CloudWatch (for logging & monitoring)
- Secrets Manager (for credential management)
- VPC (for networking)
```

### Local Requirements
```bash
# Install these tools:
- AWS CLI v2+
- Docker Desktop
- kubectl (if using EKS)
- Terraform (optional, but recommended)

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1 recommended)

# Verify setup
aws sts get-caller-identity
```

---

## Architecture Overview

### Recommended Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CloudFront (CDN)                     │
│                   (Cache static frontend assets)              │
└────────────────────────────────────────────────────────────┐
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           Application Load Balancer (ALB)                    │
│      (Route traffic to backend EC2 instances)                │
└──────────────────────────────────────────────────────────────┘
              │                             │
              ▼                             ▼
        ┌─────────┐                   ┌─────────┐
        │   EC2   │                   │   EC2   │
        │ Backend │                   │ Backend │
        │ (Docker)│                   │ (Docker)│
        └────┬────┘                   └────┬────┘
             │                             │
             └─────────────┬───────────────┘
                           ▼
                    ┌──────────────┐
                    │   RDS MySQL  │
                    │  (Managed DB)│
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  S3 Uploads  │
                    │   (Backups)  │
                    └──────────────┘
```

---

## Step-by-Step Deployment

### Phase 1: Prepare Docker Images

#### Step 1.1: Create Dockerfile for Backend

**File:** `backend/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --omit=dev

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy node_modules and app code from builder
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Create upload directory
RUN mkdir -p uploads && chmod 777 uploads

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/health || exit 1

# Expose port
EXPOSE ${PORT:-5000}

# Start application
CMD ["node", "server.js"]
```

#### Step 1.2: Create Dockerfile for Frontend

**File:** `frontend/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy built app
COPY --from=builder /app/build .

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Step 1.3: Create Nginx Configuration

**File:** `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # API proxy (if needed for development)
    location /api/ {
        proxy_pass ${API_PROXY_TARGET}/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Step 1.4: Build Docker Images

```bash
# Build backend image
cd backend
docker build -t football-booking-backend:latest \
  --build-arg PORT=5000 .

# Build frontend image
cd ../frontend
docker build -t football-booking-frontend:latest .

# Tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker tag football-booking-backend:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/football-booking-backend:latest

docker tag football-booking-frontend:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/football-booking-frontend:latest

# Push to ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/football-booking-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/football-booking-frontend:latest
```

---

### Phase 2: Set Up AWS Infrastructure

#### Step 2.1: Create RDS MySQL Database

```bash
# Create security group for RDS
aws ec2 create-security-group \
  --group-name rds-football-booking-sg \
  --description "Security group for RDS MySQL" \
  --vpc-id vpc-xxxxx

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier football-booking-mysql \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0.35 \
  --master-username admin \
  --master-user-password $(openssl rand -base64 32) \
  --allocated-storage 100 \
  --storage-type gp3 \
  --enable-cloudwatch-logs-exports error,general,slowquery \
  --backup-retention-period 30 \
  --storage-encrypted \
  --enable-iam-database-authentication \
  --publicly-accessible false

# Wait for instance to be available
aws rds wait db-instance-available \
  --db-instance-identifier football-booking-mysql

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier football-booking-mysql \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

#### Step 2.2: Create EC2 Instances

```bash
# Create auto-scaling group for backend

# 1. Create launch template
aws ec2 create-launch-template \
  --launch-template-name football-booking-backend \
  --version-description "Backend servers" \
  --launch-template-data '{
      "ImageId": "ami-0c55b159cbfafe1f0",
      "InstanceType": "t3.medium",
      "SecurityGroupIds": ["sg-xxxxx"],
      "UserData": "IyEvYmluL2Jhc2gKYXB0IHVwZGF0ZQphcHQgaW5zdGFsbCAteSBkb2NrZXIuaW8K..."
    }'

# 2. Create auto-scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name football-booking-asg \
  --launch-template LaunchTemplateName=football-booking-backend \
  --min-size 2 \
  --max-size 6 \
  --desired-capacity 2 \
  --target-group-arns arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/football-booking/...
```

#### Step 2.3: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name football-booking-alb \
  --subnets subnet-xxxxx subnet-xxxxx \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application

# Create target group for backend
aws elbv2 create-target-group \
  --name football-booking-backend \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxxxx \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 10 \
  --matcher HttpCode=200

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

---

#### Step 2.4: Set Up CloudFront CDN

```bash
# Create CloudFront distribution for frontend
aws cloudfront create-distribution \
  --distribution-config '{
      "CallerReference": "'$(date +%s)'",
      "Comment": "Football Booking App Frontend",
      "DefaultRootObject": "index.html",
      "Origins": {
        "Quantity": 1,
        "Items": [{
          "Id": "alb",
          "DomainName": "d1234.cloudfront.net",
          "CustomOriginConfig": {
            "HTTPPort": 80,
            "OriginProtocolPolicy": "http-only"
          }
        }]
      },
      "DefaultCacheBehavior": {
        "TargetOriginId": "alb",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
      },
      "Enabled": true
    }'
```

---

### Phase 3: Set Up Secrets Management

#### Step 3.1: Store Secrets in AWS Secrets Manager

```bash
# Store database credentials
aws secretsmanager create-secret \
  --name football-booking/db \
  --secret-string '{
    "host": "football-booking-mysql.xxxx.rds.amazonaws.com",
    "port": 3306,
    "database": "football_booking",
    "username": "admin",
    "password": "your-secure-password-here"
  }'

# Store API keys
aws secretsmanager create-secret \
  --name football-booking/api-keys \
  --secret-string '{
    "jwt_secret": "your-jwt-secret-at-least-32-chars",
    "football_api_key": "your-football-data-api-key",
    "google_client_id": "your-google-client-id",
    "google_client_secret": "your-google-client-secret"
  }'

# Store external service credentials
aws secretsmanager create-secret \
  --name football-booking/external-services \
  --secret-string '{
    "email_service": "your-email-service-key",
    "payment_service": "your-payment-key"
  }'
```

#### Step 3.2: Update Environment Variables from Secrets

**Generate startup script for EC2:**

**File:** `scripts/start-backend.sh`

```bash
#!/bin/bash
set -e

# Fetch secrets from AWS Secrets Manager
export DB_CREDENTIALS=$(aws secretsmanager get-secret-value \
  --secret-id football-booking/db \
  --query SecretString \
  --output text)

export API_KEYS=$(aws secretsmanager get-secret-value \
  --secret-id football-booking/api-keys \
  --query SecretString \
  --output text)

# Parse JSON and set environment variables
export DB_HOST=$(echo $DB_CREDENTIALS | jq -r '.host')
export DB_USER=$(echo $DB_CREDENTIALS | jq -r '.username')
export DB_PASSWORD=$(echo $DB_CREDENTIALS | jq -r '.password')
export DB_NAME=$(echo $DB_CREDENTIALS | jq -r '.database')

export JWT_SECRET=$(echo $API_KEYS | jq -r '.jwt_secret')
export FOOTBALL_API_KEY=$(echo $API_KEYS | jq -r '.football_api_key')
export GOOGLE_CLIENT_ID=$(echo $API_KEYS | jq -r '.google_client_id')

# Start application
exec node server.js
```

---

### Phase 4: Database Migration & Setup

#### Step 4.1: Create Migration Script

**File:** `backend/scripts/migrate-to-production.js`

```javascript
require('dotenv').config();
const { sequelize } = require('../src/models');

const migrate = async () => {
  try {
    console.log('🔄 Starting database migration...');

    // Authenticate
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Sync schema (non-destructive in production)
    console.log('📝 Synchronizing schema...');
    await sequelize.sync({ alter: false });
    console.log('✅ Schema synchronized');

    // Run any data migrations here
    console.log('📦 Running data migrations...');
    // Add your migration logic here

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrate();
```

#### Step 4.2: Running Migrations

```bash
# SSH into EC2 and run migrations
ssh -i your-key.pem ec2-user@your-instance-ip

# Inside EC2
cd /app
npm install
DB_HOST=your-rds-endpoint node scripts/migrate-to-production.js
```

---

## Database Setup

### Create `.env.production` Template

**File:** `backend/.env.production`

```env
# Application
NODE_ENV=production
PORT=5000

# Database (from RDS)
DB_HOST=football-booking-mysql.xxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=football_booking
DB_USER=admin
DB_PASSWORD=<FETCH_FROM_SECRETS_MANAGER>
DB_DIALECT=mysql
DB_SSL=true

# JWT
JWT_SECRET=<FETCH_FROM_SECRETS_MANAGER>
JWT_EXPIRES_IN=7d

# API Keys
FOOTBALL_API_KEY=<FETCH_FROM_SECRETS_MANAGER>
GOOGLE_CLIENT_ID=<FETCH_FROM_SECRETS_MANAGER>
GOOGLE_CLIENT_SECRET=<FETCH_FROM_SECRETS_MANAGER>

# Frontend
CORS_ORIGIN=https://yourdomain.com
API_PROXY_TARGET=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Features
RATE_LIMITING=true
HTTP_LOGGING=true
DB_LOGGING=false
LOG_LEVEL=info
APP_TIMEZONE=Asia/Bangkok

# File uploads
MAX_FILE_SIZE=5242880
UPLOAD_DESTINATION=/var/uploads

# AWS
AWS_REGION=us-east-1
AWS_S3_BUCKET=football-booking-uploads
AWS_S3_REGION=us-east-1

# Monitoring
SENTRY_DSN=<YOUR_SENTRY_DSN>
```

---

## Secrets Management

### AWS Secrets Manager Best Practices

```bash
# Rotate secrets regularly
aws secretsmanager rotate-secret \
  --secret-id football-booking/db \
  --rotation-rules AutomaticallyAfterDays=30

# Access secrets securely from EC2
aws secretsmanager get-secret-value \
  --secret-id football-booking/db \
  --region us-east-1
```

---

## Auto-Scaling & Load Balancing

### Scaling Policies

```bash
# CPU-based auto scaling
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name football-booking-asg \
  --policy-name cpu-scale-up \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    },
    "ScaleOutCooldown": 300,
    "ScaleInCooldown": 300
  }'

# Request count-based scaling
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name football-booking-asg \
  --policy-name request-scale-up \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "TargetValue": 1000.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ALBRequestCountPerTarget"
    }
  }'
```

---

## Monitoring & Logging

### CloudWatch Configuration

```bash
# Create log group
aws logs create-log-group --log-group-name /football-booking/backend

# Create metric alarm
aws cloudwatch put-metric-alarm \
  --alarm-name football-booking-cpu \
  --alarm-description "Alert if CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alert-topic
```

### Application Logging (Recommended)

Install Winston logger:

```bash
npm install winston
```

**File:** `backend/src/utils/logger.js`

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'football-booking-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

---

## Backup & Disaster Recovery

### Automated RDS Backups

```bash
# Enable automated backups (already done with retention-period param)
aws rds modify-db-instance \
  --db-instance-identifier football-booking-mysql \
  --backup-retention-period 30 \
  --prefer-backup-window "03:00-04:00"

# Create manual backup
aws rds create-db-snapshot \
  --db-instance-identifier football-booking-mysql \
  --db-snapshot-identifier football-booking-backup-$(date +%Y%m%d-%H%M%S)

# List backups
aws rds describe-db-snapshots \
  --db-instance-identifier football-booking-mysql
```

### S3 Upload Backups

```bash
# Sync uploads to S3 daily
aws s3 sync /var/uploads s3://football-booking-backups/uploads/ \
  --delete \
  --storage-class GLACIER
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Fails

```bash
# Check RDS security group
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Test connection
mysql -h football-booking-mysql.xxxx.rds.amazonaws.com \
  -u admin -p \
  -e "SELECT 1;"
```

#### 2. High CPU Usage

```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-xxxxx \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum
```

#### 3. Slow API Responses

```bash
# Check application logs
aws logs tail /football-booking/backend --follow

# Analyze slow queries
SHOW SLOW QUERY LOG;
SHOW VARIABLES LIKE 'long_query_time';
```

---

## Post-Deployment Checklist

- [ ] All secrets stored in AWS Secrets Manager
- [ ] Database backup configured with 30-day retention
- [ ] SSL/TLS certificates installed (use ACM)
- [ ] CloudFront CDN distribution active
- [ ] CloudWatch alarms configured
- [ ] Auto-scaling policies tested
- [ ] Load testing completed (1000+ concurrent users)
- [ ] Monitoring dashboards created
- [ ] Disaster recovery procedure tested
- [ ] Database migration verified
- [ ] Frontend assets cached properly
- [ ] CORS properly configured
- [ ] Health check endpoints responding
- [ ] Rate limiting tested

---

## Cost Estimation (Monthly - AWS)

| Service | Instance | Cost |
|---------|----------|------|
| RDS MySQL | db.t3.micro | $28 |
| EC2 t3.medium | 2 instances | $65 |
| ALB | 1 ALB | $22 |
| CloudFront | ~1TB data | $85 |
| Data transfer | Out | Variable |
| **Total Estimate** | | **$200-400** |

---

**For additional support, refer to:**
- AWS Documentation: https://docs.aws.amazon.com
- Docker Guide: https://docs.docker.com
- Node.js Best Practices: https://nodejs.org/en/docs/guides/production-best-practices/
