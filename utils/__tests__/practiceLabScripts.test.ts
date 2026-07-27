import {
  getSamStageGoals,
  SAM_PRACTICE_FRAMEWORK_ID,
  SAM_PRACTICE_SCENARIOS,
  SAM_STAGE_COMPLETE_TURNS,
} from '../practiceLabScripts';

describe('practiceLabScripts (Sam)', () => {
  test('framework id is forward-focused-coaching', () => {
    expect(SAM_PRACTICE_FRAMEWORK_ID).toBe('forward-focused-coaching');
  });

  test('stage-complete has 6 turns with forward-focused stage order', () => {
    const goals = getSamStageGoals('motivation-dip');
    expect(goals).toHaveLength(SAM_STAGE_COMPLETE_TURNS);
    expect(goals[0].stage).toBe('session-focus');
    expect(goals.some((t) => t.stage === 'preferred-future')).toBe(true);
    expect(goals.some((t) => t.stage === 'exceptions')).toBe(true);
    expect(goals.some((t) => t.stage === 'scaling')).toBe(true);
    expect(goals[goals.length - 1].stage).toBe('close');
  });

  test('all Sam scenarios have six stage goals with scripted fallback', () => {
    for (const scenario of SAM_PRACTICE_SCENARIOS) {
      const goals = getSamStageGoals(scenario.id);
      expect(goals).toHaveLength(SAM_STAGE_COMPLETE_TURNS);
      expect(goals[0].scriptedEn.length).toBeGreaterThan(10);
      expect(goals[0].scriptedDe.length).toBeGreaterThan(10);
    }
  });
});
