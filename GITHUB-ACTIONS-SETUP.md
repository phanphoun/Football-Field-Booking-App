# GitHub Actions - AWS Deployment Setup

This document explains how to configure GitHub Actions for automated AWS deployment.

## Prerequisites

- GitHub repository with this code
- AWS Account with appropriate permissions
- GitHub organization or personal account

## Step 1: Create IAM Role for GitHub Actions

This uses OpenID Connect (OIDC) for secure, keyless authentication.

```bash
# 1. Create IAM policy for deployment
aws iam create-policy \
  --policy-name github-actions-deployment \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:GetAuthorizationToken",
          "ecs:UpdateService",
          "ecs:DescribeServices"
        ],
        "Resource": "*"
      }
    ]
  }'

# 2. Create trust policy for GitHub Actions
cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/Football-Field-Booking-App:ref:refs/heads/main"
        }
      }
    }
  ]
}
EOF

# 3. Create IAM role
aws iam create-role \
  --role-name github-actions-deployment-role \
  --assume-role-policy-document file:///tmp/trust-policy.json

# 4. Attach policy to role
aws iam attach-role-policy \
  --role-name github-actions-deployment-role \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/github-actions-deployment

# 5. Get the role ARN (you'll need this)
aws iam get-role --role-name github-actions-deployment-role --query 'Role.Arn'
```

## Step 2: Configure OIDC with GitHub

```bash
# Add GitHub Actions OIDC provider to AWS
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

## Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add the following repository secrets:

### Required Secrets

```
AWS_ROLE_TO_ASSUME
Value: arn:aws:iam::ACCOUNT_ID:role/github-actions-deployment-role

AWS_REGION  
Value: us-east-1

SLACK_WEBHOOK_URL (Optional)
Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Environment Secrets (optional, for direct AWS keys)

If not using OIDC, create AWS IAM user with programmatic access:

```
AWS_ACCESS_KEY_ID
Value: AKIA...

AWS_SECRET_ACCESS_KEY
Value: AWS secret key
```

## Step 4: Configure Workflow

The workflow file `.github/workflows/deploy.yml` is already created.

### Customize for Your Setup

Edit `.github/workflows/deploy.yml`:

1. **AWS Region** - Change `us-east-1` to your region
2. **ECR Registry** - Update to match your account
3. **Cluster Name** - Verify matches your ECS cluster
4. **Service Names** - Verify backend/frontend service names

```yaml
env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: amazon.dkr.ecr.us-east-1.amazonaws.com
  # Update cluster and service names
```

## Step 5: Set Up ECS Task Definitions

The workflow uses these files (already created):
- `ecs-backend-task-definition.json`
- `ecs-frontend-task-definition.json`

**Important**: Update placeholders in these files:
- `ACCOUNT_ID` → Your AWS account ID
- `REGION` → Your AWS region
- `RDS_ENDPOINT` → Your RDS endpoint
- `https://your-domain.com` → Your actual domain

```bash
# Replace placeholders
sed -i 's/ACCOUNT_ID/123456789012/g' ecs-*.json
sed -i 's/REGION/us-east-1/g' ecs-*.json
sed -i 's/RDS_ENDPOINT/your-rds-endpoint.xxx.rds.amazonaws.com/g' ecs-*.json
sed -i 's/your-domain.com/app.example.com/g' ecs-*.json
```

## Step 6: Test the Workflow

1. Make a small commit to main branch
2. Go to GitHub Actions tab
3. Watch the workflow run
4. Check logs for any errors

### Trigger Manual Deployment (if needed)

```bash
git push origin main
```

## Workflow Features

✅ **On Every Push to Main**:
- Run all tests
- Build Docker images
- Push to ECR
- Update ECS services
- Send Slack notification

✅ **On Pull Requests**:
- Run tests
- Scan for security vulnerabilities
- Comment results on PR

✅ **Automatic Rollback** (optional):
If deployment fails, the previous task definition remains active.

## Environment Variables in ECS

Task definitions use environment variables and secrets:

### Frontend Environment
```json
{
  "name": "REACT_APP_API_URL",
  "value": "https://api.your-domain.com/api"
}
```

### Backend Environment
```json
{
  "name": "NODE_ENV",
  "value": "production"
}
```

### Backend Secrets (from Secrets Manager)
```json
{
  "name": "DB_PASSWORD",
  "valueFrom": "arn:aws:secretsmanager:region:account:secret:football-booking/db-password"
}
```

## Store Secrets in AWS Secrets Manager

```bash
# Database password
aws secretsmanager create-secret \
  --name football-booking/db-password \
  --secret-string 'your-secure-password'

# JWT Secret
aws secretsmanager create-secret \
  --name football-booking/jwt-secret \
  --secret-string 'your-jwt-secret-32-chars-minimum'
```

## Troubleshooting GitHub Actions

### Workflow won't start
- Check branch name matches template (main or master)
- Verify `.github/workflows/deploy.yml` syntax
- Check GitHub Actions is enabled in repo settings

### Permission denied errors
- Verify IAM role has correct permissions
- Check OIDC trust policy matches your GitHub org/repo
- Ensure AWS_ROLE_TO_ASSUME secret is correct

### ECR push fails
- Verify ECR repositories exist
- Check ECR repository names match workflow
- Verify IAM policy allows ECR access

### ECS deployment fails
- Check ECS cluster and services exist
- Verify task definitions are registered
- Check CloudWatch logs for task failures
- Ensure security groups allow traffic

### Help with workflow syntax
See: https://docs.github.com/en/actions/workflow-syntax-for-github-actions

## Advanced: Matrix Builds

To build multiple Node.js versions:

```yaml
strategy:
  matrix:
    node-version: [16.x, 18.x, 20.x]
    
- name: Use Node.js ${{ matrix.node-version }}
  uses: actions/setup-node@v3
  with:
    node-version: ${{ matrix.node-version }}
```

## Advanced: Scheduled Deployments

Deploy on schedule:

```yaml
on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM UTC
```

## Advanced: Manual Trigger

Allow manual deployment:

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment'
        required: true
        default: 'production'
```

Then trigger from Actions tab: "Run workflow"

## Workflow Status Badge

Add to your README.md:

```markdown
![Deploy to AWS](https://github.com/YOUR_ORG/Football-Field-Booking-App/workflows/Deploy%20to%20AWS/badge.svg)
```

## Monitoring Deployments

### View Workflow Runs
1. Go to Actions tab
2. Click on workflow run
3. Expand jobs to see logs

### Get Notifications
1. GitHub: Configure notification settings
2. Slack: Add webhook URL to `SLACK_WEBHOOK_URL` secret
3. Email: GitHub sends by default

### Rollback if Needed

If deployment fails:
1. Previous task definition remains active
2. Either re-run workflow or manually update ECS service

```bash
# Manual rollback to previous task definition
aws ecs update-service \
  --cluster football-booking-cluster \
  --service football-booking-backend \
  --task-definition football-booking-backend:PREVIOUS_VERSION \
  --force-new-deployment
```

## Best Practices

✅ **Do**:
- Use OIDC instead of long-lived credentials
- Rotate secrets regularly
- Run tests before deployment
- Use semantic versioning for releases
- Tag releases in GitHub
- Document deployment process

❌ **Don't**:
- Commit `.env` files
- Store secrets in code
- Deploy from branches other than main
- Skip running tests
- Merge without review

## Performance Optimization

### Caching Dependencies
```yaml
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
```

### Parallel Jobs
Run tests and security scan in parallel:
```yaml
tests:
  needs: build-and-push
  
security:
  needs: build-and-push
  
deploy:
  needs: [tests, security]
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS OIDC Configuration](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [ECS Deployment Action](https://github.com/aws-actions/amazon-ecs-deploy-task-definition)
- [React GitHub Actions](https://create-react-app.dev/docs/deployment/)

---

Your CI/CD pipeline is now ready! 🚀

Start with a test commit to main branch to verify everything works.
