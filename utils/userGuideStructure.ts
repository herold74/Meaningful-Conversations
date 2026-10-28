/**
 * User guide chapter/section numbering depends on platform and access tier.
 * Deep links must use stable fragment IDs (USER_GUIDE_ANCHORS), never section numbers.
 */

export const coachingChapterNum = (isNative: boolean, isRegistered: boolean): number =>
  (isNative ? 3 : 4) + (isRegistered ? 1 : 0);

export const profileChapterNum = (isNative: boolean): number => (isNative ? 3 : 4);

export const connectorChapterNum = (isNative: boolean, isRegistered: boolean): number =>
  coachingChapterNum(isNative, isRegistered) + 1;

export const sessionReviewChapterNum = (isNative: boolean, isRegistered: boolean): number =>
  coachingChapterNum(isNative, isRegistered) + 2;

export const gamificationChapterNum = (isNative: boolean, isRegistered: boolean): number =>
  coachingChapterNum(isNative, isRegistered) + 3;

/** Premium handbook chapters (always use registered coaching index as base). */
export const transcriptEvalChapterNum = (isNative: boolean): number =>
  coachingChapterNum(isNative, true) + 4;

export const audioTranscriptionChapterNum = (isNative: boolean): number =>
  coachingChapterNum(isNative, true) + 5;

export const coachPracticeChapterNum = (isNative: boolean): number =>
  coachingChapterNum(isNative, true) + 6;

export interface CoachingSessionSubsections {
  chapter: number;
  coachSelect: string;
  transcriptTools: string | null;
  practiceTab: string | null;
  coachRecommendation: string;
  chatInterface: string;
}

/** Subsection labels inside «Die Coaching-Sitzung» — skip optional blocks when not in the rendered handbook. */
export function computeCoachingSessionSubsections(ctx: {
  isNative: boolean;
  isRegistered: boolean;
  showTranscriptTools: boolean;
  showPracticeTab: boolean;
}): CoachingSessionSubsections {
  const chapter = coachingChapterNum(ctx.isNative, ctx.isRegistered);
  let index = 0;
  const next = () => `${chapter}.${++index}`;

  const coachSelect = next();
  const transcriptTools = ctx.showTranscriptTools ? next() : null;
  const practiceTab = ctx.showPracticeTab ? next() : null;
  const coachRecommendation = next();
  const chatInterface = next();

  return {
    chapter,
    coachSelect,
    transcriptTools,
    practiceTab,
    coachRecommendation,
    chatInterface,
  };
}

export interface SessionReviewSubsections {
  analysis: string;
  reviewScreen: string;
  dpfl: string | null;
}

export function computeSessionReviewSubsections(ctx: {
  isNative: boolean;
  isRegistered: boolean;
  showDpflBlock: boolean;
}): SessionReviewSubsections {
  const chapter = sessionReviewChapterNum(ctx.isNative, ctx.isRegistered);
  let index = 0;
  const next = () => `${chapter}.${++index}`;
  const analysis = next();
  const reviewScreen = next();
  const dpfl = ctx.showDpflBlock ? next() : null;
  return { analysis, reviewScreen, dpfl };
}

export interface ProfileSubsections {
  chapter: number;
  overview: string;
  tests: string;
  signature: string;
  coachingModes: string;
}

export function computeProfileSubsections(isNative: boolean): ProfileSubsections {
  const chapter = profileChapterNum(isNative);
  let index = 0;
  const next = () => `${chapter}.${++index}`;
  return {
    chapter,
    overview: next(),
    tests: next(),
    signature: next(),
    coachingModes: next(),
  };
}

export interface GamificationSubsections {
  chapter: number;
  intro: string;
  earnXp: string;
  storage: string;
  appearance: string;
}

export function computeGamificationSubsections(
  isNative: boolean,
  isRegistered: boolean,
): GamificationSubsections {
  const chapter = gamificationChapterNum(isNative, isRegistered);
  let index = 0;
  const next = () => `${chapter}.${++index}`;
  return {
    chapter,
    intro: next(),
    earnXp: next(),
    storage: next(),
    appearance: next(),
  };
}

/** Stable handbook section titles for deep-link copy — prefer these over section numbers in cross-refs. */
export const USER_GUIDE_SECTION_TITLES_DE = {
  chatInterface: 'Die Chat-Oberfläche',
  sessionReview: 'Nach der Sitzung — Der Analyseprozess',
  connector: 'The Connector',
  transcriptTools: 'Transkript-Tools',
  coachPracticeTab: 'Coaching üben',
  contextChoice: 'Kontextauswahl',
} as const;

export const USER_GUIDE_SECTION_TITLES_EN = {
  chatInterface: 'The Chat Interface',
  sessionReview: 'After the Session — The Review Process',
  connector: 'The Connector',
  transcriptTools: 'Transcript Tools',
  coachPracticeTab: 'Coach Practice',
  contextChoice: 'Context Choice',
} as const;

/** Cross-reference helper: «Title» with optional dynamic section number when the block is in the reader's handbook. */
export function handbookSectionRef(
  language: 'de' | 'en',
  titleKey: keyof typeof USER_GUIDE_SECTION_TITLES_DE,
  sectionNum: string | null,
): string {
  const title =
    language === 'de'
      ? USER_GUIDE_SECTION_TITLES_DE[titleKey]
      : USER_GUIDE_SECTION_TITLES_EN[titleKey];
  if (!sectionNum) return `«${title}»`;
  const label = language === 'de' ? 'Abschnitt' : 'Section';
  return `«${title}» (${label} ${sectionNum})`;
}
