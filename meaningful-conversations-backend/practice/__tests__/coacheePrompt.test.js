const { buildCoacheeSystemPrompt } = require('../coacheePrompt');

describe('buildCoacheeSystemPrompt — mental fitness', () => {
  test('includes PQ-trained client block for mental-fitness-coaching', () => {
    const prompt = buildCoacheeSystemPrompt({
      frameworkId: 'mental-fitness-coaching',
      scenarioId: 'motivation-dip',
      difficulty: 'moderate',
      language: 'de',
    });
    expect(prompt).toContain('TRAINIERTER KLIENT');
    expect(prompt).toContain('Hyper-Erreger');
    expect(prompt).toContain('PQ-Reps');
    expect(prompt).toContain('Fingerspitzen-Reiben');
    expect(prompt).toContain('PFLICHT, KEIN SPIELRAUM');
    expect(prompt).toContain('kennst die Begriffe');
  });

  test('legacy mental-fitness alias resolves to PQ-trained block', () => {
    const prompt = buildCoacheeSystemPrompt({
      frameworkId: 'mental-fitness',
      scenarioId: 'motivation-dip',
      difficulty: 'easy',
      language: 'en',
    });
    expect(prompt).toContain('TRAINED CLIENT');
    expect(prompt).toContain('Hyper-Achiever');
    expect(prompt).toContain('PQ reps');
  });

  test('forward-focused coaching does not include PQ block', () => {
    const prompt = buildCoacheeSystemPrompt({
      frameworkId: 'forward-focused-coaching',
      scenarioId: 'motivation-dip',
      difficulty: 'moderate',
      language: 'de',
    });
    expect(prompt).not.toContain('TRAINIERTER KLIENT');
    expect(prompt).not.toContain('PQ-Reps');
  });
});
