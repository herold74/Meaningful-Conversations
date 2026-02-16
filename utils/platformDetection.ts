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

// ─── Android Detection ───────────────────────────────────────────────
// Standalone Android detection so that Android-specific fixes
// (speech recognition, TTS, etc.) never affect PC or iOS code paths.

const _ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

/**
 * True when running in ANY Android environment (browser, PWA, or future native app).
 */
export const isAndroid: boolean =
    /Android/i.test(_ua);

/**
 * True when running in an Android web browser or installed PWA (not a native Capacitor app).
 */
export const isAndroidBrowser: boolean =
    isAndroid && !Capacitor.isNativePlatform();

/**
 * True when running inside a native Capacitor Android app.
 * (Currently unused — no native Android app exists yet.)
 */
export const isNativeAndroid: boolean =
    isAndroid && Capacitor.isNativePlatform();
