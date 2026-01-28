import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Message, User, GamificationState, NavView, SessionAnalysis, ProposedUpdate } from './types';
import { useLocalization } from './context/LocalizationContext';
import * as api from './services/api';
import * as userService from './services/userService';
import * as geminiService from './services/geminiService';
import * as analyticsService from './services/analyticsService';
import { deserializeGamificationState, serializeGamificationState } from './utils/gamificationSerializer';
import { getAchievements } from './achievements';
import { TestScenario } from './utils/testScenarios';
import { getSeasonalColorTheme, getCurrentSeason } from './utils/dateUtils';


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
import UnsubscribeView from './components/UnsubscribeView';
import UpdateNotification from './components/UpdateNotification';
import PaywallView from './components/PaywallView';
import PersonalitySurvey, { SurveyResult } from './components/PersonalitySurvey';
import PersonalityProfileView from './components/PersonalityProfileView';
import LifeContextEditorView from './components/LifeContextEditorView';
import { formatSurveyResultAsHtml } from './utils/surveyResultHtmlFormatter';
import { generatePDF, generateSurveyPdfFilename } from './utils/pdfGenerator';
import { encryptPersonalityProfile, decryptPersonalityProfile } from './utils/personalityEncryption';
import { BOTS } from './constants';
import { updateServiceWorker } from './utils/serviceWorkerUtils';

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
    const [testScenarioId, setTestScenarioId] = useState<string | null>(null);
    const [refinementPreview, setRefinementPreview] = useState<api.RefinementPreviewResult | null>(null);
    const [isLoadingRefinementPreview, setIsLoadingRefinementPreview] = useState(false);
    const [refinementPreviewError, setRefinementPreviewError] = useState<string | null>(null);
    
    // Personality Profile States
    const [hasPersonalityProfile, setHasPersonalityProfile] = useState(false);
    const [existingProfileForExtension, setExistingProfileForExtension] = useState<Partial<SurveyResult> | null>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Theme States
    const [isDarkMode, setIsDarkMode] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('isDarkMode') === 'dark' ? 'dark' : 'light';
        }
        return 'light';
    });
    const [isAutoThemeEnabled, setIsAutoThemeEnabled] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('autoThemeEnabled');
            return stored !== 'false'; // Default to true, only false if explicitly disabled
        }
        return true;
    });
    const [colorTheme, setColorTheme] = useState<'summer' | 'autumn' | 'winter'>(() => {
        if (typeof window !== 'undefined') {
            const currentSeason = getCurrentSeason();
            const lastAppliedSeason = localStorage.getItem('lastAppliedSeason');
            const storedTheme = localStorage.getItem('colorTheme');
            
            // Check if season has changed since last visit
            if (currentSeason !== lastAppliedSeason) {
                // New season! Apply seasonal theme once and save
                const newTheme = getSeasonalColorTheme() as 'summer' | 'autumn' | 'winter';
                localStorage.setItem('lastAppliedSeason', currentSeason);
                localStorage.setItem('colorTheme', newTheme);
                return newTheme;
            }
            
            // Same season - use stored preference if valid
            if (storedTheme === 'summer' || storedTheme === 'autumn' || storedTheme === 'winter') {
                return storedTheme;
            }
        }
        // Default to seasonal theme
        return getSeasonalColorTheme() as 'summer' | 'autumn' | 'winter';
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

    // Automatic theme switching based on time of day (18:00-6:00 = dark, 6:00-18:00 = light)
    // and season (spring/summer → summer theme, autumn → autumn theme, winter → winter theme)
    useEffect(() => {
        if (!isAutoThemeEnabled) return;

        const checkTimeAndUpdateTheme = () => {
            const now = new Date();
            const hour = now.getHours();
            
            // Dark mode: 18:00 (6 PM) to 6:00 (6 AM)
            // Light mode: 6:00 (6 AM) to 18:00 (6 PM)
            const shouldBeDark = hour >= 18 || hour < 6;
            const desiredMode = shouldBeDark ? 'dark' : 'light';
            
            if (isDarkMode !== desiredMode) {
                setIsDarkMode(desiredMode);
            }
            
            // Seasonal color theme switching
            const seasonalTheme = getSeasonalColorTheme() as 'summer' | 'autumn' | 'winter';
            if (colorTheme !== seasonalTheme) {
                setColorTheme(seasonalTheme);
            }
        };

        // Check immediately
        checkTimeAndUpdateTheme();

        // Check every minute for theme changes
        const intervalId = setInterval(checkTimeAndUpdateTheme, 60000);

        return () => clearInterval(intervalId);
    }, [isAutoThemeEnabled, isDarkMode]); // Removed colorTheme to prevent override loops

    const toggleDarkMode = () => {
        // When user manually toggles, disable auto-theme
        setIsAutoThemeEnabled(false);
        localStorage.setItem('autoThemeEnabled', 'false');
        setIsDarkMode(prev => prev === 'light' ? 'dark' : 'light');
    };
    
    // Cycle through color themes: summer → autumn → winter → summer
    const toggleColorTheme = () => {
        // When user manually toggles color theme, disable auto-theme
        setIsAutoThemeEnabled(false);
        localStorage.setItem('autoThemeEnabled', 'false');
        setColorTheme(prev => {
            if (prev === 'summer') return 'autumn';
            if (prev === 'autumn') return 'winter';
            return 'summer';
        });
    };
    
    // Check for personality profile when user logs in
    useEffect(() => {
        if (currentUser && encryptionKey) {
            api.checkPersonalityProfile()
                .then(exists => setHasPersonalityProfile(exists))
                .catch(err => {
                    console.error('Failed to check personality profile:', err);
                    setHasPersonalityProfile(false);
                });
        } else {
            setHasPersonalityProfile(false);
        }
    }, [currentUser, encryptionKey]);
    
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
                    .then(() => {})
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
                if (route === 'unsubscribe') {
                    setView('unsubscribe');
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

    const handlePersonalitySurveyComplete = async (result: SurveyResult) => {
        // Registered users: Save profile without automatic PDF download
        if (currentUser && encryptionKey) {
            setIsSavingProfile(true); // Show loading spinner
            try {
                // First, save the profile without signature
                let encryptedData = await encryptPersonalityProfile(result, encryptionKey);
                
                await api.savePersonalityProfile({
                    testType: result.path,
                    completedLenses: result.completedLenses,
                    filterWorry: result.filter?.worry,
                    filterControl: result.filter?.control,
                    encryptedData,
                    adaptationMode: result.adaptationMode || 'adaptive'
                });
                
                // Automatically set coaching mode based on adaptation choice
                // adaptive → DPFL (profile learns from sessions)
                // stable → DPC (profile used but not modified)
                const newCoachingMode = result.adaptationMode === 'adaptive' ? 'dpfl' : 'dpc';
                try {
                    const { user: updatedUser } = await userService.updateCoachingMode(newCoachingMode);
                    setCurrentUser(updatedUser);
                } catch (coachingModeError) {
                    console.error('Failed to set coaching mode:', coachingModeError);
                    // Non-critical error - profile is saved, coaching mode can be set later
                }
                
                setHasPersonalityProfile(true);
                
                // Automatically generate signature since narratives are already available
                // This provides a complete profile experience without requiring an extra manual step
                let signatureGenerated = false;
                if (result.narratives && result.narratives.flowStory && result.narratives.frictionStory) {
                    try {
                        const narrativeResponse = await api.generateNarrativeProfile({
                            quantitativeData: {
                                testType: result.path,
                                completedLenses: result.completedLenses,
                                filter: result.filter,
                                spiralDynamics: result.spiralDynamics,
                                riemann: result.riemann,
                                big5: result.big5
                            },
                            narratives: result.narratives,
                            language
                        });
                        
                        if (narrativeResponse.narrativeProfile) {
                            // Update result with generated signature
                            result.narrativeProfile = narrativeResponse.narrativeProfile;
                            
                            // Re-encrypt and save with signature
                            encryptedData = await encryptPersonalityProfile(result, encryptionKey);
                            await api.savePersonalityProfile({
                                testType: result.path,
                                completedLenses: result.completedLenses,
                                filterWorry: result.filter?.worry,
                                filterControl: result.filter?.control,
                                encryptedData,
                                adaptationMode: result.adaptationMode || 'adaptive'
                            });
                            signatureGenerated = true;
                        }
                    } catch (signatureError) {
                        console.error('Automatic signature generation failed:', signatureError);
                        // Non-critical - user can generate signature manually later
                    }
                }
                
                setIsSavingProfile(false); // Hide loading spinner
                
                // Inform user about saved profile AND activated coaching mode
                const modeLabel = newCoachingMode === 'dpfl' ? 'DPFL' : 'DPC';
                if (signatureGenerated) {
                    alert(t('personality_survey_success_with_signature', { mode: modeLabel }) || 
                        `Profil und Signatur erstellt! ✨ Coaching-Modus „${modeLabel}" wurde aktiviert.`);
                } else {
                    alert(t('personality_survey_success_with_coaching_mode', { mode: modeLabel }) || 
                        `Profil gespeichert! Coaching-Modus "${modeLabel}" wurde aktiviert. Du kannst jetzt deine Signatur generieren.`);
                }
                
                // Navigate to profile view where user can view signature and download PDF
                setView('personalityProfile');
            } catch (error) {
                setIsSavingProfile(false); // Hide loading spinner on error
                console.error('Profile save failed:', error);
                alert(t('personality_survey_error_save') + ': ' + (error as Error).message);
                // Still navigate to profile view so user can try again
                setView('personalityProfile');
            }
        } 
        // Guest users: Generate and download PDF automatically (they can't save profile)
        else {
            try {
                const htmlContent = formatSurveyResultAsHtml(result, language);
                const filename = generateSurveyPdfFilename(result.path, language);
                
                await generatePDF(htmlContent, filename);
                alert(t('personality_survey_success_downloaded'));
                
                // Navigate back to chat
                setView('chat');
            } catch (error) {
                console.error('PDF generation failed:', error);
                alert(t('personality_survey_error_pdf'));
                setView('chat');
            }
        }
    };

    const handlePiiConfirm = () => {
        setLifeContext(tempContext);
        setTempContext('');
        setView('botSelection');
    };
    
    const handleSelectBot = (bot: Bot) => {
        // Stop any ongoing voice output
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        // Stop server audio if playing
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
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
            if (userMessageCount === 0 && !isTestMode) {
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
                    completedSteps: [],
                    accomplishedGoals: [],
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
                    completedSteps: [],
                    accomplishedGoals: [],
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
        // In test mode, skip the "no messages" check since test scenarios always have messages
        if (userMessageCount === 0 && !isTestMode) {
            setSelectedBot(null);
            setChatHistory([]);
            setView('botSelection');
            return;
        }

        setIsAnalyzing(true);
        try {
            const analysis = await geminiService.analyzeSession(chatHistory, lifeContext, language);

            // Handle "Next Steps" and "Completed Steps" logic.
            const hasNewSteps = analysis.nextSteps && analysis.nextSteps.length > 0;
            const hasCompletedSteps = analysis.completedSteps && analysis.completedSteps.length > 0;
            
            if (hasNewSteps || hasCompletedSteps) {
                // Determine the correct headline based on the document's language.
                const docLang = (lifeContext && lifeContext.match(/^#\s*(Mein\s)?Lebenskontext/im)) ? 'de' : 'en';
                const nextStepsHeadline = docLang === 'de' ? 'Realisierbare nächste Schritte' : 'Achievable Next Steps';
                const deadlineWord = docLang === 'de' ? 'bis' : 'Deadline';

                // Extract existing next steps from the life context.
                const existingStepsRegex = /##\s*✅\s*(Achievable Next Steps|Realisierbare nächste Schritte)\s*\n(?:.*?\n)?((?:\* .*(?:\n|$))*)/i;
                const match = lifeContext?.match(existingStepsRegex);
                let existingStepsLines: string[] = [];
                
                if (match && match[2]) {
                    existingStepsLines = match[2]
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.startsWith('*'));
                }

                // Filter out completed steps from existing steps.
                let remainingSteps = existingStepsLines;
                if (hasCompletedSteps) {
                    const completedStepsNormalized = analysis.completedSteps.map((s: string) => 
                        s.trim().replace(/^\*\s*/, '').toLowerCase()
                    );
                    remainingSteps = existingStepsLines.filter(step => {
                        const stepNormalized = step.replace(/^\*\s*/, '').toLowerCase();
                        return !completedStepsNormalized.some(completed => 
                            stepNormalized.includes(completed) || completed.includes(stepNormalized)
                        );
                    });
                }

                // Format new next steps.
                const newStepsLines = hasNewSteps 
                    ? analysis.nextSteps.map((step: { action: string; deadline: string }) => 
                        `* ${step.action} (${deadlineWord}: ${step.deadline})`
                    )
                    : [];

                // Combine remaining + new steps.
                const allSteps = [...remainingSteps, ...newStepsLines];

                if (allSteps.length > 0) {
                    // If there were completed steps OR existing steps, use 'replace_section' to ensure clean update.
                    // Otherwise, use 'append' for first-time creation.
                    const updateType = (hasCompletedSteps || existingStepsLines.length > 0) ? 'replace_section' : 'append';
                    
                    const nextStepsUpdate: ProposedUpdate = {
                        type: updateType,
                        headline: nextStepsHeadline,
                        content: allSteps.join('\n'),
                    };
                    
                    analysis.proposedUpdates.push(nextStepsUpdate);
                } else if (hasCompletedSteps && existingStepsLines.length > 0) {
                    // All steps were completed. Clear the task list but keep the section structure (headline + subtitle).
                    const nextStepsUpdate: ProposedUpdate = {
                        type: 'replace_section',
                        headline: nextStepsHeadline,
                        content: '', // Empty content = no tasks, but section structure remains
                    };
                    
                    analysis.proposedUpdates.push(nextStepsUpdate);
                }
            }

            setSessionAnalysis(analysis);

            const messageCount = isTestMode ? chatHistory.length : userMessageCount;
            const newState = calculateNewGamificationState(gamificationState, analysis, selectedBot.id, messageCount);
            setNewGamificationState(newState);

            setView('sessionReview');
            
            // For test mode with DPFL/DPC scenarios, calculate refinement preview
            if (isTestMode && testScenarioId) {
                const isDPFLTest = testScenarioId.startsWith('dpfl_') || testScenarioId.startsWith('dpc_');
                if (isDPFLTest && hasPersonalityProfile && encryptionKey) {
                    setIsLoadingRefinementPreview(true);
                    try {
                        const encryptedProfile = await api.loadPersonalityProfile();
                        if (encryptedProfile && encryptedProfile.encryptedData) {
                            const decryptedData = await decryptPersonalityProfile(encryptedProfile.encryptedData, encryptionKey);
                            const profileType = encryptedProfile.testType === 'BIG5' ? 'BIG5' : 'RIEMANN';
                            const profileForRefinement = profileType === 'RIEMANN' 
                                ? decryptedData.riemann 
                                : decryptedData.big5 || decryptedData;
                            
                            if (profileForRefinement) {
                                const preview = await api.previewProfileRefinement({
                                    chatHistory: chatHistory.map(m => ({ role: m.role, text: m.text })),
                                    decryptedProfile: profileForRefinement as Record<string, unknown>,
                                    profileType: profileType as 'RIEMANN' | 'BIG5',
                                    lang: language
                                });
                                setRefinementPreview(preview);
                            } else {
                                setRefinementPreviewError(t('dpfl_test_no_profile') || 'Kein Persönlichkeitsprofil gefunden.');
                            }
                        } else {
                            setRefinementPreviewError(t('dpfl_test_no_profile') || 'Kein Persönlichkeitsprofil gefunden.');
                        }
                    } catch (previewError) {
                        console.error('Failed to calculate refinement preview:', previewError);
                        setRefinementPreviewError(
                            previewError instanceof Error 
                                ? previewError.message 
                                : t('dpfl_test_preview_error') || 'Fehler bei der Berechnung der Profil-Vorschau.'
                        );
                    } finally {
                        setIsLoadingRefinementPreview(false);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to analyze session:", error);
            const fallbackAnalysis: SessionAnalysis = {
                newFindings: "There was an error analyzing the session.",
                proposedUpdates: [],
                nextSteps: [],
                completedSteps: [],
                accomplishedGoals: [],
                solutionBlockages: [],
                blockageScore: 0,
                hasConversationalEnd: false,
                hasAccomplishedGoal: false,
            };
            setSessionAnalysis(fallbackAnalysis);
            const messageCount = isTestMode ? chatHistory.length : userMessageCount;
            const newState = calculateNewGamificationState(gamificationState, fallbackAnalysis, selectedBot.id, messageCount);
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
        // Stop any ongoing voice output
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        // Stop server audio if playing
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        // For test sessions, immediately exit to the admin panel without saving anything.
        // This prevents the test data from polluting the main application state.
        if (isTestMode) {
            setIsTestMode(false);
            setTestScenarioId(null);
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
        // Stop any ongoing voice output
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        // Stop server audio if playing
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        // For test sessions, immediately exit to the admin panel without saving anything.
        if (isTestMode) {
            setIsTestMode(false);
            setTestScenarioId(null);
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
        setTestScenarioId(null);
        
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
        // Set up test mode state
        setIsTestMode(true);
        setMenuView(null); // Close admin menu
        
        // Reset refinement preview state
        setRefinementPreview(null);
        setRefinementPreviewError(null);
        setIsLoadingRefinementPreview(false);
        
        // Load the scenario's chat history and bot
        setChatHistory(scenario.chatHistory);
        setSelectedBot(scenario.bot);
        setLifeContext(adminLifeContext);
        
        // Store scenario info for later use in handleEndSession
        setTestScenarioId(scenario.id);
        
        // Navigate to ChatView to show the simulated conversation
        // Admin can review the chat, then click "End Session" to trigger analysis
        setView('chat');
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
                        analyticsService.trackGuestLogin();
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
            case 'unsubscribe': return <UnsubscribeView token={new URLSearchParams(window.location.search).get('token') || ''} onBack={() => setView('auth')} />;
            case 'contextChoice': return <ContextChoiceView user={currentUser!} savedContext={lifeContext} gamificationState={gamificationState} onContinue={() => { setCameFromContextChoice(true); setView('botSelection'); }} onStartNew={() => { setCameFromContextChoice(false); setLifeContext(''); setView('landing'); }} />;
            case 'paywall': return <PaywallView userEmail={paywallUserEmail} onRedeem={() => { setMenuView(null); setView('redeemCode'); }} onLogout={handleLogout} />;
            case 'landing': return <LandingPage onSubmit={handleFileUpload} onStartQuestionnaire={() => setView('questionnaire')} onStartInterview={handleStartInterview} />;
            case 'piiWarning': return <PIIWarningView onConfirm={handlePiiConfirm} onCancel={() => setView('questionnaire')} />;
            case 'questionnaire': return <Questionnaire onSubmit={handleQuestionnaireSubmit} onBack={() => setView('landing')} answers={questionnaireAnswers} onAnswersChange={setQuestionnaireAnswers} />;
            case 'personalitySurvey': {
                console.log('[App] Rendering PersonalitySurvey with existingProfileForExtension:', existingProfileForExtension);
                return <PersonalitySurvey 
                    onFinish={handlePersonalitySurveyComplete} 
                    onCancel={existingProfileForExtension ? () => setView('personalityProfile') : undefined}
                    currentUser={currentUser} 
                    existingProfile={existingProfileForExtension} 
                />;
            }
            case 'personalityProfile': return (
                <PersonalityProfileView 
                    encryptionKey={encryptionKey}
                    onStartNewTest={(existingProfile?: Partial<SurveyResult>) => {
                        console.log('[App] onStartNewTest called with:', existingProfile);
                        setMenuView(null);
                        setExistingProfileForExtension(existingProfile || null);
                        setView('personalitySurvey');
                    }}
                    currentUser={currentUser}
                    onUserUpdate={setCurrentUser}
                    lifeContext={lifeContext}
                    onEditLifeContext={() => setMenuView('lifeContextEditor')}
                />
            );
            case 'lifeContextEditor': return (
                <LifeContextEditorView
                    lifeContext={lifeContext}
                    onSave={async (newContext: string) => {
                        setLifeContext(newContext);
                        // Save to cloud for registered users
                        if (currentUser && encryptionKey) {
                            try {
                                await userService.saveUserData(newContext, serializeGamificationState(gamificationState), encryptionKey);
                            } catch (error) {
                                console.error("Failed to save edited context:", error);
                            }
                        }
                        setMenuView('personalityProfile');
                    }}
                    onCancel={() => setMenuView('personalityProfile')}
                />
            );
            case 'botSelection': return (
                <BotSelection 
                    onSelect={handleSelectBot} 
                    currentUser={currentUser}
                    hasPersonalityProfile={hasPersonalityProfile}
                    coachingMode={currentUser?.coachingMode || 'off'}
                />
            );
            case 'chat': return (
                <ChatView 
                    bot={selectedBot!} 
                    lifeContext={lifeContext} 
                    chatHistory={chatHistory} 
                    setChatHistory={setChatHistory} 
                    onEndSession={handleEndSession} 
                    onMessageSent={() => setUserMessageCount(c => c + 1)} 
                    currentUser={currentUser} 
                    isNewSession={!cameFromContextChoice}
                    encryptionKey={encryptionKey}
                    isTestMode={isTestMode}
                />
            );
            case 'sessionReview': return <SessionReview {...sessionAnalysis!} originalContext={lifeContext} selectedBot={selectedBot!} onContinueSession={handleContinueSession} onSwitchCoach={handleSwitchCoach} onReturnToStart={handleStartOver} gamificationState={newGamificationState || gamificationState} currentUser={currentUser} isInterviewReview={selectedBot?.id === 'g-interviewer'} interviewResult={tempContext} chatHistory={chatHistory} isTestMode={isTestMode} refinementPreview={refinementPreview} isLoadingRefinementPreview={isLoadingRefinementPreview} refinementPreviewError={refinementPreviewError} hasPersonalityProfile={hasPersonalityProfile} onStartPersonalitySurvey={() => setView('personalitySurvey')} />;
            case 'achievements': return <AchievementsView gamificationState={gamificationState} />;
            case 'userGuide': return <UserGuideView />;
            case 'formattingHelp': return <FormattingHelpView />;
            case 'faq': return <FAQView />;
            case 'about': return <AboutView />;
            case 'disclaimer': return <DisclaimerView />;
            case 'legal': return <LegalView />;
            case 'accountManagement': return <AccountManagementView currentUser={currentUser!} onNavigate={handleNavigateFromMenu} onDeleteAccount={() => setIsDeleteModalOpen(true)} />;
            case 'editProfile': return <EditProfileView currentUser={currentUser!} onBack={() => setMenuView('accountManagement')} onProfileUpdated={(user) => setAndProcessUser(user)} />;
            case 'exportData': return <DataExportView lifeContext={lifeContext} colorTheme={colorTheme} />;
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
                <>
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
                    {/* Spacer for fixed GamificationBar */}
                    <div className={minimalBar ? 'h-16' : 'h-20'} />
                </>
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
            <UpdateNotification onUpdate={updateServiceWorker} />
            {isAnalyzing && <AnalyzingView />}
            {isSavingProfile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadeIn text-center">
                    <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
                    <h1 className="mt-6 text-2xl font-bold text-gray-200">
                        {t('saving_profile_title') || 'Profil wird erstellt...'}
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">
                        {t('saving_profile_subtitle') || 'Deine Signatur wird generiert. Das kann einen Moment dauern.'}
                    </p>
                </div>
            )}
             <DeleteAccountModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)}
                onDeleteSuccess={() => { setIsDeleteModalOpen(false); handleLogout(); }}
            />
        </div>
    );
};

export default App;