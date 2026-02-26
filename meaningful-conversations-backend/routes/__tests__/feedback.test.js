/**
 * Integration tests for routes/feedback.js
 * Uses optionalAuth - works with or without logged-in user.
 */

jest.mock('../../prismaClient.js');
jest.mock('../../middleware/optionalAuth.js', () => (req, res, next) => {
    // Default: no user (guest)
    req.userId = undefined;
    next();
});

const request = require('supertest');
const express = require('express');
const prisma = require('../../prismaClient.js');

const app = express();
app.use(express.json());
app.use('/api/feedback', require('../feedback.js'));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('POST /api/feedback', () => {
    it('creates feedback successfully with valid data', async () => {
        prisma.feedback.create.mockResolvedValue({
            id: 'feedback-123',
            rating: 5,
            comments: 'Great service!',
            botId: 'nobody',
            lastUserMessage: null,
            botResponse: null,
            isAnonymous: false,
        });

        const res = await request(app)
            .post('/api/feedback')
            .send({
                rating: 5,
                comments: 'Great service!',
                botId: 'nobody',
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id', 'feedback-123');
        expect(res.body.rating).toBe(5);
        expect(res.body.comments).toBe('Great service!');
        expect(res.body.botId).toBe('nobody');
        expect(prisma.feedback.create).toHaveBeenCalled();
    });

    it('returns 400 when comments is missing', async () => {
        const res = await request(app)
            .post('/api/feedback')
            .send({
                rating: 5,
                botId: 'nobody',
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('botId');
        expect(res.body.error).toContain('comments');
        expect(prisma.feedback.create).not.toHaveBeenCalled();
    });

    it('returns 400 when comments is not a string', async () => {
        const res = await request(app)
            .post('/api/feedback')
            .send({
                rating: 5,
                comments: 123,
                botId: 'nobody',
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('comments');
        expect(prisma.feedback.create).not.toHaveBeenCalled();
    });

    it('returns 400 when botId is missing', async () => {
        const res = await request(app)
            .post('/api/feedback')
            .send({
                rating: 5,
                comments: 'Great!',
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('botId');
        expect(prisma.feedback.create).not.toHaveBeenCalled();
    });

    it('accepts feedback from guest (no userId)', async () => {
        prisma.feedback.create.mockResolvedValue({
            id: 'feedback-456',
            comments: 'Guest feedback',
            botId: 'max',
        });

        const res = await request(app)
            .post('/api/feedback')
            .send({
                comments: 'Guest feedback',
                botId: 'max',
            });

        expect(res.status).toBe(201);
        const createCall = prisma.feedback.create.mock.calls[0][0];
        expect(createCall.data).not.toHaveProperty('feedbackByUser');
    });
});
