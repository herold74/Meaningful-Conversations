import { User, GamificationState, UserData } from '../types';
import { deserializeGamificationState, serializeGamificationState } from '../utils/gamificationSerializer';
import { apiFetch, getSession, setSession, clearSession } from './api';

// This service now acts as a client for the backend API.

// --- Public API ---

export const register = async (email: string, password: string): Promise<User> => {
    const { token, user } = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setSession({ token, user });
    return user;
};

export const login = async (email: string, password: string): Promise<User> => {
    const { token, user } = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setSession({ token, user });
    return user;
};

export const loginAsBetaTester = async (): Promise<User> => {
    const { token, user } = await apiFetch('/auth/beta-login', {
        method: 'POST',
    });
    setSession({ token, user });
    return user;
};

export const logout = () => {
    clearSession();
};

export const getCurrentUser = (): User | null => {
    const session = getSession();
    return session ? session.user : null;
};

export const saveUserData = async (data: Partial<UserData>): Promise<void> => {
    // Serialize gamification state before sending to the backend
    const payload = { ...data };
    if (payload.gamificationState) {
        payload.gamificationState = serializeGamificationState(payload.gamificationState) as any;
    }
    
    await apiFetch('/data/user', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
};

export const loadUserData = async (): Promise<UserData | null> => {
    try {
        const data = await apiFetch('/data/user');
        if (data) {
            return {
                lifeContext: data.lifeContext || null,
                gamificationState: deserializeGamificationState(data.gamificationState)
            };
        }
        return null;
    } catch (error) {
        console.error("Failed to load user data:", error);
        // If user data fails to load (e.g., 404), return a default-like state
        return {
            lifeContext: null,
            gamificationState: deserializeGamificationState("0;1;0;0;-1;1;0") // Default state
        };
    }
};

export const requestPasswordReset = async (email: string): Promise<void> => {
    await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
    // The backend handles the simulation; the frontend just needs to know the call was made.
    return Promise.resolve();
};
