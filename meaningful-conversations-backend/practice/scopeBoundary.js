/**
 * Scope-boundary drill for Hard Coach Practice sessions (~33% probability).
 * Simulates coachee cues that belong outside coaching scope (trauma, addiction, etc.).
 */

const SCOPE_BOUNDARY_PROBABILITY = 0.33;

const THEMES = {
  trauma: {
    id: 'trauma',
    label: { en: 'Trauma-related distress', de: 'Traumabezogene Belastung' },
    scenarioHints: ['motivation-dip', 'team-conflict', 'overwhelm', 'life-balance'],
  },
  addiction: {
    id: 'addiction',
    label: { en: 'Substance use / addiction', de: 'Substanzgebrauch / Sucht' },
    scenarioHints: ['motivation-dip', 'life-balance', 'overwhelm', 'career-decision'],
  },
  'clinical-depression': {
    id: 'clinical-depression',
    label: { en: 'Clinical depression indicators', de: 'Hinweise auf klinische Depression' },
    scenarioHints: ['motivation-dip', 'life-balance', 'overwhelm'],
  },
  'eating-disorder': {
    id: 'eating-disorder',
    label: { en: 'Disordered eating patterns', de: 'Gestörtes Essverhalten' },
    scenarioHints: ['overwhelm', 'relationship-boundary', 'motivation-dip'],
  },
  'acute-distress': {
    id: 'acute-distress',
    label: { en: 'Acute crisis indicators', de: 'Akute Krisenindikatoren' },
    scenarioHints: ['motivation-dip', 'overwhelm', 'life-balance'],
  },
};

const THEME_PROMPTS = {
  trauma: {
    en: `SCOPE-BOUNDARY LAYER (hidden training drill — reveal gradually, NOT in your opening message):
You also carry unresolved trauma-related stress (e.g. nightmares, hypervigilance, or distress linked to a past event). If the coach pushes solutions without listening, hints may surface. If they explore sensitively, you may share slightly more — but NEVER graphic detail. Do NOT ask for a diagnosis. Coaching cannot process trauma; a trauma-informed therapist would be appropriate.`,
    de: `GRENZFALL-EBENE (verstecktes Trainings-Szenario — nach und nach enthüllen, NICHT in der Eröffnung):
Du trägst zusätzlich unverarbeiteten traumabezogenen Stress (z.B. Albträume, Hypervigilanz oder Belastung durch ein vergangenes Ereignis). Wenn der Coach ohne Zuhören Lösungen drängt, können Hinweise durchscheinen. Bei einfühlsamer Erkundung teilst du etwas mehr — aber NIEMALS grafische Details. Bitte nicht um Diagnose. Coaching kann Trauma nicht verarbeiten; eine traumainformierte Therapie wäre angemessen.`,
  },
  addiction: {
    en: `SCOPE-BOUNDARY LAYER (hidden training drill — reveal gradually, NOT in your opening message):
You also struggle with escalating substance use or dependency patterns (e.g. drinking to cope, hiding use). Surface this indirectly if the coach misses cues. Do NOT ask the coach to treat addiction. Appropriate response: empathetic referral to addiction counseling or medical support — not abstinence coaching.`,
    de: `GRENZFALL-EBENE (verstecktes Trainings-Szenario — nach und nach enthüllen, NICHT in der Eröffnung):
Du kämpfst zusätzlich mit zunehmendem Substanzgebrauch oder Abhängigkeitsmustern (z.B. Trinken zum Abturnen, Verheimlichen). Zeige dies indirekt, wenn der Coach Signale übersieht. Bitte den Coach nicht, Sucht zu behandeln. Angemessen: einfühlsame Überweisung an Suchtberatung oder medizinische Hilfe — kein Abstinenz-Coaching.`,
  },
  'clinical-depression': {
    en: `SCOPE-BOUNDARY LAYER (hidden training drill — reveal gradually, NOT in your opening message):
Beyond your stated concern, you show persistent clinical depression indicators (weeks of hopelessness, sleep/appetite disruption, loss of interest). Do NOT ask for diagnosis. Coaching on motivation is inappropriate; referral to GP or psychotherapist is the right path.`,
    de: `GRENZFALL-EBENE (verstecktes Trainings-Szenario — nach und nach enthüllen, NICHT in der Eröffnung):
Neben dem genannten Anliegen zeigst du anhaltende Hinweise auf klinische Depression (wochenlange Hoffnungslosigkeit, Schlaf/Appetit gestört, Interessenverlust). Bitte nicht um Diagnose. Motivations-Coaching ist unangemessen; Überweisung zu Hausarzt oder Psychotherapie ist richtig.`,
  },
  'eating-disorder': {
    en: `SCOPE-BOUNDARY LAYER (hidden training drill — reveal gradually, NOT in your opening message):
You also show disordered eating patterns (control through restriction, guilt cycles, body preoccupation). Surface subtly if relevant. Do NOT ask the coach for diet advice. Referral to specialized eating-disorder support is appropriate — not weight or nutrition coaching.`,
    de: `GRENZFALL-EBENE (verstecktes Trainings-Szenario — nach und nach enthüllen, NICHT in der Eröffnung):
Du zeigst zusätzlich gestörtes Essverhalten (Kontrolle durch Verzicht, Schuld-Zyklen, Körperfixierung). Zeige dies dezent, wenn passend. Bitte nicht um Diät-Ratschläge. Überweisung an spezialisierte Hilfe bei Essstörungen ist angemessen — kein Gewichts- oder Ernährungs-Coaching.`,
  },
  'acute-distress': {
    en: `SCOPE-BOUNDARY LAYER (hidden training drill — reveal gradually, NOT in your opening message):
If trust builds OR the coach pushes past limits, you may hint at acute distress (e.g. thoughts of not wanting to wake up, self-harm ideation — no graphic detail). The coach should verify seriously, express empathy, and recommend crisis hotlines and professional help immediately. This app cannot replace crisis support.`,
    de: `GRENZFALL-EBENE (verstecktes Trainings-Szenario — nach und nach enthüllen, NICHT in der Eröffnung):
Wenn Vertrauen entsteht ODER der Coach Grenzen überschreitet, kannst du akute Belastung andeuten (z.B. Gedanken, nicht mehr aufzuwachen, Selbstverletzungsgedanken — keine grafischen Details). Der Coach soll ernst nachfragen, Empathie zeigen und sofort Krisentelefone und professionelle Hilfe empfehlen. Diese App ersetzt keine Krisenversorgung.`,
  },
};

function isValidTheme(theme) {
  return theme && Object.prototype.hasOwnProperty.call(THEMES, theme);
}

function pickThemeForScenario(scenarioId) {
  const entries = Object.values(THEMES);
  const preferred = entries.filter((t) => t.scenarioHints.includes(scenarioId));
  const pool = preferred.length > 0 ? preferred : entries;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function rollScopeBoundaryTheme(scenarioId) {
  if (Math.random() >= SCOPE_BOUNDARY_PROBABILITY) return null;
  return pickThemeForScenario(scenarioId);
}

function getScopeBoundaryPrompt(theme, language = 'de') {
  if (!isValidTheme(theme)) return '';
  const lang = language === 'en' ? 'en' : 'de';
  return THEME_PROMPTS[theme][lang];
}

function getThemeLabel(theme, language = 'de') {
  if (!isValidTheme(theme)) return theme || '';
  const lang = language === 'en' ? 'en' : 'de';
  return THEMES[theme].label[lang];
}

module.exports = {
  SCOPE_BOUNDARY_PROBABILITY,
  THEMES,
  isValidTheme,
  rollScopeBoundaryTheme,
  getScopeBoundaryPrompt,
  getThemeLabel,
};
