/**
 * Coachee scenarios for Coach Practice mode (orthogonal to framework choice).
 */

const {
  CONTRACTING_SCENARIOS,
  getContractingScenarioById,
  getPublicContractingScenarios,
} = require('./contractingScenarios.js');
const {
  AVATAR_GENDER,
  getCoacheeGenderFromAvatar,
  resolveCoacheeGender,
} = require('./avatarGender.js');

const SCENARIOS = [
  {
    id: 'career-decision',
    coacheeName: { en: 'Lukas', de: 'Lukas' },
    coacheeGender: 'male',
    avatar: '/avatars/max.png',
    concern: {
      en: 'Is considering leaving a stable job for a startup offer and feels torn between security and growth.',
      de: 'Erwägt, einen stabilen Job für ein Startup-Angebot aufzugeben, und ist hin- und hergerissen zwischen Sicherheit und Wachstum.',
    },
    emotionalTone: { en: 'anxious but hopeful', de: 'ängstlich, aber hoffnungsvoll' },
    hiddenAgenda: {
      en: 'Secretly afraid of disappointing their parents who value stability.',
      de: 'Hat heimlich Angst, die Eltern zu enttäuschen, die Wert auf Stabilität legen.',
    },
  },
  {
    id: 'team-conflict',
    coacheeName: { en: 'Lisa', de: 'Lisa' },
    coacheeGender: 'female',
    avatar: '/avatars/ava.png',
    concern: {
      en: 'Has ongoing tension with a colleague who takes credit for their work and avoids confrontation.',
      de: 'Hat anhaltende Spannung mit einer Kollegin, die sich die eigene Arbeit aneignet, und meidet Konfrontation.',
    },
    emotionalTone: { en: 'frustrated, passive', de: 'frustriert, passiv' },
    hiddenAgenda: {
      en: 'Wants validation that leaving the team is justified.',
      de: 'Sucht Bestätigung dafür, dass ein Teamwechsel gerechtfertigt wäre.',
    },
  },
  {
    id: 'motivation-dip',
    coacheeName: { en: 'Jonas', de: 'Jonas' },
    coacheeGender: 'male',
    avatar: '/avatars/kenji.png',
    concern: {
      en: 'Has lost motivation on a long project, procrastinates, and feels guilty.',
      de: 'Hat bei einem langen Projekt die Motivation verloren, schiebt Aufgaben auf und fühlt sich schuldig.',
    },
    emotionalTone: { en: 'tired, self-critical', de: 'müde, selbstkritisch' },
    hiddenAgenda: {
      en: 'Actually burnt out but refuses to admit they need a break.',
      de: 'Ist eigentlich ausgebrannt, möchte aber nicht zugeben, dass eine Pause nötig ist.',
    },
  },
  {
    id: 'relationship-boundary',
    coacheeName: { en: 'Laura', de: 'Laura' },
    coacheeGender: 'female',
    avatar: '/avatars/chloe.png',
    concern: {
      en: 'A friend keeps dumping emotional problems late at night, and they are unsure how to set boundaries.',
      de: 'Eine Freundin entlädt sich abends regelmäßig emotional, und sie ist unsicher, wie sie angemessen Grenzen setzen kann.',
    },
    emotionalTone: { en: 'guilty, overwhelmed', de: 'schuldig, überfordert' },
    hiddenAgenda: {
      en: 'Fears being seen as selfish if they say no.',
      de: 'Hat Angst, egoistisch zu wirken, wenn sie Nein sagt.',
    },
  },
  {
    id: 'overwhelm',
    coacheeName: { en: 'Thomas', de: 'Thomas' },
    coacheeGender: 'male',
    avatar: '/avatars/rob.png',
    concern: {
      en: 'Has too many priorities at work and home and feels like they are failing everywhere.',
      de: 'Hat zu viele Prioritäten bei Arbeit und Zuhause und fühlt sich, überall zu scheitern.',
    },
    emotionalTone: { en: 'overwhelmed, scattered', de: 'überfordert, zerstreut' },
    hiddenAgenda: {
      en: 'Perfectionism — believes they must excel in every role simultaneously.',
      de: 'Perfektionismus — glaubt, in jeder Rolle gleichzeitig überzeugen zu müssen.',
    },
  },
  {
    id: 'resistance-change',
    coacheeName: { en: 'Marc', de: 'Marc' },
    coacheeGender: 'male',
    avatar: '/avatars/victor.png',
    concern: {
      en: 'Knows they should delegate more but keeps micromanaging and gets defensive when challenged.',
      de: 'Weiß, dass mehr delegiert werden müsste, kontrolliert aber weiterhin jedes Detail und reagiert defensiv auf kritische Rückmeldungen.',
    },
    emotionalTone: { en: 'defensive, ambivalent', de: 'defensiv, ambivalent' },
    hiddenAgenda: {
      en: 'Equates control with being indispensable.',
      de: 'Gleicht Kontrolle mit Unersetzlichkeit und hält sie für ein Zeichen, unverzichtbar zu sein.',
    },
  },
  {
    id: 'imposter-promotion',
    coacheeName: { en: 'Mia', de: 'Mia' },
    coacheeGender: 'female',
    avatar: '/avatars/bekky.png',
    concern: {
      en: 'Was recently promoted to lead a team, feels like a fraud, and hides their uncertainty.',
      de: 'Wurde kürzlich befördert und leitet nun ein Team, fühlt sich jedoch wie eine Betrügerin und verbirgt die eigene Unsicherheit.',
    },
    emotionalTone: { en: 'insecure, guarded', de: 'unsicher, verschlossen' },
    hiddenAgenda: {
      en: 'Considers declining stretch assignments to avoid exposure.',
      de: 'Erwägt, herausfordernde Zusatzaufgaben abzulehnen, um nicht als unfähig entlarvt zu werden.',
    },
  },
  {
    id: 'life-balance',
    coacheeName: { en: 'Felix', de: 'Felix' },
    coacheeGender: 'male',
    avatar: '/avatars/dan.png',
    concern: {
      en: 'Works late every day, misses family time, and their partner is unhappy.',
      de: 'Arbeitet täglich bis spät und verpasst deshalb Zeit mit der Familie; der Partner ist unzufrieden.',
    },
    emotionalTone: { en: 'conflicted, tired', de: 'hin- und hergerissen, müde' },
    hiddenAgenda: {
      en: 'Uses work to avoid difficult conversations at home.',
      de: 'Nutzt die Arbeit, um schwierige Gespräche zuhause zu vermeiden.',
    },
  },
  {
    id: 'career-plateau',
    coacheeName: { en: 'Chris', de: 'Chris' },
    coacheeGender: 'male',
    avatar: '/avatars/mike.png',
    concern: {
      en: 'Has been in the same role for years, performs well, but feels invisible and wonders if ambition still matters.',
      de: 'Ist seit Jahren in derselben Rolle, leistet gute Arbeit, fühlt sich aber unsichtbar und fragt sich, ob Ambition noch zählt.',
    },
    emotionalTone: { en: 'restless, quietly frustrated', de: 'unruhig, leise frustriert' },
    hiddenAgenda: {
      en: 'Secretly compares themselves to peers who were promoted and feels ashamed of wanting more.',
      de: 'Vergleicht sich heimlich mit beförderten Peers und schämt sich, mehr zu wollen.',
    },
  },
  {
    id: 'strategic-pivot',
    coacheeName: { en: 'Priya', de: 'Priya' },
    coacheeGender: 'female',
    avatar: '/avatars/gabrielle.png',
    concern: {
      en: 'Their industry is shifting fast; they must decide whether to pivot skills, change employers, or double down on the current path.',
      de: 'Die Branche verändert sich schnell; sie muss entscheiden, ob sie Fähigkeiten neu ausrichten, den Arbeitgeber wechseln oder am bisherigen Weg festhalten.',
    },
    emotionalTone: { en: 'analytical but anxious', de: 'analytisch, aber ängstlich' },
    hiddenAgenda: {
      en: 'Already leaning toward one option but wants the coach to validate it without doing the hard trade-off work.',
      de: 'Neigt bereits zu einer Option, will aber vom Coach Bestätigung, ohne die harte Abwägung selbst zu leisten.',
    },
  },
  {
    id: 'feedback-anxiety',
    coacheeName: { en: 'Julia', de: 'Julia' },
    coacheeGender: 'female',
    avatar: '/avatars/gloria.png',
    concern: {
      en: 'Dreads upcoming performance feedback, replays past criticism, and avoids asking for clarity from their manager.',
      de: 'Fürchtet anstehendes Performance-Feedback, grübelt über frühere Kritik nach und vermeidet, beim Manager nachzufragen.',
    },
    emotionalTone: { en: 'self-critical, guarded', de: 'selbstkritisch, verschlossen' },
    hiddenAgenda: {
      en: 'Interprets any constructive note as proof they do not belong in the role.',
      de: 'Deutet jede konstruktive Rückmeldung als Beweis, nicht zur Rolle zu passen.',
    },
  },
  {
    id: 'stuck-metaphor',
    coacheeName: { en: 'Roland', de: 'Roland' },
    coacheeGender: 'male',
    avatar: '/avatars/sam.png',
    concern: {
      en: 'Feels like walking through fog at work — stuck in mud, can’t see the path ahead, and keeps circling the same worries without naming a concrete problem.',
      de: 'Fühlt sich bei der Arbeit an wie im Nebel — im Matsch fest, sieht keinen Weg voraus und kreist immer wieder um dieselben Sorgen, ohne ein konkretes Problem zu benennen.',
    },
    emotionalTone: { en: 'vague, metaphorical, weary', de: 'vage, bildhaft, müde' },
    hiddenAgenda: {
      en: 'Knows something must change but resists pinning it down because naming it makes it real.',
      de: 'Weiß, dass sich etwas ändern muss, wehrt sich aber dagegen, es zu benennen — Benennen macht es real.',
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
  hard: {
    en: `BEHAVIOR (HARD): Very strong resistance — deflect with "yes, but...", skepticism, brief silences ("..."), or emotional spikes. Bring secondary stressors into the conversation. Push back on the coach's approach. Reveal the hidden agenda only after sustained trust-building. Stay realistic and completable — not impossible.`,
    de: `VERHALTEN (SCHWER): Sehr starker Widerstand — ausweichen mit "ja, aber...", Skepsis, kurze Pausen ("...") oder emotionale Ausbrüche. Bringe Nebenstressoren ins Gespräch. Wehre den Coach-Ansatz ab. Enthülle die versteckte Agenda erst nach anhaltendem Vertrauensaufbau. Bleib realistisch und lösbar — kein unmöglicher Klient.`,
  },
};

function getScenarioById(id) {
  return SCENARIOS.find((s) => s.id === id)
    || getContractingScenarioById(id)
    || null;
}

function getPublicScenarios(language = 'de') {
  const lang = language === 'en' ? 'en' : 'de';
  return SCENARIOS.map((s) => ({
    id: s.id,
    coacheeName: s.coacheeName[lang],
    avatar: s.avatar,
    coacheeGender: resolveCoacheeGender(s),
    concern: s.concern[lang],
    emotionalTone: s.emotionalTone[lang],
  }));
}

function getScenarioForPrompt(id, difficulty, language = 'de', focusNote = '') {
  const scenario = getScenarioById(id);
  if (!scenario) return null;
  const lang = language === 'en' ? 'en' : 'de';
  const diffKey = ['easy', 'moderate', 'challenging', 'hard'].includes(difficulty) ? difficulty : 'moderate';
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
  CONTRACTING_SCENARIOS,
  AVATAR_GENDER,
  getCoacheeGenderFromAvatar,
  resolveCoacheeGender,
  DIFFICULTY_MODIFIERS,
  getScenarioById,
  getPublicScenarios,
  getPublicContractingScenarios,
  getContractingScenarioById,
  getScenarioForPrompt,
};
