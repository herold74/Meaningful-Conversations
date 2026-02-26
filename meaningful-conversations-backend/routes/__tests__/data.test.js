/**
 * Integration tests for routes/data.js
 * All routes require auth middleware.
 */

jest.mock('../../prismaClient.js');
jest.mock('jsonwebtoken');

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../../prismaClient.js');

// Mock JWT to always verify successfully
jwt.verify = jest.fn().mockReturnValue({ userId: 'test-user-id' });

const app = express();
// Increase limit so oversized payload reaches route validation (default 100kb would return 413)
app.use(express.json({ limit: '600kb' }));
// Mock auth middleware - data routes use auth
app.use((req, res, next) => {
    req.userId = 'test-user-id';
    next();
});
app.use('/api/data', require('../data.js'));

beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ userId: 'test-user-id' });
});

describe('GET /api/data/user', () => {
    it('returns user context and gamificationState', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'test-user-id',
            lifeContext: 'my context',
            gamificationState: '{"xp":10,"level":1}',
        });

        const res = await request(app)
            .get('/api/data/user')
            .set('Authorization', 'Bearer fake-token');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            context: 'my context',
            gamificationState: '{"xp":10,"level":1}',
        });
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { id: 'test-user-id' },
        });
    });

    it('returns 404 when user not found', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .get('/api/data/user')
            .set('Authorization', 'Bearer fake-token');

        expect(res.status).toBe(404);
        expect(res.body.error).toContain('User not found');
    });
});

describe('PUT /api/data/user', () => {
    it('updates context and gamificationState successfully', async () => {
        prisma.user.update.mockResolvedValue({});

        const res = await request(app)
            .put('/api/data/user')
            .set('Authorization', 'Bearer fake-token')
            .send({
                context: 'updated context',
                gamificationState: '{"xp":20}',
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('saved successfully');
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 'test-user-id' },
            data: expect.objectContaining({
                lifeContext: 'updated context',
                gamificationState: '{"xp":20}',
            }),
        });
    });

    it('rejects context when not a string', async () => {
        const res = await request(app)
            .put('/api/data/user')
            .set('Authorization', 'Bearer fake-token')
            .send({ context: 123 });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('context must be a string');
        expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects context exceeding 500KB', async () => {
        const longString = 'x'.repeat(500001);

        const res = await request(app)
            .put('/api/data/user')
            .set('Authorization', 'Bearer fake-token')
            .send({ context: longString });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('exceeds maximum length');
        expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects gamificationState when not a string', async () => {
        const res = await request(app)
            .put('/api/data/user')
            .set('Authorization', 'Bearer fake-token')
            .send({ gamificationState: { xp: 10 } });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('gamificationState must be a string');
        expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects gamificationState exceeding 50KB', async () => {
        const longString = 'x'.repeat(50001);

        const res = await request(app)
            .put('/api/data/user')
            .set('Authorization', 'Bearer fake-token')
            .send({ gamificationState: longString });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('gamificationState exceeds maximum length');
        expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('updates only context when gamificationState not provided', async () => {
        prisma.user.update.mockResolvedValue({});

        const res = await request(app)
            .put('/api/data/user')
            .set('Authorization', 'Bearer fake-token')
            .send({ context: 'only context update' });

        expect(res.status).toBe(200);
        const updateCall = prisma.user.update.mock.calls[0][0];
        expect(updateCall.data.lifeContext).toBe('only context update');
        expect(updateCall.data).toHaveProperty('gamificationState');
    });
});

describe('PUT /api/data/user/profile', () => {
    it('updates firstName and lastName successfully', async () => {
        const mockUser = {
            id: 'test-user-id',
            firstName: 'Old',
            lastName: 'Name',
            newsletterConsent: false,
            newsletterConsentDate: null,
            unsubscribeToken: null,
            passwordHash: 'hash',
        };
        prisma.user.findUnique.mockResolvedValue(mockUser);
        prisma.user.update.mockResolvedValue({
            ...mockUser,
            firstName: 'New',
            lastName: 'Updated',
        });

        const res = await request(app)
            .put('/api/data/user/profile')
            .set('Authorization', 'Bearer fake-token')
            .send({
                firstName: 'New',
                lastName: 'Updated',
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Profile updated successfully');
        expect(res.body.user.firstName).toBe('New');
        expect(res.body.user.lastName).toBe('Updated');
    });

    it('rejects firstName over 100 characters', async () => {
        const res = await request(app)
            .put('/api/data/user/profile')
            .set('Authorization', 'Bearer fake-token')
            .send({ firstName: 'x'.repeat(101) });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('firstName');
        expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects lastName over 100 characters', async () => {
        const res = await request(app)
            .put('/api/data/user/profile')
            .set('Authorization', 'Bearer fake-token')
            .send({ lastName: 'x'.repeat(101) });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('lastName');
        expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects firstName when not a string', async () => {
        const res = await request(app)
            .put('/api/data/user/profile')
            .set('Authorization', 'Bearer fake-token')
            .send({ firstName: 123 });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('firstName');
    });

    it('updates only provided fields (conditional update)', async () => {
        const mockUser = {
            id: 'test-user-id',
            firstName: 'Keep',
            lastName: 'Name',
            newsletterConsent: false,
            newsletterConsentDate: null,
            unsubscribeToken: null,
            passwordHash: 'hash',
        };
        prisma.user.findUnique.mockResolvedValue(mockUser);
        prisma.user.update.mockResolvedValue({
            ...mockUser,
            firstName: 'OnlyFirst',
        });

        const res = await request(app)
            .put('/api/data/user/profile')
            .set('Authorization', 'Bearer fake-token')
            .send({ firstName: 'OnlyFirst' });

        expect(res.status).toBe(200);
        const updateCall = prisma.user.update.mock.calls[0][0];
        expect(updateCall.data.firstName).toBe('OnlyFirst');
        expect(updateCall.data).not.toHaveProperty('lastName');
    });
});
