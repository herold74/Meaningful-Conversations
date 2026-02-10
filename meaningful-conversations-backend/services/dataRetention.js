/**
 * GDPR Data Retention Service
 * 
 * Automatically deletes old records according to defined retention policies:
 * - ApiUsage: 12 months (Art. 5 Abs. 1 lit. e DSGVO - Speicherbegrenzung)
 * - UserEvent: 6 months (analytics events, no long-term need)
 * 
 * Other tables:
 * - GuestUsage: 7 days (handled by guestLimitTracker.js)
 * - SessionBehaviorLog: kept (needed for profile refinement; deleted with account)
 * - Feedback: kept (useful for service improvement; deleted with account via CASCADE)
 */

const prisma = require('../prismaClient.js');

const RETENTION_POLICIES = {
    apiUsage: { months: 12, label: 'API usage records' },
    userEvent: { months: 6, label: 'user event records' },
};

/**
 * Run all retention cleanup tasks
 */
async function runRetentionCleanup() {
    console.log('[DataRetention] Starting scheduled data retention cleanup...');

    // Clean up ApiUsage older than 12 months
    try {
        const apiCutoff = new Date();
        apiCutoff.setMonth(apiCutoff.getMonth() - RETENTION_POLICIES.apiUsage.months);

        const apiResult = await prisma.apiUsage.deleteMany({
            where: { createdAt: { lt: apiCutoff } },
        });

        if (apiResult.count > 0) {
            console.log(`[DataRetention] Deleted ${apiResult.count} ${RETENTION_POLICIES.apiUsage.label} older than ${RETENTION_POLICIES.apiUsage.months} months`);
        }
    } catch (error) {
        console.error('[DataRetention] Error cleaning up ApiUsage:', error);
    }

    // Clean up UserEvent older than 6 months
    try {
        const eventCutoff = new Date();
        eventCutoff.setMonth(eventCutoff.getMonth() - RETENTION_POLICIES.userEvent.months);

        const eventResult = await prisma.userEvent.deleteMany({
            where: { createdAt: { lt: eventCutoff } },
        });

        if (eventResult.count > 0) {
            console.log(`[DataRetention] Deleted ${eventResult.count} ${RETENTION_POLICIES.userEvent.label} older than ${RETENTION_POLICIES.userEvent.months} months`);
        }
    } catch (error) {
        console.error('[DataRetention] Error cleaning up UserEvent:', error);
    }

    console.log('[DataRetention] Retention cleanup completed.');
}

/**
 * Initialize data retention cleanup (runs every 24 hours)
 */
function initDataRetentionCleanup() {
    // Run cleanup immediately on startup
    runRetentionCleanup();

    // Then run every 24 hours
    setInterval(runRetentionCleanup, 24 * 60 * 60 * 1000);

    console.log('[DataRetention] Data retention cleanup initialized (ApiUsage: 12 months, UserEvent: 6 months)');
}

module.exports = {
    runRetentionCleanup,
    initDataRetentionCleanup,
    RETENTION_POLICIES,
};
