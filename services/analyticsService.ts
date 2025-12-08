import { apiFetch } from './api';

export interface TrackEventParams {
    eventType: 'GUEST_LOGIN' | 'PAGE_VIEW' | 'FEATURE_USE';
    userId?: string;
    metadata?: Record<string, any>;
}

/**
 * Track a user event
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
    try {
        await apiFetch('/analytics/event', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    } catch (error) {
        // Silently fail - don't disrupt user experience if tracking fails
        console.warn('Failed to track event:', error);
    }
}

/**
 * Track guest login
 */
export async function trackGuestLogin(): Promise<void> {
    await trackEvent({ eventType: 'GUEST_LOGIN' });
}

