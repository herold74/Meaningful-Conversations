import React, { useState, useEffect, useCallback } from 'react';
import {
    AppView, Bot, GamificationState, Message, User, View,
    SessionAnalysis, NavView
} from './types';
import * as userService from './services/userService';
import * as geminiService from './services/geminiService';

import { ALL_ACHIEVEMENT_DEFS } from './achievementDefs';
import { deserializeGamificationState } from './utils/gamificationSerializer';
import { useLocalization } from './context/LocalizationContext';

import WelcomeScreen from './components/WelcomeScreen';
import GamificationBar from './components/GamificationBar';
import BurgerMenu from './components/BurgerMenu';
import AnalyzingView from './components/AnalyzingView';
import AuthView from './components/AuthView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import ForgotPasswordView from './components/ForgotPasswordView';
import LandingPage from './components/LandingPage';
import Questionnaire from './components/Questionnaire';
import PIIWarningView from './components/PIIWarningView';
import ContextChoiceView from './components/ContextChoiceView';
import BotSelection from './components/BotSelection';
import ChatView from './components/ChatView';
import SessionReview from './components/SessionReview';
import AchievementsView from './components/AchievementsView';
import AboutView from './components/AboutView';
import FAQView from './components/FAQView';
import DisclaimerView from './components/DisclaimerView';
import TermsView from './components/TermsView';
import FormattingHelpView from './components/FormattingHelpView';
import UserGuideView from './components/UserGuideView';

// --- Inlined Helper Functions ---

// Gamification logic
const XP_PER_MESSAGE = 5;
const XP_PER_SESSION = 50;
const XP_PER_NEXT_STEP = 10;
const XP_PER_LEVEL = 100;

const getInitialGamificationState = (): GamificationState => ({
    xp: 0,
    level: 1,
    streak: 0,
    unlockedAchievements: new Set(['beta_pioneer']),
    totalSessions: 0,
    lastSessionDate: null,
    coachesUsed: new Set(),
});

const updateGamificationState = (
    currentState: GamificationState,
    action: 'sendMessage' | 'endSession',
    payload: { botId?: string, xpGained?: number }
): GamificationState => {
    const newState = { ...currentState };
    newState.unlockedAchievements = new Set(currentState.unlockedAchievements);
    newState.coachesUsed = new Set(currentState.coachesUsed);

    if (action === 'sendMessage') {
        newState.xp += XP_PER_MESSAGE;
        if (payload.botId) {
            newState.coachesUsed.add(payload.botId);
        }
    }

    if (action === 'endSession') {
        newState.xp += XP_PER_SESSION;
        if (payload.xpGained) {
            newState.xp += payload.xpGained;
        }

        newState.totalSessions += 1;

        const today = new Date().toISOString().split('T')[0];
        if (newState.lastSessionDate) {
            const lastDate = new Date(newState.lastSessionDate);
            const todayDate = new Date(today);
            const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                newState.streak += 1;
            } else if (diffDays > 1) {
                newState.streak = 1; // Reset streak
            }
        } else {
            newState.streak = 1;
        }
        newState.lastSessionDate = today;
    }

    newState.level = Math.floor(newState.xp / XP_PER_LEVEL) + 1;

    ALL_ACHIEVEMENT_DEFS.forEach(ach => {
        if (!newState.unlockedAchievements.has(ach.id) && ach.isUnlocked(newState)) {
            newState.unlockedAchievements.add(ach.id);
        }
    });

    return newState;
};

const awardXpForNextSteps = (nextStepCount: number): number => {
    return nextStepCount * XP_PER_NEXT_STEP;
};

// File parsing logic
const GAMIFICATION_COMMENT_REGEX = /<!--\s*do not delete:\s*(.*?)\s*-->/;

const parseGamificationStateFromFile = (fileContent: string, currentUser: User | null): { gamificationState: GamificationState; cleanContext: string; } => {
    const cleanContext = fileContent.replace(GAMIFICATION_COMMENT_REGEX, '').trim();

    if (currentUser) {
        return { gamificationState: getInitialGamificationState(), cleanContext };
    }

    const match = fileContent.match(GAMIFICATION_COMMENT_REGEX);
    if (match && match[1]) {
        try {
            const decodedData = atob(match[1]);
            return { gamificationState: deserializeGamificationState(decodedData), cleanContext };
        } catch (error) {
            console.error("Failed to decode or parse gamification state from file:", error);
        }
    }
    
    return { gamificationState: getInitialGamificationState(), cleanContext };
};

const App: React.FC = () => {
    const [view, setView] = useState<View>('welcome');
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const savedTheme = window.localStorage.getItem('theme');
            return savedTheme === 'dark' ? 'dark' : 'light';
        }
        return 'light';
    });

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [lifeContext, setLifeContext] = useState<string | null>(null);
    const [gamificationState, setGamificationState] = useState<GamificationState>(getInitialGamificationState());
    const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [sessionAnalysis, setSessionAnalysis] = useState<SessionAnalysis | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [authRedirectReason, setAuthRedirectReason] = useState<string | null>(null);
    const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});

    const { language, t } = useLocalization();

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    useEffect(() => {
        const initializeApp = async () => {
            const user = userService.getCurrentUser();
            if (user) {
                try {
                    const userData = await userService.loadUserData();
                    setCurrentUser(user);
                    setGamificationState(userData.gamificationState);
                    setLifeContext(userData.lifeContext);
                    setView(userData.lifeContext ? 'context-choice' : 'landing');
                } catch (error) {
                    console.error("Failed to load user data, logging out.", error);
                    userService.logout();
                    setView('auth');
                }
            } else {
                 setView('auth');
            }
            setTimeout(() => setIsLoading(false), 2000);
        };

        initializeApp();
    }, []);

    const resetSessionState = useCallback(() => {
        setSelectedBot(null);
        setChatHistory([]);
        setSessionAnalysis(null);
    }, []);

    const handleStartWithContext = (context: string) => {
        const { gamificationState: parsedState, cleanContext } = parseGamificationStateFromFile(context, currentUser);
        if (!currentUser) {
            setGamificationState(parsedState);
        }
        setLifeContext(cleanContext);
        setView('pii-warning');
    };
    
    const handleBotSelection = (bot: Bot) => {
        const welcomeMessage: Message = {
            id: `bot-welcome-${Date.now()}`,
            text: t('chat_welcomeMessage', { botName: bot.name }),
            role: 'bot',
            timestamp: new Date().toISOString(),
        };
        setChatHistory([welcomeMessage]);
        setSelectedBot(bot);
        setView('chat');
    };

    const handleMessageSent = () => {
        setGamificationState(prev => updateGamificationState(prev, 'sendMessage', { botId: selectedBot?.id }));
    };

    const handleEndSession = async () => {
        setIsAnalyzing(true);
        try {
            const analysis = await geminiService.analyzeSession(chatHistory, lifeContext || '', language);
            const xpGained = awardXpForNextSteps(analysis.nextSteps.length);
            setGamificationState(prev => updateGamificationState(prev, 'endSession', { xpGained }));
            setSessionAnalysis(analysis);
            setView('session-review');
        } catch (error) {
            console.error("Session analysis failed:", error);
            setSessionAnalysis({
                newFindings: t('sessionReview_error_analysis'),
                proposedUpdates: [], nextSteps: [], solutionBlockages: [], blockageScore: 0
            });
            setView('session-review');
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleContinueSession = async (newContext: string, { preventSave }: { preventSave: boolean }) => {
        let newGamState = gamificationState;
        if (currentUser && !preventSave && selectedBot) { // Added null check for selectedBot
            try {
                setIsLoading(true);
                const updatedState = await userService.saveUserData(newContext, gamificationState, selectedBot.id);
                newGamState = updatedState;
            } catch (error) {
                 console.error("Failed to save user data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        setLifeContext(newContext);
        setGamificationState(newGamState);
        resetSessionState();
        setView('bot-selection');
    };
    
    const handleReturnToStart = () => {
        setLifeContext(null);
        if (!currentUser) {
            setGamificationState(getInitialGamificationState());
        }
        resetSessionState();
        setView(currentUser ? 'landing' : 'auth');
    };
    
    const handleLoginSuccess = async (user: User) => {
        try {
            setIsLoading(true);
            const userData = await userService.loadUserData();
            setCurrentUser(user);
            setGamificationState(userData.gamificationState);
            setLifeContext(userData.lifeContext);
            setView(userData.lifeContext ? 'context-choice' : 'landing');
        } catch (error) {
            console.error("Failed to load data after login", error);
            userService.logout();
            setView('auth');
            setAuthRedirectReason(t('auth_error_load'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRegisterSuccess = (user: User) => {
        setCurrentUser(user);
        setGamificationState(getInitialGamificationState());
        setLifeContext(null);
        setView('landing');
    };
    
    const handleLogout = () => {
        userService.logout();
        setCurrentUser(null);
        setGamificationState(getInitialGamificationState());
        setLifeContext(null);
        resetSessionState();
        setView('auth');
        setAuthRedirectReason(null);
    };
    
    const handleDeleteAccountSuccess = () => {
        handleLogout();
    };

    const renderNavView = (view: NavView) => {
        const goBack = () => setView(selectedBot ? 'chat' : currentUser ? 'landing' : 'auth');
        switch(view) {
            case 'achievements': return <AchievementsView gamificationState={gamificationState} onBack={goBack} />;
            case 'about': return <AboutView onBack={goBack} />;
            case 'faq': return <FAQView onBack={goBack} />;
            case 'disclaimer': return <DisclaimerView onBack={goBack} />;
            case 'terms': return <TermsView onBack={goBack} />;
            case 'formatting-help': return <FormattingHelpView onBack={goBack} />;
            case 'user-guide': return <UserGuideView onBack={goBack} />;
        }
    }

    const renderContent = () => {
        if (isLoading) return <WelcomeScreen />;
        
        const navViews: NavView[] = ['about', 'achievements', 'disclaimer', 'faq', 'terms', 'formatting-help', 'user-guide'];
        if (navViews.includes(view as NavView)) {
            return renderNavView(view as NavView);
        }

        switch (view) {
            case 'welcome': return <WelcomeScreen />;
            case 'auth': return <AuthView onLogin={() => setView('login')} onRegister={() => setView('register')} onGuest={() => setView('landing')} onBetaLogin={handleLoginSuccess} redirectReason={authRedirectReason} />;
            case 'login': return <LoginView onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setView('register')} onBack={() => setView('auth')} onForgotPassword={() => setView('forgot-password')} />;
            case 'register': return <RegisterView onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => setView('login')} onBack={() => setView('auth')} />;
            case 'forgot-password': return <ForgotPasswordView onBack={() => setView('login')} />;
            case 'landing': return <LandingPage onSubmit={handleStartWithContext} onStartQuestionnaire={() => setView('questionnaire')} />;
            case 'questionnaire': return <Questionnaire onSubmit={handleStartWithContext} onBack={() => setView('landing')} answers={questionnaireAnswers} onAnswersChange={setQuestionnaireAnswers} />;
            case 'pii-warning': return <PIIWarningView onConfirm={() => setView('bot-selection')} onCancel={() => setView('landing')} />;
            case 'context-choice': return <ContextChoiceView user={currentUser!} savedContext={lifeContext!} onContinue={() => setView('bot-selection')} onStartNew={() => { setLifeContext(null); setView('landing'); }} />;
            case 'bot-selection': return <BotSelection onSelect={handleBotSelection} currentUser={currentUser} />;
            case 'chat': return <ChatView bot={selectedBot!} lifeContext={lifeContext || ''} chatHistory={chatHistory} setChatHistory={setChatHistory} onEndSession={handleEndSession} onMessageSent={handleMessageSent} />;
            case 'session-review': return <SessionReview {...sessionAnalysis!} originalContext={lifeContext || ''} selectedBot={selectedBot!} onContinueSession={handleContinueSession} onSwitchCoach={handleContinueSession} onReturnToStart={handleReturnToStart} gamificationState={gamificationState} currentUser={currentUser} />;
            default: return <p>Unknown view</p>;
        }
    };
    
    const showGamificationBar = !isLoading && view !== 'welcome' && !['auth', 'login', 'register', 'forgot-password'].includes(view);
    const isMinimalBar = ['landing', 'questionnaire', 'pii-warning', 'context-choice', 'about', 'achievements', 'disclaimer', 'faq', 'terms', 'formatting-help', 'user-guide'].includes(view);

    return (
        <div className={`font-sans bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300 ${theme}`}>
            {isAnalyzing && <AnalyzingView />}
            {showGamificationBar && <GamificationBar gamificationState={gamificationState} currentUser={currentUser} onViewAchievements={() => setView('achievements')} onToggleMenu={() => setIsMenuOpen(true)} theme={theme} toggleTheme={toggleTheme} minimal={isMinimalBar} />}
            <BurgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} currentUser={currentUser} onLogout={handleLogout} onNavigate={setView} onDeleteAccountSuccess={handleDeleteAccountSuccess} />
            <main className="container mx-auto px-4">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;