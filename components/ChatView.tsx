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
        className="bg-white dark:bg-gray-900 w-full max-w-md m-4 p-6 border border-gray-300 dark:border-gray-700 shadow-xl text-center animate-fadeIn rounded-lg" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end -mt-2 -mr-2">
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" aria-label="Close">
                <XIcon className="w-6 h-6" />
            </button>
        </div>
        <img src={bot.avatar} alt={bot.name} className="w-24 h-24 rounded-full mx-auto -mt-6 mb-4 border-4 border-white dark:border-gray-900" />
        <h2 id="coach-info-title" className="text-2xl font-bold text-gray-900 dark:text-gray-200">{bot.name}</h2>
        <div className="flex flex-wrap justify-center gap-2 my-3">
          {botStyle.split(', ').map(tag => (
            <span key={tag} className="px-2.5 py-1 text-xs font-bold tracking-wide uppercase bg-gray-100 text-gray-700 rounded-full dark:bg-gray-800 dark:text-gray-300">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">{botDescription}</p>
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
}


const ChatView: React.FC<ChatViewProps> = ({ bot, lifeContext, chatHistory, setChatHistory, onEndSession, onMessageSent, currentUser }) => {
  const { t, language } = useLocalization();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const baseTranscriptRef = useRef<string>('');

  const [isListening, setIsListening] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false); // Default to off
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [ttsStatus, setTtsStatus] = useState<'idle' | 'speaking' | 'paused'>('idle');
  const lastSpokenTextRef = useRef<string>('');
  
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(() => {
    const savedURI = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedVoiceURI') : null;
    return savedURI || null;
  });
  const [isCoachInfoOpen, setIsCoachInfoOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackMessages, setFeedbackMessages] = useState<{ user: Message | null; bot: Message | null }>({ user: null, bot: null });


  const botGender = useMemo((): 'male' | 'female' => {
      switch (bot.id) {
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

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
        if (selectedVoiceURI === null) {
             localStorage.removeItem('selectedVoiceURI');
        } else {
            localStorage.setItem('selectedVoiceURI', selectedVoiceURI);
        }
    }
  }, [selectedVoiceURI]);


  useEffect(() => {
    if (!window.speechSynthesis) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

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
      if (chatHistory.length === 1 && chatHistory[0].role === 'bot' && voices.length > 0) {
        speak(chatHistory[0].text);
      }
  }, [speak, chatHistory, voices]);
  
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
        const response = await geminiService.sendMessage(bot.id, lifeContext, historyWithUserMessage, language);
        
        const botMessage: Message = {
            id: `bot-${Date.now()}`,
            text: response.text,
            role: 'bot',
            timestamp: new Date().toISOString(),
        };
        setChatHistory(prev => [...prev, botMessage]);
        speak(botMessage.text);

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
    <div className="flex flex-col h-[85vh] max-w-3xl mx-auto bg-white dark:bg-transparent border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 gap-2">
        {/* Left: Coach Info (responsive) */}
        <div className="flex-1 min-w-0">
             <button 
                onClick={() => setIsCoachInfoOpen(true)} 
                className="flex items-center text-left focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 focus:ring-green-500 rounded-lg p-1 -ml-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50"
                aria-label={`${t('chat_viewInfo')} for ${bot.name}`}
            >
                <img src={bot.avatar} alt={bot.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full mr-3 shrink-0" />
                <div className="min-w-0">
                    <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-200 truncate">{bot.name}</h1>
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
                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" 
                aria-label={isVoiceMode ? 'Switch to Text Mode' : 'Switch to Voice Mode'}
            >
                {isVoiceMode ? <ChatBubbleIcon className="w-5 h-5 sm:w-6 sm:h-6"/> : <SoundWaveIcon className="w-5 h-5 sm:w-6 sm:h-6"/>}
            </button>

            {!isVoiceMode && (
                <div className="flex items-center justify-end gap-2 border-l border-gray-200 dark:border-gray-700 pl-2 sm:pl-2 md:pl-4">
                    {isTtsEnabled && (
                        <>
                            {ttsStatus === 'speaking' && (
                                <button onClick={handlePauseTTS} className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" aria-label={'Pause Speech'}><PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                            )}
                            {ttsStatus === 'paused' && (
                                <button onClick={handleResumeTTS} className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" aria-label={'Resume Speech'}><PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                            )}
                            {ttsStatus === 'idle' && (
                                <button className="p-1 text-gray-300 dark:text-gray-700 cursor-not-allowed" aria-label={'Play/Pause'} disabled><PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                            )}
                            <button onClick={handleRepeatTTS} disabled={!lastSpokenTextRef.current || ttsStatus !== 'idle'} className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:text-gray-300 dark:disabled:text-gray-700" aria-label={'Repeat'}><RepeatIcon className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                        </>
                    )}
                    <button onClick={() => setIsTtsEnabled(p => !p)} className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" aria-label={isTtsEnabled ? 'Disable Voice' : 'Enable Voice'}>
                        {isTtsEnabled ? <SpeakerOnIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <SpeakerOffIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>
                    {isTtsEnabled && relevantVoices.length > 0 && (
                        <button
                            onClick={() => setIsVoiceModalOpen(true)}
                            className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            aria-label={t('chat_voice_settings')}
                        >
                            <GearIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    )}
                </div>
            )}

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

            {/* End Session Button/Icon */}
            <button
                onClick={onEndSession}
                className="hidden md:flex items-center px-4 py-2 text-sm font-bold text-red-600 dark:text-green-400 bg-transparent border border-red-600 dark:border-green-400 uppercase hover:bg-red-600 dark:hover:bg-green-400 hover:text-white dark:hover:text-black"
            >
                {t('chat_end_session')}
            </button>
            <button
                onClick={onEndSession}
                className="md:hidden p-2 text-red-600 dark:text-green-400 rounded-full hover:bg-red-50 dark:hover:bg-green-400/10"
                aria-label={t('chat_end_session')}
            >
                <LogOutIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </div>
      </header>
      
    {isVoiceMode ? (
        <main className="flex-1 flex flex-col justify-around items-center p-6 text-center bg-gray-50 dark:bg-gray-900/50">
            <div className="animate-fadeIn">
                <img src={bot.avatar} alt={bot.name} className="w-32 h-32 rounded-full mx-auto mb-4 shadow-lg border-4 border-white dark:border-gray-700" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200">{bot.name}</h1>
            </div>

            <div className="flex flex-col items-center justify-center my-8 w-full">
                <button
                    onClick={handleVoiceInteraction}
                    disabled={isLoading}
                    className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-xl focus:outline-none focus:ring-4 ${
                        isListening ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300 animate-pulse' : 'bg-green-500 hover:bg-green-600 focus:ring-green-300'
                    } ${isLoading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                    aria-label={isListening ? 'Stop and send' : 'Start recording'}
                >
                    {isLoading ? <Spinner /> : isListening ? <PaperPlaneIcon className="w-12 h-12 text-white" /> : <MicrophoneIcon className="w-12 h-12 text-white" />}
                </button>
                <div className="mt-4 h-14 text-lg text-gray-600 dark:text-gray-400 flex items-center justify-center px-4 w-full max-w-md">
                    <p>{input || (isListening ? 'Listening...' : t('chat_tapToSpeak'))}</p>
                </div>
            </div>

            <div className="flex items-center justify-center gap-6">
                <button onClick={ttsStatus === 'speaking' ? handlePauseTTS : handleResumeTTS} disabled={ttsStatus === 'idle'} className="p-4 rounded-full bg-white dark:bg-gray-800 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 shadow" aria-label={ttsStatus === 'speaking' ? 'Pause Speech' : 'Resume Speech'}>
                    {ttsStatus === 'speaking' ? <PauseIcon className="w-8 h-8 text-gray-700 dark:text-gray-200"/> : <PlayIcon className="w-8 h-8 text-gray-700 dark:text-gray-200"/>}
                </button>
                <button onClick={handleRepeatTTS} disabled={!lastSpokenTextRef.current || ttsStatus !== 'idle'} className="p-4 rounded-full bg-white dark:bg-gray-800 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 shadow" aria-label={'Repeat'}>
                    <RepeatIcon className="w-8 h-8 text-gray-700 dark:text-gray-200"/>
                </button>
            </div>
        </main>
    ) : (
      <>
        <main ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6">
          {chatHistory.map((message, index) => (
            <div key={message.id} className={`group flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'bot' && <img src={bot.avatar} alt={bot.name} className="w-8 h-8 rounded-full self-start" />}
              <div className={`max-w-md p-3 ${message.role === 'user' ? 'bg-green-600 text-white rounded-l-lg rounded-br-lg' : 'prose dark:prose-invert bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 rounded-r-lg rounded-bl-lg'}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
              </div>
               {message.role === 'bot' && index > 0 && !isLoading && (
                    <button
                        onClick={() => handleOpenFeedbackModal(message)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 self-center"
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
                  <div className="max-w-md p-3 bg-gray-100 dark:bg-gray-800 rounded-r-lg rounded-bl-lg">
                      <Spinner />
                  </div>
              </div>
          )}
        </main>
        
        <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat_placeholder')}
              disabled={isLoading}
              className="flex-1 p-3 bg-gray-100 text-gray-800 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:focus:ring-green-400"
            />
            <button type="button" onClick={handleVoiceInteraction} disabled={isLoading} className="p-2 text-gray-500 hover:text-gray-900 disabled:text-gray-300 dark:text-gray-400 dark:hover:text-white dark:disabled:text-gray-700" aria-label={isListening ? 'Stop and send' : 'Start recording'}>
                <MicrophoneIcon className={`w-6 h-6 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
            </button>
            <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700">
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