/**
 * Native TTS Service for iOS
 * 
 * Provides access to iOS native AVSpeechSynthesizer through a Capacitor plugin.
 * This allows access to ALL installed voices (including premium/downloaded ones),
 * bypassing WKWebView's limited speechSynthesis.getVoices() API.
 * 
 * IMPORTANT: This service only works in native iOS apps built with Capacitor.
 * For web/PWA, use the standard Web Speech API.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

// Type definitions for the plugin
export interface NativeVoice {
    identifier: string;    // e.g., "com.apple.voice.premium.de-DE.Helena"
    name: string;          // e.g., "Helena"
    fullName: string;      // e.g., "Helena (Premium)"
    language: string;      // e.g., "de-DE"
    quality: 'default' | 'enhanced' | 'premium';
}

export interface SpeakOptions {
    text: string;
    voiceIdentifier?: string;
    rate?: number;     // 0.0 to 1.0, default 0.5
    pitch?: number;    // 0.5 to 2.0, default 1.0
    volume?: number;   // 0.0 to 1.0, default 1.0
}

export interface SpeakResult {
    completed: boolean;
    cancelled?: boolean;
}

export interface SpeakingStatus {
    speaking: boolean;
    paused: boolean;
}

interface NativeTTSPluginInterface {
    getVoices(): Promise<{ voices: NativeVoice[] }>;
    speak(options: SpeakOptions): Promise<SpeakResult>;
    stop(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    isSpeaking(): Promise<SpeakingStatus>;
    addListener(eventName: 'speechStart' | 'speechEnd' | 'speechCancel', callback: () => void): Promise<{ remove: () => void }>;
}

// Register the plugin (only available in native app)
const NativeTTS = registerPlugin<NativeTTSPluginInterface>('NativeTTS');

// Debug: Log Capacitor state at module load
console.log('[NativeTTS] Module loaded, Capacitor state:', {
    isNativePlatform: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform()
});

// Check if we're in a native iOS app
export const isNativeiOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
console.log('[NativeTTS] isNativeiOS =', isNativeiOS);

/**
 * Native TTS Service class
 */
class NativeTtsServiceClass {
    private cachedVoices: NativeVoice[] | null = null;
    private listeners: { remove: () => void }[] = [];

    /**
     * Check if native TTS is available
     */
    isAvailable(): boolean {
        return isNativeiOS;
    }

    /**
     * Get all available native iOS voices
     * Caches the result for subsequent calls
     */
    async getVoices(): Promise<NativeVoice[]> {
        if (!isNativeiOS) {
            console.warn('[NativeTTS] Not available - not running in native iOS app');
            return [];
        }

        try {
            if (this.cachedVoices) {
                return this.cachedVoices;
            }

            const result = await NativeTTS.getVoices();
            this.cachedVoices = result.voices;
            console.log('[NativeTTS] Loaded', result.voices.length, 'native voices');
            return result.voices;
        } catch (error) {
            console.error('[NativeTTS] Error getting voices:', error);
            return [];
        }
    }

    /**
     * Get voices filtered by language
     */
    async getVoicesForLanguage(language: string): Promise<NativeVoice[]> {
        const voices = await this.getVoices();
        return voices.filter(v => v.language.toLowerCase().startsWith(language.toLowerCase()));
    }

    /**
     * Speak text using native TTS
     */
    async speak(options: SpeakOptions): Promise<SpeakResult> {
        if (!isNativeiOS) {
            console.warn('[NativeTTS] Not available - not running in native iOS app');
            return { completed: false };
        }

        try {
            console.log('[NativeTTS] Speaking:', options.text.substring(0, 50) + '...');
            return await NativeTTS.speak(options);
        } catch (error) {
            console.error('[NativeTTS] Error speaking:', error);
            return { completed: false };
        }
    }

    /**
     * Stop speaking immediately
     */
    async stop(): Promise<void> {
        if (!isNativeiOS) return;
        
        try {
            await NativeTTS.stop();
        } catch (error) {
            console.error('[NativeTTS] Error stopping:', error);
        }
    }

    /**
     * Pause speaking
     */
    async pause(): Promise<void> {
        if (!isNativeiOS) return;
        
        try {
            await NativeTTS.pause();
        } catch (error) {
            console.error('[NativeTTS] Error pausing:', error);
        }
    }

    /**
     * Resume speaking
     */
    async resume(): Promise<void> {
        if (!isNativeiOS) return;
        
        try {
            await NativeTTS.resume();
        } catch (error) {
            console.error('[NativeTTS] Error resuming:', error);
        }
    }

    /**
     * Check if currently speaking
     */
    async isSpeaking(): Promise<boolean> {
        if (!isNativeiOS) return false;
        
        try {
            const status = await NativeTTS.isSpeaking();
            return status.speaking;
        } catch (error) {
            console.error('[NativeTTS] Error checking speaking status:', error);
            return false;
        }
    }

    /**
     * Add event listener for speech events
     */
    async addListener(
        eventName: 'speechStart' | 'speechEnd' | 'speechCancel',
        callback: () => void
    ): Promise<void> {
        if (!isNativeiOS) return;
        
        try {
            const listener = await NativeTTS.addListener(eventName, callback);
            this.listeners.push(listener);
        } catch (error) {
            console.error('[NativeTTS] Error adding listener:', error);
        }
    }

    /**
     * Remove all listeners
     */
    removeAllListeners(): void {
        this.listeners.forEach(listener => listener.remove());
        this.listeners = [];
    }

    /**
     * Clear cached voices (call this if user downloads new voices)
     */
    clearCache(): void {
        this.cachedVoices = null;
    }
}

// Export singleton instance
export const nativeTtsService = new NativeTtsServiceClass();

// Also export the class for testing
export { NativeTtsServiceClass };
