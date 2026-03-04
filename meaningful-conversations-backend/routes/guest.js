// meaningful-conversations-backend/routes/guest.js

const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { checkGuestLimit, incrementGuestUsage, getGuestStats } = require('../services/guestLimitTracker');

const guestEndpointLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { error: 'Too many requests. Please slow down.', errorCode: 'RATE_LIMIT_GUEST' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.use(guestEndpointLimiter);

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

        // Secondary IP-based limit to prevent fingerprint rotation abuse (GDPR-safe: hashed, non-reversible)
        const ipHash = crypto.createHash('sha256').update(req.ip || 'unknown').digest('hex').slice(0, 32);
        const ipKey = `iph:${ipHash}`;
        const ipResult = await checkGuestLimit(ipKey);
        if (!ipResult.allowed) {
            return res.status(429).json({ error: 'Guest message limit reached.', allowed: false, remaining: 0 });
        }

        const result = await incrementGuestUsage(fingerprint);
        await incrementGuestUsage(ipKey);
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
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const stats = await getGuestStats();
        res.status(200).json(stats);

    } catch (error) {
        console.error('Error in /api/guest/stats:', error);
        res.status(500).json({ error: 'Failed to fetch guest stats' });
    }
});

module.exports = router;

