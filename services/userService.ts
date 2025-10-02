import { apiFetch, setSession, getSession, clearSession } from './api';
import { User, UpgradeCode, Ticket } from '../types';
import { encryptData, decryptData } from '../utils/encryption';


interface EncryptedUserData {
    context: string; // This will be the encrypted string from the server
    gamificationState: string;
}

interface DecryptedUserData {
    context: string; // This will be the decrypted, plaintext context
    gamificationState: string;
}

export const loadUserData = async (key: CryptoKey): Promise<DecryptedUserData> => {
    const data: EncryptedUserData = await apiFetch('/data/user');
    
    let decryptedContext = '';
    // If there's context to decrypt, wrap it in a try...catch
    if (data.context) {
        try {
            decryptedContext = await decryptData(key, data.context);
        } catch (error) {
            console.error("Fatal: Failed to decrypt life context. This likely means the password was incorrect or data is corrupt.", error);
            // Re-throw to prevent the user from continuing with a blank context.
            // This will be caught by the UI and trigger a logout/error message.
            throw error;
        }
    }

    return {
        context: decryptedContext,
        gamificationState: data.gamificationState,
    };
};

export const saveUserData = async (context: string, gamificationState: string, key: CryptoKey): Promise<void> => {
    const encryptedContext = await encryptData(key, context);
    await apiFetch('/data/user', {
        method: 'PUT',
        body: JSON.stringify({ context: encryptedContext, gamificationState }),
    });
};

export const login = async (email: string, password: string): Promise<{ user: User, token: string }> => {
    const session = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setSession(session);
    return session;
};

export const register = async (email: string, password: string): Promise<{ user: User, token: string }> => {
    const session = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setSession(session);
    return session;
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

export const changePassword = async (oldPassword: string, newPassword: string, newEncryptedLifeContext: string): Promise<void> => {
    await apiFetch('/data/user/password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword, newPassword, newEncryptedLifeContext }),
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

export const submitFeedback = async (feedbackData: {
    rating?: number;
    comments: string;
    botId: string;
    lastUserMessage?: string;
    botResponse?: string;
    isAnonymous: boolean;
}): Promise<void> => {
    await apiFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify(feedbackData),
    });
};


// --- Admin Functions ---

export const getAdminUsers = async (): Promise<User[]> => {
    return await apiFetch('/admin/users');
};

export const toggleUserPremium = async (userId: string): Promise<void> => {
    await apiFetch(`/admin/users/${userId}/toggle-premium`, { method: 'PUT' });
};

export const toggleUserAdmin = async (userId: string): Promise<void> => {
     await apiFetch(`/admin/users/${userId}/toggle-admin`, { method: 'PUT' });
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