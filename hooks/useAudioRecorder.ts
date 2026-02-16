import { useState, useRef, useCallback, useEffect } from 'react';
import { useWakeLock } from './useWakeLock';

const MAX_DURATION_S = 3600; // 60 minutes

export interface UseAudioRecorder {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    audioBlob: Blob | null;
    startRecording: () => Promise<void>;
    pauseRecording: () => void;
    resumeRecording: () => void;
    stopRecording: () => void;
    resetRecording: () => void;
    error: string | null;
    isSupported: boolean;
    isWakeLockSupported: boolean;
}

export function useAudioRecorder(): UseAudioRecorder {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const durationRef = useRef(0);

    const { request: requestWakeLock, release: releaseWakeLock, isSupported: isWakeLockSupported } = useWakeLock();

    const isSupported = typeof MediaRecorder !== 'undefined' && typeof navigator?.mediaDevices?.getUserMedia === 'function';

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        clearTimer();
        timerRef.current = setInterval(() => {
            durationRef.current += 1;
            setDuration(durationRef.current);
            if (durationRef.current >= MAX_DURATION_S) {
                mediaRecorderRef.current?.stop();
            }
        }, 1000);
    }, [clearTimer]);

    const startRecording = useCallback(async () => {
        setError(null);
        setAudioBlob(null);
        chunksRef.current = [];
        durationRef.current = 0;
        setDuration(0);

        if (!isSupported) {
            setError('MediaRecorder is not supported in this browser.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/mp4';

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                setIsRecording(false);
                setIsPaused(false);
                clearTimer();
                releaseWakeLock();

                // Stop all tracks
                streamRef.current?.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            };

            recorder.onerror = () => {
                setError('Recording error occurred.');
                setIsRecording(false);
                setIsPaused(false);
                clearTimer();
                releaseWakeLock();
            };

            recorder.start(1000); // collect data every second
            setIsRecording(true);
            setIsPaused(false);
            startTimer();
            await requestWakeLock();
        } catch (err: any) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('microphone_denied');
            } else if (err.name === 'NotFoundError') {
                setError('no_microphone');
            } else {
                setError(err.message || 'Failed to start recording.');
            }
        }
    }, [isSupported, clearTimer, startTimer, requestWakeLock, releaseWakeLock]);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            clearTimer();
        }
    }, [clearTimer]);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            startTimer();
        }
    }, [startTimer]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const resetRecording = useCallback(() => {
        stopRecording();
        setAudioBlob(null);
        setDuration(0);
        durationRef.current = 0;
        setError(null);
        chunksRef.current = [];
    }, [stopRecording]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimer();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [clearTimer]);

    return {
        isRecording,
        isPaused,
        duration,
        audioBlob,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        resetRecording,
        error,
        isSupported,
        isWakeLockSupported,
    };
}
