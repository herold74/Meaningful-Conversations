const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient.js');

const JWT_SECRET = process.env.JWT_SECRET;
const CURRENT_VERSION = process.env.VERSION || 'unknown';

// In-memory tracking of user deployment versions from heartbeats
// Map: userId -> { version: string, lastSeen: Date, email: string }
const userVersions = new Map();

// Cleanup stale entries older than 30 minutes
const STALE_THRESHOLD_MS = 30 * 60 * 1000;

const cleanupStaleEntries = () => {
    const now = Date.now();
    for (const [userId, data] of userVersions.entries()) {
        if (now - data.lastSeen.getTime() > STALE_THRESHOLD_MS) {
            userVersions.delete(userId);
        }
    }
};

// Run cleanup every 5 minutes
setInterval(cleanupStaleEntries, 5 * 60 * 1000);

/**
 * GET /api/deployment/active-sessions
 * Returns count of users with tokens from old deployment versions
 * Uses actual heartbeat data from in-memory tracking for accurate results.
 */
router.get('/active-sessions', async (req, res) => {
    try {
        // Cleanup stale entries first
        cleanupStaleEntries();
        
        // Separate users by deployment version
        const oldVersionUsers = [];
        const currentVersionUsers = [];
        
        for (const [userId, data] of userVersions.entries()) {
            if (data.version !== CURRENT_VERSION) {
                oldVersionUsers.push({
                    email: data.email,
                    version: data.version,
                    lastActivity: data.lastSeen
                });
            } else {
                currentVersionUsers.push({
                    email: data.email,
                    version: data.version,
                    lastActivity: data.lastSeen
                });
            }
        }

        res.json({
            totalActiveUsers: userVersions.size,
            oldVersionSessions: oldVersionUsers.length,
            currentVersionSessions: currentVersionUsers.length,
            currentVersion: CURRENT_VERSION,
            trackedSince: userVersions.size > 0 ? 'heartbeat-based' : 'no-data',
            oldVersionUsers: oldVersionUsers,
            currentVersionUsers: currentVersionUsers.map(u => ({ email: u.email }))
        });
        
    } catch (error) {
        console.error('Error checking active sessions:', error);
        res.status(500).json({ error: 'Failed to check active sessions' });
    }
});

/**
 * POST /api/deployment/heartbeat
 * Users periodically call this to register their deployment version
 * This allows accurate tracking of which container users are on
 */
router.post('/heartbeat', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Extract deployment version from token
        const deploymentVersion = decoded.deploymentVersion || 'unknown';
        
        // Get user email for reporting
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { email: true }
        });
        
        // Store version in memory for accurate tracking
        userVersions.set(decoded.userId, {
            version: deploymentVersion,
            lastSeen: new Date(),
            email: user?.email || 'unknown'
        });
        
        // Update user's last activity time in DB
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { lastLogin: new Date() }
        });
        
        res.json({
            version: deploymentVersion,
            currentVersion: CURRENT_VERSION,
            isLatest: deploymentVersion === CURRENT_VERSION,
            trackedUsers: userVersions.size
        });
        
    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ error: 'Failed to process heartbeat' });
    }
});

module.exports = router;

