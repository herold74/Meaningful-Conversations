/** Generic illustration scenarios for Connector coach prep (not catalog personas). */
const ILLUSTRATION_EN = {
  empathy:
    'A colleague says they feel overwhelmed and a bit alone with a project. You notice the urge to fix it or give tips right away — the prep focus is naming what you sense in them before you move to solutions.',
  presence:
    'Someone close to you starts to share something that clearly weighs on them. You feel the pull to explain, reassure, or plan next steps — the prep focus is staying with them a moment before you respond.',
  curiosity:
    'A team member hesitates and only hints at what is bothering them. You are tempted to fill the silence with your view or advice — the prep focus is one genuine question before you offer anything.',
  nonJudgment:
    'A friend vents about a situation and looks for your reaction. You want to say it will be fine or that they are overthinking — the prep focus is listening and reflecting without judging or instantly calming them.',
  steadiness:
    'A conversation starts to heat up — voices rise or the tone sharpens. You feel pressure to match the energy or win the point — the prep focus is staying steady and clear without escalating.',
};

const ILLUSTRATION_DE = {
  empathy:
    'Eine Kollegin sagt, sie fühle sich mit einem Projekt überfordert und etwas allein. Du spürst den Impuls, sofort zu helfen oder Tipps zu geben — der Prep-Fokus ist, das Gefühl zu benennen, bevor du Lösungen anbietest.',
  presence:
    'Jemand, der dir nahe steht, beginnt etwas zu teilen, das sie oder ihn sichtbar belastet. Du willst erklären, beruhigen oder planen — der Prep-Fokus ist, einen Moment bei der Person zu bleiben, bevor du antwortest.',
  curiosity:
    'Eine Teamkollegin zögert und deutet nur an, was sie beschäftigt. Du neigst dazu, die Stille mit deiner Meinung oder einem Rat zu füllen — der Prep-Fokus ist eine echte Frage, bevor du etwas anbietest.',
  nonJudgment:
    'Ein Freund klagt über eine Situation und sucht deine Reaktion. Du willst sagen, es wird schon oder sie übertreiben — der Prep-Fokus ist zuhören und spiegeln, ohne zu bewerten oder reflexhaft zu beruhigen.',
  steadiness:
    'Ein Gespräch wird hitziger — Stimmen oder Ton schärfen sich. Du spürst Druck, mitzugehen oder den Punkt zu gewinnen — der Prep-Fokus ist ruhig und klar zu bleiben, ohne es zu eskalieren.',
};

function getPrepFocusIllustration(lang, focusDimension) {
  const key = focusDimension && ILLUSTRATION_EN[focusDimension] ? focusDimension : 'curiosity';
  return lang === 'de' ? ILLUSTRATION_DE[key] : ILLUSTRATION_EN[key];
}

function getNoConcreteConversationPhaseBlock(lang, focusDimension, { questionsOnly = false } = {}) {
  const illustration = getPrepFocusIllustration(lang, focusDimension);
  if (lang === 'de') {
    const roleLine = questionsOnly
      ? 'Bieten Sie das Beispiel an, dann **nur Fragen** dazu (keine Ratschläge) — der Nutzer darf es durch sein echtes Gespräch ersetzen, sobald ihm eines einfällt.'
      : 'Bieten Sie das Beispiel an, dann kurz mitreflektieren und **eine** klärende Frage — der Nutzer darf es durch sein echtes Gespräch ersetzen, sobald ihm eines einfällt.';
    return `

**Phase 2 — Nutzer hat (noch) kein konkretes Gespräch** (z. B. „weiß nicht", „noch nichts", sehr vage, unsicher): Das ist normal. Kurz anerkennen, dann sagen, dass Sie mit einem **neutralen Beispiel** starten können, das sie später durch ihr echtes Gespräch ersetzen können. ${roleLine}

Hilfs-Beispiel für diesen Prep-Fokus (Illustration — nicht als ihr echtes Gespräch behandeln): ${illustration}`;
  }

  const roleLine = questionsOnly
    ? 'Offer the example, then **questions only** about it (no advice) — they may swap in their real conversation whenever one comes to mind.'
    : 'Offer the example, then a brief reflection and **one** clarifying question — they may swap in their real conversation whenever one comes to mind.';
  return `

**Phase 2 — user has no concrete conversation yet** (e.g. “don't know”, “nothing yet”, very vague, unsure): Normalize briefly, then say you can start with a **neutral example** they can replace with their real talk later. ${roleLine}

Help illustration for this prep focus (not their real conversation unless they say so): ${illustration}`;
}

module.exports = {
  getPrepFocusIllustration,
  getNoConcreteConversationPhaseBlock,
  ILLUSTRATION_DE,
  ILLUSTRATION_EN,
};
