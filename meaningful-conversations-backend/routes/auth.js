const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../prismaClient.js');
const { sendConfirmationEmail, sendPasswordResetEmail } = require('../services/mailService.js');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const lowerCaseEmail = email.toLowerCase();

    try {
        const existingUser = await prisma.user.findUnique({ where: { email: lowerCaseEmail } });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const encryptionSalt = crypto.randomBytes(16).toString('hex');
        const activationToken = crypto.randomBytes(32).toString('hex');
        const activationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.user.create({
            data: {
                email: lowerCaseEmail,
                passwordHash,
                encryptionSalt,
                status: 'PENDING',
                activationToken,
                activationTokenExpires,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        
        await sendConfirmationEmail(lowerCaseEmail, activationToken);
        res.status(201).json({ message: 'Registration successful. Please check your email to activate your account.' });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'An internal server error occurred during registration.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const lowerCaseEmail = email.toLowerCase();

    try {
        const user = await prisma.user.findUnique({ where: { email: lowerCaseEmail } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.status === 'PENDING') {
             return res.status(403).json({ error: 'Account is pending verification. Please check your email.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check if access has expired
        if (user.accessExpiresAt && new Date(user.accessExpiresAt) < new Date()) {
             return res.status(403).json({ errorCode: 'ACCESS_EXPIRED', error: 'Your access pass has expired.' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                loginCount: { increment: 1 },
                lastLogin: new Date(),
                updatedAt: new Date(),
            },
        });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // Don't send sensitive info to the client
        const { passwordHash, activationToken, activationTokenExpires, passwordResetToken, passwordResetTokenExpires, ...userPayload } = user;
        
        res.status(200).json({ token, user: userPayload });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'An internal server error occurred during login.' });
    }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
    const { token } = req.body;
    try {
        const user = await prisma.user.findFirst({
            where: {
                activationToken: token,
                activationTokenExpires: { gt: new Date() },
            },
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired activation token.' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                status: 'ACTIVE',
                activationToken: null,
                activationTokenExpires: null,
                updatedAt: new Date(),
            },
        });

        const jwtToken = jwt.sign({ userId: updatedUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const { passwordHash, ...userPayload } = updatedUser;
        res.status(200).json({ token: jwtToken, user: userPayload });

    } catch (error) {
        console.error("Email verification error:", error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const lowerCaseEmail = email.toLowerCase();

    try {
        const user = await prisma.user.findUnique({ where: { email: lowerCaseEmail } });
        if (user) {
            const passwordResetToken = crypto.randomBytes(32).toString('hex');
            const passwordResetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken,
                    passwordResetTokenExpires,
                    updatedAt: new Date(),
                },
            });
            await sendPasswordResetEmail(lowerCaseEmail, passwordResetToken);
        }
        res.status(200).json({ message: 'If an account with this email exists, a reset link has been sent.' });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetTokenExpires: { gt: new Date() },
            },
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired password reset token.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                passwordResetToken: null,
                passwordResetTokenExpires: null,
                // CRITICAL: Resetting password invalidates the old encryption key.
                // The encrypted life context is now unreadable and must be cleared.
                lifeContext: '',
                updatedAt: new Date(),
            },
        });
        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

module.exports = router;
