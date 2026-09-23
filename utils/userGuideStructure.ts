/**
 * User guide chapter/section numbering depends on platform and access tier.
 * Deep links must use stable fragment IDs (USER_GUIDE_ANCHORS), never section numbers.
 */

export const coachingChapterNum = (isNative: boolean, isRegistered: boolean): number =>
  (isNative ? 3 : 4) + (isRegistered ? 1 : 0);

export const profileChapterNum = (isNative: boolean): number => (isNative ? 3 : 4);

export interface CoachingSessionSubsections {
  chapter: number;
  coachSelect: string;
  transcriptTools: string | null;
  practiceTab: string | null;
  connector: string;
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
  const connector = next();
  const coachRecommendation = next();
  const chatInterface = next();

  return {
    chapter,
    coachSelect,
    transcriptTools,
    practiceTab,
    connector,
    coachRecommendation,
    chatInterface,
  };
}

/** Stable handbook section titles for deep-link copy (DE) — not numbered. */
export const USER_GUIDE_SECTION_TITLES_DE = {
  chatInterface: 'Die Chat-Oberfläche',
  sessionReview: 'Nach der Sitzung — Der Analyseprozess',
  connector: 'The Connector',
} as const;

export const USER_GUIDE_SECTION_TITLES_EN = {
  chatInterface: 'The Chat Interface',
  sessionReview: 'After the Session — The Review Process',
  connector: 'The Connector',
} as const;
