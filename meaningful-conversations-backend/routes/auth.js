
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

const sendAuthResponse = (res, user, statusCode = 200) => {
    const userForToken = {
        id: user.id,
        email: user.email,
        isBetaTester: user.isBetaTester,
        isAdmin: user.isAdmin,
        unlockedCoaches: JSON.parse(user.unlockedCoaches || '[]'),
        encryptionSalt: user.encryptionSalt, // Include the salt for the client
    };

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(statusCode).json({
        token,
        user: userForToken
    });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || password.length < 6) {
        return res.status(400).json({ error: 'Please provide a valid email and a password of at least 6 characters.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email address already exists.' });
        }

        const normalizedPassword = password.normalize('NFC');
        const passwordHash = await bcrypt.hash(normalizedPassword, 10);
        const salt = crypto.randomBytes(16).toString('hex'); // Generate a 128-bit salt
        
        // Ensure a valid, parsable default state is used.
        const defaultGamificationState = JSON.stringify({
            xp: 0,
            level: 1,
            streak: 0,
            totalSessions: 0,
            lastSessionDate: null,
            unlockedAchievements: [],
            coachesUsed: [],
        });

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                encryptionSalt: salt,
                lifeContext: '', // Start with an empty (but not null) context
                gamificationState: defaultGamificationState,
            },
        });

        sendAuthResponse(res, user, 201);

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'An unexpected error occurred during registration.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        const normalizedPassword = password.normalize('NFC');
        if (!user || !(await bcrypt.compare(normalizedPassword, user.passwordHash))) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // Increment login count and update last login timestamp
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                loginCount: { increment: 1 },
                lastLogin: new Date(),
            },
        });

        sendAuthResponse(res, updatedUser);

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'An unexpected error occurred during login.' });
    }
});


// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required." });
    }

    try {
        // We find the user to ensure the request is for a real account,
        // but we don't leak whether the user exists or not for security.
        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            await prisma.ticket.create({
                data: {
                    type: 'PASSWORD_RESET',
                    status: 'OPEN',
                    payload: { email }
                }
            });
             console.log(`Password reset ticket created for: ${email}`);
        } else {
            console.log(`Password reset requested for non-existent email: ${email}`);
        }
        
        // Always return a success response to prevent email enumeration attacks.
        res.status(200).json({ message: "If an account with this email exists, a reset has been initiated." });

    } catch (error) {
        console.error("Forgot password error:", error);
        // Don't send a 500 error to the client, as that could leak information.
        // The success message is safer.
        res.status(200).json({ message: "If an account with this email exists, a reset has been initiated." });
    }
});


module.exports = router;