
const express = require('express');
const prisma = require('../prismaClient.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendConfirmationEmail, sendPasswordResetEmail } = require('../services/mailService.js');

const router = express.Router();

const sendAuthResponse = (res, user, tempPassword = null, statusCode = 200) => {
    const userForToken = {
        id: user.id,
        email: user.email,
        isBetaTester: user.isBetaTester,
        isAdmin: user.isAdmin,
        unlockedCoaches: JSON.parse(user.unlockedCoaches || '[]'),
        encryptionSalt: user.encryptionSalt,
    };

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    const responsePayload = { token, user: userForToken };
    // Include temp password only on first verification
    if (tempPassword) {
        responsePayload.tempPassword = tempPassword;
    }

    res.status(statusCode).json(responsePayload);
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    let { email, password } = req.body;
    
    email = email ? email.trim().toLowerCase() : '';
    password = password ? password.trim() : '';

    if (!email || !password || password.length < 6) {
        return res.status(400).json({ error: 'Please provide a valid email and a password of at least 6 characters.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            // If user exists but is pending, resend confirmation. Otherwise, conflict.
            if (existingUser.status === 'PENDING') {
                await sendConfirmationEmail(existingUser.email, existingUser.activationToken, 'Resent');
                return res.status(201).json({ message: 'Confirmation email sent. Please check your inbox.' });
            }
            return res.status(409).json({ error: 'An account with this email address already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const salt = crypto.randomBytes(16).toString('hex');
        const activationToken = crypto.randomBytes(32).toString('hex');
        const activationTokenExpires = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours
        
        const defaultGamificationState = JSON.stringify({
            xp: 0, level: 1, streak: 0, totalSessions: 0, lastSessionDate: null,
            unlockedAchievements: [], coachesUsed: [],
        });

        const user = await prisma.user.create({
            data: {
                email, passwordHash, encryptionSalt: salt, lifeContext: '',
                gamificationState: defaultGamificationState, unlockedCoaches: '[]',
                status: 'PENDING', activationToken, activationTokenExpires
            },
        });

        await sendConfirmationEmail(user.email, user.activationToken);

        res.status(201).json({ message: 'Confirmation email sent. Please check your inbox.' });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'An unexpected error occurred during registration.' });
    }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification token is required.' });

    try {
        const user = await prisma.user.findFirst({
            where: {
                activationToken: token,
                activationTokenExpires: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token.' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                status: 'ACTIVE',
                activationToken: null,
                activationTokenExpires: null,
                loginCount: 1,
                lastLogin: new Date(),
            }
        });

        // The user is now active. Send back a valid session token and the user object.
        // The frontend will then prompt the user for their password one last time
        // to securely derive the encryption key for their data without ever sending the
        // password back to the server after the initial login.
        sendAuthResponse(res, updatedUser, null, 200);

    } catch (error) {
        console.error("Email verification error:", error);
        res.status(500).json({ error: 'An unexpected error occurred during verification.' });
    }
});


// POST /api/auth/login
router.post('/login', async (req, res) => {
    let { email, password } = req.body;

    email = email ? email.trim().toLowerCase() : '';
    password = password ? password.trim() : '';

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        if (user.status === 'PENDING') {
            // Resend confirmation email as a courtesy
            await sendConfirmationEmail(user.email, user.activationToken, 'Resent');
            return res.status(403).json({ error: 'This account is pending verification. A new confirmation email has been sent to your address.' });
        }

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
    if (!email) return res.status(400).json({ error: "Email is required." });

    try {
        const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

        if (user && user.status === 'ACTIVE') {
            const passwordResetToken = crypto.randomBytes(32).toString('hex');
            const passwordResetTokenExpires = new Date(Date.now() + 1 * 3600 * 1000); // 1 hour

            await prisma.user.update({
                where: { id: user.id },
                data: { passwordResetToken, passwordResetTokenExpires }
            });

            await sendPasswordResetEmail(user.email, passwordResetToken);
        }
        
        res.status(200).json({ message: "If an account with this email exists, a password reset link has been sent." });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(200).json({ message: "If an account with this email exists, a password reset link has been sent." });
    }
});


// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'A valid token and a new password (min. 6 characters) are required.' });
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetTokenExpires: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired password reset token.' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newPasswordHash,
                passwordResetToken: null,
                passwordResetTokenExpires: null,
                // The encryption key is derived from the password, so the old context is now unreadable.
                // We must clear it to prevent decryption errors on the client.
                lifeContext: ""
            }
        });

        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: 'An unexpected error occurred during password reset.' });
    }
});


module.exports = router;