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

describe('buildCoacheeSystemPrompt — role guard', () => {
  test('German prompt includes ROLLEN-GUARD with forbidden coach techniques', () => {
    const prompt = buildCoacheeSystemPrompt({
      frameworkId: 'contracting',
      scenarioId: 'motivation-dip',
      difficulty: 'moderate',
      language: 'de',
      practiceMode: 'contracting',
    });
    expect(prompt).toContain('ROLLEN-GUARD');
    expect(prompt).toContain('Du sagst');
    expect(prompt).toContain('Danke für die Beschreibung');
    expect(prompt).toContain('Wenn du diesem Gefühl eine Farbe geben müsstest');
    expect(prompt).toContain('NEGATIV-BEISPIEL');
  });

  test('English prompt includes ROLE GUARD with forbidden coach techniques', () => {
    const prompt = buildCoacheeSystemPrompt({
      frameworkId: 'forward-focused-coaching',
      scenarioId: 'motivation-dip',
      difficulty: 'moderate',
      language: 'en',
    });
    expect(prompt).toContain('ROLE GUARD');
    expect(prompt).toContain('Thank you for sharing');
    expect(prompt).toContain('On a scale of 1 to 10');
    expect(prompt).toContain('NEGATIVE EXAMPLE');
  });

  test('rules reference role guard instead of legacy coaching-phrase rule', () => {
    const prompt = buildCoacheeSystemPrompt({
      frameworkId: 'contracting',
      scenarioId: 'motivation-dip',
      difficulty: 'moderate',
      language: 'de',
      practiceMode: 'contracting',
    });
    expect(prompt).toContain('Halte den ROLLEN-GUARD ein');
    expect(prompt).not.toContain('KEINE Coaching-Phrasen wie "Lass uns..."');
  });

  test('Finley contracting uses Klientin role label', () => {
    const prompt = buildCoacheeSystemPrompt({
      frameworkId: 'contracting',
      scenarioId: 'contract-teen-talk',
      difficulty: 'moderate',
      language: 'de',
      practiceMode: 'contracting',
    });
    expect(prompt).toContain('Finley');
    expect(prompt).toContain('Klientin');
    expect(prompt).not.toMatch(/ein Coachee \(Klient\)/);
  });
});

describe('buildCoacheeSystemPrompt — contracting & phase 2', () => {
  test('contracting mode uses vague first-turn rule and no method hint', () => {
    const prompt = buildCoacheeSystemPrompt({
      frameworkId: 'contracting',
      scenarioId: 'motivation-dip',
      difficulty: 'moderate',
      language: 'de',
      practiceMode: 'contracting',
    });
    expect(prompt).toContain('vage');
    expect(prompt).not.toContain('Der Coach übt die Methode');
  });

  test('contracting hard difficulty does not inject scope boundary block', () => {
    const prompt = buildCoacheeSystemPrompt({
      frameworkId: 'contracting',
      scenarioId: 'motivation-dip',
      difficulty: 'hard',
      language: 'de',
      practiceMode: 'contracting',
      scopeBoundaryTheme: 'trauma',
    });
    expect(prompt).not.toContain('GRENZFALL');
    expect(prompt).not.toContain('SCOPE');
  });

  test('phase 2 includes prior contracting context', () => {
    const prompt = buildCoacheeSystemPrompt({
      frameworkId: 'free-play',
      scenarioId: 'motivation-dip',
      difficulty: 'moderate',
      language: 'en',
      practiceMode: 'free-play',
      priorTranscript: 'Coach: Hello\nCoachee: Hi',
      clarifiedConcern: 'Need clarity on career move',
      sessionContract: 'Decide next step by end of session',
    });
    expect(prompt).toContain('PRIOR CONCERN CLARIFICATION');
    expect(prompt).toContain('Need clarity on career move');
    expect(prompt).toContain('Decide next step');
  });
});
