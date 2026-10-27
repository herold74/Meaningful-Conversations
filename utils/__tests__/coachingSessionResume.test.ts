import {
  canOfferCoachingSessionResume,
  COACHING_RESUME_BLOCKED_VIEWS,
} from '../coachingSessionResume';

describe('coachingSessionResume', () => {
  it('blocks resume on pre-auth views', () => {
    for (const view of COACHING_RESUME_BLOCKED_VIEWS) {
      expect(canOfferCoachingSessionResume(view)).toBe(false);
    }
  });

  it('allows resume after auth path (landing, botSelection, intentPicker)', () => {
    expect(canOfferCoachingSessionResume('landing')).toBe(true);
    expect(canOfferCoachingSessionResume('botSelection')).toBe(true);
    expect(canOfferCoachingSessionResume('intentPicker')).toBe(true);
    expect(canOfferCoachingSessionResume('contextChoice')).toBe(true);
  });
});
