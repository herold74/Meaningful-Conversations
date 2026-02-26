/**
 * Unit Tests for apiUsageTracker.js
 *
 * Tests:
 * 1. calculateCost, estimateTokens, extractTokenUsage (pure functions)
 * 2. trackApiUsage: creates record with correct data
 * 3. getUsageStats: aggregation and breakdowns
 * 4. getTopUsers
 */

jest.mock('../../prismaClient.js');

const prisma = require('../../prismaClient.js');
const {
  calculateCost,
  estimateTokens,
  extractTokenUsage,
  trackApiUsage,
  getUsageStats,
  getTopUsers,
  PRICING,
} = require('../apiUsageTracker');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('apiUsageTracker', () => {
  describe('calculateCost', () => {
    test('calculates cost for gemini-2.5-flash', () => {
      const cost = calculateCost('gemini-2.5-flash', 1_000_000, 500_000);
      expect(cost).toBeCloseTo(0.075 + 0.15, 4);
    });

    test('returns 0 for free models (gemini-2.0-flash-exp)', () => {
      const cost = calculateCost('gemini-2.0-flash-exp', 1_000_000, 1_000_000);
      expect(cost).toBe(0);
    });

    test('returns 0 for piper-tts (self-hosted)', () => {
      const cost = calculateCost('piper-tts', 1000, 500);
      expect(cost).toBe(0);
    });

    test('unknown model defaults to gemini-2.5-flash pricing', () => {
      const cost = calculateCost('unknown-model', 1_000_000, 0);
      expect(cost).toBeCloseTo(0.075, 4);
    });
  });

  describe('estimateTokens', () => {
    test('estimates ~4 chars per token', () => {
      expect(estimateTokens('hello')).toBe(2);
      expect(estimateTokens('12345678')).toBe(2);
    });

    test('returns 0 for empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    test('returns 0 for null/undefined', () => {
      expect(estimateTokens(null)).toBe(0);
      expect(estimateTokens(undefined)).toBe(0);
    });

    test('rounds up for partial tokens', () => {
      expect(estimateTokens('ab')).toBe(1);
      expect(estimateTokens('abc')).toBe(1);
    });
  });

  describe('extractTokenUsage', () => {
    test('extracts from usageMetadata', () => {
      const response = {
        usageMetadata: {
          promptTokenCount: 100,
          candidatesTokenCount: 50,
          totalTokenCount: 150,
        },
      };
      const result = extractTokenUsage(response);
      expect(result.inputTokens).toBe(100);
      expect(result.outputTokens).toBe(50);
      expect(result.totalTokens).toBe(150);
    });

    test('handles missing usageMetadata', () => {
      const result = extractTokenUsage({});
      expect(result.inputTokens).toBe(0);
      expect(result.outputTokens).toBe(0);
      expect(result.totalTokens).toBe(0);
    });
  });

  describe('trackApiUsage', () => {
    test('creates record with correct data', async () => {
      const created = {
        id: 1,
        userId: null,
        isGuest: true,
        endpoint: '/api/gemini/chat',
        model: 'gemini-2.5-flash',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCostUSD: 0.000225,
        durationMs: 1200,
        success: true,
        errorMessage: null,
        metadata: null,
      };
      prisma.apiUsage.create.mockResolvedValue(created);

      const result = await trackApiUsage({
        isGuest: true,
        endpoint: '/api/gemini/chat',
        model: 'gemini-2.5-flash',
        inputTokens: 1000,
        outputTokens: 500,
        durationMs: 1200,
      });

      expect(result).toEqual(created);
      expect(prisma.apiUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isGuest: true,
          endpoint: '/api/gemini/chat',
          model: 'gemini-2.5-flash',
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
          success: true,
        }),
      });
    });

    test('calculates totalTokens and estimatedCostUSD', async () => {
      prisma.apiUsage.create.mockResolvedValue({});

      await trackApiUsage({
        endpoint: '/api/gemini/chat',
        model: 'gemini-2.5-flash',
        inputTokens: 100,
        outputTokens: 50,
      });

      const call = prisma.apiUsage.create.mock.calls[0][0];
      expect(call.data.totalTokens).toBe(150);
      expect(call.data.estimatedCostUSD).toBeGreaterThan(0);
    });

    test('on error: returns null (does not throw)', async () => {
      prisma.apiUsage.create.mockRejectedValue(new Error('DB error'));

      const result = await trackApiUsage({
        endpoint: '/api/gemini/chat',
        model: 'gemini-2.5-flash',
        inputTokens: 100,
        outputTokens: 50,
      });

      expect(result).toBeNull();
    });
  });

  describe('getUsageStats', () => {
    test('aggregates usage records', async () => {
      const records = [
        {
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
          estimatedCostUSD: 0.0002,
          success: true,
          isGuest: true,
          model: 'gemini-2.5-flash',
          endpoint: '/api/gemini/chat',
          botId: 'nexus-gps',
          durationMs: 1000,
        },
        {
          inputTokens: 2000,
          outputTokens: 1000,
          totalTokens: 3000,
          estimatedCostUSD: 0.0005,
          success: true,
          isGuest: false,
          model: 'gemini-2.5-flash',
          endpoint: '/api/gemini/chat',
          botId: null,
          durationMs: 2000,
        },
      ];
      prisma.apiUsage.findMany.mockResolvedValue(records);

      const result = await getUsageStats(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(result.totalCalls).toBe(2);
      expect(result.successfulCalls).toBe(2);
      expect(result.failedCalls).toBe(0);
      expect(result.totalInputTokens).toBe(3000);
      expect(result.totalOutputTokens).toBe(1500);
      expect(result.totalTokens).toBe(4500);
      expect(result.totalCostUSD).toBeCloseTo(0.0007, 4);
      expect(result.guestCalls).toBe(1);
      expect(result.registeredCalls).toBe(1);
      expect(result.byModel['gemini-2.5-flash']).toBeDefined();
      expect(result.byEndpoint['/api/gemini/chat']).toBeDefined();
    });

    test('includes failed calls in stats', async () => {
      prisma.apiUsage.findMany.mockResolvedValue([
        { success: true, inputTokens: 100, outputTokens: 50, totalTokens: 150, estimatedCostUSD: 0, model: 'x', endpoint: 'y', isGuest: true, botId: null, durationMs: null },
        { success: false, inputTokens: 50, outputTokens: 0, totalTokens: 50, estimatedCostUSD: 0, model: 'x', endpoint: 'y', isGuest: true, botId: null, durationMs: null },
      ]);

      const result = await getUsageStats(new Date(), new Date());

      expect(result.totalCalls).toBe(2);
      expect(result.successfulCalls).toBe(1);
      expect(result.failedCalls).toBe(1);
    });

    test('empty records returns zero stats', async () => {
      prisma.apiUsage.findMany.mockResolvedValue([]);

      const result = await getUsageStats(new Date(), new Date());

      expect(result.totalCalls).toBe(0);
      expect(result.totalTokens).toBe(0);
      expect(result.totalCostUSD).toBe(0);
    });
  });

  describe('getTopUsers', () => {
    test('returns grouped results', async () => {
      const grouped = [
        {
          userId: 'user-1',
          _count: { id: 50 },
          _sum: {
            inputTokens: 100000,
            outputTokens: 50000,
            totalTokens: 150000,
            estimatedCostUSD: 0.05,
          },
        },
      ];
      prisma.apiUsage.groupBy.mockResolvedValue(grouped);

      const result = await getTopUsers(
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        10
      );

      expect(result).toEqual(grouped);
      expect(prisma.apiUsage.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['userId'],
          take: 10,
        })
      );
    });

    test('uses default limit of 10', async () => {
      prisma.apiUsage.groupBy.mockResolvedValue([]);

      await getTopUsers(new Date(), new Date());

      expect(prisma.apiUsage.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  describe('PRICING', () => {
    test('has expected model keys', () => {
      expect('gemini-2.5-flash' in PRICING).toBe(true);
      expect('gemini-2.0-flash-exp' in PRICING).toBe(true);
      expect('piper-tts' in PRICING).toBe(true);
    });

    test('each model has input and output rates', () => {
      for (const [model, rates] of Object.entries(PRICING)) {
        expect(rates).toHaveProperty('input');
        expect(rates).toHaveProperty('output');
        expect(typeof rates.input).toBe('number');
        expect(typeof rates.output).toBe('number');
      }
    });
  });
});
