const express = require('express');
const { PrismaClient } = require('@prisma/client');
const optionalAuthMiddleware = require('../middleware/optionalAuth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/feedback
router.post('/', optionalAuthMiddleware, async (req, res) => {
    const { rating, comments, botId, lastUserMessage, botResponse, isAnonymous } = req.body;
    
    if (!comments || !botId) {
        return res.status(400).json({ error: 'Comments and botId are required.' });
    }

    try {
        const feedbackData = {
            rating,
            comments,
            botId,
            lastUserMessage,
            botResponse,
            isAnonymous: isAnonymous,
            // Link to user if they are logged in and not submitting anonymously
            userId: req.userId && !isAnonymous ? req.userId : null,
        };

        const feedback = await prisma.feedback.create({ data: feedbackData });
        res.status(201).json(feedback);

    } catch (error) {
        console.error("Error saving feedback:", error);
        res.status(500).json({ error: 'Failed to save feedback.' });
    }
});

module.exports = router;
