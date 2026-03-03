const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient.js');
const adminAuthMiddleware = require('../middleware/adminAuth.js');
const optionalAuth = require('../middleware/optionalAuth.js');

/**
 * POST /api/analytics/event
 * Track a user event (public endpoint)
 */
router.post('/event', optionalAuth, async (req, res) => {
  try {
    const { eventType, metadata } = req.body;
    const userId = req.userId || null;

    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    // Validate eventType (whitelist allowed events)
    const allowedEventTypes = ['GUEST_LOGIN', 'PAGE_VIEW', 'FEATURE_USE', 'INTENT_SELECTED'];
    if (!allowedEventTypes.includes(eventType)) {
      return res.status(400).json({ error: 'Invalid eventType' });
    }

    const event = await prisma.userEvent.create({
      data: {
        eventType,
        userId: userId || null,
        metadata: metadata || null,
      },
    });

    res.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

/**
 * GET /api/analytics/guest-logins/stats
 * Get guest login statistics (admin only)
 * Query params:
 *   - startDate: ISO date string (default: 30 days ago)
 *   - endDate: ISO date string (default: now)
 */
router.get('/guest-logins/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Get all guest login events in the date range
    const events = await prisma.userEvent.findMany({
      where: {
        eventType: 'GUEST_LOGIN',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by date
    const dailyStats = {};
    events.forEach(event => {
      const dateKey = event.createdAt.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          count: 0,
        };
      }
      dailyStats[dateKey].count++;
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
      totalCount: events.length,
      daily: dailyArray,
    });
  } catch (error) {
    console.error('Error fetching guest login stats:', error);
    res.status(500).json({ error: 'Failed to fetch guest login statistics' });
  }
});

/**
 * GET /api/analytics/intent-stats
 * Get intent selection distribution (admin only)
 */
router.get('/intent-stats', adminAuthMiddleware, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const events = await prisma.userEvent.findMany({
      where: {
        eventType: 'INTENT_SELECTED',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const intentCounts = {};
    const dailyMap = {};

    events.forEach(event => {
      const intent = event.metadata?.intent || 'unknown';
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;

      const dateKey = event.createdAt.toISOString().split('T')[0];
      if (!dailyMap[dateKey]) dailyMap[dateKey] = {};
      dailyMap[dateKey][intent] = (dailyMap[dateKey][intent] || 0) + 1;
    });

    const total = events.length;
    const distribution = Object.entries(intentCounts)
      .map(([intent, count]) => ({
        intent,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const daily = Object.entries(dailyMap)
      .map(([date, intents]) => ({ date, ...intents }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ total, distribution, daily });
  } catch (error) {
    console.error('Error fetching intent stats:', error);
    res.status(500).json({ error: 'Failed to fetch intent statistics' });
  }
});

module.exports = router;

