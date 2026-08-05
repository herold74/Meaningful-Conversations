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
  isIOS: boolean;
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
  isIOS,
  stopTts,
  t,
}: UseSpeechRecognitionParams) {
  const [isListening, setIsListening] = useState(false);
  /** True when the last STT chunk was final (text no longer jumping) or recording ended with text. */
  const [hasStableTranscript, setHasStableTranscript] = useState(false);
  const baseTranscriptRef = useRef<string>('');
  /** Latest combined transcript from onResult — avoids stale React input on stop-and-send. */
  const latestTranscriptRef = useRef<string>('');
  /** Committed transcript at last isFinal — used for send so interim suffix is never sent. */
  const stableTranscriptRef = useRef<string>('');
  const usingNativeSpeech = isNativeApp;

  const canSendVoiceTranscript =
    Boolean(input.trim()) && (!isListening || hasStableTranscript);

  const handleVoiceInteraction = useCallback(async () => {
    if (isLoading) return;

    const sendTranscript = async () => {
      const textToSend = (
        latestTranscriptRef.current ||
        input ||
        stableTranscriptRef.current
      ).trim();
      if (!textToSend) return;
      baseTranscriptRef.current = '';
      latestTranscriptRef.current = '';
      stableTranscriptRef.current = '';
      setHasStableTranscript(false);
      setIsLoading(true);
      await sendMessage(textToSend);
      setInput('');
    };

    if (isListening) {
      if (!hasStableTranscript) return;
      console.log('[Speech] Stopping speech recognition');

      try {
        await speechService.stop();
        setIsListening(false);
      } catch (e) {
        console.error('[Speech] Error stopping recognition:', e);
      }

      if (isIOS && !usingNativeSpeech) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await sendTranscript();
      return;
    }

    if (input.trim()) {
      await sendTranscript();
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
  }, [isLoading, isListening, hasStableTranscript, input, language, sendMessage, setInput, setIsLoading, isIOS, usingNativeSpeech, t, stopTts]);

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
    hasStableTranscript,
    canSendVoiceTranscript,
    usingNativeSpeech,
    handleVoiceInteraction,
    stopSpeech,
  };
}
