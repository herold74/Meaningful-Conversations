import { User } from '../types';

// Custom error class for API fetch errors.
// This allows other parts of the app to inspect the error details.
export class ApiError extends Error {
    status: number;
    data: any;
    isNetworkError: boolean;
    backendUrl: string;

    constructor(message: string, status: number, data: any, isNetworkError: boolean = false, backendUrl: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
        this.isNetworkError = isNetworkError;
        this.backendUrl = backendUrl;
    }
}


/**
 * Determines the backend API URL. This function is robust and handles multiple environments:
 * 1. Your production build, which will have Vite's `import.meta.env` variables baked in.
 * 2. This preview environment, which does NOT have `import.meta.env`, so it uses hardcoded fallbacks.
 * 3. It also allows manual override via the `?backend=` URL parameter for easy testing.
 * @returns {string} The base URL for the API.
 */
const getApiBaseUrl = (): string => {
    // Fallback URLs for environments where Vite .env isn't loaded (like this preview)
    const fallbackUrls = {
        production: 'https://meaningful-conversations-backend-prod-650095539575.europe-west6.run.app',
        staging: 'https://meaningful-conversations-backend-staging-7kxdyriz2q-oa.a.run.app',
        local: 'http://localhost:3001'
    };

    // Vite injects `import.meta.env`. If it's undefined, use an empty object as a fallback.
    const env = (import.meta as any).env || {};

    const urls = {
        production: env.VITE_BACKEND_URL_PRODUCTION || fallbackUrls.production,
        staging: env.VITE_BACKEND_URL_STAGING || fallbackUrls.staging,
        local: env.VITE_BACKEND_URL_LOCAL || fallbackUrls.local,
    };

    const urlParams = new URLSearchParams(window.location.search);
    const backendParam = urlParams.get('backend') as keyof typeof urls;

    // 1. Priority: URL parameter for explicit override
    if (backendParam && urls[backendParam]) {
        return urls[backendParam];
    }
    
    // 2. Auto-detect environment based on frontend hostname
    const hostname = window.location.hostname;
    if (hostname.includes('frontend-prod')) {
        return urls.production;
    }
    if (hostname.includes('frontend-staging')) {
        return urls.staging;
    }

    // 3. Fallback for localhost and other environments defaults to staging
    return urls.staging;
};


const API_BASE_URL = getApiBaseUrl();
const SESSION_KEY = 'user_session';

interface Session {
    token: string;
    user: User;
}

// --- Session Management ---

export const setSession = (session: Session): void => {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
        console.error("Could not save session:", error);
    }
};

export const getSession = (): Session | null => {
    try {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (!sessionStr) {
            return null;
        }
        return JSON.parse(sessionStr);
    } catch (error) {
        console.error("Could not retrieve or parse session:", error);
        clearSession();
        return null;
    }
};

export const clearSession = (): void => {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.error("Could not clear session:", error);
    }
};


// --- API Fetch Wrapper ---

export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const session = getSession();
    const headers = new Headers(options.headers || {});

    if (session && session.token) {
        headers.set('Authorization', `Bearer ${session.token}`);
    }

    if (options.body && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    
    const config: RequestInit = {
        ...options,
        headers,
    };

    const finalUrl = `${API_BASE_URL}/api${endpoint}`;

    let response;
    try {
        response = await fetch(finalUrl, config);
    } catch (error: any) {
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
             throw new ApiError(
                `Could not connect to the server at ${API_BASE_URL}.`, 
                0, { error: 'Network Error' }, true, API_BASE_URL
            );
        }
        throw error;
    }

    if (response.ok) {
        if (response.status === 204) return null; // Handle No Content
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return { success: true };
    }

    // --- Error Handling ---
    let errorData;
    try {
        errorData = await response.json();
    } catch (e) {
        errorData = { error: `HTTP Error ${response.status}: ${response.statusText}` };
    }

    const isAuthEndpoint = endpoint.startsWith('/auth/');
    if (response.status === 401 && session?.token && !isAuthEndpoint) {
        console.log("Session expired or invalid. Automatically logging out.");
        clearSession();
        window.location.reload();
        return new Promise(() => {}); // Prevent further processing
    }
    
    throw new ApiError(errorData.error || errorData.message || 'An unknown API error occurred.', response.status, errorData, false, API_BASE_URL);
};