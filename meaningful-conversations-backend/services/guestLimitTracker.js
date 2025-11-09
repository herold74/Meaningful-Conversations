// meaningful-conversations-backend/services/guestLimitTracker.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WEEKLY_MESSAGE_LIMIT = 50;

/**
 * Get the start of the current week (Sunday 00:00 UTC)
 */
function getWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - dayOfWeek);
    weekStart.setUTCHours(0, 0, 0, 0);
    return weekStart;
}

/**
 * Check if a guest has messages remaining this week
 * @param {string} fingerprint - Browser fingerprint
 * @returns {Promise<{allowed: boolean, remaining: number, messageCount: number}>}
 */
async function checkGuestLimit(fingerprint) {
    try {
        const weekStart = getWeekStart();
        
        // Find or create guest usage record
        let guestUsage = await prisma.guestUsage.findUnique({
            where: { fingerprint }
        });

        // If no record exists, guest has full quota
        if (!guestUsage) {
            return {
                allowed: true,
                remaining: WEEKLY_MESSAGE_LIMIT,
                messageCount: 0
            };
        }

        // Check if the week has reset
        const recordWeekStart = new Date(guestUsage.weekStart);
        if (recordWeekStart < weekStart) {
            // New week - reset the count
            guestUsage = await prisma.guestUsage.update({
                where: { fingerprint },
                data: {
                    messageCount: 0,
                    weekStart: weekStart
                }
            });
        }

        const remaining = WEEKLY_MESSAGE_LIMIT - guestUsage.messageCount;
        return {
            allowed: remaining > 0,
            remaining: Math.max(0, remaining),
            messageCount: guestUsage.messageCount
        };

    } catch (error) {
        console.error('Error checking guest limit:', error);
        // On error, allow the request (fail open)
        return {
            allowed: true,
            remaining: WEEKLY_MESSAGE_LIMIT,
            messageCount: 0
        };
    }
}

/**
 * Increment the message count for a guest
 * @param {string} fingerprint - Browser fingerprint
 * @returns {Promise<{messageCount: number, remaining: number}>}
 */
async function incrementGuestUsage(fingerprint) {
    try {
        const weekStart = getWeekStart();

        // Upsert: create if doesn't exist, update if it does
        const guestUsage = await prisma.guestUsage.upsert({
            where: { fingerprint },
            update: {
                messageCount: { increment: 1 }
            },
            create: {
                fingerprint,
                messageCount: 1,
                weekStart: weekStart
            }
        });

        const remaining = WEEKLY_MESSAGE_LIMIT - guestUsage.messageCount;
        return {
            messageCount: guestUsage.messageCount,
            remaining: Math.max(0, remaining)
        };

    } catch (error) {
        console.error('Error incrementing guest usage:', error);
        throw error;
    }
}

/**
 * Clean up old guest usage records (older than 7 days)
 * Called periodically to prevent database bloat
 */
async function cleanupExpiredGuestRecords() {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const result = await prisma.guestUsage.deleteMany({
            where: {
                lastUsed: {
                    lt: sevenDaysAgo
                }
            }
        });

        if (result.count > 0) {
            console.log(`Cleaned up ${result.count} expired guest usage records`);
        }

        return result.count;

    } catch (error) {
        console.error('Error cleaning up expired guest records:', error);
        return 0;
    }
}

/**
 * Get statistics about guest usage
 * @returns {Promise<{totalGuests: number, activeThisWeek: number, averageMessages: number}>}
 */
async function getGuestStats() {
    try {
        const weekStart = getWeekStart();

        const [totalGuests, activeThisWeek, usageData] = await Promise.all([
            prisma.guestUsage.count(),
            prisma.guestUsage.count({
                where: {
                    weekStart: {
                        gte: weekStart
                    }
                }
            }),
            prisma.guestUsage.findMany({
                select: { messageCount: true }
            })
        ]);

        const totalMessages = usageData.reduce((sum, record) => sum + record.messageCount, 0);
        const averageMessages = totalGuests > 0 ? (totalMessages / totalGuests).toFixed(2) : 0;

        return {
            totalGuests,
            activeThisWeek,
            averageMessages: parseFloat(averageMessages)
        };

    } catch (error) {
        console.error('Error fetching guest stats:', error);
        return {
            totalGuests: 0,
            activeThisWeek: 0,
            averageMessages: 0
        };
    }
}

/**
 * Initialize cleanup interval (run every 24 hours)
 */
function initCleanup() {
    // Run cleanup immediately on startup
    cleanupExpiredGuestRecords();
    
    // Then run every 24 hours
    setInterval(cleanupExpiredGuestRecords, 24 * 60 * 60 * 1000);
    
    console.log('Guest limit tracker cleanup initialized');
}

module.exports = {
    checkGuestLimit,
    incrementGuestUsage,
    cleanupExpiredGuestRecords,
    getGuestStats,
    initCleanup,
    WEEKLY_MESSAGE_LIMIT
};

