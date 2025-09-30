import { User } from '../types';

const API_BASE_URL = 'http://localhost:3001/api'; // This should be an environment variable in a real app

interface Session {
    token: string;
    user: User;
}

const SESSION_KEY = 'meaningful_conversations_session';

export const setSession = (session: Session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const getSession = (): Session | null => {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    } catch (e) {
        return null;
    }
};

export const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const session = getSession();
    const headers = new Headers(options.headers || {});
    headers.append('Content-Type', 'application/json');

    if (session?.token) {
        headers.append('Authorization', `Bearer ${session.token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        // You can add more robust error handling here,
        // like checking for 401 Unauthorized to auto-logout the user.
        console.error(`API Error: ${response.status} ${response.statusText}`);
        throw response;
    }

    // Handle responses that might not have a body
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return;
};
