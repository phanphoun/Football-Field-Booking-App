# URGENT: Credential Rotation & Cleanup Instructions

**Execute this NOW before any deployment!**

---

## Step 1: STOP - Before Continuing

Your credentials are exposed in git history:
- JWT_SECRET: `195bd963b13befd5bae8828f8334db733c39836f9433cf01c31f49ce44a5016c6fd675d32c37f6504aa59cd70ce0dff9ba2c66ae74de2b5ba39405620a54531b`
- FOOTBALL_API_KEY: `88aaa20e57db47deb4847097dcf9c6a4`
- GOOGLE_CLIENT_ID: `701904949241-en5jqqnbq2ig9nusd1c4jme5f25nrru4.apps.googleusercontent.com`

Anyone with access to your repo (GitHub, clones, forks) can use these credentials.

---

## Step 2: Revoke All Exposed Credentials

### 2.1 FOOTBALL API KEY (highest priority - public API)
```bash
# 1. Go to https://www.football-data.org/client/register
# 2. Sign in with your account
# 3. Delete the old API key
# 4. Generate a NEW API key
# 5. Copy the new key (save it temporarily)
```

### 2.2 GOOGLE OAUTH CREDENTIALS
```bash
# 1. Go to https://console.cloud.google.com
# 2. Select your project (look for Football or Booking)
# 3. Go to APIs & Services > Credentials
# 4. Find the OAuth 2.0 Client ID: 701904949241-en5jqqnbq2ig9nusd1c4jme5f25nrru4
# 5. DELETE it
# 6. Create NEW OAuth 2.0 Client ID for Web Application
# 7. Set Authorized redirect URIs:
#    - http://localhost:3000/auth/google/callback (dev)
#    - https://yourdomain.com/auth/google/callback (prod)
# 8. Copy new Client ID and Secret
```

### 2.3 JWT_SECRET (Generate new one)
```bash
# Generate a new random JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example: abc123def456... (save this)
```

### 2.4 DATABASE PASSWORD
```bash
# Generate new secure database password
openssl rand -base64 32

# Output example: Xa3kLp9Zm2... (save this)
```

---

## Step 3: Remove .env File from Git History

```bash
# OPTION A: Rewrite entire git history (affects all developers - RECOMMENDED for fresh repo)
cd ~/Football-Field-Booking-App

# Add .env to .gitignore FIRST
echo "backend/.env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"

# Remove .env from all history
git filter-branch --tree-filter 'rm -f backend/.env' -- --all

# Force push (CAUTION: will rewrite history for all developers)
git push origin --force --all
git push origin --force --tags

# Alternative OPTION B: If you can't rewrite history
# 1. Create new repository
# 2. Push code WITHOUT .env
# 3. Migrate team to new repository
```

---

## Step 4: Create New .env Files (Template Based)

```bash
# Create .env.example (for developers to copy)
cp backend/.env.example backend/.env.local

# Edit with NEW credentials (Football API, Google OAuth from Step 2)
# Use NEW JWT_SECRET from Step 2.3
# Use NEW database password from Step 2.4
nano backend/.env.local

# For production, use AWS Secrets Manager (see Step 5)
```

---

## Step 5: Store Credentials Securely in AWS Secrets Manager

```bash
# After Step 2 credentials are rotated:

# Create secret for database
aws secretsmanager create-secret \
  --name football-booking/db \
  --secret-string '{
    "host": "football-booking-mysql.xxxx.rds.amazonaws.com",
    "port": 3306,
    "database": "football_booking_prod",
    "username": "admin",
    "password": "YOUR_NEW_PASSWORD_FROM_2.4"
  }'

# Create secret for API keys
aws secretsmanager create-secret \
  --name football-booking/api-keys \
  --secret-string '{
    "jwt_secret": "YOUR_NEW_SECRET_FROM_2.3",
    "football_api_key": "YOUR_NEW_KEY_FROM_2.1",
    "google_client_id": "YOUR_NEW_CLIENT_FROM_2.2",
    "google_client_secret": "YOUR_NEW_SECRET_FROM_2.2"
  }'
```

---

## Step 6: Verify Cleanup

```bash
# Check that .env is NOT in git
git log --all --oneline -- backend/.env | head -20

# Should show: (nothing)
# OR show: "Remove .env from version control"

# Verify new .env.local works locally
cd backend
npm install
npm run dev

# Should connect to database successfully
```

---

## Step 7: Notify Team

Send this message to all developers:

```
SECURITY: Git credentials exposed - repository rewritten

This repository's git history has been rewritten to remove exposed credentials.

REQUIRED ACTIONS:
1. Delete your local clone
2. Create fresh clone: git clone <url>
3. Copy .env.example to .env
4. Ask [DevOps] for NEW credentials
5. Credentials are now in AWS Secrets Manager

Questions? Contact [Security Lead]
```

---

## Verification Checklist

- [ ] Old FOOTBALL_API_KEY revoked at football-data.org
- [ ] Old GOOGLE credentials deleted from Google Cloud Console
- [ ] New JWT_SECRET generated
- [ ] New database password generated
- [ ] .env removed from git history
- [ ] .env is in .gitignore
- [ ] New .env.example created
- [ ] New credentials stored in AWS Secrets Manager
- [ ] Tested locally with new credentials
- [ ] Team notified and new clones created
- [ ] Old credentials tested (should fail) ← Verify this!

---

## Timeline

**TOTAL TIME: 2-3 hours**

- Step 1-2: Reading instructions (5 min)
- Step 3: Git history rewrite (15 min)
- Step 4: Create template files (10 min)
- Step 5: AWS setup (30 min)
- Step 6: Verification (15 min)
- Step 7: Notify team (10 min)

**Rest of deployment:** Continue with Docker files

---

## Emergency: If You Can't Rewrite History

If your repository is shared and you can't do history rewrite:

```bash
# 1. Create NEW repository with same name + "_secure"
# 2. Remove all history and start fresh
git clone --bare <old-repo>
cd <old-repo>.git

# 3. Mirror the code WITHOUT .env
git mirror push <new-repo-bare> --all

# 4. Migrate team to new repository
# 5. Old repository is archived (keep for reference only)
```

---

**DO THIS FIRST - Before any other deployment steps!**

After completing this, continue to the Docker setup in Phase 2.
