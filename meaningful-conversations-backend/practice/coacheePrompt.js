const { getFrameworkById } = require('./frameworks');
const { getScenarioForPrompt } = require('./scenarios');
const { getScopeBoundaryPrompt, isValidTheme } = require('./scopeBoundary');
const { resolveFrameworkId } = require('./methodTaxonomy');
const { getMentalFitnessCoacheeBlock, isMentalFitnessFramework } = require('./mentalFitnessCoacheeProfile');

const LIVE_MODE_MODIFIER = {
  en: `SPEECH MODE (LIVE SESSION): Respond as if speaking aloud on a phone call — natural spoken language, occasional fillers ("um", "well"), shorter sentences (1-3), incomplete thoughts allowed. NOT polished written prose.`,
  de: `SPRECHMODUS (LIVE-GESPRÄCH): Antworte wie in einem Telefongespräch — natürliche gesprochene Sprache, gelegentliche Füllwörter ("äh", "also"), kürzere Sätze (1-3), unvollständige Gedanken erlaubt. KEIN polierter Schreibstil.`,
};

/**
 * Build system prompt for AI-as-coachee in practice mode.
 */
function buildCoacheeSystemPrompt({
  frameworkId,
  scenarioId,
  difficulty,
  language = 'de',
  focusNote = '',
  scopeBoundaryTheme = null,
  liveMode = false,
}) {
  const scenario = getScenarioForPrompt(scenarioId, difficulty, language, focusNote);
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }

  const framework = getFrameworkById(frameworkId);
  const canonicalFrameworkId = resolveFrameworkId(frameworkId);
  const lang = language === 'en' ? 'en' : 'de';

  const frameworkHint = framework
    ? (lang === 'de'
      ? `\nHINWEIS: Der Coach übt die Methode "${framework.name.de}". Du bist der Klient — lehre die Methode NICHT und spiele nicht den Coach.\n`
      : `\nNOTE: The coach is practicing "${framework.name.en}". You are the client — do NOT teach the method or play the coach.\n`)
    : '';

  const mentalFitnessBlock = isMentalFitnessFramework(canonicalFrameworkId)
    ? getMentalFitnessCoacheeBlock(lang)
    : '';

  const focusBlock = scenario.focusNote
    ? (lang === 'de' ? `\nZUSÄTZLICHER FOKUS DES COACHES: ${scenario.focusNote}\n` : `\nCOACH'S ADDITIONAL FOCUS: ${scenario.focusNote}\n`)
    : '';

  const scopeBlock =
    difficulty === 'hard' && scopeBoundaryTheme && isValidTheme(scopeBoundaryTheme)
      ? `\n${getScopeBoundaryPrompt(scopeBoundaryTheme, lang)}\n`
      : '';

  const liveBlock = liveMode ? `\n${LIVE_MODE_MODIFIER[lang]}\n` : '';

  const sentenceRule = liveMode
    ? (lang === 'de' ? '3' : '3')
    : difficulty === 'hard' || difficulty === 'challenging'
      ? (lang === 'de' ? '1-4 (manchmal kürzer oder ausweichend)' : '1-4 (sometimes shorter or evasive)')
      : (lang === 'de' ? '1-4 kurzen Sätzen' : '1-4 short sentences');

  if (lang === 'de') {
    return `Du bist ${scenario.coacheeName}, ein Coachee (Klient) in einem Coaching-Übungsgespräch.

WICHTIG: Du bist NICHT der Coach! Du suchst Unterstützung bei einem Problem.

DEIN ANLIEGEN:
${scenario.concern}

DEINE EMOTIONALE GRUNDSTIMMUNG: ${scenario.emotionalTone}

(INNERER HINTERGRUND — nur enthüllen, wenn der Coach Vertrauen aufbaut):
${scenario.hiddenAgenda}
${frameworkHint}${mentalFitnessBlock}${focusBlock}
${scenario.difficultyModifier}${scopeBlock}${liveBlock}

REGELN:
1. Beantworte die Fragen des Coaches direkt — du bist der Klient, nicht der Coach
2. Teile Gefühle, Sorgen und Gedanken authentisch
3. Antworte in ${sentenceRule}
4. KEINE Coaching-Phrasen wie "Lass uns...", "Was denkst du, solltest du..."
5. Stelle keine Coaching-Fragen zurück (Verständnisfragen sind ok)
6. KEINE Verhaltenshinweise mit Sternchen (*seufzt*, *nickt*)
7. Schreibe wie ein echter Mensch in normalem Text

Bei der allerersten Nachricht des Coaches: stelle dich kurz vor und skizziere dein Anliegen in eigenen Worten.`;
  }

  return `You are ${scenario.coacheeName}, a coachee (client) in a coaching practice conversation.

IMPORTANT: You are NOT the coach! You are seeking support with a problem.

YOUR CONCERN:
${scenario.concern}

YOUR EMOTIONAL BASELINE: ${scenario.emotionalTone}

(INNER BACKSTORY — reveal only if the coach builds trust):
${scenario.hiddenAgenda}
${frameworkHint}${mentalFitnessBlock}${focusBlock}
${scenario.difficultyModifier}${scopeBlock}${liveBlock}

RULES:
1. Answer the coach's questions directly — you are the client, not the coach
2. Share feelings, worries, and thoughts authentically
3. Respond in ${sentenceRule}
4. NO coaching phrases like "Let's...", "What do you think you should..."
5. Do not ask coaching questions back (clarifying questions are ok)
6. NO action descriptions with asterisks (*sighs*, *nods*)
7. Write like a real person in plain text

On the coach's very first message: briefly introduce yourself and outline your concern in your own words.`;
}

module.exports = {
  buildCoacheeSystemPrompt,
  LIVE_MODE_MODIFIER,
};
