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

        this.lastStartArgs = { options, onResult, onError, onStart, onEnd };

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
            // Browsers may fire onend after silence even with continuous=true
            // (Android Chrome: ~2-3s, Safari: varies, desktop Chrome: rare but possible).
            // Auto-restart keeps the mic open so the user can pause naturally.
            if (!this.stoppedManually && this.lastStartArgs) {
                if (this.currentSessionTranscript.trim()) {
                    this.accumulatedTranscript = this.accumulatedTranscript
                        ? this.accumulatedTranscript + ' ' + this.currentSessionTranscript
                        : this.currentSessionTranscript;
                    this.currentSessionTranscript = '';
                }
                console.log('[WebSpeechService] 🔄 Auto-restart after silence timeout, accumulated:', this.accumulatedTranscript.length, 'chars');
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

            // 'no-speech' fires before the automatic onend on silence timeout.
            // Auto-restart in onend will handle it — don't kill the session.
            if (errorCode === 'no-speech' && !this.stoppedManually) {
                console.log('[WebSpeechService] no-speech — will auto-restart on end');
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
            if (this.stoppedManually) return;
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
     * Process speech recognition results.
     *
     * Desktop/iOS browsers always deliver incremental results (one entry per
     * phrase). Android devices vary between cumulative (Type A) and incremental
     * (Type B), so adaptive detection is used only there.
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
            console.log('[SR-DEBUG] onresult RAW', {
                resultIndex: event.resultIndex,
                resultsLength: event.results.length,
                results: resultsDebug
            });
            fetch(`${this.debugLogBaseUrl}/api/debug/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: 'WebSpeechService:onresult',
                    message: 'SR onresult RAW',
                    data: { resultIndex: event.resultIndex, resultsLength: event.results.length, results: resultsDebug },
                    timestamp: Date.now(),
                    sessionId: 'sr-android-debug'
                })
            }).catch(() => {});
        }
        // #endregion
        
        let finalTranscript = '';

        if (resultsArray.length === 1) {
            finalTranscript = resultsArray[0][0].transcript;
        } else if (isAndroidBrowser) {
            // Android adaptive detection — devices may deliver cumulative or incremental results
            const lastTranscript = resultsArray[resultsArray.length - 1][0].transcript;
            const secondLastTranscript = resultsArray[resultsArray.length - 2][0].transcript;

            if (lastTranscript.startsWith(secondLastTranscript) ||
                lastTranscript.toLowerCase().startsWith(secondLastTranscript.toLowerCase())) {
                finalTranscript = lastTranscript;
            } else if (lastTranscript.length > secondLastTranscript.length * 0.8) {
                finalTranscript = lastTranscript;
            } else {
                finalTranscript = resultsArray
                    .filter((r: any) => r.isFinal)
                    .map((r: any) => r[0].transcript)
                    .join(' ');
                if (!finalTranscript.trim()) {
                    finalTranscript = lastTranscript;
                }
            }
        } else {
            // Desktop / iOS browsers: results are always incremental — concatenate all
            const finals = resultsArray
                .filter((r: any) => r.isFinal)
                .map((r: any) => r[0].transcript)
                .join(' ');
            const lastResult = resultsArray[resultsArray.length - 1];
            if (!lastResult.isFinal) {
                finalTranscript = finals
                    ? finals + ' ' + lastResult[0].transcript
                    : lastResult[0].transcript;
            } else {
                finalTranscript = finals;
            }
        }

        this.currentSessionTranscript = finalTranscript;

        if (this.accumulatedTranscript) {
            finalTranscript = this.accumulatedTranscript + ' ' + finalTranscript;
        }

        const lastResult = resultsArray[resultsArray.length - 1];
        const isFinal = lastResult.isFinal;
        const confidence = lastResult[0].confidence || 0;

        return { transcript: finalTranscript, isFinal, confidence };
    }
}

/**
 * Native Speech Service - Uses custom NativeSTTPlugin (SFSpeechRecognizer)
 * Used in native iOS apps - provides proper audio session management.
 *
 * Includes auto-restart on silence/timeout to match the Android WebSpeechService
 * behavior: when iOS ends recognition after a pause, the service transparently
 * restarts and preserves all previously recognized text via accumulatedTranscript.
 */
class NativeSpeechService implements ISpeechService {
    private listening: boolean = false;
    private listeners: Array<{ remove: () => void }> = [];
    private stoppedManually: boolean = false;
    private accumulatedTranscript: string = '';
    private currentSessionTranscript: string = '';
    private lastStartArgs: {
        options: SpeechOptions;
        onResult: (result: SpeechResult) => void;
        onError?: (error: Error) => void;
        onStart?: () => void;
        onEnd?: () => void;
    } | null = null;

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

        this.stoppedManually = false;
        this.accumulatedTranscript = '';
        this.currentSessionTranscript = '';
        this.lastStartArgs = { options, onResult, onError, onStart, onEnd };

        await this.startInternal(options, onResult, onError, onStart, onEnd);
    }

    private async startInternal(
        options: SpeechOptions,
        onResult: (result: SpeechResult) => void,
        onError?: (error: Error) => void,
        onStart?: () => void,
        onEnd?: () => void
    ): Promise<void> {
        try {
            const partialResultListener = await NativeSTT.addListener('partialResult', (data) => {
                this.currentSessionTranscript = data.transcript;
                const combined = this.accumulatedTranscript
                    ? this.accumulatedTranscript + ' ' + data.transcript
                    : data.transcript;
                onResult({
                    transcript: combined,
                    isFinal: data.isFinal
                });
            });
            this.listeners.push(partialResultListener);

            const errorListener = await NativeSTT.addListener('error', (data) => {
                if (!this.stoppedManually) {
                    console.log('[NativeSpeechService] Error during active session (auto-restart will handle):', data.message);
                    return;
                }
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
                if (!this.stoppedManually && this.lastStartArgs) {
                    if (this.currentSessionTranscript.trim()) {
                        this.accumulatedTranscript = this.accumulatedTranscript
                            ? this.accumulatedTranscript + ' ' + this.currentSessionTranscript
                            : this.currentSessionTranscript;
                        this.currentSessionTranscript = '';
                    }
                    console.log('[NativeSpeechService] 🔄 Auto-restart after silence/timeout, accumulated:', this.accumulatedTranscript.length, 'chars');

                    this.removeAllListeners();

                    setTimeout(async () => {
                        if (this.stoppedManually || !this.lastStartArgs) return;
                        try {
                            const args = this.lastStartArgs;
                            await this.startInternal(args.options, args.onResult, args.onError, args.onStart, args.onEnd);
                        } catch (e) {
                            console.error('[NativeSpeechService] Auto-restart failed:', e);
                            this.listening = false;
                            this.lastStartArgs = null;
                            this.accumulatedTranscript = '';
                            this.currentSessionTranscript = '';
                            onEnd?.();
                        }
                    }, 300);
                    return;
                }

                console.log('[NativeSpeechService] 🎙️ Stopped');
                this.listening = false;
                this.lastStartArgs = null;
                this.accumulatedTranscript = '';
                this.currentSessionTranscript = '';
                onEnd?.();
            });
            this.listeners.push(stoppedListener);

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
        this.stoppedManually = true;
        this.lastStartArgs = null;
        this.accumulatedTranscript = '';
        this.currentSessionTranscript = '';
        try {
            this.removeAllListeners();
            await NativeSTT.stop();
            console.log('[NativeSpeechService] stop() resolved');
        } catch (e) {
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
