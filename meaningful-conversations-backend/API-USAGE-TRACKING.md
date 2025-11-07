# API Usage Tracking Documentation

## Overview

This document describes the API usage tracking system implemented for monitoring and analyzing Gemini API costs in the Meaningful Conversations application.

## Purpose

The API usage tracking system provides administrators with:

1. **Cost Monitoring**: Real-time tracking of API costs
2. **Usage Analytics**: Detailed breakdown by model, endpoint, bot, and user
3. **Cost Projections**: Monthly cost estimates based on recent usage
4. **Performance Metrics**: Response times and success rates
5. **User Analytics**: Identify top users by API consumption

## Database Schema

### ApiUsage Table

```prisma
model ApiUsage {
  id               String   @id @default(cuid())
  userId           String?  // User ID (null for guests)
  isGuest          Boolean  @default(true)
  endpoint         String   // 'chat', 'analyze', 'format-interview'
  model            String   // e.g., 'gemini-2.5-flash', 'gemini-2.5-pro'
  botId            String?  // Bot ID (if applicable)
  inputTokens      Int      @default(0)
  outputTokens     Int      @default(0)
  totalTokens      Int      @default(0)
  estimatedCostUSD Decimal  @default(0) @db.Decimal(10, 6)
  durationMs       Int?     // Response time in milliseconds
  success          Boolean  @default(true)
  errorMessage     String?  @db.Text
  metadata         Json?    // Additional metadata
  createdAt        DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
  @@index([model])
  @@index([endpoint])
}
```

## Pricing Structure

Current Gemini API pricing (as of November 2024):

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Gemini 2.5 Flash | $0.075 | $0.30 |
| Gemini 2.5 Pro | $1.25 | $5.00 |

Pricing is configured in `/services/apiUsageTracker.js` and can be updated as needed.

## Architecture

### Backend Components

1. **`services/apiUsageTracker.js`**: Core tracking service
   - `trackApiUsage()`: Records API usage to database
   - `extractTokenUsage()`: Extracts token counts from Gemini response
   - `calculateCost()`: Computes cost based on model and tokens
   - `getUsageStats()`: Aggregates usage statistics
   - `getTopUsers()`: Identifies high-usage users

2. **`routes/apiUsage.js`**: Admin API endpoints
   - `GET /api/api-usage/stats`: Overall statistics for a date range
   - `GET /api/api-usage/daily`: Daily usage breakdown
   - `GET /api/api-usage/top-users`: Top users by cost
   - `GET /api/api-usage/recent`: Recent API calls
   - `GET /api/api-usage/projections`: Monthly cost projections

3. **`routes/gemini.js`**: Integration points
   - All Gemini API calls now track usage
   - Tracks both successful and failed requests
   - Records token counts from API response metadata
   - Measures response duration

### Frontend Components

1. **`components/ApiUsageView.tsx`**: Admin dashboard
   - Summary cards (cost, calls, tokens, response time)
   - Time range selector (7d, 30d, 90d, custom)
   - Cost projections alert
   - Model breakdown table
   - Endpoint breakdown table
   - Top users leaderboard
   - Daily usage trend table

2. **`components/AdminView.tsx`**: Integration
   - New "API Usage" tab in admin console
   - Accessible only to admin users

## Usage

### For Administrators

1. **Access the Dashboard**:
   - Log in as an admin user
   - Navigate to Admin Console
   - Click on the "API USAGE" tab

2. **View Statistics**:
   - Select a time range (Last 7/30/90 days)
   - Review summary cards for quick insights
   - Check cost projections for budget planning

3. **Analyze Usage Patterns**:
   - **By Model**: Compare costs between Flash and Pro models
   - **By Endpoint**: See which features consume most API calls
   - **By Bot**: Identify which coaching bots are most popular
   - **By User**: Find power users for engagement insights

4. **Monitor Daily Trends**:
   - Scroll through the daily breakdown table
   - Identify usage spikes or anomalies
   - Track growth patterns over time

### Cost Optimization Tips

1. **Model Selection**:
   - Use Gemini 2.5 Flash for chat interactions (lower cost)
   - Reserve Gemini 2.5 Pro for analysis and formatting (higher quality)
   - Flash is ~16x cheaper for input, ~16x cheaper for output

2. **Context Management**:
   - Large life context files increase input token costs
   - Encourage users to keep context files focused and concise
   - Consider implementing context summarization for very large files

3. **Caching Strategy** (Future Enhancement):
   - Implement prompt caching for frequently used system instructions
   - Cache user context for multiple messages in same session
   - Could reduce costs by 50-90% for repeated content

4. **Rate Limiting** (Future Enhancement):
   - Set daily/monthly limits per user tier
   - Implement guest user restrictions
   - Add warnings when approaching limits

## Migration

To deploy this feature:

1. **Run Database Migration**:
   ```bash
   cd meaningful-conversations-backend
   npx prisma migrate deploy
   ```

2. **Update Backend**:
   - Deploy updated backend code
   - Restart backend services

3. **Update Frontend**:
   - Build and deploy updated frontend
   - Clear browser cache if needed

4. **Verify**:
   - Make some API calls (chat, analyze, etc.)
   - Check Admin Console > API Usage tab
   - Confirm data is being tracked

## API Endpoints

### GET /api/api-usage/stats

Get aggregated statistics for a date range.

**Query Parameters**:
- `startDate`: ISO date string (default: 30 days ago)
- `endDate`: ISO date string (default: now)

**Response**:
```json
{
  "dateRange": { "start": "...", "end": "..." },
  "stats": {
    "totalCalls": 1500,
    "successfulCalls": 1485,
    "failedCalls": 15,
    "totalInputTokens": 250000,
    "totalOutputTokens": 180000,
    "totalTokens": 430000,
    "totalCostUSD": 12.50,
    "averageDurationMs": 1250,
    "guestCalls": 800,
    "registeredCalls": 700,
    "byModel": { ... },
    "byEndpoint": { ... },
    "byBot": { ... }
  }
}
```

### GET /api/api-usage/daily

Get daily usage breakdown.

**Query Parameters**: Same as `/stats`

**Response**:
```json
{
  "dateRange": { "start": "...", "end": "..." },
  "daily": [
    {
      "date": "2024-11-01",
      "calls": 50,
      "inputTokens": 8000,
      "outputTokens": 6000,
      "totalTokens": 14000,
      "costUSD": 0.42
    },
    ...
  ]
}
```

### GET /api/api-usage/top-users

Get top users by API cost.

**Query Parameters**:
- `startDate`, `endDate`: Date range
- `limit`: Number of users to return (default: 10)

**Response**:
```json
{
  "dateRange": { "start": "...", "end": "..." },
  "topUsers": [
    {
      "userId": "...",
      "email": "user@example.com",
      "calls": 250,
      "inputTokens": 40000,
      "outputTokens": 30000,
      "totalTokens": 70000,
      "costUSD": 2.10
    },
    ...
  ]
}
```

### GET /api/api-usage/projections

Get monthly cost projections based on last 7 days.

**Response**:
```json
{
  "baselinePeriod": {
    "days": 7,
    "start": "...",
    "end": "..."
  },
  "daily": {
    "avgCost": 1.25,
    "avgCalls": 50,
    "avgTokens": 15000
  },
  "monthly": {
    "projectedCost": 37.50,
    "projectedCalls": 1500,
    "projectedTokens": 450000
  },
  "breakdown": {
    "byModel": { ... },
    "byEndpoint": { ... }
  }
}
```

### GET /api/api-usage/recent

Get recent API calls for monitoring.

**Query Parameters**:
- `limit`: Number of recent calls (default: 50)

**Response**:
```json
{
  "recentCalls": [
    {
      "id": "...",
      "userId": "...",
      "userEmail": "user@example.com",
      "endpoint": "chat",
      "model": "gemini-2.5-flash",
      "botId": "g-socratic",
      "inputTokens": 500,
      "outputTokens": 300,
      "totalTokens": 800,
      "estimatedCostUSD": 0.024,
      "durationMs": 1200,
      "success": true,
      "createdAt": "2024-11-06T10:30:00Z"
    },
    ...
  ]
}
```

## Monitoring and Alerts

### Recommended Monitoring Setup

1. **Daily Cost Review**:
   - Check dashboard every morning
   - Review projected monthly costs
   - Identify any unusual spikes

2. **Weekly Analysis**:
   - Review top users
   - Analyze model distribution
   - Check endpoint efficiency

3. **Monthly Reports**:
   - Export monthly statistics
   - Compare to budget
   - Identify optimization opportunities

### Future Alert System (Not Yet Implemented)

Consider implementing:
- Email alerts when daily cost exceeds threshold
- Warnings when projected monthly cost exceeds budget
- Notifications for failed API calls
- User-specific usage alerts

## Troubleshooting

### No Data Appearing

1. Verify database migration ran successfully:
   ```bash
   npx prisma migrate status
   ```

2. Check backend logs for errors:
   ```bash
   # On server
   podman logs meaningful-conversations-backend-staging
   ```

3. Confirm API calls are working normally

### Incorrect Cost Calculations

1. Verify pricing in `services/apiUsageTracker.js`
2. Check token counts in database
3. Review Gemini API response metadata

### Performance Issues

1. Ensure database indexes are created:
   ```sql
   SHOW INDEX FROM ApiUsage;
   ```

2. Consider adding composite indexes for common queries
3. Implement data archiving for old records (e.g., > 1 year)

## Future Enhancements

1. **Graphical Charts**: Add charts for visual trend analysis
2. **Export Functionality**: CSV/PDF export of reports
3. **Budget Alerts**: Email notifications for cost thresholds
4. **Prompt Caching**: Implement Gemini caching for cost savings
5. **Rate Limiting**: Per-user API limits
6. **Cost Attribution**: Track costs by feature/campaign
7. **Comparative Analysis**: Month-over-month comparisons
8. **Real-time Dashboard**: WebSocket updates for live monitoring

## Security Considerations

1. **Admin-Only Access**: All API usage endpoints require admin authentication
2. **No PII Exposure**: User emails only shown to admins
3. **Rate Limiting**: Consider implementing rate limits on admin endpoints
4. **Data Retention**: Consider archiving/deleting old usage data

## Support

For questions or issues:
1. Check backend logs for tracking errors
2. Review database for missing indexes
3. Verify Gemini API responses include usage metadata
4. Contact system administrator for database access issues

