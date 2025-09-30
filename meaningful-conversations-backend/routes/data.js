const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/data/user - Load user's context and gamification state
router.get('/user', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                lifeContext: true,
                gamificationState: true,
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // The gamification state is stored as a JSON string, so we need to parse it.
        // Provide a default empty state if it's null or invalid.
        let gamificationState = {};
        try {
            gamificationState = JSON.parse(user.gamificationState || '{}');
        } catch (e) {
            console.error(`Failed to parse gamificationState for user ${req.userId}`, e);
        }

        res.status(200).json({
            lifeContext: user.lifeContext || '',
            gamificationState: gamificationState,
        });

    } catch (error) {
        console.error("Error loading user data:", error);
        res.status(500).json({ error: "Failed to load user data." });
    }
});

// PUT /api/data/user - Save user's context and gamification state
router.put('/user', authMiddleware, async (req, res) => {
    const { lifeContext, gamificationState } = req.body;

    if (typeof lifeContext === 'undefined' || typeof gamificationState === 'undefined') {
        return res.status(400).json({ error: "Missing lifeContext or gamificationState." });
    }

    try {
        await prisma.user.update({
            where: { id: req.userId },
            data: {
                lifeContext,
                // The gamification state comes as a JSON object, we stringify it for DB storage.
                gamificationState: JSON.stringify(gamificationState),
            }
        });

        // The frontend expects the updated state object back.
        res.status(200).json(gamificationState);

    } catch (error) {
        console.error("Error saving user data:", error);
        res.status(500).json({ error: "Failed to save user data." });
    }
});

// DELETE /api/data/user - Delete user's account
router.delete('/user', authMiddleware, async (req, res) => {
    try {
        await prisma.user.delete({
            where: { id: req.userId }
        });
        res.status(204).send(); // Success, no content
    } catch (error) {
        console.error("Error deleting user account:", error);
        res.status(500).json({ error: "Failed to delete account." });
    }
});

module.exports = router;