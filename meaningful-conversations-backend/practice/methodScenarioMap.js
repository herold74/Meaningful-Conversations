/**
 * Method × scenario match tiers for Coach Practice setup.
 * Tiers: primary, alternative, neutral (default), discouraged
 */

const DEFAULT_PAIR = { frameworkId: 'grow', scenarioId: 'career-decision' };

const ALL_FRAMEWORK_IDS = [
  'gps',
  'ambitious',
  'strategic',
  'stoic',
  'structured-reflection',
  'mental-fitness',
  'systemic',
  'thought-audit',
  'client-exact-language',
  'grow',
  'forward-focused-coaching',
  'ambivalence-coaching',
];

const ALL_SCENARIO_IDS = [
  'career-decision',
  'team-conflict',
  'motivation-dip',
  'relationship-boundary',
  'overwhelm',
  'resistance-change',
  'imposter-promotion',
  'life-balance',
  'career-plateau',
  'strategic-pivot',
  'feedback-anxiety',
  'stuck-metaphor',
];

/** @type {Record<string, { primary: string[], alternative: string[], discouraged: string[] }>} */
const SCENARIO_MATCHES = {
  'career-decision': {
    primary: ['strategic', 'grow', 'gps'],
    alternative: ['forward-focused-coaching', 'ambivalence-coaching', 'ambitious'],
    discouraged: ['client-exact-language', 'thought-audit', 'stoic'],
  },
  'team-conflict': {
    primary: ['systemic', 'grow', 'gps'],
    alternative: ['forward-focused-coaching', 'structured-reflection', 'stoic'],
    discouraged: ['client-exact-language', 'ambitious', 'strategic'],
  },
  'motivation-dip': {
    primary: ['mental-fitness', 'structured-reflection', 'gps'],
    alternative: ['grow', 'forward-focused-coaching', 'stoic'],
    discouraged: ['client-exact-language', 'strategic', 'systemic'],
  },
  'relationship-boundary': {
    primary: ['grow', 'gps', 'forward-focused-coaching'],
    alternative: ['structured-reflection', 'mental-fitness', 'ambivalence-coaching'],
    discouraged: ['client-exact-language', 'strategic', 'ambitious'],
  },
  'overwhelm': {
    primary: ['gps', 'structured-reflection', 'mental-fitness'],
    alternative: ['grow', 'stoic', 'forward-focused-coaching'],
    discouraged: ['client-exact-language', 'ambitious', 'strategic'],
  },
  'resistance-change': {
    primary: ['ambivalence-coaching', 'systemic', 'grow'],
    alternative: ['gps', 'forward-focused-coaching', 'stoic'],
    discouraged: ['client-exact-language', 'thought-audit', 'ambitious'],
  },
  'imposter-promotion': {
    primary: ['thought-audit', 'structured-reflection', 'grow'],
    alternative: ['mental-fitness', 'gps', 'stoic'],
    discouraged: ['client-exact-language', 'forward-focused-coaching', 'strategic'],
  },
  'life-balance': {
    primary: ['gps', 'grow', 'stoic'],
    alternative: ['structured-reflection', 'mental-fitness', 'forward-focused-coaching'],
    discouraged: ['client-exact-language', 'ambitious', 'strategic'],
  },
  'career-plateau': {
    primary: ['ambitious', 'grow', 'gps'],
    alternative: ['strategic', 'forward-focused-coaching', 'ambivalence-coaching'],
    discouraged: ['client-exact-language', 'thought-audit', 'stoic'],
  },
  'strategic-pivot': {
    primary: ['strategic', 'gps', 'grow'],
    alternative: ['ambitious', 'systemic', 'forward-focused-coaching'],
    discouraged: ['client-exact-language', 'thought-audit', 'mental-fitness'],
  },
  'feedback-anxiety': {
    primary: ['thought-audit', 'structured-reflection', 'mental-fitness'],
    alternative: ['grow', 'gps', 'stoic'],
    discouraged: ['client-exact-language', 'strategic', 'ambitious'],
  },
  'stuck-metaphor': {
    primary: ['client-exact-language'],
    alternative: ['grow', 'gps', 'structured-reflection'],
    discouraged: ['strategic', 'ambitious', 'thought-audit', 'ambivalence-coaching'],
  },
};

const TIER_RANK = {
  primary: 0,
  alternative: 1,
  neutral: 2,
  discouraged: 3,
};

const SCENARIO_LABELS = {
  'career-decision': { en: 'career decision', de: 'Karriereentscheidung' },
  'team-conflict': { en: 'team conflict', de: 'Teamkonflikt' },
  'motivation-dip': { en: 'motivation dip', de: 'Motivationstief' },
  'relationship-boundary': { en: 'relationship boundary', de: 'Beziehungsgrenze' },
  overwhelm: { en: 'overwhelm', de: 'Überforderung' },
  'resistance-change': { en: 'resistance to change', de: 'Widerstand gegen Veränderung' },
  'imposter-promotion': { en: 'imposter feelings after promotion', de: 'Hochstaplergefühl nach Beförderung' },
  'life-balance': { en: 'work-life balance', de: 'Work-Life-Balance' },
  'career-plateau': { en: 'career plateau', de: 'Karriereplateau' },
  'strategic-pivot': { en: 'strategic pivot', de: 'strategische Neuausrichtung' },
  'feedback-anxiety': { en: 'feedback anxiety', de: 'Feedback-Angst' },
  'stuck-metaphor': { en: 'stuck-in-metaphor concern', de: 'in Metaphern verpacktes Anliegen' },
};

const FRAMEWORK_LABELS = {
  gps: { en: 'GPS', de: 'GPS' },
  ambitious: { en: 'Ambitious coaching', de: 'Ambitioniertes Coaching' },
  strategic: { en: 'Strategic coaching', de: 'Strategisches Coaching' },
  stoic: { en: 'Stoic coaching', de: 'Stoisches Coaching' },
  'structured-reflection': { en: 'Structured reflection', de: 'Strukturierte Reflexion' },
  'mental-fitness': { en: 'Mental fitness', de: 'Mental Fitness' },
  systemic: { en: 'Systemic coaching', de: 'Systemisches Coaching' },
  'thought-audit': { en: 'Thought audit', de: 'Gedanken-Audit' },
  'client-exact-language': { en: 'client exact language', de: 'client exact language' },
  grow: { en: 'GROW', de: 'GROW' },
  'forward-focused-coaching': { en: 'Solution-focused coaching', de: 'Lösungsorientiertes Coaching' },
  'ambivalence-coaching': { en: 'Motivational interviewing', de: 'ambivalence coaching' },
};

/** Framework-specific mismatch hints for discouraged pairs */
const FRAMEWORK_MISMATCH = {
  'client-exact-language': {
    en: 'client exact language works best when the client speaks in metaphors and imagery. This scenario is more concrete and analytical.',
    de: 'client exact language funktioniert am besten, wenn der Klient in Metaphern und Bildern spricht. Dieses Szenario ist eher konkret und analytisch.',
  },
  'thought-audit': {
    en: 'Thought audit suits rigid self-talk and cognitive distortions. This scenario calls for a different coaching stance.',
    de: 'Gedanken-Audit passt zu starren Selbstgesprächen und kognitiven Verzerrungen. Dieses Szenario braucht einen anderen Coaching-Ansatz.',
  },
  stoic: {
    en: 'Stoic reframing fits acceptance and control circles. Here it may feel dismissive of valid emotions or systemic factors.',
    de: 'Stoische Umdeutung passt zu Akzeptanz und Kontrollkreisen. Hier kann es gültige Emotionen oder systemische Faktoren abwerten.',
  },
  strategic: {
    en: 'Strategic coaching needs macro context and decision criteria. This concern is more personal or emotional than strategic.',
    de: 'Strategisches Coaching braucht Makrokontext und Entscheidungskriterien. Dieses Anliegen ist persönlicher oder emotionaler als strategisch.',
  },
  ambitious: {
    en: 'Ambitious coaching stretches long-term potential. This scenario needs steadier support rather than big-picture expansion.',
    de: 'Ambitioniertes Coaching weitet langfristiges Potenzial. Dieses Szenario braucht eher stetige Begleitung als große Perspektivsprünge.',
  },
  systemic: {
    en: 'Systemic coaching maps relationships and patterns. This concern is better addressed with an individual-focused method.',
    de: 'Systemisches Coaching kartiert Beziehungen und Muster. Dieses Anliegen lässt sich besser mit einer individuellen Methode bearbeiten.',
  },
  'mental-fitness': {
    en: 'Mental fitness targets inner critic patterns. This scenario is not primarily about saboteur thinking.',
    de: 'Mental Fitness zielt auf innere-Kritiker-Muster. Dieses Szenario dreht sich nicht primär um Saboteur-Denken.',
  },
  'forward-focused-coaching': {
    en: 'Solution-focused coaching assumes a preferred future is reachable soon. This scenario may need deeper exploration first.',
    de: 'Lösungsorientiertes Coaching setzt eine erreichbare Wunschzukunft voraus. Dieses Szenario braucht vielleicht zuerst tiefere Erkundung.',
  },
  'ambivalence-coaching': {
    en: 'Motivational interviewing fits ambivalence about change. This scenario is not mainly about change resistance.',
    de: 'ambivalence coaching passt zu Ambivalenz gegenüber Veränderung. Dieses Szenario dreht sich nicht primär um Veränderungswiderstand.',
  },
};

/** @type {Map<string, Map<string, string>>} scenarioId -> frameworkId -> tier */
const tierLookup = new Map();

function buildTierLookup() {
  if (tierLookup.size > 0) return tierLookup;

  for (const scenarioId of ALL_SCENARIO_IDS) {
    const config = SCENARIO_MATCHES[scenarioId];
    const fwMap = new Map();
    for (const fwId of config.primary) fwMap.set(fwId, 'primary');
    for (const fwId of config.alternative) fwMap.set(fwId, 'alternative');
    for (const fwId of config.discouraged) fwMap.set(fwId, 'discouraged');
    for (const fwId of ALL_FRAMEWORK_IDS) {
      if (!fwMap.has(fwId)) fwMap.set(fwId, 'neutral');
    }
    tierLookup.set(scenarioId, fwMap);
  }
  return tierLookup;
}

function getMatchTier(scenarioId, frameworkId) {
  const lookup = buildTierLookup();
  const fwMap = lookup.get(scenarioId);
  if (!fwMap) return 'neutral';
  return fwMap.get(frameworkId) || 'neutral';
}

function getDefaultPair() {
  return { ...DEFAULT_PAIR };
}

function getDiscouragedReason(scenarioId, frameworkId, language = 'de') {
  const lang = language === 'en' ? 'en' : 'de';
  if (getMatchTier(scenarioId, frameworkId) !== 'discouraged') {
    return '';
  }

  const scenarioLabel = SCENARIO_LABELS[scenarioId]?.[lang] || scenarioId;
  const frameworkLabel = FRAMEWORK_LABELS[frameworkId]?.[lang] || frameworkId;
  const mismatch = FRAMEWORK_MISMATCH[frameworkId];

  if (mismatch) {
    return lang === 'en'
      ? `${frameworkLabel} is a weak fit for a ${scenarioLabel} scenario. ${mismatch.en}`
      : `${frameworkLabel} passt schlecht zu einem Szenario „${scenarioLabel}". ${mismatch.de}`;
  }

  return lang === 'en'
    ? `${frameworkLabel} is not recommended for this ${scenarioLabel} scenario. Consider a primary or alternative match instead.`
    : `${frameworkLabel} wird für dieses Szenario „${scenarioLabel}" nicht empfohlen. Wähle lieber eine Primary- oder Alternative-Empfehlung.`;
}

function buildMatchMap(scenarioId) {
  const lookup = buildTierLookup();
  const fwMap = lookup.get(scenarioId);
  if (!fwMap) return {};
  const result = {};
  for (const [fwId, tier] of fwMap.entries()) {
    result[fwId] = tier;
  }
  return result;
}

function buildScenarioMatchMap(frameworkId) {
  const result = {};
  for (const scenarioId of ALL_SCENARIO_IDS) {
    result[scenarioId] = getMatchTier(scenarioId, frameworkId);
  }
  return result;
}

function enrichCatalog(frameworks, scenarios, language = 'de') {
  buildTierLookup();
  const lang = language === 'en' ? 'en' : 'de';

  const enrichedFrameworks = frameworks.map((fw) => ({
    ...fw,
    scenarioMatches: buildScenarioMatchMap(fw.id),
  }));

  const enrichedScenarios = scenarios.map((sc) => ({
    ...sc,
    frameworkMatches: buildMatchMap(sc.id),
    discouragedReasons: Object.fromEntries(
      ALL_FRAMEWORK_IDS
        .filter((fwId) => getMatchTier(sc.id, fwId) === 'discouraged')
        .map((fwId) => [fwId, getDiscouragedReason(sc.id, fwId, lang)]),
    ),
  }));

  return {
    frameworks: enrichedFrameworks,
    scenarios: enrichedScenarios,
    defaultPair: getDefaultPair(),
  };
}

function sortByMatchTier(items, getTierFn) {
  return [...items].sort((a, b) => {
    const rankA = TIER_RANK[getTierFn(a)] ?? 2;
    const rankB = TIER_RANK[getTierFn(b)] ?? 2;
    return rankA - rankB;
  });
}

module.exports = {
  DEFAULT_PAIR,
  ALL_FRAMEWORK_IDS,
  ALL_SCENARIO_IDS,
  SCENARIO_MATCHES,
  TIER_RANK,
  getMatchTier,
  getDefaultPair,
  getDiscouragedReason,
  enrichCatalog,
  sortByMatchTier,
};
