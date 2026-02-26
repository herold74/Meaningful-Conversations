/**
 * Unit Tests for middleware/rateLimiter.js
 *
 * Tests:
 * - Each exported limiter is a valid middleware function
 * - Rate limiter config has expected values (via mock capture)
 * - Limiters call next() when invoked (with proper req.app for express-rate-limit)
 */

const capturedConfigs = [];

jest.mock('express-rate-limit', () => (config) => {
  capturedConfigs.push(config);
  return (req, res, next) => next();
});

const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  verifyEmailLimiter,
  geminiLimiter,
  audioTranscribeLimiter,
  botRecommendationLimiter,
  purchaseLimiter,
} = require('../rateLimiter');

// express-rate-limit needs req.app.get for trustProxy
const mockReq = (overrides = {}) => ({
  ip: '127.0.0.1',
  headers: {},
  app: { get: jest.fn().mockReturnValue(false) },
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('rateLimiter exports', () => {
  const limiters = [
    { name: 'loginLimiter', fn: loginLimiter },
    { name: 'registerLimiter', fn: registerLimiter },
    { name: 'forgotPasswordLimiter', fn: forgotPasswordLimiter },
    { name: 'verifyEmailLimiter', fn: verifyEmailLimiter },
    { name: 'geminiLimiter', fn: geminiLimiter },
    { name: 'audioTranscribeLimiter', fn: audioTranscribeLimiter },
    { name: 'botRecommendationLimiter', fn: botRecommendationLimiter },
    { name: 'purchaseLimiter', fn: purchaseLimiter },
  ];

  limiters.forEach(({ name, fn }) => {
    it(`${name} is a function`, () => {
      expect(typeof fn).toBe('function');
    });

    it(`${name} accepts (req, res, next) and calls next() when under limit`, (done) => {
      const req = mockReq();
      const res = mockRes();
      fn(req, res, () => {
        expect(res.status).not.toHaveBeenCalled();
        done();
      });
    });
  });

  it('exports exactly 8 limiters', () => {
    const exported = Object.keys(require('../rateLimiter'));
    expect(exported).toHaveLength(8);
    expect(exported).toContain('loginLimiter');
    expect(exported).toContain('registerLimiter');
    expect(exported).toContain('forgotPasswordLimiter');
    expect(exported).toContain('verifyEmailLimiter');
    expect(exported).toContain('geminiLimiter');
    expect(exported).toContain('audioTranscribeLimiter');
    expect(exported).toContain('botRecommendationLimiter');
    expect(exported).toContain('purchaseLimiter');
  });
});

describe('rate limiter configuration', () => {
  it('loginLimiter has windowMs 10 min and max 5', () => {
    const config = capturedConfigs.find((c) => c.message?.errorCode === 'RATE_LIMIT_LOGIN');
    expect(config).toBeDefined();
    expect(config.windowMs).toBe(10 * 60 * 1000);
    expect(config.max).toBe(5);
    expect(config.message).toEqual({
      error: 'Too many login attempts. Please try again in 10 minutes.',
      errorCode: 'RATE_LIMIT_LOGIN',
    });
  });

  it('registerLimiter has windowMs 1 hour and max 3', () => {
    const config = capturedConfigs.find((c) => c.message?.errorCode === 'RATE_LIMIT_REGISTER');
    expect(config).toBeDefined();
    expect(config.windowMs).toBe(60 * 60 * 1000);
    expect(config.max).toBe(3);
  });

  it('forgotPasswordLimiter has windowMs 1 hour and max 3', () => {
    const config = capturedConfigs.find((c) => c.message?.errorCode === 'RATE_LIMIT_FORGOT_PASSWORD');
    expect(config).toBeDefined();
    expect(config.windowMs).toBe(60 * 60 * 1000);
    expect(config.max).toBe(3);
  });

  it('verifyEmailLimiter has windowMs 15 min and max 10', () => {
    const config = capturedConfigs.find((c) => c.message?.errorCode === 'RATE_LIMIT_VERIFY_EMAIL');
    expect(config).toBeDefined();
    expect(config.windowMs).toBe(15 * 60 * 1000);
    expect(config.max).toBe(10);
  });

  it('geminiLimiter has windowMs 1 min and dynamic max', () => {
    const config = capturedConfigs.find((c) => c.message?.errorCode === 'RATE_LIMIT_GEMINI');
    expect(config).toBeDefined();
    expect(config.windowMs).toBe(60 * 1000);
    expect(typeof config.max).toBe('function');
    expect(config.max({ userId: 'user-1' })).toBe(20);
    expect(config.max({})).toBe(10);
  });

  it('audioTranscribeLimiter has windowMs 1 hour and max 5', () => {
    const config = capturedConfigs.find((c) => c.message?.errorCode === 'RATE_LIMIT_AUDIO_TRANSCRIBE');
    expect(config).toBeDefined();
    expect(config.windowMs).toBe(60 * 60 * 1000);
    expect(config.max).toBe(5);
  });

  it('botRecommendationLimiter has windowMs 10 min and max 10', () => {
    const config = capturedConfigs.find((c) => c.message?.errorCode === 'RATE_LIMIT_BOT_RECOMMENDATION');
    expect(config).toBeDefined();
    expect(config.windowMs).toBe(10 * 60 * 1000);
    expect(config.max).toBe(10);
  });

  it('purchaseLimiter has windowMs 1 hour and max 10', () => {
    const config = capturedConfigs.find((c) => c.message?.errorCode === 'RATE_LIMIT_PURCHASE');
    expect(config).toBeDefined();
    expect(config.windowMs).toBe(60 * 60 * 1000);
    expect(config.max).toBe(10);
  });
});
