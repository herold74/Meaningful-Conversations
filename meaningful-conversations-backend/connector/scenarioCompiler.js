const {
  MAX_RELATIONSHIP_CHARS,
  MAX_SITUATION_CHARS,
  OPEN_LENGTH_PRESETS,
  VALID_LENGTH_PRESET_KEYS,
  RELATIONSHIP_BUCKETS,
} = require('./connectorLimits.js');

const compilerResponseSchema = {
  type: 'OBJECT',
  properties: {
    personaName: { type: 'STRING', description: 'Generic first name or "Gesprächspartner" / "Conversation partner" — no real identifiable names from user input.' },
    gender: { type: 'STRING', description: 'male or female' },
    relationshipBucket: {
      type: 'STRING',
      description: `One of: ${RELATIONSHIP_BUCKETS.join(', ')}`,
    },
    pickerTeaser: { type: 'STRING', description: 'Short teaser for UI (one line).' },
    scenarioBrief: { type: 'STRING', description: 'What the user already knows walking in — facts only, no coaching hints or traps.' },
    situation: { type: 'STRING', description: 'Full persona situation for LLM (persona POV).' },
    emotionalTone: { type: 'STRING' },
    innerNeed: { type: 'STRING', description: 'Hidden inner need — not for user.' },
    opening: { type: 'STRING', description: 'First message from persona.' },
    exitLine: { type: 'STRING', description: 'Everyday excuse to end when turn cap hits.' },
    trap: { type: 'STRING', description: 'Common unhelpful response pattern (evaluation rubric, server-only).' },
    goodConnection: { type: 'STRING', description: 'What good connection looks like (evaluation rubric, server-only).' },
  },
  required: [
    'personaName',
    'gender',
    'relationshipBucket',
    'scenarioBrief',
    'situation',
    'emotionalTone',
    'innerNeed',
    'opening',
    'exitLine',
    'trap',
    'goodConnection',
  ],
};

function validateOpenSituationInput({ relationship, situation, lengthPreset }) {
  const errors = [];
  const rel = typeof relationship === 'string' ? relationship.trim() : '';
  const sit = typeof situation === 'string' ? situation.trim() : '';
  if (!rel) errors.push('relationship is required.');
  if (!sit) errors.push('situation is required.');
  if (rel.length > MAX_RELATIONSHIP_CHARS) {
    errors.push(`relationship exceeds ${MAX_RELATIONSHIP_CHARS} characters.`);
  }
  if (sit.length > MAX_SITUATION_CHARS) {
    errors.push(`situation exceeds ${MAX_SITUATION_CHARS} characters.`);
  }
  const presetKey = typeof lengthPreset === 'string' ? lengthPreset.trim().toLowerCase() : 'standard';
  if (!VALID_LENGTH_PRESET_KEYS.includes(presetKey)) {
    errors.push(`Invalid lengthPreset. Use one of: ${VALID_LENGTH_PRESET_KEYS.join(', ')}.`);
  }
  return { ok: errors.length === 0, errors, relationship: rel, situation: sit, lengthPreset: presetKey };
}

function buildScenarioCompilerPrompt({ relationship, situation, language }) {
  const lang = language === 'en' ? 'en' : 'de';
  const preset = OPEN_LENGTH_PRESETS.standard;
  if (lang === 'de') {
    return `Du bist ein Szenario-Compiler für "The Connector" — Übungsgespräche im Alltag (kein Coaching).

Der Nutzer beschreibt Beziehung und Situation. Erzeuge ein vollständiges Persona-Szenario für die Simulation.

NUTZER — BEZIEHUNG (max Kontext): ${relationship}

NUTZER — SITUATION: ${situation}

REGELN:
- Schreibe alle Felder auf Deutsch.
- personaName: generisch (z. B. "Alex", "Gesprächspartner") — KEINE echten Namen aus dem Nutzertext übernehmen.
- scenarioBrief: nur Fakten, die der Nutzer schon kennt — KEINE Fallen, KEINE Coaching-Hinweise, KEIN innerNeed.
- situation / trap / goodConnection / innerNeed: nur für das LLM — niemals Spoiler im scenarioBrief.
- gender: "male" oder "female".
- relationshipBucket: genau einer von ${RELATIONSHIP_BUCKETS.join(', ')}.
- opening: erste Nachricht der Persona, authentisch und konkret.
- exitLine: kurzer Alltagsgrund zum Beenden bei Turn-Limit (~${preset.maxUserTurns} Nutzer-Nachrichten).`;
  }
  return `You are a scenario compiler for "The Connector" — everyday connection practice (not coaching).

The user describes relationship and situation. Produce a complete persona scenario for simulation.

USER — RELATIONSHIP: ${relationship}

USER — SITUATION: ${situation}

RULES:
- Write all fields in English.
- personaName: generic (e.g. "Alex", "Conversation partner") — do NOT copy real names from the user text.
- scenarioBrief: only facts the user already knows — NO traps, NO coaching hints, NO innerNeed.
- situation / trap / goodConnection / innerNeed: LLM-only — never spoil in scenarioBrief.
- gender: "male" or "female".
- relationshipBucket: exactly one of ${RELATIONSHIP_BUCKETS.join(', ')}.
- opening: persona's first message, authentic and concrete.
- exitLine: brief everyday excuse to end at turn cap (~${preset.maxUserTurns} user messages).`;
}

function sanitizeCompiledVignette(raw, { relationship, language }) {
  const lang = language === 'en' ? 'en' : 'de';
  const gender = raw.gender === 'female' ? 'female' : 'male';
  let bucket = typeof raw.relationshipBucket === 'string' ? raw.relationshipBucket.toLowerCase() : 'other';
  if (!RELATIONSHIP_BUCKETS.includes(bucket)) bucket = 'other';

  const str = (v, fallback = '') => (typeof v === 'string' ? v.trim() : fallback);

  const vignette = {
    personaName: str(raw.personaName, lang === 'de' ? 'Gesprächspartner' : 'Conversation partner'),
    gender,
    relationship: relationship,
    relationshipBucket: bucket,
    pickerTeaser: str(raw.pickerTeaser, relationship.slice(0, 80)),
    scenarioBrief: str(raw.scenarioBrief),
    situation: str(raw.situation),
    emotionalTone: str(raw.emotionalTone, lang === 'de' ? 'Angespannt' : 'Tense'),
    innerNeed: str(raw.innerNeed),
    opening: str(raw.opening),
    exitLine: str(raw.exitLine, lang === 'de' ? 'Ich muss gleich los — danke fürs Zuhören.' : 'I have to run — thanks for listening.'),
    trap: str(raw.trap),
    goodConnection: str(raw.goodConnection),
  };

  const forbidden = /nicht beraten|not get advice|trap|inner need|inneres bedürfnis/i;
  if (forbidden.test(vignette.scenarioBrief)) {
    vignette.scenarioBrief = relationship;
  }

  return vignette;
}

function publicPayloadFromCompiled(vignette, language) {
  const { toPublicVignetteFromInternal } = require('./vignetteFields.js');
  return toPublicVignetteFromInternal(vignette, language);
}

module.exports = {
  compilerResponseSchema,
  validateOpenSituationInput,
  buildScenarioCompilerPrompt,
  sanitizeCompiledVignette,
  publicPayloadFromCompiled,
  RELATIONSHIP_BUCKETS,
};
