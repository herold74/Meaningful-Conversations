const {
  buildContractingFrameworkCatalog,
  normalizeMethodSuggestions,
} = require('../frameworks.js');

describe('buildContractingFrameworkCatalog', () => {
  test('uses German labels for de', () => {
    const catalog = buildContractingFrameworkCatalog('de');
    expect(catalog).toContain('ambivalence-coaching (Ambivalenz-Coaching)');
    expect(catalog).toContain('structured-reflection (Strukturierte Reflexion)');
    expect(catalog).not.toContain('Ambivalence coaching');
  });

  test('uses English labels for en', () => {
    const catalog = buildContractingFrameworkCatalog('en');
    expect(catalog).toContain('ambivalence-coaching (Ambivalence coaching)');
    expect(catalog).toContain('structured-reflection (Structured reflection)');
  });
});

describe('normalizeMethodSuggestions', () => {
  test('replaces LLM English names with localized catalog labels', () => {
    const input = [
      {
        frameworkId: 'ambivalence-coaching',
        frameworkName: 'Ambivalence coaching',
        rationale: 'Passt zur Ambivalenz.',
      },
      {
        frameworkId: 'structured-reflection',
        frameworkName: 'Structured reflection',
        rationale: 'Hilft bei Gedankenmustern.',
      },
    ];
    const out = normalizeMethodSuggestions(input, 'de');
    expect(out[0].frameworkName).toBe('Ambivalenz-Coaching');
    expect(out[1].frameworkName).toBe('Strukturierte Reflexion');
  });

  test('resolves legacy framework aliases', () => {
    const out = normalizeMethodSuggestions(
      [{ frameworkId: 'grow', frameworkName: 'GROW', rationale: 'Test' }],
      'de',
    );
    expect(out[0].frameworkId).toBe('four-stage-coaching');
    expect(out[0].frameworkName).toBe('Vier-Phasen-Coaching');
  });
});
