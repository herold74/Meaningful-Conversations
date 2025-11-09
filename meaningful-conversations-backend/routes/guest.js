// meaningful-conversations-backend/routes/guest.js

const express = require('express');
const router = express.Router();
const { checkGuestLimit, incrementGuestUsage, getGuestStats } = require('../services/guestLimitTracker');

/**
 * POST /api/guest/check-limit
 * Check if a guest has messages remaining this week
 */
router.post('/check-limit', async (req, res) => {
    try {
        const { fingerprint } = req.body;

        if (!fingerprint || typeof fingerprint !== 'string') {
            return res.status(400).json({ error: 'Invalid fingerprint' });
        }

        // Validate fingerprint format (should be base64-like string, max 64 chars)
        if (fingerprint.length > 64 || !/^[A-Za-z0-9+/=]+$/.test(fingerprint)) {
            return res.status(400).json({ error: 'Invalid fingerprint format' });
        }

        const result = await checkGuestLimit(fingerprint);
        res.status(200).json(result);

    } catch (error) {
        console.error('Error in /api/guest/check-limit:', error);
        res.status(500).json({ error: 'Failed to check guest limit' });
    }
});

/**
 * POST /api/guest/increment-usage
 * Increment the message count for a guest
 */
router.post('/increment-usage', async (req, res) => {
    try {
        const { fingerprint } = req.body;

        if (!fingerprint || typeof fingerprint !== 'string') {
            return res.status(400).json({ error: 'Invalid fingerprint' });
        }

        // Validate fingerprint format
        if (fingerprint.length > 64 || !/^[A-Za-z0-9+/=]+$/.test(fingerprint)) {
            return res.status(400).json({ error: 'Invalid fingerprint format' });
        }

        const result = await incrementGuestUsage(fingerprint);
        res.status(200).json(result);

    } catch (error) {
        console.error('Error in /api/guest/increment-usage:', error);
        res.status(500).json({ error: 'Failed to increment guest usage' });
    }
});

/**
 * GET /api/guest/stats
 * Get guest usage statistics (admin only)
 */
router.get('/stats', async (req, res) => {
    try {
        // Optional: Add admin authentication check here
        // if (!req.userId || !isAdmin(req.userId)) {
        //     return res.status(403).json({ error: 'Unauthorized' });
        // }

        const stats = await getGuestStats();
        res.status(200).json(stats);

    } catch (error) {
        console.error('Error in /api/guest/stats:', error);
        res.status(500).json({ error: 'Failed to fetch guest stats' });
    }
});

module.exports = router;

