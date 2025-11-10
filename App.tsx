import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Message, User, GamificationState, NavView, SessionAnalysis, ProposedUpdate } from './types';
import { useLocalization } from './context/LocalizationContext';
import * as api from './services/api';
import * as userService from './services/userService';
import * as geminiService from './services/geminiService';
import { deserializeGamificationState, serializeGamificationState } from './utils/gamificationSerializer';
import { getAchievements } from './achievements';
import { TestScenario } from './utils/testScenarios';


// Component Imports
import WelcomeScreen from './components/WelcomeScreen';
import GamificationBar from './components/GamificationBar';
import BurgerMenu from './components/BurgerMenu';
import LandingPage from './components/LandingPage';
import BotSelection from './components/BotSelection';
import ChatView from './components/ChatView';
// FIX: The SessionReview component was missing a default export. This is fixed in the component file.
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
import LegalView from './components/LegalView';
import AccountManagementView from './components/AccountManagementView';
import EditProfileView from './components/EditProfileView';
import DataExportView from './components/DataExportView';
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
import { BOTS } from './constants';

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
    const [cameFromContextChoice, setCameFromContextChoice] = useState(false);
    const [isTestMode, setIsTestMode] = useState(false);

    // Theme States
    const [isDarkMode, setIsDarkMode] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('isDarkMode') === 'dark' ? 'dark' : 'light';
        }
        return 'light';
    });
    const [colorTheme, setColorTheme] = useState<'autumn' | 'winter'>(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('colorTheme');
            return storedTheme === 'autumn' ? 'autumn' : 'winter';
        }
        return 'winter'; // Default to the new theme to showcase it
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
        if (isDarkMode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('isDarkMode', isDarkMode);
    }, [isDarkMode]);
    
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', colorTheme);
        localStorage.setItem('colorTheme', colorTheme);
    }, [colorTheme]);

    const toggleDarkMode = () => setIsDarkMode(prev => prev === 'light' ? 'dark' : 'light');
    const toggleColorTheme = () => setColorTheme(prev => prev === 'winter' ? 'autumn' : 'winter');
    
    const calculateNewGamificationState = useCallback((
        currentState: GamificationState,
        analysis: SessionAnalysis | null,
        botId: string,
        messageCount: number
    ): GamificationState => {
        let xpGained = (messageCount * 5) + ((analysis?.nextSteps?.length || 0) * 10);
        
        if (analysis?.hasConversationalEnd) {
            xpGained += 50;
        }
        if (analysis?.hasAccomplishedGoal) {
            xpGained += 25;
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastSession = currentState.lastSessionDate ? new Date(currentState.lastSessionDate) : null;
        let newStreak = currentState.streak;

        if (messageCount >= 5) {
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
        if(messageCount >= 5) {
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
            totalSessions: currentState.totalSessions + (messageCount >= 5 ? 1 : 0),
            lastSessionDate: messageCount >= 5 ? today : currentState.lastSessionDate,
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

    }, [t]);


    // --- PWA Service Worker Registration ---
    useEffect(() => {
        const registerServiceWorker = () => {
            if ('serviceWorker' in navigator) {
                const swUrl = `${window.location.origin}/sw.js`;
                navigator.serviceWorker.register(swUrl)
                    .then(registration => console.log('Service Worker registered with scope:', registration.scope))
                    .catch(error => console.error('Service Worker registration failed from App.tsx:', error));
            }
        };
        // The 'load' event is the most reliable point to register a service worker,
        // as it ensures the page is fully parsed and rendered, avoiding "invalid state" errors.
        window.addEventListener('load', registerServiceWorker);
        
        return () => {
            window.removeEventListener('load', registerServiceWorker);
        };
    }, []);


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
        
        setCameFromContextChoice(true);
        setGamificationState(deserializeGamificationState(gamificationJson));

        setLifeContext(context);
        setView('botSelection');
    };

    const handleQuestionnaireSubmit = (context: string) => {
        setCameFromContextChoice(false);
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
        setChatHistory([]);
        setView('chat');
    };
    
    const handleStartInterview = () => {
        const interviewBot = BOTS.find(b => b.id === 'g-interviewer');
        if (interviewBot) {
            setLifeContext(''); // Ensure interview starts with a blank slate
            setGamificationState(DEFAULT_GAMIFICATION_STATE);
            handleSelectBot(interviewBot);
        } else {
            console.error("Interview bot 'g-interviewer' not found in BOTS constant.");
        }
    };

    const handleEndSession = async () => {
        if (!selectedBot) return;
        
        // --- Special Handling for Interview Bot "G." ---
        if (selectedBot.id === 'g-interviewer') {
            if (userMessageCount === 0) {
                // If the user exits immediately, go back to the landing page.
                setSelectedBot(null);
                setChatHistory([]);
                setView('landing');
                return;
            }

            setIsAnalyzing(true);
            try {
                const generatedContext = await geminiService.generateContextFromInterview(chatHistory, language);
                setTempContext(generatedContext); // Pass the result to the review screen

                // Create a simplified analysis object for the review screen
                setSessionAnalysis({
                    newFindings: t('sessionReview_g_summary'),
                    proposedUpdates: [],
                    nextSteps: [],
                    solutionBlockages: [],
                    blockageScore: 0,
                    hasConversationalEnd: true,
                    hasAccomplishedGoal: false,
                });
                // Do not change gamification state for an interview session
                setNewGamificationState(gamificationState);
                setView('sessionReview');

            } catch (error) {
                console.error("Failed to generate context from interview:", error);
                // Show a fallback error message on the review screen
                setSessionAnalysis({
                    newFindings: "There was an error generating the context file from the interview.",
                    proposedUpdates: [],
                    nextSteps: [],
                    solutionBlockages: [],
                    blockageScore: 0,
                    hasConversationalEnd: false,
                    hasAccomplishedGoal: false,
                });
                setTempContext('');
                setNewGamificationState(gamificationState);
                setView('sessionReview');
            } finally {
                setIsAnalyzing(false);
            }
            return;
        }

        // --- Standard Session Analysis for all other bots ---
        if (userMessageCount === 0) {
            setSelectedBot(null);
            setChatHistory([]);
            setView('botSelection');
            return;
        }

        setIsAnalyzing(true);
        try {
            const analysis = await geminiService.analyzeSession(chatHistory, lifeContext, language);

            // If the analysis found "Next Steps", programmatically create an update for them.
            if (analysis.nextSteps && analysis.nextSteps.length > 0) {
                // Determine the correct headline based on the document's language.
                const docLang = (lifeContext && lifeContext.match(/^#\s*(Mein\s)?Lebenskontext/im)) ? 'de' : 'en';
                const nextStepsHeadline = docLang === 'de' ? 'Realisierbare nächste Schritte' : 'Achievable Next Steps';
                
                const deadlineWord = docLang === 'de' ? 'bis' : 'Deadline';

                // Format the next steps into a markdown list.
                const nextStepsContent = analysis.nextSteps
                    .map(step => `* ${step.action} (${deadlineWord}: ${step.deadline})`)
                    .join('\n');
                
                // Create a new ProposedUpdate object.
                const nextStepsUpdate: ProposedUpdate = {
                    type: 'append',
                    headline: nextStepsHeadline,
                    content: nextStepsContent,
                };
                
                // Add the new update to the list of proposed updates from the AI.
                analysis.proposedUpdates.push(nextStepsUpdate);
            }

            setSessionAnalysis(analysis);

            const newState = calculateNewGamificationState(gamificationState, analysis, selectedBot.id, userMessageCount);
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
                hasAccomplishedGoal: false,
            };
            setSessionAnalysis(fallbackAnalysis);
            const newState = calculateNewGamificationState(gamificationState, fallbackAnalysis, selectedBot.id, userMessageCount);
            setNewGamificationState(newState);
            setView('sessionReview');
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const saveData = async (newContext: string, stateToSave: GamificationState, preventCloudSave: boolean) => {
        if (isTestMode) {
            console.log("--- TEST MODE: SAVE SKIPPED ---");
            // Do not update the main state. The test run is ephemeral and should not affect the admin's context.
            return;
        }

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

    const handleContinueSession = async (newContext: string, options: { preventCloudSave: boolean }) => {
        // For test sessions, immediately exit to the admin panel without saving anything.
        // This prevents the test data from polluting the main application state.
        if (isTestMode) {
            setIsTestMode(false);
            setView('admin');
            return;
        }

        await saveData(newContext, newGamificationState || gamificationState, options.preventCloudSave);
        
        if (!currentUser) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        if (selectedBot) {
            setView('chat');
        } else {
            setView('botSelection');
        }
    };

    const handleSwitchCoach = async (newContext: string, options: { preventCloudSave: boolean }) => {
        // For test sessions, immediately exit to the admin panel without saving anything.
        if (isTestMode) {
            setIsTestMode(false);
            setView('admin');
            return;
        }
        
        await saveData(newContext, newGamificationState || gamificationState, options.preventCloudSave);
        
        if (!currentUser) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        setSelectedBot(null);
        setChatHistory([]);
        setView('botSelection');
    };

    const handleStartOver = useCallback(() => {
        // Reset session-specific state
        setSelectedBot(null);
        setChatHistory([]);
        setSessionAnalysis(null);
        setNewGamificationState(null);
        setUserMessageCount(0);
        setIsTestMode(false);
        
        // Close menu
        setIsMenuOpen(false);
        setMenuView(null);

        if (currentUser) {
            // A logged-in user with a saved context goes to the choice screen.
            // If they are logged-in but started a new session (lifeContext is empty), they go to landing.
            setView(lifeContext ? 'contextChoice' : 'landing');
        } else {
            // A guest user is fully reset to the landing page.
            setLifeContext('');
            setGamificationState(DEFAULT_GAMIFICATION_STATE);
            setView('landing');
        }
    // FIX: Add missing dependencies to useCallback
    }, [currentUser, lifeContext]);

    const handleRunTestSession = async (scenario: TestScenario, adminLifeContext: string) => {
        setIsTestMode(true);
        setIsAnalyzing(true);
        setMenuView(null); // Close admin menu
    
        try {
            setChatHistory(scenario.chatHistory);
            setSelectedBot(scenario.bot);
    
            // Handle special case for interview test, which formats a new context
            if (scenario.bot.id === 'g-interviewer') {
                const generatedContext = await geminiService.generateContextFromInterview(scenario.chatHistory, language);
                setTempContext(generatedContext); // This is what SessionReview will display
    
                setSessionAnalysis({
                    newFindings: t('sessionReview_g_summary'),
                    proposedUpdates: [], nextSteps: [], solutionBlockages: [], blockageScore: 0,
                    hasConversationalEnd: true, hasAccomplishedGoal: false,
                });
                setNewGamificationState(gamificationState); // No gamification change for interviews
                setLifeContext(''); // The "original context" for an interview is blank
            } else {
                // Standard analysis for all other bots using the admin's live context
                const analysis = await geminiService.analyzeSession(scenario.chatHistory, adminLifeContext, language);
                
                if (analysis.nextSteps && analysis.nextSteps.length > 0) {
                    const docLang = (adminLifeContext && adminLifeContext.match(/^#\s*(Mein\s)?Lebenskontext/im)) ? 'de' : 'en';
                    const nextStepsHeadline = docLang === 'de' ? 'Realisierbare nächste Schritte' : 'Achievable Next Steps';
                    const deadlineWord = docLang === 'de' ? 'bis' : 'Deadline';
                    const nextStepsContent = analysis.nextSteps.map(step => `* ${step.action} (${deadlineWord}: ${step.deadline})`).join('\n');
                    analysis.proposedUpdates.push({ type: 'append', headline: nextStepsHeadline, content: nextStepsContent });
                }
    
                setSessionAnalysis(analysis);
                setLifeContext(adminLifeContext); // The context for the test was the admin's context
                setTempContext(''); // Not an interview
                
                const mockMessageCount = scenario.chatHistory.length;
                const testGamificationState = calculateNewGamificationState(gamificationState, analysis, scenario.bot.id, mockMessageCount);
                setNewGamificationState(testGamificationState);
            }
    
            setView('sessionReview');
    
        } catch (error) {
            console.error("Failed to run test session:", error);
            const fallbackAnalysis: SessionAnalysis = {
                newFindings: `Test failed. Error during execution: ${error instanceof Error ? error.message : String(error)}`,
                proposedUpdates: [], nextSteps: [], solutionBlockages: [], blockageScore: 0, hasConversationalEnd: false, hasAccomplishedGoal: false,
            };
            setSessionAnalysis(fallbackAnalysis);
            setLifeContext(adminLifeContext); // Still show the context that was used
            setNewGamificationState(gamificationState);
            setView('sessionReview');
        } finally {
            setIsAnalyzing(false);
        }
    };


    // --- Menu Handlers ---
    // Toggles the slide-out burger menu panel.
    const handleBurgerIconClick = () => {
        setIsMenuOpen(p => !p);
    };

    // This is called when a user selects a sub-menu item from the BurgerMenu
    const handleNavigateFromMenu = (view: NavView) => {
        setMenuView(view); // Set the sub-menu view
        setIsMenuOpen(false); // Close the slide-out panel
    };

    // This is called from the "Exit" button in the top bar when a sub-menu is open
    const handleCloseSubMenu = () => {
        setMenuView(null); // Clear the sub-menu view, returning to the main view
    };

    // Closes the slide-out menu and also clears any active sub-menu view.
    const handleCloseAllMenus = () => {
        setIsMenuOpen(false);
        setMenuView(null);
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
                        handleStartOver();
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
            case 'contextChoice': return <ContextChoiceView user={currentUser!} savedContext={lifeContext} gamificationState={gamificationState} onContinue={() => { setCameFromContextChoice(true); setView('botSelection'); }} onStartNew={() => { setCameFromContextChoice(false); setLifeContext(''); setView('landing'); }} />;
            case 'paywall': return <PaywallView userEmail={paywallUserEmail} onRedeem={() => { setMenuView(null); setView('redeemCode'); }} onLogout={handleLogout} />;
            case 'landing': return <LandingPage onSubmit={handleFileUpload} onStartQuestionnaire={() => setView('questionnaire')} onStartInterview={handleStartInterview} />;
            case 'piiWarning': return <PIIWarningView onConfirm={handlePiiConfirm} onCancel={() => setView('questionnaire')} />;
            case 'questionnaire': return <Questionnaire onSubmit={handleQuestionnaireSubmit} onBack={() => setView('landing')} answers={questionnaireAnswers} onAnswersChange={setQuestionnaireAnswers} />;
            case 'botSelection': return <BotSelection onSelect={handleSelectBot} currentUser={currentUser} />;
            case 'chat': return <ChatView bot={selectedBot!} lifeContext={lifeContext} chatHistory={chatHistory} setChatHistory={setChatHistory} onEndSession={handleEndSession} onMessageSent={() => setUserMessageCount(c => c + 1)} currentUser={currentUser} isNewSession={!cameFromContextChoice} />;
            case 'sessionReview': return <SessionReview {...sessionAnalysis!} originalContext={lifeContext} selectedBot={selectedBot!} onContinueSession={handleContinueSession} onSwitchCoach={handleSwitchCoach} onReturnToStart={handleStartOver} gamificationState={newGamificationState || gamificationState} currentUser={currentUser} isInterviewReview={selectedBot?.id === 'g-interviewer'} interviewResult={tempContext} chatHistory={chatHistory} isTestMode={isTestMode} />;
            case 'achievements': return <AchievementsView gamificationState={gamificationState} />;
            case 'userGuide': return <UserGuideView />;
            case 'formattingHelp': return <FormattingHelpView />;
            case 'faq': return <FAQView />;
            case 'about': return <AboutView />;
            case 'disclaimer': return <DisclaimerView />;
            case 'legal': return <LegalView />;
            case 'accountManagement': return <AccountManagementView currentUser={currentUser!} onNavigate={handleNavigateFromMenu} onDeleteAccount={() => setIsDeleteModalOpen(true)} />;
            case 'editProfile': return <EditProfileView currentUser={currentUser!} onBack={() => setMenuView('accountManagement')} onProfileUpdated={(user) => setAndProcessUser(user)} />;
            case 'exportData': return <DataExportView lifeContext={lifeContext} />;
            case 'redeemCode': return <RedeemCodeView onRedeemSuccess={(user) => { 
                    setAndProcessUser(user);
                    setMenuView(null);
                    if (paywallUserEmail) {
                        setAuthRedirectReason("Your pass has been applied! Please log in again to continue.");
                        setPaywallUserEmail(null);
                        setView('login');
                    } else {
                        // If redeeming without being on the paywall, just close the menu view
                        handleCloseSubMenu();
                    }
                }} />;
            case 'admin': return <AdminView currentUser={currentUser} onRunTestSession={handleRunTestSession} lifeContext={lifeContext} />;
            case 'changePassword': return <ChangePasswordView currentUser={currentUser!} encryptionKey={encryptionKey!} lifeContext={lifeContext} />;
            default: return <WelcomeScreen />;
        }
    };
    
    const showGamificationBar = !['welcome', 'auth', 'login', 'register', 'forgotPassword', 'registrationPending', 'verifyEmail', 'resetPassword', 'paywall'].includes(view);
    const minimalBar = ['landing', 'questionnaire', 'piiWarning', 'contextChoice'].includes(view) && !menuView;

    return (
        <div className={`font-sans ${view === 'chat' ? 'h-screen flex flex-col' : 'min-h-screen'}`}>
            {showGamificationBar && (
                <GamificationBar 
                    gamificationState={gamificationState}
                    currentUser={currentUser}
                    onViewAchievements={() => handleNavigateFromMenu('achievements')}
                    onBurgerClick={handleBurgerIconClick}
                    onCloseSubMenu={handleCloseSubMenu}
                    isMenuOpen={isMenuOpen}
                    isSubMenuOpen={!!menuView}
                    isDarkMode={isDarkMode}
                    toggleDarkMode={toggleDarkMode}
                    colorTheme={colorTheme}
                    toggleColorTheme={toggleColorTheme}
                    minimal={minimalBar}
                />
            )}
            <main className={`container mx-auto px-4 ${view === 'chat' ? 'flex-1 min-h-0 py-4' : ''}`}>
                {renderView()}
            </main>
            <BurgerMenu 
                isOpen={isMenuOpen}
                onClose={handleCloseAllMenus}
                currentUser={currentUser}
                onNavigate={handleNavigateFromMenu}
                onLogout={handleLogout}
                onStartOver={handleStartOver}
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