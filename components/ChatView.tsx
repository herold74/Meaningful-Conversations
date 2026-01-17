import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bot, Message, Language, User, CoachingMode } from '../types';
import * as geminiService from '../services/geminiService';
import * as userService from '../services/userService';
import * as guestService from '../services/guestService';
import Spinner from './shared/Spinner';
import { PaperPlaneIcon } from './icons/PaperPlaneIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SpeakerOnIcon } from './icons/SpeakerOnIcon';
import { SpeakerOffIcon } from './icons/SpeakerOffIcon';
import { PauseIcon } from './icons/PauseIcon';
import { PlayIcon } from './icons/PlayIcon';
import { RepeatIcon } from './icons/RepeatIcon';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { XIcon } from './icons/XIcon';
import { LogOutIcon } from './icons/LogOutIcon';
import { GearIcon } from './icons/GearIcon';
import VoiceSelectionModal from './VoiceSelectionModal';
import { useLocalization } from '../context/LocalizationContext';
import { selectVoice } from '../utils/voiceUtils';
import { FlagIcon } from './icons/FlagIcon';
import FeedbackModal from './FeedbackModal';
import { synthesizeSpeech, getBotVoiceSettings, saveBotVoiceSettings, type TtsMode, type BotVoiceSettings } from '../services/ttsService';
import { getApiBaseUrl } from '../services/api';
import * as api from '../services/api';
import { decryptPersonalityProfile } from '../utils/personalityEncryption';

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare var SpeechRecognition: SpeechRecognitionConstructor;
declare var webkitSpeechRecognition: SpeechRecognitionConstructor;

// For SpeechRecognition API and AudioContext
interface CustomWindow extends Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof webkitSpeechRecognition;
  AudioContext: typeof AudioContext;
  webkitAudioContext: typeof AudioContext;
}
declare let window: CustomWindow;

// Wake Lock API types
interface WakeLockSentinel extends EventTarget {
  readonly released: boolean;
  readonly type: 'screen';
  release(): Promise<void>;
}

interface Navigator {
  wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  };
}

interface CoachInfoModalProps {
  bot: Bot;
  isOpen: boolean;
  onClose: () => void;
  coachingMode: 'off' | 'dpc' | 'dpfl';
}

const CoachInfoModal: React.FC<CoachInfoModalProps> = ({ bot, isOpen, onClose, coachingMode }) => {
    const { language, t } = useLocalization();
    if (!isOpen) return null;

    const botDescription = language === 'de' ? bot.description_de : bot.description;
    const botStyle = language === 'de' ? bot.style_de : bot.style;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-info-title"
    >
      <div 
        className="bg-background-secondary dark:bg-background-tertiary w-full max-w-md m-4 p-6 border border-border-secondary dark:border-border-primary shadow-xl text-center animate-fadeIn rounded-lg" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end -mt-2 -mr-2">
            <button onClick={onClose} className="p-2 text-content-secondary hover:text-content-primary" aria-label="Close">
                <XIcon className="w-6 h-6" />
            </button>
        </div>
        <img src={bot.avatar} alt={bot.name} className="w-24 h-24 rounded-full mx-auto -mt-6 mb-4 border-4 border-background-secondary dark:border-background-tertiary" />
        <h2 id="coach-info-title" className="text-2xl font-bold text-content-primary">{bot.name}</h2>
        <div className="flex flex-wrap justify-center gap-2 my-3">
          {botStyle.split(', ').map(tag => (
            <span key={tag} className="px-2.5 py-1 text-xs font-bold tracking-wide uppercase bg-background-tertiary text-content-secondary dark:bg-background-tertiary dark:text-content-secondary rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-2 text-content-secondary leading-relaxed">{botDescription}</p>
        
        {/* Coaching Mode Info */}
        {coachingMode !== 'off' && (
          <div className="mt-4 p-3 bg-background-tertiary dark:bg-background-primary border border-border-primary rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-lg font-bold text-content-primary">
                {coachingMode === 'dpc' ? 'DPC Modus' : 'DPFL Modus'}
              </span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              {coachingMode === 'dpc' 
                ? t('profile_coaching_mode_dpc_desc')
                : t('profile_coaching_mode_dpfl_desc')
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


interface ChatViewProps {
  bot: Bot;
  lifeContext: string;
  chatHistory: Message[];
  setChatHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  onEndSession: () => void;
  onMessageSent: () => void;
  currentUser: User | null;
  isNewSession: boolean;
  encryptionKey?: CryptoKey | null;
  isTestMode?: boolean;
}


const ChatView: React.FC<ChatViewProps> = ({ bot, lifeContext, chatHistory, setChatHistory, onEndSession, onMessageSent, currentUser, isNewSession, encryptionKey, isTestMode }) => {
  const { t, language } = useLocalization();
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [decryptedProfile, setDecryptedProfile] = useState<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const baseTranscriptRef = useRef<string>('');
  const initialFetchInitiated = useRef<boolean>(false);

  // Handler to stop audio and end session
  const handleEndSession = useCallback(() => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Stop meditation gong audio if playing
    if (gongAudioRef.current) {
      gongAudioRef.current.pause();
      gongAudioRef.current.currentTime = 0;
    }
    
    // Stop Web Speech API TTS if active
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Stop speech recognition if active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors - recognition might already be stopped
      }
    }
    
    // Reset voice-related states
    setIsListening(false);
    setIsVoiceMode(false);
    
    // Reset TTS status
    setTtsStatus('idle');
    
    // Call the original onEndSession handler
    onEndSession();
  }, [onEndSession]);

  const [isListening, setIsListening] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false); // Default to off
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [ttsStatus, setTtsStatus] = useState<'idle' | 'speaking' | 'paused'>('idle');
  const lastSpokenTextRef = useRef<string>('');
  
  // TTS Mode: 'local' uses Web Speech API, 'server' uses Piper TTS
  // Load bot-specific settings
  const [ttsMode, setTtsMode] = useState<TtsMode>(() => {
    const settings = getBotVoiceSettings(bot.id);
    return settings[language].mode;
  });
  
  // Track if user selected "auto" mode
  const [isAutoMode, setIsAutoMode] = useState<boolean>(() => {
    const settings = getBotVoiceSettings(bot.id);
    return settings[language].isAuto;
  });
  
  // Audio element for server TTS playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  // Web Audio API context for iOS audio session management
  // Once resumed during user interaction, allows audio playback without further interaction
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // iOS/iPadOS detection (for Bluetooth profile switching delay)
  const isIOS = useMemo(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);
  
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(() => {
    const settings = getBotVoiceSettings(bot.id);
    return settings[language].voiceId;
  });
  const [isCoachInfoOpen, setIsCoachInfoOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackMessages, setFeedbackMessages] = useState<{ user: Message | null; bot: Message | null }>({ user: null, bot: null });
  
  // Meditation state
  const [meditationState, setMeditationState] = useState<{
    isActive: boolean;
    duration: number;
    remaining: number;
    introText: string;
    closingText: string;
    originalMode: 'text' | 'voice';
  } | null>(null);
  const gongAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Guest limit state
  const [guestLimitRemaining, setGuestLimitRemaining] = useState<number | null>(null);
  const [guestFingerprint, setGuestFingerprint] = useState<string | null>(null);
  const isGuest = !currentUser;


  const botGender = useMemo((): 'male' | 'female' => {
      switch (bot.id) {
          case 'g-interviewer':
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

  // Helper function to save language-specific voice settings
  const saveLanguageVoiceSettings = useCallback((mode: TtsMode, voiceId: string | null, isAuto: boolean) => {
    const allSettings = getBotVoiceSettings(bot.id);
    allSettings[language] = { mode, voiceId, isAuto };
    saveBotVoiceSettings(bot.id, allSettings);
  }, [bot.id, language]);

  // Reset voice settings when language changes
  // Derive coaching mode from user profile
  const coachingMode = currentUser?.coachingMode || 'off';
  
  // Load and decrypt personality profile when coaching mode is active
  useEffect(() => {
    const loadProfile = async () => {
      if (coachingMode && coachingMode !== 'off' && currentUser && encryptionKey) {
        try {
          const profileData = await api.loadPersonalityProfile();
          if (profileData && profileData.encryptedData) {
            // Decrypt client-side before sending to backend
            const decrypted = await decryptPersonalityProfile(profileData.encryptedData, encryptionKey);
            setDecryptedProfile(decrypted);
          }
        } catch (error) {
          console.error('Failed to load personality profile:', error);
          setDecryptedProfile(null);
        }
      } else {
        setDecryptedProfile(null);
      }
    };
    loadProfile();
  }, [coachingMode, currentUser, encryptionKey]);

  useEffect(() => {
    const settings = getBotVoiceSettings(bot.id);
    const langSettings = settings[language];
    
    setSelectedVoiceURI(langSettings.voiceId);
    setTtsMode(langSettings.mode);
    setIsAutoMode(langSettings.isAuto);
  }, [language, bot.id]);

  // Initialize gong audio with fallback to programmatic sound
  useEffect(() => {
    const audio = new Audio('/sounds/meditation-gong.ogg');
    audio.addEventListener('error', () => {
      // Fallback to programmatic gong if file not found
    });
    gongAudioRef.current = audio;
  }, []);


  // Check if saved voice is available, fallback to auto if not
  useEffect(() => {
    const checkVoiceAvailability = async () => {
      // Helper function to get best server voice for bot
      const getBestServerVoice = (botId: string, lang: string): string | null => {
        let gender: 'male' | 'female' = 'female';
        
        if (lang === 'en') {
          const maleBotsEN = ['max-ambitious', 'rob', 'kenji-stoic', 'nexus-gps'];
          gender = maleBotsEN.includes(botId) ? 'male' : 'female';
        } else if (lang === 'de') {
          const femaleBotsDE = ['g-interviewer', 'ava-strategic', 'chloe-cbt'];
          gender = femaleBotsDE.includes(botId) ? 'female' : 'male';
        }
        
        // Map to voice IDs
        // Note: No German female server voice available - will use local voice
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
        
        // Check if current saved selection is available
        if (ttsMode === 'server' && selectedVoiceURI) {
          // User has a server voice selected
          if (!serverAvailable) {
            // Server not available - temporarily use local fallback
            console.warn('[TTS Init] Server unavailable, temporarily using local (keeping saved preference)');
            
            // Temporarily use local fallback for this session
            setTtsMode('local');
            // DO NOT clear selectedVoiceURI or overwrite localStorage
            // The user's server voice preference stays saved and will be retried next time
          } else {
            // Server available, keep selection
          }
        } else if (ttsMode === 'local' && selectedVoiceURI) {
          // User has a local voice selected - check if it exists
          const voiceExists = window.speechSynthesis.getVoices().some(v => v.voiceURI === selectedVoiceURI);
          if (!voiceExists) {
            // Local voice not available anymore (browser update, different device, etc.)
            // Clear it permanently since local voices are device-specific
            console.warn('[TTS Init] Saved local voice no longer exists, resetting to auto mode');
            setIsAutoMode(true);
            setSelectedVoiceURI(null);
            saveLanguageVoiceSettings('local', null, true);
          }
        } else if (isAutoMode || (!selectedVoiceURI && ttsMode === 'local')) {
          // Auto mode or no selection - choose best available
          if (serverAvailable) {
            const bestVoice = getBestServerVoice(bot.id, language);
            if (bestVoice) {
              // Server voice available for this bot
              setSelectedVoiceURI(bestVoice);
              setTtsMode('server');
              saveLanguageVoiceSettings('server', bestVoice, true);
            } else {
              // No server voice for this bot/language - use local
              setSelectedVoiceURI(null);
              setTtsMode('local');
              saveLanguageVoiceSettings('local', null, true);
            }
          } else {
            // Server not available, use local auto-selection (handled by speak function)
            setSelectedVoiceURI(null);
            setTtsMode('local');
            saveLanguageVoiceSettings('local', null, true);
          }
        }
      } catch (error) {
        console.warn('[TTS Init] Could not check voice availability:', error);
        // On error, if user had a server voice selected, temporarily fall back to local
        // BUT: Keep the saved preference in localStorage for next time!
        if (ttsMode === 'server') {
          console.warn('[TTS Init] Temporarily switching to local mode (keeping saved preference)');
          // Temporarily use local mode for this session
          setTtsMode('local');
          // DO NOT clear selectedVoiceURI or overwrite localStorage
          // The user's preference stays saved and will be retried next session
        }
      }
    };
    
    checkVoiceAvailability();
  }, [bot.id, language]); // Re-run when bot or language changes

  // Auto-scroll to bottom when switching to text mode
  useEffect(() => {
    if (!isVoiceMode && chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [isVoiceMode]);
  
  // Initialize guest limit checking
  useEffect(() => {
    if (isGuest) {
      const fingerprint = guestService.getOrCreateFingerprint();
      setGuestFingerprint(fingerprint);
      
      // Check guest limit
      guestService.checkGuestLimit(fingerprint).then(result => {
        setGuestLimitRemaining(result.remaining);
      }).catch(error => {
        console.error('Failed to check guest limit:', error);
        // On error, allow (fail open)
        setGuestLimitRemaining(50);
      });
    }
  }, [isGuest]);

  useEffect(() => {
    if (!window.speechSynthesis) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices();

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
        // Do NOT call cancel() - it interferes with ongoing TTS during StrictMode re-mounts
      }
    };
  }, []);

  // Wake Lock: Keep screen active in voice mode to prevent interruption
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        // Check if Wake Lock API is supported
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');

          // Re-acquire wake lock when visibility changes (e.g., switching tabs)
          const handleVisibilityChange = async () => {
            if (wakeLock !== null && document.visibilityState === 'visible' && isVoiceMode) {
              try {
                wakeLock = await navigator.wakeLock.request('screen');
              } catch (err) {
                console.error('Failed to re-acquire wake lock:', err);
              }
            }
          };

          document.addEventListener('visibilitychange', handleVisibilityChange);

          // Store cleanup function
          wakeLock.addEventListener('release', () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          });
        } else {
          console.warn('Screen Wake Lock API not supported on this device');
        }
      } catch (err) {
        console.error('Failed to acquire screen wake lock:', err);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock !== null) {
        try {
          await wakeLock.release();
          wakeLock = null;
        } catch (err) {
          console.error('Failed to release wake lock:', err);
        }
      }
    };

    // Activate wake lock when entering voice mode
    if (isVoiceMode) {
      requestWakeLock();
    }

    // Cleanup: Release wake lock when leaving voice mode or component unmounts
    return () => {
      releaseWakeLock();
    };
  }, [isVoiceMode]);

  // iOS Bluetooth Audio Fix: Use MediaSession API to signal this is an audio app
  // This helps iOS maintain a stable Bluetooth audio route
  useEffect(() => {
    // Check both mediaSession and MediaMetadata availability
    if (!isVoiceMode || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    
    console.log('[iOS Audio Fix] Activating MediaSession to signal audio app');
    
    // Set metadata to signal this is a media/audio session
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Meaningful Conversations',
      artist: bot.name || 'Coach',
      album: 'Voice Chat'
    });
    
    // Don't bind action handlers - we don't want EarPods buttons to control anything
    // Just the presence of MediaSession helps iOS prioritize audio routing
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    
    // Cleanup: Clear MediaSession when leaving voice mode
    return () => {
      console.log('[iOS Audio Fix] Deactivating MediaSession');
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
      }
    };
  }, [isVoiceMode, bot.name]);

  // Track current audio blob URL for cleanup
  const currentAudioUrlRef = useRef<string | null>(null);
  
  // iOS Audio Session Unlock: Resume AudioContext during user interaction
  // This allows audio.play() to work later without requiring another user interaction
  const unlockAudioSession = useCallback(() => {
    // Create AudioContext if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    // Resume if suspended (required for iOS)
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    
    // Also play a silent audio to warm up the HTML5 Audio element
    const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    silentAudio.volume = 0.01;
    silentAudio.play().then(() => {
      silentAudio.pause();
    }).catch(() => {});
  }, []);

  // iOS Audio Session Reset: After speech recognition, iOS may be stuck in "playAndRecord" mode
  // which causes TTS to sound "tinny/telephony". This function resets the audio session by:
  // 1. Closing the existing AudioContext (releases the recording session)
  // 2. Creating a fresh AudioContext configured for playback only
  // 3. Playing a short tone to force iOS to switch to normal playback mode
  const resetAudioSessionAfterRecording = useCallback(async () => {
    if (!isIOS) return;
    
    // Close existing context to release recording session
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch (e) {
        // Ignore close errors
      }
      audioContextRef.current = null;
    }
    
    // Create fresh AudioContext - this should use standard playback mode
    try {
      const freshCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = freshCtx;
      
      // Play a very short tone to force iOS to initialize the new audio session
      // Using 44100 Hz sample rate (CD quality) to signal we want high-quality output
      const oscillator = freshCtx.createOscillator();
      const gainNode = freshCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(freshCtx.destination);
      
      // Very quiet, very short tone (nearly inaudible)
      gainNode.gain.setValueAtTime(0.01, freshCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, freshCtx.currentTime + 0.1);
      
      oscillator.frequency.setValueAtTime(440, freshCtx.currentTime); // A4 note
      oscillator.start(freshCtx.currentTime);
      oscillator.stop(freshCtx.currentTime + 0.1);
    } catch (e) {
      // Ignore errors
    }
  }, [isIOS]);
  
  // Cleanup audio on unmount
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

  const speak = useCallback(async (text: string, isMeditation: boolean = false) => {
    if (!isTtsEnabled || !text.trim()) {
      return;
    }
    
    // Set loading state IMMEDIATELY and force React to render before continuing
    // This prevents React from batching the true->false updates together
    setIsLoadingAudio(true);
    await Promise.resolve();
    
    const cleanText = text
        .replace(/#{1,6}\s/g, '')
        .replace(/(\*\*|__|\*|_|~~|`|```)/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .replace(/!\[[^\]]*\]\([^\)]*\)/g, '')
        .replace(/^-{3,}|^\*{3,}|^_{3,}/gm, '')
        .replace(/^>\s?/gm, '');

    lastSpokenTextRef.current = cleanText;

    // iOS Safari has strict autoplay policies that prevent audio.play() outside of
    // direct user interaction. Server TTS requires async API calls which break this.
    // Solution: Force local TTS on iOS for reliable audio playback.
    const effectiveTtsMode = isIOS ? 'local' : ttsMode;

    // Server TTS mode (disabled on iOS due to autoplay restrictions)
    if (effectiveTtsMode === 'server') {
      try {
        const loadingStartTime = Date.now();
        
        // Stop and cleanup any existing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current = null;
        }
        
        // Revoke previous blob URL to prevent memory leaks
        if (currentAudioUrlRef.current) {
          URL.revokeObjectURL(currentAudioUrlRef.current);
          currentAudioUrlRef.current = null;
        }
        
        const voiceIdToUse = (ttsMode === 'server' && selectedVoiceURI) ? selectedVoiceURI : null;
        const audioBlob = await synthesizeSpeech(cleanText, bot.id, language, isMeditation, voiceIdToUse);
        
        // Ensure loading spinner is visible for at least 300ms
        const elapsed = Date.now() - loadingStartTime;
        if (elapsed < 300) {
          await new Promise(resolve => setTimeout(resolve, 300 - elapsed));
        }
        
        const audioUrl = URL.createObjectURL(audioBlob);
        currentAudioUrlRef.current = audioUrl;
        
        // Create a FRESH audio element for each playback
        // This resets iOS audio session and ensures consistent quality
        const audio = new Audio();
        audioRef.current = audio;
        
        // Set up event handlers
        audio.addEventListener('play', () => {
          setTtsStatus('speaking');
          setIsLoadingAudio(false); // Hide spinner when audio actually starts playing
        });
        audio.addEventListener('pause', () => {
          // Only set paused if not ended (ended also triggers pause)
          if (!audio.ended) setTtsStatus('paused');
        });
        audio.addEventListener('ended', () => {
          setTtsStatus('idle');
          // Cleanup after playback to reset iOS audio session
          if (currentAudioUrlRef.current === audioUrl) {
            URL.revokeObjectURL(audioUrl);
            currentAudioUrlRef.current = null;
          }
          // Don't null audioRef here - it's still needed for pause/resume
        });
        audio.addEventListener('error', () => {
          console.error('[TTS] Audio playback error');
          setTtsStatus('idle');
          setIsLoadingAudio(false);
        });
        
        audio.src = audioUrl;
        await audio.play();
      } catch (error) {
        console.error('[TTS] Server TTS error:', error);
        setIsLoadingAudio(false);
        setTtsStatus('idle');
        
        // Fallback to local mode but don't save preference
        // This allows retry on next session if server comes back
        setTtsMode('local');
        setTimeout(() => speak(text, isMeditation), 100);
      }
      return;
    }

    // Local TTS mode (Web Speech API)
    if (!window.speechSynthesis) {
      setIsLoadingAudio(false);
      return;
    }
    
    const loadingStartTime = Date.now();
    
    window.speechSynthesis.cancel();
    
    // Wait for cancel to complete (browser bug workaround)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.onstart = () => {
      // Ensure loading spinner is visible for at least 300ms
      const elapsed = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, 300 - elapsed);
      setTimeout(() => {
        setTtsStatus('speaking');
        setIsLoadingAudio(false); // Hide spinner when speech starts
      }, remainingTime);
    };
    utterance.onend = () => {
      setTtsStatus('idle');
    };
    utterance.onerror = () => {
      setTtsStatus('idle');
      setIsLoadingAudio(false); // Hide spinner on error
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
                case 'g-interviewer':
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
                    gender = 'male';
                    break;
                case 'nexus-gps':
                    gender = 'male';
                    utterance.rate = 1.1;
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
    
    // Safari bug workaround: sometimes speak() silently fails (speaking stays false)
    // In this case, we need to resume and/or retry
    if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
      // First try: resume in case it's paused internally
      window.speechSynthesis.resume();
      
      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // If still not speaking, cancel and retry
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Create fresh utterance for retry
        const retryUtterance = new SpeechSynthesisUtterance(cleanText);
        retryUtterance.onstart = utterance.onstart;
        retryUtterance.onend = utterance.onend;
        retryUtterance.onerror = utterance.onerror;
        if (finalVoice) retryUtterance.voice = finalVoice;
        
        window.speechSynthesis.speak(retryUtterance);
      }
    }
    
    // Browser bug workaround: force TTS to start if paused
    setTimeout(() => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 10);
  }, [isTtsEnabled, voices, bot.id, selectedVoiceURI, language, botGender, ttsMode]);

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
      // Show user-friendly error message
      alert(t('tts_server_unavailable') || 'Server TTS is not available. This feature requires a running backend with Piper TTS installed. You can still use local device voices.');
    }
  }, [t, bot.id, language]);

  const handleSelectVoice = useCallback(async (selection: { type: 'auto' } | { type: 'local'; voiceURI: string } | { type: 'server'; voiceId: string }) => {
    if (selection.type === 'auto') {
      // Save auto mode for this bot
      setIsAutoMode(true);
      
      // Auto mode: Try to use best available server voice, fallback to local
      try {
        const apiBaseUrl = getApiBaseUrl();
        const healthResponse = await fetch(`${apiBaseUrl}/api/tts/health`, { 
          signal: AbortSignal.timeout(3000) 
        });
        const healthData = await healthResponse.json();
        
        if (healthData.status === 'ok' && healthData.piperAvailable) {
          // Server TTS available - select best voice for bot
          const getBestServerVoice = (botId: string, lang: string): string | null => {
            let gender: 'male' | 'female' = 'female';
            
            if (lang === 'en') {
              const maleBotsEN = ['max-ambitious', 'rob', 'kenji-stoic', 'nexus-gps', 'victor-bowen'];
              gender = maleBotsEN.includes(botId) ? 'male' : 'female';
            } else if (lang === 'de') {
              const femaleBotsDE = ['g-interviewer', 'ava-strategic', 'chloe-cbt'];
              gender = femaleBotsDE.includes(botId) ? 'female' : 'male';
            }
            
            // Map to voice IDs
            if (lang === 'de') {
              // No female German server voice available - use local
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
            // No server voice available (e.g., female German) - use local
            setSelectedVoiceURI(null);
            setTtsMode('local');
            saveLanguageVoiceSettings('local', null, true);
          }
        } else {
          // Server TTS not available - use local
          setSelectedVoiceURI(null);
          setTtsMode('local');
          saveLanguageVoiceSettings('local', null, true);
        }
      } catch (error) {
        // Error checking server - fallback to local
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
    }
    setIsVoiceModalOpen(false);
  }, [bot.id, language]);
  
  const handleOpenVoiceModal = () => {
    if (!window.speechSynthesis) return;

    // If voices are already loaded, just open the modal.
    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
        setVoices(availableVoices);
        setIsVoiceModalOpen(true);
        return;
    }

    // If no voices are loaded (common on iOS on first load),
    // we need to trigger the browser to populate them.
    const primeAndOpen = () => {
        const newVoices = window.speechSynthesis.getVoices();
        setVoices(newVoices);
        setIsVoiceModalOpen(true);
        // Clean up the one-time listener to avoid conflicts.
        window.speechSynthesis.removeEventListener('voiceschanged', primeAndOpen);
    };

    // Set up a one-time listener that will open the modal AFTER voices are loaded.
    window.speechSynthesis.addEventListener('voiceschanged', primeAndOpen);

    // Speak a silent utterance to trigger the `voiceschanged` event.
    const primingUtterance = new SpeechSynthesisUtterance('');
    primingUtterance.volume = 0;
    window.speechSynthesis.speak(primingUtterance);
};

    const handleToggleTts = () => {
        if (isTtsEnabled) {
            if (ttsMode === 'server' && audioRef.current) {
                audioRef.current.pause();
            } else if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            setTtsStatus('idle');
        } else {
            // ENABLING TTS: Prime speechSynthesis with user gesture (Safari iOS requirement)
            // Safari requires speak() to be called directly in a user gesture handler
            // to "unlock" audio. This priming utterance is silent but unlocks the API.
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const primingUtterance = new SpeechSynthesisUtterance('');
                primingUtterance.volume = 0;
                window.speechSynthesis.speak(primingUtterance);
            }
        }
        setIsTtsEnabled(p => !p);
    };


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (textareaRef.current) {
        // We need to reset the height to 'auto' to allow it to shrink when text is deleted.
        textareaRef.current.style.height = 'auto';
        // Then set it to the scrollHeight to make it grow to fit the content.
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]); // This effect runs every time the input value changes.

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Determine bot's conversation language (not UI language!)
    // Gloria (g-interviewer) always speaks English regardless of UI language
    const botLanguage = bot.id === 'g-interviewer' ? 'en' : language;
    recognition.lang = botLanguage === 'de' ? 'de-DE' : 'en-US';

    recognition.onstart = () => {
      console.log('🎙️ Recognition started (onstart event fired)');
      setIsListening(true);
    };
    
    recognition.onend = () => {
      console.log('🎙️ Recognition ended (onend event fired)');
      setIsListening(false);
      
    };
    
    recognition.onerror = (event) => {
      // Enhanced error handling for better debugging and user feedback
      console.error("Speech recognition error:", {
        error: event.error,
        message: event.message,
        timestamp: new Date().toISOString()
      });
      
      // Provide specific error messages for common issues
      switch (event.error) {
        case 'not-allowed':
          console.error('❌ Microphone access denied. Please grant microphone permissions.');
          alert(t('microphone_permission_denied') || 'Microphone access denied. Please grant permissions in your browser settings.');
          break;
        case 'no-speech':
          console.warn('⚠️ No speech detected. Please try again.');
          break;
        case 'audio-capture':
          console.error('❌ Audio capture failed. Check if microphone is available and not used by another app.');
          alert(t('microphone_error') || 'Microphone error. Please check if your microphone is available and not used by another application.');
          break;
        case 'network':
          console.error('❌ Network error during speech recognition.');
          break;
        case 'aborted':
          // Common and usually not critical (e.g., user stopped recognition quickly)
          console.warn('⚠️ Speech recognition was aborted.');
          break;
        default:
          console.error('❌ Speech recognition error:', event.error);
      }
      
      setIsListening(false);
    };
    
    recognition.onresult = (event) => {
      let interim_transcript = '';
      let final_transcript = '';
      
      // Process all results - final results are accumulated, interim results are replaced.
      // Note: We use '=' for interim (not '+=') because on Android, each interim result
      // already contains the full transcript so far. Using '+=' would cause duplication.
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
        } else {
          interim_transcript = event.results[i][0].transcript; // Use last interim only
        }
      }
      
      // Combine the initial text (if any) with the new final and interim parts.
      setInput(baseTranscriptRef.current + final_transcript + interim_transcript);
    };

    recognitionRef.current = recognition;
  }, [language, bot.id]);
  
  useEffect(() => {
    // This effect is specifically to fetch the initial greeting from the bot.
    // The ref guard prevents this from running more than once (e.g., due to StrictMode).
    if (chatHistory.length !== 0 || initialFetchInitiated.current) {
        return;
    }
    initialFetchInitiated.current = true; // Set flag immediately to prevent re-entry.

    const fetchInitialMessage = async () => {
        setIsLoading(true);
        try {
            // Call with an empty history to trigger the bot's initial message.
            const response = await geminiService.sendMessage(
                bot.id, 
                lifeContext, 
                [], 
                language, 
                isNewSession,
                coachingMode,
                decryptedProfile
            );
            const initialBotMessage: Message = {
                id: `bot-${Date.now()}`,
                text: response.text,
                role: 'bot',
                timestamp: new Date().toISOString(),
            };
            setChatHistory([initialBotMessage]);
        } catch (err) {
            console.error('Error fetching initial message:', err);
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                text: t('chat_error'),
                role: 'bot',
                timestamp: new Date().toISOString(),
            };
            setChatHistory([errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    fetchInitialMessage();
  }, [bot.id, lifeContext, language, setChatHistory, t, isNewSession, chatHistory.length]);

  // Track if we've already spoken the first message
  const hasSpokenFirstMessageRef = useRef(false);
  
  // Reset ref when bot or session changes
  useEffect(() => {
    hasSpokenFirstMessageRef.current = false;
  }, [bot.id, isNewSession]);
  
  useEffect(() => {
      if (chatHistory.length === 1 && 
          chatHistory[0].role === 'bot' && 
          voices.length > 0 && 
          isTtsEnabled && 
          !hasSpokenFirstMessageRef.current) {
        hasSpokenFirstMessageRef.current = true;
        speak(chatHistory[0].text);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatHistory, voices, isTtsEnabled]);
  
  // Parse meditation markers from bot response
  const parseMeditationMarkers = (text: string): { 
    hasMeditation: boolean; 
    duration: number; 
    introText: string; 
    closingText: string;
    displayText: string;
  } => {
    const meditationRegex = /\[MEDITATION:(\d+)\]([\s\S]*?)\[MEDITATION_END\]([\s\S]*)/;
    const match = text.match(meditationRegex);
    
    if (match) {
      const duration = parseInt(match[1], 10);
      const intro = match[2].trim();
      const closing = match[3].trim();
      // Display text is intro + closing (without markers)
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
  };
  
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;
    
    // Check guest limit before sending
    if (isGuest && guestFingerprint) {
      const limitCheck = await guestService.checkGuestLimit(guestFingerprint);
      if (!limitCheck.allowed) {
        alert(t('guest_limit_exceeded_message'));
        return;
      }
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setTtsStatus('idle');

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      role: 'user',
      timestamp: new Date().toISOString(),
    };
    
    onMessageSent();
    const historyWithUserMessage = [...chatHistory, userMessage];
    setChatHistory(historyWithUserMessage);
    setIsLoading(true);
    baseTranscriptRef.current = '';

    try {
        const response = await geminiService.sendMessage(
            bot.id, 
            lifeContext, 
            historyWithUserMessage, 
            language, 
            false,
            coachingMode,
            decryptedProfile
        );
        
        // Parse for meditation markers
        const meditationData = parseMeditationMarkers(response.text);
        
        const botMessage: Message = {
            id: `bot-${Date.now()}`,
            text: meditationData.displayText, // Use text without markers
            role: 'bot',
            timestamp: new Date().toISOString(),
        };
        setChatHistory(prev => [...prev, botMessage]);
        
        // If meditation detected, handle it
        if (meditationData.hasMeditation) {
          // Speak only the intro text with meditation mode for slower speech
          speak(meditationData.introText, true);
          
          // Auto-switch to voice mode if not already
          const wasInTextMode = !isVoiceMode;
          if (wasInTextMode) {
            setIsVoiceMode(true);
          }
          
          // Start meditation timer after a brief delay (to let intro start speaking)
          setTimeout(() => {
            setMeditationState({
              isActive: true,
              duration: meditationData.duration,
              remaining: meditationData.duration,
              introText: meditationData.introText,
              closingText: meditationData.closingText,
              originalMode: wasInTextMode ? 'text' : 'voice'
            });
          }, 1000);
        } else {
          // Normal message, speak all of it
          speak(botMessage.text);
        }
        
        // Increment guest usage after successful message
        if (isGuest && guestFingerprint) {
          guestService.incrementGuestUsage(guestFingerprint).then(result => {
            setGuestLimitRemaining(result.remaining);
          }).catch(error => {
            console.error('Failed to increment guest usage:', error);
          });
        }

    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: t('chat_error'),
        role: 'bot',
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If the user submits the form while recognition is active, stop it first.
    if (isListening) {
      recognitionRef.current?.stop();
    }
    await sendMessage(input);
    setInput('');
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent adding a new line
        // Manually create a mock event and call the existing form submit handler
        const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
        await handleFormSubmit(syntheticEvent);
    }
  };
  
  const handleVoiceInteraction = async () => {
      if (isLoading || !recognitionRef.current) return;

      if (isListening) {
          // Stop recording
          recognitionRef.current.stop();
          
          // iOS Audio Session Fix: After microphone stops, iOS stays in "playAndRecord" mode
          // which causes degraded audio quality for TTS. We need to force iOS back to
          // stereo/A2DP mode by playing an HTML5 audio element (not AudioContext, which
          // uses a different audio path than Web Speech API).
          // This runs DURING user interaction, so autoplay is allowed.
          if (isIOS) {
              try {
                  // Play a silent audio file to force iOS to switch audio modes
                  // The playback itself triggers the mode switch, volume can be 0
                  const resetAudio = new Audio('data:audio/wav;base64,UklGRl4FAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToFAAB4eHh4d3d3d3Z2dnZ1dXV1dHR0dHNzc3NycnJycXFxcXBwcHBvb29vbm5ubm1tbW1sbGxsa2tra2pqamppaWlpaGhoaGdnZ2dmZmZmZWVlZWRkZGRjY2NjYmJiYmFhYWFgYGBgX19fX15eXl5dXV1dXFxcXFtbW1taWlpaWVlZWVhYWFhXV1dXVlZWVlVVVVVUVFRUU1NTU1JSUlJRUVFRUFBQUE9PT09OTk5OTU1NTUxMTExLS0tLSkpKSklJSUlISEhIR0dHR0ZGRkZFRUVFREREREREREREREREREREREVFRUVGRkZGR0dHR0hISEhJSUlJSkpKSktLS0tMTExMTU1NTU5OTk5PT09PUFBQUFFRUVFSUlJSU1NTU1RUVFRVVVVVVlZWVldXV1dYWFhYWVlZWVpaWlpbW1tbXFxcXF1dXV1eXl5eX19fX2BgYGBhYWFhYmJiYmNjY2NkZGRkZWVlZWZmZmZnZ2dnaGhoaGlpaWlqampqa2tra2xsbGxtbW1tbm5ubm9vb29wcHBwcXFxcXJycnJzc3NzdHR0dHV1dXV2dnZ2d3d3d3h4eHh5eXl5enp6ent7e3t8fHx8fX19fX5+fn5/f39/gICAgIGBgYGCgoKCg4ODg4SEhISFhYWFhoaGhoeHh4eIiIiIiYmJiYqKioqLi4uLjIyMjI2NjY2Ojo6Oj4+Pj5CQkJCRkZGRkpKSkpOTk5OUlJSUlZWVlZaWlpaXl5eXmJiYmJmZmZmampqam5ubm5ycnJydnZ2dnp6enp+fn5+goKCgoaGhoaKioqKjo6Ojo6Ojo6SkpKSlpaWlpqampqenp6eoqKioqampqaqqqqqqqqqqq6urq6ysrKytra2trq6urq+vr6+wsLCwsbGxsbKysrKzs7Ozs7OztLS0tLW1tbW2tra2t7e3t7i4uLi5ubm5urq6uru7u7u8vLy8vb29vb6+vr6/v7+/wMDAwMHBwcHCwsLCw8PDw8TExMTFxcXFxsbGxsfHx8fIyMjIycnJycrKysrLy8vLzMzMzM3Nzc3Ozs7Oz8/Pz9DQ0NDR0dHR0tLS0tPT09PT09PU1NTU1dXV1dbW1tbX19fX2NjY2NnZ2dna2tra29vb29zc3Nzd3d3d3t7e3t/f39/g4ODg4eHh4eLi4uLj4+Pj5OTk5OXl5eXm5ubm5+fn5+jo6Ojp6enp6urq6uvr6+vs7Ozs7e3t7e7u7u7v7+/v8PDw8PHx8fHy8vLy8/Pz8/T09PT19fX19vb29vf39/f4+Pj4+fn5+fr6+vr7+/v7/Pz8/P39/f3+/v7+//////////8=');
                  resetAudio.volume = 0; // Silent - playback itself triggers iOS mode switch
                  await resetAudio.play();
              } catch (e) {
                  // Ignore errors - this is just an optimization
              }
          }
          
          // Capture the current input value before any async operations
          const currentInput = input;
          
          // Send message after a delay for recognition to fully stop
          // iOS needs extra time (300ms) to switch audio sessions from recording to playback
          // to avoid crackling/popping sounds when TTS starts
          const audioSessionDelay = isIOS ? 300 : 100;
          if (currentInput.trim()) {
              setTimeout(async () => {
                  await sendMessage(currentInput);
                  setInput('');
              }, audioSessionDelay);
          }
      } else {
          // Stop any ongoing TTS playback
          window.speechSynthesis?.cancel();
          if (audioRef.current) {
            audioRef.current.pause();
          }
          setTtsStatus('idle');
          baseTranscriptRef.current = input.trim() ? input.trim() + ' ' : '';
          
          // Start recognition directly - let the browser handle mic permission (like v1.5.8)
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Failed to start speech recognition:', error);
            alert(t('microphone_start_error') || 'Failed to start microphone. Please try again.');
          }
      }
  };


  const handlePauseTTS = () => {
    if (ttsMode === 'server' && audioRef.current) {
      audioRef.current.pause();
    } else if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
    setTtsStatus('paused');
  };

  const handleResumeTTS = () => {
    if (ttsMode === 'server' && audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('Failed to resume audio:', err);
        setTtsStatus('idle');
      });
    } else if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
    setTtsStatus('speaking');
  };
  
  // Meditation timer countdown
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
  }, [meditationState?.remaining, meditationState?.isActive]);
  
  // Play gong sound (with Web Audio API fallback if MP3 not available)
  const playGongSound = async () => {
    if (gongAudioRef.current) {
      try {
        await gongAudioRef.current.play();
        await new Promise(resolve => setTimeout(resolve, 3000));
        return;
      } catch (error) {
        // MP3 gong failed, using Web Audio API fallback
      }
    }
    
    // Fallback: Generate gong sound with Web Audio API
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Gong-like sound: low frequency with decay
      oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 3);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error('Error playing fallback gong:', error);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Short delay if all fails
    }
  };
  
  // Meditation complete handler
  const handleMeditationComplete = async () => {
    if (!meditationState) return;
    
    // Play gong
    await playGongSound();
    
    // Speak closing text
    if (meditationState.closingText) {
      speak(meditationState.closingText);
    }
    
    // Return to original mode
    if (meditationState.originalMode === 'text') {
      setIsVoiceMode(false);
    }
    
    // Reset meditation state
    setMeditationState(null);
  };
  
  // Early stop meditation handler
  const handleStopMeditation = async () => {
    if (!meditationState) return;
    
    // Play gong immediately
    await playGongSound();
    
    // Speak closing text
    if (meditationState.closingText) {
      speak(meditationState.closingText);
    }
    
    // Return to original mode
    if (meditationState.originalMode === 'text') {
      setIsVoiceMode(false);
    }
    
    setMeditationState(null);
  };

  const handleRepeatTTS = () => {
    if (lastSpokenTextRef.current) {
        speak(lastSpokenTextRef.current);
    }
  };

  const handleOpenFeedbackModal = (botMessage: Message) => {
    const botMessageIndex = chatHistory.findIndex(msg => msg.id === botMessage.id);
    let lastUserMessage: Message | null = null;
    if (botMessageIndex > 0) {
        for (let i = botMessageIndex - 1; i >= 0; i--) {
            if (chatHistory[i].role === 'user') {
                lastUserMessage = chatHistory[i];
                break;
            }
        }
    }
    setFeedbackMessages({ user: lastUserMessage, bot: botMessage });
    setIsFeedbackModalOpen(true);
};

const handleFeedbackSubmit = async (feedback: { comments: string; isAnonymous: boolean; email?: string }) => {
    if (!feedbackMessages.bot) return;

    await userService.submitFeedback({
        // rating is omitted for message reports, which don't have a star rating.
        comments: feedback.comments,
        botId: bot.id,
        lastUserMessage: feedbackMessages.user?.text,
        botResponse: feedbackMessages.bot.text,
        isAnonymous: feedback.isAnonymous,
        email: feedback.email,
    });
};
  
  const relevantVoices = voices.filter(v => v.lang.toLowerCase().startsWith(language));

  return (
    <div className="flex flex-col h-[85vh] max-w-3xl mx-auto bg-background-secondary dark:bg-transparent border border-border-primary dark:border-border-primary shadow-lg rounded-lg overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b border-border-primary dark:border-border-primary gap-2">
        {/* Left: Coach Info (responsive) */}
        <div className="flex-1 min-w-0">
             <button 
                onClick={() => setIsCoachInfoOpen(true)} 
                className="flex items-center text-left focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-background-primary focus:ring-accent-primary rounded-lg p-1 -ml-1 transition-colors hover:bg-background-tertiary dark:hover:bg-background-tertiary/50"
                aria-label={`${t('chat_viewInfo')} for ${bot.name}`}
            >
                <img src={bot.avatar} alt={bot.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full mr-3 shrink-0" />
                <div className="min-w-0 flex items-center gap-2">
                    <h1 className="text-lg md:text-xl font-bold text-content-primary truncate">{bot.name}</h1>
                </div>
            </button>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center justify-end gap-x-1 sm:gap-x-2 md:gap-x-4 max-w-[50%] sm:max-w-none">
            <button 
                onClick={() => {
                    // iOS Audio Session Unlock: When entering voice mode, unlock audio session
                    // so that the first greeting can be spoken (useEffect calls speak() asynchronously)
                    if (!isVoiceMode) {
                        if (ttsMode === 'server') {
                            unlockAudioSession();
                        }
                        // Prime speechSynthesis for local TTS (Safari iOS requires user gesture)
                        if (window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                            const primingUtterance = new SpeechSynthesisUtterance('');
                            primingUtterance.volume = 0;
                            window.speechSynthesis.speak(primingUtterance);
                        }
                    }
                    
                    setIsVoiceMode(p => {
                        const newIsVoiceMode = !p;
                        if (newIsVoiceMode) {
                            setIsTtsEnabled(true);
                        }
                        return newIsVoiceMode;
                    });
                }} 
                className="p-2 text-content-secondary hover:text-content-primary" 
                aria-label={isVoiceMode ? t('chat_text_mode') : t('chat_voice_mode')}
            >
                {isVoiceMode ? <ChatBubbleIcon className="w-5 h-5 sm:w-6 sm:h-6"/> : <SoundWaveIcon className="w-5 h-5 sm:w-6 sm:h-6"/>}
            </button>

            {!isVoiceMode && (
                <div className="flex items-center justify-end gap-2 border-l border-border-primary pl-2 sm:pl-2 md:pl-4">
                    {isTtsEnabled && (
                        <>
                            {isLoadingAudio && (
                                <div className="p-1 text-content-secondary" aria-label={t('chat_loading_audio')}>
                                    <svg className="animate-spin w-5 h-5 sm:w-6 sm:h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            )}
                            {!isLoadingAudio && ttsStatus === 'idle' && (
                                <button type="button" onClick={handleRepeatTTS} disabled={!lastSpokenTextRef.current} className="p-1 text-content-secondary hover:text-content-primary disabled:text-gray-300 dark:disabled:text-gray-700" aria-label={t('chat_repeat_tts')}>
                                    <RepeatIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            )}
                            {!isLoadingAudio && ttsStatus === 'speaking' && <button type="button" onClick={handlePauseTTS} className="p-1 text-content-secondary hover:text-content-primary" aria-label={t('chat_pause_tts')}><PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" /></button>}
                            {!isLoadingAudio && ttsStatus === 'paused' && <button type="button" onClick={handleResumeTTS} className="p-1 text-content-secondary hover:text-content-primary" aria-label={t('chat_resume_tts')}><PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" /></button>}
                        </>
                    )}
                    <button type="button" onClick={handleToggleTts} className="p-1 text-content-secondary hover:text-content-primary" aria-label={isTtsEnabled ? t('chat_disable_tts') : t('chat_enable_tts')}>
                        {isTtsEnabled ? <SpeakerOnIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <SpeakerOffIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>
                    {isTtsEnabled && (
                        <button
                            type="button"
                            onClick={handleOpenVoiceModal}
                            className="p-1 text-content-secondary hover:text-content-primary"
                            aria-label={t('chat_voice_settings')}
                        >
                            <GearIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    )}
                </div>
            )}

            {/* Separator */}
            <div className="h-6 w-px bg-border-primary mx-1"></div>

            {/* End Session Button/Icon */}
            <button
                onClick={handleEndSession}
                className="hidden md:flex items-center px-4 py-2 text-sm font-bold text-red-600 dark:text-accent-primary bg-transparent border border-red-600 dark:border-accent-primary uppercase hover:bg-red-600 dark:hover:bg-accent-primary hover:text-white dark:hover:text-black rounded-lg shadow-md"
            >
                {t('chat_end_session')}
            </button>
            <button
                onClick={handleEndSession}
                className="md:hidden p-2 text-red-600 dark:text-accent-primary rounded-full hover:bg-red-50 dark:hover:bg-accent-primary/10"
                aria-label={t('chat_end_session')}
            >
                <LogOutIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </div>
      </header>
      
      {/* Guest Limit Indicator */}
      {isGuest && guestLimitRemaining !== null && (
        <div className="px-4 py-2 bg-status-info-background dark:bg-status-info-background border-b border-status-info-border dark:border-status-info-border/30">
          <p className="text-sm text-status-info-foreground dark:text-status-info-foreground text-center">
            {t('guest_limit_remaining', { remaining: guestLimitRemaining })}
          </p>
        </div>
      )}
      
      {/* Test Mode Banner */}
      {isTestMode && chatHistory.length > 0 && (
        <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700/50">
          <p className="text-sm text-amber-700 dark:text-amber-300 text-center font-medium">
            🧪 {t('test_mode_banner')}
          </p>
        </div>
      )}
      
    {isVoiceMode ? (
        <main className="flex-1 flex flex-col items-center gap-4 p-6 text-center bg-background-primary dark:bg-background-primary/50 overflow-y-auto">
            {/* Top third: Bot Avatar & Name */}
            <div className="flex-1 flex flex-col items-center justify-center py-4 min-h-[12rem]">
                <div className="animate-fadeIn">
                    <img src={bot.avatar} alt={bot.name} className="w-32 h-32 rounded-full mx-auto mb-4 shadow-lg border-4 border-background-secondary dark:border-border-primary" />
                    <h1 className="text-3xl font-bold text-content-primary">{bot.name}</h1>
                </div>
            </div>

            {/* Middle third: Microphone/Meditation Timer */}
            <div className="flex-1 flex flex-col items-center justify-center py-4 w-full min-h-[12rem]">
                {meditationState?.isActive ? (
                    <div className="flex flex-col items-center">
                        <div className="relative w-40 h-40">
                            {/* Circular progress ring */}
                            <svg className="transform -rotate-90 w-40 h-40">
                                <circle 
                                    cx="80" 
                                    cy="80" 
                                    r="70" 
                                    stroke="currentColor" 
                                    strokeWidth="8" 
                                    fill="none" 
                                    className="text-gray-300 dark:text-gray-700" 
                                />
                                <circle 
                                    cx="80" 
                                    cy="80" 
                                    r="70" 
                                    stroke="currentColor" 
                                    strokeWidth="8" 
                                    fill="none" 
                                    className="text-accent-primary"
                                    strokeDasharray={`${2 * Math.PI * 70}`}
                                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - meditationState.remaining / meditationState.duration)}`}
                                    style={{ transition: 'stroke-dashoffset 1s linear' }} 
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold text-content-primary">
                                    {Math.floor(meditationState.remaining / 60)}:{String(meditationState.remaining % 60).padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={handleStopMeditation}
                            className="mt-6 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold uppercase shadow-md"
                        >
                            {t('meditation_early_stop')}
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={handleVoiceInteraction}
                            disabled={isLoading}
                            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-xl focus:outline-none focus:ring-4 ${
                                isListening ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300 animate-pulse' : 'bg-accent-primary hover:bg-accent-primary-hover focus:ring-accent-primary/50'
                            } ${isLoading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                            aria-label={isListening ? 'Stop and send' : 'Start recording'}
                        >
                            {isLoading ? <Spinner /> : isListening ? <PaperPlaneIcon className="w-12 h-12 text-white" /> : <MicrophoneIcon className="w-12 h-12 text-white" />}
                        </button>
                        <div className="mt-4 h-14 text-lg text-content-secondary flex items-center justify-center px-4 w-full max-w-md">
                            <p>{input || (isListening ? 'Listening...' : t('chat_tapToSpeak'))}</p>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom third: Control Buttons - Doppelter Abstand nach oben */}
            <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-4 min-h-[8rem]">
                {isLoadingAudio ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-background-secondary dark:bg-background-tertiary shadow">
                            <svg className="animate-spin w-8 h-8 text-content-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <p className="text-sm text-content-secondary">{t('chat_loading_audio') || 'Loading audio...'}</p>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-6">
                        <button onClick={ttsStatus === 'speaking' ? handlePauseTTS : handleResumeTTS} disabled={ttsStatus === 'idle'} className="p-4 rounded-full bg-background-secondary dark:bg-background-tertiary disabled:opacity-50 hover:bg-background-tertiary dark:hover:bg-border-primary shadow" aria-label={ttsStatus === 'speaking' ? 'Pause Speech' : 'Resume Speech'}>
                            {ttsStatus === 'speaking' ? <PauseIcon className="w-8 h-8 text-content-primary"/> : <PlayIcon className="w-8 h-8 text-content-primary"/>}
                        </button>
                        <button onClick={handleRepeatTTS} disabled={!lastSpokenTextRef.current || ttsStatus !== 'idle'} className="p-4 rounded-full bg-background-secondary dark:bg-background-tertiary disabled:opacity-50 hover:bg-background-tertiary dark:hover:bg-border-primary shadow" aria-label={'Repeat'}>
                            <RepeatIcon className="w-8 h-8 text-content-primary"/>
                        </button>
                    </div>
                )}
            </div>
        </main>
    ) : (
      <>
        <main ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6">
          {chatHistory.map((message, index) => (
            <div key={message.id} className={`group flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'bot' && <img src={bot.avatar} alt={bot.name} className="w-8 h-8 rounded-full self-start" />}
              <div className={`max-w-md p-3 ${message.role === 'user' ? 'bg-accent-tertiary text-accent-tertiary-foreground rounded-l-lg rounded-br-lg' : 'prose dark:prose-invert bg-background-tertiary text-content-primary dark:bg-background-tertiary dark:text-content-primary rounded-r-lg rounded-bl-lg'}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
              </div>
               {message.role === 'bot' && index > 0 && !isLoading && (
                    <button
                        onClick={() => handleOpenFeedbackModal(message)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-content-subtle hover:text-content-secondary self-center"
                        aria-label={t('chat_report_message')}
                        title={t('chat_report_message')}
                    >
                        <FlagIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
          ))}
          {isLoading && (
              <div className="flex gap-3 justify-start animate-fadeIn">
                  <img src={bot.avatar} alt={bot.name} className="w-8 h-8 rounded-full self-start" />
                  <div className="max-w-md p-3 bg-background-tertiary dark:bg-background-tertiary rounded-r-lg rounded-bl-lg">
                      <Spinner />
                  </div>
              </div>
          )}
        </main>
        
        <footer className="p-4 border-t border-border-primary">
          {isTestMode ? (
            <div className="text-center py-2 text-content-secondary">
              <p className="text-sm">{t('test_mode_input_disabled')}</p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat_placeholder')}
                disabled={isLoading}
                rows={1}
                className="flex-1 p-3 bg-background-tertiary text-content-primary border border-border-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary resize-none overflow-y-auto max-h-40"
              />
              <button type="button" onClick={handleVoiceInteraction} disabled={isLoading} className="p-2 text-content-secondary hover:text-content-primary disabled:text-gray-300 dark:disabled:text-gray-700" aria-label={isListening ? t('chat_send_message') : t('chat_voice_mode')}>
                  <MicrophoneIcon className={`w-6 h-6 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
              </button>
              <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-accent-primary text-content-inverted hover:bg-accent-primary-hover disabled:bg-gray-300 dark:disabled:bg-gray-700 rounded-lg">
                <PaperPlaneIcon className="w-6 h-6" />
              </button>
            </form>
          )}
        </footer>
      </>
    )}
    <VoiceSelectionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        voices={relevantVoices}
        currentVoiceURI={selectedVoiceURI}
        currentTtsMode={ttsMode}
        isAutoMode={isAutoMode}
        onSelectVoice={handleSelectVoice}
        onPreviewVoice={handlePreviewVoice}
        onPreviewServerVoice={handlePreviewServerVoice}
        botLanguage={language}
        botGender={botGender}
    />
     <CoachInfoModal
        bot={bot}
        isOpen={isCoachInfoOpen}
        onClose={() => setIsCoachInfoOpen(false)}
        coachingMode={coachingMode}
    />
     <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
        lastUserMessage={feedbackMessages.user}
        botMessage={feedbackMessages.bot}
        currentUser={currentUser}
    />
    </div>
  );
};

export default ChatView;