import { describe, expect, it } from 'vitest';
import type { ConnectorEvaluationResult } from '../../types';
import {
  isConnectorLanguageMismatch,
  mergeConnectorTranslation,
  resolveConnectorContentLanguage,
  resolveConnectorSourceLanguage,
} from '../connectorSignatureTranslation';

const baseConnector = (): ConnectorEvaluationResult => ({
  contentLanguage: 'de',
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
  it('detects mismatch when stored language differs from UI', () => {
    const c = baseConnector();
    expect(isConnectorLanguageMismatch(c, 'en')).toBe(true);
    expect(isConnectorLanguageMismatch(c, 'de')).toBe(false);
  });

  it('infers German when contentLanguage missing', () => {
    const c = { ...baseConnector(), contentLanguage: undefined };
    expect(resolveConnectorContentLanguage('en', c)).toBe('de');
  });

  it('merges translated texts and updates contentLanguage', () => {
    const c = baseConnector();
    const merged = mergeConnectorTranslation(
      c,
      {
        summary: 'You stay calm and engaged.',
        strengths: ['Warm baseline'],
        growthAreas: ['Ask follow-ups'],
        empathy: { evidence: ['You named the emotion.'] },
        presence: { evidence: [] },
        curiosity: { evidence: [] },
        nonJudgment: { evidence: [] },
        steadiness: { evidence: [] },
        perVignette: [{ vignetteId: 'a', highlight: 'Stayed present', missedCue: '' }],
      },
      'en',
    );
    expect(merged.contentLanguage).toBe('en');
    expect(merged.summary).toContain('You stay');
    expect(merged.empathy.score).toBe(8);
    expect(resolveConnectorSourceLanguage(c, 'en')).toBe('de');
  });
});
