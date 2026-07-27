/**
 * @jest-environment node
 */
const {
  getMatchTier,
  getDefaultPair,
  enrichCatalog,
  sortByMatchTier,
  TIER_RANK,
} = require('../methodScenarioMap.js');

describe('methodScenarioMap', () => {
  test('defaultPair exists and is a primary match', () => {
    const pair = getDefaultPair();
    expect(pair).toEqual({ frameworkId: 'grow', scenarioId: 'career-decision' });
    expect(getMatchTier(pair.scenarioId, pair.frameworkId)).toBe('primary');
  });

  test('known discouraged pairs return discouraged', () => {
    expect(getMatchTier('career-decision', 'client-exact-language')).toBe('discouraged');
    expect(getMatchTier('stuck-metaphor', 'strategic')).toBe('discouraged');
    expect(getMatchTier('feedback-anxiety', 'ambitious')).toBe('discouraged');
  });

  test('client-exact-language + stuck-metaphor is primary', () => {
    expect(getMatchTier('stuck-metaphor', 'client-exact-language')).toBe('primary');
  });

  test('enrichCatalog adds match maps and defaultPair', () => {
    const frameworks = [{ id: 'grow', name: 'GROW' }, { id: 'client-exact-language', name: 'client exact language' }];
    const scenarios = [{ id: 'career-decision', concern: 'Career' }, { id: 'stuck-metaphor', concern: 'Fog' }];
    const enriched = enrichCatalog(frameworks, scenarios, 'en');

    expect(enriched.defaultPair).toEqual({ frameworkId: 'grow', scenarioId: 'career-decision' });
    expect(enriched.scenarios[0].frameworkMatches.grow).toBe('primary');
    expect(enriched.scenarios[0].frameworkMatches['client-exact-language']).toBe('discouraged');
    expect(enriched.scenarios[1].frameworkMatches['client-exact-language']).toBe('primary');
    expect(enriched.frameworks[0].scenarioMatches['career-decision']).toBe('primary');
    expect(enriched.scenarios[0].discouragedReasons['client-exact-language']).toBeTruthy();
  });

  test('sortByMatchTier orders primary before discouraged', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const sorted = sortByMatchTier(items, (item) => {
      if (item.id === 'a') return 'discouraged';
      if (item.id === 'b') return 'primary';
      return 'neutral';
    });
    expect(sorted.map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });

  test('TIER_RANK defines sort order', () => {
    expect(TIER_RANK.primary).toBeLessThan(TIER_RANK.discouraged);
  });
});
