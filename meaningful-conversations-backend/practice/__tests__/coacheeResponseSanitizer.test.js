const {
  stripCoacheeStageDirections,
  isStageDirectionParenthetical,
} = require('../coacheeResponseSanitizer');

describe('stripCoacheeStageDirections', () => {
  test('removes leading German thinking pause', () => {
    const input = '(denkt kurz nach) Ich glaube, am meisten beschäftigt mich die Frage.';
    expect(stripCoacheeStageDirections(input)).toBe(
      'Ich glaube, am meisten beschäftigt mich die Frage.',
    );
  });

  test('removes asterisk stage directions', () => {
    expect(stripCoacheeStageDirections('*seufzt* Das fällt mir schwer.')).toBe('Das fällt mir schwer.');
  });

  test('keeps substantive parenthetical speech', () => {
    const input = '(also wegen der Rückkehr ins Team) Ich bin unsicher.';
    expect(stripCoacheeStageDirections(input)).toBe('(also wegen der Rückkehr ins Team) Ich bin unsicher.');
  });

  test('removes English thinking pause', () => {
    expect(stripCoacheeStageDirections('(thinks for a moment) I guess what worries me most is my role.'))
      .toBe('I guess what worries me most is my role.');
  });
});

describe('isStageDirectionParenthetical', () => {
  test('detects stage directions', () => {
    expect(isStageDirectionParenthetical('denkt kurz nach')).toBe(true);
    expect(isStageDirectionParenthetical('pauses briefly')).toBe(true);
  });

  test('rejects normal parenthetical content', () => {
    expect(isStageDirectionParenthetical('also wegen der Rückkehr ins Team')).toBe(false);
  });
});
