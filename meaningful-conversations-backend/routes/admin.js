const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

// --- Admin Authentication Middleware ---
// This middleware ensures that only authenticated administrators can access these routes.
const authAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required: No token provided.' });
        }
        
        const token = authHeader.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await prisma.user.findUnique({ where: { id: decodedToken.userId } });

        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Administrator access required.' });
        }
        
        req.userId = decodedToken.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed: Invalid token.' });
    }
};

// Apply admin middleware to all routes in this file
router.use(authAdmin);


// --- User Management ---

// GET /api/admin/users - Get a list of all non-admin users
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { isAdmin: false },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                isBetaTester: true,
                isAdmin: true,
                createdAt: true,
            }
        });
        res.status(200).json({ users });
    } catch (error) {
        console.error("Admin: Failed to fetch users", error);
        res.status(500).json({ error: "Failed to fetch users." });
    }
});

// PUT /api/admin/users/:userId - Update a user's roles
router.put('/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const { isBetaTester, isAdmin } = req.body;

    const dataToUpdate = {};
    if (typeof isBetaTester === 'boolean') {
        dataToUpdate.isBetaTester = isBetaTester;
    }
     if (typeof isAdmin === 'boolean') {
        dataToUpdate.isAdmin = isAdmin;
    }

    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update provided (isBetaTester or isAdmin).' });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate,
            select: { id: true, email: true, isBetaTester: true, isAdmin: true }
        });
        res.status(200).json({ user: updatedUser });
    } catch (error) {
        console.error(`Admin: Failed to update user ${userId}`, error);
        res.status(500).json({ error: "Failed to update user." });
    }
});


// POST /api/admin/users/:userId/reset-password - Reset a user's password
router.post('/users/:userId/reset-password', async (req, res) => {
    const { userId } = req.params;

    try {
        const newPassword = crypto.randomBytes(6).toString('base64').slice(0, 8);
        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        res.status(200).json({ newPassword });
    } catch (error) {
        console.error(`Admin: Failed to reset password for user ${userId}`, error);
        res.status(500).json({ error: "Failed to reset password." });
    }
});


// --- Upgrade Code Management ---

// GET /api/admin/codes - Get all upgrade codes
router.get('/codes', async (req, res) => {
    try {
        const codes = await prisma.upgradeCode.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                usedBy: {
                    select: { email: true }
                }
            }
        });
        res.status(200).json({ codes });
    } catch (error) {
        console.error("Admin: Failed to fetch codes", error);
        res.status(500).json({ error: "Failed to fetch codes." });
    }
});

// POST /api/admin/codes - Generate a new upgrade code
router.post('/codes', async (req, res) => {
    const { botId } = req.body;
    if (!botId) {
        return res.status(400).json({ error: 'botId is required.' });
    }

    try {
        const code = [
            crypto.randomBytes(2).toString('hex').toUpperCase(),
            crypto.randomBytes(2).toString('hex').toUpperCase(),
            crypto.randomBytes(2).toString('hex').toUpperCase()
        ].join('-');

        const newCode = await prisma.upgradeCode.create({
            data: { code, botId }
        });
        res.status(201).json({ code: newCode });
    } catch (error) {
        console.error("Admin: Failed to generate code", error);
        res.status(500).json({ error: "Failed to generate code." });
    }
});

// DELETE /api/admin/codes/:codeId - Delete an upgrade code
router.delete('/codes/:codeId', async (req, res) => {
    const { codeId } = req.params;
    try {
        await prisma.upgradeCode.delete({
            where: { id: codeId }
        });
        res.status(204).send();
    } catch (error) {
        console.error(`Admin: Failed to delete code ${codeId}`, error);
        res.status(500).json({ error: "Failed to delete code." });
    }
});


module.exports = router;
