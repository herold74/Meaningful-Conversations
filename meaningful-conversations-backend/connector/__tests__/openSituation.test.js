const {
  MAX_RELATIONSHIP_CHARS,
  MAX_SITUATION_CHARS,
  MAX_PERSONA_NAME_CHARS,
  OPEN_LENGTH_PRESETS,
} = require('../connectorLimits');
const {
  validateOpenSituationInput,
  sanitizeCompiledVignette,
  publicPayloadFromCompiled,
} = require('../scenarioCompiler');
const { sanitizeQualitativeEvaluation, qualitativeEvaluationSchema } = require('../qualitativeEvaluationPrompts');
const { putCustomScenario, getCustomScenario, __clearCustomScenarioStoreForTests } = require('../customScenarioStore');

describe('open situation limits', () => {
  test('rejects overlong relationship and situation', () => {
    const validation = validateOpenSituationInput({
      relationship: 'x'.repeat(MAX_RELATIONSHIP_CHARS + 1),
      situation: 'y'.repeat(MAX_SITUATION_CHARS + 1),
      lengthPreset: 'standard',
      personaName: 'Alex',
      personaGender: 'female',
    });
    expect(validation.ok).toBe(false);
    expect(validation.errors.length).toBeGreaterThanOrEqual(2);
  });

  test('rejects missing persona name and invalid gender', () => {
    expect(validateOpenSituationInput({
      relationship: 'Kollege',
      situation: 'Ok.',
      lengthPreset: 'standard',
      personaName: '',
      personaGender: 'female',
    }).ok).toBe(false);
    expect(validateOpenSituationInput({
      relationship: 'Kollege',
      situation: 'Ok.',
      lengthPreset: 'standard',
      personaName: 'x'.repeat(MAX_PERSONA_NAME_CHARS + 1),
      personaGender: 'female',
    }).ok).toBe(false);
    expect(validateOpenSituationInput({
      relationship: 'Kollege',
      situation: 'Ok.',
      lengthPreset: 'standard',
      personaName: 'Alex',
      personaGender: 'other',
    }).ok).toBe(false);
  });

  test('accepts valid input and maps length presets', () => {
    const validation = validateOpenSituationInput({
      relationship: 'Kollege',
      situation: 'Wir hatten ein schwieriges Meeting.',
      lengthPreset: 'long',
      personaName: 'Jonas',
      personaGender: 'male',
    });
    expect(validation.ok).toBe(true);
    expect(OPEN_LENGTH_PRESETS.long.maxUserTurns).toBe(12);
  });
});

describe('compiled vignette public payload', () => {
  test('does not expose trap or innerNeed', () => {
    const internal = sanitizeCompiledVignette({
      personaName: 'Alex',
      gender: 'female',
      relationshipBucket: 'colleague',
      scenarioBrief: 'Du kennst die Situation aus dem Meeting.',
      situation: 'Hidden situation',
      emotionalTone: 'wütend',
      innerNeed: 'Gehört werden',
      opening: 'Hi…',
      exitLine: 'Muss los.',
      trap: 'Sofort beraten',
      goodConnection: 'Zuhören',
    }, {
      relationship: 'Kollege',
      language: 'de',
      personaName: 'Alex',
      personaGender: 'female',
    });
    expect(internal.personaName).toBe('Alex');
    expect(internal.gender).toBe('female');

    const pub = publicPayloadFromCompiled({ ...internal, id: 'custom-abc' }, 'de');
    expect(pub.scenarioBrief).toBeTruthy();
    expect(pub.opening).toBe('Hi…');
    expect(pub).not.toHaveProperty('trap');
    expect(pub).not.toHaveProperty('innerNeed');
    expect(pub).not.toHaveProperty('situation');
  });
});

describe('qualitative evaluation schema', () => {
  test('sanitize keeps only valid development field keys', () => {
    const out = sanitizeQualitativeEvaluation({
      summary: ' Gut ',
      strengths: [' A ', 2],
      missedOpportunities: [' B '],
      developmentFieldsTouched: ['empathy', 'bogus', 'presence'],
    });
    expect(out.summary).toBe('Gut');
    expect(out.strengths).toEqual(['A']);
    expect(out.developmentFieldsTouched).toEqual(['empathy', 'presence']);
  });

  test('schema requires core qualitative fields', () => {
    expect(qualitativeEvaluationSchema.required).toEqual(
      expect.arrayContaining(['strengths', 'missedOpportunities', 'developmentFieldsTouched']),
    );
    expect(qualitativeEvaluationSchema.properties).not.toHaveProperty('overallScore');
  });
});

describe('custom scenario store', () => {
  afterEach(() => {
    __clearCustomScenarioStoreForTests();
  });

  test('stores TTL session scoped to user', () => {
    const id = putCustomScenario({
      userId: 'u1',
      vignette: { personaName: 'Alex' },
      maxUserTurns: 8,
      lengthPreset: 'standard',
      relationshipBucket: 'friend',
    });
    expect(getCustomScenario(id, 'u1')).toBeTruthy();
    expect(getCustomScenario(id, 'u2')).toBeNull();
  });
});
