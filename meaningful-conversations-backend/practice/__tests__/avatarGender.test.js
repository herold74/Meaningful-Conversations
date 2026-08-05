const {
  getCoacheeGenderFromAvatar,
  resolveCoacheeGender,
  buildPracticeScenarioSummary,
} = require('../avatarGender');
const { getContractingScenarioById } = require('../contractingScenarios');

describe('avatarGender', () => {
  test('nadia.png is female', () => {
    expect(getCoacheeGenderFromAvatar('/avatars/nadia.png')).toBe('female');
  });

  test('martin.png is male', () => {
    expect(getCoacheeGenderFromAvatar('/avatars/martin.png')).toBe('male');
  });

  test('buildPracticeScenarioSummary includes female gender for Nadia', () => {
    const scenario = getContractingScenarioById('contract-teen-talk');
    const summary = buildPracticeScenarioSummary(scenario, 'de');
    expect(summary).toContain('Nadia');
    expect(summary).toContain('weiblich');
    expect(summary).toContain('sie/ihr/ihre');
  });

  test('explicit coacheeGender overrides avatar', () => {
    expect(resolveCoacheeGender({ avatar: '/avatars/max.png', coacheeGender: 'female' })).toBe('female');
  });
});
