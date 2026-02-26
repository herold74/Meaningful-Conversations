/**
 * Tests for voice utilities
 */

import { getVoiceGender, cleanVoiceName, selectVoice } from '../voiceUtils';
import type { Language } from '../types';

const createVoice = (name: string, lang: string = 'de-DE', localService = true, isDefault = false): SpeechSynthesisVoice =>
  ({ name, lang, localService, default: isDefault } as SpeechSynthesisVoice);

describe('voiceUtils', () => {
  describe('getVoiceGender', () => {
    test('returns male for male keyword in name', () => {
      expect(getVoiceGender(createVoice('German Male'))).toBe('male');
      expect(getVoiceGender(createVoice('Alex (Enhanced)'))).toBe('male');
    });

    test('returns female for female keyword in name', () => {
      expect(getVoiceGender(createVoice('German Female'))).toBe('female');
      expect(getVoiceGender(createVoice('Samantha'))).toBe('female');
    });

    test('returns unknown for excluded names', () => {
      expect(getVoiceGender(createVoice('Karen'))).toBe('unknown');
      expect(getVoiceGender(createVoice('Tessa'))).toBe('unknown');
      expect(getVoiceGender(createVoice('Moira'))).toBe('unknown');
    });

    test('returns male for male name parts', () => {
      expect(getVoiceGender(createVoice('Markus'))).toBe('male');
      expect(getVoiceGender(createVoice('Daniel Premium'))).toBe('male');
    });

    test('returns female for female name parts', () => {
      expect(getVoiceGender(createVoice('Anna'))).toBe('female');
      expect(getVoiceGender(createVoice('Petra Enhanced'))).toBe('female');
    });

    test('returns unknown when no match', () => {
      expect(getVoiceGender(createVoice('Unknown Voice XYZ'))).toBe('unknown');
    });
  });

  describe('cleanVoiceName', () => {
    test('preserves (enhanced) suffix', () => {
      const result = cleanVoiceName('Anna (Enhanced)');
      expect(result).toContain('(Enhanced)');
      expect(result).toContain('Anna');
    });

    test('preserves (premium) suffix', () => {
      const result = cleanVoiceName('Markus (Premium)');
      expect(result).toContain('(Premium)');
    });

    test('preserves (erweitert) suffix', () => {
      const result = cleanVoiceName('Petra (Erweitert)');
      expect(result).toMatch(/erweitert/i);
    });

    test('strips content after first parenthesis when no quality match', () => {
      const result = cleanVoiceName('Voice Name (Some Other Info)');
      expect(result.split('(')[0].trim()).toBe('Voice Name');
    });

    test('strips " - " suffix when no parenthesis', () => {
      const result = cleanVoiceName('Anna - German');
      expect(result).toContain('Anna');
    });
  });

  describe('selectVoice', () => {
    test('returns null for empty voices', () => {
      expect(selectVoice([], 'de', 'female')).toBeNull();
      expect(selectVoice([], 'en', 'male')).toBeNull();
    });

    test('selects whitelisted German female voice', () => {
      const voices = [
        createVoice('Random Voice', 'de-DE'),
        createVoice('Anna', 'de-DE'),
      ];
      const selected = selectVoice(voices, 'de' as Language, 'female');
      expect(selected).not.toBeNull();
      expect(selected!.name).toContain('Anna');
    });

    test('selects whitelisted German male voice', () => {
      const voices = [
        createVoice('Markus', 'de-DE'),
        createVoice('Anna', 'de-DE'),
      ];
      const selected = selectVoice(voices, 'de' as Language, 'male');
      expect(selected).not.toBeNull();
      expect(selected!.name).toContain('Markus');
    });

    test('selects whitelisted English female voice', () => {
      const voices = [
        createVoice('Samantha', 'en-US'),
        createVoice('Daniel', 'en-US'),
      ];
      const selected = selectVoice(voices, 'en' as Language, 'female');
      expect(selected).not.toBeNull();
      expect(selected!.name).toContain('Samantha');
    });

    test('selects whitelisted English male voice', () => {
      const voices = [
        createVoice('Daniel', 'en-US'),
        createVoice('Samantha', 'en-US'),
      ];
      const selected = selectVoice(voices, 'en' as Language, 'male');
      expect(selected).not.toBeNull();
      expect(selected!.name).toContain('Daniel');
    });

    test('filters by language prefix', () => {
      const voices = [
        createVoice('Anna', 'de-DE'),
        createVoice('Samantha', 'en-US'),
      ];
      const selected = selectVoice(voices, 'de' as Language, 'female');
      expect(selected).not.toBeNull();
      expect(selected!.lang.toLowerCase()).toMatch(/^de/);
    });

    test('prefers enhanced/premium voices', () => {
      const voices = [
        createVoice('Anna', 'de-DE', true, false),
        createVoice('Petra (Enhanced)', 'de-DE', false, false),
      ];
      const selected = selectVoice(voices, 'de' as Language, 'female');
      expect(selected).not.toBeNull();
      expect(selected!.name.toLowerCase()).toMatch(/enhanced|petra/);
    });

    test('returns null when no matching language', () => {
      const voices = [
        createVoice('Anna', 'de-DE'),
        createVoice('Samantha', 'en-US'),
      ];
      const selected = selectVoice(voices, 'fr' as Language, 'female');
      expect(selected).toBeNull();
    });
  });
});
