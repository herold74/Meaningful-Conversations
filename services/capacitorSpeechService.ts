/**
 * Capacitor Speech Service Abstraction
 * 
 * Provides a unified interface for speech recognition that automatically selects
 * between native custom NativeSTT plugin (iOS) and Web Speech API (browser).
 * 
 * This allows the same code to work in:
 * - Browser (desktop/mobile)
 * - PWA (installed on home screen)
 * - Native iOS app (via custom NativeSTTPlugin using Apple's SFSpeechRecognizer)
 * 
 * The WebSpeechService includes:
 * - Adaptive result processing for Android (cumulative vs incremental)
 * - Robust error handling with user-facing messages
 * - Debug logging for remote Android diagnostics
 * - Proper state management matching the native plugin lifecycle
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { isAndroidBrowser } from '../utils/platformDetection';

// Detect if running in native Capacitor environment
export const isNativeApp = Capacitor.isNativePlatform();

/**
 * Custom NativeSTT plugin interface - matches NativeSTTPlugin.swift
 */
interface NativeSTTPluginInterface {
    start(options: { language: string }): Promise<void>;
    stop(): Promise<void>;
    isAvailable(): Promise<{ available: boolean }>;
    requestPermission(): Promise<{ granted: boolean }>;
    addListener(eventName: 'partialResult', handler: (data: { transcript: string; isFinal: boolean }) => void): Promise<{ remove: () => void }>;
    addListener(eventName: 'error', handler: (data: { message: string }) => void): Promise<{ remove: () => void }>;
    addListener(eventName: 'started', handler: (data: Record<string, never>) => void): Promise<{ remove: () => void }>;
    addListener(eventName: 'stopped', handler: (data: Record<string, never>) => void): Promise<{ remove: () => void }>;
}

// Register our custom native plugin
const NativeSTT = registerPlugin<NativeSTTPluginInterface>('NativeSTT');

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
    /** Optional base URL for remote debug logging (Android diagnostics) */
    debugLogBaseUrl?: string;
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
     * @param onResult Callback for recognition results (transcript is adaptive-processed on Android)
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
 * Used in browsers and PWA mode.
 * 
 * Features:
 * - Adaptive result processing: handles both cumulative (Type A) and incremental (Type B)
 *   results from different Android devices/browser implementations
 * - Debug logging: sends SR data to backend for remote Android diagnostics
 * - Robust error handling: categorized errors with appropriate severity
 * - State management: explicit listening state tracking
 */
class WebSpeechService implements ISpeechService {
    private recognition: any = null; // webkitSpeechRecognition instance
    private listening: boolean = false;
    private debugLogBaseUrl: string | null = null;
    /** Set to true only when stop() is called explicitly by the user. */
    private stoppedManually: boolean = false;
    /** Saved options/callbacks for Android auto-restart after silence timeout. */
    private lastStartArgs: {
        options: SpeechOptions;
        onResult: (result: SpeechResult) => void;
        onError?: (error: Error) => void;
        onStart?: () => void;
        onEnd?: () => void;
    } | null = null;
    /** Accumulated transcript from previous auto-restart sessions (Android only).
     *  When Chrome kills the session after a silence pause and we auto-restart,
     *  the Web Speech API resets event.results. This field preserves everything
     *  spoken before the restart so no text is lost. */
    private accumulatedTranscript: string = '';
    /** Transcript from the current recognition session, updated on every onresult.
     *  Captured into accumulatedTranscript before each auto-restart. */
    private currentSessionTranscript: string = '';

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
        // Stop any existing recognition (without triggering auto-restart)
        this.stoppedManually = true;
        await this.stop();
        this.stoppedManually = false;

        this.debugLogBaseUrl = options.debugLogBaseUrl || null;

        // Reset accumulation for the new recording session
        this.accumulatedTranscript = '';
        this.currentSessionTranscript = '';

        // Save args for Android auto-restart
        if (isAndroidBrowser) {
            this.lastStartArgs = { options, onResult, onError, onStart, onEnd };
        }

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
            console.log('[WebSpeechService] 🎙️ Recognition started');
            this.listening = true;
            onStart?.();
        };

        recognition.onend = () => {
            // Android Chrome fires onend after 2-3s of silence even with
            // continuous=true. Auto-restart keeps the mic open so the user
            // can pause naturally without having to tap the button again.
            // This ONLY runs on Android — PC and iOS are unaffected.
            if (isAndroidBrowser && !this.stoppedManually && this.lastStartArgs) {
                // Preserve text from the session that just ended so it
                // survives the fresh event.results after restart.
                if (this.currentSessionTranscript.trim()) {
                    this.accumulatedTranscript = this.accumulatedTranscript
                        ? this.accumulatedTranscript + ' ' + this.currentSessionTranscript
                        : this.currentSessionTranscript;
                    this.currentSessionTranscript = '';
                }
                console.log('[WebSpeechService] 🔄 Android auto-restart after silence timeout, accumulated:', this.accumulatedTranscript.length, 'chars');
                try {
                    recognition.start();
                    return;
                } catch (e) {
                    console.warn('[WebSpeechService] Auto-restart failed, ending normally:', e);
                }
            }

            console.log('[WebSpeechService] 🎙️ Recognition ended');
            this.listening = false;
            this.lastStartArgs = null;
            this.accumulatedTranscript = '';
            this.currentSessionTranscript = '';
            onEnd?.();
        };

        recognition.onerror = (event: any) => {
            const errorCode = event.error || 'unknown';

            // On Android, 'no-speech' fires before the automatic onend.
            // We allow auto-restart to handle it — don't kill the session.
            if (isAndroidBrowser && errorCode === 'no-speech' && !this.stoppedManually) {
                console.log('[WebSpeechService] 🤖 Android no-speech — will auto-restart on end');
                return;
            }

            this.listening = false;
            
            // Categorized error handling
            switch (errorCode) {
                case 'not-allowed':
                    console.error('[WebSpeechService] Microphone access denied');
                    onError?.(new Error('microphone_permission_denied'));
                    break;
                case 'no-speech':
                    console.warn('[WebSpeechService] No speech detected');
                    break;
                case 'audio-capture':
                    console.error('[WebSpeechService] Audio capture failed');
                    onError?.(new Error('microphone_error'));
                    break;
                case 'network':
                    console.error('[WebSpeechService] Network error during recognition');
                    onError?.(new Error('network_error'));
                    break;
                case 'aborted':
                    console.warn('[WebSpeechService] Recognition aborted (expected on stop)');
                    break;
                default:
                    console.error('[WebSpeechService] Recognition error:', errorCode);
                    onError?.(new Error(errorCode));
            }
        };

        recognition.onresult = (event: any) => {
            // Process results with Android-adaptive logic
            const processed = this.processResults(event);
            onResult({
                transcript: processed.transcript,
                isFinal: processed.isFinal,
                confidence: processed.confidence
            });
        };

        recognition.start();
    }

    async stop(): Promise<void> {
        this.stoppedManually = true;
        this.lastStartArgs = null;
        this.accumulatedTranscript = '';
        this.currentSessionTranscript = '';
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

    /**
     * Process speech recognition results with adaptive handling for different
     * Android devices/browser implementations.
     * 
     * ANDROID BUG FIX v2: Different Android devices/versions behave differently:
     * Type A (Cumulative): Each result builds on previous - results = [{t:"hello"}, {t:"hello world"}]
     * Type B (Incremental): Each result is a separate segment - results = [{t:"hello"}, {t:"world"}]
     * 
     * Detection: If the last result's transcript starts with the previous result's transcript,
     * it's cumulative (Type A). Otherwise it's incremental (Type B).
     */
    private processResults(event: any): { transcript: string; isFinal: boolean; confidence: number } {
        const resultsArray = Array.from(event.results) as any[];

        // #region Android SR debug logging
        if (this.debugLogBaseUrl) {
            const resultsDebug = resultsArray.map((r: any, idx: number) => ({
                idx,
                isFinal: r.isFinal,
                transcript: r[0].transcript,
                confidence: r[0].confidence
            }));
            const srDebugData1 = {
                resultIndex: event.resultIndex,
                resultsLength: event.results.length,
                results: resultsDebug
            };
            console.log('[SR-DEBUG] onresult RAW', srDebugData1);
            fetch(`${this.debugLogBaseUrl}/api/debug/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: 'WebSpeechService:onresult',
                    message: 'SR onresult RAW',
                    data: srDebugData1,
                    timestamp: Date.now(),
                    sessionId: 'sr-android-debug'
                })
            }).catch(() => {});
        }
        // #endregion
        
        let finalTranscript = '';

        if (resultsArray.length === 1) {
            // Only one result - use it directly
            finalTranscript = resultsArray[0][0].transcript;
        } else {
            // Multiple results - detect cumulative vs incremental
            const lastTranscript = resultsArray[resultsArray.length - 1][0].transcript;
            const secondLastTranscript = resultsArray[resultsArray.length - 2][0].transcript;

            if (lastTranscript.startsWith(secondLastTranscript) ||
                lastTranscript.toLowerCase().startsWith(secondLastTranscript.toLowerCase())) {
                // Cumulative (Type A) - use last result directly
                finalTranscript = lastTranscript;
            } else if (lastTranscript.length > secondLastTranscript.length * 0.8) {
                // Last is significantly long - probably cumulative but with corrections
                finalTranscript = lastTranscript;
            } else {
                // Incremental (Type B) - concatenate all isFinal results
                finalTranscript = resultsArray
                    .filter((r: any) => r.isFinal)
                    .map((r: any) => r[0].transcript)
                    .join(' ');
                // If nothing is final yet, just use the last result
                if (!finalTranscript.trim()) {
                    finalTranscript = lastTranscript;
                }
            }
        }

        // #region Android SR debug logging
        if (this.debugLogBaseUrl) {
            const srDebugData2 = {
                detectedType: resultsArray.length > 1 &&
                    resultsArray[resultsArray.length - 1][0].transcript.startsWith(
                        resultsArray[resultsArray.length - 2][0].transcript
                    ) ? 'cumulative' : 'incremental',
                finalTranscript,
                strategy: 'adaptive-v2'
            };
            console.log('[SR-DEBUG] after adaptive processing', srDebugData2);
            fetch(`${this.debugLogBaseUrl}/api/debug/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: 'WebSpeechService:adaptive',
                    message: 'SR adaptive result',
                    data: srDebugData2,
                    timestamp: Date.now(),
                    sessionId: 'sr-android-debug'
                })
            }).catch(() => {});
        }
        // #endregion

        // Track what we got from the current session (for accumulation on auto-restart)
        this.currentSessionTranscript = finalTranscript;

        // Prepend text from previous auto-restart sessions so nothing is lost
        if (this.accumulatedTranscript) {
            finalTranscript = this.accumulatedTranscript + ' ' + finalTranscript;
        }

        // Get confidence from last result
        const lastResult = resultsArray[resultsArray.length - 1];
        const isFinal = lastResult.isFinal;
        const confidence = lastResult[0].confidence || 0;

        return { transcript: finalTranscript, isFinal, confidence };
    }
}

/**
 * Native Speech Service - Uses custom NativeSTTPlugin (SFSpeechRecognizer)
 * Used in native iOS apps - provides proper audio session management
 */
class NativeSpeechService implements ISpeechService {
    private listening: boolean = false;
    private listeners: Array<{ remove: () => void }> = [];

    async isAvailable(): Promise<boolean> {
        try {
            const result = await NativeSTT.isAvailable();
            return result.available;
        } catch (e) {
            console.warn('[NativeSpeechService] Availability check failed:', e);
            return false;
        }
    }

    async requestPermission(): Promise<boolean> {
        try {
            const result = await NativeSTT.requestPermission();
            return result.granted;
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
            // Set up event listeners BEFORE starting
            const partialResultListener = await NativeSTT.addListener('partialResult', (data) => {
                console.log('[NativeSpeechService] Result:', data.transcript);
                onResult({
                    transcript: data.transcript,
                    isFinal: data.isFinal
                });
            });
            this.listeners.push(partialResultListener);

            const errorListener = await NativeSTT.addListener('error', (data) => {
                console.error('[NativeSpeechService] Error event:', data.message);
                this.listening = false;
                onError?.(new Error(data.message));
            });
            this.listeners.push(errorListener);

            const startedListener = await NativeSTT.addListener('started', () => {
                console.log('[NativeSpeechService] 🎙️ Started');
                this.listening = true;
                onStart?.();
            });
            this.listeners.push(startedListener);

            const stoppedListener = await NativeSTT.addListener('stopped', () => {
                console.log('[NativeSpeechService] 🎙️ Stopped');
                this.listening = false;
                onEnd?.();
            });
            this.listeners.push(stoppedListener);

            // Start recognition via native plugin
            await NativeSTT.start({ language: options.language });
            
            console.log('[NativeSpeechService] start() resolved');

        } catch (error) {
            this.listening = false;
            this.removeAllListeners();
            console.error('[NativeSpeechService] Start error:', error);
            const err = error instanceof Error ? error : new Error('Failed to start speech recognition');
            onError?.(err);
            throw err;
        }
    }

    async stop(): Promise<void> {
        try {
            this.removeAllListeners();
            await NativeSTT.stop();
            console.log('[NativeSpeechService] stop() resolved');
        } catch (e) {
            // Ignore errors during stop
            console.warn('[NativeSpeechService] Stop error (ignored):', e);
        }
        this.listening = false;
    }

    isListening(): boolean {
        return this.listening;
    }

    private removeAllListeners() {
        for (const listener of this.listeners) {
            try {
                listener.remove();
            } catch (e) {
                // Ignore
            }
        }
        this.listeners = [];
    }
}

/**
 * Factory function - returns the appropriate speech service based on platform
 */
function createSpeechService(): ISpeechService {
    if (isNativeApp) {
        console.log('[SpeechService] Using NativeSpeechService (Custom NativeSTT Plugin)');
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
