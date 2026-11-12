import { useMemo } from 'react';
import type { CoachPracticeConfig } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { getFrameworkDisplayName, getPracticeDifficultyLabel } from '../utils/practiceFrameworkLabels';
import { resolvePracticeScenarioBrief } from '../utils/practiceScenarioBrief';
import { usePracticeCatalog } from './usePracticeCatalog';

export function usePracticeSessionUILabels(config: CoachPracticeConfig | null | undefined) {
  const { language, t } = useLocalization();
  const { catalog, concernForScenario } = usePracticeCatalog(language);

  return useMemo(() => {
    if (!config) return null;
    const catalogConcern = concernForScenario(config.scenarioId);
    return {
      frameworkName: getFrameworkDisplayName(config.frameworkId, { catalog, t, language }),
      difficultyLabel: getPracticeDifficultyLabel(config.difficulty, t, {
        liveMode: config.liveMode,
        language,
      }),
      scenarioBrief: resolvePracticeScenarioBrief(config, language, catalogConcern),
    };
  }, [config, catalog, concernForScenario, language, t]);
}
