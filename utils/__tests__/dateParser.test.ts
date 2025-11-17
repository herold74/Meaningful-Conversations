/**
 * Tests for Date Parser Utility
 */

import { parseDeadline, formatDateToISO, isISODateFormat, getDateParseErrorMessage } from '../dateParser';

describe('dateParser', () => {
  describe('parseDeadline', () => {
    // ISO Date Format Tests
    test('parses ISO date format correctly', () => {
      const result = parseDeadline('2025-11-20');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(10); // November (0-indexed)
      expect(result?.getDate()).toBe(20);
    });

    test('handles ISO dates with prefixes', () => {
      const result = parseDeadline('Deadline: 2025-12-25');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(11); // December
      expect(result?.getDate()).toBe(25);
    });

    // Relative Dates (English)
    test('parses "today" correctly', () => {
      const result = parseDeadline('today');
      const today = new Date();
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(today.getDate());
    });

    test('parses "tomorrow" correctly', () => {
      const result = parseDeadline('tomorrow');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(tomorrow.getDate());
    });

    test('parses "in X days" correctly', () => {
      const result = parseDeadline('in 5 days');
      const expected = new Date();
      expected.setDate(expected.getDate() + 5);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(expected.getDate());
    });

    test('parses "in X weeks" correctly', () => {
      const result = parseDeadline('in 2 weeks');
      const expected = new Date();
      expected.setDate(expected.getDate() + 14);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(expected.getDate());
    });

    // Day of Week Tests
    test('parses day of week (Monday) correctly', () => {
      const result = parseDeadline('by Monday');
      expect(result).not.toBeNull();
      expect(result?.getDay()).toBe(1); // Monday
    });

    test('parses day of week (Friday) correctly', () => {
      const result = parseDeadline('Friday');
      expect(result).not.toBeNull();
      expect(result?.getDay()).toBe(5); // Friday
    });

    // German Relative Dates
    test('parses "heute" (today in German)', () => {
      const result = parseDeadline('heute');
      const today = new Date();
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(today.getDate());
    });

    test('parses "morgen" (tomorrow in German)', () => {
      const result = parseDeadline('morgen');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(tomorrow.getDate());
    });

    test('parses German day "Mittwoch" (Wednesday)', () => {
      const result = parseDeadline('Mittwoch');
      expect(result).not.toBeNull();
      expect(result?.getDay()).toBe(3); // Wednesday
    });

    test('parses "in 3 Tagen" (in 3 days in German)', () => {
      const result = parseDeadline('in 3 tagen');
      const expected = new Date();
      expected.setDate(expected.getDate() + 3);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(expected.getDate());
    });

    // Edge Cases
    test('returns null for invalid date string', () => {
      const result = parseDeadline('not a date');
      expect(result).toBeNull();
    });

    test('returns null for empty string', () => {
      const result = parseDeadline('');
      expect(result).toBeNull();
    });

    test('returns null for undefined', () => {
      const result = parseDeadline(undefined as any);
      expect(result).toBeNull();
    });

    test('handles completely invalid date strings', () => {
      const result = parseDeadline('2025-abc-xyz'); // Invalid format
      expect(result).toBeNull();
    });
  });

  describe('formatDateToISO', () => {
    test('formats date correctly to ISO string', () => {
      const date = new Date(2025, 10, 20); // November 20, 2025
      const result = formatDateToISO(date);
      expect(result).toBe('2025-11-20');
    });

    test('pads single-digit months and days', () => {
      const date = new Date(2025, 0, 5); // January 5, 2025
      const result = formatDateToISO(date);
      expect(result).toBe('2025-01-05');
    });

    test('handles December correctly', () => {
      const date = new Date(2025, 11, 31); // December 31, 2025
      const result = formatDateToISO(date);
      expect(result).toBe('2025-12-31');
    });
  });

  describe('isISODateFormat', () => {
    test('recognizes valid ISO format', () => {
      expect(isISODateFormat('2025-11-20')).toBe(true);
    });

    test('recognizes invalid ISO format (wrong separator)', () => {
      expect(isISODateFormat('2025/11/20')).toBe(false);
    });

    test('recognizes invalid ISO format (missing parts)', () => {
      expect(isISODateFormat('2025-11')).toBe(false);
    });

    test('recognizes invalid ISO format (extra text)', () => {
      expect(isISODateFormat('by 2025-11-20')).toBe(false);
    });

    test('handles empty string', () => {
      expect(isISODateFormat('')).toBe(false);
    });

    test('handles whitespace-padded valid ISO date', () => {
      expect(isISODateFormat('  2025-11-20  ')).toBe(true);
    });
  });

  describe('getDateParseErrorMessage', () => {
    test('returns English error message', () => {
      const message = getDateParseErrorMessage('en');
      expect(message).toContain('Could not automatically recognize');
      expect(message).toContain('select a date');
    });

    test('returns German error message', () => {
      const message = getDateParseErrorMessage('de');
      expect(message).toContain('konnte nicht automatisch erkannt werden');
      expect(message).toContain('wählen Sie ein Datum');
    });

    test('defaults to English for unknown language', () => {
      const message = getDateParseErrorMessage('fr');
      expect(message).toContain('Could not automatically recognize');
    });
  });
});

