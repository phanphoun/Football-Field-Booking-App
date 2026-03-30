# Quick Start: AWS Deployment

This guide provides the fastest path to deploying the Football Field Booking App to AWS.

## 30-Minute Quick Start

### Step 1: Prerequisites (5 min)

1. **AWS Account**: [Create one here](https://aws.amazon.com/getting-started/)
2. **Local tools**: 
   ```bash
   # Windows PowerShell
   # Install Docker Desktop from: https://www.docker.com/products/docker-desktop
   # Install AWS CLI v2 from: https://aws.amazon.com/cli/
   # Install Git from: https://git-scm.com/
   # Install Node.js 18+ from: https://nodejs.org/
   ```

3. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter your AWS Access Key, Secret Key, Region (e.g., us-east-1), and format (json)
   ```

### Step 2: Create Environment File (2 min)

```bash
# In project root
cp .env.example .env

# Edit .env with your values (minimum required):
# NODE_ENV=production
# JWT_SECRET=your-32-character-minimum-secret-key
# CORS_ORIGIN=https://your-domain.com
# DB_HOST=your-rds-endpoint.xx.rds.amazonaws.com
# DB_PASSWORD=your_strong_password
```

### Step 3: Run Automated Setup (15 min)

```bash
# Navigate to project root
cd Football-Field-Booking-App

# Run the deployment helper script
bash scripts/deploy.sh full-setup

# This will:
# ✓ Check prerequisites
# ✓ Create ECR repositories
# ✓ Build Docker images
# ✓ Push images to AWS
# ✓ Create ECS cluster and logs
```

### Step 4: Create RDS Database (10 min)

**Option A: AWS Console (Easiest)**
1. Go to [RDS Dashboard](https://console.aws.amazon.com/rds/) in AWS Console
2. Click "Create database"
3. Select **MySQL 8.0**
4. Configuration preset: **Free tier** (for development) or **Production** (for production)
5. Set DB identifier: `football-booking-db`
6. Set Master username: `admin`
7. Set strong password (save this!)
8. VPC: Select default VPC
9. Enable "Public access" (only for testing; disable for production)
10. Click "Create database"
11. Wait ~5-10 minutes for creation
12. Get the endpoint from the "Connectivity & security" tab

**Option B: Using Automated Script**
```bash
# After RDS created and running
DB_HOST=your-rds-endpoint \
DB_PASSWORD=your_password \
bash scripts/setup-db.sh
```

### Step 5: Deploy ECS Services (10 min)

Via AWS Console:
1. Go to [ECS Cluster](https://console.aws.amazon.com/ecs/) dashboard
2. Select `football-booking-cluster`
3. Click "Create service"
4. **Create Backend Service**:
   - Task definition: `football-booking-backend:1`
   - Service name: `football-booking-backend`
   - Desired count: 2
   - Launch type: FARGATE
   - Network: Default VPC, subnets, security group
   - Load balancer: Select ALB (or create new)
   - Target group: `football-booking-backend-tg`
   - Click "Create service"

5. **Create Frontend Service** (repeat steps):
   - Task definition: `football-cooking-frontend:1`
   - Service name: `football-booking-frontend`
   - Same network and ALB setup

### Step 6: Create Application Load Balancer (5 min)

```bash
# Get your VPC ID
aws ec2 describe-vpcs --query 'Vpcs[0].VpcId' --output text

# Create ALB (replace VPC-ID, SUBNET-IDs)
aws elbv2 create-load-balancer \
  --name football-booking-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --scheme internet-facing \
  --type application

# Note the ALB DNS name from output
```

### Step 7: Setup DNS (5 min)

```bash
# If using Route 53
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.example.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "football-booking-alb-123456.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

### Step 8: Test the Application (5 min)

```bash
# Get ALB URL or your custom domain
# Open in browser: http://your-alb-dns.amazonaws.com
# Test:
# 1. Register a new user
# 2. Create a field
# 3. Make a booking
# 4. Check CloudWatch logs for errors
```

## Common Issues & Solutions

### Issue: Docker build fails
```bash
# Solution: Rebuild without cache
docker build --no-cache -t image:tag ./backend
```

### Issue: Database connection error
```bash
# Solution: Check security group allows inbound on port 3306
# Go to RDS > Instance > Security group > Inbound rules
# Add rule: Type=MySQL/Aurora, Port=3306, Source=0.0.0.0/0 (or your IP)
```

### Issue: ECS task keeps failing
```bash
# Solution: Check CloudWatch logs
aws logs tail /ecs/football-booking --follow
```

### Issue: Frontend can't find backend API
```bash
# Solution: Ensure REACT_APP_API_URL environment variable set
# In ECS task definition, check frontend container env vars
```

## Cost Estimation

**Monthly costs (US East 1)**:
- ECS Fargate: ~$20-40 (2 tasks, small CPU/memory)
- RDS MySQL: ~$30-50 (db.t3.small, free tier if under 750 hrs)
- ALB: ~$16 + data processing
- Data transfer: ~$5-20
- **Total: ~$70-130/month for small deployment**

Use AWS's [Cost Calculator](https://calculator.aws/) for accurate estimates.

## Production Checklist

- [ ] HTTPS enabled via ACM certificate
- [ ] RDS backup retention set to 7+ days
- [ ] CloudWatch alarms configured
- [ ] Auto-scaling policies active
- [ ] Security groups follow least privilege
- [ ] Database encrypted at rest
- [ ] Application logs aggregated and retained
- [ ] Disaster recovery procedure documented

## Next Steps

For detailed information:
- See [AWS-DEPLOYMENT.md](./AWS-DEPLOYMENT.md) for comprehensive guide
- See [AWS-DEPLOYMENT-CHECKLIST.md](./AWS-DEPLOYMENT-CHECKLIST.md) for verification
- See [deployment.md](./deployment.md) for application-level config

## Support

**Need help?**
- Check CloudWatch logs: `aws logs tail /ecs/football-booking --follow`
- Review task status: `aws ecs describe-tasks --cluster football-booking-cluster --region us-east-1`
- AWS docs: https://docs.aws.amazon.com/ecs/
- Chat with AWS Support (if you have support plan)

## Health Check

After deployment, verify everything is working:

```bash
# Check ECS services
aws ecs describe-services \
  --cluster football-booking-cluster \
  --services football-booking-backend football-booking-frontend

# Check ALB targets
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:...

# Check RDS connection
mysql -h your-rds-endpoint -u admin -p

# View application logs
aws logs tail /ecs/football-booking --follow --lines 50
```

---

**Problems?** 
1. Check the detailed [AWS-DEPLOYMENT.md](./AWS-DEPLOYMENT.md)
2. Review your environment variables
3. Verify all prerequisites are installed
4. Check AWS CloudWatch logs for specific errors

Good luck with your deployment! 🚀
