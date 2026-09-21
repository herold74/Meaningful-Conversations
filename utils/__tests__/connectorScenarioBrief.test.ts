import { firstSentenceOfScenarioBrief } from '../connectorScenarioBrief';

describe('firstSentenceOfScenarioBrief', () => {
  it('returns first sentence ending with period', () => {
    const brief =
      'Nina ist deine Mitarbeiterin. Morgen habt ihr euer Jahresgespräch. Sie kommt kurz zu dir an den Schreibtisch.';
    expect(firstSentenceOfScenarioBrief(brief)).toBe('Nina ist deine Mitarbeiterin.');
  });

  it('returns full string when no sentence end', () => {
    expect(firstSentenceOfScenarioBrief('Kurzer Kontext')).toBe('Kurzer Kontext');
  });

  it('handles empty input', () => {
    expect(firstSentenceOfScenarioBrief('')).toBe('');
    expect(firstSentenceOfScenarioBrief('   ')).toBe('');
  });
});
