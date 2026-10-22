import type {
  ConnectorDimensionKey,
  ConnectorEvaluationResult,
  ConnectorLocaleBundle,
} from '../types';
import type { ProfileContentLanguage } from './profileContentLanguage';
import { inferLanguageFromText } from './profileContentLanguage';

const DIMENSIONS: ConnectorDimensionKey[] = [
  'empathy',
  'presence',
  'curiosity',
  'nonJudgment',
  'steadiness',
];

export type ConnectorTranslatableTexts = Omit<ConnectorLocaleBundle, 'sourceCompletedAt'>;

export function extractTranslatableTexts(
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

function applyTextsToFlat(
  connector: ConnectorEvaluationResult,
  texts: ConnectorTranslatableTexts,
): ConnectorEvaluationResult {
  const next = {
    ...connector,
    summary: texts.summary,
    strengths: texts.strengths,
    growthAreas: texts.growthAreas,
    perVignette: texts.perVignette.map((row, i) => ({
      vignetteId: row.vignetteId || connector.perVignette?.[i]?.vignetteId || '',
      highlight: row.highlight,
      missedCue: row.missedCue,
    })),
  };
  for (const dim of DIMENSIONS) {
    const score = connector[dim]?.score ?? 1;
    next[dim] = { score, evidence: texts[dim]?.evidence || [] };
  }
  return next;
}

export function inferPrimaryLocale(connector: ConnectorEvaluationResult): ProfileContentLanguage {
  if (connector.primaryLocale === 'de' || connector.primaryLocale === 'en') {
    return connector.primaryLocale;
  }
  if (connector.contentLanguage === 'de' || connector.contentLanguage === 'en') {
    return connector.contentLanguage;
  }
  const inferred = inferLanguageFromText(
    [connector.summary, ...(connector.strengths || []).slice(0, 2)].join(' '),
  );
  return inferred || 'de';
}

/** Backfill `locales` / `primaryLocale` from legacy flat blobs. */
export function normalizeConnectorLocales(
  connector: ConnectorEvaluationResult,
): ConnectorEvaluationResult {
  const primaryLocale = inferPrimaryLocale(connector);
  const locales = { ...(connector.locales || {}) };

  if (!locales[primaryLocale]?.summary?.trim()) {
    locales[primaryLocale] = { ...extractTranslatableTexts(connector) };
  }

  return {
    ...connector,
    primaryLocale,
    contentLanguage: primaryLocale,
    locales,
  };
}

export function isDerivedLocaleFresh(
  bundle: ConnectorLocaleBundle | undefined,
  completedAt: string,
): boolean {
  if (!bundle?.summary?.trim()) return false;
  return bundle.sourceCompletedAt === completedAt;
}

export function needsConnectorLocaleTranslation(
  connector: ConnectorEvaluationResult | undefined | null,
  uiLanguage: ProfileContentLanguage,
): boolean {
  if (!connector?.summary?.trim() && !connector?.locales?.de?.summary && !connector?.locales?.en?.summary) {
    return false;
  }
  const normalized = normalizeConnectorLocales(connector);
  const primary = normalized.primaryLocale || 'de';
  if (uiLanguage === primary) return false;
  const derived = normalized.locales?.[uiLanguage];
  return !isDerivedLocaleFresh(derived, normalized.completedAt);
}

export function getPrimaryLocaleTexts(
  connector: ConnectorEvaluationResult,
): ConnectorTranslatableTexts {
  const normalized = normalizeConnectorLocales(connector);
  const primary = normalized.primaryLocale || 'de';
  const fromLocales = normalized.locales?.[primary];
  if (fromLocales?.summary?.trim()) {
    const { sourceCompletedAt: _, ...texts } = fromLocales;
    return texts;
  }
  return extractTranslatableTexts(normalized);
}

/** Texts for UI/PDF in `uiLanguage` (primary or valid derived cache). */
export function resolveConnectorForDisplay(
  connector: ConnectorEvaluationResult,
  uiLanguage: ProfileContentLanguage,
): ConnectorEvaluationResult {
  const normalized = normalizeConnectorLocales(connector);
  const primary = normalized.primaryLocale || 'de';
  let texts: ConnectorTranslatableTexts;
  if (uiLanguage === primary) {
    texts = getPrimaryLocaleTexts(normalized);
  } else {
    const derived = normalized.locales?.[uiLanguage];
    if (isDerivedLocaleFresh(derived, normalized.completedAt) && derived) {
      const { sourceCompletedAt: _, ...rest } = derived;
      texts = rest;
    } else {
      texts = getPrimaryLocaleTexts(normalized);
    }
  }
  return applyTextsToFlat(normalized, texts);
}

/** New assessment or profile save: canonical primary locale only; drop stale derived copy. */
export function sealConnectorForProfile(
  evaluation: ConnectorEvaluationResult,
  primaryLocale: ProfileContentLanguage,
): ConnectorEvaluationResult {
  const texts = extractTranslatableTexts(evaluation);
  const locales: Partial<Record<'de' | 'en', ConnectorLocaleBundle>> = {
    [primaryLocale]: { ...texts },
  };
  const base = applyTextsToFlat(evaluation, texts);
  return {
    ...base,
    primaryLocale,
    contentLanguage: primaryLocale,
    locales,
  };
}

export function mergeDerivedLocale(
  connector: ConnectorEvaluationResult,
  uiLanguage: ProfileContentLanguage,
  translated: ConnectorTranslatableTexts,
): ConnectorEvaluationResult {
  const normalized = normalizeConnectorLocales(connector);
  const derived: ConnectorLocaleBundle = {
    ...translated,
    sourceCompletedAt: normalized.completedAt,
  };
  return {
    ...normalized,
    locales: {
      ...normalized.locales,
      [uiLanguage]: derived,
    },
  };
}

/** @deprecated use pickConnectorTranslatableTexts → getPrimaryLocaleTexts */
export function pickConnectorTranslatableTexts(
  connector: ConnectorEvaluationResult,
): ConnectorTranslatableTexts {
  return getPrimaryLocaleTexts(connector);
}

/** @deprecated use mergeDerivedLocale */
export function mergeConnectorTranslation(
  connector: ConnectorEvaluationResult,
  translated: ConnectorTranslatableTexts,
  targetLanguage: ProfileContentLanguage,
): ConnectorEvaluationResult {
  return mergeDerivedLocale(connector, targetLanguage, translated);
}

export function resolveConnectorContentLanguage(
  uiLanguage: ProfileContentLanguage,
  connector?: ConnectorEvaluationResult | null,
): ProfileContentLanguage {
  if (!connector) return uiLanguage;
  return inferPrimaryLocale(normalizeConnectorLocales(connector));
}

export function isConnectorLanguageMismatch(
  connector: ConnectorEvaluationResult | undefined | null,
  uiLanguage: ProfileContentLanguage,
): boolean {
  return needsConnectorLocaleTranslation(connector, uiLanguage);
}

export function resolveConnectorSourceLanguage(
  connector: ConnectorEvaluationResult,
  targetLanguage: ProfileContentLanguage,
): ProfileContentLanguage {
  return inferPrimaryLocale(connector);
}
