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
 * Determines the backend API URL at runtime based on the frontend's hostname and port.
 * This allows a single build to be deployed to multiple environments.
 * @returns {string} The base URL for the API.
 */
const getApiBaseUrl = (): string => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const urlParams = new URLSearchParams(window.location.search);
    const backendParam = urlParams.get('backend');

    // 1. Priority: URL parameter for explicit override (for local development)
    if (backendParam === 'local') {
        return 'http://localhost:3001';
    }
    if (backendParam === 'staging') {
        return 'https://meaningful-conversations-backend-staging-7kxdyriz2q-oa.a.run.app';
    }
    if (backendParam === 'production') {
        return 'https://meaningful-conversations-backend-prod-650095539575.europe-west6.run.app';
    }

    // 2. Runtime detection based on hostname and port
    // Include port in the key to distinguish between staging and production on the same server
    const hostnameWithPort = port ? `${hostname}:${port}` : hostname;
    
    const backendMap: { [key: string]: string } = {
        // Google Cloud Run Environments
        'meaningful-conversations-frontend-prod-650095539575.europe-west6.run.app': 'https://meaningful-conversations-backend-prod-650095539575.europe-west6.run.app',
        'meaningful-conversations-frontend-staging-650095539575.europe-west6.run.app': 'https://meaningful-conversations-backend-staging-7kxdyriz2q-oa.a.run.app',
        
        // Manualmode Server Deployment (Podman-based with nginx reverse proxy)
        // Uses relative paths - nginx on host handles /api routing to backend containers
        'mc-beta.manualmode.at': '',   // Staging: nginx proxies /api to backend pod
        'mc-app.manualmode.at': '',    // Production: nginx proxies /api to backend pod
        '91.99.193.87': '',            // Manualmode server: IP fallback
        '46.224.37.130': '',           // Alternative server (legacy): IP fallback
    };
    
    if (backendMap[hostnameWithPort]) {
        return backendMap[hostnameWithPort];
    }

    // 3. Fallback for localhost and any other unknown domains (e.g., custom deployments).
    // This defaults to a relative path, assuming a reverse proxy is in place.
    return '';
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