# Football Field Booking App - AWS Deployment Guide

This guide walks you through deploying the Football Field Booking App to AWS using **ECS (Elastic Container Service)**, **RDS for MySQL**, **ALB (Application Load Balancer)**, and **S3** for static assets.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS CloudFront (CDN)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌─────────────────────────▼────────────────────────────────────┐
│            Application Load Balancer (ALB)                   │
│  (HTTPS with ACM Certificate, Route 53 DNS)                │
└────┬──────────────────────────────────────────────────┬──────┘
     │                                                   │
┌────▼──────────────────────┐     ┌───────────────────▼──────┐
│  ECS Cluster - Frontend   │     │  ECS Cluster - Backend    │
│  (Fargate, Nginx)         │     │  (Fargate, Node.js)       │
│  (Auto Scaling)           │     │  (Auto Scaling)           │
└───────────────────────────┘     └────────┬──────────────────┘
                                           │
                                  ┌────────▼─────────┐
                                  │  RDS MySQL       │
                                  │  (Multi-AZ)      │
                                  │  (Automated      │
                                  │   backups)       │
                                  └──────────────────┘

                                  ┌──────────────────┐
                                  │  S3 Buckets      │
                                  │  - Uploads       │
                                  │  - Static Files  │
                                  │  - Backups       │
                                  └──────────────────┘

                                  ┌──────────────────┐
                                  │  CloudWatch      │
                                  │  - Logs          │
                                  │  - Metrics       │
                                  │  - Alarms        │
                                  └──────────────────┘
```

## Prerequisites

### AWS Account Setup

1. **Create AWS Account** (if not already done)
2. **Create IAM User** for deployment with permissions:
   - EC2 (for ECS)
   - RDS
   - ALB/ELB
   - CloudWatch
   - IAM (for task roles)
   - S3
   - ECR (Elastic Container Registry)

3. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, Region (e.g., us-east-1), Output format (json)
   ```

### Required Local Tools

```bash
# Docker (for building container images)
# AWS CLI v2
# Git
```

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Navigate to project root
cd c:\Users\PHOUN.PHAN\Football-Field-Booking-App

# Create .env file for production (copy from .env.example)
cp .env.example .env

# Edit .env with your AWS configuration
# Key variables to update:
# - NODE_ENV=production
# - DB_HOST=(your RDS endpoint)
# - JWT_SECRET=(strong random value, min 32 chars)
# - CORS_ORIGIN=https://your-domain.com
# - AWS_REGION, AWS_S3_BUCKET settings
```

### 2. Create ECR Repositories

```bash
# Create repository for backend
aws ecr create-repository \
  --repository-name football-booking-backend \
  --region us-east-1

# Create repository for frontend
aws ecr create-repository \
  --repository-name football-booking-frontend \
  --region us-east-1

# Note the repository URIs for later use
```

### 3. Build and Push Docker Images

```bash
# Set variables
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1
IMAGE_TAG=latest

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build backend image
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/football-booking-backend:$IMAGE_TAG ./backend

# Push backend image
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/football-booking-backend:$IMAGE_TAG

# Build frontend image
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/football-booking-frontend:$IMAGE_TAG ./frontend

# Push frontend image
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/football-booking-frontend:$IMAGE_TAG
```

### 4. Create RDS MySQL Database

**Via AWS Console:**
1. Go to RDS Dashboard
2. Click "Create Database"
3. Select "MySQL 8.0"
4. Configuration:
   - DB Instance Class: `db.t3.small` (for production, scale up as needed)
   - Storage: 20 GB (provisioned)
   - Multi-AZ: Enable for high availability
   - DB Instance Identifier: `football-booking-db`
   - Username: `admin` (change this)
   - Password: (strong password, 16+ chars with mix of types)
   - VPC: Your deployment VPC
   - Security Group: Allow inbound on port 3306 from ECS security group
5. Create database

**Via AWS CLI:**
```bash
aws rds create-db-instance \
  --db-instance-identifier football-booking-db \
  --db-instance-class db.t3.small \
  --engine mysql \
  --engine-version 8.0.28 \
  --master-username admin \
  --master-user-password 'YourStrongPassword123!' \
  --allocated-storage 20 \
  --multi-az \
  --storage-encrypted \
  --backup-retention-period 7 \
  --region us-east-1
```

**After RDS is Ready:**
1. Get the RDS endpoint from AWS Console
2. Create the database schema:
   ```bash
   mysql -h your-rds-endpoint.region.rds.amazonaws.com \
         -u admin -p \
         -e "CREATE DATABASE IF NOT EXISTS football_booking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

### 5. Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster \
  --cluster-name football-booking-cluster \
  --region us-east-1

# Create CloudWatch log group
aws logs create-log-group \
  --log-group-name /ecs/football-booking \
  --region us-east-1
```

### 6. Create Task Execution Role

```bash
# Create IAM role for ECS task execution
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ecs-tasks.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Attach required policies
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
```

### 7. Create Application Load Balancer

```bash
# Get VPC ID
VPC_ID=$(aws ec2 describe-vpcs --query 'Vpcs[0].VpcId' --output text)

# Get Subnet IDs
SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[].SubnetId' \
  --output text | tr '\t' ',')

# Create ALB
ALB_Response=$(aws elbv2 create-load-balancer \
  --name football-booking-alb \
  --subnets $SUBNET_IDS \
  --security-groups sg-xxxxxxxx \
  --scheme internet-facing \
  --type application)

ALB_ARN=$(echo $ALB_Response | jq -r '.LoadBalancers[0].LoadBalancerArn')

# Create target groups
# For Backend API
aws elbv2 create-target-group \
  --name football-booking-backend-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-protocol HTTP \
  --health-check-path /api/health \
  --health-check-interval-seconds 30

# For Frontend
aws elbv2 create-target-group \
  --name football-booking-frontend-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-protocol HTTP \
  --health-check-path /health \
  --health-check-interval-seconds 30
```

### 8. Create Route 53 DNS Record

```bash
# Get your hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name your-domain.com \
  --query 'HostedZones[0].Id' \
  --output text)

# Create alias record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.your-domain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "your-alb-dns.region.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

### 9. Enable HTTPS with ACM Certificate

```bash
# Request ACM certificate
aws acm request-certificate \
  --domain-name app.your-domain.com \
  --domain-name *.app.your-domain.com \
  --validation-method DNS

# Validate certificate in AWS Console (or via CLI)
# Add DNS records as shown in Console

# Once validated, update ALB listener to use HTTPS
CERT_ARN=$(aws acm list-certificates \
  --query 'CertificateSummaryList[0].CertificateArn' \
  --output text)

aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

### 10. Create ECS Task Definitions

See the included `ecs-task-definitions.json` file for detailed task configurations.

```bash
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definitions.json
```

### 11. Create ECS Services

```bash
# Backend service
aws ecs create-service \
  --cluster football-booking-cluster \
  --service-name football-booking-backend \
  --task-definition football-booking-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx, subnet-yyy], securityGroups=[sg-xxx], assignPublicIp=DISABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=5000

# Frontend service
aws ecs create-service \
  --cluster football-booking-cluster \
  --service-name football-booking-frontend \
  --task-definition football-booking-frontend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx, subnet-yyy], securityGroups=[sg-xxx], assignPublicIp=DISABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=frontend,containerPort=80
```

### 12. Setup Auto Scaling

```bash
# Create Auto Scaling target for backend
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/football-booking-cluster/football-booking-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name backend-scaling-policy \
  --service-namespace ecs \
  --resource-id service/football-booking-cluster/football-booking-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }'
```

## Database Initialization

After RDS is created and ECS services are running:

```bash
# SSH into a backend ECS task (or use Fargate exec if enabled)
# Then run database setup
cd backend
npm run db:create
npm run seed  # Optional: seed with demo data
```

## Environment Variables Management

Use AWS Secrets Manager or Parameter Store:

```bash
# Store database password in Secrets Manager
aws secretsmanager create-secret \
  --name football-booking/db-password \
  --secret-string 'your-secure-password'

# Reference in task definition:
# "secrets": [{
#   "name": "DB_PASSWORD",
#   "valueFrom": "arn:aws:secretsmanager:region:account:secret:football-booking/db-password"
# }]
```

## Monitoring and Logs

### CloudWatch

- **Log Group**: `/ecs/football-booking`
- **View Logs**: AWS Console > CloudWatch > Log Groups
- **CLI**: 
  ```bash
  aws logs tail /ecs/football-booking --follow
  ```

### CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name football-booking-backend-high-cpu \
  --alarm-description "Alert when backend CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1

# High memory alarm
aws cloudwatch put-metric-alarm \
  --alarm-name football-booking-backend-high-memory \
  --alarm-description "Alert when backend Memory > 80%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## Backup and Recovery

### RDS Automated Backups

```bash
# Modify RDS to enable backups retention (7 days)
aws rds modify-db-instance \
  --db-instance-identifier football-booking-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --apply-immediately

# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier football-booking-db \
  --db-snapshot-identifier football-booking-db-snapshot-$(date +%Y-%m-%d)
```

### S3 Backup for Uploads

```bash
# Create S3 bucket for backups
aws s3 mb s3://football-booking-backups-$(date +%s) --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket football-booking-backups-$(date +%s) \
  --versioning-configuration Status=Enabled

# Setup S3 lifecycle policy for cost optimization
aws s3api put-bucket-lifecycle-configuration \
  --bucket football-booking-backups \
  --lifecycle-configuration file://s3-lifecycle.json
```

## Security Considerations

1. **VPC Security Groups**: 
   - Only allow ALB traffic to ECS tasks
   - Only allow ECS tasks to RDS on port 3306
   - Only allow internet traffic to ALB on ports 80 and 443

2. **Database Security**:
   - Enable RDS encryption at rest
   - Use parameter groups with strong security settings
   - Regular backups enabled

3. **Container Security**:
   - Use non-root user in containers
   - Scan images for vulnerabilities with ECR scanning
   - Update base images regularly

4. **SSL/TLS**:
   - Use ACM certificates (free renew)
   - Redirect HTTP to HTTPS
   - Use secure cookies

5. **Secrets Management**:
   - Store passwords in AWS Secrets Manager
   - Rotate credentials regularly
   - Use IAM roles instead of API keys

## Scaling Configuration

### Vertical Scaling (Task Size)

```bash
# Update task definition with larger resources
aws ecs update-service \
  --cluster football-booking-cluster \
  --service football-booking-backend \
  --task-definition football-booking-backend:2 \
  --force-new-deployment
```

### Horizontal Scaling

Auto scaling is configured via Application Auto Scaling (see Step 12).

Adjust thresholds in target tracking policies:
```bash
aws application-autoscaling put-scaling-policy \
  --policy-name backend-scaling-policy-updated \
  --service-namespace ecs \
  --resource-id service/football-booking-cluster/football-booking-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 60.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  }'
```

## Cost Optimization

1. **Use Fargate Spot**: For non-critical tasks, use Spot pricing (~70% savings)
   ```bash
   # In task definition, add launchType: FARGATE_SPOT
   ```

2. **Reserved Instances**: For predictable workloads, purchase 1-year or 3-year RDS Reserved Instances

3. **Right-size Resources**: Monitor actual usage and adjust task CPU/memory

4. **Data Transfer**: Minimize costs by using private subnets and VPC endpoints

## Deployment Troubleshooting

### Check ECS Task Status
```bash
aws ecs describe-tasks \
  --cluster football-booking-cluster \
  --tasks arn:aws:ecs:region:account:task/football-booking-cluster/task-id
```

### View Task Logs
```bash
aws logs tail /ecs/football-booking --follow
```

### Update ECS Service
```bash
aws ecs update-service \
  --cluster football-booking-cluster \
  --service football-booking-backend \
  --force-new-deployment
```

## Next Steps

1. Test the application at `https://your-domain.com`
2. Setup CI/CD pipeline (see CI/CD deployment guide)
3. Configure monitoring and alerts
4. Plan for disaster recovery
5. Document runbooks for operations team

For more help, see the main [deployment.md](../deployment.md) guide.
