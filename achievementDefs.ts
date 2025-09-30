import { Achievement } from './types';
import { BetaIcon } from './components/icons/BetaIcon';
import { SessionIcon } from './components/icons/SessionIcon';
import { JourneymanIcon } from './components/icons/JourneymanIcon';
import { VeteranIcon } from './components/icons/VeteranIcon';
import { FireIcon } from './components/icons/FireIcon';
import { BrainIcon } from './components/icons/BrainIcon';

/**
 * A static, non-translatable list of all achievement definitions.
 * This is kept separate to be safely imported by serialization utilities
 * without pulling in React or translation dependencies, preventing circular dependencies.
 */
export const ALL_ACHIEVEMENT_DEFS: Omit<Achievement, 'name' | 'description'>[] = [
    {
        id: 'beta_pioneer',
        icon: BetaIcon,
        isUnlocked: () => true,
    },
    {
        id: 'first_session',
        icon: SessionIcon,
        isUnlocked: (state) => state.totalSessions >= 1,
    },
    {
        id: 'journeyman',
        icon: JourneymanIcon,
        isUnlocked: (state) => state.totalSessions >= 5,
    },
    {
        id: 'veteran',
        icon: VeteranIcon,
        isUnlocked: (state) => state.totalSessions >= 10,
    },
    {
        id: 'streak_starter',
        icon: FireIcon,
        isUnlocked: (state) => state.streak >= 3,
    },
    {
        id: 'polymath',
        icon: BrainIcon,
        isUnlocked: (state) => state.coachesUsed.size >= 3,
    },
];
