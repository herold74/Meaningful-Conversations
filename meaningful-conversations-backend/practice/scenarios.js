/**
 * Coachee scenarios for Coach Practice mode (orthogonal to framework choice).
 */

const SCENARIOS = [
  {
    id: 'career-decision',
    coacheeName: { en: 'Alex', de: 'Alex' },
    avatar: '/avatars/max.png',
    concern: {
      en: 'Considering leaving a stable job for a startup offer. Torn between security and growth.',
      de: 'Erwägt, einen stabilen Job für ein Startup-Angebot zu verlassen. Hin- und hergerissen zwischen Sicherheit und Wachstum.',
    },
    emotionalTone: { en: 'anxious but hopeful', de: 'ängstlich aber hoffnungsvoll' },
    hiddenAgenda: {
      en: 'Secretly afraid of disappointing their parents who value stability.',
      de: 'Hat heimlich Angst, die Eltern zu enttäuschen, die Stabilität schätzen.',
    },
  },
  {
    id: 'team-conflict',
    coacheeName: { en: 'Sam', de: 'Sam' },
    avatar: '/avatars/ava.png',
    concern: {
      en: 'Ongoing tension with a colleague who takes credit for their work. Avoids confrontation.',
      de: 'Anhaltende Spannung mit einer Kollegin, die sich ihre Arbeit aneignet. Vermeidet Konfrontation.',
    },
    emotionalTone: { en: 'frustrated, passive', de: 'frustriert, passiv' },
    hiddenAgenda: {
      en: 'Wants validation that leaving the team is justified.',
      de: 'Will Bestätigung, dass ein Teamwechsel gerechtfertigt ist.',
    },
  },
  {
    id: 'motivation-dip',
    coacheeName: { en: 'Jordan', de: 'Jordan' },
    avatar: '/avatars/kenji.png',
    concern: {
      en: 'Lost motivation on a long project. Procrastinates and feels guilty.',
      de: 'Hat die Motivation bei einem langen Projekt verloren. Prokrastiniert und fühlt sich schuldig.',
    },
    emotionalTone: { en: 'tired, self-critical', de: 'müde, selbstkritisch' },
    hiddenAgenda: {
      en: 'Actually burnt out but refuses to admit they need a break.',
      de: 'Eigentlich ausgebrannt, will aber nicht zugeben, dass eine Pause nötig ist.',
    },
  },
  {
    id: 'relationship-boundary',
    coacheeName: { en: 'Taylor', de: 'Taylor' },
    avatar: '/avatars/chloe.png',
    concern: {
      en: 'A friend keeps dumping emotional problems late at night. Unsure how to set boundaries.',
      de: 'Eine Freundin lädt abends emotional ab. Unsicher, wie Grenzen setzen.',
    },
    emotionalTone: { en: 'guilty, overwhelmed', de: 'schuldig, überfordert' },
    hiddenAgenda: {
      en: 'Fears being seen as selfish if they say no.',
      de: 'Hat Angst, egoistisch zu wirken, wenn sie Nein sagt.',
    },
  },
  {
    id: 'overwhelm',
    coacheeName: { en: 'Casey', de: 'Casey' },
    avatar: '/avatars/rob.png',
    concern: {
      en: 'Too many priorities at work and home. Feels they are failing everywhere.',
      de: 'Zu viele Prioritäten bei Arbeit und Zuhause. Fühlt sich überall im Versagen.',
    },
    emotionalTone: { en: 'overwhelmed, scattered', de: 'überfordert, zerstreut' },
    hiddenAgenda: {
      en: 'Perfectionism — believes they must excel in every role simultaneously.',
      de: 'Perfektionismus — glaubt, in jeder Rolle gleichzeitig excellieren zu müssen.',
    },
  },
  {
    id: 'resistance-change',
    coacheeName: { en: 'Morgan', de: 'Morgan' },
    avatar: '/avatars/victor.png',
    concern: {
      en: 'Knows they should delegate more but keeps micromanaging. Defensive when challenged.',
      de: 'Weiß, dass mehr delegieren nötig ist, kontrolliert aber weiter. Defensiv bei Herausforderung.',
    },
    emotionalTone: { en: 'defensive, ambivalent', de: 'defensiv, ambivalent' },
    hiddenAgenda: {
      en: 'Equates control with being indispensable.',
      de: 'Gleicht Kontrolle mit Unersetzlichkeit.',
    },
  },
  {
    id: 'imposter-promotion',
    coacheeName: { en: 'Riley', de: 'Riley' },
    avatar: '/avatars/bekky.png',
    concern: {
      en: 'Recently promoted to lead a team. Feels like a fraud and hides uncertainty.',
      de: 'Kürzlich befördert, leitet jetzt ein Team. Fühlt sich wie ein Betrüger und verbirgt Unsicherheit.',
    },
    emotionalTone: { en: 'insecure, guarded', de: 'unsicher, verschlossen' },
    hiddenAgenda: {
      en: 'Considers declining stretch assignments to avoid exposure.',
      de: 'Erwägt, Stretch-Aufgaben abzulehnen, um nicht entlarvt zu werden.',
    },
  },
  {
    id: 'life-balance',
    coacheeName: { en: 'Quinn', de: 'Quinn' },
    avatar: '/avatars/dan.png',
    concern: {
      en: 'Working late every day while missing family time. Partner is unhappy.',
      de: 'Arbeitet täglich spät, verpasst Familienzeit. Partner ist unzufrieden.',
    },
    emotionalTone: { en: 'conflicted, tired', de: 'hin- und hergerissen, müde' },
    hiddenAgenda: {
      en: 'Uses work to avoid difficult conversations at home.',
      de: 'Nutzt Arbeit, um schwierige Gespräche zuhause zu vermeiden.',
    },
  },
];

const DIFFICULTY_MODIFIERS = {
  easy: {
    en: `BEHAVIOR (EASY): Be cooperative and clear. Answer questions directly. Share feelings openly. Mild emotion only. Do not resist the coach's approach.`,
    de: `VERHALTEN (LEICHT): Sei kooperativ und klar. Beantworte Fragen direkt. Teile Gefühle offen. Nur leichte Emotion. Leiste dem Coach-Ansatz keinen Widerstand.`,
  },
  moderate: {
    en: `BEHAVIOR (MODERATE): Be somewhat vague at first. Show mild resistance or incomplete disclosure. Need 2-3 good questions before opening up. Occasionally say "I'm not sure" or change subtopic briefly.`,
    de: `VERHALTEN (MITTEL): Sei anfangs etwas vage. Zeige leichten Widerstand oder unvollständige Offenlegung. Brauche 2-3 gute Fragen, bevor du dich öffnest. Sage gelegentlich "Ich weiß nicht" oder wechsle kurz das Unterthema.`,
  },
  challenging: {
    en: `BEHAVIOR (CHALLENGING): Show strong resistance, topic shifts, or emotional intensity. Test the coach — push back on advice, say "that won't work for me", or go silent briefly. Reveal hidden agenda only if the coach earns trust. Do not make it impossible — stay in character as a real client.`,
    de: `VERHALTEN (HERAUSFORDERND): Zeige starken Widerstand, Themenwechsel oder emotionale Intensität. Teste den Coach — wehre Ratschläge ab, sage "das funktioniert bei mir nicht" oder schweige kurz. Enthülle versteckte Agenda nur, wenn der Coach Vertrauen verdient. Bleib realistisch — kein unmöglicher Klient.`,
  },
};

function getScenarioById(id) {
  return SCENARIOS.find((s) => s.id === id) || null;
}

function getPublicScenarios(language = 'de') {
  const lang = language === 'en' ? 'en' : 'de';
  return SCENARIOS.map((s) => ({
    id: s.id,
    coacheeName: s.coacheeName[lang],
    avatar: s.avatar,
    concern: s.concern[lang],
    emotionalTone: s.emotionalTone[lang],
  }));
}

function getScenarioForPrompt(id, difficulty, language = 'de', focusNote = '') {
  const scenario = getScenarioById(id);
  if (!scenario) return null;
  const lang = language === 'en' ? 'en' : 'de';
  const diffKey = ['easy', 'moderate', 'challenging'].includes(difficulty) ? difficulty : 'moderate';
  return {
    coacheeName: scenario.coacheeName[lang],
    concern: scenario.concern[lang],
    emotionalTone: scenario.emotionalTone[lang],
    hiddenAgenda: scenario.hiddenAgenda[lang],
    difficultyModifier: DIFFICULTY_MODIFIERS[diffKey][lang],
    focusNote: focusNote || '',
  };
}

module.exports = {
  SCENARIOS,
  DIFFICULTY_MODIFIERS,
  getScenarioById,
  getPublicScenarios,
  getScenarioForPrompt,
};
