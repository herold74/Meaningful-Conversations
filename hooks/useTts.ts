import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { Bot, Message, Language, User } from '../types';
import { synthesizeSpeech, splitIntoSentences, getBotVoiceSettings, saveBotVoiceSettings, warmupServerVoice, type TtsMode } from '../services/ttsService';
import { getApiBaseUrl } from '../services/api';
import { selectVoice } from '../utils/voiceUtils';
import { isNativeiOS, nativeTtsService } from '../services/nativeTtsService';
import { brand } from '../config/brand';

// Extend Window for AudioContext vendor prefix
interface CustomWindow extends Window {
  AudioContext: typeof AudioContext;
  webkitAudioContext: typeof AudioContext;
}
declare let window: CustomWindow;

export interface UseTtsParams {
  bot: Bot;
  language: Language;
  currentUser: User | null;
  chatHistory: Message[];
  isVoiceMode: boolean;
  isNewSession: boolean;
  t: (key: string) => string;
}

export type TtsStatus = 'idle' | 'speaking' | 'paused';

export function useTts({ bot, language, currentUser, chatHistory, isVoiceMode, isNewSession, t }: UseTtsParams) {
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [ttsStatus, setTtsStatus] = useState<TtsStatus>('idle');
  const [ttsMode, setTtsMode] = useState<TtsMode>(() => {
    if (!currentUser) return 'local';
    const settings = getBotVoiceSettings(bot.id);
    return settings[language].mode;
  });
  const [isAutoMode, setIsAutoMode] = useState<boolean>(() => {
    const settings = getBotVoiceSettings(bot.id);
    return settings[language].isAuto;
  });
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(() => {
    const settings = getBotVoiceSettings(bot.id);
    return settings[language].voiceId;
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechPollingRef = useRef<number | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const isStoppingAudioRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gongAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const cachedAudioRef = useRef<{ text: string; url: string; blob: Blob; sentenceBlobs?: Blob[] } | null>(null);
  const lastSpokenTextRef = useRef<string>('');
  const sentenceQueueRef = useRef<{
    blobs: (Blob | null)[];
    urls: string[];
    currentIndex: number;
    active: boolean;
  } | null>(null);
  const streamingTtsRef = useRef<{
    active: boolean;
    sentenceCount: number;
    resolvedBlobs: (Blob | null)[];
    resolvedUrls: string[];
    synthQueue: string[];
    synthInProgress: boolean;
    audio: HTMLAudioElement | null;
    hasStartedPlaying: boolean;
    voiceId: string | null;
  } | null>(null);
  const hasSpokenFirstMessageRef = useRef(false);
  const warmupPromiseRef = useRef<Promise<void> | null>(null);

  const isIOS = useMemo(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  const botGender = useMemo((): 'male' | 'female' => {
    switch (bot.id) {
      case 'gloria-life-context':
      case 'gloria-interview':
      case 'ava-strategic':
      case 'chloe-cbt':
        return 'female';
      case 'max-ambitious':
      case 'rob':
      case 'kenji-stoic':
      case 'nexus-gps':
      default:
        return 'male';
    }
  }, [bot.id]);

  const saveLanguageVoiceSettings = useCallback((mode: TtsMode, voiceId: string | null, isAuto: boolean) => {
    console.log('[TTS Save] Saving voice settings:', { bot: bot.id, language, mode, voiceId, isAuto });
    const allSettings = getBotVoiceSettings(bot.id);
    allSettings[language] = { mode, voiceId, isAuto };
    saveBotVoiceSettings(bot.id, allSettings);
    console.log('[TTS Save] Settings after save:', allSettings);
  }, [bot.id, language]);

  useEffect(() => {
    const settings = getBotVoiceSettings(bot.id);
    const langSettings = settings[language];
    setSelectedVoiceURI(langSettings.voiceId);
    setTtsMode(langSettings.mode);
    setIsAutoMode(langSettings.isAuto);
  }, [language, bot.id]);

  useEffect(() => {
    const audio = new Audio('/sounds/meditation-gong.ogg');
    audio.addEventListener('error', () => {});
    gongAudioRef.current = audio;
  }, []);

  useEffect(() => {
    const checkVoiceAvailability = async () => {
      if (!currentUser) {
        console.log('[TTS Init] Guest user - forcing local TTS only');
        setTtsMode('local');
        return;
      }

      const settings = getBotVoiceSettings(bot.id);
      const langSettings = settings[language];
      const savedMode = langSettings.mode;
      const savedVoiceId = langSettings.voiceId;
      const savedIsAuto = langSettings.isAuto;

      console.log('[TTS Init] Checking voice availability:', { savedMode, savedVoiceId, savedIsAuto, isNativeiOS });

      const getBestServerVoice = (botId: string, lang: string): string | null => {
        let gender: 'male' | 'female' = 'female';
        if (lang === 'en') {
          const maleBotsEN = ['max-ambitious', 'rob', 'kenji-stoic', 'nexus-gps'];
          gender = maleBotsEN.includes(botId) ? 'male' : 'female';
        } else if (lang === 'de') {
          const femaleBotsDE = ['gloria-life-context', 'gloria-interview', 'ava-strategic', 'chloe-cbt'];
          gender = femaleBotsDE.includes(botId) ? 'female' : 'male';
        }
        if (lang === 'de') {
          return gender === 'female' ? null : 'de-thorsten';
        } else {
          return gender === 'female' ? 'en-amy' : 'en-ryan';
        }
      };

      try {
        const apiBaseUrl = getApiBaseUrl();
        const healthResponse = await fetch(`${apiBaseUrl}/api/tts/health`, {
          signal: AbortSignal.timeout(3000)
        });
        const healthData = await healthResponse.json();
        const serverAvailable = healthData.status === 'ok' && healthData.piperAvailable;

        if (savedMode === 'server' && savedVoiceId) {
          if (!serverAvailable) {
            console.warn('[TTS Init] Server unavailable, temporarily using local (keeping saved preference)');
            setTtsMode('local');
          } else {
            console.log('[TTS Init] Server voice available, keeping:', savedVoiceId);
            warmupPromiseRef.current = warmupServerVoice(bot.id, language as 'de' | 'en');
          }
        } else if (savedMode === 'local' && savedVoiceId) {
          const isNativeVoiceId = savedVoiceId.startsWith('com.apple.voice');

          if (isNativeVoiceId && isNativeiOS) {
            console.log('[TTS Init] Native iOS voice valid, keeping:', savedVoiceId);
          } else if (isNativeVoiceId && !isNativeiOS) {
            console.warn('[TTS Init] Native voice saved but not on native iOS, resetting to auto mode');
            setIsAutoMode(true);
            setSelectedVoiceURI(null);
            saveLanguageVoiceSettings('local', null, true);
          } else {
            const voiceExists = window.speechSynthesis.getVoices().some(v => v.voiceURI === savedVoiceId);
            if (!voiceExists) {
              console.warn('[TTS Init] Saved local voice no longer exists, resetting to auto mode');
              setIsAutoMode(true);
              setSelectedVoiceURI(null);
              saveLanguageVoiceSettings('local', null, true);
            } else {
              console.log('[TTS Init] Local voice valid, keeping:', savedVoiceId);
            }
          }
        } else if (savedIsAuto || (!savedVoiceId && savedMode === 'local')) {
          console.log('[TTS Init] Auto mode - selecting best voice for bot gender:', botGender);

          if (isNativeiOS) {
            try {
              const nativeVoices = await nativeTtsService.getVoicesForLanguage(language);
              if (nativeVoices.length > 0) {
                const qualityVoices = nativeVoices.filter(v => v.quality === 'premium' || v.quality === 'enhanced');
                const pool = qualityVoices.length > 0 ? qualityVoices : nativeVoices;

                const femaleNames = ['anna', 'helena', 'petra', 'katja', 'marlene', 'vicki', 'marie',
                  'samantha', 'karen', 'moira', 'tessa', 'siri', 'allison', 'ava', 'susan', 'serena', 'nicky'];
                const maleNames = ['markus', 'viktor', 'yannick', 'martin', 'hans', 'daniel', 'tom', 'alex', 'aaron', 'fred'];
                const targetNames = botGender === 'female' ? femaleNames : maleNames;
                const oppositeNames = botGender === 'female' ? maleNames : femaleNames;

                const genderMatched = pool.filter(v => targetNames.some(n => v.name.toLowerCase().includes(n)));
                const notOpposite = genderMatched.length > 0 ? genderMatched
                  : pool.filter(v => !oppositeNames.some(n => v.name.toLowerCase().includes(n)));
                const candidateVoices = notOpposite.length > 0 ? notOpposite : pool;

                const bestVoice = candidateVoices.find(v => v.quality === 'premium')
                  || candidateVoices.find(v => v.quality === 'enhanced')
                  || candidateVoices[0];
                console.log('[TTS Init] Auto mode on native iOS - selected:', bestVoice.name, bestVoice.quality);
                setSelectedVoiceURI(bestVoice.identifier);
                setTtsMode('local');
                saveLanguageVoiceSettings('local', bestVoice.identifier, true);
                return;
              }
            } catch (error) {
              console.warn('[TTS Init] Could not get native voices:', error);
            }
          }

          if (serverAvailable) {
            const bestVoice = getBestServerVoice(bot.id, language);
            if (bestVoice) {
              console.log('[TTS Init] Auto mode - selected server voice:', bestVoice);
              setSelectedVoiceURI(bestVoice);
              setTtsMode('server');
              saveLanguageVoiceSettings('server', bestVoice, true);
              warmupPromiseRef.current = warmupServerVoice(bot.id, language as 'de' | 'en');
            } else {
              setSelectedVoiceURI(null);
              setTtsMode('local');
              saveLanguageVoiceSettings('local', null, true);
            }
          } else {
            setSelectedVoiceURI(null);
            setTtsMode('local');
            saveLanguageVoiceSettings('local', null, true);
          }
        }
      } catch (error) {
        console.warn('[TTS Init] Could not check voice availability:', error);
        if (savedMode === 'server') {
          console.warn('[TTS Init] Temporarily switching to local mode (keeping saved preference)');
          setTtsMode('local');
        }
      }
    };

    checkVoiceAvailability();
  }, [bot.id, language, currentUser, botGender, saveLanguageVoiceSettings]);

  useEffect(() => {
    if (!window.speechSynthesis) {
      console.log('[Voices] speechSynthesis API not available');
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      console.log('[Voices] getVoices() returned', availableVoices.length, 'voices');
      if (availableVoices.length > 0) {
        const germanVoices = availableVoices.filter(v => v.lang.toLowerCase().startsWith('de'));
        console.log('[Voices] German voices:', germanVoices.map(v => ({
          name: v.name,
          lang: v.lang,
          localService: v.localService,
          voiceURI: v.voiceURI
        })));
        setVoices(availableVoices);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices();

    const iosRetry = setTimeout(() => {
      loadVoices();
    }, 1000);

    return () => {
      clearTimeout(iosRetry);
      if (window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVoiceMode || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;

    console.log('[iOS Audio Fix] Activating MediaSession to signal audio app');
    navigator.mediaSession.metadata = new MediaMetadata({
      title: brand.appName,
      artist: bot.name || 'Coach',
      album: 'Voice Chat'
    });
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);

    return () => {
      console.log('[iOS Audio Fix] Deactivating MediaSession');
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
      }
    };
  }, [isVoiceMode, bot.name]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    hasSpokenFirstMessageRef.current = false;
  }, [bot.id, isNewSession]);

  const unlockAudioSession = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    silentAudio.volume = 0.01;
    silentAudio.play().then(() => {
      silentAudio.pause();
    }).catch(() => {});
  }, []);

  const resetAudioSessionAfterRecording = useCallback(async () => {
    if (!isIOS) return;

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch (e) {
        // Ignore close errors
      }
      audioContextRef.current = null;
    }

    try {
      const freshCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = freshCtx;

      const oscillator = freshCtx.createOscillator();
      const gainNode = freshCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(freshCtx.destination);

      gainNode.gain.setValueAtTime(0.01, freshCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, freshCtx.currentTime + 0.1);

      oscillator.frequency.setValueAtTime(440, freshCtx.currentTime);
      oscillator.start(freshCtx.currentTime);
      oscillator.stop(freshCtx.currentTime + 0.1);
    } catch (e) {
      // Ignore errors
    }
  }, [isIOS]);

  const stopTts = useCallback(() => {
    if (sentenceQueueRef.current) {
      sentenceQueueRef.current.active = false;
      sentenceQueueRef.current.urls.forEach(u => u && URL.revokeObjectURL(u));
      sentenceQueueRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (gongAudioRef.current) {
      gongAudioRef.current.pause();
      gongAudioRef.current.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (speechPollingRef.current) {
      clearInterval(speechPollingRef.current);
      speechPollingRef.current = null;
    }
    setTtsStatus('idle');
  }, []);

  const processStreamingSynthQueue = useCallback(async () => {
    const s = streamingTtsRef.current;
    if (!s || s.synthInProgress) return;

    const nextIdx = s.resolvedBlobs.length;
    if (nextIdx >= s.synthQueue.length) return;

    // #region agent log
    console.log('[TTS-DBG] synth-start', {nextIdx, queueLen:s.synthQueue.length, active:s.active, hasStartedPlaying:s.hasStartedPlaying});
    // #endregion

    s.synthInProgress = true;
    try {
      if (warmupPromiseRef.current) {
        await warmupPromiseRef.current;
        warmupPromiseRef.current = null;
      }

      const blob = await synthesizeSpeech(s.synthQueue[nextIdx], bot.id, language, false, s.voiceId);
      if (!streamingTtsRef.current) return;

      s.resolvedBlobs.push(blob);
      const url = URL.createObjectURL(blob);
      s.resolvedUrls.push(url);

      // #region agent log
      console.log('[TTS-DBG] sentence-ready', {idx:nextIdx, active:s.active, resolvedCount:s.resolvedBlobs.length, queueLen:s.synthQueue.length});
      // #endregion

      if (nextIdx === 0 && !s.hasStartedPlaying) {
        s.hasStartedPlaying = true;

        sentenceQueueRef.current = {
          blobs: s.resolvedBlobs,
          urls: s.resolvedUrls,
          currentIndex: 0,
          active: true,
        };

        const audio = new Audio();
        s.audio = audio;
        audioRef.current = audio;

        audio.addEventListener('play', () => {
          setTtsStatus('speaking');
          setIsLoadingAudio(false);
        });
        audio.addEventListener('pause', () => {
          if (!audio.ended) setTtsStatus('paused');
        });
        audio.addEventListener('ended', () => {
          const streaming = streamingTtsRef.current;
          const queue = sentenceQueueRef.current;
          if (!queue || !queue.active) return;
          queue.currentIndex++;

          const totalSentences = streaming ? streaming.synthQueue.length : queue.urls.length;

          // #region agent log
          console.log('[TTS-DBG] sentence-ended', {currentIdx:queue.currentIndex, totalSentences, streamActive:streaming?.active, urlReady:!!queue.urls[queue.currentIndex]});
          // #endregion

          if (queue.currentIndex >= totalSentences) {
            if (!streaming || !streaming.active) {
              setTtsStatus('idle');
              isSpeakingRef.current = false;
              sentenceQueueRef.current = null;
            }
            return;
          }

          const nextUrl = queue.urls[queue.currentIndex];
          if (nextUrl) {
            audio.src = nextUrl;
            audio.play().catch(() => {
              setTtsStatus('idle');
              isSpeakingRef.current = false;
            });
          } else {
            const waitIdx = queue.currentIndex;
            // #region agent log
            console.log('[TTS-DBG] waiting-for-url', {waitIdx, resolvedCount:streaming?.resolvedBlobs.length, queueLen:streaming?.synthQueue.length, synthInProgress:streaming?.synthInProgress, active:streaming?.active});
            // #endregion
            const poll = setInterval(() => {
              if (!queue.active) { clearInterval(poll); return; }
              if (queue.urls[waitIdx]) {
                clearInterval(poll);
                audio.src = queue.urls[waitIdx];
                audio.play().catch(() => {
                  setTtsStatus('idle');
                  isSpeakingRef.current = false;
                });
              }
            }, 100);
          }
        });

        audio.src = url;
        await audio.play();
      }
    } catch (err) {
      console.warn(`[TTS Stream] Sentence ${nextIdx + 1} synthesis failed:`, err);
      s.resolvedBlobs.push(null);
      s.resolvedUrls.push('');
    } finally {
      s.synthInProgress = false;
    }

    if (s.synthQueue.length > s.resolvedBlobs.length) processStreamingSynthQueue();
  }, [bot.id, language]);

  /**
   * Initialize streaming TTS. Returns true if sentence-level streaming
   * is supported (server TTS). Returns false if the caller should fall
   * back to calling speak() with the full text after stream completes.
   */
  const initStreamingTts = useCallback((): boolean => {
    if (!isTtsEnabled) return false;

    const isValidServerVoice = selectedVoiceURI && ['de-thorsten', 'de-eva', 'en-amy', 'en-ryan'].includes(selectedVoiceURI);
    const iosSafariForcesLocal = isIOS && !isNativeiOS;
    const nativeForcesLocal = isNativeiOS && ttsMode === 'server';
    const guestForcesLocal = !currentUser;
    const effectiveMode = guestForcesLocal ? 'local'
      : iosSafariForcesLocal ? 'local'
      : nativeForcesLocal ? 'local'
      : (ttsMode === 'server' && !isValidServerVoice && selectedVoiceURI) ? 'local'
      : ttsMode;

    // #region agent log
    console.log('[TTS-DBG] initStreaming', {isTtsEnabled, ttsMode, effectiveMode, selectedVoiceURI, isValidServerVoice, willStream:effectiveMode==='server'});
    // #endregion

    if (effectiveMode !== 'server') return false;

    stopTts();

    isSpeakingRef.current = true;
    flushSync(() => setIsLoadingAudio(true));

    streamingTtsRef.current = {
      active: true,
      sentenceCount: 0,
      resolvedBlobs: [],
      resolvedUrls: [],
      synthQueue: [],
      synthInProgress: false,
      audio: null,
      hasStartedPlaying: false,
      voiceId: (ttsMode === 'server' && selectedVoiceURI) ? selectedVoiceURI : null,
    };

    return true;
  }, [isTtsEnabled, selectedVoiceURI, ttsMode, isIOS, currentUser, stopTts]);

  /**
   * Enqueue a single sentence for streaming TTS synthesis and playback.
   * Call initStreamingTts() first. Sentences are synthesized sequentially
   * and played as soon as ready.
   */
  const enqueueSentence = useCallback((sentence: string) => {
    const s = streamingTtsRef.current;
    if (!s || !s.active) return;

    const cleanSentence = sentence
      .replace(/#{1,6}\s/g, '')
      .replace(/(\*\*|__|\*|_|~~|`|```)/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/!\[[^\]]*\]\([^\)]*\)/g, '')
      .replace(/^-{3,}|^\*{3,}|^_{3,}/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .trim();

    if (!cleanSentence) return;

    s.synthQueue.push(cleanSentence);
    s.sentenceCount++;
    processStreamingSynthQueue();
  }, [processStreamingSynthQueue]);

  /**
   * Finish streaming TTS. Stores the final text for repeat.
   * If meta-commentary was stripped (finalText shorter than streamed),
   * cancels any pending sentences that were part of stripped content.
   */
  const finishStreamingTts = useCallback((finalText: string) => {
    const s = streamingTtsRef.current;
    if (!s) return;
    // #region agent log
    console.log('[TTS-DBG] finishStreaming', {sentenceCount:s.sentenceCount, resolvedCount:s.resolvedBlobs.length, synthInProgress:s.synthInProgress, hasStartedPlaying:s.hasStartedPlaying, queueCurrentIdx:sentenceQueueRef.current?.currentIndex});
    // #endregion
    s.active = false;
    lastSpokenTextRef.current = finalText
      .replace(/#{1,6}\s/g, '')
      .replace(/(\*\*|__|\*|_|~~|`|```)/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/!\[[^\]]*\]\([^\)]*\)/g, '')
      .replace(/^-{3,}|^\*{3,}|^_{3,}/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .trim();

    const queue = sentenceQueueRef.current;
    if (queue && queue.currentIndex >= s.sentenceCount) {
      setTtsStatus('idle');
      isSpeakingRef.current = false;
      sentenceQueueRef.current = null;
    }
  }, []);

  /** Cancel pending (not yet played) streaming sentences. */
  const cancelPendingSentences = useCallback(() => {
    const s = streamingTtsRef.current;
    if (s) {
      s.active = false;
      s.resolvedUrls.forEach(u => u && URL.revokeObjectURL(u));
    }
    streamingTtsRef.current = null;
    if (sentenceQueueRef.current) {
      sentenceQueueRef.current.active = false;
      sentenceQueueRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setTtsStatus('idle');
    setIsLoadingAudio(false);
    isSpeakingRef.current = false;
  }, []);

  const speak = useCallback(async (text: string, isMeditation: boolean = false, isRetry: boolean = false, forceLocalTts: boolean = false) => {
    if (!isTtsEnabled || !text.trim()) {
      return;
    }

    if (isSpeakingRef.current && !isRetry) {
      console.log('[TTS] Skipping speak() - already speaking');
      window.speechSynthesis?.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }
    isSpeakingRef.current = true;

    flushSync(() => {
      setIsLoadingAudio(true);
    });

    const cleanText = text
      .replace(/#{1,6}\s/g, '')
      .replace(/(\*\*|__|\*|_|~~|`|```)/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/!\[[^\]]*\]\([^\)]*\)/g, '')
      .replace(/^-{3,}|^\*{3,}|^_{3,}/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '');

    lastSpokenTextRef.current = cleanText;

    const isValidServerVoice = selectedVoiceURI && ['de-thorsten', 'de-eva', 'en-amy', 'en-ryan'].includes(selectedVoiceURI);
    const isNativeVoice = selectedVoiceURI?.startsWith('com.apple.voice');

    const iosSafariForcesLocal = isIOS && !isNativeiOS;
    const nativeiOSForcesLocal = isNativeiOS && ttsMode === 'server';
    const guestForcesLocal = !currentUser;
    const effectiveTtsMode = forceLocalTts ? 'local' : (guestForcesLocal ? 'local' : (iosSafariForcesLocal ? 'local' : (nativeiOSForcesLocal ? 'local' : (ttsMode === 'server' && !isValidServerVoice && selectedVoiceURI ? 'local' : ttsMode))));

    if (ttsMode === 'server' && selectedVoiceURI && !isValidServerVoice) {
      console.warn('[TTS] Corrupted settings detected: ttsMode=server but selectedVoiceURI is not a valid server voice:', selectedVoiceURI, '- using local TTS');
    }

    if (isNativeiOS && isNativeVoice) {
      console.log('[TTS] Using native iOS TTS with voice:', selectedVoiceURI);
      const loadingStartTime = Date.now();

      try {
        await nativeTtsService.stop();

        await nativeTtsService.addListener('speechEnd', () => {
          setTtsStatus('idle');
          setIsLoadingAudio(false);
          isSpeakingRef.current = false;
        });

        await nativeTtsService.addListener('speechStart', () => {
          const elapsed = Date.now() - loadingStartTime;
          const remainingTime = Math.max(0, 300 - elapsed);
          setTimeout(() => {
            setTtsStatus('speaking');
            setIsLoadingAudio(false);
          }, remainingTime);
        });

        const result = await nativeTtsService.speak({
          text: cleanText,
          voiceIdentifier: selectedVoiceURI || undefined,
          rate: 0.5,
          pitch: 1.0,
          volume: 1.0
        });

        if (!result.completed && !result.cancelled) {
          console.warn('[TTS] Native TTS did not complete successfully');
        }
      } catch (error) {
        console.error('[TTS] Native iOS TTS error:', error);
        setTtsStatus('idle');
        setIsLoadingAudio(false);
        isSpeakingRef.current = false;
      }
      return;
    }

    if (effectiveTtsMode === 'server') {
      console.log(`[TTS] Server mode speak(), text length: ${cleanText.length}, ttsMode: ${ttsMode}, effective: ${effectiveTtsMode}`);
      try {
        const loadingStartTime = Date.now();

        // Abort any active sentence queue
        if (sentenceQueueRef.current) {
          sentenceQueueRef.current.active = false;
          sentenceQueueRef.current.urls.forEach(u => u && URL.revokeObjectURL(u));
          sentenceQueueRef.current = null;
        }

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current = null;
        }

        const voiceIdToUse = (ttsMode === 'server' && selectedVoiceURI) ? selectedVoiceURI : null;

        // --- Shared error handler for the Audio element ---
        const attachErrorHandler = (audio: HTMLAudioElement) => {
          audio.addEventListener('error', (e) => {
            const audioError = audio.error;
            const errorCode = audioError?.code;
            const errorMessage = audioError?.message || 'Unknown error';
            if (isStoppingAudioRef.current) return;
            if (audioRef.current !== audio) return;
            if (errorCode === 4 && errorMessage.includes('Empty src')) return;

            const errorCodes: Record<number, string> = { 1: 'MEDIA_ERR_ABORTED', 2: 'MEDIA_ERR_NETWORK', 3: 'MEDIA_ERR_DECODE', 4: 'MEDIA_ERR_SRC_NOT_SUPPORTED' };
            console.error('[TTS] Audio playback error:', {
              code: errorCode,
              codeName: errorCode ? errorCodes[errorCode] : 'NO_CODE',
              message: errorMessage,
              src: audio.src ? 'blob URL present' : 'no src',
              readyState: audio.readyState,
              networkState: audio.networkState,
              event: e
            });
            setTtsStatus('idle');
            setIsLoadingAudio(false);
            isSpeakingRef.current = false;
          });
        };

        // --- Check cache (supports both single-blob and sentence-blobs) ---
        if (cachedAudioRef.current && cachedAudioRef.current.text === cleanText) {
          console.log('[TTS] Using cached audio for instant replay');

          const cached = cachedAudioRef.current;

          if (cached.sentenceBlobs && cached.sentenceBlobs.length > 1) {
            // Replay cached sentences sequentially
            const urls = cached.sentenceBlobs.map(b => URL.createObjectURL(b));
            const queue = { blobs: cached.sentenceBlobs as (Blob | null)[], urls, currentIndex: 0, active: true };
            sentenceQueueRef.current = queue;

            const audio = new Audio();
            audioRef.current = audio;
            attachErrorHandler(audio);

            audio.addEventListener('play', () => {
              setTtsStatus('speaking');
              setIsLoadingAudio(false);
            });
            audio.addEventListener('pause', () => {
              if (!audio.ended) setTtsStatus('paused');
            });
            audio.addEventListener('ended', () => {
              if (!queue.active) return;
              queue.currentIndex++;
              if (queue.currentIndex >= urls.length) {
                setTtsStatus('idle');
                isSpeakingRef.current = false;
                sentenceQueueRef.current = null;
                return;
              }
              audio.src = urls[queue.currentIndex];
              audio.play().catch(() => {
                setTtsStatus('idle');
                isSpeakingRef.current = false;
              });
            });

            const elapsed = Date.now() - loadingStartTime;
            if (elapsed < 300) await new Promise(r => setTimeout(r, 300 - elapsed));

            audio.src = urls[0];
            await audio.play();
          } else {
            // Single-blob cache replay (original path)
            const audio = new Audio();
            audioRef.current = audio;
            attachErrorHandler(audio);
            audio.addEventListener('play', () => { setTtsStatus('speaking'); setIsLoadingAudio(false); });
            audio.addEventListener('pause', () => { if (!audio.ended) setTtsStatus('paused'); });
            audio.addEventListener('ended', () => { setTtsStatus('idle'); isSpeakingRef.current = false; });

            const elapsed = Date.now() - loadingStartTime;
            if (elapsed < 300) await new Promise(r => setTimeout(r, 300 - elapsed));

            audio.src = cached.url;
            await audio.play();
          }
        } else {
          // --- Fresh synthesis ---
          // Clean up previous URLs
          if (currentAudioUrlRef.current && currentAudioUrlRef.current !== cachedAudioRef.current?.url) {
            URL.revokeObjectURL(currentAudioUrlRef.current);
            currentAudioUrlRef.current = null;
          }
          if (cachedAudioRef.current && cachedAudioRef.current.url !== currentAudioUrlRef.current) {
            URL.revokeObjectURL(cachedAudioRef.current.url);
          }

          if (warmupPromiseRef.current) {
            console.log('[TTS] Waiting for model warmup before synthesis...');
            await warmupPromiseRef.current;
            warmupPromiseRef.current = null;
          }

          const sentences = splitIntoSentences(cleanText);
          console.log(`[TTS] Text length: ${cleanText.length}, sentences: ${sentences.length}`, sentences.length <= 3 ? sentences : sentences.map(s => s.substring(0, 50) + '...'));

          if (sentences.length > 1) {
            // ====== SEQUENTIAL SENTENCE SYNTHESIS (play-while-synthesizing) ======
            // Synthesize one sentence at a time so each gets full CPU (~1.7s for 150 chars).
            // Play each sentence immediately; synthesize the next while audio plays.
            // Parallel was tested but shared vCPUs cause ~2x contention.
            console.log(`[TTS] Progressive mode: ${sentences.length} sentences, sequential play-while-synth`);

            const resolvedBlobs: (Blob | null)[] = new Array(sentences.length).fill(null);
            const resolvedUrls: string[] = new Array(sentences.length).fill('');
            const queue = { blobs: resolvedBlobs, urls: resolvedUrls, currentIndex: 0, active: true };
            sentenceQueueRef.current = queue;

            // Synthesize sentence 1 with full CPU
            const firstBlob = await synthesizeSpeech(sentences[0], bot.id, language, isMeditation, voiceIdToUse);
            if (!queue.active) return;

            resolvedBlobs[0] = firstBlob;
            resolvedUrls[0] = URL.createObjectURL(firstBlob);
            const firstUrl = resolvedUrls[0];
            console.log(`[TTS] Sentence 1/${sentences.length} ready, starting playback`);

            // Synthesize remaining sentences sequentially in background.
            // Each gets full CPU; runs while current sentence plays.
            const synthRemaining = async () => {
              for (let i = 1; i < sentences.length; i++) {
                if (!queue.active) return;
                try {
                  const blob = await synthesizeSpeech(sentences[i], bot.id, language, isMeditation, voiceIdToUse);
                  if (!queue.active) return;
                  resolvedBlobs[i] = blob;
                  resolvedUrls[i] = URL.createObjectURL(blob);
                  console.log(`[TTS] Sentence ${i + 1}/${sentences.length} ready`);
                } catch (err) {
                  console.warn(`[TTS] Sentence ${i + 1}/${sentences.length} failed:`, err);
                }
              }
              if (queue.active) {
                cachedAudioRef.current = {
                  text: cleanText,
                  url: firstUrl,
                  blob: firstBlob,
                  sentenceBlobs: resolvedBlobs.filter(Boolean) as Blob[],
                };
              }
            };
            synthRemaining();

            const audio = new Audio();
            audioRef.current = audio;
            attachErrorHandler(audio);

            let hasStartedPlaying = false;
            audio.addEventListener('play', () => {
              if (!hasStartedPlaying) {
                hasStartedPlaying = true;
                setTtsStatus('speaking');
                setIsLoadingAudio(false);
              }
            });
            audio.addEventListener('pause', () => {
              if (!audio.ended) setTtsStatus('paused');
            });

            audio.addEventListener('ended', () => {
              if (!queue.active) return;
              queue.currentIndex++;

              if (queue.currentIndex >= sentences.length) {
                setTtsStatus('idle');
                isSpeakingRef.current = false;
                sentenceQueueRef.current = null;
                return;
              }

              const nextUrl = resolvedUrls[queue.currentIndex];
              if (nextUrl) {
                audio.src = nextUrl;
                audio.play().catch(() => {
                  setTtsStatus('idle');
                  isSpeakingRef.current = false;
                });
              } else {
                const waitIdx = queue.currentIndex;
                const poll = setInterval(() => {
                  if (!queue.active) { clearInterval(poll); return; }
                  const url = resolvedUrls[waitIdx];
                  if (url) {
                    clearInterval(poll);
                    audio.src = url;
                    audio.play().catch(() => {
                      setTtsStatus('idle');
                      isSpeakingRef.current = false;
                    });
                  }
                }, 100);
              }
            });

            audio.src = firstUrl;
            currentAudioUrlRef.current = firstUrl;
            await audio.play();

          } else {
            // ====== SINGLE SENTENCE (original path) ======
            const audioBlob = await synthesizeSpeech(cleanText, bot.id, language, isMeditation, voiceIdToUse);

            const elapsed = Date.now() - loadingStartTime;
            if (elapsed < 300) {
              await new Promise(resolve => setTimeout(resolve, 300 - elapsed));
            }

            const audioUrl = URL.createObjectURL(audioBlob);
            cachedAudioRef.current = { text: cleanText, url: audioUrl, blob: audioBlob };
            currentAudioUrlRef.current = audioUrl;

            const audio = new Audio();
            audioRef.current = audio;
            attachErrorHandler(audio);
            audio.addEventListener('play', () => { setTtsStatus('speaking'); setIsLoadingAudio(false); });
            audio.addEventListener('pause', () => { if (!audio.ended) setTtsStatus('paused'); });
            audio.addEventListener('ended', () => { setTtsStatus('idle'); isSpeakingRef.current = false; });

            audio.src = audioUrl;
            await audio.play();
          }
        }
      } catch (error) {
        console.error('[TTS] Server TTS error:', error);
        setTtsStatus('idle');
        setTtsMode('local');
        setTimeout(() => speak(text, isMeditation, true, true), 100);
      }
      return;
    }

    if (!window.speechSynthesis) {
      setIsLoadingAudio(false);
      isSpeakingRef.current = false;
      return;
    }

    const loadingStartTime = Date.now();

    if (speechPollingRef.current) {
      clearInterval(speechPollingRef.current);
      speechPollingRef.current = null;
    }

    window.speechSynthesis.cancel();
    await new Promise(resolve => setTimeout(resolve, 200));

    const utterance = new SpeechSynthesisUtterance(cleanText);

    let hasStartedSpeaking = false;
    speechPollingRef.current = window.setInterval(() => {
      const synth = window.speechSynthesis;

      if (synth.speaking && !synth.paused && !hasStartedSpeaking) {
        hasStartedSpeaking = true;
        const elapsed = Date.now() - loadingStartTime;
        const remainingTime = Math.max(0, 300 - elapsed);
        setTimeout(() => {
          setTtsStatus('speaking');
          setIsLoadingAudio(false);
        }, remainingTime);
      } else if (!synth.speaking && !synth.pending && hasStartedSpeaking) {
        setTtsStatus('idle');
        isSpeakingRef.current = false;
        if (speechPollingRef.current) {
          clearInterval(speechPollingRef.current);
          speechPollingRef.current = null;
        }
      }
    }, 50);

    utterance.onstart = () => {
      if (!hasStartedSpeaking) {
        hasStartedSpeaking = true;
        const elapsed = Date.now() - loadingStartTime;
        const remainingTime = Math.max(0, 300 - elapsed);
        setTimeout(() => {
          setTtsStatus('speaking');
          setIsLoadingAudio(false);
        }, remainingTime);
      }
    };
    utterance.onend = () => {
      setTtsStatus('idle');
      isSpeakingRef.current = false;
      if (speechPollingRef.current) {
        clearInterval(speechPollingRef.current);
        speechPollingRef.current = null;
      }
    };
    utterance.onerror = () => {
      setTtsStatus('idle');
      setIsLoadingAudio(false);
      isSpeakingRef.current = false;
      if (speechPollingRef.current) {
        clearInterval(speechPollingRef.current);
        speechPollingRef.current = null;
      }
    };

    let finalVoice: SpeechSynthesisVoice | null = null;

    if (selectedVoiceURI) {
      finalVoice = voices.find(v => v.voiceURI === selectedVoiceURI) || null;
    }

    if (!finalVoice) {
      let gender: 'male' | 'female' = 'female';

      if (language === 'de') {
        gender = botGender;
      } else {
        switch (bot.id) {
          case 'gloria-life-context':
          case 'gloria-interview':
          case 'ava-strategic':
          case 'chloe-cbt':
            gender = 'female';
            break;
          case 'max-ambitious':
          case 'rob':
            gender = 'male';
            utterance.rate = 1.05;
            utterance.pitch = 1.0;
            break;
          case 'kenji-stoic':
          case 'nexus-gps':
            gender = 'male';
            break;
          default:
            gender = 'male';
            break;
        }
      }

      finalVoice = selectVoice(voices, language, gender);
    }

    if (isMeditation && (bot.id === 'rob' || bot.id === 'kenji-stoic')) {
      utterance.rate = 0.9;
    }

    if (finalVoice) {
      utterance.voice = finalVoice;
    }

    window.speechSynthesis.speak(utterance);

    if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
      window.speechSynthesis.resume();
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        await new Promise(resolve => setTimeout(resolve, 100));

        const retryUtterance = new SpeechSynthesisUtterance(cleanText);
        retryUtterance.onstart = utterance.onstart;
        retryUtterance.onend = utterance.onend;
        retryUtterance.onerror = utterance.onerror;
        if (finalVoice) retryUtterance.voice = finalVoice;

        window.speechSynthesis.speak(retryUtterance);
      }
    }

    setTimeout(() => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 10);
  }, [isTtsEnabled, voices, bot.id, selectedVoiceURI, language, botGender, ttsMode, currentUser]);

  useEffect(() => {
    const lastMessage = chatHistory[chatHistory.length - 1];
    const isInitialBotResponse =
      lastMessage?.role === 'bot' &&
      (chatHistory.length === 1 ||
        (chatHistory.length === 2 && chatHistory[0].role === 'user'));

    if (isInitialBotResponse &&
      voices.length > 0 &&
      isTtsEnabled &&
      !hasSpokenFirstMessageRef.current) {
      hasSpokenFirstMessageRef.current = true;
      speak(lastMessage.text);
    }
  }, [chatHistory, voices, isTtsEnabled, speak]);

  const handlePreviewVoice = useCallback(async (voice: SpeechSynthesisVoice) => {
    if (!voice || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    await new Promise(resolve => setTimeout(resolve, 100));

    const sampleText = t('voiceModal_preview_text');
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.voice = voice;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onerror = (e) => console.error('[TTS Preview] Error:', e);

    window.speechSynthesis.speak(utterance);
  }, [t]);

  const handlePreviewServerVoice = useCallback(async (voiceId: string) => {
    const sampleText = t('voiceModal_preview_text');
    try {
      const audioBlob = await synthesizeSpeech(sampleText, bot.id, language, false, voiceId);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Failed to preview server voice:', error);
      alert(t('tts_server_unavailable') || 'Server TTS is not available. This feature requires a running backend with Piper TTS installed. You can still use local device voices.');
    }
  }, [bot.id, language, t]);

  const handlePreviewNativeVoice = useCallback(async (voiceIdentifier: string) => {
    if (!isNativeiOS) return;

    const sampleText = t('voiceModal_preview_text');
    try {
      await nativeTtsService.stop();

      await nativeTtsService.speak({
        text: sampleText,
        voiceIdentifier: voiceIdentifier,
        rate: 0.5,
        pitch: 1.0,
        volume: 1.0
      });
    } catch (error) {
      console.error('Failed to preview native voice:', error);
    }
  }, [t]);

  const handleSelectVoice = useCallback(async (selection: import('../components/VoiceSelectionModal').VoiceSelection) => {
    console.log('[TTS Select] handleSelectVoice called with:', selection.type);

    if (selection.type === 'auto') {
      setIsAutoMode(true);

      if (isNativeiOS) {
        console.log('[TTS Select] Auto mode - fetching native voices for language:', language, 'botGender:', botGender);
        const nativeVoices = await nativeTtsService.getVoicesForLanguage(language);

        if (nativeVoices.length > 0) {
          const femaleNames = ['anna', 'helena', 'petra', 'katja', 'marlene', 'vicki', 'marie',
            'samantha', 'karen', 'moira', 'tessa', 'siri', 'allison', 'ava', 'susan', 'serena', 'nicky'];
          const maleNames = ['markus', 'viktor', 'yannick', 'martin', 'hans', 'daniel', 'tom', 'alex', 'aaron', 'fred'];

          const genderFilteredVoices = nativeVoices.filter(v => {
            const nameLower = v.name.toLowerCase();
            if (botGender === 'male') {
              return maleNames.some(n => nameLower.includes(n)) || !femaleNames.some(n => nameLower.includes(n));
            } else {
              return femaleNames.some(n => nameLower.includes(n)) || !maleNames.some(n => nameLower.includes(n));
            }
          });

          const candidateVoices = genderFilteredVoices.length > 0 ? genderFilteredVoices : nativeVoices;

          const bestVoice = candidateVoices.find(v => v.quality === 'premium')
            || candidateVoices.find(v => v.quality === 'enhanced')
            || candidateVoices[0];

          console.log('[TTS Select] Auto mode - selected:', bestVoice.name, bestVoice.quality, 'from', candidateVoices.length, 'candidates');
          setSelectedVoiceURI(bestVoice.identifier);
          setTtsMode('local');
          saveLanguageVoiceSettings('local', bestVoice.identifier, true);
          setIsVoiceModalOpen(false);
          return;
        }
        console.log('[TTS Select] Auto mode - native iOS but no native voices found, using local');
        setSelectedVoiceURI(null);
        setTtsMode('local');
        saveLanguageVoiceSettings('local', null, true);
        setIsVoiceModalOpen(false);
        return;
      }

      try {
        const apiBaseUrl = getApiBaseUrl();
        const healthResponse = await fetch(`${apiBaseUrl}/api/tts/health`, {
          signal: AbortSignal.timeout(3000)
        });
        const healthData = await healthResponse.json();

        if (healthData.status === 'ok' && healthData.piperAvailable) {
          const getBestServerVoice = (botId: string, lang: string): string | null => {
            let gender: 'male' | 'female' = 'female';

            if (lang === 'en') {
              const maleBotsEN = ['max-ambitious', 'rob', 'kenji-stoic', 'nexus-gps', 'victor-bowen'];
              gender = maleBotsEN.includes(botId) ? 'male' : 'female';
            } else if (lang === 'de') {
              const femaleBotsDE = ['gloria-life-context', 'gloria-interview', 'ava-strategic', 'chloe-cbt'];
              gender = femaleBotsDE.includes(botId) ? 'female' : 'male';
            }

            if (lang === 'de') {
              return gender === 'male' ? 'de-thorsten' : null;
            } else {
              return gender === 'female' ? 'en-amy' : 'en-ryan';
            }
          };

          const bestVoice = getBestServerVoice(bot.id, language);
          if (bestVoice) {
            setSelectedVoiceURI(bestVoice);
            setTtsMode('server');
            saveLanguageVoiceSettings('server', bestVoice, true);
          } else {
            setSelectedVoiceURI(null);
            setTtsMode('local');
            saveLanguageVoiceSettings('local', null, true);
          }
        } else {
          setSelectedVoiceURI(null);
          setTtsMode('local');
          saveLanguageVoiceSettings('local', null, true);
        }
      } catch (error) {
        console.warn('[TTS Select] Auto mode - failed to check server, using local:', error);
        setSelectedVoiceURI(null);
        setTtsMode('local');
        saveLanguageVoiceSettings('local', null, true);
      }
    } else if (selection.type === 'local') {
      setIsAutoMode(false);
      setSelectedVoiceURI(selection.voiceURI);
      setTtsMode('local');
      saveLanguageVoiceSettings('local', selection.voiceURI, false);
    } else if (selection.type === 'server') {
      setIsAutoMode(false);
      setSelectedVoiceURI(selection.voiceId);
      setTtsMode('server');
      saveLanguageVoiceSettings('server', selection.voiceId, false);
    } else if (selection.type === 'native') {
      console.log('[TTS Select] Native voice selected:', selection.voiceIdentifier);
      setIsAutoMode(false);
      setSelectedVoiceURI(selection.voiceIdentifier);
      setTtsMode('local');
      saveLanguageVoiceSettings('local', selection.voiceIdentifier, false);
    }
    setIsVoiceModalOpen(false);
  }, [bot.id, language, botGender, saveLanguageVoiceSettings]);

  const handleOpenVoiceModal = useCallback(() => {
    if (!window.speechSynthesis) return;
    console.log('[VoiceModal OPEN] State before:', { ttsMode, selectedVoiceURI, isAutoMode, isTtsEnabled, isLoadingAudio });

    isStoppingAudioRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
    setTtsStatus('idle');
    setIsLoadingAudio(false);
    setTimeout(() => {
      isStoppingAudioRef.current = false;
    }, 100);

    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
      setVoices(availableVoices);
      setIsVoiceModalOpen(true);
      return;
    }

    const primeAndOpen = () => {
      const newVoices = window.speechSynthesis.getVoices();
      setVoices(newVoices);
      setIsVoiceModalOpen(true);
      window.speechSynthesis.removeEventListener('voiceschanged', primeAndOpen);
    };

    window.speechSynthesis.addEventListener('voiceschanged', primeAndOpen);

    const primingUtterance = new SpeechSynthesisUtterance('');
    primingUtterance.volume = 0;
    window.speechSynthesis.speak(primingUtterance);
  }, [ttsMode, selectedVoiceURI, isAutoMode, isTtsEnabled, isLoadingAudio]);

  const handleToggleTts = useCallback(() => {
    if (isTtsEnabled) {
      const isNativeVoiceSelected = isNativeiOS && selectedVoiceURI?.startsWith('com.apple.voice');

      if (isNativeVoiceSelected) {
        nativeTtsService.stop();
      } else if (ttsMode === 'server' && audioRef.current) {
        audioRef.current.pause();
      } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (speechPollingRef.current) {
        clearInterval(speechPollingRef.current);
        speechPollingRef.current = null;
      }
      setTtsStatus('idle');
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const primingUtterance = new SpeechSynthesisUtterance('');
        primingUtterance.volume = 0;
        window.speechSynthesis.speak(primingUtterance);
      }
    }
    setIsTtsEnabled(p => !p);
  }, [isTtsEnabled, selectedVoiceURI, ttsMode]);

  const handlePauseTTS = useCallback(() => {
    const isNativeVoiceSelected = isNativeiOS && selectedVoiceURI?.startsWith('com.apple.voice');

    if (isNativeVoiceSelected) {
      nativeTtsService.pause();
    } else if (ttsMode === 'server' && audioRef.current) {
      audioRef.current.pause();
    } else if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
    setTtsStatus('paused');
  }, [selectedVoiceURI, ttsMode]);

  const handleResumeTTS = useCallback(() => {
    const isNativeVoiceSelected = isNativeiOS && selectedVoiceURI?.startsWith('com.apple.voice');

    if (isNativeVoiceSelected) {
      nativeTtsService.resume();
    } else if (ttsMode === 'server' && audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('Failed to resume audio:', err);
        setTtsStatus('idle');
      });
    } else if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
    setTtsStatus('speaking');
  }, [selectedVoiceURI, ttsMode]);

  const handleRepeatTTS = useCallback(() => {
    if (lastSpokenTextRef.current) {
      speak(lastSpokenTextRef.current);
    }
  }, [speak]);

  const setIsTtsEnabledFromParent = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsTtsEnabled(value);
  }, []);

  return {
    speak,
    initStreamingTts,
    enqueueSentence,
    finishStreamingTts,
    cancelPendingSentences,
    ttsStatus,
    isTtsEnabled,
    setIsTtsEnabled: setIsTtsEnabledFromParent,
    isLoadingAudio,
    isAutoMode,
    ttsMode,
    selectedVoiceURI,
    voices,
    setVoices,
    isVoiceModalOpen,
    setIsVoiceModalOpen,
    handleToggleTts,
    handleOpenVoiceModal,
    handleSelectVoice,
    handlePreviewVoice,
    handlePreviewServerVoice,
    handlePreviewNativeVoice,
    handlePauseTTS,
    handleResumeTTS,
    handleRepeatTTS,
    resetAudioSessionAfterRecording,
    unlockAudioSession,
    stopTts,
    audioRef,
    lastSpokenTextRef,
    gongAudioRef,
  };
}
