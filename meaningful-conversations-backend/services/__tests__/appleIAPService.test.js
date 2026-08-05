/**
 * Apple IAP service — JWS verification wiring and root CA loading.
 */

const mockVerifyNotification = jest.fn();
const mockVerifyTransaction = jest.fn();

jest.mock('@apple/app-store-server-library', () => ({
  SignedDataVerifier: jest.fn().mockImplementation(() => ({
    verifyAndDecodeNotification: mockVerifyNotification,
    verifyAndDecodeTransaction: mockVerifyTransaction,
  })),
  Environment: {
    SANDBOX: 'Sandbox',
    PRODUCTION: 'Production',
  },
}));

describe('appleIAPService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    mockVerifyNotification.mockReset();
    mockVerifyTransaction.mockReset();
    process.env = {
      ...originalEnv,
      APPLE_KEY_ID: 'TESTKEY',
      APPLE_ISSUER_ID: 'test-issuer',
      APPLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
      APPLE_BUNDLE_ID: 'at.manualmode.mc',
      APPLE_IAP_ENVIRONMENT: 'sandbox',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('loads Apple root CA certificates from certs/apple/', () => {
    const fs = require('fs');
    const path = require('path');
    const certDir = path.join(__dirname, '../../certs/apple');
    const service = require('../appleIAPService.js');
    expect(fs.existsSync(certDir)).toBe(true);
    expect(service.getAppleConfig().bundleId).toBe('at.manualmode.mc');
  });

  it('verifyAndDecodeNotification delegates to SignedDataVerifier', async () => {
    mockVerifyNotification.mockResolvedValue({
      notificationType: 'DID_RENEW',
      subtype: null,
      data: {},
    });
    const service = require('../appleIAPService.js');
    const result = await service.verifyAndDecodeNotification('signed.payload.here');
    expect(mockVerifyNotification).toHaveBeenCalledWith('signed.payload.here');
    expect(result.notificationType).toBe('DID_RENEW');
  });

  it('verifyAndDecodeTransaction delegates to SignedDataVerifier', async () => {
    mockVerifyTransaction.mockResolvedValue({
      productId: 'mc.premium.monthly',
      originalTransactionId: 'tx-123',
    });
    const service = require('../appleIAPService.js');
    const result = await service.verifyAndDecodeTransaction('signed.tx.here');
    expect(mockVerifyTransaction).toHaveBeenCalledWith('signed.tx.here');
    expect(result.productId).toBe('mc.premium.monthly');
  });

  it('mapAppleProduct maps known product ids', () => {
    const service = require('../appleIAPService.js');
    expect(service.mapAppleProduct('mc.premium.monthly').tier).toBe('premium');
    expect(service.mapAppleProduct('unknown.product')).toBeNull();
  });
});
