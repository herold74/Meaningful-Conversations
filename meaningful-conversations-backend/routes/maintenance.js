const express = require('express');
const { getCurrentMaintenanceNotice } = require('../services/maintenanceService.js');

const router = express.Router();

// GET /api/maintenance/current — public, no auth (registered users and guests)
router.get('/current', async (req, res) => {
    try {
        const notice = await getCurrentMaintenanceNotice();
        if (!notice) {
            return res.json({ notice: null });
        }
        res.json({
            notice: {
                id: notice.id,
                phase: notice.phase,
                startsAt: notice.startsAt.toISOString(),
                endsAt: notice.endsAt.toISOString(),
                announceAt: notice.announceAt.toISOString(),
                titleDe: notice.titleDe,
                titleEn: notice.titleEn,
                bodyDe: notice.bodyDe,
                bodyEn: notice.bodyEn,
            },
        });
    } catch (error) {
        console.error('[Maintenance] current error:', error);
        res.status(500).json({ error: 'Failed to load maintenance notice.' });
    }
});

module.exports = router;
