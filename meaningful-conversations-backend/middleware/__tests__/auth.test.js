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

const auth = require('../auth');

const mockReq = (overrides = {}) => ({
  headers: {},
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
});

describe('auth middleware', () => {
  describe('valid JWT', () => {
    it('sets req.userId and calls next()', () => {
      const decoded = { userId: 'user-123' };
      jwt.verify.mockReturnValue(decoded);

      const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
      const res = mockRes();

      auth(req, res, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(req.userId).toBe('user-123');
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('missing Authorization header', () => {
    it('returns 401 with error message', () => {
      const req = mockReq({ headers: {} });
      const res = mockRes();

      auth(req, res, mockNext);

      expect(jwt.verify).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required: No token provided.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 when authorization header is undefined', () => {
      const req = mockReq({ headers: { authorization: undefined } });
      const res = mockRes();

      auth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('malformed header (no "Bearer")', () => {
    it('returns 401 when header does not start with "Bearer "', () => {
      const req = mockReq({ headers: { authorization: 'Basic abc123' } });
      const res = mockRes();

      auth(req, res, mockNext);

      expect(jwt.verify).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required: No token provided.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 when header is just "Bearer" with no token', () => {
      const req = mockReq({ headers: { authorization: 'Bearer' } });
      const res = mockRes();

      auth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('invalid/expired JWT', () => {
    it('returns 401 when jwt.verify throws', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const req = mockReq({ headers: { authorization: 'Bearer bad-token' } });
      const res = mockRes();

      auth(req, res, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('bad-token', 'test-secret');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication failed: Invalid token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 when token is expired (jwt.verify throws TokenExpiredError)', () => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw err;
      });

      const req = mockReq({ headers: { authorization: 'Bearer expired-token' } });
      const res = mockRes();

      auth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication failed: Invalid token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
