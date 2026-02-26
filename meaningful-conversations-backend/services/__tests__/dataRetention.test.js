/**
 * Unit Tests for dataRetention.js
 *
 * Tests:
 * 1. runRetentionCleanup: ApiUsage and UserEvent cleanup
 * 2. RETENTION_POLICIES
 * 3. Edge cases: no expired data, all expired
 */

jest.mock('../../prismaClient.js');

const prisma = require('../../prismaClient.js');
const {
  runRetentionCleanup,
  initDataRetentionCleanup,
  RETENTION_POLICIES,
} = require('../dataRetention');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('dataRetention', () => {
  describe('RETENTION_POLICIES', () => {
    test('has apiUsage and userEvent policies', () => {
      expect(RETENTION_POLICIES).toHaveProperty('apiUsage');
      expect(RETENTION_POLICIES).toHaveProperty('userEvent');
    });

    test('apiUsage is 12 months', () => {
      expect(RETENTION_POLICIES.apiUsage.months).toBe(12);
      expect(RETENTION_POLICIES.apiUsage.label).toBe('API usage records');
    });

    test('userEvent is 6 months', () => {
      expect(RETENTION_POLICIES.userEvent.months).toBe(6);
      expect(RETENTION_POLICIES.userEvent.label).toBe('user event records');
    });
  });

  describe('runRetentionCleanup', () => {
    test('deletes ApiUsage older than 12 months', async () => {
      prisma.apiUsage.deleteMany.mockResolvedValue({ count: 100 });
      prisma.userEvent.deleteMany.mockResolvedValue({ count: 0 });

      await runRetentionCleanup();

      expect(prisma.apiUsage.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });

      const cutoff = prisma.apiUsage.deleteMany.mock.calls[0][0].where.createdAt.lt;
      const expectedCutoff = new Date();
      expectedCutoff.setMonth(expectedCutoff.getMonth() - 12);
      expect(cutoff.getFullYear()).toBe(expectedCutoff.getFullYear());
      expect(cutoff.getMonth()).toBe(expectedCutoff.getMonth());
    });

    test('deletes UserEvent older than 6 months', async () => {
      prisma.apiUsage.deleteMany.mockResolvedValue({ count: 0 });
      prisma.userEvent.deleteMany.mockResolvedValue({ count: 50 });

      await runRetentionCleanup();

      expect(prisma.userEvent.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });

      const cutoff = prisma.userEvent.deleteMany.mock.calls[0][0].where.createdAt.lt;
      const expectedCutoff = new Date();
      expectedCutoff.setMonth(expectedCutoff.getMonth() - 6);
      expect(cutoff.getFullYear()).toBe(expectedCutoff.getFullYear());
      expect(cutoff.getMonth()).toBe(expectedCutoff.getMonth());
    });

    test('no expired data: both deleteMany return 0', async () => {
      prisma.apiUsage.deleteMany.mockResolvedValue({ count: 0 });
      prisma.userEvent.deleteMany.mockResolvedValue({ count: 0 });

      await runRetentionCleanup();

      expect(prisma.apiUsage.deleteMany).toHaveBeenCalled();
      expect(prisma.userEvent.deleteMany).toHaveBeenCalled();
    });

    test('all expired: both deleteMany return counts', async () => {
      prisma.apiUsage.deleteMany.mockResolvedValue({ count: 500 });
      prisma.userEvent.deleteMany.mockResolvedValue({ count: 200 });

      await runRetentionCleanup();

      expect(prisma.apiUsage.deleteMany).toHaveBeenCalled();
      expect(prisma.userEvent.deleteMany).toHaveBeenCalled();
    });

    test('ApiUsage error does not prevent UserEvent cleanup', async () => {
      prisma.apiUsage.deleteMany.mockRejectedValue(new Error('DB error'));
      prisma.userEvent.deleteMany.mockResolvedValue({ count: 10 });

      await runRetentionCleanup();

      expect(prisma.userEvent.deleteMany).toHaveBeenCalled();
    });

    test('UserEvent error does not throw', async () => {
      prisma.apiUsage.deleteMany.mockResolvedValue({ count: 0 });
      prisma.userEvent.deleteMany.mockRejectedValue(new Error('DB error'));

      await expect(runRetentionCleanup()).resolves.not.toThrow();
    });
  });

  describe('initDataRetentionCleanup', () => {
    test('calls runRetentionCleanup immediately', async () => {
      prisma.apiUsage.deleteMany.mockResolvedValue({ count: 0 });
      prisma.userEvent.deleteMany.mockResolvedValue({ count: 0 });

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      initDataRetentionCleanup();

      await new Promise((r) => setTimeout(r, 50));

      expect(prisma.apiUsage.deleteMany).toHaveBeenCalled();
      expect(prisma.userEvent.deleteMany).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });

    test('schedules interval', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      initDataRetentionCleanup();

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        24 * 60 * 60 * 1000
      );

      setIntervalSpy.mockRestore();
    });
  });
});
