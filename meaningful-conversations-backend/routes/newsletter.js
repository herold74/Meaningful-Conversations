const express = require('express');
const prisma = require('../prismaClient.js');

const router = express.Router();

// GET /api/newsletter/unsubscribe/:token - Public endpoint to unsubscribe from newsletter
router.get('/unsubscribe/:token', async (req, res) => {
    const { token } = req.params;
    
    try {
        const user = await prisma.user.findUnique({
            where: { unsubscribeToken: token },
            select: { id: true, email: true, newsletterConsent: true }
        });
        
        if (!user) {
            return res.status(404).json({ error: 'Invalid or expired unsubscribe link.' });
        }
        
        if (!user.newsletterConsent) {
            // Already unsubscribed
            return res.json({ 
                success: true, 
                message: 'You are already unsubscribed from the newsletter.',
                alreadyUnsubscribed: true
            });
        }
        
        // Unsubscribe user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                newsletterConsent: false,
                newsletterConsentDate: null,
                unsubscribeToken: null
            }
        });
        
        res.json({ 
            success: true, 
            message: 'You have been successfully unsubscribed from the newsletter.',
            email: user.email
        });
        
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ error: 'Failed to process unsubscribe request.' });
    }
});

module.exports = router;

