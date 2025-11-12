const express = require('express');
const prisma = require('../prismaClient.js');
const adminAuth = require('../middleware/adminAuth.js');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Apply admin authentication to all routes in this file
router.use(adminAuth);

// --- User Management ---

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                createdAt: true,
                isAdmin: true,
                isBetaTester: true,
                loginCount: true,
                lastLogin: true,
                gamificationState: true,
                status: true,
            }
        });
        res.json(users);
    } catch (error) {
        console.error("Admin: Error fetching users:", error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// PUT /api/admin/users/:id/activate
router.put('/users/:id/activate', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (user.status !== 'PENDING') {
            return res.status(400).json({ error: 'User is not pending activation.' });
        }

        await prisma.user.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                activationToken: null,
                activationTokenExpires: null,
            },
        });
        res.status(204).send();
    } catch (error) {
        console.error("Admin: Error activating user:", error);
        res.status(500).json({ error: 'Operation failed.' });
    }
});

// PUT /api/admin/users/:id/toggle-premium
router.put('/users/:id/toggle-premium', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        await prisma.user.update({
            where: { id },
            data: { isBetaTester: !user.isBetaTester },
        });
        res.status(204).send();
    } catch (error) {
        console.error("Admin: Error toggling premium:", error);
        res.status(500).json({ error: 'Operation failed.' });
    }
});

// PUT /api/admin/users/:id/toggle-admin
router.put('/users/:id/toggle-admin', async (req, res) => {
    const { id } = req.params;

    if (id === req.userId) {
        return res.status(403).json({ error: 'Cannot change your own admin status.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        await prisma.user.update({
            where: { id },
            data: { isAdmin: !user.isAdmin },
        });
        res.status(204).send();
    } catch (error) {
        console.error("Admin: Error toggling admin:", error);
        res.status(500).json({ error: 'Operation failed.' });
    }
});

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', async (req, res) => {
    const { id } = req.params;
    try {
        const newPassword = crypto.randomBytes(8).toString('hex');
        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id },
            data: {
                passwordHash,
                lifeContext: '', // Data is lost on password reset
                passwordResetToken: null,
                passwordResetTokenExpires: null,
            },
        });

        res.json({ newPassword });
    } catch (error) {
        console.error("Admin: Error resetting password:", error);
        res.status(500).json({ error: 'Operation failed.' });
    }
});


// --- Upgrade Code Management ---

// GET /api/admin/codes
router.get('/codes', async (req, res) => {
    try {
        const rawCodes = await prisma.upgradeCode.findMany({
            orderBy: { createdAt: 'desc' },
            include: { usedByUser: { select: { email: true } } },
        });

        // Transform the data to match the frontend's expectation of a 'usedBy' field
        const codes = rawCodes.map(c => {
            const { usedByUser, ...rest } = c;
            return { ...rest, usedBy: usedByUser };
        });

        res.json(codes);
    } catch (error) {
        console.error("Admin: Error fetching codes:", error);
        res.status(500).json({ error: 'Failed to fetch upgrade codes.' });
    }
});

// POST /api/admin/codes
router.post('/codes', async (req, res) => {
    const { botId } = req.body;
    if (!botId) return res.status(400).json({ error: 'botId is required.' });

    try {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        const newCode = await prisma.upgradeCode.create({
            data: { code, botId },
        });
        res.status(201).json(newCode);
    } catch (error) {
        console.error("Admin: Error creating code:", error);
        res.status(500).json({ error: 'Failed to create code.' });
    }
});

// POST /api/admin/codes/bulk
router.post('/codes/bulk', async (req, res) => {
    const { botId, quantity } = req.body;
    
    if (!botId) {
        return res.status(400).json({ error: 'botId is required.' });
    }
    
    if (!quantity || quantity < 1 || quantity > 100) {
        return res.status(400).json({ error: 'Quantity must be between 1 and 100.' });
    }

    try {
        const codes = [];
        
        // Generate codes in batch
        for (let i = 0; i < quantity; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            const newCode = await prisma.upgradeCode.create({
                data: { code, botId },
            });
            codes.push({
                code: newCode.code,
                botId: newCode.botId,
                createdAt: newCode.createdAt,
            });
        }

        res.json({ codes, count: codes.length });
    } catch (error) {
        console.error("Admin: Error creating bulk codes:", error);
        res.status(500).json({ error: 'Failed to create bulk codes.' });
    }
});

// DELETE /api/admin/codes/:id
router.delete('/codes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.upgradeCode.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error("Admin: Error deleting code:", error);
        res.status(500).json({ error: 'Failed to delete code.' });
    }
});

// POST /api/admin/codes/:id/revoke
router.post('/codes/:id/revoke', async (req, res) => {
    const { id } = req.params;
    try {
        const code = await prisma.upgradeCode.findUnique({ where: { id } });
        if (!code || !code.isUsed || !code.usedById) {
            return res.status(404).json({ error: 'Code not found or not used.' });
        }

        const user = await prisma.user.findUnique({ where: { id: code.usedById } });
        if (user) {
            let updateData = {};
            if (code.botId === 'premium') {
                updateData.isBetaTester = false;
            } else {
                const unlocked = JSON.parse(user.unlockedCoaches || '[]');
                const newUnlocked = unlocked.filter(coachId => coachId !== code.botId);
                updateData.unlockedCoaches = JSON.stringify(newUnlocked);
            }
            await prisma.user.update({
                where: { id: user.id },
                data: updateData
            });
        }
        
        await prisma.upgradeCode.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error("Admin: Error revoking code:", error);
        res.status(500).json({ error: 'Failed to revoke code.' });
    }
});


// --- Ticket Management ---

// GET /api/admin/tickets
router.get('/tickets', async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(tickets);
    } catch (error) {
        console.error("Admin: Error fetching tickets:", error);
        res.status(500).json({ error: 'Failed to fetch tickets.' });
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
        console.error("Admin: Error resolving ticket:", error);
        res.status(500).json({ error: 'Failed to resolve ticket.' });
    }
});

// DELETE /api/admin/tickets/:id
router.delete('/tickets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.ticket.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error("Admin: Error deleting ticket:", error);
        res.status(500).json({ error: 'Failed to delete ticket.' });
    }
});


// --- Feedback & Ratings Management ---

// GET /api/admin/feedback
router.get('/feedback', async (req, res) => {
    try {
        const rawFeedback = await prisma.feedback.findMany({
            orderBy: { createdAt: 'desc' },
            include: { feedbackByUser: { select: { email: true } } },
        });
        
        // Transform the data to match the frontend's expectation of a 'user' field
        const feedback = rawFeedback.map(f => {
            const { feedbackByUser, ...rest } = f;
            return { ...rest, user: feedbackByUser };
        });

        res.json(feedback);
    } catch (error) {
        console.error("Admin: Error fetching feedback:", error);
        res.status(500).json({ error: 'Failed to fetch feedback.' });
    }
});

// DELETE /api/admin/feedback/:id (For deleting message reports)
router.delete('/feedback/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.feedback.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error("Admin: Error deleting feedback/report:", error);
        res.status(500).json({ error: 'Failed to delete feedback/report.' });
    }
});

module.exports = router;