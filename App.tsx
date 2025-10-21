import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Message, User, GamificationState, NavView, SessionAnalysis } from './types';
import { useLocalization } from './context/LocalizationContext';
import * as api from './services/api';
import * as userService from './services/userService';
import * as geminiService from './services/geminiService';
import { deserializeGamificationState, serializeGamificationState } from './utils/gamificationSerializer';
import { getAchievements } from './achievements';


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
import RegistrationPendingView from './components/RegistrationPendingView';
import VerifyEmailView from './components/VerifyEmailView';
import ResetPasswordView from './components/ResetPasswordView';
import PaywallView from './components/PaywallView';

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
    const { t, language } = useLocalization();
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
    const [paywallUserEmail, setPaywallUserEmail] = useState<string | null>(null);

    // Theme
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
        }
        return 'light';
    });

    const setAndProcessUser = (user: User | null) => {
        if (user) {
            let processedUser = { ...user };
            if (typeof processedUser.unlockedCoaches === 'string') {
                try {
                    const parsed = JSON.parse(processedUser.unlockedCoaches as any);
                    processedUser.unlockedCoaches = Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    console.error("Failed to parse unlockedCoaches, defaulting to empty array.", e);
                    processedUser.unlockedCoaches = [];
                }
            } else if (!Array.isArray(processedUser.unlockedCoaches)) {
                processedUser.unlockedCoaches = [];
            }
            setCurrentUser(processedUser);
        } else {
            setCurrentUser(null);
        }
    };

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
        // This effect runs once on startup.
        const initializeApp = async () => {
            // Check for URL-based routes first (email verification, password reset)
            const urlParams = new URLSearchParams(window.location.search);
            const route = urlParams.get('route');
            
            if (route) {
                if (route === 'verify-email') {
                    setView('verifyEmail');
                    return;
                }
                if (route === 'reset-password') {
                    setView('resetPassword');
                    return; 
                }
            }

            // Standard initialization if no token routes are found
            const session = api.getSession();
            if (session) {
                // If a session exists, we don't have the encryption key.
                // Go directly to the login screen.
                setAuthRedirectReason(null);
                setView('login');
            } else {
                // No session, start at the auth screen.
                setAuthRedirectReason(null);
                setView('auth');
            }
        };

        let isInitialized = false;
        let showWelcomeScreen = true;

        // Timer to ensure the welcome screen is shown for at least 1.5 seconds.
        setTimeout(() => {
            showWelcomeScreen = false;
            // If initialization is already done, proceed. Otherwise, wait for it.
            if (isInitialized) {
                initializeApp();
            }
        }, 1500);

        // Run initialization logic in parallel.
        const init = async () => {
            // This is where you would put any async startup logic that needs to run
            // while the welcome screen is visible (e.g., fetching initial config).
            // For now, it's just a placeholder.
            await new Promise(resolve => setTimeout(resolve, 10)); // Simulate some work
            isInitialized = true;
            // If welcome screen timer is done, proceed. Otherwise, wait for it.
            if (!showWelcomeScreen) {
                initializeApp();
            }
        };

        init();
    }, []);
    
    // --- NAVIGATION & STATE HANDLERS ---
    
    const handleLoginSuccess = async (user: User, key: CryptoKey) => {
        setAndProcessUser(user);
        setEncryptionKey(key);
        try {
            const data = await userService.loadUserData(key);
            setLifeContext(data.context || '');
            setGamificationState(deserializeGamificationState(data.gamificationState));

            if (user.isAdmin) {
                setView('admin');
            } else {
                setView(data.context ? 'contextChoice' : 'landing');
            }
        } catch (error) {
            console.error("Failed to load user data after login, logging out.", error);
            api.clearSession();
            setAndProcessUser(null);
            setEncryptionKey(null);
            setView('auth');
            setAuthRedirectReason("There was an issue loading your profile. Please try logging in again.");
        }
    };

    const handleAccessExpired = (email: string) => {
        setPaywallUserEmail(email);
        setView('paywall');
    };
    
    const handleLogout = () => {
        api.clearSession();
        setAndProcessUser(null);
        setEncryptionKey(null);
        setLifeContext('');
        setGamificationState(DEFAULT_GAMIFICATION_STATE);
        setAuthRedirectReason(null);
        setPaywallUserEmail(null);
        setMenuView(null); // Clear any open menu view to prevent being stuck
        // Go to welcome screen first, then to auth screen to mimic app start
        setView('welcome');
        setTimeout(() => setView('auth'), 1500);
    };

    const handleFileUpload = (context: string) => {
        // New regex to find the key "do_not_delete" and handle legacy "gmf-data"
        const dataRegex = /<!-- (do_not_delete|gmf-data): (.*?) -->/;
        const match = context.match(dataRegex);

        let gamificationJson = '{}'; // Default to an empty object string
        if (match && match[2]) {
            try {
                // Step 1: Extract the (potentially) obfuscated string
                const rawData = match[2];

                // Step 2: De-obfuscate by reversing the string before decoding.
                // This makes the data non-standard and not directly usable by Base64 decoders.
                const encodedData = rawData.split('').reverse().join('');
                
                // Step 3: Decode from Base64
                gamificationJson = atob(encodedData);
            } catch (error) {
                console.error("Failed to decode gamification state from file, using default state.", error);
                // Fallthrough to use the default state by keeping gamificationJson as '{}'
            }
        }
        
        setGamificationState(deserializeGamificationState(gamificationJson));

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

        if (userMessageCount === 0) {
            // No user interaction, simply go back to bot selection without analysis.
            setSelectedBot(null);
            setChatHistory([]);
            setView('botSelection');
            return;
        }

        setIsAnalyzing(true);
        try {
            const analysis = await geminiService.analyzeSession(chatHistory, lifeContext, language);
            setSessionAnalysis(analysis);

            const awardSessionBonus = (analysis.nextSteps?.length || 0) > 0;
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
    
    const saveData = async (newContext: string, stateToSave: GamificationState, preventCloudSave: boolean) => {
        // Update local state immediately for a responsive UI.
        setLifeContext(newContext);
        setGamificationState(stateToSave);

        // For registered users, persist data to the cloud.
        if (currentUser && encryptionKey) {
            try {
                // Determine which context to save. If the user opted out of saving text changes,
                // we send the original context back to the server. Otherwise, we send the new one.
                const contextToSave = preventCloudSave ? lifeContext : newContext;
                
                // Crucially, we ALWAYS save the new gamification state to ensure progress is never lost.
                await userService.saveUserData(contextToSave, serializeGamificationState(stateToSave), encryptionKey);

            } catch (error) {
                console.error("Failed to save user data:", error);
                // Optionally, add UI feedback for the user here.
            }
        }
    };

    const handleContinueSession = (newContext: string, options: { preventCloudSave: boolean }) => {
        saveData(newContext, newGamificationState || gamificationState, options.preventCloudSave);
        if (selectedBot) {
            setView('chat');
        } else {
            setView('botSelection');
        }
    };

    const handleSwitchCoach = (newContext: string, options: { preventCloudSave: boolean }) => {
        saveData(newContext, newGamificationState || gamificationState, options.preventCloudSave);
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
        
        if (!currentUser) {
            // For a guest, "Start Over" is a full reset to the beginning.
            setGamificationState(DEFAULT_GAMIFICATION_STATE);
        }
        // For both guests and logged-in users starting a new context from scratch,
        // navigate to the landing page.
        setView('landing');
    };

    // --- RENDER LOGIC ---
    
    const renderView = () => {
        const currentView = menuView || view;

        switch (currentView) {
            case 'welcome': return <WelcomeScreen />;
            case 'auth': {
                return <AuthView 
                    onLogin={() => {
                        setMenuView(null);
                        setView('login');
                    }} 
                    onRegister={() => {
                        setMenuView(null);
                        setView('register');
                    }} 
                    onGuest={() => {
                        setMenuView(null);
                        resetToStart();
                    }}
                    redirectReason={authRedirectReason}
                />;
            }
            case 'login': return <LoginView onLoginSuccess={handleLoginSuccess} onAccessExpired={handleAccessExpired} onSwitchToRegister={() => { setAuthRedirectReason(null); setView('register'); }} onBack={() => { setAuthRedirectReason(null); setView('auth'); }} onForgotPassword={() => { setAuthRedirectReason(null); setView('forgotPassword'); }} reason={authRedirectReason} />;
            case 'register': return <RegisterView onShowPending={() => setView('registrationPending')} onSwitchToLogin={() => setView('login')} onBack={() => setView('auth')} />;
            case 'registrationPending': return <RegistrationPendingView onGoToLogin={() => setView('login')} />;
            case 'verifyEmail': return <VerifyEmailView onVerificationSuccess={handleLoginSuccess} />;
            case 'forgotPassword': return <ForgotPasswordView onBack={() => setView('login')} />;
            case 'resetPassword': return <ResetPasswordView onResetSuccess={() => setView('login')} />;
            case 'contextChoice': return <ContextChoiceView user={currentUser!} savedContext={lifeContext} onContinue={() => setView('botSelection')} onStartNew={() => { setLifeContext(''); setView('landing'); }} />;
            case 'paywall': return <PaywallView userEmail={paywallUserEmail} onRedeem={() => setView('redeemCode')} onLogout={handleLogout} />;
            case 'landing': return <LandingPage onSubmit={handleFileUpload} onStartQuestionnaire={() => setView('questionnaire')} />;
            case 'piiWarning': return <PIIWarningView onConfirm={handlePiiConfirm} onCancel={() => setView('questionnaire')} />;
            case 'questionnaire': return <Questionnaire onSubmit={handleQuestionnaireSubmit} onBack={() => setView('landing')} answers={questionnaireAnswers} onAnswersChange={setQuestionnaireAnswers} />;
            case 'botSelection': return <BotSelection onSelect={handleSelectBot} currentUser={currentUser} />;
            case 'chat': return <ChatView bot={selectedBot!} lifeContext={lifeContext} chatHistory={chatHistory} setChatHistory={setChatHistory} onEndSession={handleEndSession} onMessageSent={() => setUserMessageCount(c => c + 1)} currentUser={currentUser} />;
            case 'sessionReview': return <SessionReview {...sessionAnalysis!} originalContext={lifeContext} selectedBot={selectedBot!} onContinueSession={handleContinueSession} onSwitchCoach={handleSwitchCoach} onReturnToStart={resetToStart} gamificationState={newGamificationState || gamificationState} currentUser={currentUser} />;
            case 'achievements': return <AchievementsView gamificationState={gamificationState} onBack={() => setMenuView(null)} />;
            case 'userGuide': return <UserGuideView onBack={() => setMenuView(null)} />;
            case 'formattingHelp': return <FormattingHelpView onBack={() => setMenuView(null)} />;
            case 'faq': return <FAQView onBack={() => setMenuView(null)} />;
            case 'about': return <AboutView onBack={() => setMenuView(null)} />;
            case 'disclaimer': return <DisclaimerView onBack={() => setMenuView(null)} currentUser={currentUser} onDeleteAccount={() => setIsDeleteModalOpen(true)} />;
            case 'terms': return <TermsView onBack={() => setMenuView(null)} />;
            case 'redeemCode': return <RedeemCodeView onBack={() => {
                    if (paywallUserEmail) {
                        setView('paywall');
                    } else {
                        setMenuView(null);
                    }
                }} onRedeemSuccess={(user) => { 
                    setAndProcessUser(user);
                    setMenuView(null);
                    if (paywallUserEmail) {
                        setAuthRedirectReason("Your pass has been applied! Please log in again to continue.");
                        setPaywallUserEmail(null);
                        setView('login');
                    }
                }} />;
            case 'admin': {
                const handleAdminBack = () => {
                    if (menuView === 'admin') {
                        // Opened from the side menu, so just close the menu view overlay.
                        setMenuView(null);
                    } else if (view === 'admin') {
                        // This was the initial view after an admin login. Navigate to the main app.
                        // We can use the same logic as a regular user's post-login navigation.
                        setView(lifeContext ? 'contextChoice' : 'landing');
                    } else {
                        // Fallback case, which shouldn't be reached.
                        setMenuView(null);
                    }
                };
                return <AdminView onBack={handleAdminBack} currentUser={currentUser} />;
            }
            case 'changePassword': return <ChangePasswordView onBack={() => setMenuView(null)} currentUser={currentUser!} encryptionKey={encryptionKey!} lifeContext={lifeContext} />;
            default: return <WelcomeScreen />;
        }
    };
    
    const showGamificationBar = !['welcome', 'auth', 'login', 'register', 'forgotPassword', 'registrationPending', 'verifyEmail', 'resetPassword', 'paywall'].includes(view);
    const minimalBar = ['landing', 'questionnaire', 'piiWarning', 'contextChoice'].includes(view);

    return (
        <div className={`bg-gray-50 dark:bg-gray-950 font-sans ${view === 'chat' ? 'h-screen flex flex-col' : 'min-h-screen'}`}>
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
            <main className={`container mx-auto px-4 ${view === 'chat' ? 'flex-1 min-h-0 py-4' : ''}`}>
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