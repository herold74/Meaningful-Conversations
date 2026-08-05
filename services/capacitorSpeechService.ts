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
import {
    appendFinalSegment,
    mergeTranscriptPrefix,
    processIncrementalSpeechResults,
    type IncrementalSpeechState,
} from '../utils/webSpeechResultProcessing';

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

export interface FinalizeSpeechResult {
    transcript: string;
    isFinal: boolean;
}

const FINALIZE_SPEECH_TIMEOUT_MS = 2000;

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
     * Stop and wait for a committed (non-interim) transcript before returning.
     */
    stopAndFinalize(): Promise<FinalizeSpeechResult>;

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
    /** Accumulated transcript from previous auto-restart sessions.
     *  When the browser kills the session after a silence pause and we auto-restart,
     *  the Web Speech API resets event.results. This field preserves everything
     *  spoken before the restart so no text is lost. */
    private accumulatedTranscript: string = '';
    /** Transcript from the current recognition session, updated on every onresult.
     *  Captured into accumulatedTranscript before each auto-restart. */
    private currentSessionTranscript: string = '';
    /** Desktop/iOS browser: isFinal segments appended across result-array resets (manual send only). */
    private incrementalSpeechState: IncrementalSpeechState = { committedFinalText: '' };
    private finalizePending: {
        resolve: (result: FinalizeSpeechResult) => void;
        timeoutId: ReturnType<typeof setTimeout>;
    } | null = null;

    private getCommittedTranscriptOnly(): string {
        const committed = this.incrementalSpeechState.committedFinalText.trim();
        if (committed) {
            return mergeTranscriptPrefix(this.accumulatedTranscript, committed).trim();
        }
        return this.accumulatedTranscript.trim();
    }

    private resolveFinalize(transcript: string, isFinal: boolean): void {
        if (!this.finalizePending) return;
        clearTimeout(this.finalizePending.timeoutId);
        const resolve = this.finalizePending.resolve;
        this.finalizePending = null;
        this.cleanupRecognitionSession();
        resolve({ transcript: transcript.trim(), isFinal: isFinal && transcript.trim().length > 0 });
    }

    private cleanupRecognitionSession(): void {
        this.listening = false;
        this.lastStartArgs = null;
        this.accumulatedTranscript = '';
        this.currentSessionTranscript = '';
        this.incrementalSpeechState = { committedFinalText: '' };
        this.recognition = null;
    }

    private deliverResult(
        processed: { transcript: string; isFinal: boolean; confidence: number },
        onResult: (result: SpeechResult) => void,
    ): void {
        if (this.finalizePending) {
            if (processed.isFinal) {
                this.resolveFinalize(processed.transcript, true);
            }
            return;
        }
        if (this.stoppedManually) return;
        onResult({
            transcript: processed.transcript,
            isFinal: processed.isFinal,
            confidence: processed.confidence,
        });
    }

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
        this.incrementalSpeechState = { committedFinalText: '' };

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
            if (this.finalizePending) {
                this.resolveFinalize(this.getCommittedTranscriptOnly(), true);
                return;
            }

            // Browsers may fire onend after silence even with continuous=true
            // (Android Chrome: ~2-3s, Safari: varies, desktop Chrome: rare but possible).
            // Auto-restart keeps the mic open so the user can pause naturally.
            if (!this.stoppedManually && this.lastStartArgs) {
                if (this.currentSessionTranscript.trim()) {
                    this.accumulatedTranscript = mergeTranscriptPrefix(
                        this.accumulatedTranscript,
                        this.currentSessionTranscript,
                    );
                    this.currentSessionTranscript = '';
                }
                this.incrementalSpeechState = { committedFinalText: '' };
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
            this.incrementalSpeechState = { committedFinalText: '' };
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
            const processed = this.processResults(event);
            this.deliverResult(processed, onResult);
        };

        recognition.start();
    }

    async stop(): Promise<void> {
        this.finalizePending = null;
        this.stoppedManually = true;
        this.lastStartArgs = null;
        this.accumulatedTranscript = '';
        this.currentSessionTranscript = '';
        this.incrementalSpeechState = { committedFinalText: '' };
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

    async stopAndFinalize(): Promise<FinalizeSpeechResult> {
        if (!this.recognition) {
            return { transcript: this.getCommittedTranscriptOnly(), isFinal: false };
        }

        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                this.finalizePending = null;
                const transcript = this.getCommittedTranscriptOnly();
                this.cleanupRecognitionSession();
                resolve({ transcript, isFinal: transcript.length > 0 });
            }, FINALIZE_SPEECH_TIMEOUT_MS);

            this.finalizePending = { resolve, timeoutId };
            this.stoppedManually = true;
            this.lastStartArgs = null;

            try {
                this.recognition.stop();
            } catch (e) {
                clearTimeout(timeoutId);
                this.finalizePending = null;
                const transcript = this.getCommittedTranscriptOnly();
                this.cleanupRecognitionSession();
                resolve({ transcript, isFinal: transcript.length > 0 });
            }
        });
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
        let isFinal = false;
        let confidence = 0;

        if (isAndroidBrowser) {
            // Android adaptive detection — devices may deliver cumulative or incremental results
            const lastTranscript = resultsArray[resultsArray.length - 1][0].transcript;

            if (resultsArray.length === 1) {
                finalTranscript = lastTranscript;
            } else {
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
            }

            this.currentSessionTranscript = finalTranscript;
            finalTranscript = mergeTranscriptPrefix(this.accumulatedTranscript, finalTranscript);
            const lastResult = resultsArray[resultsArray.length - 1];
            isFinal = lastResult.isFinal;
            confidence = lastResult[0].confidence || 0;
            if (isFinal) {
                const finalOnly = resultsArray
                    .filter((r: any) => r.isFinal)
                    .map((r: any) => r[0].transcript)
                    .join(' ');
                if (finalOnly.trim()) {
                    this.incrementalSpeechState.committedFinalText = appendFinalSegment(
                        this.incrementalSpeechState.committedFinalText,
                        finalOnly,
                    );
                }
            }
        } else {
            // Desktop / iOS browsers: append isFinal segments via resultIndex (survives results-array resets)
            const processed = processIncrementalSpeechResults(event, this.incrementalSpeechState);
            this.currentSessionTranscript = processed.sessionTranscript;
            finalTranscript = mergeTranscriptPrefix(this.accumulatedTranscript, processed.sessionTranscript);
            isFinal = processed.isFinal;
            confidence = processed.confidence;
        }

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
    private sessionCommittedFinal: string = '';
    private finalizePending: {
        resolve: (result: FinalizeSpeechResult) => void;
        timeoutId: ReturnType<typeof setTimeout>;
    } | null = null;
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
        this.sessionCommittedFinal = '';
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
                if (data.isFinal && data.transcript.trim()) {
                    this.sessionCommittedFinal = data.transcript.trim();
                }
                const combined = this.accumulatedTranscript
                    ? this.accumulatedTranscript + ' ' + data.transcript
                    : data.transcript;

                if (this.finalizePending) {
                    if (data.isFinal) {
                        this.resolveNativeFinalize(combined, true);
                    }
                    return;
                }

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
                if (this.finalizePending) {
                    this.resolveNativeFinalize(this.getNativeCommittedTranscript(), true);
                    return;
                }

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
        this.finalizePending = null;
        this.stoppedManually = true;
        this.lastStartArgs = null;
        this.accumulatedTranscript = '';
        this.currentSessionTranscript = '';
        this.sessionCommittedFinal = '';
        try {
            this.removeAllListeners();
            await NativeSTT.stop();
            console.log('[NativeSpeechService] stop() resolved');
        } catch (e) {
            console.warn('[NativeSpeechService] Stop error (ignored):', e);
        }
        this.listening = false;
    }

    private getNativeCommittedTranscript(): string {
        const sessionFinal = this.sessionCommittedFinal.trim();
        if (sessionFinal) {
            return mergeTranscriptPrefix(this.accumulatedTranscript, sessionFinal).trim();
        }
        return this.accumulatedTranscript.trim();
    }

    private resolveNativeFinalize(transcript: string, isFinal: boolean): void {
        if (!this.finalizePending) return;
        clearTimeout(this.finalizePending.timeoutId);
        const resolve = this.finalizePending.resolve;
        this.finalizePending = null;
        this.cleanupNativeSession();
        resolve({ transcript: transcript.trim(), isFinal: isFinal && transcript.trim().length > 0 });
    }

    private cleanupNativeSession(): void {
        this.listening = false;
        this.lastStartArgs = null;
        this.accumulatedTranscript = '';
        this.currentSessionTranscript = '';
        this.sessionCommittedFinal = '';
        this.removeAllListeners();
    }

    async stopAndFinalize(): Promise<FinalizeSpeechResult> {
        if (!this.listening) {
            return { transcript: this.getNativeCommittedTranscript(), isFinal: false };
        }

        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                this.finalizePending = null;
                const transcript = this.getNativeCommittedTranscript();
                this.cleanupNativeSession();
                void NativeSTT.stop().catch(() => {});
                resolve({ transcript, isFinal: transcript.length > 0 });
            }, FINALIZE_SPEECH_TIMEOUT_MS);

            this.finalizePending = { resolve, timeoutId };
            this.stoppedManually = true;
            this.lastStartArgs = null;

            void NativeSTT.stop().catch(() => {
                clearTimeout(timeoutId);
                this.finalizePending = null;
                const transcript = this.getNativeCommittedTranscript();
                this.cleanupNativeSession();
                resolve({ transcript, isFinal: transcript.length > 0 });
            });
        });
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
