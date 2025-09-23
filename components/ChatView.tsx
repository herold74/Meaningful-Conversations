import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { Bot, Message } from '../types';
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

// Add missing type definitions for the Web Speech API to resolve compilation errors.
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


interface ChatViewProps {
  bot: Bot;
  chatSession: Chat;
  chatHistory: Message[];
  setChatHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  onEndSession: () => void;
  onMessageSent: () => void;
}


const ChatView: React.FC<ChatViewProps> = ({ bot, chatSession, chatHistory, setChatHistory, onEndSession, onMessageSent }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [ttsStatus, setTtsStatus] = useState<'idle' | 'speaking' | 'paused'>('idle');
  const lastSpokenTextRef = useRef<string>('');

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

    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    if (englishVoices.length > 0) {
        const preferredVoices = ['Microsoft David - English (United States)', 'Alex', 'Daniel', 'Google UK English Male', 'Google US English'];
        let selectedVoice = preferredVoices.map(name => englishVoices.find(v => v.name === name)).find(v => v) || englishVoices.find(v => v.lang === 'en-US') || englishVoices[0];
        if (selectedVoice) utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [isTtsEnabled, voices]);

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
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                setInput(prev => (prev + ' ' + event.results[i][0].transcript).trim());
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
    };

    recognitionRef.current = recognition;
  }, []);
  
  useEffect(() => {
      if (chatHistory.length === 1 && chatHistory[0].role === 'bot' && voices.length > 0) {
        speak(chatHistory[0].text);
      }
  }, [speak, chatHistory, voices]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    window.speechSynthesis.cancel();
    if (isListening) recognitionRef.current?.stop();
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: input,
      role: 'user',
      timestamp: new Date().toISOString(),
    };
    
    onMessageSent();
    setChatHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await chatSession.sendMessageStream({ message: input });
      let botResponseText = '';
      const botMessageId = `bot-${Date.now()}`;

      setChatHistory(prev => [
        ...prev,
        { id: botMessageId, text: '', role: 'bot', timestamp: new Date().toISOString() },
      ]);

      for await (const chunk of stream) {
        botResponseText += chunk.text;
        setChatHistory(prev =>
          prev.map(msg =>
            msg.id === botMessageId ? { ...msg, text: botResponseText } : msg
          )
        );
      }

      speak(botResponseText);

    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: 'Sorry, I encountered an error. Please try again.',
        role: 'bot',
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      window.speechSynthesis.cancel();
      setTtsStatus('idle');
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

  return (
    <div className="flex flex-col h-[85vh] max-w-3xl mx-auto bg-transparent border border-gray-700">
      <header className="flex items-center p-4 border-b border-gray-700">
        <img src={bot.avatar} alt={bot.name} className="w-12 h-12 rounded-full mr-4" />
        <div>
          <h1 className="text-xl font-bold text-gray-200">{bot.name}</h1>
          <p className="text-sm text-gray-400">{bot.style}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <>
                {ttsStatus === 'speaking' && (
                    <button onClick={handlePauseTTS} className="p-1 text-gray-400 hover:text-white" aria-label="Pause speech"><PauseIcon className="w-6 h-6" /></button>
                )}
                {ttsStatus === 'paused' && (
                    <button onClick={handleResumeTTS} className="p-1 text-gray-400 hover:text-white" aria-label="Resume speech"><PlayIcon className="w-6 h-6" /></button>
                )}
                {ttsStatus === 'idle' && (
                    <button className="p-1 text-gray-700 cursor-not-allowed" aria-label="Play/Pause" disabled><PlayIcon className="w-6 h-6" /></button>
                )}
                <button onClick={handleRepeatTTS} disabled={!lastSpokenTextRef.current || ttsStatus !== 'idle'} className="p-1 text-gray-400 hover:text-white disabled:text-gray-700" aria-label="Repeat last message"><RepeatIcon className="w-6 h-6" /></button>
                <button onClick={() => setIsTtsEnabled(p => !p)} className="p-1 text-gray-400 hover:text-white" aria-label={isTtsEnabled ? "Disable voice output" : "Enable voice output"}>
                    {isTtsEnabled ? <SpeakerOnIcon className="w-6 h-6" /> : <SpeakerOffIcon className="w-6 h-6" />}
                </button>
            </>
            <button 
              onClick={onEndSession}
              className="px-4 py-2 text-sm font-bold text-green-400 bg-transparent border border-green-400 uppercase hover:bg-green-400 hover:text-black"
            >
              End Session
            </button>
        </div>
      </header>
      
      <main ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6">
        {chatHistory.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'bot' && <img src={bot.avatar} alt={bot.name} className="w-8 h-8 rounded-full self-start" />}
            <div className={`prose prose-invert max-w-md p-3 ${message.role === 'user' ? 'bg-green-600 text-white rounded-l-lg rounded-br-lg' : 'bg-gray-800 text-gray-300 rounded-r-lg rounded-bl-lg'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex gap-3 justify-start">
                <img src={bot.avatar} alt={bot.name} className="w-8 h-8 rounded-full self-start" />
                <div className="max-w-md p-3 bg-gray-800 text-gray-300 rounded-r-lg rounded-bl-lg">
                    <Spinner />
                </div>
            </div>
        )}
      </main>
      
      <footer className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 p-3 bg-gray-800 text-gray-200 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-400"
          />
          <button type="button" onClick={handleMicClick} disabled={isLoading} className="p-2 text-gray-400 hover:text-white disabled:text-gray-700" aria-label={isListening ? "Stop listening" : "Start listening"}>
              <MicrophoneIcon className={`w-6 h-6 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
          </button>
          <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-green-500 text-black hover:bg-green-600 disabled:bg-gray-700">
            <PaperPlaneIcon className="w-6 h-6" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatView;