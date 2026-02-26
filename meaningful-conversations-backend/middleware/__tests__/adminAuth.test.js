/**
 * Unit Tests for middleware/adminAuth.js
 *
 * Tests:
 * - Valid JWT + admin user: sets req.userId and req.user, calls next()
 * - Valid JWT + non-admin user: returns 403
 * - Missing token: returns 401
 * - Invalid JWT: returns 401
 * - User not found: returns 403
 */

const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');
jest.mock('../../prismaClient.js', () => require('../../__mocks__/prismaClient.js'));

const prisma = require('../../prismaClient.js');
const adminAuth = require('../adminAuth');

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

describe('adminAuth middleware', () => {
  describe('valid JWT + admin user', () => {
    it('sets req.userId and req.user and calls next()', async () => {
      const decoded = { userId: 'admin-user-456' };
      const adminUser = {
        id: 'admin-user-456',
        email: 'admin@test.com',
        isAdmin: true,
      };

      jwt.verify.mockReturnValue(decoded);
      prisma.user.findUnique.mockResolvedValue(adminUser);

      const req = mockReq({ headers: { authorization: 'Bearer valid-admin-token' } });
      const res = mockRes();

      await adminAuth(req, res, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-admin-token', 'test-secret');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'admin-user-456' },
      });
      expect(req.userId).toBe('admin-user-456');
      expect(req.user).toEqual(adminUser);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('valid JWT + non-admin user', () => {
    it('returns 403 with Forbidden message', async () => {
      const decoded = { userId: 'regular-user-789' };
      const regularUser = {
        id: 'regular-user-789',
        email: 'user@test.com',
        isAdmin: false,
      };

      jwt.verify.mockReturnValue(decoded);
      prisma.user.findUnique.mockResolvedValue(regularUser);

      const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
      const res = mockRes();

      await adminAuth(req, res, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'regular-user-789' },
      });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Forbidden: Admin access required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('missing token', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const req = mockReq({ headers: {} });
      const res = mockRes();

      await adminAuth(req, res, mockNext);

      expect(jwt.verify).not.toHaveBeenCalled();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required: No token provided.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 when header does not start with Bearer', async () => {
      const req = mockReq({ headers: { authorization: 'Basic xyz' } });
      const res = mockRes();

      await adminAuth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('invalid JWT', () => {
    it('returns 401 when jwt.verify throws', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const req = mockReq({ headers: { authorization: 'Bearer bad-token' } });
      const res = mockRes();

      await adminAuth(req, res, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('bad-token', 'test-secret');
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication failed: Invalid token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('user not found', () => {
    it('returns 403 when user does not exist in database', async () => {
      const decoded = { userId: 'deleted-user' };
      jwt.verify.mockReturnValue(decoded);
      prisma.user.findUnique.mockResolvedValue(null);

      const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
      const res = mockRes();

      await adminAuth(req, res, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'deleted-user' },
      });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Forbidden: Admin access required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
