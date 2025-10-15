import { User } from '../types';

interface Session {
    token: string;
    user: User;
}

// --- CONFIGURATION ---

const BACKEND_URLS = {
    // This is the stable, live backend for real users.
    // IMPORTANT: Verify this URL from your Google Cloud Run dashboard for the '...-prod' service.
    production: 'https://meaningful-conversations-backend-prod-7kxdyriz2q-oa.a.run.app',
    
    // This is the testing backend for new features.
    // It's the default for any non-local, non-production environment (like AI Studio).
    staging: 'https://meaningful-conversations-backend-staging-7kxdyriz2q-oa.a.run.app',
    
    // This is for running the backend on your local machine.
    // The backend server defaults to port 3001, while the frontend is usually served on 3000.
    local: 'http://localhost:3001'
};

/**
 * Intelligently determines the correct backend API URL based on the frontend's hostname.
 * This removes the need for URL parameters like `?backend=staging`.
 * @returns {string} The base URL for the API.
 */
const getApiBaseUrl = (): string => {
    const hostname = window.location.hostname;

    // 1. Local development environment
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.log(`Detected local environment. Using 'local' backend: ${BACKEND_URLS.local}.`);
        return BACKEND_URLS.local;
    }

    // 2. Production environment
    // This connects the deployed frontend to the production backend.
    if (hostname === 'meaningful-conversations-1-1-0-7kxdyriz2q-uw.a.run.app') {
        console.log(`Detected production environment. Using 'production' backend: ${BACKEND_URLS.production}.`);
        return BACKEND_URLS.production;
    }

    // 3. Fallback to Staging for all other hostnames.
    // This makes it the safe default for any preview or testing environment like AI Studio, Vercel, Netlify, etc.
    console.log(`Detected a non-local, non-production environment ('${hostname}'). Defaulting to 'staging' backend: ${BACKEND_URLS.staging}.`);
    return BACKEND_URLS.staging;
};


const API_BASE_URL = getApiBaseUrl();
const SESSION_KEY = 'user_session';

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

    if (options.body) {
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
            const customError = new Error(`Could not connect to the server at ${API_BASE_URL}.`);
            // Add custom properties to the error for the UI to use
            (customError as any).isNetworkError = true;
            (customError as any).backendUrl = API_BASE_URL;
            throw customError;
        }
        // Re-throw other types of fetch errors (e.g., CORS issues that aren't TypeErrors)
        throw error;
    }


    // --- Success Case ---
    if (response.ok) {
        if (response.status === 204) {
            return null; // Handle No Content responses
        }
        return await response.json();
    }

    // --- Error Handling ---

    // 1. Handle expired sessions (a 401 when a token was sent on a protected route)
    const isAuthEndpoint = endpoint.startsWith('/auth/');
    if (response.status === 401 && session?.token && !isAuthEndpoint) {
        console.log("Session expired or invalid. Automatically logging out.");
        clearSession();
        window.location.reload();
        // Return a promise that never resolves to stop components from trying to handle the error
        return new Promise(() => {});
    }

    // 2. For all other errors (including a failed login 401), create a structured error to throw.
    let errorData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
        try {
            errorData = await response.json();
        } catch (e) {
            const errorText = await response.text();
            console.error("Failed to parse API error response as JSON, though content-type was JSON.", { status: response.status, text: errorText });
            errorData = { message: `HTTP Error ${response.status}: Server returned invalid JSON. See console for details.` };
        }
    } else {
        const errorText = await response.text();
        console.error("API error response was not JSON.", { status: response.status, text: errorText });
        errorData = { message: `HTTP Error ${response.status}: ${response.statusText}. See console for server response.` };
    }


    // Create a standard Error object, which is easier to handle than a Response object
    const error = new Error(errorData.error || errorData.message || 'An unknown API error occurred.');
    
    // Attach the status and full data payload for more detailed handling if needed
    (error as any).status = response.status;
    (error as any).data = errorData;
    
    // By throwing here, we let the calling function (in userService, etc.) decide what to do.
    throw error;
};