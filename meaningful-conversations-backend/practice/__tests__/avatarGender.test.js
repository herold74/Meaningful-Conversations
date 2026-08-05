const {
  getCoacheeGenderFromAvatar,
  resolveCoacheeGender,
  buildPracticeScenarioSummary,
} = require('../avatarGender');
const { getContractingScenarioById } = require('../contractingScenarios');

describe('avatarGender', () => {
  test('finley.png is female', () => {
    expect(getCoacheeGenderFromAvatar('/avatars/finley.png')).toBe('female');
  });

  test('rowan.png is male', () => {
    expect(getCoacheeGenderFromAvatar('/avatars/rowan.png')).toBe('male');
  });

  test('buildPracticeScenarioSummary includes female gender for Finley', () => {
    const scenario = getContractingScenarioById('contract-teen-talk');
    const summary = buildPracticeScenarioSummary(scenario, 'de');
    expect(summary).toContain('Finley');
    expect(summary).toContain('weiblich');
    expect(summary).toContain('sie/ihr/ihre');
  });

  test('explicit coacheeGender overrides avatar', () => {
    expect(resolveCoacheeGender({ avatar: '/avatars/max.png', coacheeGender: 'female' })).toBe('female');
  });
});
