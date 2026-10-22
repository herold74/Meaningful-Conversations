import type { ConnectorDimensionKey, ConnectorEvaluationResult } from '../types';
import type { ProfileContentLanguage } from './profileContentLanguage';
import { inferLanguageFromText } from './profileContentLanguage';

const DIMENSIONS: ConnectorDimensionKey[] = [
  'empathy',
  'presence',
  'curiosity',
  'nonJudgment',
  'steadiness',
];

export type ConnectorTranslatableTexts = {
  summary: string;
  strengths: string[];
  growthAreas: string[];
  empathy: { evidence: string[] };
  presence: { evidence: string[] };
  curiosity: { evidence: string[] };
  nonJudgment: { evidence: string[] };
  steadiness: { evidence: string[] };
  perVignette: { vignetteId: string; highlight: string; missedCue: string }[];
};

export function resolveConnectorContentLanguage(
  uiLanguage: ProfileContentLanguage,
  connector?: ConnectorEvaluationResult | null,
): ProfileContentLanguage {
  const stored = connector?.contentLanguage;
  if (stored === 'de' || stored === 'en') return stored;

  const sample = [
    connector?.summary || '',
    ...(connector?.strengths || []).slice(0, 2),
    ...(connector?.growthAreas || []).slice(0, 1),
  ].join(' ');
  const inferred = inferLanguageFromText(sample);
  if (inferred) return inferred;

  return uiLanguage;
}

export function isConnectorLanguageMismatch(
  connector: ConnectorEvaluationResult | undefined | null,
  uiLanguage: ProfileContentLanguage,
): boolean {
  if (!connector?.summary?.trim()) return false;
  return resolveConnectorContentLanguage(uiLanguage, connector) !== uiLanguage;
}

export function resolveConnectorSourceLanguage(
  connector: ConnectorEvaluationResult,
  targetLanguage: ProfileContentLanguage,
): ProfileContentLanguage {
  if (connector.contentLanguage === 'de' || connector.contentLanguage === 'en') {
    return connector.contentLanguage;
  }
  const inferred = inferLanguageFromText(
    [connector.summary, ...(connector.strengths || []).slice(0, 2)].join(' '),
  );
  if (inferred) return inferred;
  return targetLanguage === 'de' ? 'en' : 'de';
}

export function pickConnectorTranslatableTexts(
  connector: ConnectorEvaluationResult,
): ConnectorTranslatableTexts {
  const perVignette = (connector.perVignette || []).map((row) => ({
    vignetteId: row.vignetteId,
    highlight: row.highlight || '',
    missedCue: row.missedCue || '',
  }));
  const dimensions = DIMENSIONS.reduce(
    (acc, dim) => {
      acc[dim] = { evidence: [...(connector[dim]?.evidence || [])] };
      return acc;
    },
    {} as Pick<
      ConnectorTranslatableTexts,
      'empathy' | 'presence' | 'curiosity' | 'nonJudgment' | 'steadiness'
    >,
  );
  return {
    summary: connector.summary || '',
    strengths: [...(connector.strengths || [])],
    growthAreas: [...(connector.growthAreas || [])],
    ...dimensions,
    perVignette,
  };
}

export function mergeConnectorTranslation(
  connector: ConnectorEvaluationResult,
  translated: ConnectorTranslatableTexts,
  targetLanguage: ProfileContentLanguage,
): ConnectorEvaluationResult {
  const next: ConnectorEvaluationResult = {
    ...connector,
    summary: translated.summary,
    strengths: translated.strengths,
    growthAreas: translated.growthAreas,
    perVignette: translated.perVignette.map((row, i) => ({
      vignetteId: row.vignetteId || connector.perVignette?.[i]?.vignetteId || '',
      highlight: row.highlight,
      missedCue: row.missedCue,
    })),
    contentLanguage: targetLanguage,
  };
  for (const dim of DIMENSIONS) {
    const score = connector[dim]?.score ?? 1;
    next[dim] = {
      score,
      evidence: translated[dim]?.evidence || [],
    };
  }
  return next;
}
