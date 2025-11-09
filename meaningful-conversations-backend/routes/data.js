const express = require('express');
const authMiddleware = require('../middleware/auth.js');
const prisma = require('../prismaClient.js');
const bcrypt = require('bcryptjs');

const router = express.Router();
router.use(authMiddleware);

// GET /api/data/user - Get the current user's data
router.get('/user', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            context: user.lifeContext,
            gamificationState: user.gamificationState,
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ error: 'Failed to fetch user data.' });
    }
});

// PUT /api/data/user - Update the current user's data
router.put('/user', async (req, res) => {
    const { context, gamificationState } = req.body;
    try {
        await prisma.user.update({
            where: { id: req.userId },
            data: {
                lifeContext: context,
                gamificationState,
                updatedAt: new Date(),
            },
        });
        res.status(200).json({ message: 'User data saved successfully.' });
    } catch (error) {
        console.error("Error saving user data:", error);
        res.status(500).json({ error: 'Failed to save user data.' });
    }
});

// PUT /api/data/user/profile - Update user profile (name, newsletter)
router.put('/user/profile', async (req, res) => {
    const { firstName, lastName, newsletterConsent } = req.body;
    const userId = req.userId;
    
    try {
        const updateData = {
            updatedAt: new Date(),
        };
        
        // Update name fields if provided
        if (firstName !== undefined) {
            updateData.firstName = firstName || null;
        }
        if (lastName !== undefined) {
            updateData.lastName = lastName || null;
        }
        
        // Update newsletter consent
        if (newsletterConsent !== undefined) {
            updateData.newsletterConsent = newsletterConsent;
            // Set consent date when user first opts in, or clear it when opting out
            if (newsletterConsent) {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (!user.newsletterConsentDate) {
                    updateData.newsletterConsentDate = new Date();
                }
            } else {
                updateData.newsletterConsentDate = null;
            }
        }
        
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
        
        // Return updated user without sensitive fields
        const { passwordHash, encryptionSalt, ...userResponse } = updatedUser;
        res.json({ message: 'Profile updated successfully', user: userResponse });
        
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});

// POST /api/data/redeem-code
router.post('/redeem-code', async (req, res) => {
    const { code } = req.body;
    const userId = req.userId;
    try {
        const upgradeCode = await prisma.upgradeCode.findUnique({ where: { code } });
        if (!upgradeCode || upgradeCode.isUsed) {
            return res.status(404).json({ error: 'Invalid or already used code.' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        let updateData = { updatedAt: new Date() };

        if (upgradeCode.botId === 'ACCESS_PASS_1Y') {
            const now = new Date();
            const oneYearFromNow = new Date(now.setFullYear(now.getFullYear() + 1));
            const newExpiry = (user.accessExpiresAt && new Date(user.accessExpiresAt) > new Date())
                ? new Date(new Date(user.accessExpiresAt).setFullYear(new Date(user.accessExpiresAt).getFullYear() + 1))
                : oneYearFromNow;
            updateData.accessExpiresAt = newExpiry;
        } else if (upgradeCode.botId === 'ACCESS_PASS_3M') {
            const now = new Date();
            const currentExpiry = (user.accessExpiresAt && new Date(user.accessExpiresAt) > now) ? new Date(user.accessExpiresAt) : now;
            currentExpiry.setMonth(currentExpiry.getMonth() + 3);
            updateData.accessExpiresAt = currentExpiry;
        } else if (upgradeCode.botId === 'ACCESS_PASS_1M') {
            const now = new Date();
            const currentExpiry = (user.accessExpiresAt && new Date(user.accessExpiresAt) > now) ? new Date(user.accessExpiresAt) : now;
            currentExpiry.setMonth(currentExpiry.getMonth() + 1);
            updateData.accessExpiresAt = currentExpiry;
        } else if (upgradeCode.botId === 'premium') {
             updateData.isBetaTester = true;
        } else {
            const unlocked = user.unlockedCoaches ? JSON.parse(user.unlockedCoaches) : [];
            if (!unlocked.includes(upgradeCode.botId)) {
                unlocked.push(upgradeCode.botId);
            }
            updateData.unlockedCoaches = JSON.stringify(unlocked);
        }

        const [updatedUser] = await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: updateData,
            }),
            prisma.upgradeCode.update({
                where: { id: upgradeCode.id },
                data: {
                    isUsed: true,
                    usedById: userId,
                },
            }),
        ]);

        const { passwordHash, ...userPayload } = updatedUser;
        res.status(200).json({ user: userPayload });

    } catch (error) {
        console.error("Error redeeming code:", error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// GET /api/data/export - Export all user data (DSGVO Art. 20 - Datenübertragbarkeit)
router.get('/export', async (req, res) => {
    try {
        const userId = req.userId;

        // Fetch all user-related data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                feedbacksByUser: {
                    select: {
                        id: true,
                        rating: true,
                        comments: true,
                        botId: true,
                        lastUserMessage: true,
                        botResponse: true,
                        createdAt: true,
                    },
                },
                upgradeCodesUsedByUser: {
                    select: {
                        code: true,
                        botId: true,
                        createdAt: true,
                        usedAt: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch API usage data
        const apiUsage = await prisma.apiUsage.findMany({
            where: { userId },
            select: {
                id: true,
                endpoint: true,
                model: true,
                botId: true,
                inputTokens: true,
                outputTokens: true,
                durationMs: true,
                createdAt: true,
            },
        });

        // Prepare export data
        const exportData = {
            exportDate: new Date().toISOString(),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName || null,
                lastName: user.lastName || null,
                newsletterConsent: user.newsletterConsent,
                newsletterConsentDate: user.newsletterConsentDate,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLogin: user.lastLogin,
                loginCount: user.loginCount,
                isEmailVerified: user.isEmailVerified,
                isBetaTester: user.isBetaTester,
                isAdmin: user.isAdmin,
                accessExpiresAt: user.accessExpiresAt,
                unlockedCoaches: user.unlockedCoaches ? JSON.parse(user.unlockedCoaches) : [],
            },
            gamificationData: user.gamificationState ? JSON.parse(user.gamificationState) : null,
            lifeContext: {
                note: "Your Life Context is end-to-end encrypted. Only you can decrypt it with your password.",
                encryptedData: user.lifeContext || null,
            },
            feedback: user.feedbacksByUser.map(f => ({
                id: f.id,
                rating: f.rating,
                comments: f.comments,
                botId: f.botId,
                lastUserMessage: f.lastUserMessage,
                botResponse: f.botResponse,
                createdAt: f.createdAt,
            })),
            upgradeCodes: user.upgradeCodesUsedByUser.map(c => ({
                code: c.code,
                botId: c.botId,
                createdAt: c.createdAt,
                usedAt: c.usedAt,
            })),
            apiUsage: apiUsage,
        };

        // Set filename for download
        const filename = `meaningful-conversations-data-export-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');
        res.json(exportData);
    } catch (error) {
        console.error("Error exporting user data:", error);
        res.status(500).json({ error: 'Failed to export user data.' });
    }
});

// PUT /api/data/user/password - Change user password
router.put('/user/password', async (req, res) => {
    const { oldPassword, newPassword, newEncryptedLifeContext } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect current password.' });
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        
        await prisma.user.update({
            where: { id: req.userId },
            data: {
                passwordHash: newPasswordHash,
                lifeContext: newEncryptedLifeContext,
                updatedAt: new Date(),
            },
        });
        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ error: 'Failed to change password.' });
    }
});

// DELETE /api/data/user - Delete user account
router.delete('/user', async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.userId } });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting user account:", error);
        res.status(500).json({ error: 'Failed to delete user account.' });
    }
});

module.exports = router;