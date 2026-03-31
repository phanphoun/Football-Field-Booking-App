# Security Recommendations & Hardening

**Version:** 1.0  
**Last Updated:** March 31, 2026  
**Priority:** CRITICAL

---

## Security Issues Found

### 🔴 CRITICAL Issues

#### 1. **Exposed Credentials in Version Control**

**Status:** Must be fixed before any deployment

**Files Affected:**
- `backend/.env` - Contains JWT_SECRET, FOOTBALL_API_KEY, GOOGLE_CLIENT_ID

**Action Required:**
```bash
# Immediately:
git rm --cached backend/.env
git commit -m "Remove .env from version control"

# Revoke all exposed credentials:
1. Generate new JWT_SECRET
2. Regenerate FOOTBALL_API_KEY on football-data.org
3. Reset GOOGLE_CLIENT_ID/SECRET in Google Cloud Console
4. Update all hardcoded database passwords

# Force push history rewrite (affects all developers):
git push origin --force --all
```

---

#### 2. **Database SSL Certificate Validation Disabled**

**File:** `backend/src/config/serverConfig.js` (line 93)

**Current Code (WEAK):**
```javascript
ssl: process.env.DB_SSL === 'true' ? {
  require: true,
  rejectUnauthorized: false  // ⚠️ DANGEROUS!
} : false
```

**Fixed Code:**
```javascript
// Production should require full SSL validation
ssl: process.env.NODE_ENV === 'production' ? {
  require: true,
  rejectUnauthorized: true,  // ✅ Enforce certificate validation
  ca: process.env.DB_SSL_CA_CERT ? [process.env.DB_SSL_CA_CERT] : undefined,
  checkServerIdentity: (servername, cert) => {
    // Verify certificate matches the expected RDS endpoint
    if (!cert.subjectaltname?.includes(servername)) {
      return new Error('Certificate mismatch');
    }
  }
} : false
```

**Why:** `rejectUnauthorized: false` allows MITM (man-in-the-middle) attacks

---

#### 3. **JWT Secret Too Short in Development**

**File:** `.env`

**Issue:** JWT_SECRET below 32 characters increases collision risk

**Fix:**
```bash
# Generate new 32+ character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output: abc123def456... (64 characters hex)
# Use this in .env.production
```

---

### 🟠 HIGH Priority Issues

#### 4. **Excessive Logging in Production**

**Problem:** 30+ `console.log` statements leak internal details to CloudWatch

**Files to Fix:**
- `backend/server.js` - Lines: 200, 483, 493, 495, 500, 502, 509, 512, 518, 521, 539-542
- `backend/mock-server.js` - Lines: 141, 186, 240, 317, 557-560
- `backend/src/middleware/auth.js` - Lines: 86, 115
- `backend/src/middleware/errorHandler.js` - Line: 95

**Fix - Implement Proper Logging:**

```bash
npm install winston
```

**File:** `backend/src/utils/logger.js`

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production'
    ? winston.format.json()
    : winston.format.simple(),
  defaultMeta: { service: 'football-booking-api' },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Development: also log to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

**Replace all `console.log` with:**

```javascript
const logger = require('../utils/logger');

// Instead of console.log('message')
logger.info('message');

// Instead of console.error('error')
logger.error('error');

// Instead of console.warn('warning')
logger.warn('warning');
```

---

#### 5. **Missing CORS Configuration in Production**

**Current:** `CORS_ORIGIN=http://localhost:3000`

**Fix for Production:**

```env
# .env.production
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

**Code Fix:**

```javascript
// backend/src/config/serverConfig.js
cors: {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:3000'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
},
```

---

#### 6. **Rate Limiting Not Adequately Tested**

**File:** `backend/src/middleware/rateLimiter.js`

**Issue:** Very generous limits in development bypass security testing

**Fix:**

```javascript
// Test production limits locally
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'production' ? 100 : 10000,
  'Too many requests'
);

const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  process.env.NODE_ENV === 'production' ? 5 : 100,  // 5 login attempts
  'Too many authentication attempts'
);
```

**Test Rate Limiting:**

```bash
# Install ab (Apache Bench)
# Then run:
ab -n 1000 -c 100 http://localhost:5000/health
# Should see 429 (Too Many Requests) after limit
```

---

#### 7. **Missing Helmet Security Headers Configuration**

**File:** `backend/src/config/serverConfig.js`

**Current (Partial):**
```javascript
helmet: {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}
```

**Enhanced Config:**

```javascript
helmet: {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // Review this
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", "https:"],
      mediaSrc: ["'none'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true
}
```

---

### 🟡 MEDIUM Priority Issues

#### 8. **Missing Input Validation on File Uploads**

**File:** `backend/src/middleware/upload.js`

**Add Validation:**

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    // Generate random filename to prevent directory traversal
    const randomName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${randomName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Check MIME type against whitelist
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = upload;
```

---

#### 9. **Missing Request ID Tracking**

**Add for debugging and security audit:**

```javascript
const { v4: uuidv4 } = require('uuid');

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});
```

---

#### 10. **No Rate Limiting on File Upload Endpoints**

**Add to routes:**

```javascript
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  keyGenerator: (req) => req.user.id, // Per user
  message: 'Too many uploads, try again later'
});

router.post('/upload', uploadLimiter, upload.single('file'), controller.uploadFile);
```

---

## AWS Security Best Practices

### Network Security

```bash
# 1. Create Security Groups
aws ec2 create-security-group \
  --group-name app-sg \
  --description "Security group for application servers"

# Allow only HTTPS from CloudFront
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 443 \
  --source-security-group-id sg-cloudfront

# Allow database only from application servers
aws ec2 authorize-security-group-ingress \
  --group-id sg-rds-xxxxx \
  --protocol tcp \
  --port 3306 \
  --source-security-group-id sg-app
```

### Database Security

```bash
# Enable encryption at rest
aws rds modify-db-instance \
  --db-instance-identifier football-booking-mysql \
  --storage-encrypted \
  --apply-immediately

# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier football-booking-mysql \
  --backup-retention-period 30

# Enable Enhanced Monitoring
aws rds modify-db-instance \
  --db-instance-identifier football-booking-mysql \
  --enable-cloudwatch-logs-exports error,general,slowquery

# Disable public accessibility
aws rds modify-db-instance \
  --db-instance-identifier football-booking-mysql \
  --no-publicly-accessible
```

### Secrets Management

```bash
# Store credentials securely
aws secretsmanager create-secret \
  --name football-booking/db-password \
  --secret-string $(openssl rand -base64 32)

# Rotate automatically
aws secretsmanager rotate-secret \
  --secret-id football-booking/db-password \
  --rotation-rules AutomaticallyAfterDays=30
```

---

## Security Testing Checklist

- [ ] Run OWASP dependency check: `npm audit`
- [ ] Check for hardcoded credentials: `grep -r "password\|secret\|token" src/`
- [ ] Test rate limiting: `ab -c 100 -n 1000 http://localhost:5000`
- [ ] Test CORS restrictions: `curl -H "Origin: https://attacker.com"`
- [ ] Verify SSL/TLS: `openssl s_client -connect yourdomain.com:443`
- [ ] Check security headers: `curl -I https://yourdomain.com`
- [ ] Test input validation with SQL injection: `' OR '1'='1`
- [ ] Test XSS vectors: `<script>alert('xss')</script>`
- [ ] Verify authentication enforced
- [ ] Test file upload restrictions
- [ ] Load test for DDoS resilience

---

## Security Headers to Add

**Add to response headers:**

```javascript
app.use((req, res, next) => {
  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});
```

---

## Compliance Checklist

- [ ] GDPR Compliance (if serving EU users)
  - [ ] Privacy Policy documented
  - [ ] User data deletion mechanism
  - [ ] Data export functionality
  - [ ] Consent mechanism

- [ ] PCI DSS (if handling payments)
  - [ ] No storing credit card numbers
  - [ ] Using tokenization service
  - [ ] SSL/TLS enforced

- [ ] OWASP Top 10
  - [ ] Injection attacks mitigated
  - [ ] Broken Authentication fixed
  - [ ] Sensitive Data Exposure prevented
  - [ ] XXE attacks prevented
  - [ ] Broken Access Control tested

---

**For more information, see:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/
- AWS Security Best Practices: https://aws.amazon.com/security/best-practices/
