/**
 * A static, non-translatable list of all achievement definitions.
 * This is kept separate to be safely imported by serialization utilities
 * without pulling in React or translation dependencies, preventing circular dependencies.
 */
export const ALL_ACHIEVEMENT_DEFS: { id: string; iconId: string; isUnlocked: (state: any) => boolean }[] = [
    {
        id: 'beta_pioneer',
        iconId: 'CompassIcon',
        isUnlocked: () => true,
    },
    {
        id: 'first_session',
        iconId: 'SessionIcon',
        isUnlocked: (state) => state.totalSessions >= 1,
    },
    {
        id: 'journeyman',
        iconId: 'JourneymanIcon',
        isUnlocked: (state) => state.totalSessions >= 5,
    },
    {
        id: 'veteran',
        iconId: 'VeteranIcon',
        isUnlocked: (state) => state.totalSessions >= 10,
    },
    {
        id: 'streak_starter',
        iconId: 'FireIcon',
        isUnlocked: (state) => state.streak >= 3,
    },
    {
        id: 'polymath',
        iconId: 'BrainIcon',
        isUnlocked: (state) => state.coachesUsed.size >= 3,
    },
];