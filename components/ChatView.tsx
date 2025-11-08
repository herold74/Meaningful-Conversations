import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bot, Message, Language, User } from '../types';
import * as geminiService from '../services/geminiService';
import * as userService from '../services/userService';
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

// For SpeechRecognition API
interface CustomWindow extends Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof webkitSpeechRecognition;
}
declare let window: CustomWindow;

interface CoachInfoModalProps {
  bot: Bot;
  isOpen: boolean;
  onClose: () => void;
}

const CoachInfoModal: React.FC<CoachInfoModalProps> = ({ bot, isOpen, onClose }) => {
    const { language } = useLocalization();
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
}


const ChatView: React.FC<ChatViewProps> = ({ bot, lifeContext, chatHistory, setChatHistory, onEndSession, onMessageSent, currentUser, isNewSession }) => {
  const { t, language } = useLocalization();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const baseTranscriptRef = useRef<string>('');
  const initialFetchInitiated = useRef<boolean>(false);

  const [isListening, setIsListening] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false); // Default to off
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [ttsStatus, setTtsStatus] = useState<'idle' | 'speaking' | 'paused'>('idle');
  const lastSpokenTextRef = useRef<string>('');
  
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(() => {
    if (typeof localStorage === 'undefined') return null;
    try {
        const prefsString = localStorage.getItem('coachVoicePreferences');
        if (prefsString) {
            const prefs = JSON.parse(prefsString);
            return prefs[bot.id] ?? null; // Use nullish coalescing for safety
        }
    } catch (e) {
        console.error("Failed to parse coach voice preferences:", e);
    }
    return null; // Default to 'Automatic'
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


  const botGender = useMemo((): 'male' | 'female' => {
      switch (bot.id) {
          case 'g-interviewer':
          case 'ava-strategic':
          case 'chloe-cbt':
              return 'female';
          case 'max-ambitious':
          case 'rob-pq':
          case 'kenji-stoic':
          case 'nexus-gps':
          default:
              return 'male';
      }
  }, [bot.id]);

  // Initialize gong audio with fallback to programmatic sound
  useEffect(() => {
    const audio = new Audio('/sounds/meditation-gong.mp3');
    audio.addEventListener('error', () => {
      console.log('Gong audio file not found, will use programmatic fallback');
    });
    gongAudioRef.current = audio;
  }, []);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
        const prefsString = localStorage.getItem('coachVoicePreferences');
        const prefs = prefsString ? JSON.parse(prefsString) : {};

        if (selectedVoiceURI === null) {
            // User selected 'Automatic', remove the specific preference
            delete prefs[bot.id];
        } else {
            // Save the selected URI for this specific bot
            prefs[bot.id] = selectedVoiceURI;
        }

        if (Object.keys(prefs).length === 0) {
            // If no preferences are left, clean up localStorage
            localStorage.removeItem('coachVoicePreferences');
        } else {
            localStorage.setItem('coachVoicePreferences', JSON.stringify(prefs));
        }
    } catch (e) {
        console.error("Failed to save coach voice preference:", e);
    }
  }, [selectedVoiceURI, bot.id]);


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

  useEffect(() => {
    if (!window.speechSynthesis) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices(); // Initial attempt to load voices

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!isTtsEnabled || !text.trim() || !window.speechSynthesis) return;
    
    const cleanText = text
        .replace(/#{1,6}\s/g, '') // Headers
        .replace(/(\*\*|__|\*|_|~~|`|```)/g, '') // Emphasis, code
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
        .replace(/!\[[^\]]*\]\([^\)]*\)/g, '') // Images
        .replace(/^-{3,}|^\*{3,}|^_{3,}/gm, '') // Horizontal rules
        .replace(/^>\s?/gm, '');

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    lastSpokenTextRef.current = cleanText;

    utterance.onstart = () => setTtsStatus('speaking');
    utterance.onend = () => setTtsStatus('idle');
    utterance.onerror = () => setTtsStatus('idle');
    
    let finalVoice: SpeechSynthesisVoice | null = null;
    
    if (selectedVoiceURI) {
        finalVoice = voices.find(v => v.voiceURI === selectedVoiceURI) || null;
    }

    if (!finalVoice) {
        let gender: 'male' | 'female' = 'female';
        
        if (language === 'de') {
            gender = botGender;
        } else { // 'en'
            switch (bot.id) {
                case 'g-interviewer':
                case 'ava-strategic':
                case 'chloe-cbt':
                    gender = 'female';
                    break;
                case 'max-ambitious':
                case 'rob-pq':
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

    if (finalVoice) {
        utterance.voice = finalVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [isTtsEnabled, voices, bot.id, selectedVoiceURI, language, botGender]);

  const handlePreviewVoice = useCallback((voice: SpeechSynthesisVoice) => {
    if (!voice || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const sampleText = t('voiceModal_preview_text');
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.voice = voice;
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [t]);
  
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
        // If TTS is currently enabled, we are turning it off.
        // We should stop any speech that is currently in progress.
        if (isTtsEnabled) {
            window.speechSynthesis.cancel();
            setTtsStatus('idle'); // The onend event won't fire, so manually reset.
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
    recognition.lang = language === 'de' ? 'de-DE' : 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      // The 'aborted' error is common and not always a problem (e.g., stopping before speech is detected).
      // We'll log it as a warning to reduce console noise for non-critical events.
      if (event.error === 'aborted') {
        console.warn('Speech recognition was aborted. This can happen if recognition is stopped before speech is detected, or due to a network issue.');
      } else {
        console.error("Speech recognition error:", event.error, event);
      }
      setIsListening(false);
    };
    
    recognition.onresult = (event) => {
      let interim_transcript = '';
      let final_transcript = '';
      
      // The event.results list is cumulative. We can build the full transcript from scratch on each event.
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }
      
      // Combine the initial text (if any) with the new final and interim parts.
      setInput(baseTranscriptRef.current + final_transcript + interim_transcript);
    };

    recognitionRef.current = recognition;
  }, [language]);
  
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
            const response = await geminiService.sendMessage(bot.id, lifeContext, [], language, isNewSession);
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

  useEffect(() => {
      if (chatHistory.length === 1 && chatHistory[0].role === 'bot' && voices.length > 0) {
        speak(chatHistory[0].text);
      }
  }, [speak, chatHistory, voices]);
  
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

    window.speechSynthesis.cancel();
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
        const response = await geminiService.sendMessage(bot.id, lifeContext, historyWithUserMessage, language, false);
        
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
          // Speak only the intro text
          speak(meditationData.introText);
          
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
          recognitionRef.current.stop();
          setTimeout(async () => {
              if (input.trim()) {
                  await sendMessage(input);
                  setInput('');
              }
          }, 300);
      } else {
          window.speechSynthesis.cancel();
          setTtsStatus('idle');
          baseTranscriptRef.current = input.trim() ? input.trim() + ' ' : '';
          recognitionRef.current.start();
      }
  };


  const handlePauseTTS = () => {
    window.speechSynthesis.pause();
    setTtsStatus('paused');
  };

  const handleResumeTTS = () => {
    window.speechSynthesis.resume();
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
        console.log('MP3 gong failed, using Web Audio API fallback');
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
                <div className="min-w-0">
                    <h1 className="text-lg md:text-xl font-bold text-content-primary truncate">{bot.name}</h1>
                </div>
            </button>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center justify-end gap-x-1 sm:gap-x-2 md:gap-x-4 max-w-[50%] sm:max-w-none">
            <button 
                onClick={() => {
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
                            {ttsStatus === 'idle' && (
                                <button onClick={handleRepeatTTS} disabled={!lastSpokenTextRef.current} className="p-1 text-content-secondary hover:text-content-primary disabled:text-gray-300 dark:disabled:text-gray-700" aria-label={t('chat_repeat_tts')}>
                                    <RepeatIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            )}
                            {ttsStatus === 'speaking' && <button onClick={handlePauseTTS} className="p-1 text-content-secondary hover:text-content-primary" aria-label={t('chat_pause_tts')}><PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" /></button>}
                            {ttsStatus === 'paused' && <button onClick={handleResumeTTS} className="p-1 text-content-secondary hover:text-content-primary" aria-label={t('chat_resume_tts')}><PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" /></button>}
                        </>
                    )}
                    <button onClick={handleToggleTts} className="p-1 text-content-secondary hover:text-content-primary" aria-label={isTtsEnabled ? t('chat_disable_tts') : t('chat_enable_tts')}>
                        {isTtsEnabled ? <SpeakerOnIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <SpeakerOffIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>
                    {isTtsEnabled && (
                        <button
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
                onClick={onEndSession}
                className="hidden md:flex items-center px-4 py-2 text-sm font-bold text-red-600 dark:text-accent-primary bg-transparent border border-red-600 dark:border-accent-primary uppercase hover:bg-red-600 dark:hover:bg-accent-primary hover:text-white dark:hover:text-black rounded-lg shadow-md"
            >
                {t('chat_end_session')}
            </button>
            <button
                onClick={onEndSession}
                className="md:hidden p-2 text-red-600 dark:text-accent-primary rounded-full hover:bg-red-50 dark:hover:bg-accent-primary/10"
                aria-label={t('chat_end_session')}
            >
                <LogOutIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </div>
      </header>
      
    {isVoiceMode ? (
        <main className="flex-1 flex flex-col justify-between items-center p-6 text-center bg-background-primary dark:bg-background-primary/50 overflow-y-auto">
            <div className="animate-fadeIn">
                <img src={bot.avatar} alt={bot.name} className="w-32 h-32 rounded-full mx-auto mb-4 shadow-lg border-4 border-background-secondary dark:border-border-primary" />
                <h1 className="text-3xl font-bold text-content-primary">{bot.name}</h1>
            </div>

            <div className="flex flex-col items-center justify-center my-8 w-full">
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

            <div className="flex items-center justify-center gap-6">
                <button onClick={ttsStatus === 'speaking' ? handlePauseTTS : handleResumeTTS} disabled={ttsStatus === 'idle'} className="p-4 rounded-full bg-background-secondary dark:bg-background-tertiary disabled:opacity-50 hover:bg-background-tertiary dark:hover:bg-border-primary shadow" aria-label={ttsStatus === 'speaking' ? 'Pause Speech' : 'Resume Speech'}>
                    {ttsStatus === 'speaking' ? <PauseIcon className="w-8 h-8 text-content-primary"/> : <PlayIcon className="w-8 h-8 text-content-primary"/>}
                </button>
                <button onClick={handleRepeatTTS} disabled={!lastSpokenTextRef.current || ttsStatus !== 'idle'} className="p-4 rounded-full bg-background-secondary dark:bg-background-tertiary disabled:opacity-50 hover:bg-background-tertiary dark:hover:bg-border-primary shadow" aria-label={'Repeat'}>
                    <RepeatIcon className="w-8 h-8 text-content-primary"/>
                </button>
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
        </footer>
      </>
    )}
    <VoiceSelectionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        voices={relevantVoices}
        currentVoiceURI={selectedVoiceURI}
        onSelectVoice={setSelectedVoiceURI}
        onPreviewVoice={handlePreviewVoice}
        botLanguage={language}
        botGender={botGender}
    />
     <CoachInfoModal
        bot={bot}
        isOpen={isCoachInfoOpen}
        onClose={() => setIsCoachInfoOpen(false)}
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