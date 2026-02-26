/**
 * Tests for gamification serializer utility
 */

import { serializeGamificationState, deserializeGamificationState } from '../gamificationSerializer';
import type { GamificationState } from '../types';

describe('gamificationSerializer', () => {
  describe('serializeGamificationState', () => {
    test('converts Sets to arrays in output', () => {
      const state: GamificationState = {
        xp: 100,
        level: 2,
        streak: 5,
        longestStreak: 10,
        totalSessions: 15,
        lastSessionDate: '2025-01-15',
        unlockedAchievements: new Set(['first_chat', 'streak_3']),
        coachesUsed: new Set(['nobody', 'rob']),
      };
      const serialized = serializeGamificationState(state);
      const parsed = JSON.parse(serialized);
      expect(Array.isArray(parsed.unlockedAchievements)).toBe(true);
      expect(Array.isArray(parsed.coachesUsed)).toBe(true);
      expect(parsed.unlockedAchievements).toContain('first_chat');
      expect(parsed.unlockedAchievements).toContain('streak_3');
      expect(parsed.coachesUsed).toContain('nobody');
      expect(parsed.coachesUsed).toContain('rob');
    });

    test('preserves numbers correctly', () => {
      const state: GamificationState = {
        xp: 500,
        level: 3,
        streak: 0,
        longestStreak: 25,
        totalSessions: 42,
        lastSessionDate: null,
        unlockedAchievements: new Set(),
        coachesUsed: new Set(),
      };
      const serialized = serializeGamificationState(state);
      const parsed = JSON.parse(serialized);
      expect(parsed.xp).toBe(500);
      expect(parsed.level).toBe(3);
      expect(parsed.streak).toBe(0);
      expect(parsed.longestStreak).toBe(25);
      expect(parsed.totalSessions).toBe(42);
      expect(parsed.lastSessionDate).toBeNull();
    });

    test('handles empty Sets', () => {
      const state: GamificationState = {
        xp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        totalSessions: 0,
        lastSessionDate: null,
        unlockedAchievements: new Set(),
        coachesUsed: new Set(),
      };
      const serialized = serializeGamificationState(state);
      const parsed = JSON.parse(serialized);
      expect(parsed.unlockedAchievements).toEqual([]);
      expect(parsed.coachesUsed).toEqual([]);
    });
  });

  describe('deserializeGamificationState', () => {
    test('reconstructs Sets from arrays', () => {
      const data = JSON.stringify({
        xp: 50,
        level: 1,
        streak: 2,
        longestStreak: 2,
        totalSessions: 5,
        lastSessionDate: null,
        unlockedAchievements: ['achievement_a'],
        coachesUsed: ['coach_x', 'coach_y'],
      });
      const result = deserializeGamificationState(data);
      expect(result.unlockedAchievements).toBeInstanceOf(Set);
      expect(result.coachesUsed).toBeInstanceOf(Set);
      expect(result.unlockedAchievements.has('achievement_a')).toBe(true);
      expect(result.coachesUsed.has('coach_x')).toBe(true);
      expect(result.coachesUsed.has('coach_y')).toBe(true);
    });

    test('returns default state for null input', () => {
      const result = deserializeGamificationState(null as unknown as string);
      expect(result.xp).toBe(0);
      expect(result.level).toBe(1);
      expect(result.streak).toBe(0);
      expect(result.unlockedAchievements).toBeInstanceOf(Set);
      expect(result.unlockedAchievements.size).toBe(0);
    });

    test('returns default state for undefined input', () => {
      const result = deserializeGamificationState(undefined as unknown as string);
      expect(result.xp).toBe(0);
      expect(result.level).toBe(1);
    });

    test('returns default state for empty string', () => {
      const result = deserializeGamificationState('');
      expect(result.xp).toBe(0);
      expect(result.level).toBe(1);
    });

    test('returns default state for "{}"', () => {
      const result = deserializeGamificationState('{}');
      expect(result.xp).toBe(0);
      expect(result.level).toBe(1);
    });

    test('returns default state for "null"', () => {
      const result = deserializeGamificationState('null');
      expect(result.xp).toBe(0);
      expect(result.level).toBe(1);
    });

    test('returns default state for invalid JSON', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = deserializeGamificationState('not valid json');
      expect(result.xp).toBe(0);
      expect(result.level).toBe(1);
      consoleSpy.mockRestore();
    });

    test('returns default state when parsed object lacks core properties', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = deserializeGamificationState('{"unlockedAchievements":[]}');
      expect(result.xp).toBe(0);
      expect(result.level).toBe(1);
      consoleSpy.mockRestore();
    });

    test('roundtrip: serialize then deserialize preserves state', () => {
      const original: GamificationState = {
        xp: 200,
        level: 2,
        streak: 7,
        longestStreak: 12,
        totalSessions: 20,
        lastSessionDate: '2025-02-01',
        unlockedAchievements: new Set(['a', 'b']),
        coachesUsed: new Set(['nobody']),
      };
      const serialized = serializeGamificationState(original);
      const deserialized = deserializeGamificationState(serialized);
      expect(deserialized.xp).toBe(original.xp);
      expect(deserialized.level).toBe(original.level);
      expect(deserialized.streak).toBe(original.streak);
      expect(deserialized.longestStreak).toBe(original.longestStreak);
      expect(deserialized.totalSessions).toBe(original.totalSessions);
      expect(deserialized.lastSessionDate).toBe(original.lastSessionDate);
      expect([...deserialized.unlockedAchievements].sort()).toEqual(['a', 'b']);
      expect([...deserialized.coachesUsed]).toEqual(['nobody']);
    });
  });
});
