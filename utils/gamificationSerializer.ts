
import { GamificationState } from '../types';

// A type guard to check if an object is a valid GamificationState after parsing
const isGamificationState = (obj: any): obj is Omit<GamificationState, 'unlockedAchievements' | 'coachesUsed'> & { unlockedAchievements: string[], coachesUsed: string[] } => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.xp === 'number' &&
        typeof obj.level === 'number' &&
        typeof obj.streak === 'number' &&
        typeof obj.totalSessions === 'number' &&
        (typeof obj.lastSessionDate === 'string' || obj.lastSessionDate === null) &&
        Array.isArray(obj.unlockedAchievements) &&
        Array.isArray(obj.coachesUsed)
    );
};

/**
 * Serializes the GamificationState to a JSON string, converting Sets to arrays.
 * This is used for storing the state in the database or embedding it in a downloaded file.
 * @param state The GamificationState object.
 * @returns A JSON string representation of the state.
 */
export const serializeGamificationState = (state: GamificationState): string => {
    const serializableState = {
        ...state,
        unlockedAchievements: Array.from(state.unlockedAchievements),
        coachesUsed: Array.from(state.coachesUsed),
    };
    return JSON.stringify(serializableState);
};

/**
 * Deserializes a JSON string back into a GamificationState, converting arrays back to Sets.
 * This is used when loading state from the database or a user-uploaded file.
 * @param jsonString The JSON string to parse.
 * @returns A GamificationState object, or null if parsing fails or the data is invalid.
 */
export const deserializeGamificationState = (jsonString: string | null | undefined): GamificationState | null => {
    if (!jsonString) {
        return null;
    }
    
    try {
        const parsed = JSON.parse(jsonString);

        if (isGamificationState(parsed)) {
            return {
                ...parsed,
                unlockedAchievements: new Set(parsed.unlockedAchievements),
                coachesUsed: new Set(parsed.coachesUsed),
            };
        }
        console.warn("Parsed object is not a valid GamificationState:", parsed);
        return null;
    } catch (error) {
        console.error("Failed to deserialize gamification state:", error);
        return null;
    }
};
