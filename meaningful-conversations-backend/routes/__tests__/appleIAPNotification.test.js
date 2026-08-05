/**
 * Apple IAP notification route — rejects invalid JWS signatures.
 */

jest.mock('../../prismaClient.js');
jest.mock('../../services/appleIAPService.js', () => ({
  verifyAndDecodeNotification: jest.fn(),
  verifyAndDecodeTransaction: jest.fn(),
  mapAppleProduct: jest.fn(),
  mapNotificationType: jest.fn(),
  getAppleConfig: jest.fn(),
  verifyTransaction: jest.fn(),
}));

const request = require('supertest');
const express = require('express');
const appleIAPService = require('../../services/appleIAPService.js');

const app = express();
app.use(express.json());
app.use('/api/apple-iap', require('../appleIAP.js'));

describe('POST /api/apple-iap/notification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when signedPayload is missing', async () => {
    const res = await request(app)
      .post('/api/apple-iap/notification')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 when JWS verification fails', async () => {
    appleIAPService.verifyAndDecodeNotification.mockRejectedValue(
      new Error('Invalid signature')
    );
    const res = await request(app)
      .post('/api/apple-iap/notification')
      .send({ signedPayload: 'bad.jws.token' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/signature/i);
  });

  it('returns 200 when notification has no transaction info', async () => {
    appleIAPService.verifyAndDecodeNotification.mockResolvedValue({
      notificationType: 'TEST',
      subtype: null,
      data: {},
    });
    const res = await request(app)
      .post('/api/apple-iap/notification')
      .send({ signedPayload: 'valid.jws.token' });
    expect(res.status).toBe(200);
  });
});
