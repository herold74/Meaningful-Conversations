import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bot, Message, User, GamificationState, SessionAnalysis, NavView } from './types';
import { useLocalization } from './context/LocalizationContext';
import * as api from './services/api';
import * as userService from './services/userService';
import * as geminiService from './services/geminiService';
import { deserializeGamificationState, serializeGamificationState } from './utils/gamificationSerializer';
import { getAchievements } from './achievements';
import { simpleCipher } from './utils/simpleGuestCipher';
import { decryptData } from './utils/encryption';


// Component Imports
import WelcomeScreen from './components/WelcomeScreen';
import GamificationBar from './components/GamificationBar';
import BurgerMenu from './components/BurgerMenu';
import LandingPage from './components/LandingPage';
import BotSelection from './components/BotSelection';
import ChatView from './components/ChatView';
import SessionReview from './components/SessionReview';
import AnalyzingView from './components/AnalyzingView';
import PIIWarningView from './components/PIIWarningView';
import Questionnaire from './components/Questionnaire';
import AchievementsView from './components/AchievementsView';
import UserGuideView from './components/UserGuideView';
import FormattingHelpView from './components/FormattingHelpView';
import FAQView from './components/FAQView';
import AboutView from './components/AboutView';
import DisclaimerView from './components/DisclaimerView';
import TermsView from './components/TermsView';
import AuthView from './components/AuthView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import ContextChoiceView from './components/ContextChoiceView';
import ForgotPasswordView from './components/ForgotPasswordView';
import RedeemCodeView from './components/RedeemCodeView';
import AdminView from './components/AdminView';
import ChangePasswordView from './components/ChangePasswordView';
import DeleteAccountModal from './components/DeleteAccountModal';

const DEFAULT_GAMIFICATION_STATE: GamificationState = {
    xp: 0,
    level: 1,
    streak: 0,
    totalSessions: 0,
    lastSessionDate: null,
    unlockedAchievements: new Set<string>(),
    coachesUsed: new Set<string>(),
};

const App: React.FC = () => {
    const { t } = useLocalization();
    const [view, setView] = useState<NavView>('welcome');
    const [menuView, setMenuView] = useState<NavView | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [authRedirectReason, setAuthRedirectReason] = useState<string | null>(null);

    // Core App State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
    const [lifeContext, setLifeContext] = useState<string>('');
    const [gamificationState, setGamificationState] = useState<GamificationState>(DEFAULT_GAMIFICATION_STATE);
    const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [sessionAnalysis, setSessionAnalysis] = useState<SessionAnalysis | null>(null);
    const [newGamificationState, setNewGamificationState] = useState<GamificationState | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Transient state for multi-step flows
    const [tempContext, setTempContext] = useState<string>('');
    const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userMessageCount, setUserMessageCount] = useState(0);

    // Theme
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
        }
        return 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    
    const calculateNewGamificationState = useCallback((
        currentState: GamificationState,
        analysis: SessionAnalysis | null,
        botId: string,
        awardSessionBonus: boolean
    ): GamificationState => {
        let xpGained = (userMessageCount * 5) + ((analysis?.nextSteps?.length || 0) * 10);
        if (awardSessionBonus) {
            xpGained += 50;
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastSession = currentState.lastSessionDate ? new Date(currentState.lastSessionDate) : null;
        let newStreak = currentState.streak;

        if (userMessageCount >= 5) {
            if (lastSession) {
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                const lastSessionDay = lastSession.toISOString().split('T')[0];
                const yesterdayDay = yesterday.toISOString().split('T')[0];
    
                if (lastSessionDay === yesterdayDay) {
                    newStreak += 1; // It was yesterday, streak continues
                } else if (lastSessionDay !== today) {
                    newStreak = 1; // It wasn't yesterday or today, reset
                }
            } else {
                newStreak = 1; // First session
            }
        }
        
        const newCoachesUsed = new Set(currentState.coachesUsed);
        if(userMessageCount >= 5) {
            newCoachesUsed.add(botId);
        }
        
        const newXp = currentState.xp + xpGained;
        const newUnlockedAchievements = new Set(currentState.unlockedAchievements);

        // Progressive XP calculation
        const calculateLevelFromXp = (xp: number) => {
            let level = 1;
            let requiredForNext = 100;
            let totalForLevel = 0;
            while (xp >= totalForLevel + requiredForNext) {
                totalForLevel += requiredForNext;
                level++;
                requiredForNext = level * 100;
            }
            return level;
        };
        const newLevel = calculateLevelFromXp(newXp);
        
        const newState: GamificationState = {
            ...currentState,
            xp: newXp,
            level: newLevel,
            streak: newStreak,
            totalSessions: currentState.totalSessions + (userMessageCount >= 5 ? 1 : 0),
            lastSessionDate: userMessageCount >= 5 ? today : currentState.lastSessionDate,
            coachesUsed: newCoachesUsed,
            unlockedAchievements: newUnlockedAchievements
        };

        const achievements = getAchievements(t);
        achievements.forEach(ach => {
            if (!newState.unlockedAchievements.has(ach.id) && ach.isUnlocked(newState)) {
                newState.unlockedAchievements.add(ach.id);
            }
        });

        return newState;

    }, [userMessageCount, t]);


    // --- INITIALIZATION ---
    useEffect(() => {
        // This effect handles app startup.
        const initialize = async () => {
            const session = api.getSession();
            if (session) {
                // If a session exists, we don't have the encryption key.
                // Go directly to the login screen with an explanation.
                setAuthRedirectReason("Welcome back! For your security, please enter your password to continue.");
                setView('login');
            } else {
                // No session, start at the auth screen.
                setAuthRedirectReason(null);
                setView('auth');
            }
        };
        const timer = setTimeout(() => initialize(), 1500);
        return () => clearTimeout(timer);
    }, []);
    
    // --- NAVIGATION & STATE HANDLERS ---
    
    const handleLoginSuccess = async (user: User, key: CryptoKey) => {
        setCurrentUser(user);
        setEncryptionKey(key);
        try {
            const data = await userService.loadUserData(key);
            setLifeContext(data.context || ''); // Already decrypted by userService
            setGamificationState(deserializeGamificationState(data.gamificationState));
            setView(data.context ? 'contextChoice' : 'landing');
        } catch (error) {
            console.error("Failed to load user data after login, logging out.", error);
            api.clearSession();
            setCurrentUser(null);
            setEncryptionKey(null);
            setView('auth');
            setAuthRedirectReason("There was an issue loading your profile. Please try logging in again.");
        }
    };
    
    const handleLogout = () => {
        api.clearSession();
        setCurrentUser(null);
        setEncryptionKey(null);
        setLifeContext('');
        setGamificationState(DEFAULT_GAMIFICATION_STATE);
        setAuthRedirectReason(null);
        // Go to welcome screen first, then to auth screen to mimic app start
        setView('welcome');
        setTimeout(() => setView('auth'), 1500);
    };

    const handleFileUpload = (context: string) => {
        const dataRegex = /<!-- do not delete: (.*?) -->/;
        const match = context.match(dataRegex);
        if (match && match[1]) {
            let decodedData = '';
            const payload = match[1];
            try {
                // First, attempt to decode as Base64 (for files saved with the `btoa` version)
                decodedData = atob(payload);
            } catch (e) {
                // If atob fails, it's likely not Base64. Assume it's the simple cipher text.
                decodedData = simpleCipher(payload);
            }
            setGamificationState(deserializeGamificationState(decodedData));
        } else {
            setGamificationState(DEFAULT_GAMIFICATION_STATE);
        }
        setLifeContext(context);
        setView('botSelection');
    };

    const handleQuestionnaireSubmit = (context: string) => {
        setGamificationState(DEFAULT_GAMIFICATION_STATE);
        setTempContext(context);
        setView('piiWarning');
    };

    const handlePiiConfirm = () => {
        setLifeContext(tempContext);
        setTempContext('');
        setView('botSelection');
    };
    
    const handleSelectBot = (bot: Bot) => {
        setSelectedBot(bot);
        setUserMessageCount(0);
        const welcomeMessage: Message = {
            id: `bot-${Date.now()}`,
            role: 'bot',
            text: t('chat_welcome', { botName: bot.name }),
            timestamp: new Date().toISOString(),
        };
        setChatHistory([welcomeMessage]);
        setView('chat');
    };
    
    const handleEndSession = async () => {
        if (!selectedBot) return;
        setIsAnalyzing(true);
        try {
            const analysis = await geminiService.analyzeSession(chatHistory, lifeContext, 'en');
            setSessionAnalysis(analysis);

            const awardSessionBonus = (analysis.nextSteps?.length || 0) > 0 && analysis.hasConversationalEnd;
            const newState = calculateNewGamificationState(gamificationState, analysis, selectedBot.id, awardSessionBonus);
            setNewGamificationState(newState);

            setView('sessionReview');
        } catch (error) {
            console.error("Failed to analyze session:", error);
            const fallbackAnalysis: SessionAnalysis = {
                newFindings: "There was an error analyzing the session.",
                proposedUpdates: [],
                nextSteps: [],
                solutionBlockages: [],
                blockageScore: 0,
                hasConversationalEnd: false,
            };
            setSessionAnalysis(fallbackAnalysis);
            const newState = calculateNewGamificationState(gamificationState, fallbackAnalysis, selectedBot.id, false);
            setNewGamificationState(newState);
            setView('sessionReview');
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const saveData = async (newContext: string, stateToSave: GamificationState, preventSave: boolean) => {
        setLifeContext(newContext);
        setGamificationState(stateToSave);
        if (currentUser && encryptionKey && !preventSave) {
            try {
                await userService.saveUserData(newContext, serializeGamificationState(stateToSave), encryptionKey);
            } catch (error) {
                console.error("Failed to save user data:", error);
            }
        }
    };

    const handleContinueSession = (newContext: string, options: { preventSave: boolean }) => {
        saveData(newContext, newGamificationState || gamificationState, options.preventSave);
        if (selectedBot) {
            setView('chat');
        } else {
            setView('botSelection');
        }
    };

    const handleSwitchCoach = (newContext: string, options: { preventSave: boolean }) => {
        saveData(newContext, newGamificationState || gamificationState, options.preventSave);
        setSelectedBot(null);
        setChatHistory([]);
        setView('botSelection');
    };
    
    const resetToStart = () => {
        setSelectedBot(null);
        setChatHistory([]);
        setSessionAnalysis(null);
        setNewGamificationState(null);
        setLifeContext('');
        setGamificationState(DEFAULT_GAMIFICATION_STATE);
        setView(currentUser ? 'landing' : 'auth');
    };

    // --- RENDER LOGIC ---
    
    const renderView = () => {
        const currentView = menuView || view;

        switch (currentView) {
            case 'welcome': return <WelcomeScreen />;
            case 'auth': return <AuthView onLogin={() => setView('login')} onRegister={() => setView('register')} onGuest={() => setView('landing')} redirectReason={authRedirectReason}/>;
            case 'login': return <LoginView onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => { setAuthRedirectReason(null); setView('register'); }} onBack={() => { setAuthRedirectReason(null); setView('auth'); }} onForgotPassword={() => { setAuthRedirectReason(null); setView('forgotPassword'); }} reason={authRedirectReason} />;
            case 'register': return <RegisterView onRegisterSuccess={handleLoginSuccess} onSwitchToLogin={() => setView('login')} onBack={() => setView('auth')} />;
            case 'forgotPassword': return <ForgotPasswordView onBack={() => setView('login')} />;
            case 'contextChoice': return <ContextChoiceView user={currentUser!} savedContext={lifeContext} onContinue={() => setView('botSelection')} onStartNew={() => { setLifeContext(''); setView('landing'); }} />;
            case 'landing': return <LandingPage onSubmit={handleFileUpload} onStartQuestionnaire={() => setView('questionnaire')} />;
            case 'piiWarning': return <PIIWarningView onConfirm={handlePiiConfirm} onCancel={() => setView('questionnaire')} />;
            case 'questionnaire': return <Questionnaire onSubmit={handleQuestionnaireSubmit} onBack={() => setView('landing')} answers={questionnaireAnswers} onAnswersChange={setQuestionnaireAnswers} />;
            case 'botSelection': return <BotSelection onSelect={handleSelectBot} currentUser={currentUser} />;
            case 'chat': return <ChatView bot={selectedBot!} lifeContext={lifeContext} chatHistory={chatHistory} setChatHistory={setChatHistory} onEndSession={handleEndSession} onMessageSent={() => setUserMessageCount(c => c + 1)} />;
            case 'sessionReview': return <SessionReview {...sessionAnalysis!} originalContext={lifeContext} selectedBot={selectedBot!} onContinueSession={handleContinueSession} onSwitchCoach={handleSwitchCoach} onReturnToStart={resetToStart} gamificationState={newGamificationState || gamificationState} currentUser={currentUser} />;
            case 'achievements': return <AchievementsView gamificationState={gamificationState} onBack={() => setMenuView(null)} />;
            case 'userGuide': return <UserGuideView onBack={() => setMenuView(null)} />;
            case 'formattingHelp': return <FormattingHelpView onBack={() => setMenuView(null)} />;
            case 'faq': return <FAQView onBack={() => setMenuView(null)} />;
            case 'about': return <AboutView onBack={() => setMenuView(null)} />;
            case 'disclaimer': return <DisclaimerView onBack={() => setMenuView(null)} currentUser={currentUser} onDeleteAccount={() => setIsDeleteModalOpen(true)} />;
            case 'terms': return <TermsView onBack={() => setMenuView(null)} />;
            case 'redeemCode': return <RedeemCodeView onBack={() => setMenuView(null)} onRedeemSuccess={(user) => { setCurrentUser(user); setMenuView(null); }} />;
            case 'admin': return <AdminView onBack={() => setMenuView(null)} />;
            case 'changePassword': return <ChangePasswordView onBack={() => setMenuView(null)} currentUser={currentUser!} encryptionKey={encryptionKey!} lifeContext={lifeContext} />;
            default: return <WelcomeScreen />;
        }
    };
    
    const showGamificationBar = !['welcome', 'auth', 'login', 'register', 'forgotPassword'].includes(view);
    const minimalBar = ['landing', 'questionnaire', 'piiWarning', 'contextChoice'].includes(view);

    return (
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen font-sans">
            {showGamificationBar && (
                <GamificationBar 
                    gamificationState={gamificationState}
                    currentUser={currentUser}
                    onViewAchievements={() => setMenuView('achievements')}
                    onToggleMenu={() => setIsMenuOpen(true)}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    minimal={minimalBar}
                />
            )}
            <main className="container mx-auto px-4">
                {renderView()}
            </main>
            <BurgerMenu 
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                currentUser={currentUser}
                onNavigate={(v) => {
                    setMenuView(v);
                    setIsMenuOpen(false);
                }}
                onLogout={handleLogout}
            />
            {isAnalyzing && <AnalyzingView />}
             <DeleteAccountModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)}
                onDeleteSuccess={() => { setIsDeleteModalOpen(false); handleLogout(); }}
            />
        </div>
    );
};

export default App;