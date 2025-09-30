import { User, GamificationState } from '../types';
import { apiFetch, setSession, clearSession, getSession } from './api';

// Helper to convert Sets to Arrays for JSON serialization
const prepareGamificationStateForApi = (state: GamificationState) => ({
    ...state,
    unlockedAchievements: Array.from(state.unlockedAchievements),
    coachesUsed: Array.from(state.coachesUsed),
});

// Helper to convert Arrays back to Sets after fetching from API
const hydrateGamificationStateFromApi = (state: any): GamificationState => ({
    ...state,
    unlockedAchievements: new Set(state.unlockedAchievements || []),
    coachesUsed: new Set(state.coachesUsed || []),
});

export const login = async (email: string, password: string): Promise<User> => {
    const session = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setSession(session);
    return session.user;
};

export const register = async (email: string, password: string): Promise<User> => {
    const session = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setSession(session);
    return session.user;
};

export const betaLogin = async (): Promise<User> => {
    const session = await apiFetch('/auth/beta-login', {
        method: 'POST',
    });
    setSession(session);
    return session.user;
};

export const logout = (): void => {
    clearSession();
};

export const getCurrentUser = (): User | null => {
    const session = getSession();
    return session ? session.user : null;
};

export const loadUserData = async (): Promise<{ lifeContext: string; gamificationState: GamificationState; }> => {
    const data = await apiFetch('/data/user', {
        method: 'GET',
    });
    return {
        ...data,
        gamificationState: hydrateGamificationStateFromApi(data.gamificationState),
    };
};

export const saveUserData = async (
    lifeContext: string,
    gamificationState: GamificationState,
    botId: string
): Promise<GamificationState> => {
    const preparedState = prepareGamificationStateForApi(gamificationState);
    const updatedState = await apiFetch('/data/user', {
        method: 'PUT',
        body: JSON.stringify({ lifeContext, gamificationState: preparedState, botId }),
    });
    return hydrateGamificationStateFromApi(updatedState);
};

export const requestPasswordReset = async (email: string): Promise<void> => {
    await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
};

export const deleteAccount = async (): Promise<void> => {
    await apiFetch('/data/user', {
        method: 'DELETE',
    });
    clearSession();
};