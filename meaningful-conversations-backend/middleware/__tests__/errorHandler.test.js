const express = require('express');
const request = require('supertest');
const { asyncHandler, installAsyncErrorForwarding } = require('../asyncHandler.js');
const { errorHandler } = require('../errorHandler.js');

installAsyncErrorForwarding();

describe('async route errors', () => {
    it('turns a rejected async handler into a JSON 500', async () => {
        const app = express();
        app.get('/boom', async () => {
            throw new Error('database down');
        });
        app.use(errorHandler);

        const res = await request(app).get('/boom');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Internal server error.');
        expect(JSON.stringify(res.body)).not.toContain('database down');
    });

    it('asyncHandler forwards rejections to next', async () => {
        const app = express();
        app.get('/wrapped', asyncHandler(async () => {
            throw new Error('nope');
        }));
        app.use(errorHandler);

        const res = await request(app).get('/wrapped');
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Internal server error.');
    });
});
