import { Achievement } from './types';
import { ALL_ACHIEVEMENT_DEFS } from './achievementDefs';

export const getAchievements = (t: (key: string) => string): Achievement[] =>
    ALL_ACHIEVEMENT_DEFS.map(def => ({
        ...def,
        name: t(`achievement_${def.id}_name`),
        description: t(`achievement_${def.id}_desc`),
    }));
