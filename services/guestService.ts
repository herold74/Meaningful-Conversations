// services/guestService.ts

import { apiFetch } from './api';

/**
 * Generate a browser fingerprint using various browser characteristics
 * @returns A base64-encoded fingerprint string (max 64 chars)
 */
export const generateFingerprint = (): string => {
    try {
        // Create canvas fingerprint
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#000';
            ctx.fillText('fingerprint', 2, 2);
        }
        const canvasData = canvas.toDataURL();

        // Collect browser characteristics
        const data = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages ? navigator.languages.join(',') : '',
            screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            platform: navigator.platform,
            canvas: canvasData.substring(0, 50) // Only use first 50 chars of canvas
        };

        // Create a deterministic hash-like string
        const fingerprint = btoa(JSON.stringify(data))
            .replace(/[^A-Za-z0-9+/=]/g, '') // Remove any non-base64 characters
            .substring(0, 64); // Limit to 64 characters

        return fingerprint;

    } catch (error) {
        console.error('Error generating fingerprint:', error);
        // Fallback fingerprint based on minimal data
        return btoa(navigator.userAgent + screen.width + screen.height).substring(0, 64);
    }
};

/**
 * Get or create a fingerprint for the current session
 * Stored in sessionStorage so it persists during the browser session
 * @returns The fingerprint string
 */
export const getOrCreateFingerprint = (): string => {
    let fingerprint = sessionStorage.getItem('guest_fingerprint');
    
    if (!fingerprint) {
        fingerprint = generateFingerprint();
        sessionStorage.setItem('guest_fingerprint', fingerprint);
    }
    
    return fingerprint;
};

interface GuestLimitResponse {
    allowed: boolean;
    remaining: number;
    messageCount: number;
}

/**
 * Check if the guest has messages remaining this week
 * @param fingerprint Browser fingerprint
 * @returns Object with allowed status and remaining count
 */
export const checkGuestLimit = async (fingerprint: string): Promise<GuestLimitResponse> => {
    try {
        const response = await apiFetch('/guest/check-limit', {
            method: 'POST',
            body: JSON.stringify({ fingerprint })
        });
        
        return response;

    } catch (error) {
        console.error('Error checking guest limit:', error);
        // On error, allow the request (fail open)
        return {
            allowed: true,
            remaining: 50,
            messageCount: 0
        };
    }
};

interface GuestUsageResponse {
    messageCount: number;
    remaining: number;
}

/**
 * Increment the guest's message usage counter
 * @param fingerprint Browser fingerprint
 * @returns Updated usage data
 */
export const incrementGuestUsage = async (fingerprint: string): Promise<GuestUsageResponse> => {
    try {
        const response = await apiFetch('/guest/increment-usage', {
            method: 'POST',
            body: JSON.stringify({ fingerprint })
        });
        
        return response;

    } catch (error) {
        console.error('Error incrementing guest usage:', error);
        throw error;
    }
};

/**
 * Check if the current user is a guest (not logged in)
 * @param currentUser The current user object or null
 * @returns True if user is a guest
 */
export const isGuest = (currentUser: any): boolean => {
    return !currentUser;
};

