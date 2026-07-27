/**
 * Practice Lab config for Sam / forward-focused-coaching automated runs.
 * Stage goals drive adaptive coach turns; stage-complete scripts are dev fallback only.
 */

export type PracticeLabMode = 'adaptive' | 'scripted';

export const SAM_PRACTICE_FRAMEWORK_ID = 'forward-focused-coaching';
export const SAM_PRACTICE_BOT_ID = 'sam-forward-focused';
export const SAM_STAGE_COMPLETE_TURNS = 6;

export interface SamPracticeScenarioOption {
  id: string;
  labelKey: string;
}

/** Scenarios where forward-focused is primary or a strong alternative fit */
export const SAM_PRACTICE_SCENARIOS: SamPracticeScenarioOption[] = [
  { id: 'motivation-dip', labelKey: 'practice_lab_scenario_motivation_dip' },
  { id: 'relationship-boundary', labelKey: 'practice_lab_scenario_relationship_boundary' },
  { id: 'overwhelm', labelKey: 'practice_lab_scenario_overwhelm' },
];

export interface PracticeStageGoal {
  stage: string;
  goalEn: string;
  goalDe: string;
  /** Fixed coach text — scripted fallback only */
  scriptedEn: string;
  scriptedDe: string;
}

const STAGE_GOALS: Record<string, PracticeStageGoal[]> = {
  'motivation-dip': [
    {
      stage: 'session-focus',
      goalEn: 'Brief welcome and ask what they want from this session on motivation.',
      goalDe: 'Kurze Begrüßung und fragen, was sie aus der Session zur Motivation mitnehmen wollen.',
      scriptedEn: 'Thanks for being here — briefly: what do you want from our conversation today?',
      scriptedDe: 'Danke fürs Kommen — kurz: Was willst du aus unserem Gespräch heute?',
    },
    {
      stage: 'preferred-future',
      goalEn: 'Explore preferred future: motivation feeling solid again at work.',
      goalDe: 'Gewünschte Zukunft erkunden: Motivation fühlt sich wieder solide an.',
      scriptedEn: 'Picture motivation feeling solid again at work. What is different on that day?',
      scriptedDe: 'Stell dir vor, die Motivation ist wieder solide. Was ist an so einem Tag anders?',
    },
    {
      stage: 'exceptions',
      goalEn: 'Find exceptions — when was motivation already a bit higher recently?',
      goalDe: 'Ausnahmen finden — wann war die Motivation kürzlich schon etwas höher?',
      scriptedEn: 'When was the problem already a bit smaller recently — even one hour that felt better?',
      scriptedDe: 'Wann war das Problem kürzlich schon etwas kleiner — auch nur eine Stunde, die besser war?',
    },
    {
      stage: 'scaling',
      goalEn: 'Scaling question: where is motivation on 0–10 right now?',
      goalDe: 'Skalierung: Wo steht die Motivation auf 0–10 gerade?',
      scriptedEn: 'On a scale from 0 to 10, where is your motivation right now?',
      scriptedDe: 'Auf einer Skala von 0 bis 10 — wo ist deine Motivation gerade?',
    },
    {
      stage: 'scaling-plus-one',
      goalEn: 'Explore +1 — one small shift, not a leap.',
      goalDe: '+1 erkunden — eine kleine Verschiebung, kein Sprung.',
      scriptedEn: 'What would a +1 look like — not a leap, just one small shift?',
      scriptedDe: 'Wie sähe +1 aus — kein Sprung, nur eine kleine Verschiebung?',
    },
    {
      stage: 'close',
      goalEn: 'Close with one concrete commitment for this week.',
      goalDe: 'Abschluss mit einem konkreten Commitment für diese Woche.',
      scriptedEn: 'What one step from that +1 will you take this week? Let\'s close with that commitment — thank you.',
      scriptedDe: 'Welchen einen Schritt aus dem +1 gehst du diese Woche? Darauf schließen wir ab — danke.',
    },
  ],
  'relationship-boundary': [
    {
      stage: 'session-focus',
      goalEn: 'Brief session focus on the relationship boundary topic.',
      goalDe: 'Kurzer Session-Fokus zum Thema Beziehungsgrenze.',
      scriptedEn: 'Briefly: what do you want from this session about the relationship boundary?',
      scriptedDe: 'Kurz: Was willst du aus der Session zur Beziehungsgrenze?',
    },
    {
      stage: 'preferred-future',
      goalEn: 'Preferred future when the boundary feels healthy and respectful.',
      goalDe: 'Wunschbild, wenn die Grenze gesund und respektvoll ist.',
      scriptedEn: 'If the boundary feels healthy, what do you say, do, or feel differently?',
      scriptedDe: 'Wenn die Grenze gesund ist — was sagst, tust oder fühlst du anders?',
    },
    {
      stage: 'exceptions',
      goalEn: 'Exceptions — when was the boundary already somewhat in place?',
      goalDe: 'Ausnahmen — wann war die Grenze schon etwas da?',
      scriptedEn: 'When was it already a bit better — even one exchange that felt more respectful?',
      scriptedDe: 'Wann war es schon etwas besser — auch nur ein respektvollerer Austausch?',
    },
    {
      stage: 'scaling',
      goalEn: 'Scaling: how close to the preferred future on 0–10?',
      goalDe: 'Skalierung: Wie nah am Wunschbild auf 0–10?',
      scriptedEn: 'On 0–10, how close are you to that preferred future today?',
      scriptedDe: 'Auf 0–10, wie nah bist du heute an diesem Wunschbild?',
    },
    {
      stage: 'scaling-plus-one',
      goalEn: '+1 toward the preferred future — one small realistic step.',
      goalDe: '+1 Richtung Wunschbild — ein kleiner realistischer Schritt.',
      scriptedEn: 'What would +1 look like — one small action or phrase?',
      scriptedDe: 'Wie sähe +1 aus — eine kleine Handlung oder Formulierung?',
    },
    {
      stage: 'close',
      goalEn: 'Close with a +1 commitment for this week.',
      goalDe: 'Abschluss mit +1-Commitment für diese Woche.',
      scriptedEn: 'Which +1 step will you try this week? Let\'s close on that commitment.',
      scriptedDe: 'Welchen +1-Schritt probierst du diese Woche? Abschluss mit diesem Commitment.',
    },
  ],
  overwhelm: [
    {
      stage: 'session-focus',
      goalEn: 'Brief session focus on overwhelm.',
      goalDe: 'Kurzer Session-Fokus zur Überforderung.',
      scriptedEn: 'Brief session focus: what do you want from us in the next 30 minutes?',
      scriptedDe: 'Kurzer Session-Fokus: Was willst du in den nächsten 30 Minuten?',
    },
    {
      stage: 'preferred-future',
      goalEn: 'Preferred future when overwhelm eases — first sign on a good day.',
      goalDe: 'Wunschbild wenn Überforderung nachlässt — erstes Zeichen an einem guten Tag.',
      scriptedEn: 'If overwhelm eases, what is the first sign on a good day?',
      scriptedDe: 'Wenn die Überforderung nachlässt — was ist das erste Zeichen an einem guten Tag?',
    },
    {
      stage: 'exceptions',
      goalEn: 'Exceptions — when was overwhelm already lighter recently?',
      goalDe: 'Ausnahmen — wann war es schon etwas leichter?',
      scriptedEn: 'When was it already a bit lighter — a morning, task, or conversation that helped?',
      scriptedDe: 'Wann war es schon etwas leichter — ein Morgen, eine Aufgabe, ein Gespräch?',
    },
    {
      stage: 'scaling',
      goalEn: 'Scaling: where on 0–10 for overwhelm right now?',
      goalDe: 'Skalierung: Wo auf 0–10 bei Überforderung?',
      scriptedEn: 'Where are you on 0–10 for overwhelm right now?',
      scriptedDe: 'Wo stehst du auf 0–10 bei Überforderung?',
    },
    {
      stage: 'scaling-plus-one',
      goalEn: '+1 toward manageable — one small relief, not fixing everything.',
      goalDe: '+1 Richtung handhabbar — kleine Entlastung, nicht alles fixen.',
      scriptedEn: 'What would +1 look like — one small relief, not fixing everything?',
      scriptedDe: 'Wie sähe +1 aus — eine kleine Entlastung, nicht alles fixen?',
    },
    {
      stage: 'close',
      goalEn: 'Close with one +1 action for this week.',
      goalDe: 'Abschluss mit einer +1-Aktion für diese Woche.',
      scriptedEn: 'What one +1 action will you take this week? Let\'s close there — thank you.',
      scriptedDe: 'Welche +1-Aktion nimmst du diese Woche? Abschluss damit — danke.',
    },
  ],
};

export function getSamStageGoals(scenarioId: string): PracticeStageGoal[] {
  return STAGE_GOALS[scenarioId] ?? STAGE_GOALS['motivation-dip'];
}

export function getScriptedCoachText(
  scenarioId: string,
  turnIndex: number,
  language: 'de' | 'en',
): string {
  const goals = getSamStageGoals(scenarioId);
  const goal = goals[turnIndex] ?? goals[goals.length - 1];
  return language === 'de' ? goal.scriptedDe : goal.scriptedEn;
}

export function getStageGoalText(
  scenarioId: string,
  turnIndex: number,
  language: 'de' | 'en',
): string {
  const goals = getSamStageGoals(scenarioId);
  const goal = goals[turnIndex] ?? goals[goals.length - 1];
  return language === 'de' ? goal.goalDe : goal.goalEn;
}

export function getPracticeLabModeLabelKey(mode: PracticeLabMode): string {
  switch (mode) {
    case 'adaptive':
      return 'practice_lab_mode_adaptive';
    case 'scripted':
      return 'practice_lab_mode_scripted';
    default:
      return 'practice_lab_mode_adaptive';
  }
}
