/**
 * Unit Tests for middleware/auth.js
 *
 * Tests:
 * - Valid JWT: sets req.userId, calls next()
 * - Missing Authorization header: returns 401
 * - Malformed header (no "Bearer"): returns 401
 * - Invalid/expired JWT: returns 401
 */

const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');
jest.mock('../../services/tokenInvalidation.js', () => ({
  isTokenInvalidated: jest.fn().mockResolvedValue(false),
}));

const auth = require('../auth');

const mockReq = (overrides = {}) => ({
  headers: {},
  path: '/some-path',
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
  // Default: token is valid (not invalidated)
  require('../../services/tokenInvalidation.js').isTokenInvalidated.mockResolvedValue(false);
});

describe('auth middleware', () => {
  describe('valid JWT', () => {
    it('sets req.userId and calls next()', async () => {
      const decoded = { userId: 'user-123', iat: 1000 };
      jwt.verify.mockReturnValue(decoded);

      const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
      const res = mockRes();

      await auth(req, res, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(req.userId).toBe('user-123');
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('invalidated JWT', () => {
    it('returns 401 when token has been invalidated', async () => {
      const decoded = { userId: 'user-123', iat: 1000 };
      jwt.verify.mockReturnValue(decoded);
      require('../../services/tokenInvalidation.js').isTokenInvalidated.mockResolvedValue(true);

      const req = mockReq({ headers: { authorization: 'Bearer invalidated-token' } });
      const res = mockRes();

      await auth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token has been invalidated. Please log in again.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('missing Authorization header', () => {
    it('returns 401 with error message', async () => {
      const req = mockReq({ headers: {} });
      const res = mockRes();

      await auth(req, res, mockNext);

      expect(jwt.verify).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required: No token provided.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 when authorization header is undefined', async () => {
      const req = mockReq({ headers: { authorization: undefined } });
      const res = mockRes();

      await auth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('malformed header (no "Bearer")', () => {
    it('returns 401 when header does not start with "Bearer "', async () => {
      const req = mockReq({ headers: { authorization: 'Basic abc123' } });
      const res = mockRes();

      await auth(req, res, mockNext);

      expect(jwt.verify).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required: No token provided.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 when header is just "Bearer" with no token', async () => {
      const req = mockReq({ headers: { authorization: 'Bearer' } });
      const res = mockRes();

      await auth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('invalid/expired JWT', () => {
    it('returns 401 when jwt.verify throws', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const req = mockReq({ headers: { authorization: 'Bearer bad-token' } });
      const res = mockRes();

      await auth(req, res, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('bad-token', 'test-secret');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication failed: Invalid token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 when token is expired (jwt.verify throws TokenExpiredError)', async () => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw err;
      });

      const req = mockReq({ headers: { authorization: 'Bearer expired-token' } });
      const res = mockRes();

      await auth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication failed: Invalid token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
