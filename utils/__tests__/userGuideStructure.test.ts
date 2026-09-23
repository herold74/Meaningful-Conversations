import { computeCoachingSessionSubsections } from '../userGuideStructure';

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
    expect(sub.connector).toBe('4.2');
    expect(sub.coachRecommendation).toBe('4.3');
    expect(sub.chatInterface).toBe('4.4');
  });

  it('includes premium blocks in the count (web registered + premium handbook)', () => {
    const sub = computeCoachingSessionSubsections({
      isNative: false,
      isRegistered: true,
      showTranscriptTools: true,
      showPracticeTab: true,
    });
    expect(sub.chapter).toBe(5);
    expect(sub.chatInterface).toBe('5.6');
  });
});
