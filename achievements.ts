import { Achievement, GamificationState } from './types';
import { ALL_ACHIEVEMENT_DEFS } from './achievementDefs';
import { CompassIcon } from './components/icons/CompassIcon';
import { SessionIcon } from './components/icons/SessionIcon';
import { JourneymanIcon } from './components/icons/JourneymanIcon';
import { VeteranIcon } from './components/icons/VeteranIcon';
import { FireIcon } from './components/icons/FireIcon';
import { BrainIcon } from './components/icons/BrainIcon';
import React from 'react';

// Map string identifiers to the actual imported React components
const iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'CompassIcon': CompassIcon,
    'SessionIcon': SessionIcon,
    'JourneymanIcon': JourneymanIcon,
    'VeteranIcon': VeteranIcon,
    'FireIcon': FireIcon,
    'BrainIcon': BrainIcon,
};


export const getAchievements = (t: (key: string) => string): Achievement[] =>
    ALL_ACHIEVEMENT_DEFS.map(def => ({
        id: def.id,
        icon: iconMap[def.iconId],
        isUnlocked: def.isUnlocked as (state: GamificationState) => boolean,
        name: t(`achievement_${def.id}_name`),
        description: t(`achievement_${def.id}_desc`),
    }));