const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

const INITIAL_GAMIFICATION_STATE = "0;1;0;0;-1;1;0"; // As defined in the README

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }
     if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                gamificationState: INITIAL_GAMIFICATION_STATE
            }
        });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                email: user.email,
                isBetaTester: user.isBetaTester
            }
        });
    } catch (error) {
        if (error.code === 'P2002') { // Prisma unique constraint violation
            return res.status(409).json({ error: "An account with this email already exists." });
        }
        console.error("Registration error:", error);
        res.status(500).json({ error: "An unexpected error occurred during registration." });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            token,
            user: {
                email: user.email,
                isBetaTester: user.isBetaTester
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "An unexpected error occurred during login." });
    }
});

// POST /api/auth/beta-login
router.post('/beta-login', async (req, res) => {
    const betaEmail = 'beta@manualmode.at';
    try {
        let user = await prisma.user.findUnique({
            where: { email: betaEmail }
        });

        if (!user) {
            const betaLifeContext = `# My Life Context...`; // Abridged for brevity
            const betaGamificationState = "210;3;3;4;760;46;7"; // Serialized state for beta user

            user = await prisma.user.create({
                data: {
                    email: betaEmail,
                    passwordHash: await bcrypt.hash('beta', 10), // Dummy password
                    isBetaTester: true,
                    lifeContext: betaLifeContext,
                    gamificationState: betaGamificationState
                }
            });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            token,
            user: {
                email: user.email,
                isBetaTester: user.isBetaTester
            }
        });

    } catch (error) {
        console.error("Beta login error:", error);
        res.status(500).json({ error: "An unexpected error occurred during beta login." });
    }
});


// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    // In a real app, you'd generate a token, save it to the DB with an expiry,
    // and use a mail service to send an email. Here, we just log to the console.
    console.log(`--- SIMULATING PASSWORD RESET ---`);
    console.log(`Password reset requested for: ${email}`);
    console.log(`If this user exists, a reset link would be sent.`);
    console.log(`---------------------------------`);
    // Always return a success response to prevent email enumeration attacks.
    res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });
});


module.exports = router;
