import { apiFetch, setSession, getSession, clearSession } from './api';
import { User, UpgradeCode, Ticket } from '../types';

interface UserData {
    context: string;
    gamificationState: string;
}

export const loadUserData = async (): Promise<UserData> => {
    return await apiFetch('/data/user');
};

export const saveUserData = async (context: string, gamificationState: string): Promise<void> => {
    await apiFetch('/data/user', {
        method: 'PUT',
        body: JSON.stringify({ context, gamificationState }),
    });
};

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

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    await apiFetch('/data/user/password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword, newPassword }),
    });
};

export const redeemCode = async (code: string): Promise<User> => {
    const { user } = await apiFetch('/data/redeem-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
    });
    // The API returns the updated user object. We need to update the session.
    const session = getSession();
    if (session) {
        setSession({ ...session, user });
    }
    return user;
};

// --- Admin Functions ---

export const getAdminUsers = async (): Promise<User[]> => {
    return await apiFetch('/admin/users');
};

export const toggleUserPremium = async (userId: string): Promise<User> => {
    return await apiFetch(`/admin/users/${userId}/toggle-premium`, { method: 'PUT' });
};

export const toggleUserAdmin = async (userId: string): Promise<User> => {
    return await apiFetch(`/admin/users/${userId}/toggle-admin`, { method: 'PUT' });
};

export const resetUserPassword = async (userId: string): Promise<{ newPassword: string }> => {
    return await apiFetch(`/admin/users/${userId}/reset-password`, { method: 'POST' });
};

export const getUpgradeCodes = async (): Promise<UpgradeCode[]> => {
    return await apiFetch('/admin/codes');
};

export const createUpgradeCode = async (botId: string): Promise<UpgradeCode> => {
    return await apiFetch('/admin/codes', {
        method: 'POST',
        body: JSON.stringify({ botId }),
    });
};

export const deleteUpgradeCode = async (codeId: string): Promise<void> => {
    await apiFetch(`/admin/codes/${codeId}`, { method: 'DELETE' });
};

export const getAdminTickets = async (): Promise<Ticket[]> => {
    return await apiFetch('/admin/tickets');
};

export const resolveTicket = async (ticketId: string): Promise<Ticket> => {
    return await apiFetch(`/admin/tickets/${ticketId}/resolve`, { method: 'PUT' });
};