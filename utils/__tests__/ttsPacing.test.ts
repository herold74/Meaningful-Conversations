import { applyTtsPacingMarkers } from '../ttsPacing';

const GLORIA_CHECKIN = `Quick check-in: When Nina says she's nervous about the review, how do you want to respond in the moment? What's one phrase or question you could use to acknowledge her feelings first? (Example: "It sounds like this is weighing on you—what's the hardest part about it?")

After that, we'll lock in your one small next step.`;

describe('applyTtsPacingMarkers', () => {
  it('turns em dash in examples into comma pause (not a glued hyphen)', () => {
    const out = applyTtsPacingMarkers(
      'It sounds like this is weighing on you—what\'s the hardest part about it?',
    );
    expect(out).toContain('you, what');
    expect(out).not.toMatch(/you-what/i);
  });

  it('turns empty lines between blocks into comma pauses', () => {
    const out = applyTtsPacingMarkers(GLORIA_CHECKIN);
    expect(out).toContain('"), After that');
  });

  it('does not add pauses for single line wraps without a blank line', () => {
    const out = applyTtsPacingMarkers('Line one\nLine two');
    expect(out).toBe('Line one Line two');
    expect(out).not.toContain(',');
  });

  it('keeps hyphenated words like check-in', () => {
    expect(applyTtsPacingMarkers('Quick check-in: hello.')).toContain('check-in');
  });
});
