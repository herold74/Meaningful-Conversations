const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient.js');

const JWT_SECRET = process.env.JWT_SECRET;
const CURRENT_VERSION = process.env.VERSION || 'unknown';

/**
 * GET /api/deployment/active-sessions
 * Returns count of users with tokens from old deployment versions
 * This is used during blue-green deployments to determine when
 * the old container can be safely shut down.
 */
router.get('/active-sessions', async (req, res) => {
    try {
        // Get all users with recent activity (within last 7 days - matching token expiry)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);
        
        const activeUsers = await prisma.user.findMany({
            where: {
                lastLogin: { gte: sevenDaysAgo },
                status: 'ACTIVE'
            },
            select: {
                id: true,
                email: true,
                lastLogin: true
            }
        });

        // We can't directly check the JWT deployment version from the DB
        // since tokens are not stored server-side (stateless JWT).
        // Instead, we estimate: users who logged in BEFORE the current deployment
        // are likely on the old version.
        
        // To make this more accurate, we'll need to track actual token versions
        // when users make authenticated requests. For now, we return a conservative
        // estimate based on login timestamps.
        
        // If VERSION env var was just updated, assume users logged in before
        // the last 5 minutes are on the old version (deployment window).
        const deploymentTime = new Date(Date.now() - 5 * 60000); // 5 minutes ago
        
        const oldVersionUsers = activeUsers.filter(user => 
            user.lastLogin < deploymentTime
        );

        res.json({
            totalActiveUsers: activeUsers.length,
            oldVersionSessions: oldVersionUsers.length,
            currentVersion: CURRENT_VERSION,
            deploymentTime: deploymentTime.toISOString(),
            users: oldVersionUsers.map(user => ({
                email: user.email,
                lastActivity: user.lastLogin
            }))
        });
        
    } catch (error) {
        console.error('Error checking active sessions:', error);
        res.status(500).json({ error: 'Failed to check active sessions' });
    }
});

/**
 * POST /api/deployment/heartbeat
 * Users periodically call this to register their deployment version
 * This allows more accurate tracking of which container users are on
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
        
        // Update user's last activity time
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { lastLogin: new Date() }
        });
        
        res.json({
            version: deploymentVersion,
            currentVersion: CURRENT_VERSION,
            isLatest: deploymentVersion === CURRENT_VERSION
        });
        
    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ error: 'Failed to process heartbeat' });
    }
});

module.exports = router;

