jest.mock('marked', () => ({
    marked: { setOptions: jest.fn(), parse: jest.fn((s) => s) },
}));
jest.mock('../../prismaClient.js');
jest.mock('../../services/mailService.js', () => ({ sendNewsletterEmail: jest.fn() }));
jest.mock('../../services/aiProviderService.js', () => ({ generateContent: jest.fn() }));
jest.mock('../../services/gdprAccountCleanup.js', () => ({
    clearPersonalityProfileOnPasswordReset: jest.fn().mockResolvedValue(undefined),
    anonymizePurchasesForEmail: jest.fn(),
    deleteTicketsForEmail: jest.fn(),
    findTicketsForEmail: jest.fn(),
}));
jest.mock('../../services/tokenInvalidation.js', () => ({
    invalidateTokensForUser: jest.fn().mockResolvedValue(undefined),
    isTokenInvalidated: jest.fn().mockResolvedValue(false),
}));
jest.mock('../../middleware/adminAuth.js', () => (req, res, next) => {
    const isAdmin = req.headers['x-role'] !== 'developer';
    req.userId = 'actor-1';
    req.user = { id: 'actor-1', isAdmin, isDeveloper: true, status: 'ACTIVE' };
    next();
});

const express = require('express');
const request = require('supertest');
const prisma = require('../../prismaClient.js');
const { invalidateTokensForUser } = require('../../services/tokenInvalidation.js');
const adminRouter = require('../admin.js');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/admin', adminRouter);
    return app;
}

beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.update.mockResolvedValue({});
    prisma.user.findUnique.mockResolvedValue({
        id: 'target-1',
        isAdmin: false,
        isDeveloper: false,
        isPremium: false,
        isClient: false,
        status: 'ACTIVE',
    });
});

describe('admin credential and role mutations', () => {
    it('rejects password reset from a developer who is not an admin', async () => {
        const res = await request(buildApp())
            .post('/api/admin/users/target-1/reset-password')
            .set('x-role', 'developer');

        expect(res.status).toBe(403);
        expect(invalidateTokensForUser).not.toHaveBeenCalled();
    });

    it('resets a password, returns it once, and invalidates the target session', async () => {
        const res = await request(buildApp())
            .post('/api/admin/users/target-1/reset-password');

        expect(res.status).toBe(200);
        expect(typeof res.body.newPassword).toBe('string');
        expect(res.body.newPassword.length).toBeGreaterThan(0);
        expect(invalidateTokensForUser).toHaveBeenCalledWith('target-1');
    });

    it('blocks an admin from removing their own developer flag', async () => {
        const res = await request(buildApp())
            .put('/api/admin/users/actor-1/toggle-developer');

        expect(res.status).toBe(403);
        expect(prisma.user.update).not.toHaveBeenCalled();
    });
});
