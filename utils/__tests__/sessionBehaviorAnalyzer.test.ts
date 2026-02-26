/**
 * Tests for session behavior analyzer
 */

import {
  analyzeSession,
  analyzeRiemann,
  analyzeBig5,
  analyzeSD,
} from '../sessionBehaviorAnalyzer';

type Message = { role: 'user' | 'assistant'; text: string };

describe('sessionBehaviorAnalyzer', () => {
  describe('analyzeSession', () => {
    test('returns riemann, big5, and sd results', () => {
      const messages: Message[] = [
        { role: 'user', text: 'Ich fühle mich verbunden mit dem Team.' },
        { role: 'assistant', text: 'Das klingt gut.' },
      ];
      const result = analyzeSession(messages);
      expect(result).toHaveProperty('riemann');
      expect(result).toHaveProperty('big5');
      expect(result).toHaveProperty('sd');
    });

    test('empty chat history returns zero deltas', () => {
      const result = analyzeSession([]);
      expect(Object.values(result.riemann).every((v) => v === 0)).toBe(true);
      expect(Object.values(result.big5).every((v) => v === 0)).toBe(true);
      expect(Object.values(result.sd).every((v) => v === 0)).toBe(true);
    });

    test('only user messages are analyzed', () => {
      const messages: Message[] = [
        { role: 'assistant', text: 'verbundenheit harmonie' },
        { role: 'user', text: 'Ich mag Autonomie.' },
      ];
      const result = analyzeSession(messages, 'de');
      expect(result.riemann.distanz).toBeGreaterThan(0);
    });
  });

  describe('analyzeRiemann', () => {
    test('detects naehe keywords in German', () => {
      const messages: Message[] = [
        { role: 'user', text: 'Ich brauche Verbundenheit und Harmonie im Team.' },
      ];
      const result = analyzeRiemann(messages, 'de');
      expect(result.naehe).toBeGreaterThan(0);
    });

    test('detects distanz keywords in German', () => {
      const messages: Message[] = [
        { role: 'user', text: 'Autonomie und Freiheit sind mir wichtig.' },
      ];
      const result = analyzeRiemann(messages, 'de');
      expect(result.distanz).toBeGreaterThan(0);
    });

    test('detects dauer keywords in German', () => {
      const messages: Message[] = [
        { role: 'user', text: 'Sicherheit, Stabilität und Planung.' },
      ];
      const result = analyzeRiemann(messages, 'de');
      expect(result.dauer).toBeGreaterThan(0);
    });

    test('detects wechsel keywords in German', () => {
      const messages: Message[] = [
        { role: 'user', text: 'Veränderung und Flexibilität.' },
      ];
      const result = analyzeRiemann(messages, 'de');
      expect(result.wechsel).toBeGreaterThan(0);
    });

    test('detects English keywords', () => {
      const messages: Message[] = [
        { role: 'user', text: 'I value connection and harmony.' },
      ];
      const result = analyzeRiemann(messages, 'en');
      expect(result.naehe).toBeGreaterThan(0);
    });

    test('empty messages return zero', () => {
      const result = analyzeRiemann([], 'de');
      expect(result.naehe).toBe(0);
      expect(result.distanz).toBe(0);
      expect(result.dauer).toBe(0);
      expect(result.wechsel).toBe(0);
    });
  });

  describe('analyzeBig5', () => {
    test('detects openness keywords in German', () => {
      const messages: Message[] = [
        { role: 'user', text: 'Ich bin kreativ und neugierig.' },
      ];
      const result = analyzeBig5(messages, 'de');
      expect(result.openness).toBeGreaterThan(0);
    });

    test('detects conscientiousness keywords in German', () => {
      const messages: Message[] = [
        { role: 'user', text: 'Ich bin organisiert und strukturiert.' },
      ];
      const result = analyzeBig5(messages, 'de');
      expect(result.conscientiousness).toBeGreaterThan(0);
    });

    test('detects extraversion keywords in German', () => {
      const messages: Message[] = [
        { role: 'user', text: 'Ich bin gesellig und energiegeladen.' },
      ];
      const result = analyzeBig5(messages, 'de');
      expect(result.extraversion).toBeGreaterThan(0);
    });

    test('detects English Big5 keywords', () => {
      const messages: Message[] = [
        { role: 'user', text: 'I am creative and curious.' },
      ];
      const result = analyzeBig5(messages, 'en');
      expect(result.openness).toBeGreaterThan(0);
    });
  });

  describe('analyzeSD', () => {
    test('detects Spiral Dynamics keywords in German', () => {
      const messages: Message[] = [
        { role: 'user', text: 'Ordnung, Regeln und Disziplin.' },
      ];
      const result = analyzeSD(messages, 'de');
      expect(result.blue).toBeGreaterThan(0);
    });

    test('detects orange keywords in German', () => {
      const messages: Message[] = [
        { role: 'user', text: 'Erfolg, Leistung und Innovation.' },
      ];
      const result = analyzeSD(messages, 'de');
      expect(result.orange).toBeGreaterThan(0);
    });

    test('detects English SD keywords', () => {
      const messages: Message[] = [
        { role: 'user', text: 'Order, rules, and discipline.' },
      ];
      const result = analyzeSD(messages, 'en');
      expect(result.blue).toBeGreaterThan(0);
    });

    test('empty messages return zero for all SD levels', () => {
      const result = analyzeSD([], 'de');
      const levels = ['beige', 'purple', 'red', 'blue', 'orange', 'green', 'yellow', 'turquoise'];
      levels.forEach((level) => {
        expect(result[level]).toBe(0);
      });
    });
  });
});
