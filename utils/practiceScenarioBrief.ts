import type { CoachPracticeConfig, Language } from '../types';

export type PracticeScenarioBriefParts = {
  contentLanguage?: Language;
  clarifiedConcern?: string;
  scenarioNameFallback?: string;
};

/**
 * Coach-facing scenario brief for Practice UI (empty state, headers).
 * LLM/coachee payloads keep original artifacts (clarifiedConcern) unchanged.
 */
export function resolvePracticeScenarioBriefFromParts(
  uiLanguage: Language,
  catalogConcern?: string | null,
  parts: PracticeScenarioBriefParts = {},
): string {
  const contentLanguage = parts.contentLanguage ?? uiLanguage;
  const clarified = parts.clarifiedConcern?.trim();

  if (clarified && contentLanguage === uiLanguage) {
    return clarified;
  }

  const catalog = catalogConcern?.trim();
  if (catalog) return catalog;

  return parts.scenarioNameFallback?.trim() || '';
}

export function resolvePracticeScenarioBrief(
  config: CoachPracticeConfig,
  uiLanguage: Language,
  catalogConcern?: string | null,
): string {
  return resolvePracticeScenarioBriefFromParts(uiLanguage, catalogConcern, {
    contentLanguage: config.contentLanguage,
    clarifiedConcern: config.clarifiedConcern,
    scenarioNameFallback: config.scenarioName,
  });
}
