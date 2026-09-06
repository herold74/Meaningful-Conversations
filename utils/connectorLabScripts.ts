/**
 * Connector Lab — vignette catalog + scripted optimal user turns for admin QA.
 * Keep in sync with meaningful-conversations-backend/connector/vignettes.js
 */

export type ConnectorLabVignetteId =
  | 'jonas-meeting'
  | 'leila-breakup'
  | 'tom-vancouver'
  | 'carmen-mia'
  | 'david-exhaustion';

export interface ConnectorLabVignetteOption {
  id: ConnectorLabVignetteId;
  labelKey: string;
  personaName: string;
  primaryDimensions: string[];
}

export const CONNECTOR_LAB_VIGNETTES: ConnectorLabVignetteOption[] = [
  { id: 'jonas-meeting', labelKey: 'connector_lab_vignette_jonas', personaName: 'Jonas', primaryDimensions: ['empathy', 'steadiness'] },
  { id: 'leila-breakup', labelKey: 'connector_lab_vignette_leila', personaName: 'Leila', primaryDimensions: ['presence', 'curiosity'] },
  { id: 'tom-vancouver', labelKey: 'connector_lab_vignette_tom', personaName: 'Tom', primaryDimensions: ['curiosity', 'nonJudgment'] },
  { id: 'carmen-mia', labelKey: 'connector_lab_vignette_carmen', personaName: 'Carmen', primaryDimensions: ['nonJudgment', 'empathy'] },
  { id: 'david-exhaustion', labelKey: 'connector_lab_vignette_david', personaName: 'David', primaryDimensions: ['presence', 'steadiness'] },
];

/** Bot opening lines (public vignette copy). */
export const CONNECTOR_LAB_OPENINGS: Record<ConnectorLabVignetteId, { de: string; en: string }> = {
  'jonas-meeting': {
    de: 'Sorry, ich muss das kurz loswerden. Was Bernhard heute im Meeting abgezogen hat — vor dem ganzen Team! Ich weiß gerade ehrlich nicht, ob ich kündigen oder ihm eine Mail schreiben soll, die er nie vergisst.',
    en: "Sorry, I just need to get this off my chest. What Bernhard pulled in that meeting today — in front of the whole team! Honestly, right now I don't know whether to quit or write him an email he'll never forget.",
  },
  'leila-breakup': {
    de: "Ich hab's ja selbst beendet, also darf ich mich eigentlich gar nicht beschweren, oder? Aber heute Morgen stand seine Kaffeetasse noch im Schrank und ich hab einfach zehn Minuten geheult.",
    en: "I'm the one who ended it, so I don't really get to complain, right? But this morning his coffee mug was still in the cupboard and I just cried for ten minutes.",
  },
  'tom-vancouver': {
    de: 'Du, ich muss denen bis Freitag zusagen oder absagen. Vancouver. Ich hab Pro-und-Contra-Listen bis zum Abwinken und bin keinen Schritt weiter. Sag du\'s mir einfach: Was würdest du an meiner Stelle machen?',
    en: "Listen, I have to give them a yes or no by Friday. Vancouver. I've made endless pro-con lists and I'm not one step further. Just tell me: what would you do in my place?",
  },
  'carmen-mia': {
    de: 'Ich hab gestern was zu Mia gesagt, das ich sofort bereut hab. Sie hat die Tür zugeknallt und seitdem — Funkstille. Ich frag mich ernsthaft, was für eine Mutter so was sagt.',
    en: "Yesterday I said something to Mia that I regretted the second it came out. She slammed the door and since then — total silence. I'm seriously asking myself what kind of mother says something like that.",
  },
  'david-exhaustion': {
    de: 'Nee, alles gut bei mir. Bisschen viel um die Ohren halt. Ich merk nur, dass ich seit Wochen abends einfach nur noch aufs Sofa fall — nicht mal zum Klettern raff ich mich mehr auf. Aber gut, ist wahrscheinlich normal, oder?',
    en: "Nah, I'm fine. Just a lot on my plate. I've just noticed that for weeks now I basically collapse onto the sofa every evening — can't even get myself to go climbing anymore. But hey, that's probably normal, right?",
  },
};

/** Scripted user turns designed for high connection scores (regression baseline). */
export const CONNECTOR_LAB_SCRIPTED_TURNS: Record<
  ConnectorLabVignetteId,
  { de: string[]; en: string[] }
> = {
  'jonas-meeting': {
    de: [
      'Das klingt wirklich verletzend — vor dem ganzen Team so bloßgestellt zu werden. Ich kann verstehen, dass da Wut hochkommt.',
      'Unter der Wut höre ich auch etwas wie Scham, als ob da vielleicht ein Körnchen Wahrheit dran ist. Beides darf da sein.',
      'Du musst jetzt nichts entscheiden — weder Kündigung noch Mail. Was tut dir an dem Moment am meisten weh?',
      'Danke, dass du mir das anvertraust. Ich bin bei dir, ohne dass du gleich handeln musst.',
    ],
    en: [
      'That sounds really hurtful — being exposed like that in front of the whole team. I can see why anger is coming up.',
      'Underneath the anger I also hear some shame, as if maybe part of it stings because it might touch something true. Both can be there.',
      "You don't have to decide anything right now — no quitting, no email. What hurts most about that moment for you?",
      'Thank you for trusting me with this. I am with you — no need to act immediately.',
    ],
  },
  'leila-breakup': {
    de: [
      'Du darfst traurig sein — auch wenn du es selbst beendet hast. Beides schließt sich nicht aus.',
      'Die Kaffeetasse klingt nach etwas Konkretem, das gerade weh tut. Was ist in dir passiert, als du sie gesehen hast?',
      'Ich bleibe bei dir — erzähl mir, was du gerade am meisten spürst, ohne dass wir das wegargumentieren.',
      'Was bräuchtest du von mir in den nächsten Tagen, damit es sich ein bisschen weniger allein anfühlt?',
    ],
    en: [
      'You are allowed to be sad — even though you ended it. Both things can be true at once.',
      'The coffee mug sounds like something concrete that hurts right now. What happened inside you when you saw it?',
      'I am staying with you — tell me what you feel most right now without us arguing it away.',
      'What would you need from me in the next few days so it feels a little less lonely?',
    ],
  },
  'tom-vancouver': {
    de: [
      'Ich kann dir keine Entscheidung abnehmen — aber ich bin neugierig: Was wäre dir am schwersten zu verlieren?',
      'Wenn du an Vancouver denkst — was zieht dich dort hin, jenseits der Pro-Liste?',
      'Und was zieht dich zu dem, was du hier behalten würdest? Beides darf gleichzeitig wichtig sein.',
      'Wenn du Freitag stillhältst — was würde sich für dich „richtig" anfühlen, unabhängig von den Listen?',
    ],
    en: [
      "I can't make the decision for you — but I'm curious: what would feel hardest for you to lose?",
      'When you think about Vancouver — what pulls you there, beyond the pro list?',
      'And what pulls you toward what you would keep here? Both can matter at the same time.',
      'If you pause until Friday — what would feel "right" to you, independent of the lists?',
    ],
  },
  'carmen-mia': {
    de: [
      'Das klingt, als bereust du es wirklich — nicht oberflächlich, sondern im Kern.',
      'Du nimmst das ernst. Das sagt etwas darüber, wie wichtig eure Beziehung dir ist.',
      'Ich will dich weder freisprechen noch verurteilen. Was möchtest du Mia am liebsten sagen, wenn du könntest?',
      'Was hoffst du, passiert, wenn sie gleich reinkommt?',
    ],
    en: [
      'It sounds like you truly regret it — not superficially, but at the core.',
      'You are taking this seriously. That says something about how much the relationship matters to you.',
      'I do not want to absolve you or judge you. What would you most want to say to Mia if you could?',
      'What do you hope happens when she walks in?',
    ],
  },
  'david-exhaustion': {
    de: [
      'Ich höre, dass da mehr ist als nur „viel los". Du klingst wirklich erschöpft.',
      'Dass du nicht mehr klettern gehst — das klingt für mich nicht nach „alles gut".',
      'Ich dränge nicht — aber ich bleibe gern bei dem, was du gerade gesagt hast. Was passiert abends auf dem Sofa?',
      'Danke, dass du das teilst. Ich bin hier, ohne dir eine Diagnose zu geben.',
    ],
    en: [
      'I hear that there is more than just "a lot going on". You really sound exhausted.',
      'That you are not climbing anymore — that does not sound like "all good" to me.',
      'I will not push — but I am happy to stay with what you just said. What happens on the sofa in the evenings?',
      'Thank you for sharing that. I am here without giving you a diagnosis.',
    ],
  },
};

export function getConnectorLabOpening(vignetteId: ConnectorLabVignetteId, language: 'de' | 'en'): string {
  return CONNECTOR_LAB_OPENINGS[vignetteId][language];
}

export function getConnectorLabScriptedTurns(
  vignetteId: ConnectorLabVignetteId,
  language: 'de' | 'en',
): string[] {
  return CONNECTOR_LAB_SCRIPTED_TURNS[vignetteId][language];
}
