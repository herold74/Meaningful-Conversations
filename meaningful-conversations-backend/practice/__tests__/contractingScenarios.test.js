const { getPublicContractingScenarios, CONTRACTING_SCENARIOS } = require('../contractingScenarios.js');
const { SCENARIOS, getScenarioById } = require('../scenarios.js');

describe('contractingScenarios', () => {
  test('has 12 blind contracting scenarios', () => {
    expect(CONTRACTING_SCENARIOS).toHaveLength(12);
  });

  test('public catalog hides concern text', () => {
    const pub = getPublicContractingScenarios('en');
    expect(pub[0].concern).toBeUndefined();
    expect(pub[0].coacheeName).toBeTruthy();
  });

  test('contracting topics differ from method scenario topics', () => {
    const methodConcerns = new Set(SCENARIOS.map((s) => s.concern.en));
    for (const cs of CONTRACTING_SCENARIOS) {
      expect(methodConcerns.has(cs.concern.en)).toBe(false);
    }
  });

  test('getScenarioById resolves contracting ids', () => {
    expect(getScenarioById('contract-return-work')?.id).toBe('contract-return-work');
  });
});
