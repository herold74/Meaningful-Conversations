# Gemini API Cost Tracking - Implementation Summary

## ✅ What Has Been Implemented

A comprehensive API usage tracking and cost monitoring system has been implemented for your Meaningful Conversations application. This system tracks all Gemini API calls, calculates costs, and provides detailed analytics through an admin dashboard.

## 📊 Key Features

### 1. **Automatic Usage Tracking**
- **Every API call** to Gemini is automatically tracked
- Records token counts (input/output)
- Calculates costs based on current pricing
- Tracks response times and success/failure rates
- Distinguishes between guest and registered users

### 2. **Comprehensive Admin Dashboard**
Located in Admin Console > API Usage tab, the dashboard provides:

- **Summary Cards**:
  - Total cost for selected period
  - Total API calls (with success/failure breakdown)
  - Total tokens (input/output split)
  - Average response time
  - Guest vs. registered user breakdown

- **Cost Projections**:
  - Monthly cost projection based on last 7 days
  - Daily averages for cost, calls, and tokens
  - Helps with budget planning

- **Usage Breakdown Tables**:
  - By Model (Flash vs Pro comparison)
  - By Endpoint (chat, analyze, format-interview)
  - By Bot (which coaches are most used)
  - By User (top 10 users by cost)

- **Daily Usage Trends**:
  - Day-by-day breakdown
  - Identify spikes and patterns
  - Track growth over time

- **Flexible Time Ranges**:
  - Quick selectors: Last 7/30/90 days
  - Custom date range option

### 3. **Cost Information**
Current Gemini API pricing tracked:

| Model | Input Cost | Output Cost |
|-------|-----------|-------------|
| Gemini 2.5 Flash | $0.075 per 1M tokens | $0.30 per 1M tokens |
| Gemini 2.5 Pro | $1.25 per 1M tokens | $5.00 per 1M tokens |

**Cost Comparison**: Flash is ~16x cheaper than Pro!

## 🗄️ Database Changes

### New Table: `ApiUsage`

Stores detailed information about each API call:
- User ID (for registered users) or guest flag
- Endpoint and model used
- Token counts and costs
- Performance metrics (duration, success)
- Timestamp for trend analysis

The migration file has been created at:
```
meaningful-conversations-backend/prisma/migrations/20251106_add_api_usage/migration.sql
```

## 📁 Files Created/Modified

### New Files:
1. **`meaningful-conversations-backend/services/apiUsageTracker.js`**
   - Core tracking logic
   - Cost calculation functions
   - Statistics aggregation

2. **`meaningful-conversations-backend/routes/apiUsage.js`**
   - Admin API endpoints for viewing usage data
   - 5 endpoints: stats, daily, top-users, recent, projections

3. **`components/ApiUsageView.tsx`**
   - React component for admin dashboard
   - Charts, tables, and summary cards
   - Uses Feather icons for consistency

4. **`components/icons/ZapIcon.tsx`**
   - Feather icon for tokens/processing power

5. **`components/icons/ClockIcon.tsx`**
   - Feather icon for time/duration metrics

6. **`components/icons/TrendingUpIcon.tsx`**
   - Feather icon for cost projections/trends

7. **`meaningful-conversations-backend/API-USAGE-TRACKING.md`**
   - Comprehensive documentation
   - API reference
   - Troubleshooting guide

8. **`meaningful-conversations-backend/prisma/migrations/20251106_add_api_usage/migration.sql`**
   - Database migration for ApiUsage table

### Modified Files:
1. **`meaningful-conversations-backend/prisma/schema.prisma`**
   - Added ApiUsage model

2. **`meaningful-conversations-backend/routes/gemini.js`**
   - Integrated usage tracking into all 3 endpoints:
     - `/chat/send-message`
     - `/session/analyze`
     - `/session/format-interview`

3. **`meaningful-conversations-backend/server.js`**
   - Registered new `/api/api-usage` routes

4. **`components/AdminView.tsx`**
   - Added new "API Usage" tab
   - Integrated ApiUsageView component

5. **`public/locales/en.json` & `de.json`**
   - Added localization strings for API Usage tab

## 🚀 Deployment Steps

### Step 1: Deploy to Staging

```bash
# From your local machine
cd /Users/gherold/Meaningful-Conversations-Project

# Deploy backend and frontend to staging
make deploy-alternative-staging
```

### Step 2: Run Database Migration

```bash
# SSH into your server
ssh root@46.224.37.130

# Navigate to staging directory
cd /opt/meaningful-conversations-staging

# Run migration
podman exec meaningful-conversations-backend-staging npx prisma migrate deploy

# Verify migration succeeded
podman exec meaningful-conversations-backend-staging npx prisma migrate status
```

### Step 3: Restart Services (if needed)

```bash
# On server, if migration doesn't auto-restart
cd /opt/meaningful-conversations-staging
podman-compose -f podman-compose-staging.yml restart backend
```

### Step 4: Verify

1. Go to https://mc-beta.manualmode.at
2. Log in as admin
3. Navigate to Admin Console
4. Click on "API USAGE" tab
5. The dashboard should load (may show no data initially)
6. Make some API calls (chat with a bot, analyze a session)
7. Refresh the API Usage tab to see tracked data

### Step 5: Deploy to Production (when ready)

```bash
# From local machine
make deploy-alternative-production

# On server
ssh root@46.224.37.130
cd /opt/meaningful-conversations-production
podman exec meaningful-conversations-backend-production npx prisma migrate deploy
```

## 📈 How to Use

### Viewing Current Usage

1. **Log in as admin** at https://mc-beta.manualmode.at
2. Navigate to **Admin Console**
3. Click **"API USAGE"** tab
4. Select time range (default: Last 30 Days)

### Understanding the Projections

The **Cost Projections** alert shows:
- **Projected Monthly Cost**: Based on last 7 days of usage
- **Daily Average**: Cost and calls per day
- Helps you estimate monthly bills and budget accordingly

### Identifying Cost Optimization Opportunities

1. **Check Model Distribution**:
   - Are you using Pro where Flash would suffice?
   - Chat interactions should use Flash (cheaper)
   - Analysis/formatting can use Pro (higher quality)

2. **Review Endpoint Usage**:
   - Which features are most expensive?
   - Can any be optimized or cached?

3. **Analyze Top Users**:
   - Are power users getting value?
   - Consider usage limits or tiered pricing
   - Engage with top users for feedback

4. **Monitor Daily Trends**:
   - Identify usage spikes
   - Correlate with marketing campaigns
   - Plan capacity for expected growth

## 💰 Cost Estimates (Example)

### Scenario: 1000 Active Users/Month

Assuming average user has 10 chat sessions with:
- 5 messages per session
- 1 session analysis
- 1 context update

**Estimated Costs:**
- Chat (Flash): ~15,000 calls × 800 tokens avg × $0.000375/call = **$5.63**
- Analysis (Pro): ~1,000 calls × 5,000 tokens avg × $0.00625/call = **$6.25**
- **Total: ~$12/month** for 1,000 active users

Your actual costs will vary based on:
- Context file sizes (larger = more input tokens)
- Conversation length
- Feature usage patterns

## 🔍 API Endpoints (For Integration)

All endpoints require admin authentication:

- `GET /api/api-usage/stats?startDate=...&endDate=...`
- `GET /api/api-usage/daily?startDate=...&endDate=...`
- `GET /api/api-usage/top-users?limit=10`
- `GET /api/api-usage/recent?limit=50`
- `GET /api/api-usage/projections`

See `meaningful-conversations-backend/API-USAGE-TRACKING.md` for detailed API documentation.

## 🎯 Cost Optimization Tips

### 1. **Optimize Context Files**
- Encourage users to keep context concise
- Large context files = higher input token costs
- Consider implementing context summarization

### 2. **Smart Model Selection**
Your current configuration is already optimized:
- ✅ Chat uses Flash (cheaper)
- ✅ Analysis uses Pro (better quality)
- ✅ Formatting uses Pro (structured output)

### 3. **Future: Implement Caching**
Gemini supports prompt caching which could reduce costs by 50-90%:
- Cache system instructions (same for all users)
- Cache user context (reuse in same session)
- Requires code changes (not included in this implementation)

### 4. **Monitor Guest Usage**
- Guest users are currently unlimited
- Consider adding restrictions or rate limits
- Track guest vs. registered user costs

### 5. **Set Budget Alerts**
- Define monthly budget threshold
- Implement email alerts (future enhancement)
- Take action before costs spiral

## 🛠️ Troubleshooting

### Dashboard Shows No Data

1. **Check if migration ran**:
   ```bash
   ssh root@46.224.37.130
   podman exec meaningful-conversations-backend-staging npx prisma migrate status
   ```

2. **Make some API calls**:
   - Chat with a bot
   - Analyze a session
   - Wait a few seconds, then refresh dashboard

3. **Check backend logs**:
   ```bash
   podman logs meaningful-conversations-backend-staging --tail 50
   ```

### Costs Don't Match Expectations

1. Verify pricing in `services/apiUsageTracker.js`
2. Check token counts in database
3. Review Gemini API documentation for pricing updates

### Slow Dashboard Loading

1. Ensure database indexes exist (they're created by migration)
2. Consider reducing date range
3. Archive old data (> 1 year)

## 📚 Additional Documentation

- **Full Documentation**: `/meaningful-conversations-backend/API-USAGE-TRACKING.md`
- **Gemini Pricing**: https://ai.google.dev/pricing
- **Prisma Schema**: `/meaningful-conversations-backend/prisma/schema.prisma`

## 🚦 Next Steps

### Immediate (Required)
1. ✅ Deploy to staging
2. ✅ Run database migration
3. ✅ Test admin dashboard
4. ✅ Monitor for a few days

### Short Term (Recommended)
1. Set a monthly budget threshold
2. Review costs weekly
3. Analyze top users and endpoints
4. Consider implementing budget alerts

### Long Term (Optional)
1. Implement prompt caching (50-90% cost savings)
2. Add graphical charts to dashboard
3. Create automated monthly reports
4. Implement rate limiting per user tier
5. Add export functionality (CSV/PDF)

## 🎉 Benefits

With this implementation, you now have:

✅ **Complete visibility** into API costs
✅ **Data-driven insights** for optimization
✅ **Budget forecasting** capabilities
✅ **User behavior analytics**
✅ **Performance monitoring** (response times)
✅ **Cost attribution** by feature/model/user

You can now make informed decisions about:
- Feature development priorities
- User tier pricing
- Budget allocation
- Performance optimization
- Capacity planning

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review backend logs
3. Verify database migration status
4. Consult the detailed documentation in `API-USAGE-TRACKING.md`

---

**Implementation Date**: November 6, 2024
**Status**: ✅ Ready for Deployment
**Testing**: Pending deployment to staging

Enjoy your new cost tracking capabilities! 🎊

