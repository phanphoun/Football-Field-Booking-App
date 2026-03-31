# Production Monitoring, Logging & Alerting

**Version:** 1.0  
**Last Updated:** March 31, 2026

---

## Overview

Production monitoring ensures your application stays healthy, performant, and secure. This guide covers AWS CloudWatch, application logging, and alerting strategies.

---

## AWS CloudWatch Setup

### 1. Create Log Groups

```bash
# Backend logs
aws logs create-log-group --log-group-name /football-booking/backend
aws logs put-retention-policy \
  --log-group-name /football-booking/backend \
  --retention-in-days 30

# Frontend logs
aws logs create-log-group --log-group-name /football-booking/frontend
aws logs put-retention-policy \
  --log-group-name /football-booking/frontend \
  --retention-in-days 14

# RDS logs
aws logs create-log-group --log-group-name /rds/football-booking/error
aws logs create-log-group --log-group-name /rds/football-booking/slowquery
```

### 2. Configure CloudWatch Agent on EC2

**Install CloudWatch Agent:**

```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
```

**Create agent configuration (`/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json`):**

```json
{
  "metrics": {
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_IDLE",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {
            "name": "disk_used_percent",
            "rename": "DISK_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEM_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/app/logs/combined.log",
            "log_group_name": "/football-booking/backend",
            "log_stream_name": "application-logs"
          },
          {
            "file_path": "/var/log/docker",
            "log_group_name": "/football-booking/backend",
            "log_stream_name": "docker-logs"
          }
        ]
      }
    }
  }
}
```

**Start agent:**

```bash
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

---

## Application Logging Setup

### 1. Install Winston Logger

```bash
npm install winston winston-daily-rotate-file
```

### 2. Create Logger Configuration

**File:** `backend/src/utils/logger.js`

```javascript
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'football-booking-api' },
  transports: [
    // Error logs - only errors and above
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error'
    }),
    
    // Combined logs - all levels
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

// Development: also log to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
      })
    )
  }));
}

module.exports = logger;
```

### 3. Use Logger Throughout Application

**Replace all `console.log` with logger calls:**

```javascript
const logger = require('../utils/logger');

// Instead of: console.log('Server started')
logger.info('Server started', { port: 5000 });

// Instead of: console.error('Database error', error)
logger.error('Database connection failed', { error: error.message, stack: error.stack });

// Instead of: console.warn('Warning message')
logger.warn('Rate limit approaching', { userId: req.user.id });
```

---

## CloudWatch Alarms

### 1. Create CPU Alarm

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name football-booking-cpu-high \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=AutoScalingGroupName,Value=football-booking-asg \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alert-topic
```

### 2. Create Memory Alarm

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name football-booking-memory-high \
  --alarm-description "Alert when memory exceeds 85%" \
  --metric-name MEM_USED \
  --namespace CWAgent \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alert-topic
```

### 3. Create Application Error Alarm

```bash
# Alert if more than 10 errors in 5 minutes
aws cloudwatch put-metric-alarm \
  --alarm-name football-booking-app-errors \
  --alarm-description "Alert on application errors" \
  --metric-name ApplicationErrors \
  --namespace CustomApp \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alert-topic
```

### 4. Create RDS Alarm

```bash
# Alert when RDS CPU exceeds 75%
aws cloudwatch put-metric-alarm \
  --alarm-name football-booking-rds-cpu \
  --alarm-description "Alert when RDS CPU exceeds 75%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 75 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=football-booking-mysql \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alert-topic
```

### 5. Create Disk Space Alarm

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name football-booking-disk-space \
  --alarm-description "Alert when disk space exceeds 80%" \
  --metric-name DISK_USED \
  --namespace CWAgent \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alert-topic
```

---

## SNS Notifications

### 1. Create SNS Topic

```bash
# Create topic
aws sns create-topic --name football-booking-alerts

# Create email subscription
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:football-booking-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create SMS subscription (for critical alerts)
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:football-booking-alerts-critical \
  --protocol sms \
  --notification-endpoint +1234567890
```

### 2. Send Notifications from Application

```javascript
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

async function sendAlert(subject, message) {
  try {
    await sns.publish({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: subject,
      Message: message
    }).promise();
  } catch (error) {
    logger.error('Failed to send SNS alert', { error: error.message });
  }
}

// Usage
sendAlert('Database Error', 'Connection failed - check RDS status');
```

---

## CloudWatch Dashboards

### 1. Create Custom Dashboard

```bash
aws cloudwatch put-dashboard \
  --dashboard-name football-booking-overview \
  --dashboard-body '{
    "widgets": [
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["AWS/EC2", "CPUUtilization", {"stat": "Average"}],
            ["CWAgent", "MEM_USED", {"stat": "Average"}],
            ["CustomApp", "ApplicationErrors", {"stat": "Sum"}]
          ],
          "period": 300,
          "stat": "Average",
          "region": "us-east-1",
          "title": "Application Health"
        }
      }
    ]
  }'
```

### 2. View Dashboard

```bash
# List dashboards
aws cloudwatch list-dashboards

# View specific dashboard
aws cloudwatch get-dashboard --dashboard-name football-booking-overview
```

---

## Log Analysis

### 1. Search Logs with CloudWatch Insights

```bash
# Find all errors in last hour
aws logs start-query \
  --log-group-name /football-booking/backend \
  --start-time $(date -d '-1 hour' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/'

# Find slow database queries
aws logs start-query \
  --log-group-name /rds/football-booking/slowquery \
  --start-time $(date -d '-1 hour' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, Query_time | filter Query_time > 1'

# Find 5xx errors
aws logs start-query \
  --log-group-name /football-booking/backend \
  --query-string 'fields @timestamp, status | filter status like /5[0-9][0-9]/'
```

### 2. Create Log Filters

```bash
# Create metric filter for errors
aws logs put-metric-filter \
  --log-group-name /football-booking/backend \
  --filter-name ErrorFilter \
  --filter-pattern "[level=ERROR*]" \
  --metric-transformations metricName=ApplicationErrors,metricValue=1
```

---

## Performance Monitoring

### 1. Monitor API Response Times

```javascript
// Add middleware to track response times
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
    
    // Send metric to CloudWatch
    if (process.env.NODE_ENV === 'production') {
      const cloudwatch = new AWS.CloudWatch();
      cloudwatch.putMetricData({
        Namespace: 'CustomApp',
        MetricData: [{
          MetricName: 'APIResponseTime',
          Value: duration,
          Unit: 'Milliseconds',
          Dimensions: [
            { Name: 'Endpoint', Value: req.path },
            { Name: 'Method', Value: req.method }
          ]
        }]
      }).promise();
    }
  });
  
  next();
});
```

### 2. Monitor Database Performance

```javascript
// Log slow database queries
sequelize.addHook('afterConnect', (connection) => {
  connection.query = originalQuery => {
    const start = Date.now();
    
    return originalQuery.apply(connection, arguments).then(result => {
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        logger.warn('Slow database query', {
          query: sql,
          duration: `${duration}ms`
        });
      }
      
      return result;
    });
  };
});
```

---

## Uptime Monitoring

### 1. Create Route 53 Health Checks

```bash
# Create health check for backend
aws route53 create-health-check \
  --health-check-config '{
    "Type": "HTTPS",
    "ResourcePath": "/health",
    "FullyQualifiedDomainName": "api.yourdomain.com",
    "Port": 443,
    "RequestInterval": 30,
    "FailureThreshold": 3
  }'
```

### 2. Create CloudWatch Alarm for Health Check

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name football-booking-uptime \
  --metric-name HealthCheckStatus \
  --namespace AWS/Route53 \
  --statistic Minimum \
  --period 60 \
  --threshold 0 \
  --comparison-operator LessThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alert-topic
```

---

## Logging Best Practices

### 1. Never Log Sensitive Data

```javascript
// ❌ BAD - Logs sensitive data
logger.info('User login', {
  email: user.email,
  password: user.password,  // NEVER!
  creditCard: user.creditCard  // NEVER!
});

// ✅ GOOD - Only log non-sensitive info
logger.info('User login', {
  userId: user.id,
  email: user.email,  // Masked or partial
  timestamp: new Date().toISOString()
});
```

### 2. Use Structured Logging

```javascript
// ✅ GOOD - Structured format, easy to parse
logger.info('Order Created', {
  orderId: '12345',
  userId: '67890',
  amount: 99.99,
  status: 'PENDING',
  timestamp: new Date().toISOString()
});

// ❌ BAD - Unstructured string
logger.info(`Order 12345 created by user 67890 for 99.99`);
```

### 3. Log with Context

```javascript
// ✅ GOOD - Includes request context
logger.info('Payment processed', {
  requestId: req.id,
  userId: req.user.id,
  orderId: req.body.orderId,
  amount: req.body.amount,
  gateway: 'stripe'
});
```

---

## Alerting Strategy

### Severity Levels

| Level | Response Time | Channel | Examples |
|-------|---------------|---------|----------|
| Critical | Immediate (< 5 min) | SMS, PagerDuty | Database down, API unreachable |
| High | 15-30 minutes | Email, Slack | CPU > 90%, Memory > 95% |
| Medium | 1-2 hours | Email | Disk > 80%, Error rate > 5% |
| Low | Next day | Email daily digest | Warnings, deprecation notices |

### On-Call Checklist

When alerted:

1. **Acknowledge** the alert immediately
2. **Assess** the situation (check dashboard, logs)
3. **Communicate** status to team (Slack status)
4. **Remediate** if within scope, escalate if needed
5. **Document** what happened and how it was fixed
6. **Post-mortem** after resolution (if critical)

---

## Cost Optimization

### 1. Reduce Log Retention

```bash
# Reduce retention to save costs
aws logs put-retention-policy \
  --log-group-name /football-booking/backend \
  --retention-in-days 14  # From 30 to 14 days
```

### 2. Use CloudWatch Insights for Analysis

Instead of keeping all logs for long periods, use Insights to query historical data.

### 3. Filter Before Logging

```javascript
// Don't log low-value requests
if (req.path === '/health' || req.path === '/favicon.ico') {
  return next();
}

logger.info('API Request', { method: req.method, path: req.path });
```

---

## Troubleshooting

### Logs Not Appearing

```bash
# Check log group exists
aws logs describe-log-groups

# Check agent is running
sudo systemctl status amazon-cloudwatch-agent

# Check IAM permissions
aws iam get-role-policy --role-name EC2-CloudWatch-Role --policy-name CloudWatchLogs
```

### High Costs

```bash
# Check log volume
aws logs describe-log-groups --query 'logGroups[].{name:logGroupName, retention:retentionInDays}' --output table

# Reduce retention or filter unnecessary logs
```

---

**For more information:**
- AWS CloudWatch: https://docs.aws.amazon.com/cloudwatch/
- Winston Logger: https://github.com/winstonjs/winston
- CloudWatch Insights: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html
