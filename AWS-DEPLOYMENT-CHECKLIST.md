# Football Field Booking App - AWS Deployment Checklist

Use this checklist to ensure your application is properly configured and ready for AWS deployment.

## Pre-Deployment Checklist

### Code Quality & Testing
- [ ] All feature branches are merged
- [ ] Unit tests pass: `npm test`
- [ ] ESLint passes: `npm run lint`
- [ ] No console.log statements in production code
- [ ] Error handling is comprehensive
- [ ] Security headers are configured (CORS, CSP, etc.)
- [ ] SQL injection and XSS vulnerabilities are addressed
- [ ] Rate limiting is configured
- [ ] Input validation is implemented

### Configuration & Environment
- [ ] `.env.example` is updated with all required variables
- [ ] `.env` file is created locally and NOT committed to git
- [ ] All database connection strings are correct
- [ ] JWT_SECRET is 32+ characters and cryptographically strong
- [ ] CORS_ORIGIN matches your domain
- [ ] Database backups are enabled
- [ ] Logs are centralized (CloudWatch)

### Database Preparation
- [ ] MySQL version 8.0+ installed on RDS
- [ ] Database schema created: `npm run db:create`
- [ ] Database is backed up
- [ ] Multi-AZ enabled for high availability
- [ ] Automated backups retention set to at least 7 days
- [ ] Encryption at rest is enabled
- [ ] Public accessibility is disabled

### Docker & Container Configuration
- [ ] Backend Dockerfile builds successfully: `docker build ./backend`
- [ ] Frontend Dockerfile builds successfully: `docker build ./frontend`
- [ ] Docker images scan passes with no critical vulnerabilities
-[ ] Non-root user is configured in Dockerfiles
- [ ] Health checks are defined in both Dockerfiles
- [ ] Resource limits are appropriate (memory, CPU)
- [ ] Environment variables are externalized

### AWS Infrastructure Setup
- [ ] AWS Account created and configured
- [ ] AWS CLI installed and configured
- [ ] IAM User with appropriate permissions created
- [ ] ECR repositories created (backend and frontend)
- [ ] VPC configured with public and private subnets
- [ ] Security groups created with appropriate rules
- [ ] Key pairs generated for EC2 access (if applicable)
- [ ] S3 buckets created (uploads, backups)
- [ ] RDS instance provisioned and running
- [ ] ECS Cluster created
- [ ] IAM roles for ECS task execution created
- [ ] CloudWatch Log Groups created

### Load Balancing & DNS
- [ ] Application Load Balancer (ALB) created
- [ ] Target groups configured (frontend and backend)
- [ ] Route 53 hosted zone exists for your domain
- [ ] DNS records point to ALB
- [ ] ACM certificate requested and validated
- [ ] HTTPS listener configured on ALB
- [ ] HTTP to HTTPS redirect configured

### Frontend Deployment Configuration
- [ ] `REACT_APP_API_URL` environment variable set
- [ ] Frontend build passes: `npm run build`
- [ ] Build output is static files (no Node.js dependency)
- [ ] nginx configuration serving static files correctly
- [ ] Static asset caching headers configured
- [ ] Gzip compression enabled

### Backend Deployment Configuration
- [ ] `server.js` uses environment variables for database
- [ ] Port is configurable via `PORT` environment variable
- [ ] Database pool sizing configured appropriately
- [ ] Connection timeout settings configured
- [ ] Error handling returns appropriate HTTP status codes
- [ ] API health check endpoint available: `/api/health`
- [ ] CORS middleware configured correctly
- [ ] Helmet security headers enabled

### Secrets Management
- [ ] AWS Secrets Manager configured
- [ ] Database password stored securely (not in code)
- [ ] JWT_SECRET stored securely
- [ ] API keys stored securely (Football API key, SMTP, etc.)
- [ ] IAM policies allow ECS task to access secrets

### Monitoring & Logging
- [ ] CloudWatch Log Group created: `/ecs/football-booking`
- [ ] Task log configuration includes log group, region, prefix
- [ ] CloudWatch alarms created for:
  - [ ] High CPU usage
  - [ ] High memory usage
  - [ ] Task failures
  - [ ] ALB unhealthy targets
- [ ] CloudWatch dashboard created for monitoring
- [ ] Log retention period set (e.g., 7 days)
- [ ] Logs are searchable and analyzable

### Auto Scaling Configuration
- [ ] Application Auto Scaling targets registered
- [ ] Scaling policies created with appropriate thresholds
- [ ] Min/max capacity set reasonably
- [ ] Cooldown periods configured
- [ ] Load-based metrics configured
- [ ] Manual scaling tested

### Backup & Disaster Recovery
- [ ] RDS automated backups enabled (7 days retention)
- [ ] RDS backup window configured outside peak hours
- [ ] Manual RDS snapshots created before deployment
- [ ] S3 versioning enabled for uploads
- [ ] S3 lifecycle policies configured for cost optimization
- [ ] Disaster recovery procedure documented
- [ ] Restore procedure tested and verified

### Security & Compliance
- [ ] VPC is private (not open to internet except ALB)
- [ ] Security groups follow least privilege principle
- [ ] Database credentials not in code or logs
- [ ] SSL/TLS certificates valid and auto-renewing
- [ ] API keys and secrets rotated
- [ ] HTTPS enforced for all traffic
- [ ] Database encryption enabled
- [ ] Network ACLs configured
- [ ] WAF rules configured (if available)

### CI/CD Setup (Optional but Recommended)
- [ ] GitHub Actions workflows configured
- [ ] Automated tests run on pull requests
- [ ] ECR image build triggered automatically
- [ ] ECS service updated automatically after successful build
- [ ] Rollback procedure documented

### Performance Optimization
- [ ] Frontend assets minified and gzipped
- [ ] Images optimized and compressed
- [ ] Database queries optimized (indexes, explain plans reviewed)
- [ ] Backend response times acceptable (<2s p95)
- [ ] Frontend page load times acceptable (<3s)
- [ ] CDN configured for static assets (optional)
- [ ] Connection pooling configured for database

### Documentation & Handover
- [ ] Deployment steps documented
- [ ] Runbooks created for common operations
- [ ] Disaster recovery procedures documented
- [ ] Troubleshooting guide created
- [ ] Team trained on new infrastructure
- [ ] On-call rotation defined
- [ ] Escalation procedures documented

## Post-Deployment Verification

### Immediate Tests (Within 1 hour)
- [ ] Application loads in browser
- [ ] Authentication works
- [ ] Can create booking
- [ ] Can upload files
- [ ] Database queries work
- [ ] API endpoints respond correctly
- [ ] Notifications send
- [ ] Real-time updates work (SSE)
- [ ] All main user flows tested
- [ ] Error pages display correctly

### 24-Hour Monitoring
- [ ] No errors in CloudWatch logs
- [ ] CPU/Memory usage within expectations
- [ ] Database performance acceptable
- [ ] No spike in error rates
- [ ] Response times stable
- [ ] Users reporting no issues
- [ ] Email notifications sending correctly
- [ ] HTTPS certificate valid

### 1-Week Review
- [ ] All metrics within acceptable ranges
- [ ] Backup jobs completed successfully
- [ ] No security issues reported
- [ ] Users able to access all features
- [ ] Performance is stable
- [ ] Cost estimates are accurate
- [ ] Auto-scaling working as expected
- [ ] Logs are being retained correctly

## Rollback Plan

If issues are detected:

1. [ ] Traffic redirected to previous version
2. [ ] Previous ECS task definition deployed
3. [ ] Database connection verified
4. [ ] Health checks passing
5. [ ] Users notified of issue
6. [ ] Root cause analysis initiated
7. [ ] Issues documented for prevention

## Post-Deployment Cleanup

- [ ] Remove local `.env` file if sensitive
- [ ] Tag Docker images with version numbers
- [ ] Update team documentation with new infrastructure
- [ ] Decommission old infrastructure (if applicable)
- [ ] Archive old deployment procedures
- [ ] Thank you message to team

## Support & Escalation

**For infrastructure issues:**
- Contact: AWS Support (based on support plan)
- Slack Channel: #infrastructure-alerts

**For application issues:**
- Contact: Development Team
- Slack Channel: #app-bugs

**For security incidents:**
- Contact: Security Team immediately
- Follow: [SECURITY_INCIDENT_RESPONSE.md](./SECURITY.md)

---

**Deployment Date**: ____________
**Deployed By**: ____________
**Approval**: ____________
**Notes**: ________________________________
