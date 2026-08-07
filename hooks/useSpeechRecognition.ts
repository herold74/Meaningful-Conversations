import { useState, useRef, useCallback } from 'react';
import { Language } from '../types';
import { speechService, isNativeApp } from '../services/capacitorSpeechService';
import { getApiBaseUrl } from '../services/api';

export interface UseSpeechRecognitionParams {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  language: Language;
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  stopTts: () => void;
  t: (key: string) => string;
}

export function useSpeechRecognition({
  input,
  setInput,
  language,
  sendMessage,
  isLoading,
  setIsLoading,
  stopTts,
  t,
}: UseSpeechRecognitionParams) {
  const [isListening, setIsListening] = useState(false);
  /** True while waiting for committed STT after user taps stop-and-send. */
  const [isFinalizingTranscript, setIsFinalizingTranscript] = useState(false);
  /** True when the last STT chunk was final (text no longer jumping) or recording ended with text. */
  const [hasStableTranscript, setHasStableTranscript] = useState(false);
  const baseTranscriptRef = useRef<string>('');
  /** Latest combined transcript from onResult — UI display only during recording. */
  const latestTranscriptRef = useRef<string>('');
  /** Committed transcript at last isFinal — used for send when not calling stopAndFinalize. */
  const stableTranscriptRef = useRef<string>('');
  const usingNativeSpeech = isNativeApp;

  const canSendVoiceTranscript =
    Boolean(input.trim()) && (!isListening || hasStableTranscript);

  const sendTranscript = useCallback(async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;
    baseTranscriptRef.current = '';
    latestTranscriptRef.current = '';
    stableTranscriptRef.current = '';
    setHasStableTranscript(false);
    setIsLoading(true);
    await sendMessage(trimmed);
    setInput('');
  }, [sendMessage, setInput, setIsLoading]);

  const handleVoiceInteraction = useCallback(async () => {
    if (isLoading || isFinalizingTranscript) return;

    if (isListening) {
      setIsFinalizingTranscript(true);
      try {
        const { transcript } = await speechService.stopAndFinalize();
        setIsListening(false);
        const textToSend = transcript.trim() || latestTranscriptRef.current.trim();
        if (!textToSend) {
          alert(t('chat_voice_finalize_empty'));
          return;
        }
        setInput(textToSend);
        await sendTranscript(textToSend);
      } catch (e) {
        console.error('[Speech] Error finalizing recognition:', e);
        setIsListening(false);
      } finally {
        setIsFinalizingTranscript(false);
      }
      return;
    }

    if (input.trim()) {
      const textToSend = (stableTranscriptRef.current || input).trim();
      if (!textToSend) {
        alert(t('chat_voice_finalize_empty'));
        return;
      }
      await sendTranscript(textToSend);
      return;
    }

    stopTts();
    baseTranscriptRef.current = input.trim() ? input.trim() + ' ' : '';
    latestTranscriptRef.current = baseTranscriptRef.current;
    stableTranscriptRef.current = '';
    setHasStableTranscript(false);

    try {
      console.log('[Speech] Starting speech recognition');
      await speechService.start(
        {
          language: language === 'de' ? 'de-DE' : 'en-US',
          interimResults: true,
          debugLogBaseUrl: getApiBaseUrl()
        },
        (result) => {
          const combined = baseTranscriptRef.current + result.transcript;
          const capped = combined.length <= 5000 ? combined : combined.slice(0, 5000);
          latestTranscriptRef.current = capped;
          setInput(capped);
          if (result.isFinal) {
            stableTranscriptRef.current = capped;
            setHasStableTranscript(capped.trim().length > 0);
          } else {
            setHasStableTranscript(false);
          }
        },
        (error) => {
          setIsListening(false);
          if (error.message === 'microphone_permission_denied') {
            alert(t('microphone_permission_denied') || 'Microphone access denied. Please grant permissions in your browser settings.');
          } else if (error.message === 'microphone_error') {
            alert(t('microphone_error') || 'Microphone error. Please check if your microphone is available.');
          }
        },
        () => {
          console.log('[Speech] 🎙️ Recognition started');
          setIsListening(true);
          setHasStableTranscript(false);
        },
        () => {
          console.log('[Speech] 🎙️ Recognition ended');
          setIsListening(false);
          const endedText = latestTranscriptRef.current.trim();
          if (endedText) {
            stableTranscriptRef.current = latestTranscriptRef.current;
            setHasStableTranscript(true);
          }
        }
      );
    } catch (error) {
      console.error('[Speech] Failed to start recognition:', error);
      alert(t('microphone_start_error') || 'Failed to start microphone. Please try again.');
    }
  }, [isLoading, isFinalizingTranscript, isListening, input, language, sendTranscript, setInput, t, stopTts]);

  const stopSpeech = useCallback(async () => {
    try {
      await speechService.stop();
      setIsListening(false);
    } catch {
      // Ignore
    }
  }, []);

  return {
    isListening,
    isFinalizingTranscript,
    hasStableTranscript,
    canSendVoiceTranscript,
    usingNativeSpeech,
    handleVoiceInteraction,
    stopSpeech,
  };
};
