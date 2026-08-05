/**
 * PayPal webhook signature verification (P1 security: fail-closed in staging/production).
 */

describe('verifyPayPalSignature', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.PAYPAL_WEBHOOK_ID;
    delete process.env.PAYPAL_CLIENT_ID;
    delete process.env.PAYPAL_CLIENT_SECRET;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function loadVerify() {
    // Fresh module so env changes apply
    jest.resetModules();
    const purchaseRouter = require('../purchase.js');
    return purchaseRouter.verifyPayPalSignature;
  }

  it('returns false in staging when PAYPAL_WEBHOOK_ID is unset', async () => {
    process.env.ENVIRONMENT_TYPE = 'staging';
    const verifyPayPalSignature = loadVerify();
    const req = { headers: {}, body: {} };
    await expect(verifyPayPalSignature(req)).resolves.toBe(false);
  });

  it('returns false in production when PAYPAL_WEBHOOK_ID is unset', async () => {
    process.env.ENVIRONMENT_TYPE = 'production';
    const verifyPayPalSignature = loadVerify();
    const req = { headers: {}, body: {} };
    await expect(verifyPayPalSignature(req)).resolves.toBe(false);
  });

  it('returns true in development when PAYPAL_WEBHOOK_ID is unset', async () => {
    process.env.ENVIRONMENT_TYPE = 'development';
    const verifyPayPalSignature = loadVerify();
    const req = { headers: {}, body: {} };
    await expect(verifyPayPalSignature(req)).resolves.toBe(true);
  });

  it('returns false when webhook headers are missing and PAYPAL_WEBHOOK_ID is set', async () => {
    process.env.ENVIRONMENT_TYPE = 'staging';
    process.env.PAYPAL_WEBHOOK_ID = 'WH-test';
    process.env.PAYPAL_CLIENT_ID = 'client';
    process.env.PAYPAL_CLIENT_SECRET = 'secret';
    const verifyPayPalSignature = loadVerify();
    const req = { headers: {}, body: {} };
    await expect(verifyPayPalSignature(req)).resolves.toBe(false);
  });
});
