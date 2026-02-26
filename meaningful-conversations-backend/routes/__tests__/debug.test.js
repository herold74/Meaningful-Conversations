/**
 * Integration tests for routes/debug.js
 * All routes require adminAuth.
 */

jest.mock('../../prismaClient.js');
jest.mock('../../middleware/adminAuth.js', () => (req, res, next) => {
    req.userId = 'admin-user-id';
    req.user = { id: 'admin-user-id', isAdmin: true };
    next();
});

const fs = require('fs');
jest.mock('fs', () => ({
    appendFileSync: jest.fn(),
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    unlinkSync: jest.fn(),
}));

const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());
app.use('/api/debug', require('../debug.js'));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('POST /api/debug/log', () => {
    it('logs message and returns success with admin auth', async () => {
        const res = await request(app)
            .post('/api/debug/log')
            .set('Authorization', 'Bearer admin-token')
            .send({
                location: 'ChatView',
                message: 'Test debug message',
                data: { foo: 'bar' },
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(fs.appendFileSync).toHaveBeenCalled();
        const logLine = fs.appendFileSync.mock.calls[0][1];
        const parsed = JSON.parse(logLine);
        expect(parsed.message).toBe('Test debug message');
        expect(parsed.location).toBe('ChatView');
        expect(parsed.data).toEqual({ foo: 'bar' });
    });

    it('handles minimal payload', async () => {
        const res = await request(app)
            .post('/api/debug/log')
            .set('Authorization', 'Bearer admin-token')
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(fs.appendFileSync).toHaveBeenCalled();
        const logLine = fs.appendFileSync.mock.calls[0][1];
        const parsed = JSON.parse(logLine);
        expect(parsed.message).toBe('');
        expect(parsed.location).toBe('unknown');
    });
});

describe('GET /api/debug/logs', () => {
    it('returns logs when file exists', async () => {
        const mockLogs = [
            JSON.stringify({ timestamp: 1, message: 'Log 1' }) + '\n',
            JSON.stringify({ timestamp: 2, message: 'Log 2' }) + '\n',
        ].join('');
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(mockLogs);

        const res = await request(app)
            .get('/api/debug/logs')
            .set('Authorization', 'Bearer admin-token');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('logs');
        expect(res.body.logs).toHaveLength(2);
        expect(res.body.logs[0].message).toBe('Log 1');
        expect(res.body.logs[1].message).toBe('Log 2');
    });

    it('returns empty logs when file does not exist', async () => {
        fs.existsSync.mockReturnValue(false);

        const res = await request(app)
            .get('/api/debug/logs')
            .set('Authorization', 'Bearer admin-token');

        expect(res.status).toBe(200);
        expect(res.body.logs).toEqual([]);
        expect(fs.readFileSync).not.toHaveBeenCalled();
    });
});

describe('DELETE /api/debug/logs', () => {
    it('clears logs when file exists', async () => {
        fs.existsSync.mockReturnValue(true);

        const res = await request(app)
            .delete('/api/debug/logs')
            .set('Authorization', 'Bearer admin-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('returns success when file does not exist', async () => {
        fs.existsSync.mockReturnValue(false);

        const res = await request(app)
            .delete('/api/debug/logs')
            .set('Authorization', 'Bearer admin-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
});
