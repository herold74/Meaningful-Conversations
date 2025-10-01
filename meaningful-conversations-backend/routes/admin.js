const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to ensure the user is an admin
const adminMiddleware = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Access is restricted to administrators.' });
        }
        next();
    } catch (error) {
        console.error("Admin check failed:", error);
        res.status(500).json({ error: 'Internal server error during admin check.' });
    }
};

// Apply both auth and admin middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// --- User Management ---

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, isBetaTester: true, isAdmin: true, unlockedCoaches: true, createdAt: true, loginCount: true, lastLogin: true },
            orderBy: { createdAt: 'desc' }
        });

        const usersWithParsedData = users.map(u => ({
            ...u,
            unlockedCoaches: JSON.parse(u.unlockedCoaches || '[]')
        }));

        res.json(usersWithParsedData);
    } catch (error) {
        console.error("Admin get users error:", error);
        res.status(500).json({ error: 'Failed to retrieve users.' });
    }
});

// Helper for toggling boolean fields on a user
const toggleUserField = async (res, userId, field) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { [field]: !user[field] },
        });
        res.json(updatedUser);
    } catch (error) {
        console.error(`Admin toggle ${field} error:`, error);
        res.status(500).json({ error: `Failed to toggle ${field} status.` });
    }
};

// PUT /api/admin/users/:userId/toggle-premium
router.put('/users/:userId/toggle-premium', (req, res) => {
    toggleUserField(res, req.params.userId, 'isBetaTester');
});

// PUT /api/admin/users/:userId/toggle-admin
router.put('/users/:userId/toggle-admin', (req, res) => {
    toggleUserField(res, req.params.userId, 'isAdmin');
});

// POST /api/admin/users/:userId/reset-password
router.post('/users/:userId/reset-password', async (req, res) => {
    try {
        const newPassword = crypto.randomBytes(8).toString('hex');
        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: req.params.userId },
            data: { passwordHash },
        });

        res.json({ newPassword });
    } catch (error) {
        console.error("Admin reset password error:", error);
        res.status(500).json({ error: 'Failed to reset password.' });
    }
});


// --- Upgrade Code Management ---

// GET /api/admin/codes
router.get('/codes', async (req, res) => {
    try {
        const codes = await prisma.upgradeCode.findMany({
            include: { usedBy: { select: { email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(codes);
    } catch (error) {
        console.error("Admin get codes error:", error);
        res.status(500).json({ error: 'Failed to retrieve codes.' });
    }
});

// POST /api/admin/codes
router.post('/codes', async (req, res) => {
    const { botId } = req.body;
    if (!botId) return res.status(400).json({ error: 'botId is required.' });

    try {
        const codeValue = crypto.randomBytes(6).toString('hex').toUpperCase();
        const newCode = await prisma.upgradeCode.create({
            data: {
                code: codeValue,
                botId,
            },
        });
        res.status(201).json(newCode);
    } catch (error) {
        console.error("Admin create code error:", error);
        res.status(500).json({ error: 'Failed to create code.' });
    }
});

// DELETE /api/admin/codes/:codeId
router.delete('/codes/:codeId', async (req, res) => {
    try {
        await prisma.upgradeCode.delete({ where: { id: req.params.codeId } });
        res.status(204).send();
    } catch (error) {
        console.error("Admin delete code error:", error);
        res.status(500).json({ error: 'Failed to delete code.' });
    }
});


// --- Ticket Management ---

// GET /api/admin/tickets
router.get('/tickets', async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(tickets);
    } catch (error) {
        console.error("Admin get tickets error:", error);
        res.status(500).json({ error: 'Failed to retrieve tickets.' });
    }
});

// PUT /api/admin/tickets/:ticketId/resolve
router.put('/tickets/:ticketId/resolve', async (req, res) => {
    try {
        const updatedTicket = await prisma.ticket.update({
            where: { id: req.params.ticketId },
            data: { status: 'RESOLVED' },
        });
        res.json(updatedTicket);
    } catch (error) {
        console.error("Admin resolve ticket error:", error);
        res.status(500).json({ error: 'Failed to resolve ticket.' });
    }
});

module.exports = router;