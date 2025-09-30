const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply the authentication middleware to all routes in this file
router.use(authMiddleware);

// GET /api/data/user
// Fetches the current user's data
router.get('/user', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                lifeContext: true,
                gamificationState: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error loading user data:', error);
        res.status(500).json({ error: 'Failed to load user data.' });
    }
});

// PUT /api/data/user
// Saves the current user's data
router.put('/user', async (req, res) => {
    const { lifeContext, gamificationState } = req.body;
    
    // Basic validation
    if (lifeContext === undefined && gamificationState === undefined) {
        return res.status(400).json({ error: 'No data provided to update.' });
    }
    
    try {
        const dataToUpdate = {};
        if (lifeContext !== undefined) {
            dataToUpdate.lifeContext = lifeContext;
        }
        if (gamificationState !== undefined) {
            dataToUpdate.gamificationState = gamificationState;
        }

        await prisma.user.update({
            where: { id: req.userId },
            data: dataToUpdate
        });
        
        res.status(200).json({ message: 'User data saved successfully.' });
    } catch (error) {
        console.error('Error saving user data:', error);
        res.status(500).json({ error: 'Failed to save user data.' });
    }
});

module.exports = router;
