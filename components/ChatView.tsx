import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bot, Message, User } from '../types';
import * as geminiService from '../services/geminiService';
import * as userService from '../services/userService';
import * as guestService from '../services/guestService';
import BrandLoader from './shared/BrandLoader';
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
import { LogOutIcon } from './icons/LogOutIcon';
import { GearIcon } from './icons/GearIcon';
import VoiceSelectionModal from './VoiceSelectionModal';
import { useLocalization } from '../context/LocalizationContext';
import { FlagIcon } from './icons/FlagIcon';
import FeedbackModal from './FeedbackModal';
import * as api from '../services/api';
import { decryptPersonalityProfile } from '../utils/personalityEncryption';
import { speechService } from '../services/capacitorSpeechService';
import { isDesktopWeb } from '../utils/platformDetection';
import { useWakeLock } from '../hooks/useWakeLock';
import CoachInfoModal from './CoachInfoModal';
import { useTts } from '../hooks/useTts';
import { useMeditation } from '../hooks/useMeditation';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

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
  const footerRef = useRef<HTMLElement>(null);
  const initialFetchInitiated = useRef<boolean>(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const isIOS = useMemo(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  const tts = useTts({ bot, language, currentUser, chatHistory, isVoiceMode, isNewSession, t });
  const meditation = useMeditation({
    speak: tts.speak,
    setIsVoiceMode,
    gongAudioRef: tts.gongAudioRef,
    t,
  });

  const [isCoachInfoOpen, setIsCoachInfoOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackMessages, setFeedbackMessages] = useState<{ user: Message | null; bot: Message | null }>({ user: null, bot: null });

  const [guestLimitRemaining, setGuestLimitRemaining] = useState<number | null>(null);
  const [guestFingerprint, setGuestFingerprint] = useState<string | null>(null);
  const isGuest = !currentUser;

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

  const coachingMode = currentUser?.coachingMode || 'off';
  const effectiveCoachingMode = (bot.id === 'nexus-gps' && coachingMode === 'dpfl') ? 'dpc' : coachingMode;

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    if (isGuest && guestFingerprint) {
      const limitCheck = await guestService.checkGuestLimit(guestFingerprint);
      if (!limitCheck.allowed) {
        alert(t('guest_limit_exceeded_message'));
        return;
      }
    }

    tts.stopTts();

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

    try {
      const response = await geminiService.sendMessage(
        bot.id,
        lifeContext,
        historyWithUserMessage,
        language,
        false,
        effectiveCoachingMode,
        decryptedProfile
      );

      const meditationData = meditation.parseMeditationMarkers(response.text);

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: meditationData.displayText,
        role: 'bot',
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, botMessage]);

      if (meditationData.hasMeditation) {
        tts.speak(meditationData.introText, true);

        const wasInTextMode = !isVoiceMode;
        if (wasInTextMode) {
          setIsVoiceMode(true);
        }

        setTimeout(() => {
          meditation.setMeditationState({
            isActive: true,
            duration: meditationData.duration,
            remaining: meditationData.duration,
            introText: meditationData.introText,
            closingText: meditationData.closingText,
            originalMode: wasInTextMode ? 'text' : 'voice'
          });
        }, 1000);
      } else {
        tts.speak(botMessage.text);
      }

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
  }, [bot.id, lifeContext, chatHistory, setChatHistory, language, isLoading, isGuest, guestFingerprint, isVoiceMode, decryptedProfile, onMessageSent, t, meditation, tts, effectiveCoachingMode]);

  const speech = useSpeechRecognition({
    input,
    setInput,
    language,
    sendMessage,
    isLoading,
    setIsLoading,
    isIOS,
    stopTts: tts.stopTts,
    t,
  });

  const handleEndSession = useCallback(() => {
    tts.stopTts();
    speech.stopSpeech().catch(() => {});
    setIsVoiceMode(false);
    onEndSession();
  }, [onEndSession, tts, speech]);

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

  // Wake Lock: Keep screen active in voice mode to prevent the OS from
  // locking the screen and killing the microphone mid-sentence.
  const wakeLock = useWakeLock();
  useEffect(() => {
    if (isVoiceMode) {
      wakeLock.request();
    } else {
      wakeLock.release();
    }
  }, [isVoiceMode, wakeLock.request, wakeLock.release]);


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

  // Speech recognition is now fully managed by the unified speechService
  // (WebSpeechService for browsers, NativeSpeechService for iOS)
  // No per-language setup needed - language is passed at start() time

  useEffect(() => {
    // This effect handles two cases on mount:
    // 1. Normal start (empty history) → fetch the bot's initial greeting.
    // 2. Pre-seeded user message (e.g., from transcript evaluation "Start session")
    //    → skip greeting, auto-send the user message to get the bot's response.
    // The ref guard prevents this from running more than once (e.g., due to StrictMode).
    if (initialFetchInitiated.current) {
        return;
    }

    // Case 1: Empty history → fetch greeting
    if (chatHistory.length === 0) {
        initialFetchInitiated.current = true;

        const fetchInitialMessage = async () => {
            setIsLoading(true);
            try {
                const response = await geminiService.sendMessage(
                    bot.id, 
                    lifeContext, 
                    [], 
                    language, 
                    isNewSession,
                    effectiveCoachingMode,
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
        return;
    }

    // Case 2: Pre-seeded with a user message → auto-send to get bot response
    if (chatHistory.length === 1 && chatHistory[0].role === 'user') {
        initialFetchInitiated.current = true;

        const autoSendPreSeeded = async () => {
            setIsLoading(true);
            try {
                const response = await geminiService.sendMessage(
                    bot.id,
                    lifeContext,
                    chatHistory,
                    language,
                    true, // isNewSession — skip "Next Steps" check-in
                    effectiveCoachingMode,
                    decryptedProfile
                );
                const botMessage: Message = {
                    id: `bot-${Date.now()}`,
                    text: response.text,
                    role: 'bot',
                    timestamp: new Date().toISOString(),
                };
                setChatHistory(prev => [...prev, botMessage]);
            } catch (err) {
                console.error('Error auto-sending pre-seeded message:', err);
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

        autoSendPreSeeded();
        return;
    }
  }, [bot.id, lifeContext, language, setChatHistory, t, isNewSession, chatHistory.length, effectiveCoachingMode, decryptedProfile]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (speech.isListening) {
      await speech.stopSpeech();
    }
    await sendMessage(input);
    setInput('');
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On mobile/tablet (< 768px or native app) Enter adds a newline;
    // only the paper-plane button sends. On desktop, Enter sends.
    if (e.key === 'Enter' && !e.shiftKey && isDesktopWeb()) {
        e.preventDefault();
        const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
        await handleFormSubmit(syntheticEvent);
    }
  };

  const handleOpenFeedbackModal = (botMessage: Message) => {
    const botMessageIndex = chatHistory.findIndex(m => m.id === botMessage.id);
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
  
  const relevantVoices = useMemo(() =>
    tts.voices.filter(v => v.lang.toLowerCase().startsWith(language)),
    [tts.voices, language]
  );

  return (
    <div className="flex flex-col h-[82.5vh] max-w-3xl mx-auto bg-background-secondary dark:bg-transparent border border-border-primary dark:border-border-primary shadow-lg rounded-lg overflow-hidden">
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
                        if (tts.ttsMode === 'server') {
                            tts.unlockAudioSession();
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
                            tts.setIsTtsEnabled(true);
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
                    {/* DEBUG: Show states */}
                    {/* <span className="text-[8px] text-red-500">{isLoadingAudio ? 'L' : '-'}{isTtsEnabled ? 'T' : '-'}</span> */}
                    {tts.isTtsEnabled && (
                        <>
                            {tts.isLoadingAudio && (
                                <div className="flex items-center gap-2 p-1 text-accent-primary animate-pulse" aria-label={t('chat_loading_audio')}>
                                    <svg className="animate-spin w-5 h-5 sm:w-6 sm:h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-xs hidden sm:inline">{t('chat_audio_loading')}</span>
                                </div>
                            )}
                            {!tts.isLoadingAudio && tts.ttsStatus === 'idle' && (
                                <button type="button" onClick={tts.handleRepeatTTS} disabled={!tts.lastSpokenTextRef.current} className="p-1 text-content-secondary hover:text-content-primary disabled:text-gray-300 dark:disabled:text-gray-700" aria-label={t('chat_repeat_tts')}>
                                    <RepeatIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            )}
                            {!tts.isLoadingAudio && tts.ttsStatus === 'speaking' && <button type="button" onClick={tts.handlePauseTTS} className="p-1 text-content-secondary hover:text-content-primary" aria-label={t('chat_pause_tts')}><PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" /></button>}
                            {!tts.isLoadingAudio && tts.ttsStatus === 'paused' && <button type="button" onClick={tts.handleResumeTTS} className="p-1 text-content-secondary hover:text-content-primary" aria-label={t('chat_resume_tts')}><PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" /></button>}
                        </>
                    )}
                    <button type="button" onClick={tts.handleToggleTts} className="p-1 text-content-secondary hover:text-content-primary" aria-label={tts.isTtsEnabled ? t('chat_disable_tts') : t('chat_enable_tts')}>
                        {tts.isTtsEnabled ? <SpeakerOnIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <SpeakerOffIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>
                    {tts.isTtsEnabled && (
                        <button
                            type="button"
                            onClick={tts.handleOpenVoiceModal}
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
                {meditation.meditationState?.isActive ? (
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
                                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - meditation.meditationState.remaining / meditation.meditationState.duration)}`}
                                    style={{ transition: 'stroke-dashoffset 1s linear' }} 
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold text-content-primary">
                                    {Math.floor(meditation.meditationState.remaining / 60)}:{String(meditation.meditationState.remaining % 60).padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={meditation.handleStopMeditation}
                            className="mt-6 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold uppercase shadow-md"
                        >
                            {t('meditation_early_stop')}
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={speech.handleVoiceInteraction}
                            disabled={isLoading}
                            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-xl focus:outline-none focus:ring-4 ${
                                speech.isListening ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300 animate-pulse' : 'bg-accent-primary hover:bg-accent-primary-hover focus:ring-accent-primary/50'
                            } ${isLoading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                            aria-label={speech.isListening ? t('chat_voice_stop_and_send') : t('chat_voice_start_recording')}
                        >
                            {speech.isListening ? <PaperPlaneIcon className="w-12 h-12 text-white" /> : <MicrophoneIcon className="w-12 h-12 text-white" />}
                        </button>
                        <div className="mt-8 text-lg text-content-secondary flex flex-col items-center justify-center px-4 w-full max-w-md">
                            <p className="h-14 flex items-center">{input || (speech.isListening ? t('chat_voice_listening') : t('chat_tapToSpeak'))}</p>
                            {speech.isListening && !wakeLock.isSupported && (
                                <p className="text-xs text-status-warning-foreground mt-1">{t('chat_keep_screen_on')}</p>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Bottom third: Control Buttons - Doppelter Abstand nach oben */}
            <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-4 min-h-[8rem]">
                {(isLoading || tts.isLoadingAudio) ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-background-secondary dark:bg-background-tertiary shadow">
                            <BrandLoader size="md" />
                        </div>
                        <p className="text-sm text-content-secondary">
                            {isLoading 
                                ? (t('chat_generating_response') || 'Antwort wird generiert...') 
                                : (t('chat_loading_audio') || 'Audio wird geladen...')}
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-6">
                        <button onClick={tts.ttsStatus === 'speaking' ? tts.handlePauseTTS : tts.handleResumeTTS} disabled={tts.ttsStatus === 'idle'} className="p-4 rounded-full bg-background-secondary dark:bg-background-tertiary disabled:opacity-50 hover:bg-background-tertiary dark:hover:bg-border-primary shadow" aria-label={tts.ttsStatus === 'speaking' ? t('chat_voice_pause_speech') : t('chat_voice_resume_speech')}>
                            {tts.ttsStatus === 'speaking' ? <PauseIcon className="w-8 h-8 text-content-primary"/> : <PlayIcon className="w-8 h-8 text-content-primary"/>}
                        </button>
                        <button onClick={tts.handleRepeatTTS} disabled={!tts.lastSpokenTextRef.current || tts.ttsStatus !== 'idle'} className="p-4 rounded-full bg-background-secondary dark:bg-background-tertiary disabled:opacity-50 hover:bg-background-tertiary dark:hover:bg-border-primary shadow" aria-label={t('chat_voice_repeat')}>
                            <RepeatIcon className="w-8 h-8 text-content-primary"/>
                        </button>
                    </div>
                )}
            </div>
        </main>
    ) : (
      <>
        <main ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6" aria-live="polite" aria-relevant="additions">
          {chatHistory.map((message, index) => (
            <div key={message.id} className={`group flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'bot' && <img src={bot.avatar} alt={bot.name} className="w-8 h-8 rounded-full self-start shadow-sm" />}
              <div className={`max-w-md px-4 py-2.5 ${message.role === 'user' ? 'bg-accent-tertiary text-accent-tertiary-foreground rounded-2xl rounded-br-md shadow-sm' : 'prose dark:prose-invert bg-background-secondary text-content-primary border border-border-primary rounded-2xl rounded-bl-md shadow-card'}`}>
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
                  <img src={bot.avatar} alt={bot.name} className="w-8 h-8 rounded-full self-start shadow-sm" />
                  <div className="max-w-md px-4 py-3 bg-background-secondary border border-border-primary rounded-2xl rounded-bl-md shadow-card">
                      <BrandLoader size="sm" />
                  </div>
              </div>
          )}
        </main>
        
        <footer ref={footerRef} className="p-3 border-t border-border-primary bg-background-secondary/50 backdrop-blur-sm">
          {isTestMode ? (
            <div className="text-center py-2 text-content-secondary">
              <p className="text-sm">{t('test_mode_input_disabled')}</p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat_placeholder')}
                disabled={isLoading}
                rows={1}
                className="flex-1 px-4 py-2.5 bg-background-primary text-content-primary border border-border-primary rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary resize-none overflow-y-auto max-h-40 placeholder:text-content-subtle transition-colors"
              />
              <button type="button" onClick={speech.handleVoiceInteraction} disabled={isLoading} className="p-2 text-content-secondary hover:text-content-primary disabled:opacity-40 transition-colors" aria-label={speech.isListening ? t('chat_send_message') : t('chat_voice_mode')}>
                  <MicrophoneIcon className={`w-5 h-5 ${speech.isListening ? 'text-red-500 animate-pulse' : ''}`} />
              </button>
              <button type="submit" disabled={isLoading || !input.trim()} className="p-2.5 bg-accent-primary text-button-foreground-on-accent hover:bg-accent-primary-hover disabled:opacity-40 rounded-xl transition-colors">
                <PaperPlaneIcon className="w-5 h-5" />
              </button>
            </form>
          )}
        </footer>
      </>
    )}
    <VoiceSelectionModal
        isOpen={tts.isVoiceModalOpen}
        onClose={() => tts.setIsVoiceModalOpen(false)}
        voices={relevantVoices}
        currentVoiceURI={tts.selectedVoiceURI}
        currentTtsMode={tts.ttsMode}
        isAutoMode={tts.isAutoMode}
        onSelectVoice={tts.handleSelectVoice}
        onPreviewVoice={tts.handlePreviewVoice}
        onPreviewServerVoice={tts.handlePreviewServerVoice}
        onPreviewNativeVoice={tts.handlePreviewNativeVoice}
        botLanguage={language}
        botGender={botGender}
        isGuest={isGuest}
    />
     <CoachInfoModal
        bot={bot}
        isOpen={isCoachInfoOpen}
        onClose={() => setIsCoachInfoOpen(false)}
        coachingMode={effectiveCoachingMode}
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