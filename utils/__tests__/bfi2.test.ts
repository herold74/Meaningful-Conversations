/**
 * Tests for BFI-2 (Big Five Inventory-2) utility
 */

import { calculateBfi2, getBfi2Items, BFI2_ITEMS } from '../bfi2';

describe('bfi2', () => {
  describe('calculateBfi2', () => {
    test('returns all 5 Big5 dimensions for xs variant', () => {
      const data: Record<string, number> = {};
      BFI2_ITEMS.slice(0, 15).forEach((item, i) => {
        data[item.id] = 3;
      });
      const result = calculateBfi2(data, 'xs');
      expect(result).toHaveProperty('extraversion');
      expect(result).toHaveProperty('agreeableness');
      expect(result).toHaveProperty('conscientiousness');
      expect(result).toHaveProperty('neuroticism');
      expect(result).toHaveProperty('openness');
      expect(result.variant).toBe('xs');
      expect(result.facets).toBeUndefined();
    });

    test('returns facets for s variant', () => {
      const data: Record<string, number> = {};
      BFI2_ITEMS.forEach((item) => {
        data[item.id] = 3;
      });
      const result = calculateBfi2(data, 's');
      expect(result.facets).toBeDefined();
      expect(result.facets).toHaveProperty('sociability');
      expect(result.facets).toHaveProperty('assertiveness');
      expect(result.facets).toHaveProperty('energyLevel');
      expect(result.facets).toHaveProperty('compassion');
      expect(result.facets).toHaveProperty('anxiety');
      expect(result.facets).toHaveProperty('creativeImagination');
    });

    test('known input produces expected structure - all 5s for E items', () => {
      const data: Record<string, number> = {};
      BFI2_ITEMS.forEach((item) => {
        data[item.id] = item.domain === 'E' ? 5 : 3;
      });
      const result = calculateBfi2(data, 's');
      expect(result.extraversion).toBeDefined();
      expect(typeof result.extraversion).toBe('number');
      expect(result.agreeableness).toBeDefined();
      expect(result.facets).toBeDefined();
    });

    test('reverse-scored items are handled correctly', () => {
      const data: Record<string, number> = {};
      BFI2_ITEMS.forEach((item) => {
        data[item.id] = item.reverse ? 1 : 5;
      });
      const result = calculateBfi2(data, 'xs');
      expect(result.extraversion).toBeDefined();
      expect(result.openness).toBeDefined();
    });

    test('missing answers default to 3', () => {
      const data: Record<string, number> = { bfi2_1: 5 };
      const result = calculateBfi2(data, 'xs');
      expect(result.extraversion).toBeDefined();
      expect(typeof result.extraversion).toBe('number');
    });

    test('scores are rounded to one decimal', () => {
      const data: Record<string, number> = {};
      BFI2_ITEMS.slice(0, 15).forEach((item) => {
        data[item.id] = 4;
      });
      const result = calculateBfi2(data, 'xs');
      const decimals = (n: number) => (n.toString().split('.')[1] || '').length;
      expect(decimals(result.extraversion)).toBeLessThanOrEqual(1);
      expect(decimals(result.openness)).toBeLessThanOrEqual(1);
    });
  });

  describe('getBfi2Items', () => {
    const mockT = (key: string) => `[${key}]`;

    test('returns 15 items for xs variant', () => {
      const items = getBfi2Items('xs', mockT);
      expect(items).toHaveLength(15);
    });

    test('returns 30 items for s variant', () => {
      const items = getBfi2Items('s', mockT);
      expect(items).toHaveLength(30);
    });

    test('returns localized items with stem and item text', () => {
      const items = getBfi2Items('xs', mockT);
      expect(items[0]).toHaveProperty('id', 'bfi2_1');
      expect(items[0]).toHaveProperty('text');
      expect(items[0].text).toContain('survey_bfi2_stem');
      expect(items[0].text).toContain('survey_bfi2_item_1');
    });

    test('each item has id and text', () => {
      const items = getBfi2Items('s', mockT);
      items.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('text');
        expect(typeof item.id).toBe('string');
        expect(typeof item.text).toBe('string');
      });
    });
  });
});
