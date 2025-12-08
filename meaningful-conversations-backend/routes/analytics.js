const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient.js');
const adminAuthMiddleware = require('../middleware/adminAuth.js');

/**
 * POST /api/analytics/event
 * Track a user event (public endpoint)
 */
router.post('/event', async (req, res) => {
  try {
    const { eventType, userId, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    // Validate eventType (whitelist allowed events)
    const allowedEventTypes = ['GUEST_LOGIN', 'PAGE_VIEW', 'FEATURE_USE'];
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

module.exports = router;

