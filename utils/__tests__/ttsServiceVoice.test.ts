import {
  getBestServerVoiceForBot,
  resolveServerVoiceIdForSynthesis,
} from '../ttsVoiceSelection';

describe('ttsService voice selection', () => {
  it('maps practice female coachee to Amy', () => {
    expect(getBestServerVoiceForBot('practice-coachee-female', 'en')).toBe('en-amy');
    expect(getBestServerVoiceForBot('practice-coachee-female', 'de')).toBe('de-eva');
  });

  it('maps practice male coachee to Ryan / Thorsten', () => {
    expect(getBestServerVoiceForBot('practice-coachee-male', 'en')).toBe('en-ryan');
    expect(getBestServerVoiceForBot('practice-coachee-male', 'de')).toBe('de-thorsten');
  });

  it('passes null voice id in auto server mode so backend picks by bot', () => {
    expect(resolveServerVoiceIdForSynthesis('server', true, 'en-ryan')).toBeNull();
    expect(resolveServerVoiceIdForSynthesis('server', false, 'en-amy')).toBe('en-amy');
    expect(resolveServerVoiceIdForSynthesis('local', true, 'Karen')).toBeNull();
  });
});
