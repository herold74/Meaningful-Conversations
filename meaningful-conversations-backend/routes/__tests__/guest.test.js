/**
 * Integration tests for routes/guest.js
 * check-limit and increment-usage are public; stats requires adminAuth.
 */

jest.mock('../../prismaClient.js');
jest.mock('../../services/guestLimitTracker.js');
jest.mock('jsonwebtoken');
jest.mock('../../middleware/adminAuth.js', () => (req, res, next) => {
    req.userId = 'admin-user-id';
    req.user = { id: 'admin-user-id', isAdmin: true };
    next();
});

const request = require('supertest');
const express = require('express');
const { checkGuestLimit, incrementGuestUsage, getGuestStats } = require('../../services/guestLimitTracker.js');

const app = express();
app.use(express.json());
app.use('/api/guest', require('../guest.js'));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('POST /api/guest/check-limit', () => {
    it('returns allowed: true when under limit', async () => {
        checkGuestLimit.mockResolvedValue({
            allowed: true,
            remaining: 45,
            messageCount: 5,
        });

        const res = await request(app)
            .post('/api/guest/check-limit')
            .send({ fingerprint: 'abc123base64fingerprint' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            allowed: true,
            remaining: 45,
            messageCount: 5,
        });
        expect(checkGuestLimit).toHaveBeenCalledWith('abc123base64fingerprint');
    });

    it('returns allowed: false when over limit', async () => {
        checkGuestLimit.mockResolvedValue({
            allowed: false,
            remaining: 0,
            messageCount: 50,
        });

        const res = await request(app)
            .post('/api/guest/check-limit')
            .send({ fingerprint: 'overlimitfingerprint' });

        expect(res.status).toBe(200);
        expect(res.body.allowed).toBe(false);
        expect(res.body.remaining).toBe(0);
    });

    it('returns 400 for missing fingerprint', async () => {
        const res = await request(app)
            .post('/api/guest/check-limit')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid fingerprint');
        expect(checkGuestLimit).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid fingerprint format', async () => {
        const res = await request(app)
            .post('/api/guest/check-limit')
            .send({ fingerprint: 'invalid!!!chars@#' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid fingerprint format');
    });

    it('returns 400 for fingerprint over 64 chars', async () => {
        const res = await request(app)
            .post('/api/guest/check-limit')
            .send({ fingerprint: 'a'.repeat(65) });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid fingerprint format');
    });
});

describe('POST /api/guest/increment-usage', () => {
    it('increments successfully and returns count', async () => {
        checkGuestLimit.mockResolvedValue({ allowed: true, remaining: 44, messageCount: 6 });
        incrementGuestUsage.mockResolvedValue({
            messageCount: 6,
            remaining: 44,
        });

        const res = await request(app)
            .post('/api/guest/increment-usage')
            .send({ fingerprint: 'validfingerprint123' });

        expect(res.status).toBe(200);
        expect(res.body.messageCount).toBe(6);
        expect(res.body.remaining).toBe(44);
        expect(incrementGuestUsage).toHaveBeenCalledWith('validfingerprint123');
    });

    it('returns 400 for missing fingerprint', async () => {
        const res = await request(app)
            .post('/api/guest/increment-usage')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid fingerprint');
        expect(incrementGuestUsage).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid fingerprint format', async () => {
        const res = await request(app)
            .post('/api/guest/increment-usage')
            .send({ fingerprint: 'bad<>format' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid fingerprint format');
    });
});

describe('GET /api/guest/stats', () => {
    it('returns stats when admin auth is present', async () => {
        getGuestStats.mockResolvedValue({
            totalGuests: 100,
            activeThisWeek: 25,
            averageMessages: 12.5,
        });

        const res = await request(app)
            .get('/api/guest/stats')
            .set('Authorization', 'Bearer admin-token');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            totalGuests: 100,
            activeThisWeek: 25,
            averageMessages: 12.5,
        });
        expect(getGuestStats).toHaveBeenCalled();
    });
});
