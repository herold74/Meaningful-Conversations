/**
 * Capacitor Audio Service Abstraction
 * 
 * Provides a unified interface for audio playback that works across:
 * - Browser (desktop/mobile)
 * - PWA (installed on home screen)
 * - Native iOS app (via Capacitor)
 * - Native Android app (via Capacitor)
 * 
 * Note: Both Web and Native services use HTML5 Audio because:
 * 1. Capacitor's WKWebView doesn't have Safari's strict autoplay restrictions
 * 2. HTML5 Audio supports blob URLs (needed for TTS)
 * 3. The NativeAudio plugin is better for pre-loaded assets, not dynamic content
 */

import { Capacitor } from '@capacitor/core';
// Note: NativeAudio plugin not used for TTS - HTML5 Audio works better for blob URLs

// Detect if running in native Capacitor environment
export const isNativeApp = Capacitor.isNativePlatform();

/**
 * Audio playback interface - implemented by both native and web services
 */
export interface IAudioService {
    /**
     * Play audio from a Blob (typically from server TTS)
     * @param blob Audio data as Blob
     * @param onStart Callback when playback starts
     * @param onEnd Callback when playback ends
     * @param onError Callback on playback error
     * @returns Cleanup function to stop playback
     */
    playBlob(
        blob: Blob,
        onStart?: () => void,
        onEnd?: () => void,
        onError?: (error: Error) => void
    ): Promise<() => void>;

    /**
     * Play audio from a URL
     * @param url Audio URL
     * @param onStart Callback when playback starts
     * @param onEnd Callback when playback ends
     * @param onError Callback on playback error
     * @returns Cleanup function to stop playback
     */
    playUrl(
        url: string,
        onStart?: () => void,
        onEnd?: () => void,
        onError?: (error: Error) => void
    ): Promise<() => void>;

    /**
     * Stop current playback
     */
    stop(): void;

    /**
     * Pause current playback
     */
    pause(): void;

    /**
     * Resume paused playback
     */
    resume(): void;

    /**
     * Check if audio is currently playing
     */
    isPlaying(): boolean;

    /**
     * Prepare audio session for playback (iOS requires this for reliable audio)
     */
    prepareSession(): Promise<void>;
}

/**
 * Web Audio Service - Uses HTML5 Audio API
 * Used in browsers and PWA mode
 */
class WebAudioService implements IAudioService {
    private audioElement: HTMLAudioElement | null = null;
    private currentBlobUrl: string | null = null;
    private playing: boolean = false;

    async playBlob(
        blob: Blob,
        onStart?: () => void,
        onEnd?: () => void,
        onError?: (error: Error) => void
    ): Promise<() => void> {
        // Cleanup previous playback
        this.stop();

        const url = URL.createObjectURL(blob);
        this.currentBlobUrl = url;

        return this.playUrl(url, onStart, () => {
            // Cleanup blob URL when done
            if (this.currentBlobUrl) {
                URL.revokeObjectURL(this.currentBlobUrl);
                this.currentBlobUrl = null;
            }
            onEnd?.();
        }, onError);
    }

    async playUrl(
        url: string,
        onStart?: () => void,
        onEnd?: () => void,
        onError?: (error: Error) => void
    ): Promise<() => void> {
        // Cleanup previous
        this.stop();

        const audio = new Audio();
        this.audioElement = audio;

        audio.addEventListener('play', () => {
            this.playing = true;
            onStart?.();
        });

        audio.addEventListener('ended', () => {
            this.playing = false;
            onEnd?.();
        });

        audio.addEventListener('error', (e) => {
            this.playing = false;
            const error = new Error(audio.error?.message || 'Audio playback failed');
            console.error('[WebAudioService] Playback error:', e);
            onError?.(error);
        });

        audio.src = url;

        try {
            await audio.play();
        } catch (error) {
            this.playing = false;
            const err = error instanceof Error ? error : new Error('Playback failed');
            onError?.(err);
        }

        // Return cleanup function
        return () => this.stop();
    }

    stop(): void {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
            this.audioElement = null;
        }
        if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
            this.currentBlobUrl = null;
        }
        this.playing = false;
    }

    pause(): void {
        if (this.audioElement) {
            this.audioElement.pause();
            this.playing = false;
        }
    }

    resume(): void {
        if (this.audioElement) {
            this.audioElement.play().catch(console.error);
            this.playing = true;
        }
    }

    isPlaying(): boolean {
        return this.playing;
    }

    async prepareSession(): Promise<void> {
        // Web doesn't need session preparation in most cases
        // But we can warm up AudioContext for iOS Safari
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                if (ctx.state === 'suspended') {
                    await ctx.resume();
                }
                // Play silent buffer to unlock audio
                const buffer = ctx.createBuffer(1, 1, 22050);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();
            }
        } catch (e) {
            console.warn('[WebAudioService] Could not prepare audio session:', e);
        }
    }
}

/**
 * Native Audio Service - Uses HTML5 Audio in Capacitor's WKWebView
 * 
 * Note: We use HTML5 Audio instead of the NativeAudio plugin because:
 * 1. NativeAudio doesn't support blob URLs (only file paths and http URLs)
 * 2. Capacitor's WKWebView doesn't have Safari's strict autoplay restrictions
 * 3. HTML5 Audio works perfectly for TTS playback in native apps
 * 
 * The NativeAudio plugin is better suited for pre-loaded sound effects,
 * not dynamic audio content like TTS.
 */
class NativeAudioService implements IAudioService {
    private audioElement: HTMLAudioElement | null = null;
    private currentBlobUrl: string | null = null;
    private playing: boolean = false;

    async playBlob(
        blob: Blob,
        onStart?: () => void,
        onEnd?: () => void,
        onError?: (error: Error) => void
    ): Promise<() => void> {
        // Cleanup previous playback
        this.stop();

        const url = URL.createObjectURL(blob);
        this.currentBlobUrl = url;

        return this.playUrl(url, onStart, () => {
            // Cleanup blob URL when done
            if (this.currentBlobUrl) {
                URL.revokeObjectURL(this.currentBlobUrl);
                this.currentBlobUrl = null;
            }
            onEnd?.();
        }, onError);
    }

    async playUrl(
        url: string,
        onStart?: () => void,
        onEnd?: () => void,
        onError?: (error: Error) => void
    ): Promise<() => void> {
        // Cleanup previous
        this.stop();

        const audio = new Audio();
        this.audioElement = audio;

        audio.addEventListener('play', () => {
            this.playing = true;
            console.log('[NativeAudioService] Audio started playing');
            onStart?.();
        });

        audio.addEventListener('ended', () => {
            this.playing = false;
            console.log('[NativeAudioService] Audio ended');
            onEnd?.();
        });

        audio.addEventListener('error', (e) => {
            this.playing = false;
            // Get detailed error info from HTMLMediaElement
            const mediaError = audio.error;
            const errorCodes: Record<number, string> = {
                1: 'MEDIA_ERR_ABORTED',
                2: 'MEDIA_ERR_NETWORK', 
                3: 'MEDIA_ERR_DECODE',
                4: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
            };
            const errorCode = mediaError?.code || 0;
            const errorName = errorCodes[errorCode] || 'UNKNOWN';
            const errorMessage = mediaError?.message || 'Audio playback failed';
            
            console.error('[NativeAudioService] Playback error:', {
                code: errorCode,
                codeName: errorName,
                message: errorMessage,
                networkState: audio.networkState,
                readyState: audio.readyState,
                src: audio.src ? 'blob URL present' : 'no src'
            });
            
            // iOS Simulator often fails with MEDIA_ERR_DECODE (3) or MEDIA_ERR_SRC_NOT_SUPPORTED (4)
            // This is a known limitation - suggest testing on real device
            if (errorCode === 3 || errorCode === 4) {
                console.warn('[NativeAudioService] This may be an iOS Simulator limitation. Audio works better on real devices.');
            }
            
            onError?.(new Error(`${errorName}: ${errorMessage}`));
        });

        // Add additional event listeners for debugging
        audio.addEventListener('loadstart', () => {
            console.log('[NativeAudioService] Audio loadstart');
        });
        
        audio.addEventListener('canplay', () => {
            console.log('[NativeAudioService] Audio canplay - ready to play');
        });

        audio.src = url;

        try {
            await audio.play();
        } catch (error) {
            this.playing = false;
            const err = error instanceof Error ? error : new Error('Playback failed');
            console.error('[NativeAudioService] Play failed:', err.message || error);
            onError?.(err);
        }

        // Return cleanup function
        return () => this.stop();
    }

    stop(): void {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
            this.audioElement = null;
        }
        if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
            this.currentBlobUrl = null;
        }
        this.playing = false;
    }

    pause(): void {
        if (this.audioElement) {
            this.audioElement.pause();
            this.playing = false;
        }
    }

    resume(): void {
        if (this.audioElement) {
            this.audioElement.play().catch(console.error);
            this.playing = true;
        }
    }

    isPlaying(): boolean {
        return this.playing;
    }

    async prepareSession(): Promise<void> {
        // In Capacitor's WKWebView, we don't need special session preparation
        // but we can warm up AudioContext for consistency
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                if (ctx.state === 'suspended') {
                    await ctx.resume();
                }
                // Play silent buffer to warm up audio
                const buffer = ctx.createBuffer(1, 1, 22050);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();
            }
            console.log('[NativeAudioService] Audio session prepared');
        } catch (e) {
            console.warn('[NativeAudioService] Could not prepare audio session:', e);
        }
    }
}

/**
 * Factory function - returns the appropriate audio service based on platform
 */
function createAudioService(): IAudioService {
    if (isNativeApp) {
        console.log('[AudioService] Using NativeAudioService (Capacitor)');
        return new NativeAudioService();
    } else {
        console.log('[AudioService] Using WebAudioService (Browser)');
        return new WebAudioService();
    }
}

// Export singleton instance
export const audioService: IAudioService = createAudioService();

// Also export classes for testing or manual instantiation
export { WebAudioService, NativeAudioService };
