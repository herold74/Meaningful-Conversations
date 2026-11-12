import { resolvePracticeScenarioBrief } from '../practiceScenarioBrief';
import type { CoachPracticeConfig } from '../../types';

const base: CoachPracticeConfig = {
  frameworkId: 'ambitious-coaching',
  frameworkName: 'Ambitious coaching',
  scenarioId: 'contract-side-project',
  scenarioName: 'German stored name',
  coacheeName: 'Anna',
  coacheeAvatar: '/avatars/bekky.png',
  difficulty: 'moderate',
  difficultyLabel: 'Moderate',
  liveMode: false,
};

describe('resolvePracticeScenarioBrief', () => {
  it('uses clarifiedConcern when content language matches UI', () => {
    const config = {
      ...base,
      contentLanguage: 'en' as const,
      clarifiedConcern: 'Clarity on job vs side project',
    };
    expect(resolvePracticeScenarioBrief(config, 'en', 'Catalog EN')).toBe(
      'Clarity on job vs side project',
    );
  });

  it('uses catalog concern when UI language differs from artifact language', () => {
    const config = {
      ...base,
      contentLanguage: 'de' as const,
      clarifiedConcern: 'Die Klientin möchte Klarheit…',
    };
    expect(resolvePracticeScenarioBrief(config, 'en', 'English catalog concern')).toBe(
      'English catalog concern',
    );
  });

  it('falls back to scenarioName when no catalog concern', () => {
    expect(resolvePracticeScenarioBrief(base, 'en', null)).toBe('German stored name');
  });
});
