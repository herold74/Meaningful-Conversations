import { User } from '../types';

interface Session {
    token: string;
    user: User;
}

// TypeScript needs to know about the global variable that might be injected by AI Studio.
declare global {
  // Use `var` for global scope declaration that can be checked with `in` or `typeof`
  var AISTUDIO_BACKEND_URL: string | undefined;
}


const getApiBaseUrl = (): string => {
    // This function is only called once, so logging here is fine for initial setup diagnosis.
    console.log("Determining API base URL...");
    
    // Priority 1: Use the explicit environment variable if provided by AI Studio. This is the most reliable method.
    if (typeof AISTUDIO_BACKEND_URL === 'string' && AISTUDIO_BACKEND_URL) {
        const cleanedUrl = AISTUDIO_BACKEND_URL.replace(/\/$/, '');
        console.log(`Using injected AISTUDIO_BACKEND_URL: ${cleanedUrl}`);
        return cleanedUrl;
    }

    // Priority 2: If the global variable is not available, check the hostname.
    // If the app is not being accessed from localhost, it's a remote environment (like AI Studio).
    // Construct the backend URL by prepending the port. This is crucial for mobile device access.
    const hostname = window.location.hostname;
    // A truthy hostname that is not a local address indicates a remote environment.
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        const backendHostname = `3001-${hostname}`;
        const constructedUrl = `https://${backendHostname}`;
        console.log(`Detected remote environment ('${hostname}'). Constructed backend URL: ${constructedUrl}`);
        return constructedUrl;
    }

    // Priority 3: Fallback for standard local development or when hostname is invalid.
    const defaultUrl = 'http://localhost:3001';
    console.log(`Detected localhost or invalid hostname. Defaulting to local development URL: ${defaultUrl}`);
    return defaultUrl;
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