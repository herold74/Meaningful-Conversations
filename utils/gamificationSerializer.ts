import { GamificationState } from '../types';
import { ALL_ACHIEVEMENT_DEFS } from '../achievementDefs';
import { BOTS } from '../constants';

// --- Mappers for Bitmasks (Lazy Initialized) ---
let mappers: {
    achievementIdToBitValue: Map<string, number>;
    bitValueToAchievementId: Map<number, string>;
    botIdToBitValue: Map<string, number>;
    bitValueToBotId: Map<number, string>;
} | null = null;

const getMappers = () => {
    if (mappers) {
        return mappers;
    }
    const achievementIdToBitValue = new Map(
        ALL_ACHIEVEMENT_DEFS.map((ach, i) => [ach.id, 1 << i])
    );
    const bitValueToAchievementId = new Map(
        ALL_ACHIEVEMENT_DEFS.map((ach, i) => [1 << i, ach.id])
    );
    const botIdToBitValue = new Map(
        BOTS.map((bot, i) => [bot.id, 1 << i])
    );
    const bitValueToBotId = new Map(
        BOTS.map((bot, i) => [1 << i, bot.id])
    );
    mappers = {
        achievementIdToBitValue,
        bitValueToAchievementId,
        botIdToBitValue,
        bitValueToBotId,
    };
    return mappers;
};


// --- Date Logic ---
const EPOCH = new Date('2024-01-01T00:00:00Z');
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const dateToDays = (dateString: string | null): number => {
    if (!dateString) return -1; // Use -1 to represent null
    const date = new Date(dateString + 'T00:00:00Z');
    if (isNaN(date.getTime())) return -1;
    return Math.floor((date.getTime() - EPOCH.getTime()) / MS_PER_DAY);
};

const daysToDate = (days: number): string | null => {
    if (days < 0) return null;
    const date = new Date(EPOCH.getTime() + days * MS_PER_DAY);
    return date.toISOString().split('T')[0];
};

/**
 * Serializes the gamification state into a compact, semicolon-delimited string.
 * Format: xp;level;streak;totalSessions;lastSessionDate(days);achievementsMask;coachesMask
 */
export const serializeGamificationState = (state: GamificationState): string => {
    const { achievementIdToBitValue, botIdToBitValue } = getMappers();

    const achievementMask = Array.from(state.unlockedAchievements)
        .reduce((mask, id) => mask | (achievementIdToBitValue.get(id) || 0), 0);
    
    const coachesMask = Array.from(state.coachesUsed)
        .reduce((mask, id) => mask | (botIdToBitValue.get(id) || 0), 0);

    const parts = [
        state.xp,
        state.level,
        state.streak,
        state.totalSessions,
        dateToDays(state.lastSessionDate),
        achievementMask,
        coachesMask
    ];

    return parts.join(';');
};

/**
 * Deserializes the compact string back into a GamificationState object.
 */
export const deserializeGamificationState = (serialized: string): GamificationState => {
    const { bitValueToAchievementId, bitValueToBotId } = getMappers();
    
    const parts = serialized.split(';').map(p => parseInt(p, 10));

    const [
        xp = 0,
        level = 1,
        streak = 0,
        totalSessions = 0,
        lastSessionDays = -1,
        achievementMask = 1, // Default to beta_pioneer
        coachesMask = 0
    ] = parts;

    const unlockedAchievements = new Set<string>();
    bitValueToAchievementId.forEach((id, bitValue) => {
        if ((achievementMask & bitValue) === bitValue) {
            unlockedAchievements.add(id);
        }
    });

    const coachesUsed = new Set<string>();
    bitValueToBotId.forEach((id, bitValue) => {
        if ((coachesMask & bitValue) === bitValue) {
            coachesUsed.add(id);
        }
    });
    
    // If deserialization results in an empty set (e.g., from old file), add default.
    if (unlockedAchievements.size === 0) {
        unlockedAchievements.add('beta_pioneer');
    }

    return {
        xp,
        level,
        streak,
        totalSessions,
        lastSessionDate: daysToDate(lastSessionDays),
        unlockedAchievements,
        coachesUsed
    };
};
