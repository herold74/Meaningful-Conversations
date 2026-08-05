/**
 * Blind contracting scenarios — distinct topics from method/scenario practice (anti-cheat).
 * Same avatar roster style; concerns hidden until evaluation.
 */

const {
  getCoacheeGenderFromAvatar,
  resolveCoacheeGender,
} = require('./avatarGender.js');

const CONTRACTING_SCENARIOS = [
  {
    id: 'contract-return-work',
    coacheeName: { en: 'Nina', de: 'Nina' },
    coacheeGender: 'female',
    avatar: '/avatars/chloe.png',
    concern: {
      en: 'Returning from parental leave and unsure how to re-enter the team without losing credibility or boundaries.',
      de: 'Kommt aus der Elternzeit zurück und ist unsicher, wie sie ins Team zurückfindet, ohne Glaubwürdigkeit oder Grenzen zu verlieren.',
    },
    emotionalTone: { en: 'cautious, self-doubting', de: 'vorsichtig, selbstzweifelnd' },
    hiddenAgenda: {
      en: 'Secretly hopes the coach will tell them to reduce hours instead of asking for what they need.',
      de: 'Hofft heimlich, der Coach rate zu weniger Stunden, statt sie zu fragen, was sie wirklich brauchen.',
    },
  },
  {
    id: 'contract-sibling-estate',
    coacheeName: { en: 'Leo', de: 'Leo' },
    coacheeGender: 'male',
    avatar: '/avatars/victor.png',
    concern: {
      en: 'Locked in a bitter dispute with a sibling over an inheritance and unable to speak without escalating.',
      de: 'Steckt in einem bitteren Erbe-Streit mit einem Geschwisterteil fest und kann nicht sprechen, ohne es zu eskalieren.',
    },
    emotionalTone: { en: 'angry, hurt', de: 'wütend, verletzt' },
    hiddenAgenda: {
      en: 'Wants permission to cut contact entirely rather than repair the relationship.',
      de: 'Sucht Erlaubnis, den Kontakt ganz abzubrechen, statt die Beziehung zu reparieren.',
    },
  },
  {
    id: 'contract-anxiety-help',
    coacheeName: { en: 'Clara', de: 'Clara' },
    coacheeGender: 'female',
    avatar: '/avatars/ava.png',
    concern: {
      en: 'Rising anxiety before meetings and wondering whether they need therapy, coaching, or just a vacation.',
      de: 'Steigende Angst vor Meetings und unsicher, ob Therapie, Coaching oder nur Urlaub helfen würde.',
    },
    emotionalTone: { en: 'nervous, searching', de: 'nervös, suchend' },
    hiddenAgenda: {
      en: 'Afraid of being judged if they admit panic symptoms.',
      de: 'Hat Angst vor Bewertung, wenn sie Paniksymptome zugibt.',
    },
  },
  {
    id: 'contract-new-manager',
    coacheeName: { en: 'David', de: 'David' },
    coacheeGender: 'male',
    avatar: '/avatars/max.png',
    concern: {
      en: 'Recently became manager; the team treats them like a peer and ignores their decisions.',
      de: 'Ist kürzlich Manager geworden; das Team behandelt ihn wie einen Peer und ignoriert Entscheidungen.',
    },
    emotionalTone: { en: 'frustrated, embarrassed', de: 'frustriert, verlegen' },
    hiddenAgenda: {
      en: 'Considers reverting to an individual contributor role but fears looking like a failure.',
      de: 'Erwägt Rückkehr zur Fachrolle, fürchtet aber, als Versager zu gelten.',
    },
  },
  {
    id: 'contract-side-project',
    coacheeName: { en: 'Anna', de: 'Anna' },
    coacheeGender: 'female',
    avatar: '/avatars/bekky.png',
    concern: {
      en: 'Passionate about a side project but exhausted from juggling it with a demanding day job.',
      de: 'Begeistert von einem Nebenprojekt, aber erschöpft vom Jonglieren mit anspruchsvollem Tagesjob.',
    },
    emotionalTone: { en: 'excited but drained', de: 'begeistert, aber erschöpft' },
    hiddenAgenda: {
      en: 'Already decided to quit the day job and wants the coach to validate the leap.',
      de: 'Hat innerlich bereits gekündigt und will vom Coach den Sprung bestätigt bekommen.',
    },
  },
  {
    id: 'contract-volunteer-no',
    coacheeName: { en: 'Markus', de: 'Markus' },
    coacheeGender: 'male',
    avatar: '/avatars/kenji.png',
    concern: {
      en: 'Pressured to join a volunteer board role and cannot find words to decline without guilt.',
      de: 'Unter Druck, ein Ehrenamt im Vorstand anzunehmen, und findet keine Worte für ein schuldfreies Nein.',
    },
    emotionalTone: { en: 'obligated, resentful', de: 'verpflichtet, verbittert' },
    hiddenAgenda: {
      en: 'Believes saying no will damage their reputation in the community.',
      de: 'Glaubt, Nein sagen schade seinem Ruf in der Community.',
    },
  },
  {
    id: 'contract-remote-isolation',
    coacheeName: { en: 'Oliver', de: 'Oliver' },
    coacheeGender: 'male',
    avatar: '/avatars/dan.png',
    concern: {
      en: 'Works fully remote, feels invisible, and misses casual belonging at the office.',
      de: 'Arbeitet voll remote, fühlt sich unsichtbar und vermisst informelle Zugehörigkeit im Büro.',
    },
    emotionalTone: { en: 'lonely, flat', de: 'einsam, flat' },
    hiddenAgenda: {
      en: 'Uses isolation to avoid performance conversations they fear.',
      de: 'Nutzt Isolation, um Leistungsgespräche zu vermeiden, die er fürchtet.',
    },
  },
  {
    id: 'contract-ethics-dilemma',
    coacheeName: { en: 'Elena', de: 'Elena' },
    coacheeGender: 'female',
    avatar: '/avatars/bekky.png',
    concern: {
      en: 'Witnessed something ethically questionable at work and fears retaliation if they speak up.',
      de: 'Hat etwas ethisch Fragwürdiges bei der Arbeit mitbekommen und fürchtet Repressalien, wenn sie sich meldet.',
    },
    emotionalTone: { en: 'tense, vigilant', de: 'angespannt, wachsam' },
    hiddenAgenda: {
      en: 'Wants the coach to tell them exactly what to do legally rather than explore their values.',
      de: 'Will vom Coach eine klare Anweisung, statt eigene Werte zu erkunden.',
    },
  },
  {
    id: 'contract-teen-talk',
    coacheeName: { en: 'Nadia', de: 'Nadia' },
    coacheeGender: 'female',
    avatar: '/avatars/nadia.png',
    concern: {
      en: 'Needs to address their teenager\'s slipping grades but every attempt turns into shouting.',
      de: 'Muss die schlechteren Noten des Teenagers ansprechen, aber jedes Gespräch endet im Schreien.',
    },
    emotionalTone: { en: 'helpless, guilty', de: 'hilflos, schuldig' },
    hiddenAgenda: {
      en: 'Blames themselves for being too permissive years ago.',
      de: 'Gibt sich selbst die Schuld, früher zu nachgiebig gewesen zu sein.',
    },
  },
  {
    id: 'contract-midlife-restless',
    coacheeName: { en: 'Martin', de: 'Martin' },
    coacheeGender: 'male',
    avatar: '/avatars/martin.png',
    concern: {
      en: 'Successful on paper but restless — something feels missing without being able to name it.',
      de: 'Auf dem Papier erfolgreich, aber unruhig — etwas fehlt, ohne es benennen zu können.',
    },
    emotionalTone: { en: 'restless, vague', de: 'unruhig, vage' },
    hiddenAgenda: {
      en: 'Secretly envies a friend who changed careers and fears it is too late.',
      de: 'Beneidet heimlich eine Freundin, die die Karriere gewechselt hat, und fürchtet, es sei zu spät.',
    },
  },
  {
    id: 'contract-public-mistake',
    coacheeName: { en: 'Emma', de: 'Emma' },
    coacheeGender: 'female',
    avatar: '/avatars/gloria.png',
    concern: {
      en: 'Made a visible mistake in a client meeting and cannot stop replaying it.',
      de: 'Hat in einem Kundentermin einen sichtbaren Fehler gemacht und kann nicht aufhören, ihn abzuspulen.',
    },
    emotionalTone: { en: 'ashamed, hypervigilant', de: 'beschämt, hypervigilant' },
    hiddenAgenda: {
      en: 'Avoids the next client call and hopes the coach offers a script to fix it.',
      de: 'Vermeidet den nächsten Kundentermin und hofft auf ein Skript vom Coach.',
    },
  },
  {
    id: 'contract-relocation',
    coacheeName: { en: 'Sophie', de: 'Sophie' },
    coacheeGender: 'female',
    avatar: '/avatars/gabrielle.png',
    concern: {
      en: 'Partner wants to relocate abroad; they are torn between love and their established career.',
      de: 'Partner will ins Ausland ziehen; hin- und hergerissen zwischen Beziehung und etablierter Karriere.',
    },
    emotionalTone: { en: 'conflicted, sad', de: 'hin- und hergerissen, traurig' },
    hiddenAgenda: {
      en: 'Already leaning toward staying but needs cover for choosing career over relationship.',
      de: 'Neigt bereits zum Bleiben, braucht aber Rückendeckung für Karriere vor Beziehung.',
    },
  },
];

function getContractingScenarioById(id) {
  return CONTRACTING_SCENARIOS.find((s) => s.id === id) || null;
}

function getPublicContractingScenarios(language = 'de') {
  const lang = language === 'en' ? 'en' : 'de';
  return CONTRACTING_SCENARIOS.map((s) => ({
    id: s.id,
    coacheeName: s.coacheeName[lang],
    avatar: s.avatar,
    coacheeGender: resolveCoacheeGender(s),
  }));
}

module.exports = {
  CONTRACTING_SCENARIOS,
  getContractingScenarioById,
  getPublicContractingScenarios,
};
