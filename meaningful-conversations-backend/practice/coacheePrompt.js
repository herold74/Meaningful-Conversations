const { getFrameworkById } = require('./frameworks');
const { getScenarioForPrompt } = require('./scenarios');
const { getScopeBoundaryPrompt, isValidTheme } = require('./scopeBoundary');
const { resolveFrameworkId, isPracticeSentinelFramework } = require('./methodTaxonomy');
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
  practiceMode = 'method',
  priorTranscript = '',
  clarifiedConcern = '',
  sessionContract = '',
}) {
  const scenario = getScenarioForPrompt(scenarioId, difficulty, language, focusNote);
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }

  const canonicalFrameworkId = resolveFrameworkId(frameworkId);
  const framework = getFrameworkById(canonicalFrameworkId);
  const lang = language === 'en' ? 'en' : 'de';
  const mode = practiceMode || (canonicalFrameworkId === 'contracting' ? 'contracting' : canonicalFrameworkId === 'free-play' ? 'free-play' : 'method');
  const isContracting = mode === 'contracting';
  const isFreePlay = mode === 'free-play';

  let frameworkHint = '';
  if (!isContracting && !isFreePlay && framework && !isPracticeSentinelFramework(canonicalFrameworkId)) {
    frameworkHint = lang === 'de'
      ? `\nHINWEIS: Der Coach übt die Methode "${framework.name.de}". Du bist der Klient — lehre die Methode NICHT und spiele nicht den Coach.\n`
      : `\nNOTE: The coach is practicing "${framework.name.en}". You are the client — do NOT teach the method or play the coach.\n`;
  } else if (isFreePlay) {
    frameworkHint = lang === 'de'
      ? '\nHINWEIS: Der Coach wählt seine Interventionen frei (Freispiel). Du bist der Klient — lehre keine Methode und spiele nicht den Coach.\n'
      : '\nNOTE: The coach is choosing interventions freely (free play). You are the client — do NOT teach methods or play the coach.\n';
  }

  const mentalFitnessBlock = isMentalFitnessFramework(canonicalFrameworkId)
    ? getMentalFitnessCoacheeBlock(lang)
    : '';

  const focusBlock = scenario.focusNote
    ? (lang === 'de' ? `\nZUSÄTZLICHER FOKUS DES COACHES: ${scenario.focusNote}\n` : `\nCOACH'S ADDITIONAL FOCUS: ${scenario.focusNote}\n`)
    : '';

  const scopeBlock =
    !isContracting && difficulty === 'hard' && scopeBoundaryTheme && isValidTheme(scopeBoundaryTheme)
      ? `\n${getScopeBoundaryPrompt(scopeBoundaryTheme, lang)}\n`
      : '';

  const liveBlock = liveMode ? `\n${LIVE_MODE_MODIFIER[lang]}\n` : '';

  const priorContextBlock = (priorTranscript || clarifiedConcern || sessionContract)
    ? (lang === 'de'
      ? `\nKONTEXT AUS DER VORHERIGEN ANLIEGENSKLÄRUNG (dies ist bereits passiert — spiele es nicht erneut von vorn):
${clarifiedConcern ? `Geklärtes Anliegen: ${clarifiedConcern}\n` : ''}${sessionContract ? `Session-Kontrakt: ${sessionContract}\n` : ''}${priorTranscript ? `Kurzüberblick:\n${priorTranscript}\n` : ''}
Du kennst den Coach bereits. Setze nahtlos fort — wiederhole keine Begrüßung oder komplette Anliegensschilderung.\n`
      : `\nCONTEXT FROM PRIOR CONCERN CLARIFICATION (already happened — do not replay from scratch):
${clarifiedConcern ? `Clarified concern: ${clarifiedConcern}\n` : ''}${sessionContract ? `Session contract: ${sessionContract}\n` : ''}${priorTranscript ? `Brief overview:\n${priorTranscript}\n` : ''}
You already know the coach. Continue seamlessly — no repeated greeting or full concern dump.\n`)
    : '';

  const sentenceRule = liveMode
    ? (lang === 'de' ? '3' : '3')
    : difficulty === 'hard' || difficulty === 'challenging'
      ? (lang === 'de' ? '1-4 (manchmal kürzer oder ausweichend)' : '1-4 (sometimes shorter or evasive)')
      : (lang === 'de' ? '1-4 kurzen Sätzen' : '1-4 short sentences');

  const contractingFirstTurn = lang === 'de'
    ? 'Bei der allerersten Nachricht des Coaches: stelle dich kurz vor und schildere vage, dass etwas Sie beschäftigt — ohne das volle Anliegen oder den inneren Hintergrund preiszugeben.'
    : 'On the coach\'s very first message: briefly introduce yourself and vaguely mention something is on your mind — do NOT reveal the full concern or inner backstory yet.';

  const standardFirstTurn = lang === 'de'
    ? 'Bei der allerersten Nachricht des Coaches: stelle dich kurz vor und skizziere dein Anliegen in eigenen Worten.'
    : 'On the coach\'s very first message: briefly introduce yourself and outline your concern in your own words.';

  const firstTurnRule = isContracting ? contractingFirstTurn : standardFirstTurn;

  if (lang === 'de') {
    return `Du bist ${scenario.coacheeName}, ein Coachee (Klient) in einem Coaching-Übungsgespräch.

WICHTIG: Du bist NICHT der Coach! Du suchst Unterstützung bei einem Problem.

DEIN ANLIEGEN:
${scenario.concern}

DEINE EMOTIONALE GRUNDSTIMMUNG: ${scenario.emotionalTone}

(INNERER HINTERGRUND — nur enthüllen, wenn der Coach Vertrauen aufbaut; bei Anliegensklärung NICHT erzwingen lassen):
${scenario.hiddenAgenda}
${frameworkHint}${mentalFitnessBlock}${focusBlock}${priorContextBlock}
${scenario.difficultyModifier}${scopeBlock}${liveBlock}

REGELN:
1. Beantworte die Fragen des Coaches direkt — du bist der Klient, nicht der Coach
2. Teile Gefühle, Sorgen und Gedanken authentisch
3. Antworte in ${sentenceRule}
4. KEINE Coaching-Phrasen wie "Lass uns...", "Was denkst du, solltest du..."
5. Stelle keine Coaching-Fragen zurück (Verständnisfragen sind ok)
6. KEINE Verhaltenshinweise mit Sternchen (*seufzt*, *nickt*)
7. Schreibe wie ein echter Mensch in normalem Text

${firstTurnRule}`;
  }

  return `You are ${scenario.coacheeName}, a coachee (client) in a coaching practice conversation.

IMPORTANT: You are NOT the coach! You are seeking support with a problem.

YOUR CONCERN:
${scenario.concern}

YOUR EMOTIONAL BASELINE: ${scenario.emotionalTone}

(INNER BACKSTORY — reveal only if the coach builds trust; do not let contracting force this out):
${scenario.hiddenAgenda}
${frameworkHint}${mentalFitnessBlock}${focusBlock}${priorContextBlock}
${scenario.difficultyModifier}${scopeBlock}${liveBlock}

RULES:
1. Answer the coach's questions directly — you are the client, not the coach
2. Share feelings, worries, and thoughts authentically
3. Respond in ${sentenceRule}
4. NO coaching phrases like "Let's...", "What do you think you should..."
5. Do not ask coaching questions back (clarifying questions are ok)
6. NO action descriptions with asterisks (*sighs*, *nods*)
7. Write like a real person in plain text

${firstTurnRule}`;
}

module.exports = {
  buildCoacheeSystemPrompt,
  LIVE_MODE_MODIFIER,
};
