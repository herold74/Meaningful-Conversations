import { Capacitor } from '@capacitor/core';

/**
 * Returns true if the current platform is a desktop web browser.
 * False for native apps (Capacitor) and mobile-width browsers.
 */
export const isDesktopWeb = (): boolean => {
    if (typeof window === 'undefined') return false;
    if (Capacitor.isNativePlatform()) return false;
    return window.innerWidth >= 768;
};

/**
 * Returns true if running inside a native Capacitor app.
 */
export const isNativeApp = (): boolean => {
    return Capacitor.isNativePlatform();
};
