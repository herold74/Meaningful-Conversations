// services/guestService.ts

import { apiFetch } from './api';

/**
 * Generate a unique identifier for this guest user
 * Combines browser fingerprint with a unique UUID for better uniqueness
 * @returns A base64-encoded identifier string (max 64 chars)
 */
export const generateGuestId = (): string => {
    try {
        // Generate a random UUID-like string for this specific user
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        // Create canvas fingerprint for browser characteristics
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#000';
            ctx.fillText('fingerprint', 2, 2);
        }
        const canvasData = canvas.toDataURL();

        // Collect browser characteristics (to prevent easy spoofing)
        const data = {
            uuid, // Unique per "guest user"
            userAgent: navigator.userAgent,
            language: navigator.language,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            canvas: canvasData.substring(0, 30) // Shortened for better performance
        };

        // Create a deterministic hash-like string
        const guestId = btoa(JSON.stringify(data))
            .replace(/[^A-Za-z0-9+/=]/g, '') // Remove any non-base64 characters
            .substring(0, 64); // Limit to 64 characters

        return guestId;

    } catch (error) {
        console.error('Error generating guest ID:', error);
        // Fallback: Generate a simple random ID
        const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        return btoa(randomId).substring(0, 64);
    }
};

/**
 * Get or create a unique guest identifier for this user
 * Stored in localStorage so it persists across browser sessions
 * Each guest gets their own unique ID and message limit
 * @returns The guest ID string
 */
export const getOrCreateFingerprint = (): string => {
    // Use localStorage instead of sessionStorage for persistence across sessions
    let guestId = localStorage.getItem('guest_id');
    
    if (!guestId) {
        guestId = generateGuestId();
        localStorage.setItem('guest_id', guestId);
        console.log('Created new guest ID - each guest user has their own message limit');
    }
    
    return guestId;
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

