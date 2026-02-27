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
  const baseTranscriptRef = useRef<string>('');
  const usingNativeSpeech = isNativeApp;

  const handleVoiceInteraction = useCallback(async () => {
    if (isLoading) return;

    if (isListening) {
      console.log('[Speech] Stopping speech recognition');

      try {
        await speechService.stop();
        setIsListening(false);
      } catch (e) {
        console.error('[Speech] Error stopping recognition:', e);
      }

      const currentInput = input;

      if (isIOS && !usingNativeSpeech) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (currentInput.trim()) {
        baseTranscriptRef.current = '';
        setIsLoading(true);
        await sendMessage(currentInput);
        setInput('');
      }
    } else {
      stopTts();
      baseTranscriptRef.current = input.trim() ? input.trim() + ' ' : '';

      try {
        console.log('[Speech] Starting speech recognition');
        await speechService.start(
          {
            language: language === 'de' ? 'de-DE' : 'en-US',
            interimResults: true,
            debugLogBaseUrl: getApiBaseUrl()
          },
          (result) => {
            setInput(baseTranscriptRef.current + result.transcript);
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
          },
          () => {
            console.log('[Speech] 🎙️ Recognition ended');
            setIsListening(false);
          }
        );
      } catch (error) {
        console.error('[Speech] Failed to start recognition:', error);
        alert(t('microphone_start_error') || 'Failed to start microphone. Please try again.');
      }
    }
  }, [isLoading, isListening, input, language, sendMessage, setInput, setIsLoading, isIOS, usingNativeSpeech, t, stopTts]);

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
    usingNativeSpeech,
    handleVoiceInteraction,
    stopSpeech,
  };
}
