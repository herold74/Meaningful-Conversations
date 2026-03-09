/**
 * Tests for date/season utilities
 */

import {
  getCurrentSeason,
  isChristmasSeason,
  isSpringSeason,
  isSummerSeason,
  isAutumnSeason,
  isWinterSeason,
  getSeasonalColorTheme,
} from '../dateUtils';

describe('dateUtils', () => {
  const originalDate = global.Date;

  beforeEach(() => {
    // Reset Date if it was mocked
    global.Date = originalDate;
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  const mockDate = (year: number, month: number, day: number) => {
    const MockDate = class extends Date {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(year, month - 1, day);
        } else {
          super(...(args as [string | number, number, number?, number?, number?, number?, number?]));
        }
      }
    };
    global.Date = MockDate as unknown as DateConstructor;
  };

  describe('getCurrentSeason', () => {
    test('returns spring for March', () => {
      mockDate(2025, 3, 15);
      expect(getCurrentSeason()).toBe('spring');
    });

    test('returns spring for May', () => {
      mockDate(2025, 5, 31);
      expect(getCurrentSeason()).toBe('spring');
    });

    test('returns summer for June', () => {
      mockDate(2025, 6, 1);
      expect(getCurrentSeason()).toBe('summer');
    });

    test('returns summer for August', () => {
      mockDate(2025, 8, 15);
      expect(getCurrentSeason()).toBe('summer');
    });

    test('returns autumn for September', () => {
      mockDate(2025, 9, 1);
      expect(getCurrentSeason()).toBe('autumn');
    });

    test('returns autumn for November', () => {
      mockDate(2025, 11, 30);
      expect(getCurrentSeason()).toBe('autumn');
    });

    test('returns winter for December', () => {
      mockDate(2025, 12, 1);
      expect(getCurrentSeason()).toBe('winter');
    });

    test('returns winter for January', () => {
      mockDate(2025, 1, 15);
      expect(getCurrentSeason()).toBe('winter');
    });

    test('returns winter for February', () => {
      mockDate(2025, 2, 28);
      expect(getCurrentSeason()).toBe('winter');
    });
  });

  describe('isChristmasSeason', () => {
    test('returns true for December', () => {
      mockDate(2025, 12, 15);
      expect(isChristmasSeason()).toBe(true);
    });

    test('returns true for January 1-6', () => {
      mockDate(2025, 1, 1);
      expect(isChristmasSeason()).toBe(true);
      mockDate(2025, 1, 6);
      expect(isChristmasSeason()).toBe(true);
    });

    test('returns false for January 7', () => {
      mockDate(2025, 1, 7);
      expect(isChristmasSeason()).toBe(false);
    });

    test('returns false for November', () => {
      mockDate(2025, 11, 30);
      expect(isChristmasSeason()).toBe(false);
    });
  });

  describe('isSpringSeason, isSummerSeason, isAutumnSeason, isWinterSeason', () => {
    test('isSpringSeason returns true in spring', () => {
      mockDate(2025, 4, 15);
      expect(isSpringSeason()).toBe(true);
      mockDate(2025, 6, 1);
      expect(isSpringSeason()).toBe(false);
    });

    test('isSummerSeason returns true in summer', () => {
      mockDate(2025, 7, 15);
      expect(isSummerSeason()).toBe(true);
      mockDate(2025, 9, 1);
      expect(isSummerSeason()).toBe(false);
    });

    test('isAutumnSeason returns true in autumn', () => {
      mockDate(2025, 10, 15);
      expect(isAutumnSeason()).toBe(true);
      mockDate(2025, 12, 1);
      expect(isAutumnSeason()).toBe(false);
    });

    test('isWinterSeason returns true in winter', () => {
      mockDate(2025, 1, 15);
      expect(isWinterSeason()).toBe(true);
      mockDate(2025, 3, 1);
      expect(isWinterSeason()).toBe(false);
    });
  });

  describe('getSeasonalColorTheme', () => {
    test('returns summer for spring', () => {
      mockDate(2025, 4, 15);
      expect(getSeasonalColorTheme()).toBe('summer');
    });

    test('returns summer for summer', () => {
      mockDate(2025, 7, 15);
      expect(getSeasonalColorTheme()).toBe('summer');
    });

    test('returns autumn for autumn', () => {
      mockDate(2025, 10, 15);
      expect(getSeasonalColorTheme()).toBe('autumn');
    });

    test('returns brand for winter', () => {
      mockDate(2025, 1, 15);
      expect(getSeasonalColorTheme()).toBe('brand');
      mockDate(2025, 12, 15);
      expect(getSeasonalColorTheme()).toBe('brand');
    });
  });
});
