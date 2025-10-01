const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes in this file
router.use(authMiddleware);

// GET /api/data/user - Load user's context and gamification state
router.get('/user', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { lifeContext: true, gamificationState: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        // The lifeContext sent from here is encrypted.
        res.status(200).json({
            context: user.lifeContext || '',
            gamificationState: user.gamificationState || '{}'
        });

    } catch (error) {
        console.error("Error loading user data:", error);
        res.status(500).json({ error: 'Failed to load user data.' });
    }
});

// PUT /api/data/user - Save user's context and gamification state
router.put('/user', async (req, res) => {
    // The context received here is already encrypted by the client.
    const { context, gamificationState } = req.body;

    if (typeof context !== 'string' || typeof gamificationState !== 'string') {
        return res.status(400).json({ error: 'Invalid data format. Both context and gamificationState must be strings.' });
    }

    try {
        await prisma.user.update({
            where: { id: req.userId },
            data: {
                lifeContext: context,
                gamificationState: gamificationState
            }
        });
        res.status(204).send();
    } catch (error) {
        console.error("Error saving user data:", error);
        res.status(500).json({ error: 'Failed to save user data.' });
    }
});

// DELETE /api/data/user - Delete user's account
router.delete('/user', async (req, res) => {
    try {
        await prisma.$transaction(async (tx) => {
            // Unlink any redeemed codes from the user. The code remains 'used'.
            await tx.upgradeCode.updateMany({
                where: { usedById: req.userId },
                data: { usedById: null }
            });
            
            // Delete associated feedback
            await tx.feedback.deleteMany({
                where: { userId: req.userId }
            });

            // Delete the user
            await tx.user.delete({
                where: { id: req.userId }
            });
        });

        res.status(204).send();
    } catch (error) {
        console.error("Error deleting user account:", error);
        res.status(500).json({ error: 'Failed to delete account.' });
    }
});


// PUT /api/data/user/password - Change user's password
router.put('/user/password', async (req, res) => {
    const { oldPassword, newPassword, newEncryptedLifeContext } = req.body;

    if (!oldPassword || !newPassword || newPassword.length < 6 || typeof newEncryptedLifeContext !== 'string') {
        return res.status(400).json({ error: 'Invalid input. Please provide current password, a new password of at least 6 characters, and the re-encrypted context.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId } });

        if (!user || !(await bcrypt.compare(oldPassword, user.passwordHash))) {
            return res.status(401).json({ error: "Incorrect current password." });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: req.userId },
            data: { 
                passwordHash: newPasswordHash,
                lifeContext: newEncryptedLifeContext // Save the re-encrypted context
            }
        });

        res.status(204).send();
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ error: 'Failed to change password.' });
    }
});


// POST /api/data/redeem-code - Redeem an upgrade code
router.post('/redeem-code', async (req, res) => {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'A valid code is required.' });
    }

    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            const upgradeCode = await tx.upgradeCode.findUnique({
                where: { code: code.trim() }
            });

            if (!upgradeCode) {
                const err = new Error("Code not found.");
                err.name = "NotFound";
                throw err;
            }

            if (upgradeCode.isUsed) {
                const err = new Error("Code has already been used.");
                err.name = "Conflict";
                throw err;
            }
            
            await tx.upgradeCode.update({
                where: { id: upgradeCode.id },
                data: { isUsed: true, usedById: req.userId }
            });

            const user = await tx.user.findUnique({ where: { id: req.userId } });
            
            if(!user) {
                throw new Error("User not found during transaction.");
            }
            
            const unlockedCoaches = user.unlockedCoaches ? JSON.parse(user.unlockedCoaches) : [];
            if (!unlockedCoaches.includes(upgradeCode.botId)) {
                unlockedCoaches.push(upgradeCode.botId);
            }

            const finalUser = await tx.user.update({
                where: { id: req.userId },
                data: { unlockedCoaches: JSON.stringify(unlockedCoaches) }
            });

            return finalUser;
        });
        
        res.status(200).json({
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                isBetaTester: updatedUser.isBetaTester,
                isAdmin: updatedUser.isAdmin,
                unlockedCoaches: JSON.parse(updatedUser.unlockedCoaches || '[]'),
                encryptionSalt: updatedUser.encryptionSalt
            }
        });

    } catch (error) {
        if (error.name === 'NotFound') {
            return res.status(404).json({ error: 'Invalid or expired code.' });
        }
        if (error.name === 'Conflict') {
            return res.status(409).json({ error: 'This code has already been redeemed.' });
        }
        console.error("Error redeeming code:", error);
        res.status(500).json({ error: 'Failed to redeem code.' });
    }
});


module.exports = router;
