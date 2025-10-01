import { apiFetch, setSession } from './api';
import { User, GamificationState } from '../types';

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

export const loadUserData = async (): Promise<{ context: string, gamificationState: string }> => {
    return await apiFetch('/data/user');
};

export const saveUserData = async (context: string, gamificationState: string): Promise<void> => {
    await apiFetch('/data/user', {
        method: 'PUT',
        body: JSON.stringify({ context, gamificationState }),
    });
};

export const requestPasswordReset = async (email: string): Promise<void> => {
    await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    await apiFetch('/data/user/password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword, newPassword }),
    });
};

export const deleteAccount = async (): Promise<void> => {
    await apiFetch('/data/user', {
        method: 'DELETE',
    });
};

export const redeemCode = async (code: string): Promise<User> => {
    const { user } = await apiFetch('/data/redeem-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
    });
    return user;
};
