/**
 * Returns a safe subset of user fields for API responses.
 *
 * Explicitly allowlists fields so that server-only secrets
 * (activationToken, passwordResetToken, unsubscribeToken, lifeContext …)
 * are never sent to clients, even when new sensitive columns are added to
 * the User model in the future.
 *
 * @param {object} user  Prisma User record
 * @returns {object}
 */
function sanitizeUserForClient(user) {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        preferredLanguage: user.preferredLanguage,
        newsletterConsent: user.newsletterConsent,
        encryptionSalt: user.encryptionSalt,
        isPremium: user.isPremium,
        isClient: user.isClient,
        isAdmin: user.isAdmin,
        isDeveloper: user.isDeveloper,
        coachingMode: user.coachingMode,
        aiRegionPreference: user.aiRegionPreference,
        status: user.status,
        loginCount: user.loginCount,
        lastLogin: user.lastLogin,
        accessExpiresAt: user.accessExpiresAt,
        premiumExpiresAt: user.premiumExpiresAt,
        gamificationState: user.gamificationState,
        unlockedCoaches: user.unlockedCoaches,
        purchasePlatform: user.purchasePlatform,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

module.exports = { sanitizeUserForClient };
