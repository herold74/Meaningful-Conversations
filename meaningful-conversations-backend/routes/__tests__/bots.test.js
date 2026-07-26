/**
 * Integration tests for routes/bots.js
 */

const request = require('supertest');
const express = require('express');

describe('GET /api/bots', () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;

  beforeEach(() => {
    jest.resetModules();
    process.env.FRONTEND_URL = 'https://mc-app.manualmode.at';
  });

  afterEach(() => {
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }
  });

  it('returns bots with absolute avatar URLs', async () => {
    const app = express();
    app.use('/api/bots', require('../bots.js'));

    const res = await request(app).get('/api/bots');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    for (const bot of res.body) {
      expect(bot).not.toHaveProperty('systemPrompt');
      expect(bot.avatar).toMatch(/^https:\/\//);
    }
    const gloria = res.body.find((b) => b.id === 'gloria-interview');
    expect(gloria.avatar).toBe('https://mc-app.manualmode.at/avatars/gloria.png');
  });
});
