import type { PracticeCatalog, PracticeFramework } from '../types';

export const PRACTICE_SENTINEL_FRAMEWORK_IDS = ['contracting', 'free-play'] as const;

const SENTINEL_LABEL_KEYS: Record<string, string> = {
  contracting: 'practice_framework_contracting',
  'free-play': 'practice_free_play_title',
};

/** Legacy frameworkId → canonical (mirrors backend methodTaxonomy.js). */
const LEGACY_FRAMEWORK_ALIASES: Record<string, string> = {
  gps: 'goal-path-solution',
  grow: 'four-stage-coaching',
  stoic: 'resilience-coaching',
  cbt: 'structured-reflection',
  bowen: 'systemic-coaching',
  'solution-focused': 'forward-focused-coaching',
  sfb: 'forward-focused-coaching',
  'motivational-interviewing': 'ambivalence-coaching',
  mi: 'ambivalence-coaching',
  'clean-language': 'client-exact-language',
  'mental-fitness': 'mental-fitness-coaching',
};

/** Fallback labels when catalog is unavailable (mirrors backend methodScenarioMap.js). */
const FRAMEWORK_LABELS: Record<string, { en: string; de: string }> = {
  'goal-path-solution': { en: 'Goal–Path–Solution', de: 'Goal–Path–Solution' },
  'ambitious-coaching': { en: 'Ambitious coaching', de: 'Ambitioniertes Coaching' },
  'strategic-coaching': { en: 'Strategic coaching', de: 'Strategisches Coaching' },
  'resilience-coaching': { en: 'Resilience coaching', de: 'Resilienz-Coaching' },
  'structured-reflection': { en: 'Structured reflection', de: 'Strukturierte Reflexion' },
  'mental-fitness-coaching': { en: 'Mental fitness', de: 'Mental Fitness' },
  'systemic-coaching': { en: 'Systemic coaching', de: 'Systemisches Coaching' },
  'thought-audit': { en: 'Thought audit', de: 'Gedanken-Audit' },
  'client-exact-language': { en: 'Client exact language', de: 'Exakte Klientensprache' },
  'four-stage-coaching': { en: 'Four-stage coaching', de: 'Vier-Phasen-Coaching' },
  'forward-focused-coaching': { en: 'Forward-focused coaching', de: 'Zukunftsorientiertes Coaching' },
  'ambivalence-coaching': { en: 'Ambivalence coaching', de: 'Ambivalenz-Coaching' },
  contracting: { en: 'Concern clarification', de: 'Anliegensklärung' },
  'free-play': { en: 'Free play', de: 'Freispiel' },
};

export function resolvePracticeFrameworkId(frameworkId: string): string {
  return LEGACY_FRAMEWORK_ALIASES[frameworkId] ?? frameworkId;
}

type GetFrameworkDisplayNameOptions = {
  catalog?: PracticeCatalog | null;
  frameworks?: PracticeFramework[];
  t?: (key: string) => string;
  language?: 'en' | 'de';
};

export function getFrameworkDisplayName(
  frameworkId: string,
  options: GetFrameworkDisplayNameOptions = {},
): string {
  const canonicalId = resolvePracticeFrameworkId(frameworkId);
  const { catalog, t, language = 'en' } = options;
  const frameworks = options.frameworks ?? catalog?.frameworks;

  const fromCatalog = frameworks?.find((f) => f.id === canonicalId);
  if (fromCatalog?.name) return fromCatalog.name;

  const sentinelKey = SENTINEL_LABEL_KEYS[canonicalId];
  if (sentinelKey && t) return t(sentinelKey);

  const staticLabel = FRAMEWORK_LABELS[canonicalId]?.[language];
  if (staticLabel) return staticLabel;

  return formatFrameworkSlug(canonicalId);
}

function formatFrameworkSlug(id: string): string {
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
