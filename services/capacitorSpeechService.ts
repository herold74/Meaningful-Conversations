/**
 * Capacitor Speech Service Abstraction
 * 
 * Provides a unified interface for speech recognition that automatically selects
 * between native Capacitor plugins (iOS/Android) and Web Speech API (browser).
 * 
 * This allows the same code to work in:
 * - Browser (desktop/mobile)
 * - PWA (installed on home screen)
 * - Native iOS app (via Capacitor)
 * - Native Android app (via Capacitor)
 */

import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

// Detect if running in native Capacitor environment
export const isNativeApp = Capacitor.isNativePlatform();

/**
 * Speech recognition result
 */
export interface SpeechResult {
    transcript: string;
    isFinal: boolean;
    confidence?: number;
}

/**
 * Speech recognition options
 */
export interface SpeechOptions {
    language: 'de-DE' | 'en-US' | string;
    continuous?: boolean;
    interimResults?: boolean;
}

/**
 * Speech recognition interface - implemented by both native and web services
 */
export interface ISpeechService {
    /**
     * Check if speech recognition is available on this platform
     */
    isAvailable(): Promise<boolean>;

    /**
     * Request microphone permission (native only)
     */
    requestPermission(): Promise<boolean>;

    /**
     * Start listening for speech
     * @param options Recognition options
     * @param onResult Callback for recognition results
     * @param onError Callback for errors
     * @param onStart Callback when listening starts
     * @param onEnd Callback when listening ends
     */
    start(
        options: SpeechOptions,
        onResult: (result: SpeechResult) => void,
        onError?: (error: Error) => void,
        onStart?: () => void,
        onEnd?: () => void
    ): Promise<void>;

    /**
     * Stop listening
     */
    stop(): Promise<void>;

    /**
     * Check if currently listening
     */
    isListening(): boolean;
}

/**
 * Web Speech Service - Uses Web Speech API (webkitSpeechRecognition)
 * Used in browsers and PWA mode
 */
class WebSpeechService implements ISpeechService {
    private recognition: any = null; // webkitSpeechRecognition instance
    private listening: boolean = false;

    async isAvailable(): Promise<boolean> {
        return typeof window !== 'undefined' && 
               ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    }

    async requestPermission(): Promise<boolean> {
        // Web Speech API requests permission automatically when starting
        // But we can try to get microphone permission proactively
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (e) {
            console.warn('[WebSpeechService] Microphone permission denied:', e);
            return false;
        }
    }

    async start(
        options: SpeechOptions,
        onResult: (result: SpeechResult) => void,
        onError?: (error: Error) => void,
        onStart?: () => void,
        onEnd?: () => void
    ): Promise<void> {
        // Stop any existing recognition
        await this.stop();

        const SpeechRecognitionAPI = (window as any).SpeechRecognition || 
                                     (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognitionAPI) {
            throw new Error('Speech recognition not supported in this browser');
        }

        const recognition = new SpeechRecognitionAPI();
        this.recognition = recognition;

        recognition.continuous = options.continuous ?? true;
        recognition.interimResults = options.interimResults ?? true;
        recognition.lang = options.language;

        recognition.onstart = () => {
            this.listening = true;
            onStart?.();
        };

        recognition.onend = () => {
            this.listening = false;
            onEnd?.();
        };

        recognition.onerror = (event: any) => {
            this.listening = false;
            const errorMessage = event.error || 'Speech recognition error';
            console.error('[WebSpeechService] Error:', errorMessage);
            
            // Don't report 'aborted' as error - it's expected when stopping
            if (event.error !== 'aborted') {
                onError?.(new Error(errorMessage));
            }
        };

        recognition.onresult = (event: any) => {
            // Process all results
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                onResult({
                    transcript: result[0].transcript,
                    isFinal: result.isFinal,
                    confidence: result[0].confidence
                });
            }
        };

        recognition.start();
    }

    async stop(): Promise<void> {
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                // Ignore errors during stop
            }
            this.recognition = null;
        }
        this.listening = false;
    }

    isListening(): boolean {
        return this.listening;
    }
}

/**
 * Native Speech Service - Uses Capacitor SpeechRecognition plugin
 * Used in native iOS and Android apps
 */
class NativeSpeechService implements ISpeechService {
    private listening: boolean = false;
    private listenerHandle: any = null;

    async isAvailable(): Promise<boolean> {
        try {
            const result = await SpeechRecognition.available();
            return result.available;
        } catch (e) {
            console.warn('[NativeSpeechService] Availability check failed:', e);
            return false;
        }
    }

    async requestPermission(): Promise<boolean> {
        try {
            const result = await SpeechRecognition.requestPermissions();
            return result.speechRecognition === 'granted';
        } catch (e) {
            console.error('[NativeSpeechService] Permission request failed:', e);
            return false;
        }
    }

    async start(
        options: SpeechOptions,
        onResult: (result: SpeechResult) => void,
        onError?: (error: Error) => void,
        onStart?: () => void,
        onEnd?: () => void
    ): Promise<void> {
        // Stop any existing recognition
        await this.stop();

        try {
            // Check permissions first
            const hasPermission = await this.requestPermission();
            if (!hasPermission) {
                throw new Error('Speech recognition permission denied');
            }

            // Set up result listener
            this.listenerHandle = await SpeechRecognition.addListener('partialResults', (data: any) => {
                if (data.matches && data.matches.length > 0) {
                    onResult({
                        transcript: data.matches[0],
                        isFinal: false,
                        confidence: undefined
                    });
                }
            });

            // Start recognition
            await SpeechRecognition.start({
                language: options.language,
                maxResults: 5,
                partialResults: options.interimResults ?? true,
                popup: false // Don't show native UI
            });

            this.listening = true;
            onStart?.();

            // Note: Native speech recognition typically stops automatically
            // after silence. We need to handle this.
            // The plugin doesn't have an onEnd event, so we'll need to
            // detect end state differently.

        } catch (error) {
            this.listening = false;
            console.error('[NativeSpeechService] Start error:', error);
            const err = error instanceof Error ? error : new Error('Failed to start speech recognition');
            onError?.(err);
        }
    }

    async stop(): Promise<void> {
        try {
            if (this.listenerHandle) {
                this.listenerHandle.remove();
                this.listenerHandle = null;
            }
            await SpeechRecognition.stop();
        } catch (e) {
            // Ignore errors during stop
        }
        this.listening = false;
    }

    isListening(): boolean {
        return this.listening;
    }
}

/**
 * Factory function - returns the appropriate speech service based on platform
 */
function createSpeechService(): ISpeechService {
    if (isNativeApp) {
        console.log('[SpeechService] Using NativeSpeechService (Capacitor)');
        return new NativeSpeechService();
    } else {
        console.log('[SpeechService] Using WebSpeechService (Browser)');
        return new WebSpeechService();
    }
}

// Export singleton instance
export const speechService: ISpeechService = createSpeechService();

// Also export classes for testing or manual instantiation
export { WebSpeechService, NativeSpeechService };
