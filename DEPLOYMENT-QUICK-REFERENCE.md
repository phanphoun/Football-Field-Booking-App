# AWS Deployment - Quick Reference Card

**Print this or bookmark for quick access during deployment**

---

## 📍 START HERE

**File**: [AWS-DEPLOYMENT-GUIDE-INDEX.md](./AWS-DEPLOYMENT-GUIDE-INDEX.md)

---

## 🚀 THREE DEPLOYMENT PATHS

### ⚡ Path 1: Fast (30 min)
```bash
bash scripts/deploy.sh full-setup
```
👉 [AWS-QUICK-START.md](./AWS-QUICK-START.md)

### 📖 Path 2: Detailed (2 hrs)
👉 [AWS-DEPLOYMENT.md](./AWS-DEPLOYMENT.md)

### 🤖 Path 3: CI/CD (Auto)
👉 [GITHUB-ACTIONS-SETUP.md](./GITHUB-ACTIONS-SETUP.md)

---

## 📋 SETUP CHECKLIST

```
Prerequisites:
□ AWS Account
□ AWS CLI installed
□ Docker installed
□ Git configured
□ .env file created from .env.example

Infrastructure:
□ ECR repositories created
□ Docker images built & pushed
□ ECS cluster created
□ RDS database created
□ ALB configured
□ DNS records added
□ SSL certificate provisioned

Verification:
□ Application loads
□ Tests passing
□ Logs in CloudWatch
□ Auto-scaling active
□ Backups running
```

---

## 🔑 KEY FILES

| File | Purpose |
|------|---------|
| `.env.example` | Environment template |
| `docker-compose.yml` | Local testing |
| `Dockerfile` | Container images |
| `ecs-*-task-definition.json` | ECS config |
| `.github/workflows/deploy.yml` | CI/CD |
| `scripts/deploy.sh` | Automation |

---

## ⚙️ ESSENTIAL COMMANDS

```bash
# Configure AWS
aws configure

# Local testing
docker-compose up

# Validate infrastructure
bash scripts/validate-aws.sh

# View logs
aws logs tail /ecs/football-booking --follow

# Check services
aws ecs describe-services \
  --cluster football-booking-cluster \
  --services football-booking-backend

# Deploy new version
bash scripts/deploy.sh build-push
```

---

## 🔒 SECURITY REMINDERS

✅ Never commit `.env` file  
✅ Use strong JWT_SECRET (32+ chars)  
✅ Enable RDS Multi-AZ  
✅ Use HTTPS everywhere  
✅ Rotate secrets regularly  
✅ Monitor CloudWatch logs  
✅ Enable automated backups  

---

## 🆘 TROUBLESHOOTING

**Port conflicts?**
```bash
lsof -ti:80 | xargs kill -9
```

**DB connection error?**
- Check RDS security group
- Verify credentials in .env
- Test: `mysql -h endpoint -u admin -p`

**ECS tasks failing?**
```bash
aws logs tail /ecs/football-booking --follow
```

**Frontend can't reach backend?**
- Check ALB target group health
- Verify REACT_APP_API_URL
- Check CORS_ORIGIN setting

---

## 📊 COSTS (Monthly)

| Service | Cost |
|---------|------|
| ECS | $20-40 |
| RDS | $30-50 |
| ALB | $16 |
| Transfer | $5-20 |
| **Total** | **$70-130** |

*US-East-1, small deployment*

---

## 🎯 NEXT STEPS

1. Read: [README-DEPLOYMENT.md](./README-DEPLOYMENT.md)
2. Choose path (Fast/Detailed/CI/CD)
3. Follow setup steps
4. Verify with checklist
5. Test application
6. Monitor in CloudWatch

---

## 📞 DOCUMENTATION MAP

```
AWS-DEPLOYMENT-GUIDE-INDEX.md ........... Navigation Hub
   ├── AWS-QUICK-START.md .............. 30-min deploy
   ├── AWS-DEPLOYMENT.md ............... Full guide  
   ├── AWS-DEPLOYMENT-CHECKLIST.md ..... Verification
   ├── LOCAL-DEVELOPMENT.md ............ Docker Compose
   ├── GITHUB-ACTIONS-SETUP.md ......... CI/CD
   └── DEPLOYMENT-SUMMARY.md ........... Overview
```

---

## 🔗 USEFUL LINKS

- AWS Account: https://aws.amazon.com/
- AWS Console: https://console.aws.amazon.com/
- AWS CLI Docs: https://aws.amazon.com/cli/
- ECS: https://console.aws.amazon.com/ecs/
- RDS: https://console.aws.amazon.com/rds/
- Route 53: https://console.aws.amazon.com/route53/

---

## ✅ DEPLOYMENT SUCCESS = ALL TRUE

✓ Application loads in browser  
✓ Authentication works  
✓ Can create resources  
✓ Files upload successfully  
✓ No errors in logs  
✓ Database responding  
✓ Auto-scaling active  
✓ Backups configured  
✓ Monitoring enabled  
✓ Team notified  

---

## 🆘 EMERGENCY CONTACTS

**Issue**: Application won't start  
**Fix**: `aws logs tail /ecs/football-booking --follow`

**Issue**: Can't connect to database  
**Fix**: Check RDS security group, verify .env

**Issue**: High costs  
**Fix**: Review auto-scaling, rightsize resources

**Issue**: Deployment failed  
**Fix**: Run `bash scripts/validate-aws.sh`

---

## 📝 HELPFUL VARIABLES

```bash
# AWS
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Docker
DOCKER_IMAGE=football-booking-backend:latest

# ECS
CLUSTER_NAME=football-booking-cluster
SERVICE_NAME_BACKEND=football-booking-backend
SERVICE_NAME_FRONTEND=football-booking-frontend

# RDS
DB_ENDPOINT=your-db-endpoint.xxx.rds.amazonaws.com
DB_NAME=football_booking_db
```

---

## 🎓 LEARNING PATH

1. **Understand Architecture** (10 min)
   - Read DEPLOYMENT-SUMMARY.md

2. **Setup Locally** (20 min)
   - Follow LOCAL-DEVELOPMENT.md

3. **Deploy to AWS** (30 min)
   - Follow AWS-QUICK-START.md

4. **Automate with CI/CD** (15 min)
   - Follow GITHUB-ACTIONS-SETUP.md

---

## 💡 PRO TIPS

- Test locally before AWS: `docker-compose up`
- Use named deployments: `deployment-$(date +%Y%m%d)`
- Monitor costs daily in AWS Console
- Keep multiple versions tagged in ECR
- Document all changes for compliance
- Automate everything that repeats
- Monitor logs from day 1
- Plan disaster recovery early

---

## 🎯 COMMON NEXT STEPS

After deployment:

```
Day 1:
- ✓ Application running
- ✓ Users can login
- ✓ Basic features working

Day 2:
- ○ Performance tuning
- ○ Auto-scaling tests
- ○ Backup verification

Week 1:
- ○ Capacity planning
- ○ Cost optimization
- ○ Security hardening
- ○ Team training
```

---

**BOOKMARK THIS PAGE** for quick reference during deployment! 🔖

Need help? Start with: **[AWS-DEPLOYMENT-GUIDE-INDEX.md](./AWS-DEPLOYMENT-GUIDE-INDEX.md)**

---

*Quick Reference v1.0 - Print friendly | Last updated: March 30, 2026*
