/** Matches backend practice/scopeBoundary.js — roll once at Hard session start. */

export type ScopeBoundaryTheme =
  | 'trauma'
  | 'addiction'
  | 'clinical-depression'
  | 'eating-disorder'
  | 'acute-distress';

const SCOPE_BOUNDARY_PROBABILITY = 0.33;

const SCENARIO_HINTS: Record<ScopeBoundaryTheme, string[]> = {
  trauma: ['motivation-dip', 'team-conflict', 'overwhelm', 'life-balance'],
  addiction: ['motivation-dip', 'life-balance', 'overwhelm', 'career-decision'],
  'clinical-depression': ['motivation-dip', 'life-balance', 'overwhelm'],
  'eating-disorder': ['overwhelm', 'relationship-boundary', 'motivation-dip'],
  'acute-distress': ['motivation-dip', 'overwhelm', 'life-balance'],
};

const THEME_IDS = Object.keys(SCENARIO_HINTS) as ScopeBoundaryTheme[];

export function rollScopeBoundaryTheme(scenarioId: string): ScopeBoundaryTheme | null {
  if (Math.random() >= SCOPE_BOUNDARY_PROBABILITY) return null;
  const preferred = THEME_IDS.filter((id) => SCENARIO_HINTS[id].includes(scenarioId));
  const pool = preferred.length > 0 ? preferred : THEME_IDS;
  return pool[Math.floor(Math.random() * pool.length)];
}
