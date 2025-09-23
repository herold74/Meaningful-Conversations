import React from 'react';
import { Achievement } from './types';
import { BetaIcon } from './components/icons/BetaIcon';
import { SessionIcon } from './components/icons/SessionIcon';
import { JourneymanIcon } from './components/icons/JourneymanIcon';
import { VeteranIcon } from './components/icons/VeteranIcon';
import { FireIcon } from './components/icons/FireIcon';
import { BrainIcon } from './components/icons/BrainIcon';

export const ALL_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'beta_pioneer',
        name: 'Beta Pioneer',
        description: 'Thank you for being an early user of this application!',
        icon: BetaIcon,
        isUnlocked: () => true,
    },
    {
        id: 'first_session',
        name: 'First Step',
        description: 'Complete your first coaching session.',
        icon: SessionIcon,
        isUnlocked: (state) => state.totalSessions >= 1,
    },
    {
        id: 'journeyman',
        name: 'Journeyman',
        description: 'Complete 5 sessions with the same context file.',
        icon: JourneymanIcon,
        isUnlocked: (state) => state.totalSessions >= 5,
    },
    {
        id: 'veteran',
        name: 'Veteran',
        description: 'Complete 10 sessions with the same context file.',
        icon: VeteranIcon,
        isUnlocked: (state) => state.totalSessions >= 10,
    },
    {
        id: 'streak_starter',
        name: 'On Fire',
        description: 'Maintain a session streak of 3 or more.',
        icon: FireIcon,
        isUnlocked: (state) => state.streak >= 3,
    },
    {
        id: 'polymath',
        name: 'Polymath',
        description: 'Have a session with at least 3 different coaches.',
        icon: BrainIcon,
        isUnlocked: (state) => state.coachesUsed.size >= 3,
    },
];
