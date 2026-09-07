const {
  buildConnectorPersonaPrompt,
  extractConnectorEnd,
  CONNECTOR_END_MARKER,
  MAX_USER_TURNS,
  MIN_TURNS_BEFORE_HEARD_CLOSE,
} = require('../personaPrompt');
const { CONNECTOR_VIGNETTES, getVignetteById, pickRunVignetteIds, VIGNETTES_PER_RUN } = require('../vignettes');

describe('connector vignette catalog', () => {
  test('has 8 vignettes with unique ids and full DE/EN parity', () => {
    expect(CONNECTOR_VIGNETTES).toHaveLength(8);
    const ids = CONNECTOR_VIGNETTES.map((v) => v.id);
    expect(new Set(ids).size).toBe(8);
    CONNECTOR_VIGNETTES.forEach((v) => {
      ['relationship', 'situation', 'emotionalTone', 'innerNeed', 'opening', 'exitLine', 'trap', 'goodConnection', 'pickerTeaser'].forEach((field) => {
        expect(v[field]).toBeDefined();
        expect(typeof v[field].de).toBe('string');
        expect(typeof v[field].en).toBe('string');
        expect(v[field].de.length).toBeGreaterThan(0);
        expect(v[field].en.length).toBeGreaterThan(0);
      });
      expect(['male', 'female']).toContain(v.gender);
      expect(Array.isArray(v.primaryDimensions)).toBe(true);
    });
  });

  test('pickRunVignetteIds returns distinct valid ids', () => {
    const ids = pickRunVignetteIds();
    expect(ids).toHaveLength(VIGNETTES_PER_RUN);
    expect(new Set(ids).size).toBe(VIGNETTES_PER_RUN);
    ids.forEach((id) => expect(getVignetteById(id)).not.toBeNull());
  });

  test('david vignette explicitly stays below crisis threshold', () => {
    const david = getVignetteById('david-exhaustion');
    expect(david.situation.de).toContain('NICHT in einer Krise');
    expect(david.situation.en).toContain('NOT in crisis');
  });
});

describe('buildConnectorPersonaPrompt — role guard', () => {
  test('German prompt includes ROLLEN-GUARD and no coach/therapist role', () => {
    const prompt = buildConnectorPersonaPrompt({ vignetteId: 'jonas-meeting', language: 'de', userTurnCount: 1 });
    expect(prompt).toContain('ROLLEN-GUARD');
    expect(prompt).toContain('KEIN Coach');
    expect(prompt).toContain('Jonas');
    expect(prompt).toContain('Bernhard');
  });

  test('English prompt includes ROLE GUARD', () => {
    const prompt = buildConnectorPersonaPrompt({ vignetteId: 'leila-breakup', language: 'en', userTurnCount: 1 });
    expect(prompt).toContain('ROLE GUARD');
    expect(prompt).toContain('NOT a coach');
    expect(prompt).toContain('Leila');
  });

  test('throws on unknown vignette', () => {
    expect(() => buildConnectorPersonaPrompt({ vignetteId: 'nope', language: 'de' })).toThrow('Unknown vignette');
  });
});

describe('buildConnectorPersonaPrompt — closing logic', () => {
  test('turns 1-2: no closing instructions', () => {
    [1, 2].forEach((turn) => {
      const prompt = buildConnectorPersonaPrompt({ vignetteId: 'tom-vancouver', language: 'de', userTurnCount: turn });
      expect(prompt).not.toContain(CONNECTOR_END_MARKER);
      expect(prompt).not.toContain('GESPRÄCHSENDE');
    });
  });

  test(`turn ${MIN_TURNS_BEFORE_HEARD_CLOSE}: optional heard-close with marker`, () => {
    const prompt = buildConnectorPersonaPrompt({ vignetteId: 'tom-vancouver', language: 'de', userTurnCount: MIN_TURNS_BEFORE_HEARD_CLOSE });
    expect(prompt).toContain('GESPRÄCHSENDE (OPTIONAL)');
    expect(prompt).toContain(CONNECTOR_END_MARKER);
  });

  test(`turn ${MAX_USER_TURNS}: forced everyday exit with vignette exit line`, () => {
    const promptDe = buildConnectorPersonaPrompt({ vignetteId: 'carmen-mia', language: 'de', userTurnCount: MAX_USER_TURNS });
    expect(promptDe).toContain('GESPRÄCHSENDE (JETZT)');
    expect(promptDe).toContain('Mias Schlüssel');
    const promptEn = buildConnectorPersonaPrompt({ vignetteId: 'carmen-mia', language: 'en', userTurnCount: MAX_USER_TURNS });
    expect(promptEn).toContain('CONVERSATION END (NOW)');
    expect(promptEn).toContain("Mia's key");
  });

  test('live mode adds speech modifier', () => {
    const prompt = buildConnectorPersonaPrompt({ vignetteId: 'david-exhaustion', language: 'de', userTurnCount: 1, liveMode: true });
    expect(prompt).toContain('SPRECHMODUS');
  });
});

describe('extractConnectorEnd', () => {
  test('detects and strips marker', () => {
    const { text, ended } = extractConnectorEnd(`Danke dir. Ich muss los. ${CONNECTOR_END_MARKER}`);
    expect(ended).toBe(true);
    expect(text).toBe('Danke dir. Ich muss los.');
  });

  test('no marker → not ended', () => {
    const { text, ended } = extractConnectorEnd('Ich weiß auch nicht weiter.');
    expect(ended).toBe(false);
    expect(text).toBe('Ich weiß auch nicht weiter.');
  });
});
