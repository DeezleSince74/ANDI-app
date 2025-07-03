# Sentry Integration Setup Guide

This guide walks you through setting up Sentry cloud-hosted error tracking and performance monitoring for the ANDI application.

## 🎯 Why Cloud-Hosted Sentry?

✅ **Focus on Education**: Spend time on ANDI features, not infrastructure  
✅ **Cost-Effective**: Free tier + ~$26/month for production  
✅ **Enterprise Features**: SSO, compliance, global CDN  
✅ **No Maintenance**: Automatic updates and high availability  
✅ **Education Discounts**: Available for educational institutions  

## 📋 Prerequisites

- Sentry account (sign up at https://sentry.io)
- ANDI development environment set up
- Admin access to create Sentry projects

## 🚀 Step 1: Create Sentry Account & Projects

### 1. Sign Up for Sentry
```bash
# Visit https://sentry.io and create an account
# Choose "Education" if applicable for discounts
```

### 2. Create Organization
```bash
Organization Name: "ANDI Labs" (or your organization)
Slug: "andi-labs"
```

### 3. Create Projects
Create separate projects for each component:

**Project 1: ANDI Database**
```
Platform: Node.js
Project Name: andi-database
Project Slug: andi-database
Team: #andi-core
```

**Project 2: ANDI Data Pipelines**
```
Platform: Python
Project Name: andi-data-pipelines  
Project Slug: andi-data-pipelines
Team: #andi-data
```

**Project 3: ANDI Web App** (for future)
```
Platform: Next.js
Project Name: andi-web-app
Project Slug: andi-web-app
Team: #andi-frontend
```

### 4. Get DSN Keys
After creating each project, copy the DSN:
```
Database DSN: https://xxx@xxx.ingest.sentry.io/xxx
Pipelines DSN: https://yyy@yyy.ingest.sentry.io/yyy
Web App DSN: https://zzz@zzz.ingest.sentry.io/zzz
```

## ⚙️ Step 2: Configure Environment Variables

### Development Environment
Update your `.env` file:

```bash
# ===========================================
# SENTRY CONFIGURATION
# ===========================================
# Database Component
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=1.0.0-dev
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=1.0

# Data Pipelines (Airflow) - separate DSN
SENTRY_DSN_PIPELINES=https://yyy@yyy.ingest.sentry.io/yyy

# Web App (Future) - separate DSN  
SENTRY_DSN_WEB=https://zzz@zzz.ingest.sentry.io/zzz
```

### Production Environment
```bash
# Production values
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.2.3  # Use actual version
SENTRY_TRACES_SAMPLE_RATE=0.1  # Lower sampling for production
SENTRY_PROFILES_SAMPLE_RATE=0.05
```

## 🔧 Step 3: Install Dependencies

### Database Layer (Node.js/TypeScript)
```bash
cd app/app-database/lib
npm install @sentry/node @sentry/profiling-node
```

### Data Pipelines (Python)
```bash
cd app/data-pipelines
pip install sentry-sdk[flask,sqlalchemy]==1.39.2
```

### ETL Utilities (TypeScript)
```bash
cd app/data-pipelines/etl
npm install @sentry/node @sentry/profiling-node
```

## 🎯 Step 4: Verify Installation

### Test Database Integration
```bash
cd app/app-database/lib
npm run build

# Test with sample error
node -e "
require('dotenv').config();
const { initializeSentry, sentryLogger } = require('./dist/sentry');
initializeSentry();
sentryLogger.error('Test error from database layer');
setTimeout(() => process.exit(0), 2000);
"
```

### Test Data Pipelines Integration
```bash
cd app/data-pipelines
python -c "
import os
from dotenv import load_dotenv
load_dotenv()

from shared.sentry_config import initialize_sentry, create_dag_logger

initialize_sentry()
logger = create_dag_logger('test_dag')
logger.error('Test error from data pipelines')

import time
time.sleep(2)
"
```

## 📊 Step 5: Configure Monitoring & Alerts

### 1. Set Up Alert Rules
In Sentry dashboard:

**High Priority Alerts:**
```
Rule: Database Connection Failures
Conditions: 
  - Event type: Error
  - Message contains: "Failed to connect to database"
Actions:
  - Send email to: dev-team@andi.ai
  - Send Slack notification to: #andi-alerts
```

**Performance Alerts:**
```
Rule: Slow Database Queries  
Conditions:
  - Measurement: db_query_duration > 2000ms
  - Frequency: More than 10 times in 5 minutes
Actions:
  - Send email to: performance-team@andi.ai
```

**Pipeline Alerts:**
```
Rule: ETL Pipeline Failures
Conditions:
  - Event type: Error
  - Tags: component equals "data_pipelines"
Actions:
  - Send email to: data-team@andi.ai
  - Create Jira issue
```

### 2. Configure Dashboards
Create custom dashboards for:
- Database performance metrics
- Pipeline success rates  
- Error frequency trends
- User impact analysis

### 3. Set Up Integrations

**Slack Integration:**
```bash
# In Sentry: Settings > Integrations > Slack
# Connect workspace: andi-labs.slack.com
# Configure channels:
#   - #andi-errors (all errors)
#   - #andi-performance (performance alerts)
#   - #andi-deployments (release tracking)
```

**GitHub Integration:**
```bash
# In Sentry: Settings > Integrations > GitHub  
# Connect repository: ANDILabs/ANDI-app
# Enable:
#   - Commit tracking for releases
#   - Issue creation for errors
#   - Code ownership mapping
```

## 🚀 Step 6: Deploy to Production

### Azure Environment Variables
Set in Azure App Service / Container Apps:

```bash
# Using Azure CLI
az webapp config appsettings set \
  --resource-group andi-rg-prod \
  --name andi-database-prod \
  --settings \
    SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx" \
    SENTRY_ENVIRONMENT="production" \
    SENTRY_RELEASE="1.0.0" \
    SENTRY_TRACES_SAMPLE_RATE="0.1"
```

### Release Tracking
Set up automatic release tracking:

```bash
# In CI/CD pipeline (GitHub Actions)
- name: Create Sentry Release
  uses: getsentry/action-release@v1
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: andi-labs
    SENTRY_PROJECT: andi-database
  with:
    environment: production
    version: ${{ github.sha }}
```

## 📈 Step 7: Monitor & Optimize

### Key Metrics to Track

**Database Layer:**
- Connection success/failure rates
- Query performance (P50, P95, P99)
- Pool utilization
- Error frequency by operation

**Data Pipelines:**
- Pipeline success rates  
- Processing duration
- Data quality metrics
- Resource utilization

**Application Health:**
- Error rates by component
- Performance trends
- User impact assessment
- Release health scores

### Performance Tuning

**Sample Rate Optimization:**
```bash
# Development: High sampling for debugging
SENTRY_TRACES_SAMPLE_RATE=1.0

# Staging: Medium sampling
SENTRY_TRACES_SAMPLE_RATE=0.5  

# Production: Lower sampling to control costs
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Error Filtering:**
```typescript
// Filter out expected development noise
beforeSend(event, hint) {
  if (NODE_ENV === 'development' && 
      error.message.includes('timeout')) {
    return null; // Don't send timeout errors in dev
  }
  return event;
}
```

## 💰 Cost Management

### Sentry Pricing Tiers

**Development (Free Tier):**
- 5,000 errors/month
- 10,000 performance units/month  
- 30-day retention
- **Cost: $0**

**Production (Team Plan):**
- 50,000 errors/month
- 100,000 performance units/month
- 90-day retention
- SSO, advanced features
- **Cost: ~$26/month**

### Cost Optimization Tips

1. **Smart Sampling**: Use lower sampling rates in production
2. **Error Filtering**: Filter out noise and expected errors
3. **Release Cleanup**: Delete old releases to save storage
4. **Team Management**: Only invite necessary team members
5. **Education Discount**: Apply for educational institution discount

## 🛠️ Troubleshooting

### Common Issues

**Issue: "DSN not configured"**
```bash
# Solution: Check environment variables
echo $SENTRY_DSN
# Ensure DSN is set in .env file
```

**Issue: "Events not appearing"**
```bash
# Solution: Check network connectivity
curl -I https://sentry.io
# Verify DSN format and project access
```

**Issue: "High volume of events"**
```bash
# Solution: Implement rate limiting
SENTRY_TRACES_SAMPLE_RATE=0.1  # Reduce sampling
# Add error filtering for noisy errors
```

### Debug Mode
```bash
# Enable Sentry debug logging
SENTRY_DEBUG=true
```

## 🔧 Advanced Configuration

### Custom Context
```typescript
// Add custom context to all events
Sentry.configureScope((scope) => {
  scope.setTag('component', 'database');
  scope.setTag('environment', 'production');
  scope.setContext('school_district', {
    id: 'district_123',
    name: 'Metro City Schools'
  });
});
```

### Performance Monitoring
```python
# Track custom performance metrics
with sentry_sdk.start_transaction(name="etl_pipeline", op="data_processing"):
    # Your ETL code here
    sentry_sdk.set_measurement("records_processed", 10000, "none")
```

### User Context (Future)
```typescript
// When users are implemented
Sentry.setUser({
  id: user.id,
  email: user.email,
  role: user.role,
  school_id: user.school_id
});
```

## 📞 Support & Resources

- **Sentry Documentation**: https://docs.sentry.io/
- **Node.js Integration**: https://docs.sentry.io/platforms/javascript/guides/node/
- **Python Integration**: https://docs.sentry.io/platforms/python/
- **Performance Monitoring**: https://docs.sentry.io/product/performance/
- **Education Program**: https://sentry.io/for/education/

## ✅ Checklist

- [ ] Sentry account created
- [ ] Projects created for each component
- [ ] DSN keys copied and configured
- [ ] Dependencies installed
- [ ] Integration tested in development
- [ ] Alert rules configured
- [ ] Slack/GitHub integrations set up
- [ ] Production environment configured
- [ ] Release tracking implemented
- [ ] Cost optimization applied
- [ ] Team trained on Sentry dashboard

## 🎉 Success Criteria

After setup, you should see:
- ✅ Real-time error tracking across all components
- ✅ Performance metrics and slow query detection  
- ✅ Automatic Slack alerts for critical issues
- ✅ Release health tracking with each deployment
- ✅ Detailed error context with stack traces
- ✅ Proactive issue detection before users report problems

Your ANDI application now has enterprise-grade error tracking and performance monitoring! 🚀