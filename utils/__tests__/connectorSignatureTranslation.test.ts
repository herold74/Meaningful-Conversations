import { describe, expect, it } from 'vitest';
import type { ConnectorEvaluationResult } from '../../types';
import {
  isDerivedLocaleFresh,
  mergeDerivedLocale,
  needsConnectorLocaleTranslation,
  resolveConnectorForDisplay,
  sealConnectorForProfile,
} from '../connectorSignatureTranslation';

const baseConnector = (): ConnectorEvaluationResult => ({
  contentLanguage: 'de',
  primaryLocale: 'de',
  summary: 'Du bleibst ruhig und zugewandt.',
  empathy: { score: 8, evidence: ['Du hast die Emotion benannt.'] },
  presence: { score: 7, evidence: [] },
  curiosity: { score: 7, evidence: [] },
  nonJudgment: { score: 8, evidence: [] },
  steadiness: { score: 9, evidence: [] },
  strengths: ['Warme Grundhaltung'],
  growthAreas: ['Länger nachfragen'],
  perVignette: [{ vignetteId: 'a', highlight: 'Gut geblieben', missedCue: '' }],
  overallScore: 8,
  vignetteIds: ['a'],
  endTypes: ['heard'],
  completedAt: '2026-01-01T00:00:00.000Z',
});

describe('connectorSignatureTranslation', () => {
  it('seal keeps only primary locale (drops stale EN)', () => {
    const c = baseConnector();
    c.locales = {
      de: { ...c, summary: 'DE neu', strengths: [], growthAreas: [], perVignette: [], empathy: { evidence: [] }, presence: { evidence: [] }, curiosity: { evidence: [] }, nonJudgment: { evidence: [] }, steadiness: { evidence: [] } },
      en: {
        summary: 'Old EN',
        strengths: [],
        growthAreas: [],
        perVignette: [],
        empathy: { evidence: [] },
        presence: { evidence: [] },
        curiosity: { evidence: [] },
        nonJudgment: { evidence: [] },
        steadiness: { evidence: [] },
        sourceCompletedAt: '2025-01-01T00:00:00.000Z',
      },
    };
    const sealed = sealConnectorForProfile({ ...c, summary: 'DE neu' }, 'de');
    expect(sealed.locales?.de?.summary).toBe('DE neu');
    expect(sealed.locales?.en).toBeUndefined();
  });

  it('needs EN translation when derived locale missing or stale', () => {
    const c = sealConnectorForProfile(baseConnector(), 'de');
    expect(needsConnectorLocaleTranslation(c, 'en')).toBe(true);

    const withEn = mergeDerivedLocale(c, 'en', {
      summary: 'You stay calm.',
      strengths: ['Warm baseline'],
      growthAreas: ['Ask more'],
      perVignette: [{ vignetteId: 'a', highlight: 'Present', missedCue: '' }],
      empathy: { evidence: ['Named emotion.'] },
      presence: { evidence: [] },
      curiosity: { evidence: [] },
      nonJudgment: { evidence: [] },
      steadiness: { evidence: [] },
    });
    expect(needsConnectorLocaleTranslation(withEn, 'en')).toBe(false);
    expect(isDerivedLocaleFresh(withEn.locales?.en, withEn.completedAt)).toBe(true);

    const newRun = sealConnectorForProfile(
      { ...baseConnector(), summary: 'Neuer DE Text', completedAt: '2026-06-01T00:00:00.000Z' },
      'de',
    );
    expect(needsConnectorLocaleTranslation(newRun, 'en')).toBe(true);
  });

  it('resolveConnectorForDisplay uses cached EN without re-reading flat DE', () => {
    const c = sealConnectorForProfile(baseConnector(), 'de');
    const withEn = mergeDerivedLocale(c, 'en', {
      summary: 'You stay calm.',
      strengths: [],
      growthAreas: [],
      perVignette: [],
      empathy: { evidence: [] },
      presence: { evidence: [] },
      curiosity: { evidence: [] },
      nonJudgment: { evidence: [] },
      steadiness: { evidence: [] },
    });
    const enView = resolveConnectorForDisplay(withEn, 'en');
    expect(enView.summary).toBe('You stay calm.');
    expect(withEn.summary).toContain('Du bleibst');
  });
});
