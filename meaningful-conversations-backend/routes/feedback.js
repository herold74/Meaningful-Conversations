
const express = require('express');
const prisma = require('../prismaClient.js');
const optionalAuthMiddleware = require('../middleware/optionalAuth.js');

const router = express.Router();

// POST /api/feedback
router.post('/', optionalAuthMiddleware, async (req, res) => {
    const { rating, comments, botId, lastUserMessage, botResponse, isAnonymous, email } = req.body;
    
    // For feedback, `botId` is always required.
    // The `comments` field must exist and be a string, but it can be an empty string for high ratings.
    if (typeof comments !== 'string' || !botId) {
        return res.status(400).json({ error: 'A `botId` and string `comments` field are required.' });
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
            // Store the email if provided and the submission is anonymous
            guestEmail: isAnonymous ? (email || null) : null
        };

        const feedback = await prisma.feedback.create({ data: feedbackData });
        res.status(201).json(feedback);

    } catch (error) {
        console.error("Error saving feedback:", error);
        res.status(500).json({ error: 'Failed to save feedback.' });
    }
});

module.exports = router;