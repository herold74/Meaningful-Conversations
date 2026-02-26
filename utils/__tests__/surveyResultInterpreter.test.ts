/**
 * Tests for survey result interpreter
 */

import { interpretSurveyResults } from '../surveyResultInterpreter';
import type { SurveyResult } from '../../components/PersonalitySurvey';

describe('surveyResultInterpreter', () => {
  describe('interpretSurveyResults - RIEMANN path', () => {
    const riemannResult: SurveyResult = {
      path: 'RIEMANN',
      completedLenses: ['riemann'],
      adaptationMode: 'adaptive',
      riemann: {
        beruf: { distanz: 5, naehe: 8, dauer: 6, wechsel: 6 },
        privat: { distanz: 4, naehe: 7, dauer: 7, wechsel: 7 },
        selbst: { distanz: 5, naehe: 7, dauer: 6, wechsel: 7 },
        stressRanking: ['distanz', 'naehe', 'dauer', 'wechsel'],
      },
    };

    test('returns main drive section for RIEMANN', () => {
      const analysis = interpretSurveyResults(riemannResult, 'de');
      expect(analysis.length).toBeGreaterThan(0);
      const mainDrive = analysis.find((a) => a.title.includes('Haupt-Antrieb') || a.title.includes('Main Drive'));
      expect(mainDrive).toBeDefined();
      expect(mainDrive!.text).toBeTruthy();
      expect(mainDrive!.action).toBeTruthy();
    });

    test('returns blindspot section for RIEMANN', () => {
      const analysis = interpretSurveyResults(riemannResult, 'de');
      const blindspot = analysis.find((a) => a.title.includes('Blindspot'));
      expect(blindspot).toBeDefined();
    });

    test('returns danger zone section for RIEMANN', () => {
      const analysis = interpretSurveyResults(riemannResult, 'de');
      const dangerZone = analysis.find((a) => a.title.includes('Gefahrenzone') || a.title.includes('Danger Zone'));
      expect(dangerZone).toBeDefined();
    });

    test('returns German text when language is de', () => {
      const analysis = interpretSurveyResults(riemannResult, 'de');
      expect(analysis.some((a) => a.title.includes('Haupt-Antrieb'))).toBe(true);
      expect(analysis.some((a) => a.title.includes('Blindspot'))).toBe(true);
    });

    test('returns English text when language is en', () => {
      const analysis = interpretSurveyResults(riemannResult, 'en');
      expect(analysis.some((a) => a.title.includes('Main Drive'))).toBe(true);
      expect(analysis.some((a) => a.title.includes('Blindspot'))).toBe(true);
    });

    test('includes inconsistency when beruf vs privat diff >= 6', () => {
      const highDiffResult: SurveyResult = {
        ...riemannResult,
        riemann: {
          ...riemannResult.riemann!,
          beruf: { distanz: 15, naehe: 0, dauer: 0, wechsel: 0 },
          privat: { distanz: 5, naehe: 5, dauer: 5, wechsel: 5 },
          selbst: { distanz: 10, naehe: 5, dauer: 5, wechsel: 5 },
          stressRanking: ['distanz', 'naehe', 'dauer', 'wechsel'],
        },
      };
      const analysis = interpretSurveyResults(highDiffResult, 'de');
      const inconsistency = analysis.find((a) => a.title.includes('Inkonsistenz') || a.title.includes('Inconsistency'));
      expect(inconsistency).toBeDefined();
    });
  });

  describe('interpretSurveyResults - BIG5 path', () => {
    const big5Result: SurveyResult = {
      path: 'BIG5',
      completedLenses: ['ocean'],
      adaptationMode: 'adaptive',
      big5: {
        openness: 4,
        conscientiousness: 3,
        extraversion: 5,
        agreeableness: 2,
        neuroticism: 2,
      },
    };

    test('returns main resource for BIG5', () => {
      const analysis = interpretSurveyResults(big5Result, 'de');
      const mainResource = analysis.find((a) => a.title.includes('Hauptressource') || a.title.includes('Main Resource'));
      expect(mainResource).toBeDefined();
    });

    test('returns underdeveloped section for BIG5', () => {
      const analysis = interpretSurveyResults(big5Result, 'de');
      const underdeveloped = analysis.find((a) => a.title.includes('Unterentwickelt') || a.title.includes('Underdeveloped'));
      expect(underdeveloped).toBeDefined();
    });

    test('returns overdrive section when top trait is 5', () => {
      const analysis = interpretSurveyResults(big5Result, 'de');
      const overdrive = analysis.find((a) => a.title.includes('Übersteuerung') || a.title.includes('Overdrive'));
      expect(overdrive).toBeDefined();
    });

    test('returns English text for BIG5 when language is en', () => {
      const analysis = interpretSurveyResults(big5Result, 'en');
      expect(analysis.some((a) => a.title.includes('Main Resource'))).toBe(true);
    });
  });

  describe('interpretSurveyResults - error path', () => {
    test('returns error when path is RIEMANN but riemann is missing', () => {
      const invalidResult: SurveyResult = {
        path: 'RIEMANN',
        completedLenses: [],
        adaptationMode: 'adaptive',
      };
      const analysis = interpretSurveyResults(invalidResult, 'de');
      const error = analysis.find((a) => a.title.includes('Fehler') || a.title.includes('Error'));
      expect(error).toBeDefined();
      expect(error!.text).toMatch(/Keine gültigen|No valid/);
    });

    test('returns error when path is BIG5 but big5 is missing', () => {
      const invalidResult: SurveyResult = {
        path: 'BIG5',
        completedLenses: [],
        adaptationMode: 'adaptive',
      };
      const analysis = interpretSurveyResults(invalidResult, 'de');
      const error = analysis.find((a) => a.title.includes('Fehler') || a.title.includes('Error'));
      expect(error).toBeDefined();
    });

    test('defaults to de when language not specified', () => {
      const result: SurveyResult = {
        path: 'BIG5',
        completedLenses: ['ocean'],
        adaptationMode: 'adaptive',
        big5: { openness: 3, conscientiousness: 3, extraversion: 3, agreeableness: 3, neuroticism: 3 },
      };
      const analysis = interpretSurveyResults(result);
      expect(analysis.length).toBeGreaterThan(0);
    });
  });
});
