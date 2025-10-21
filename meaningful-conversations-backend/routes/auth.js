const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../prismaClient.js');
const { sendConfirmationEmail, sendPasswordResetEmail } = require('../services/mailService.js');

const router = express.Router();

/**
 * Serializes a GamificationState-like object into a JSON string.
 * Converts Sets to arrays for compatibility with JSON.
 * @param {object} state The state object, expected to have `unlockedAchievements` and `coachesUsed` as Sets.
 * @returns {string} A JSON string representation of the state.
 */
function serializeGamificationState(state) {
    if (!state || typeof state !== 'object') {
        return '{}';
    }
    const serializableState = {
        ...state,
        unlockedAchievements: state.unlockedAchievements instanceof Set ? Array.from(state.unlockedAchievements) : [],
        coachesUsed: state.coachesUsed instanceof Set ? Array.from(state.coachesUsed) : [],
    };
    return JSON.stringify(serializableState);
}

const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const lowerCaseEmail = email.toLowerCase();

    try {
        const existingUser = await prisma.user.findUnique({ where: { email: lowerCaseEmail } });
        
        if (existingUser) {
            // If the user exists but is still pending verification, we allow a re-registration attempt.
            // This is helpful if they lost their original verification email.
            // We'll delete the old pending user to generate a new token and prevent conflicts.
            if (existingUser.status === 'PENDING') {
                await prisma.user.delete({ where: { email: lowerCaseEmail } });
                // Now we can proceed to create a new user below.
            } else {
                // If the user is ACTIVE or has another status, they cannot re-register.
                return res.status(409).json({ error: 'An account with this email already exists.' });
            }
        }

        const passwordHash = await bcrypt.hash(password, 10); // Let bcrypt handle its own salt generation
        const encryptionSalt = crypto.randomBytes(16).toString('hex'); // Create a separate, hex-encoded salt for E2EE
        const activationToken = crypto.randomBytes(32).toString('hex');
        const activationTokenExpires = new Date(Date.now() + 24 * 3600000); // 24 hours

        const registrationDate = new Date();
        const cutoffDate = new Date('2026-01-01T00:00:00.000Z');
        let accessExpiresAt = null;
        if (registrationDate < cutoffDate) {
            // Grant "legacy" access by setting a far-future date
            const farFutureDate = new Date();
            farFutureDate.setFullYear(farFutureDate.getFullYear() + 100);
            accessExpiresAt = farFutureDate;
        }

        await prisma.user.create({
            data: {
                email: lowerCaseEmail,
                passwordHash,
                encryptionSalt: encryptionSalt,
                activationToken,
                activationTokenExpires,
                accessExpiresAt: accessExpiresAt,
                // Set default non-null values for the new fields
                lifeContext: '',
                gamificationState: serializeGamificationState({
                    xp: 0, level: 1, streak: 0, totalSessions: 0, lastSessionDate: null,
                    unlockedAchievements: new Set(), coachesUsed: new Set()
                }),
                unlockedCoaches: JSON.stringify([])
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

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.status !== 'ACTIVE') {
             if (user.status === 'PENDING') {
                return res.status(403).json({ error: 'Your account is pending verification. Please check your email for the activation link.' });
             }
             return res.status(403).json({ error: 'Your account is currently inactive.' });
        }

        // Access Pass Check (for non-admins/beta testers)
        if (!user.isAdmin && !user.isBetaTester) {
            const now = new Date();
            if (!user.accessExpiresAt || new Date(user.accessExpiresAt) < now) {
                return res.status(403).json({ error: 'Your access pass has expired.', errorCode: 'ACCESS_EXPIRED' });
            }
        }

        // Update login stats
        await prisma.user.update({
            where: { id: user.id },
            data: {
                loginCount: { increment: 1 },
                lastLogin: new Date(),
            },
        });

        const { passwordHash, ...userPayload } = user;
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: userPayload });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'An internal server error occurred during login.' });
    }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
    const { token } = req.body;
    try {
        // First, find the user by the token alone. This assumes the token is unique.
        const user = await prisma.user.findUnique({
            where: {
                activationToken: token,
            },
        });
        
        // Now, check for existence and expiration in the application logic.
        // This is more robust against potential DB timezone issues.
        if (!user || new Date() > new Date(user.activationTokenExpires)) {
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

        const { passwordHash, ...userPayload } = updatedUser;
        // Automatically log the user in by creating a session token
        const sessionToken = jwt.sign({ userId: updatedUser.id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ token: sessionToken, user: userPayload });
        
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
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 3600000); // 1 hour
            
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: token,
                    passwordResetTokenExpires: expires,
                },
            });
            await sendPasswordResetEmail(lowerCaseEmail, token);
        }
        res.status(200).json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        // Silently fail to prevent email enumeration
        res.status(200).json({ message: 'If an account with this email exists, a password reset link has been sent.' });
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
                lifeContext: '', // Data is lost on password reset due to E2EE
                updatedAt: new Date(),
            },
        });
        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

module.exports = router;