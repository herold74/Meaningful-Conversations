const express = require('express');
const prisma = require('../prismaClient.js');
const adminAuthMiddleware = require('../middleware/adminAuth.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const router = express.Router();
router.use(adminAuthMiddleware);

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                isBetaTester: true,
                isAdmin: true,
                unlockedCoaches: true,
                createdAt: true,
                loginCount: true,
                lastLogin: true,
                accessExpiresAt: true,
                gamificationState: true,
            }
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// PUT /api/admin/users/:id/toggle-premium
router.put('/users/:id/toggle-premium', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        await prisma.user.update({
            where: { id },
            data: { isBetaTester: !user.isBetaTester, updatedAt: new Date() },
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// PUT /api/admin/users/:id/toggle-admin
router.put('/users/:id/toggle-admin', async (req, res) => {
    const { id } = req.params;
    const adminUserId = req.userId; // ID of the admin performing the action

    try {
        const userToUpdate = await prisma.user.findUnique({ where: { id } });
        if (!userToUpdate) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent an admin from removing their own admin status.
        if (userToUpdate.id === adminUserId && userToUpdate.isAdmin) {
            return res.status(403).json({ error: 'Admins cannot remove their own admin privileges.' });
        }

        await prisma.user.update({
            where: { id },
            data: { isAdmin: !userToUpdate.isAdmin, updatedAt: new Date() },
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', async (req, res) => {
    const { id } = req.params;
    try {
        const newPassword = crypto.randomBytes(8).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id },
            data: {
                passwordHash,
                lifeContext: '', // Clear encrypted data as it's now unreadable
                passwordResetToken: null,
                passwordResetTokenExpires: null,
                updatedAt: new Date(),
            },
        });
        res.status(200).json({ newPassword });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// GET /api/admin/codes
router.get('/codes', async (req, res) => {
    try {
        const codes = await prisma.upgradeCode.findMany({
            include: { usedBy: { select: { email: true } } }
        });
        res.json(codes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch codes' });
    }
});

// POST /api/admin/codes
router.post('/codes', async (req, res) => {
    const { botId } = req.body;
    try {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        const newCode = await prisma.upgradeCode.create({
            data: { code, botId },
        });
        res.status(201).json(newCode);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create code' });
    }
});

// DELETE /api/admin/codes/:id
router.delete('/codes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.upgradeCode.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete code' });
    }
});

// POST /api/admin/codes/:id/revoke
router.post('/codes/:id/revoke', async (req, res) => {
    const { id } = req.params;
    try {
        const code = await prisma.upgradeCode.findUnique({
            where: { id },
            include: { usedBy: true }
        });

        if (!code) {
            return res.status(404).json({ error: 'Code not found' });
        }
        if (!code.isUsed || !code.usedBy) {
            return res.status(400).json({ error: 'Code has not been used and cannot be revoked.' });
        }

        const user = code.usedBy;
        let updateData = { updatedAt: new Date() };

        if (code.botId === 'ACCESS_PASS_1Y') {
            if (user.accessExpiresAt) {
                const currentExpiry = new Date(user.accessExpiresAt);
                currentExpiry.setFullYear(currentExpiry.getFullYear() - 1);
                updateData.accessExpiresAt = currentExpiry;
            }
        } else if (code.botId === 'ACCESS_PASS_1M') {
             if (user.accessExpiresAt) {
                const currentExpiry = new Date(user.accessExpiresAt);
                currentExpiry.setMonth(currentExpiry.getMonth() - 1);
                updateData.accessExpiresAt = currentExpiry;
            }
        } else if (code.botId === 'premium') {
            updateData.isBetaTester = false;
            // Also revoke big5 analysis access if it exists
            const unlocked = user.unlockedCoaches ? JSON.parse(user.unlockedCoaches) : [];
            const newUnlocked = unlocked.filter(coachId => coachId !== 'big5');
            updateData.unlockedCoaches = JSON.stringify(newUnlocked);
        } else {
            const unlocked = user.unlockedCoaches ? JSON.parse(user.unlockedCoaches) : [];
            const newUnlocked = unlocked.filter(coachId => coachId !== code.botId);
            updateData.unlockedCoaches = JSON.stringify(newUnlocked);
        }

        // Use a transaction to ensure both user and code are updated together
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: updateData
            }),
            prisma.upgradeCode.update({
                where: { id: code.id },
                data: {
                    isUsed: false,
                    usedById: null
                }
            })
        ]);

        res.status(200).json({ message: 'Code revoked successfully.' });
    } catch (error) {
        console.error('Revoke error:', error);
        res.status(500).json({ error: 'Failed to revoke code.' });
    }
});

// GET /api/admin/tickets
router.get('/tickets', async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
             where: { status: 'OPEN' },
             orderBy: { createdAt: 'asc' }
        });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

// PUT /api/admin/tickets/:id/resolve
router.put('/tickets/:id/resolve', async (req, res) => {
    const { id } = req.params;
    try {
        const ticket = await prisma.ticket.update({
            where: { id },
            data: { status: 'RESOLVED' },
        });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: 'Failed to resolve ticket' });
    }
});

// DELETE /api/admin/tickets/:id
router.delete('/tickets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.ticket.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete ticket' });
    }
});

// GET /api/admin/feedback
router.get('/feedback', async (req, res) => {
    try {
        const feedback = await prisma.feedback.findMany({
            include: { user: { select: { email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

// DELETE /api/admin/feedback/:id
router.delete('/feedback/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.feedback.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete feedback' });
    }
});

module.exports = router;