/**
 * Unit Tests for middleware/optionalAuth.js
 *
 * Tests:
 * - Valid JWT: sets req.userId, calls next()
 * - No token: does NOT set req.userId, still calls next() (not an error)
 * - Invalid JWT: does NOT set req.userId, still calls next()
 */

const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

const optionalAuth = require('../optionalAuth');

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

describe('optionalAuth middleware', () => {
  describe('valid JWT', () => {
    it('sets req.userId and calls next()', () => {
      const decoded = { userId: 'user-123' };
      jwt.verify.mockReturnValue(decoded);

      const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
      const res = mockRes();

      optionalAuth(req, res, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(req.userId).toBe('user-123');
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('no token', () => {
    it('does NOT set req.userId and still calls next()', () => {
      const req = mockReq({ headers: {} });
      const res = mockRes();

      optionalAuth(req, res, mockNext);

      expect(jwt.verify).not.toHaveBeenCalled();
      expect(req.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('does NOT set req.userId when authorization header is undefined', () => {
      const req = mockReq({ headers: { authorization: undefined } });
      const res = mockRes();

      optionalAuth(req, res, mockNext);

      expect(req.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('does NOT set req.userId when header does not start with Bearer', () => {
      const req = mockReq({ headers: { authorization: 'Basic abc' } });
      const res = mockRes();

      optionalAuth(req, res, mockNext);

      expect(jwt.verify).not.toHaveBeenCalled();
      expect(req.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalid JWT', () => {
    it('does NOT set req.userId and still calls next()', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const req = mockReq({ headers: { authorization: 'Bearer bad-token' } });
      const res = mockRes();

      optionalAuth(req, res, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('bad-token', 'test-secret');
      expect(req.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('calls next() when token is expired', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const req = mockReq({ headers: { authorization: 'Bearer expired-token' } });
      const res = mockRes();

      optionalAuth(req, res, mockNext);

      expect(req.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
