import { useRef, useCallback, useEffect } from 'react';

/**
 * Keeps the screen awake while active (e.g. during audio recording or
 * speech recognition). Uses the Screen Wake Lock API where available;
 * returns `isSupported` so callers can show a fallback warning on
 * browsers that don't support it.
 *
 * Usage:
 *   const { request, release, isSupported } = useWakeLock();
 *   // Call request() when recording starts, release() when it stops.
 *   // The lock is automatically released on unmount.
 */
export function useWakeLock() {
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);
    /** True while the caller wants the screen to stay awake. */
    const activeRef = useRef(false);

    const isSupported =
        typeof navigator !== 'undefined' && 'wakeLock' in navigator;

    const acquire = useCallback(async () => {
        if (!isSupported) return;
        // Don't double-acquire
        if (wakeLockRef.current) return;
        try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            console.log('[WakeLock] Acquired');
            wakeLockRef.current.addEventListener('release', () => {
                console.log('[WakeLock] Released by system');
                wakeLockRef.current = null;
            });
        } catch (e) {
            // Can fail if the tab is not visible or battery saver is on.
            console.warn('[WakeLock] Could not acquire:', e);
        }
    }, [isSupported]);

    const request = useCallback(async () => {
        activeRef.current = true;
        await acquire();
    }, [acquire]);

    const release = useCallback(async () => {
        activeRef.current = false;
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
                console.log('[WakeLock] Released');
            } catch {
                // Already released — ignore.
            }
            wakeLockRef.current = null;
        }
    }, []);

    // Re-acquire when the tab becomes visible again.
    // The browser auto-releases the lock when a tab is hidden; we must
    // re-acquire it when the user returns — but ONLY if the caller still
    // wants the lock (activeRef is true).
    useEffect(() => {
        if (!isSupported) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && activeRef.current) {
                acquire();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isSupported, acquire]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            activeRef.current = false;
            if (wakeLockRef.current) {
                wakeLockRef.current.release().catch(() => {});
                wakeLockRef.current = null;
            }
        };
    }, []);

    return { request, release, isSupported };
}
