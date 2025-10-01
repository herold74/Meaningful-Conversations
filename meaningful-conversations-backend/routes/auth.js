const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

// Helper to create token and send standard response
const sendAuthResponse = (res, user, statusCode = 200) => {
    // The user object passed here is from Prisma, containing the raw DB record
    const userForFrontend = {
        id: user.id,
        email: user.email,
        isBetaTester: user.isBetaTester,
        isAdmin: user.isAdmin,
        // The DB stores this as a JSON string; parse it for the frontend.
        // It might be null for older records, so we default to an empty array.
        unlockedCoaches: JSON.parse(user.unlockedCoaches || '[]'),
    };

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(statusCode).json({
        token,
        user: userForFrontend
    });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        // Create user with valid defaults
        const newUser = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                gamificationState: '{}', // Valid JSON string for the serializer
                unlockedCoaches: '[]' // Valid JSON array string
            }
        });

        sendAuthResponse(res, newUser, 201);

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'An unexpected error occurred during registration.' });
    }
});


// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) {
            // Use a generic error message for security
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        
        sendAuthResponse(res, user, 200);

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'An unexpected error occurred during login.' });
    }
});


// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (email) {
        // Simulate creating a support ticket for the developer
        console.log('--- PASSWORD RESET TICKET ---');
        console.log(`User requested password reset for email: ${email}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log('Action required: Manually reset password for this user in the admin panel.');
        console.log('-----------------------------');
    }

    // Always send a success response to prevent email enumeration attacks
    res.status(200).json({ message: 'If an account with that email exists, a request has been sent.' });
});


module.exports = router;
