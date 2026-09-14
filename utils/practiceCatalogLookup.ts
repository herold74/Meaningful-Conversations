import type { PracticeCatalog } from '../types';

export function findPracticeScenarioConcern(
  catalog: PracticeCatalog | null | undefined,
  scenarioId: string,
): string | null {
  if (!catalog || !scenarioId) return null;
  const sc =
    catalog.scenarios.find((s) => s.id === scenarioId) ??
    catalog.contractingScenarios.find((s) => s.id === scenarioId);
  return sc?.concern ?? null;
}
