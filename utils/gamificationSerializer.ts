import { GamificationState } from '../types';

// A helper type for JSON serialization, converting Sets to arrays.
interface SerializableGamificationState {
    xp: number;
    level: number;
    streak: number;
    longestStreak: number;
    totalSessions: number;
    lastSessionDate: string | null;
    unlockedAchievements: string[];
    coachesUsed: string[];
}

/**
 * Serializes the GamificationState object into a JSON string.
 * Converts Sets to arrays for compatibility with JSON.
 * @param state The GamificationState object.
 * @returns A JSON string representation of the state.
 */
export const serializeGamificationState = (state: GamificationState): string => {
    const serializableState: SerializableGamificationState = {
        ...state,
        unlockedAchievements: Array.from(state.unlockedAchievements),
        coachesUsed: Array.from(state.coachesUsed),
    };
    return JSON.stringify(serializableState);
};

/**
 * Deserializes a JSON string back into a GamificationState object.
 * Converts arrays back to Sets.
 * This function is now robust against malformed or non-string inputs.
 * @param data The data to deserialize, expected to be a JSON string.
 * @returns A GamificationState object, or a default state if parsing fails.
 */
export const deserializeGamificationState = (data: unknown): GamificationState => {
    const defaultState: GamificationState = {
        xp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        totalSessions: 0,
        lastSessionDate: null,
        unlockedAchievements: new Set<string>(),
        coachesUsed: new Set<string>(),
    };

    if (typeof data !== 'string' || !data || data === '{}' || data === 'null') {
        if (typeof data !== 'string' && data) {
            console.warn("deserializeGamificationState received a non-string value, falling back to default:", data);
        }
        return defaultState;
    }

    try {
        const parsed: Partial<SerializableGamificationState> = JSON.parse(data);
        
        if (typeof parsed.xp !== 'number' || typeof parsed.level !== 'number') {
            console.warn("Parsed gamification state is missing core properties, returning default.", parsed);
            return defaultState;
        }

        return {
            ...defaultState,
            ...parsed,
            unlockedAchievements: new Set(parsed.unlockedAchievements || []),
            coachesUsed: new Set(parsed.coachesUsed || []),
        };
    } catch (error) {
        console.error("Failed to deserialize gamification state:", error, "Input was:", data);
        return defaultState;
    }
};