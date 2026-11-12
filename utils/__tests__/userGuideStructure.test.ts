import {
  coachPracticeChapterNum,
  computeCoachingSessionSubsections,
  connectorChapterNum,
  sessionReviewChapterNum,
  transcriptEvalChapterNum,
} from '../userGuideStructure';

describe('computeCoachingSessionSubsections', () => {
  it('re-numbers chat section when optional blocks are hidden (web guest)', () => {
    const sub = computeCoachingSessionSubsections({
      isNative: false,
      isRegistered: false,
      showTranscriptTools: false,
      showPracticeTab: false,
    });
    expect(sub.chapter).toBe(4);
    expect(sub.coachSelect).toBe('4.1');
    expect(sub.transcriptTools).toBeNull();
    expect(sub.practiceTab).toBeNull();
    expect(sub.coachRecommendation).toBe('4.2');
    expect(sub.chatInterface).toBe('4.3');
  });

  it('includes premium blocks in the count (web registered + premium handbook)', () => {
    const sub = computeCoachingSessionSubsections({
      isNative: false,
      isRegistered: true,
      showTranscriptTools: true,
      showPracticeTab: true,
    });
    expect(sub.chapter).toBe(5);
    expect(sub.chatInterface).toBe('5.5');
  });
});

describe('connector chapter numbering', () => {
  it('inserts connector after coaching session (web guest)', () => {
    expect(connectorChapterNum(false, false)).toBe(5);
    expect(sessionReviewChapterNum(false, false)).toBe(6);
  });

  it('shifts premium chapters after connector (web registered)', () => {
    expect(transcriptEvalChapterNum(false)).toBe(9);
    expect(coachPracticeChapterNum(false)).toBe(11);
  });
});
