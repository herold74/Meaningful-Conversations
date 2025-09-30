import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Message, AppView, View, GamificationState, NavView, SessionAnalysis, User, UserData } from './types';
import * as geminiService from './services/geminiService';
import { getAchievements } from './achievements';
import * as userService from './services/userService';
import { deserializeGamificationState } from './utils/gamificationSerializer';

import LandingPage from './components/LandingPage';
import BotSelection from './components/BotSelection';
import ChatView from './components/ChatView';
import SessionReview from './components/SessionReview';
import Questionnaire from './components/Questionnaire';
import WelcomeScreen from './components/WelcomeScreen';
import AnalyzingView from './components/AnalyzingView';
import GamificationBar from './components/GamificationBar';
import BurgerMenu from './components/BurgerMenu';
import AboutView from './components/AboutView';
import FAQView from './components/FAQView';
import DisclaimerView from './components/DisclaimerView';
import TermsView from './components/TermsView';
import AchievementsView from './components/AchievementsView';
import PIIWarningView from './components/PIIWarningView';
import FormattingHelpView from './components/FormattingHelpView';
import UserGuideView from './components/UserGuideView';
import AuthView from './components/AuthView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import ContextChoiceView from './components/ContextChoiceView';
import ForgotPasswordView from './components/ForgotPasswordView';

import { useLocalization } from './context/LocalizationContext';
import Spinner from './components/shared/Spinner';

const useTheme = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
            return localStorage.getItem('theme') as 'light' | 'dark';
        }
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    return { theme, toggleTheme };
};

const getDefaultGamificationState = (): GamificationState => ({
    xp: 0,
    level: 1,
    streak: 0,
    unlockedAchievements: new Set(['beta_pioneer']),
    totalSessions: 0,
    lastSessionDate: null,
    coachesUsed: new Set(),
});

const App: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { t, language } = useLocalization();
    const [view, setView] = useState<View>('welcome');
    const [previousAppView, setPreviousAppView] = useState<AppView>('landing');
    const [lifeContext, setLifeContext] = useState<string | null>(null);
    const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [sessionAnalysis, setSessionAnalysis] = useState<SessionAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
    const [pendingReview, setPendingReview] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(userService.getCurrentUser());
    const [pendingUserData, setPendingUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true); // For initial data load

    const ALL_ACHIEVEMENTS = getAchievements(t);

    const [gamificationState, setGamificationState] = useState<GamificationState>(getDefaultGamificationState());
    
    // Effect to save gamification state for guests, or trigger save for users
    useEffect(() => {
        const saveState = async () => {
            if (currentUser) {
                try {
                    await userService.saveUserData({ gamificationState });
                } catch (error) {
                    console.error("Failed to save user gamification state:", error);
                }
            } else {
                 try {
                    const stateToSave = {
                        ...gamificationState,
                        unlockedAchievements: Array.from(gamificationState.unlockedAchievements),
                        coachesUsed: Array.from(gamificationState.coachesUsed),
                    };
                    localStorage.setItem('gamificationState_guest', JSON.stringify(stateToSave));
                } catch (error) {
                    console.error("Failed to save guest gamification state:", error);
                }
            }
        };
        // Don't save on initial load
        if (!isLoading) {
            saveState();
        }
    }, [gamificationState, currentUser, isLoading]);

    // Initial load effect
    useEffect(() => {
        const initializeApp = async () => {
            const user = userService.getCurrentUser();
            if (user) {
                setCurrentUser(user);
                const userData = await userService.loadUserData();
                if (userData) {
                    setGamificationState(userData.gamificationState);
                    if (userData.lifeContext) {
                        setPendingUserData(userData);
                        setView('context-choice');
                    } else {
                        setView('landing');
                    }
                } else {
                    setView('landing');
                }
            } else {
                // Load guest state
                try {
                    const savedState = localStorage.getItem('gamificationState_guest');
                    if (savedState) {
                        const parsed = JSON.parse(savedState);
                        setGamificationState({
                            ...parsed,
                            unlockedAchievements: new Set(parsed.unlockedAchievements || ['beta_pioneer']),
                            coachesUsed: new Set(parsed.coachesUsed || []),
                        });
                    }
                } catch (error) {
                    console.error("Failed to load guest gamification state:", error);
                }
                setTimeout(() => setView(prev => prev === 'welcome' ? 'auth' : prev), 1500);
            }
            setIsLoading(false);
        };
        initializeApp();
    }, []);


    useEffect(() => {
        if (pendingReview) {
            setIsAnalyzing(false);
            setView('session-review');
            setPendingReview(false);
        }
    }, [pendingReview, gamificationState]);

    const updateGamificationOnSessionStart = useCallback((botId: string) => {
        setGamificationState(prev => {
            let newStreak = prev.streak;
            const todayUTC = new Date();
            const todayAtUTCmidnight = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate()));
    
            if (prev.lastSessionDate) {
                const lastSessionUTCmidnight = new Date(prev.lastSessionDate);
                const diffTime = todayAtUTCmidnight.getTime() - lastSessionUTCmidnight.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
                if (diffDays === 1) {
                    newStreak = prev.streak + 1;
                } else if (diffDays > 1) {
                    newStreak = 1;
                }
            } else {
                newStreak = 1;
            }
    
            const newCoachesUsed = new Set(prev.coachesUsed).add(botId);
    
            return { ...prev, streak: newStreak, coachesUsed: newCoachesUsed };
        });
    }, []);

    const updateGamificationOnMessage = useCallback(() => {
        setGamificationState(prev => {
            const newXp = prev.xp + 5;
            const newLevel = Math.floor(newXp / 100) + 1;
            return { ...prev, xp: newXp, level: newLevel };
        });
    }, []);

    const updateGamificationOnSessionEnd = useCallback((nextSteps: { action: string; deadline: string }[]) => {
        setGamificationState(prev => {
            const today = new Date().toISOString().split('T')[0];
            const newTotalSessions = prev.totalSessions + 1;
            let newXp = prev.xp;
            if (nextSteps && nextSteps.length > 0) {
                newXp += 50;
            }
            const newLevel = Math.floor(newXp / 100) + 1;

            const updatedState = {
                ...prev,
                totalSessions: newTotalSessions,
                lastSessionDate: today,
                xp: newXp,
                level: newLevel,
            };
            
            const newUnlocked = new Set(prev.unlockedAchievements);
            ALL_ACHIEVEMENTS.forEach(ach => {
                if (!newUnlocked.has(ach.id) && ach.isUnlocked(updatedState)) {
                    newUnlocked.add(ach.id);
                }
            });

            return { ...updatedState, unlockedAchievements: newUnlocked };
        });
    }, [ALL_ACHIEVEMENTS]);

    const handleContextSubmit = async (context: string) => {
        const dataMatchRegex = /<!-- do not delete: (.*?) -->/;
        
        if (!currentUser) {
            const match = context.match(dataMatchRegex);
            if (match && match[1]) {
                try {
                    const decodedData = atob(match[1]);
                    const loadedState = deserializeGamificationState(decodedData);
                    setGamificationState(loadedState);
                } catch (e) {
                    console.warn("Could not parse gamification data from file. Using local state.");
                }
            }
        }
        
        const dataRemoveRegex = /<!-- do not delete: (.*?) -->/g;
        const cleanContext = context.replace(dataRemoveRegex, '').trim();
        setLifeContext(cleanContext);
        
        if (currentUser) {
            await userService.saveUserData({ lifeContext: cleanContext });
        }
        
        setView('pii-warning');
    };

    const handleLoginSuccess = async (user: User) => {
        setCurrentUser(user);
        setIsLoading(true);
        const userData = await userService.loadUserData();
        if (userData) {
            setGamificationState(userData.gamificationState);
            if (userData.lifeContext) {
                setPendingUserData(userData);
                setView('context-choice');
            } else {
                setLifeContext(null);
                setView('landing');
            }
        } else {
            // New registered user or failed load
            setLifeContext(null);
            setGamificationState(getDefaultGamificationState());
            setView('landing');
        }
        setIsLoading(false);
    };

    const handleLoadSavedContext = () => {
        if (pendingUserData) {
            setLifeContext(pendingUserData.lifeContext);
            setGamificationState(pendingUserData.gamificationState);
            setPendingUserData(null);
            setView('bot-selection');
        }
    };

    const handleStartNewWithAccount = () => {
        if (pendingUserData) {
            setGamificationState(pendingUserData.gamificationState);
        }
        setLifeContext(null);
        setPendingUserData(null);
        setView('landing');
    };

    const handleBetaLogin = async () => {
        setIsLoading(true);
        try {
            const user = await userService.loginAsBetaTester();
            await handleLoginSuccess(user);
        } catch (error) {
            console.error("Beta login failed:", error);
            setIsLoading(false);
            // Optionally show an error message to the user
        }
    };

    const handleLogout = () => {
        userService.logout();
        setCurrentUser(null);
        handleFullReset();
    };

    const handleGuestAccess = () => {
        setCurrentUser(null); 
        setLifeContext(null); 
        try {
            const savedState = localStorage.getItem('gamificationState_guest');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                setGamificationState({
                    ...parsed,
                    unlockedAchievements: new Set(parsed.unlockedAchievements || ['beta_pioneer']),
                    coachesUsed: new Set(parsed.coachesUsed || []),
                });
            } else {
                 setGamificationState(getDefaultGamificationState());
            }
        } catch (error) {
            console.error("Failed to load guest gamification state:", error);
            setGamificationState(getDefaultGamificationState());
        }
        setView('landing');
    };


    const handlePIIConfirm = () => {
        setView('bot-selection');
    };

    const handleBotSelect = (bot: Bot) => {
        if (lifeContext === null) return;
        
        updateGamificationOnSessionStart(bot.id);
        const welcomeText = t('chat_welcome_default', { name: bot.name });
        const welcomeMessage: Message = { id: `bot-welcome-${Date.now()}`, text: welcomeText, role: 'bot', timestamp: new Date().toISOString() };
        
        setChatHistory([welcomeMessage]);
        setSelectedBot(bot);
        setView('chat');
    };

    const handleEndSession = async () => {
        if (lifeContext === null || chatHistory.length <= 1) {
            setView('bot-selection');
            return;
        }
        setIsAnalyzing(true);
        const analysis = await geminiService.analyzeSession(chatHistory, lifeContext, language);
        setSessionAnalysis(analysis);
        updateGamificationOnSessionEnd(analysis.nextSteps);
        setPendingReview(true);
    };
    
    const handleContinueSession = async (newContext: string) => {
        const cleanContext = newContext.replace(/<!-- do not delete: (.*?) -->/g, '').trim();
        setLifeContext(cleanContext);

        if (currentUser) {
            await userService.saveUserData({ lifeContext: cleanContext });
        }

        if (selectedBot) {
            const continueMessage: Message = { id: `bot-continue-${Date.now()}`, text: t('chat_continue'), role: 'bot', timestamp: new Date().toISOString() };
            setChatHistory(prev => [...prev, continueMessage]);
        }
        setView('chat');
    };

    const handleSwitchCoach = async (newContext: string) => {
        const cleanContext = newContext.replace(/<!-- do not delete: (.*?) -->/g, '').trim();
        setLifeContext(cleanContext);
        
        if (currentUser) {
            await userService.saveUserData({ lifeContext: cleanContext });
        }

        setChatHistory([]);
        setSelectedBot(null);
        setSessionAnalysis(null);
        setView('bot-selection');
    };

    const handleRestart = async () => {
        if (currentUser) {
            await userService.saveUserData({ lifeContext: null });
        }
        setLifeContext(null);
        setSelectedBot(null);
        setChatHistory([]);
        setSessionAnalysis(null);
        setIsMenuOpen(false);
        setQuestionnaireAnswers({});
        setView('landing');
    };

    const handleFullReset = () => {
        setLifeContext(null);
        setSelectedBot(null);
        setChatHistory([]);
        setSessionAnalysis(null);
        setIsMenuOpen(false);
        setQuestionnaireAnswers({});
        
        setCurrentUser(null);
        userService.logout(); // Clear session
        localStorage.removeItem('gamificationState_guest'); // Clear guest data
        setGamificationState(getDefaultGamificationState());
        
        setView('auth'); 
    };

    const handleNavigate = (navView: NavView) => {
        if (!['welcome', 'auth', 'login', 'register', 'landing', 'questionnaire', 'pii-warning', 'bot-selection', 'chat', 'session-review', 'context-choice', 'forgot-password'].includes(view)) {
            // it's already a NavView
        } else {
             setPreviousAppView(view as AppView);
        }
        setView(navView);
        setIsMenuOpen(false);
    };
    
    const handleBackFromInfo = () => {
        setView(previousAppView);
    };
    
    const renderView = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <Spinner />
                </div>
            );
        }
        switch (view) {
            case 'welcome':
                return <WelcomeScreen />;
            case 'auth':
                return <AuthView onLogin={() => setView('login')} onRegister={() => setView('register')} onGuest={handleGuestAccess} onBetaLogin={handleBetaLogin} />;
            case 'login':
                return <LoginView onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setView('register')} onBack={() => setView('auth')} onForgotPassword={() => setView('forgot-password')} />;
            case 'register':
                 return <RegisterView onRegisterSuccess={handleLoginSuccess} onSwitchToLogin={() => setView('login')} onBack={() => setView('auth')} />;
            case 'forgot-password':
                return <ForgotPasswordView onBack={() => setView('login')} />;
            case 'context-choice':
                if (currentUser && pendingUserData && pendingUserData.lifeContext) {
                    return <ContextChoiceView 
                        user={currentUser}
                        savedContext={pendingUserData.lifeContext}
                        onContinue={handleLoadSavedContext}
                        onStartNew={handleStartNewWithAccount}
                    />;
                }
                return <LandingPage onSubmit={handleContextSubmit} onStartQuestionnaire={() => { setQuestionnaireAnswers({}); setView('questionnaire'); }} />;
            case 'landing':
                return <LandingPage onSubmit={handleContextSubmit} onStartQuestionnaire={() => { setQuestionnaireAnswers({}); setView('questionnaire'); }} />;
            case 'questionnaire':
                return <Questionnaire onSubmit={handleContextSubmit} onBack={() => { setView('landing'); setQuestionnaireAnswers({}); }} answers={questionnaireAnswers} onAnswersChange={setQuestionnaireAnswers} />;
            case 'pii-warning':
                return <PIIWarningView onConfirm={handlePIIConfirm} onCancel={() => setView('landing')} />;
            case 'bot-selection':
                return <BotSelection onSelect={handleBotSelect} currentUser={currentUser} />;
            case 'chat':
                if (selectedBot && lifeContext !== null) {
                    return <ChatView bot={selectedBot} lifeContext={lifeContext} chatHistory={chatHistory} setChatHistory={setChatHistory} onEndSession={handleEndSession} onMessageSent={updateGamificationOnMessage}/>;
                }
                // Fallback if state is inconsistent
                handleFullReset();
                return null;
            case 'session-review':
                if (sessionAnalysis && lifeContext !== null && selectedBot) {
                    return (
                        <SessionReview
                            newFindings={sessionAnalysis.newFindings}
                            proposedUpdates={sessionAnalysis.proposedUpdates}
                            nextSteps={sessionAnalysis.nextSteps}
                            solutionBlockages={sessionAnalysis.solutionBlockages}
                            blockageScore={sessionAnalysis.blockageScore}
                            originalContext={lifeContext}
                            selectedBot={selectedBot}
                            onContinueSession={handleContinueSession}
                            onSwitchCoach={handleSwitchCoach}
                            onReturnToStart={handleRestart}
                            gamificationState={gamificationState}
                            currentUser={currentUser}
                        />
                    );
                }
                return null;
            case 'about': return <AboutView onBack={handleBackFromInfo} />;
            case 'faq': return <FAQView onBack={handleBackFromInfo} />;
            case 'disclaimer': return <DisclaimerView onBack={handleBackFromInfo} />;
            case 'terms': return <TermsView onBack={handleBackFromInfo} />;
            case 'achievements': return <AchievementsView gamificationState={gamificationState} onBack={handleBackFromInfo} />;
            case 'formatting-help': return <FormattingHelpView onBack={handleBackFromInfo} />;
            case 'user-guide': return <UserGuideView onBack={handleBackFromInfo} />;
            default:
                return <AuthView onLogin={() => setView('login')} onRegister={() => setView('register')} onGuest={handleGuestAccess} onBetaLogin={handleBetaLogin} />;
        }
    };
    
    const isMinimalBar = ['welcome', 'auth', 'login', 'register', 'forgot-password', 'landing', 'questionnaire', 'pii-warning', 'context-choice'].includes(view);

    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen text-gray-800 dark:text-gray-300 font-sans">
            <div className="container mx-auto px-4 py-2">
                {!['welcome'].includes(view) && !isLoading && (
                     <GamificationBar 
                        gamificationState={gamificationState}
                        currentUser={currentUser}
                        onViewAchievements={() => handleNavigate('achievements')}
                        onToggleMenu={() => setIsMenuOpen(true)}
                        minimal={isMinimalBar}
                        theme={theme}
                        toggleTheme={toggleTheme}
                     />
                )}
                {isAnalyzing && <AnalyzingView />}
                <main>
                    {renderView()}
                </main>
                <BurgerMenu
                    isOpen={isMenuOpen}
                    currentUser={currentUser}
                    onClose={() => setIsMenuOpen(false)}
                    onNavigate={handleNavigate}
                    onRestart={handleRestart}
                    onFullReset={handleFullReset}
                    onLogout={handleLogout}
                />
            </div>
        </div>
    );
};

export default App;
