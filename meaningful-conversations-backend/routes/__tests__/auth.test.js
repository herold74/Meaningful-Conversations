/**
 * Integration tests for routes/auth.js
 * Auth routes are PUBLIC - no auth middleware.
 */

process.env.JWT_SECRET = 'test-secret-for-jwt-signing';

jest.mock('../../prismaClient.js');
jest.mock('bcryptjs');
jest.mock('../../services/mailService.js', () => ({
    sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../middleware/rateLimiter.js', () => ({
    loginLimiter: (req, res, next) => next(),
    registerLimiter: (req, res, next) => next(),
    forgotPasswordLimiter: (req, res, next) => next(),
    verifyEmailLimiter: (req, res, next) => next(),
}));
jest.mock('../appleIAP.js', () => ({
    syncUserFromRevenueCat: jest.fn().mockResolvedValue(null),
}));

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../../prismaClient.js');
const mailService = require('../../services/mailService.js');

const app = express();
app.use(express.json());
app.use('/api/auth', require('../auth.js'));

beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-for-jwt-signing';
    mailService.sendConfirmationEmail.mockResolvedValue(undefined);
    mailService.sendPasswordResetEmail.mockResolvedValue(undefined);
});

describe('POST /api/auth/register', () => {
    it('returns 201 on successful registration', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue({ id: 'new-user-id' });
        bcrypt.hash.mockResolvedValue('hashed-password');

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: 'SecurePass123!',
                firstName: 'Test',
                lastName: 'User',
                language: 'de',
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('check your email');
        expect(prisma.user.create).toHaveBeenCalled();
        expect(mailService.sendConfirmationEmail).toHaveBeenCalledWith(
            'test@example.com',
            expect.any(String),
            'de'
        );
    });

    it('returns 409 when email already exists (ACTIVE user)', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'existing-id',
            email: 'test@example.com',
            status: 'ACTIVE',
        });

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: 'SecurePass123!',
            });

        expect(res.status).toBe(409);
        expect(res.body.error).toContain('already exists');
        expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('returns 409 when email already exists (non-PENDING status)', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'existing-id',
            email: 'test@example.com',
            status: 'INACTIVE',
        });

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: 'SecurePass123!',
            });

        expect(res.status).toBe(409);
        expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('allows re-registration when user is PENDING (deletes old, creates new)', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'pending-id',
            email: 'test@example.com',
            status: 'PENDING',
        });
        prisma.user.delete.mockResolvedValue({});
        prisma.user.create.mockResolvedValue({ id: 'new-user-id' });
        bcrypt.hash.mockResolvedValue('hashed-password');

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: 'SecurePass123!',
            });

        expect(res.status).toBe(201);
        expect(prisma.user.delete).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
        expect(prisma.user.create).toHaveBeenCalled();
    });

    it('returns 500 on missing required fields (email/password)', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        bcrypt.hash.mockRejectedValue(new Error('Password required'));

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test@example.com' });
        // No password - bcrypt.hash throws
        expect(res.status).toBe(500);
        expect(res.body.error).toContain('Internal server error');
    });
});

describe('POST /api/auth/login', () => {
    it('returns token and user on success', async () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            status: 'ACTIVE',
            passwordHash: 'hashed',
            isPremium: false,
            isAdmin: false,
            isClient: false,
            accessExpiresAt: null,
            premiumExpiresAt: null,
        };
        prisma.user.findUnique.mockResolvedValue(mockUser);
        prisma.user.update.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'correct' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.id).toBe('user-123');
        expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('returns 401 for non-existent user', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nonexistent@example.com', password: 'any' });

        expect(res.status).toBe(401);
        expect(res.body.error).toContain('Invalid credentials');
    });

    it('returns 401 for wrong password', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-123',
            email: 'test@example.com',
            status: 'ACTIVE',
            passwordHash: 'hashed',
        });
        bcrypt.compare.mockResolvedValue(false);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'wrong' });

        expect(res.status).toBe(401);
        expect(res.body.error).toContain('Invalid credentials');
    });

    it('returns 403 when account is PENDING', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-123',
            email: 'test@example.com',
            status: 'PENDING',
            passwordHash: 'hashed',
        });
        bcrypt.compare.mockResolvedValue(true);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'correct' });

        expect(res.status).toBe(403);
        expect(res.body.error).toContain('pending verification');
    });
});

describe('POST /api/auth/verify-email', () => {
    it('returns token and user for valid token', async () => {
        const futureExpiry = new Date(Date.now() + 24 * 3600000);
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            status: 'PENDING',
            activationToken: 'valid-token',
            activationTokenExpires: futureExpiry,
            passwordHash: 'hashed',
        };
        prisma.user.findUnique.mockResolvedValue(mockUser);
        prisma.user.update.mockResolvedValue({ ...mockUser, status: 'ACTIVE' });

        const res = await request(app)
            .post('/api/auth/verify-email')
            .send({ token: 'valid-token' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(prisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'user-123' },
                data: expect.objectContaining({ status: 'ACTIVE' }),
            })
        );
    });

    it('returns 400 for invalid token', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/auth/verify-email')
            .send({ token: 'invalid-token' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid or expired');
    });

    it('returns 400 for expired token', async () => {
        const pastExpiry = new Date(Date.now() - 3600000);
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-123',
            activationToken: 'expired-token',
            activationTokenExpires: pastExpiry,
        });

        const res = await request(app)
            .post('/api/auth/verify-email')
            .send({ token: 'expired-token' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid or expired');
    });
});

describe('POST /api/auth/forgot-password', () => {
    it('returns 200 for existing email (sends reset email)', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-123',
            email: 'test@example.com',
        });
        prisma.user.update.mockResolvedValue({});

        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'test@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('If an account with this email exists');
        expect(prisma.user.update).toHaveBeenCalled();
        expect(mailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('returns 200 for non-existent email (no enumeration)', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'nonexistent@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('If an account with this email exists');
        expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
});
