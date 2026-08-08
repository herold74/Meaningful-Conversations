import {
  getBotSelectionSectionState,
  getHighlightSectionForIntent,
  isCoachPracticeIntent,
  normalizeUserIntent,
} from '../userIntent';

describe('userIntent', () => {
  it('normalizes legacy lifecoaching to coaching', () => {
    expect(normalizeUserIntent('lifecoaching')).toBe('coaching');
  });

  it('maps intents to highlight sections', () => {
    expect(getHighlightSectionForIntent('communication')).toBe('management');
    expect(getHighlightSectionForIntent('coaching')).toBe('topicSearch');
    expect(getHighlightSectionForIntent('coachPractice')).toBe('coachPractice');
  });

  it('returns coach practice section layout', () => {
    expect(getBotSelectionSectionState('coachPractice')).toEqual({
      kommunikationOpen: false,
      coachingOpen: true,
      clientOpen: false,
      coachingView: 'practice',
    });
  });

  it('opens coaching section for guest coaching intent', () => {
    expect(getBotSelectionSectionState('coaching', true)).toEqual({
      kommunikationOpen: false,
      coachingOpen: true,
      clientOpen: false,
      coachingView: 'coaches',
    });
  });

  it('collapses all sections for registered coaching intent', () => {
    expect(getBotSelectionSectionState('coaching')).toEqual({
      kommunikationOpen: false,
      coachingOpen: false,
      clientOpen: false,
      coachingView: 'coaches',
    });
  });

  it('detects coach practice intent', () => {
    expect(isCoachPracticeIntent('coachPractice')).toBe(true);
    expect(isCoachPracticeIntent('coaching')).toBe(false);
  });

  it('reads stored intent with migration via normalizeUserIntent', () => {
    expect(normalizeUserIntent('lifecoaching')).toBe('coaching');
  });
});
