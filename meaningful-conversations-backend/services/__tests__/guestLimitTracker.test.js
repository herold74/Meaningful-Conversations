/**
 * Unit Tests for guestLimitTracker.js
 *
 * Tests:
 * 1. checkGuestLimit: under limit, at limit, over limit
 * 2. incrementGuestUsage: new guest, returning guest
 * 3. getGuestStats: aggregation
 * 4. cleanupExpiredGuestRecords
 * 5. WEEKLY_MESSAGE_LIMIT constant
 */

jest.mock('@prisma/client', () => {
  const prisma = require('../../__mocks__/prismaClient.js');
  return { PrismaClient: jest.fn(() => prisma) };
});

const prisma = require('../../__mocks__/prismaClient.js');
const {
  checkGuestLimit,
  incrementGuestUsage,
  cleanupExpiredGuestRecords,
  getGuestStats,
  WEEKLY_MESSAGE_LIMIT,
} = require('../guestLimitTracker');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('guestLimitTracker', () => {
  describe('WEEKLY_MESSAGE_LIMIT', () => {
    test('is 50', () => {
      expect(WEEKLY_MESSAGE_LIMIT).toBe(50);
    });
  });

  describe('checkGuestLimit', () => {
    test('under limit: new guest has full quota', async () => {
      prisma.guestUsage.findUnique.mockResolvedValue(null);

      const result = await checkGuestLimit('fp-new-guest');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(50);
      expect(result.messageCount).toBe(0);
      expect(prisma.guestUsage.findUnique).toHaveBeenCalledWith({
        where: { fingerprint: 'fp-new-guest' },
      });
    });

    test('under limit: returning guest with messages remaining', async () => {
      const weekStart = new Date();
      weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
      weekStart.setUTCHours(0, 0, 0, 0);

      prisma.guestUsage.findUnique.mockResolvedValue({
        fingerprint: 'fp-returning',
        messageCount: 10,
        weekStart,
      });

      const result = await checkGuestLimit('fp-returning');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(40);
      expect(result.messageCount).toBe(10);
    });

    test('at limit: exactly 50 messages', async () => {
      const weekStart = new Date();
      weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
      weekStart.setUTCHours(0, 0, 0, 0);

      prisma.guestUsage.findUnique.mockResolvedValue({
        fingerprint: 'fp-at-limit',
        messageCount: 50,
        weekStart,
      });

      const result = await checkGuestLimit('fp-at-limit');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.messageCount).toBe(50);
    });

    test('over limit: more than 50 messages', async () => {
      const weekStart = new Date();
      weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
      weekStart.setUTCHours(0, 0, 0, 0);

      prisma.guestUsage.findUnique.mockResolvedValue({
        fingerprint: 'fp-over',
        messageCount: 55,
        weekStart,
      });

      const result = await checkGuestLimit('fp-over');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.messageCount).toBe(55);
    });

    test('week reset: old weekStart triggers update and reset', async () => {
      const oldWeekStart = new Date();
      oldWeekStart.setUTCDate(oldWeekStart.getUTCDate() - 14);
      oldWeekStart.setUTCHours(0, 0, 0, 0);

      const newWeekStart = new Date();
      newWeekStart.setUTCDate(newWeekStart.getUTCDate() - newWeekStart.getUTCDay());
      newWeekStart.setUTCHours(0, 0, 0, 0);

      prisma.guestUsage.findUnique
        .mockResolvedValueOnce({
          fingerprint: 'fp-old-week',
          messageCount: 50,
          weekStart: oldWeekStart,
        });

      prisma.guestUsage.update.mockResolvedValue({
        fingerprint: 'fp-old-week',
        messageCount: 0,
        weekStart: newWeekStart,
      });

      const result = await checkGuestLimit('fp-old-week');

      expect(prisma.guestUsage.update).toHaveBeenCalledWith({
        where: { fingerprint: 'fp-old-week' },
        data: {
          messageCount: 0,
          weekStart: expect.any(Date),
        },
      });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(50);
    });

    test('on error: fails open (allows request)', async () => {
      prisma.guestUsage.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await checkGuestLimit('fp-error');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(50);
      expect(result.messageCount).toBe(0);
    });
  });

  describe('incrementGuestUsage', () => {
    test('new guest: creates record with messageCount 1', async () => {
      const weekStart = new Date();
      weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
      weekStart.setUTCHours(0, 0, 0, 0);

      prisma.guestUsage.upsert.mockResolvedValue({
        fingerprint: 'fp-new',
        messageCount: 1,
        weekStart,
      });

      const result = await incrementGuestUsage('fp-new');

      expect(result.messageCount).toBe(1);
      expect(result.remaining).toBe(49);
      expect(prisma.guestUsage.upsert).toHaveBeenCalledWith({
        where: { fingerprint: 'fp-new' },
        update: { messageCount: { increment: 1 } },
        create: {
          fingerprint: 'fp-new',
          messageCount: 1,
          weekStart: expect.any(Date),
        },
      });
    });

    test('returning guest: increments messageCount', async () => {
      const weekStart = new Date();
      weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
      weekStart.setUTCHours(0, 0, 0, 0);

      prisma.guestUsage.upsert.mockResolvedValue({
        fingerprint: 'fp-returning',
        messageCount: 25,
        weekStart,
      });

      const result = await incrementGuestUsage('fp-returning');

      expect(result.messageCount).toBe(25);
      expect(result.remaining).toBe(25);
    });

    test('throws on error', async () => {
      prisma.guestUsage.upsert.mockRejectedValue(new Error('DB error'));

      await expect(incrementGuestUsage('fp-error')).rejects.toThrow('DB error');
    });
  });

  describe('getGuestStats', () => {
    test('returns aggregated stats', async () => {
      prisma.guestUsage.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(3);
      prisma.guestUsage.findMany.mockResolvedValue([
        { messageCount: 10 },
        { messageCount: 20 },
        { messageCount: 5 },
      ]);

      const result = await getGuestStats();

      expect(result.totalGuests).toBe(3);
      expect(result.activeThisWeek).toBe(3);
      expect(result.averageMessages).toBeCloseTo(11.67, 1);
    });

    test('returns zeros when no guests', async () => {
      prisma.guestUsage.count.mockResolvedValue(0);
      prisma.guestUsage.findMany.mockResolvedValue([]);

      const result = await getGuestStats();

      expect(result.totalGuests).toBe(0);
      expect(result.activeThisWeek).toBe(0);
      expect(result.averageMessages).toBe(0);
    });

    test('on error: returns zeros', async () => {
      prisma.guestUsage.count.mockRejectedValue(new Error('DB error'));

      const result = await getGuestStats();

      expect(result.totalGuests).toBe(0);
      expect(result.activeThisWeek).toBe(0);
      expect(result.averageMessages).toBe(0);
    });
  });

  describe('cleanupExpiredGuestRecords', () => {
    test('deletes records older than 7 days', async () => {
      prisma.guestUsage.deleteMany.mockResolvedValue({ count: 5 });

      const result = await cleanupExpiredGuestRecords();

      expect(result).toBe(5);
      expect(prisma.guestUsage.deleteMany).toHaveBeenCalledWith({
        where: {
          lastUsed: {
            lt: expect.any(Date),
          },
        },
      });
    });

    test('returns 0 when no records to delete', async () => {
      prisma.guestUsage.deleteMany.mockResolvedValue({ count: 0 });

      const result = await cleanupExpiredGuestRecords();

      expect(result).toBe(0);
    });

    test('returns 0 on error', async () => {
      prisma.guestUsage.deleteMany.mockRejectedValue(new Error('DB error'));

      const result = await cleanupExpiredGuestRecords();

      expect(result).toBe(0);
    });
  });
});
