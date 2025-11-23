const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../middleware/adminAuth.js');
const { getUsageStats, getTopUsers } = require('../services/apiUsageTracker.js');
const prisma = require('../prismaClient.js');

// All routes require admin authentication
router.use(adminAuthMiddleware);

/**
 * GET /api/api-usage/stats
 * Get aggregated usage statistics for a date range
 * Query params:
 *   - startDate: ISO date string (default: 30 days ago)
 *   - endDate: ISO date string (default: now)
 */
router.get('/stats', async (req, res) => {
  try {
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const stats = await getUsageStats(startDate, endDate);

    res.json({
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics' });
  }
});

/**
 * GET /api/api-usage/daily
 * Get daily usage breakdown for a date range
 */
router.get('/daily', async (req, res) => {
  try {
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const usageRecords = await prisma.apiUsage.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        estimatedCostUSD: true,
        model: true,
        endpoint: true,
      },
    });

    // Group by date
    const dailyStats = {};
    usageRecords.forEach(record => {
      const dateKey = record.createdAt.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          calls: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          costUSD: 0,
        };
      }
      const dayStats = dailyStats[dateKey];
      dayStats.calls++;
      dayStats.inputTokens += record.inputTokens;
      dayStats.outputTokens += record.outputTokens;
      dayStats.totalTokens += record.totalTokens;
      dayStats.costUSD += Number(record.estimatedCostUSD);
    });

    // Convert to array and sort by date
    const dailyArray = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json({
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      daily: dailyArray,
    });
  } catch (error) {
    console.error('Error fetching daily usage:', error);
    res.status(500).json({ error: 'Failed to fetch daily usage' });
  }
});

/**
 * GET /api/api-usage/top-users
 * Get top users by API usage
 */
router.get('/top-users', async (req, res) => {
  try {
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const limit = parseInt(req.query.limit) || 10;

    const topUsers = await getTopUsers(startDate, endDate, limit);

    // Enrich with user email
    const enrichedUsers = await Promise.all(
      topUsers.map(async (userUsage) => {
        const user = await prisma.user.findUnique({
          where: { id: userUsage.userId },
          select: { email: true },
        });
        return {
          userId: userUsage.userId,
          email: user?.email || 'Unknown',
          calls: userUsage._count.id,
          inputTokens: userUsage._sum.inputTokens,
          outputTokens: userUsage._sum.outputTokens,
          totalTokens: userUsage._sum.totalTokens,
          costUSD: Number(userUsage._sum.estimatedCostUSD),
        };
      })
    );

    res.json({
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      topUsers: enrichedUsers,
    });
  } catch (error) {
    console.error('Error fetching top users:', error);
    res.status(500).json({ error: 'Failed to fetch top users' });
  }
});

/**
 * GET /api/api-usage/recent
 * Get recent API calls for monitoring
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const recentCalls = await prisma.apiUsage.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        // We don't have a relation defined, so we'll fetch user separately if needed
      },
    });

    // Enrich with user emails
    const enrichedCalls = await Promise.all(
      recentCalls.map(async (call) => {
        let userEmail = null;
        if (call.userId) {
          const user = await prisma.user.findUnique({
            where: { id: call.userId },
            select: { email: true },
          });
          userEmail = user?.email;
        }
        return {
          ...call,
          userEmail,
          estimatedCostUSD: Number(call.estimatedCostUSD),
        };
      })
    );

    res.json({ recentCalls: enrichedCalls });
  } catch (error) {
    console.error('Error fetching recent calls:', error);
    res.status(500).json({ error: 'Failed to fetch recent calls' });
  }
});

/**
 * GET /api/api-usage/projections
 * Project monthly costs based on recent usage
 */
router.get('/projections', async (req, res) => {
  try {
    // Get last 7 days of usage
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const recentStats = await getUsageStats(sevenDaysAgo, now);

    // Calculate daily average
    const daysInPeriod = 7;
    const avgDailyCost = recentStats.totalCostUSD / daysInPeriod;
    const avgDailyCalls = recentStats.totalCalls / daysInPeriod;
    const avgDailyTokens = recentStats.totalTokens / daysInPeriod;

    // Project for 30 days
    const projectedMonthlyCost = avgDailyCost * 30;
    const projectedMonthlyCalls = avgDailyCalls * 30;
    const projectedMonthlyTokens = avgDailyTokens * 30;

    res.json({
      baselinePeriod: {
        days: daysInPeriod,
        start: sevenDaysAgo.toISOString(),
        end: now.toISOString(),
      },
      daily: {
        avgCost: avgDailyCost,
        avgCalls: avgDailyCalls,
        avgTokens: avgDailyTokens,
      },
      monthly: {
        projectedCost: projectedMonthlyCost,
        projectedCalls: projectedMonthlyCalls,
        projectedTokens: projectedMonthlyTokens,
      },
      breakdown: {
        byModel: recentStats.byModel,
        byEndpoint: recentStats.byEndpoint,
      },
    });
  } catch (error) {
    console.error('Error calculating projections:', error);
    res.status(500).json({ error: 'Failed to calculate projections' });
  }
});

/**
 * DELETE /api/api-usage/failed
 * Delete all failed API call records from the database
 */
router.delete('/failed', async (req, res) => {
  try {
    const result = await prisma.apiUsage.deleteMany({
      where: {
        success: false,
      },
    });

    console.log(`Deleted ${result.count} failed API call records`);

    res.json({
      success: true,
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} failed API call records`,
    });
  } catch (error) {
    console.error('Error deleting failed API calls:', error);
    res.status(500).json({ error: 'Failed to delete failed API calls' });
  }
});

module.exports = router;

