const express = require('express');
const prisma = require('../prismaClient.js');
const optionalAuthMiddleware = require('../middleware/optionalAuth.js');

const router = express.Router();

/**
 * Truncates a string to a maximum length if it exceeds it.
 * Gracefully handles non-string inputs.
 * @param {any} str The input to truncate.
 * @param {number} length The maximum allowed length.
 * @returns {string|any} The truncated string or the original input if not a string or not too long.
 */
const truncate = (str, length) => {
    if (typeof str === 'string' && str.length > length) {
        return str.substring(0, length);
    }
    return str;
};


// POST /api/feedback
router.post('/', optionalAuthMiddleware, async (req, res) => {
    let { rating, comments, botId, lastUserMessage, botResponse, isAnonymous, email } = req.body;
    
    if (typeof comments !== 'string' || !botId) {
        return res.status(400).json({ error: 'A `botId` and string `comments` field are required.' });
    }

    try {
        let userIdForDb = null;
        let isEffectivelyAnonymous = isAnonymous || !req.userId;

        // Verify user exists if a token was provided
        if (!isEffectivelyAnonymous && req.userId) {
            const user = await prisma.user.findUnique({ where: { id: req.userId } });
            if (user) {
                userIdForDb = req.userId;
            } else {
                // User from token not found in DB, treat as anonymous.
                isEffectivelyAnonymous = true;
            }
        }
        
        // If the submission is anonymous and an email is provided, prepend it to the comments field.
        if (isEffectivelyAnonymous && email) {
            comments = `[Guest Email: ${email}]\n\n${comments}`;
        }
        
        const MAX_TEXT_LENGTH = 65535;

        // Base data for the feedback record, without the guestEmail field.
        const feedbackData = {
            rating: rating ?? null,
            comments: truncate(comments, MAX_TEXT_LENGTH),
            botId,
            lastUserMessage: truncate(lastUserMessage, MAX_TEXT_LENGTH) ?? null,
            botResponse: truncate(botResponse, MAX_TEXT_LENGTH) ?? null,
            isAnonymous: isEffectivelyAnonymous,
        };

        // Conditionally connect the user relation if they are a registered user.
        if (userIdForDb) {
            feedbackData.user = {
                connect: { id: userIdForDb }
            };
        }

        const feedback = await prisma.feedback.create({ data: feedbackData });
        res.status(201).json(feedback);

    } catch (error) {
        console.error("Error saving feedback:", error);
        res.status(500).json({ error: 'Failed to save feedback.' });
    }
});

module.exports = router;
