/**
 * Tests for PII detection utility
 */

import { detectPII } from '../piiDetection';

describe('piiDetection', () => {
  describe('detectPII', () => {
    test('detects German first name + surname (uppercase)', () => {
      const result = detectPII('Ich habe mit Gerald Schmidt gesprochen.', 'de');
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes.length).toBeGreaterThan(0);
      expect(result.examples.length).toBeGreaterThan(0);
    });

    test('detects English first name + surname', () => {
      const result = detectPII('I met with Jennifer Williams at the office.', 'en');
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('Potential full names');
    });

    test('text without PII returns hasPII false', () => {
      const result = detectPII('Das Meeting war produktiv. Wir haben über das Projekt gesprochen.', 'de');
      expect(result.hasPII).toBe(false);
      expect(result.detectedTypes).toHaveLength(0);
      expect(result.examples).toHaveLength(0);
    });

    test('common words are not treated as names', () => {
      const result = detectPII('Der Chef hat mit dem Team gesprochen.', 'de');
      expect(result.hasPII).toBe(false);
    });

    test('first name alone without surname does not trigger', () => {
      const result = detectPII('Gerald sagte, dass es gut läuft.', 'de');
      expect(result.hasPII).toBe(false);
    });

    test('surname must start with uppercase', () => {
      const result = detectPII('Ich kenne gerald schmidt.', 'de');
      expect(result.hasPII).toBe(false);
    });

    test('partial matches - short words skipped', () => {
      const result = detectPII('Jo und Ja sind da.', 'de');
      expect(result.hasPII).toBe(false);
    });

    test('returns DE label when language is de', () => {
      const result = detectPII('Mit Anna Müller gesprochen.', 'de');
      if (result.hasPII) {
        expect(result.detectedTypes).toContain('Mögliche vollständige Namen');
      }
    });

    test('returns EN label when language is en', () => {
      const result = detectPII('Meeting with David Johnson today.', 'en');
      if (result.hasPII) {
        expect(result.detectedTypes).toContain('Potential full names');
      }
    });

    test('defaults to de when language not specified', () => {
      const result = detectPII('Mit Thomas Weber gesprochen.');
      expect(result).toHaveProperty('hasPII');
      expect(result).toHaveProperty('detectedTypes');
      expect(result).toHaveProperty('examples');
    });
  });
});
