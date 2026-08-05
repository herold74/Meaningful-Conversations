/**
 * Practice coachee avatar → gender mapping (mirrored in utils/botGender.ts).
 */
const AVATAR_GENDER = {
  '/avatars/max.png': 'male',
  '/avatars/ava.png': 'female',
  '/avatars/kenji.png': 'male',
  '/avatars/chloe.png': 'female',
  '/avatars/rob.png': 'male',
  '/avatars/victor.png': 'male',
  '/avatars/bekky.png': 'female',
  '/avatars/dan.png': 'male',
  '/avatars/gabrielle.png': 'female',
  '/avatars/gloria.png': 'female',
  '/avatars/mike.png': 'male',
  '/avatars/sam.png': 'male',
  '/avatars/nobody.png': 'male',
  '/avatars/finley.png': 'female',
  '/avatars/rowan.png': 'male',
};

function getCoacheeGenderFromAvatar(avatar) {
  if (!avatar) return 'male';
  const normalized = avatar.replace(/^https?:\/\/[^/]+/, '');
  return AVATAR_GENDER[normalized] || 'male';
}

function resolveCoacheeGender(scenario) {
  if (!scenario) return 'male';
  if (scenario.coacheeGender === 'female' || scenario.coacheeGender === 'male') {
    return scenario.coacheeGender;
  }
  return getCoacheeGenderFromAvatar(scenario.avatar);
}

function buildCoacheeGenderPromptLine(gender, lang) {
  const isDe = lang === 'de';
  if (gender === 'female') {
    return isDe
      ? 'Geschlecht des Coachees: weiblich — verwende in der Auswertung durchgehend sie/ihr/ihre (Klientin), nie er/sein. Nicht aus dem Vornamen raten.'
      : 'Coachee gender: female — use she/her consistently in the evaluation. Do not infer from the first name.';
  }
  return isDe
    ? 'Geschlecht des Coachees: männlich — verwende in der Auswertung durchgehend er/ihm/sein (Klient), nie sie/ihr. Nicht aus dem Vornamen raten.'
    : 'Coachee gender: male — use he/him consistently in the evaluation. Do not infer from the first name.';
}

function buildPracticeScenarioSummary(scenario, lang, focusNote = '') {
  const isDe = lang === 'de';
  const gender = resolveCoacheeGender(scenario);
  const genderLine = buildCoacheeGenderPromptLine(gender, lang);
  const focus = focusNote
    ? (isDe ? `\nCoach-Fokus: ${focusNote}` : `\nCoach focus: ${focusNote}`)
    : '';

  if (isDe) {
    return `Coachee: ${scenario.coacheeName.de}\n${genderLine}\nAnliegen: ${scenario.concern.de}\nStimmung: ${scenario.emotionalTone.de}${focus}`;
  }
  return `Coachee: ${scenario.coacheeName.en}\n${genderLine}\nConcern: ${scenario.concern.en}\nTone: ${scenario.emotionalTone.en}${focus}`;
}

module.exports = {
  AVATAR_GENDER,
  getCoacheeGenderFromAvatar,
  resolveCoacheeGender,
  buildCoacheeGenderPromptLine,
  buildPracticeScenarioSummary,
};
