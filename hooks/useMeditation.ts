import { useState, useEffect, useCallback } from 'react';

export interface MeditationState {
  isActive: boolean;
  duration: number;
  remaining: number;
  introText: string;
  closingText: string;
  originalMode: 'text' | 'voice';
}

export interface UseMeditationParams {
  speak: (text: string, isMeditation?: boolean) => Promise<void>;
  setIsVoiceMode: React.Dispatch<React.SetStateAction<boolean>>;
  gongAudioRef: React.RefObject<HTMLAudioElement | null>;
  t: (key: string) => string;
}

export function parseMeditationMarkers(text: string): {
  hasMeditation: boolean;
  duration: number;
  introText: string;
  closingText: string;
  displayText: string;
} {
  const meditationRegex = /\[MEDITATION:(\d+)\]([\s\S]*?)\[MEDITATION_END\]([\s\S]*)/;
  const match = text.match(meditationRegex);

  if (match) {
    const duration = parseInt(match[1], 10);
    const intro = match[2].trim();
    const closing = match[3].trim();
    const displayText = intro + (closing ? '\n\n' + closing : '');

    return {
      hasMeditation: true,
      duration,
      introText: intro,
      closingText: closing,
      displayText
    };
  }

  return {
    hasMeditation: false,
    duration: 0,
    introText: '',
    closingText: '',
    displayText: text
  };
}

export function useMeditation({ speak, setIsVoiceMode, gongAudioRef, t }: UseMeditationParams) {
  const [meditationState, setMeditationState] = useState<MeditationState | null>(null);

  const playGongSound = useCallback(async () => {
    if (gongAudioRef.current) {
      try {
        await gongAudioRef.current.play();
        await new Promise(resolve => setTimeout(resolve, 3000));
        return;
      } catch (error) {
        // MP3 gong failed, using Web Audio API fallback
      }
    }

    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 3);

      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error('Error playing fallback gong:', error);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [gongAudioRef]);

  const handleMeditationComplete = useCallback(async () => {
    if (!meditationState) return;

    await playGongSound();

    if (meditationState.closingText) {
      speak(meditationState.closingText);
    }

    if (meditationState.originalMode === 'text') {
      setIsVoiceMode(false);
    }

    setMeditationState(null);
  }, [meditationState, playGongSound, speak, setIsVoiceMode]);

  const handleStopMeditation = useCallback(async () => {
    if (!meditationState) return;

    await playGongSound();

    if (meditationState.closingText) {
      speak(meditationState.closingText);
    }

    if (meditationState.originalMode === 'text') {
      setIsVoiceMode(false);
    }

    setMeditationState(null);
  }, [meditationState, playGongSound, speak, setIsVoiceMode]);

  useEffect(() => {
    if (!meditationState?.isActive) return;

    if (meditationState.remaining <= 0) {
      handleMeditationComplete();
      return;
    }

    const timer = setInterval(() => {
      setMeditationState(prev => prev ? {
        ...prev,
        remaining: prev.remaining - 1
      } : null);
    }, 1000);

    return () => clearInterval(timer);
  }, [meditationState?.remaining, meditationState?.isActive, handleMeditationComplete]);

  return {
    meditationState,
    setMeditationState,
    parseMeditationMarkers,
    playGongSound,
    handleMeditationComplete,
    handleStopMeditation,
  };
}
