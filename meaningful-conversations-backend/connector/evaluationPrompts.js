const { getVignetteById } = require('./vignettes');

/**
 * The Connector — evaluation prompt + strict JSON schema.
 *
 * One evaluation call covers the whole run (up to 3 vignettes). Five dimensions:
 * empathy, presence, curiosity, nonJudgment, steadiness. Deliberately framed as a
 * strengths profile, NOT a coaching certification verdict.
 */

const CONNECTOR_DIMENSIONS = ['empathy', 'presence', 'curiosity', 'nonJudgment', 'steadiness'];

const connectorDimensionScoreSchema = {
  type: 'OBJECT',
  properties: {
    score: { type: 'INTEGER', description: '1-10' },
    evidence: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Short quotes or observations from the transcripts.' },
  },
  required: ['score', 'evidence'],
};

const connectorEvaluationSchema = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: 'Warm, strengths-oriented narrative summary (3-5 sentences).' },
    empathy: connectorDimensionScoreSchema,
    presence: connectorDimensionScoreSchema,
    curiosity: connectorDimensionScoreSchema,
    nonJudgment: connectorDimensionScoreSchema,
    steadiness: connectorDimensionScoreSchema,
    strengths: { type: 'ARRAY', items: { type: 'STRING' } },
    growthAreas: { type: 'ARRAY', items: { type: 'STRING' } },
    perVignette: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          vignetteId: { type: 'STRING' },
          highlight: { type: 'STRING', description: 'Best connecting moment in this vignette.' },
          missedCue: { type: 'STRING', description: 'One cue that was missed or could have been picked up — empty string if none.' },
        },
        required: ['vignetteId', 'highlight', 'missedCue'],
      },
    },
  },
  required: ['summary', 'empathy', 'presence', 'curiosity', 'nonJudgment', 'steadiness', 'strengths', 'growthAreas', 'perVignette'],
};

const END_TYPE_LABELS = {
  heard: { de: 'Person fühlte sich gehört und schloss von selbst ab', en: 'person felt heard and closed the conversation themselves' },
  timeout: { de: 'Gespräch endete durch Alltagsgrund (Zeitlimit)', en: 'conversation ended with an everyday excuse (turn limit)' },
  aborted: { de: 'vom User abgebrochen', en: 'aborted by the user' },
};

function buildVignetteBlock(entry, lang) {
  const vignette = getVignetteById(entry.vignetteId);
  const name = vignette ? vignette.personaName : entry.vignetteId;
  const genderLabel = vignette
    ? (lang === 'de'
      ? (vignette.gender === 'female' ? 'weiblich' : 'männlich')
      : vignette.gender)
    : '';
  const relationship = vignette ? vignette.relationship[lang] : '';
  const goodConnection = vignette ? vignette.goodConnection[lang] : '';
  const trap = vignette ? vignette.trap[lang] : '';
  const endLabel = (END_TYPE_LABELS[entry.endType] || END_TYPE_LABELS.timeout)[lang];

  if (lang === 'de') {
    return `### Vignette: ${name} (${relationship}, ${genderLabel}) — ${entry.vignetteId}
**Gelungene Verbindung sieht hier so aus:** ${goodConnection}
**Typische Falle:** ${trap}
**Gesprächsende:** ${endLabel}

Transkript:
\`\`\`
${entry.transcript}
\`\`\``;
  }
  return `### Vignette: ${name} (${relationship}, ${genderLabel}) — ${entry.vignetteId}
**Good connection here looks like:** ${goodConnection}
**Typical trap:** ${trap}
**Conversation ending:** ${endLabel}

Transcript:
\`\`\`
${entry.transcript}
\`\`\``;
}

const connectorEvaluationPrompts = {
  schema: connectorEvaluationSchema,
  de: {
    /**
     * @param {object} p
     * @param {Array<{vignetteId: string, transcript: string, endType: string}>} p.vignettes
     * @param {string} p.currentDate
     * @param {boolean} p.liveMode
     */
    prompt: ({ vignettes, currentDate, liveMode }) => {
      const liveBlock = liveMode ? '\n**Live-Modus:** Sprech-Unsicherheiten tolerieren; Klarheit nicht allein wegen gesprochener Sprache abwerten.\n' : '';
      const blocks = vignettes.map((v) => buildVignetteBlock(v, 'de')).join('\n\n');
      return `
Du bist eine erfahrene Beobachterin für zwischenmenschliche Kommunikation. Du bewertest, wie gut ein Mensch in Alltagsgesprächen **Verbindung herstellt** — als Freund/Kollege, NICHT als professioneller Coach. Es geht um beobachtbares Gesprächsverhalten, nicht um Methodenwissen. Verbindung ist eine erlernbare Fähigkeit — bewerte entsprechend entwicklungsorientiert.

**WICHTIGER RAHMEN:** Dies ist ein Stärkenprofil, KEIN Coaching-Zertifikat und KEIN Urteil über die Person. Formuliere warm, konkret und wachstumsorientiert. Jedes Ergebnis endet mit einem Entwicklungsweg, nicht mit einer Note.

**Heutiges Datum:** ${currentDate}
${liveBlock}
## Die Gespräche
In jeder Vignette spielte eine KI eine Person mit einem Anliegen („Persona"); der Mensch („User") reagierte als er selbst.

${blocks}

## Bewertung
Bewerte fünf Dimensionen (je 1-10, mit konkreten Belegen aus den Transkripten):
- **empathy (Empathie):** Emotionen erkennen und benennen, statt sie zu überspringen
- **presence (Präsenz):** Bei der Person bleiben; Zwischentöne hören; kein Selbstbezug
- **curiosity (Neugier):** Echte Fragen stellen, bevor Ratschläge kommen; Ratsfragen erkunden statt beantworten
- **nonJudgment (Nicht-Werten):** Weder verurteilen noch reflexhaft freisprechen; Ambivalenz stehen lassen
- **steadiness (Gelassenheit):** Ruhig und zugewandt bleiben bei starken Emotionen (Wut, Tränen, Abwiegeln)

**Gesprächsende als Evidenz:** Ein „gehört"-Ende (Persona schloss von selbst dankbar ab) ist ein positives Signal für Verbindung. Ein Alltagsgrund-Ende (Zeitlimit) ist NEUTRAL — nicht bestrafen.

**Kurze Transkripte:** Bei sehr wenigen User-Beiträgen konservativ bewerten und in der summary vermerken.

**strengths:** 2-4 konkrete Stärken. **growthAreas:** 1-3 konkrete, freundlich formulierte Entwicklungsfelder. **perVignette:** pro Vignette der beste Verbindungsmoment (highlight) und ein übersehener Hinweis (missedCue, leerer String wenn keiner).

Schreibe alle Texte auf Deutsch. Sprich den User in summary, strengths und growthAreas direkt mit „du" an.`;
    },
  },
  en: {
    prompt: ({ vignettes, currentDate, liveMode }) => {
      const liveBlock = liveMode ? '\n**Live mode:** Tolerate speech disfluency; do not penalize clarity for spoken language alone.\n' : '';
      const blocks = vignettes.map((v) => buildVignetteBlock(v, 'en')).join('\n\n');
      return `
You are an experienced observer of interpersonal communication. You evaluate how well a person **creates connection** in everyday conversations — as a friend/colleague, NOT as a professional coach. This is about observable conversational behavior, not method knowledge. Connection is a learnable skill — evaluate accordingly with a growth orientation.

**IMPORTANT FRAME:** This is a strengths profile, NOT a coaching certificate and NOT a verdict on the person. Write warmly, concretely, growth-oriented. Every result ends with a development path, not a grade.

**Today's Date:** ${currentDate}
${liveBlock}
## The Conversations
In each vignette an AI played a person with a concern ("Persona"); the human ("User") responded as themselves.

${blocks}

## Evaluation
Score five dimensions (1-10 each, with concrete evidence from the transcripts):
- **empathy:** Recognizing and naming emotions instead of skipping past them
- **presence:** Staying with the person; hearing what's between the lines; no self-referencing
- **curiosity:** Asking real questions before giving advice; exploring advice requests instead of answering them
- **nonJudgment:** Neither condemning nor reflexively absolving; letting ambivalence stand
- **steadiness:** Staying calm and engaged under strong emotions (anger, tears, deflection)

**Conversation endings as evidence:** A "heard" ending (persona closed gratefully on their own) is a positive connection signal. An everyday-excuse ending (turn limit) is NEUTRAL — do not penalize.

**Short transcripts:** With very few user turns, score conservatively and note it in the summary.

**strengths:** 2-4 concrete strengths. **growthAreas:** 1-3 concrete, kindly phrased growth areas. **perVignette:** per vignette the best connecting moment (highlight) and one missed cue (missedCue, empty string if none).

Write all texts in English. Address the user directly as "you" in summary, strengths, and growthAreas.`;
    },
  },
};

module.exports = {
  connectorEvaluationPrompts,
  connectorEvaluationSchema,
  CONNECTOR_DIMENSIONS,
};
