import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Message, User, GamificationState, NavView, SessionAnalysis, ProposedUpdate } from './types';
import { useLocalization } from './context/LocalizationContext';
import * as api from './services/api';
import * as userService from './services/userService';
import * as geminiService from './services/geminiService';
import * as analyticsService from './services/analyticsService';
import { deserializeGamificationState, serializeGamificationState } from './utils/gamificationSerializer';
import { getAchievements } from './achievements';
import { TestScenario } from './utils/testScenarios';
import { useIsAnyModalOpen } from './utils/modalUtils';
import { useTheme } from './hooks/useTheme';
import { useAppRouting } from './hooks/useAppRouting';
import { useAuthHandlers } from './hooks/useAuthHandlers';

// Component Imports
import GamificationBar from './components/GamificationBar';
import BurgerMenu from './components/BurgerMenu';
import AnalyzingView from './components/AnalyzingView';
import DeleteAccountModal from './components/DeleteAccountModal';
import UpdateNotification from './components/UpdateNotification';
import AppViewRouter from './components/AppViewRouter';
import { getQuestionnaireStructure } from './components/questionnaireStructure';
import type { Big5Result } from './utils/bfi2';
import type { UserIntent } from './components/IntentPickerView';
import type { SurveyResult } from './components/PersonalitySurvey';
import { TranscriptPreAnswers, TranscriptEvaluationResult } from './types';
import { generatePDF, generateSurveyPdfFilename } from './utils/pdfGeneratorReact';
import { encryptPersonalityProfile, decryptPersonalityProfile } from './utils/personalityEncryption';
import { BOTS } from './constants';
import { updateServiceWorker } from './utils/serviceWorkerUtils';
import PageTransition from './components/shared/PageTransition';
import BrandLoader from './components/shared/BrandLoader';
import { getNextThemeInCycle, HAS_MULTIPLE_THEMES } from './config/themes';
import { brand } from './config/brand';
import { hexToRgb } from './utils/colorUtils';

const DEFAULT_GAMIFICATION_STATE: GamificationState = {
    xp: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
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

    const isIOS = (window as any).Capacitor?.getPlatform?.() === 'ios';
    const useNativeGamificationBar = isIOS;

    // iOS Safe Area calculation (contentInset: 'never' - we manage safe areas manually)
    // Values that clear the clock display
    const getIOSSafeAreaTop = (): number => {
        if (!isIOS) return 0;
        const screenHeight = Math.max(window.screen.height, window.screen.width);
        if (screenHeight >= 932) return 52;  // iPhone 14/15 Pro Max (Dynamic Island)
        if (screenHeight >= 852) return 52;  // iPhone 14/15 Pro (Dynamic Island)
        if (screenHeight >= 844) return 44;  // iPhone 12/13/14/15 (notch)
        if (screenHeight >= 812) return 44;  // iPhone X/XS/11 Pro (notch)
        return 20;
    };
    const iosSafeAreaTop = getIOSSafeAreaTop();

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
    const [shouldOpenTestRunner, setShouldOpenTestRunner] = useState(false);
    const [refinementPreview, setRefinementPreview] = useState<api.RefinementPreviewResult | null>(null);
    const [isLoadingRefinementPreview, setIsLoadingRefinementPreview] = useState(false);
    const [refinementPreviewError, setRefinementPreviewError] = useState<string | null>(null);
    
    // Personality Profile States
    const [hasPersonalityProfile, setHasPersonalityProfile] = useState(false);
    const [existingProfileForExtension, setExistingProfileForExtension] = useState<Partial<SurveyResult> | null>(null);
    const [preselectedLensForSurvey, setPreselectedLensForSurvey] = useState<'sd' | 'riemann' | 'ocean' | null>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Intent Picker / Bot Selection highlight
    const [highlightSection, setHighlightSection] = useState<'management' | 'topicSearch' | null>(null);
    const [postOceanRoute, setPostOceanRoute] = useState<'landing' | 'intent'>('intent');
    const [completedLenses, setCompletedLenses] = useState<string[]>([]);

    // Transcript Evaluation States
    const [teStep, setTeStep] = useState<'pre' | 'input' | 'review' | 'history'>('pre');
    const [tePreAnswers, setTePreAnswers] = useState<TranscriptPreAnswers | null>(null);
    const [teEvaluation, setTeEvaluation] = useState<TranscriptEvaluationResult | null>(null);
    const [teIsLoading, setTeIsLoading] = useState(false);
    const [tePrefillTranscript, setTePrefillTranscript] = useState<string | null>(null);

    const { isDarkMode, setIsDarkMode, colorTheme, setColorTheme, isAutoThemeEnabled, setIsAutoThemeEnabled } = useTheme();

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

    const { loadProfileInfo, applyIntentLogic, routeWithIntentPicker, shouldShowProfileHint, routeWithProfileHint } = useAppRouting({ currentUser, lifeContext, completedLenses, setView, setHighlightSection, setPostOceanRoute, setHasPersonalityProfile, setCompletedLenses });
    const { handleLoginSuccess, handleAccessExpired, handleLogout } = useAuthHandlers({ setAndProcessUser, setEncryptionKey, setLifeContext, setGamificationState, setView, setPaywallUserEmail, setAuthRedirectReason, setMenuView, routeWithIntentPicker, DEFAULT_GAMIFICATION_STATE });

    const toggleDarkMode = () => {
        // When user manually toggles, disable auto-theme
        setIsAutoThemeEnabled(false);
        localStorage.setItem('autoThemeEnabled', 'false');
        setIsDarkMode(prev => prev === 'light' ? 'dark' : 'light');
    };
    
    // Cycle through color themes: summer → autumn → brand → summer (uses getNextThemeInCycle)
    const toggleColorTheme = () => {
        setIsAutoThemeEnabled(false);
        localStorage.setItem('autoThemeEnabled', 'false');
        setColorTheme(prev => getNextThemeInCycle(prev) as 'summer' | 'autumn' | 'brand');
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
        const isQualifiedSession = messageCount >= 5;

        // Bug 5 fix: no XP for sessions with fewer than 5 messages
        let xpGained = 0;
        if (isQualifiedSession) {
            xpGained = (messageCount * 5) + ((analysis?.nextSteps?.length || 0) * 10);
            if (analysis?.hasConversationalEnd) xpGained += 50;
            if (analysis?.hasAccomplishedGoal) xpGained += 25;
        }

        // Bug 3 fix: use local dates instead of UTC to prevent timezone-related streak breaks
        const toLocalDateString = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const now = new Date();
        const today = toLocalDateString(now);

        let newStreak = currentState.streak;
        if (isQualifiedSession) {
            if (currentState.lastSessionDate) {
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                const yesterdayStr = toLocalDateString(yesterday);

                if (currentState.lastSessionDate === yesterdayStr) {
                    newStreak += 1;
                } else if (currentState.lastSessionDate !== today) {
                    newStreak = 1;
                }
            } else {
                newStreak = 1;
            }
        }

        // Bug 2 fix: track longest streak
        const newLongestStreak = Math.max(currentState.longestStreak || 0, newStreak);

        // Bug 4 fix: exclude gloria-life-context from coachesUsed (not a standalone coaching bot)
        const newCoachesUsed = new Set(currentState.coachesUsed);
        if (isQualifiedSession && botId !== 'gloria-life-context') {
            newCoachesUsed.add(botId);
        }

        const newXp = currentState.xp + xpGained;
        const newUnlockedAchievements = new Set(currentState.unlockedAchievements);

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
            longestStreak: newLongestStreak,
            totalSessions: currentState.totalSessions + (isQualifiedSession ? 1 : 0),
            lastSessionDate: isQualifiedSession ? today : currentState.lastSessionDate,
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

    const buildEmptyLifeContextTemplate = (name: string): string => {
        const structure = getQuestionnaireStructure(t);
        let md = `# ${t('questionnaire_main_title')}\n\n`;
        for (const section of structure) {
            md += `## ${section.title}\n`;
            md += section.description ? `*${section.description}*\n\n` : '\n';
            if (section.fields) {
                for (const field of section.fields) {
                    const value = field.id === 'profile_name' ? name : '';
                    md += field.label ? `**${field.label}**: ${value}\n\n` : '\n\n';
                }
            }
            if (section.subSections) {
                for (const sub of section.subSections) {
                    md += `### ${sub.title}\n`;
                    md += sub.description ? `*${sub.description}*\n\n` : '\n';
                    for (const field of sub.fields) {
                        md += field.label ? `**${field.label}**: \n\n` : '\n\n';
                    }
                }
            }
        }
        return md;
    };

    const handleFileUpload = async (context: string) => {
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
        
        const newGamificationState = deserializeGamificationState(gamificationJson);
        setCameFromContextChoice(true);
        setGamificationState(newGamificationState);

        setLifeContext(context);
        setView('botSelection');

        if (currentUser && encryptionKey) {
            try {
                await userService.saveUserData(context, serializeGamificationState(newGamificationState), encryptionKey);
            } catch (error) {
                console.error('Failed to auto-save Life Context after file upload:', error);
            }
        }
    };

    const handleQuestionnaireSubmit = (context: string) => {
        setCameFromContextChoice(false);
        setGamificationState(DEFAULT_GAMIFICATION_STATE);
        setTempContext(context);
        setView('piiWarning');
    };

    const handleIntentSelected = useCallback((intent: UserIntent) => {
        try { localStorage.setItem('userIntent', intent); } catch {}
        analyticsService.trackEvent({ eventType: 'INTENT_SELECTED', metadata: { intent } });

        if (intent === 'communication') setHighlightSection('management');
        else if (intent === 'coaching' || intent === 'lifecoaching') setHighlightSection('topicSearch');
        else setHighlightSection(null);

        // Guest flow
        if (!currentUser) {
            if (!localStorage.getItem('guestName')) {
                setView('namePrompt');
            } else {
                setView('landing');
            }
            return;
        }

        // Registered user: no LC → name prompt first
        if (!lifeContext) {
            setView('namePrompt');
            return;
        }

        // Registered user: LC exists but no profile → OCEAN first
        if (!hasPersonalityProfile) {
            setPostOceanRoute('intent');
            setView('oceanOnboarding');
            return;
        }

        // Registered user: substantial LC + profile → profile hint or intent logic
        routeWithProfileHint(intent);
    }, [currentUser, hasPersonalityProfile, lifeContext, routeWithProfileHint]);

    const routeAfterOcean = useCallback(() => {
        if (postOceanRoute === 'landing') {
            setView('landing');
        } else {
            routeWithProfileHint(null);
        }
    }, [postOceanRoute, routeWithProfileHint]);

    const handleOceanOnboardingComplete = async (big5: Big5Result) => {
        if (!currentUser || !encryptionKey) return;
        try {
            const surveyResult: Partial<SurveyResult> = {
                path: 'BIG5',
                completedLenses: ['ocean'],
                big5,
                adaptationMode: 'adaptive',
            };

            const encryptedData = await encryptPersonalityProfile(surveyResult as SurveyResult, encryptionKey);
            await api.savePersonalityProfile({
                testType: 'BIG5',
                completedLenses: ['ocean'],
                encryptedData,
                adaptationMode: 'adaptive',
            });
            setHasPersonalityProfile(true);
            setCompletedLenses(['ocean']);

            try {
                const { user: updatedUser } = await userService.updateCoachingMode('dpfl');
                setCurrentUser(updatedUser);
            } catch { /* non-critical */ }

            routeAfterOcean();
        } catch (error) {
            console.error('Onboarding profile save failed:', error);
            routeAfterOcean();
        }
    };

    const handleOceanOnboardingSkip = () => {
        routeAfterOcean();
    };

    const handlePersonalitySurveyComplete = async (result: SurveyResult) => {
        // Registered users: Save profile without automatic PDF download
        if (currentUser && encryptionKey) {
            setIsSavingProfile(true); // Show loading spinner
            
            // Determine if we're adding a lens to an existing profile or creating a new one
            const isAddingLens = existingProfileForExtension?.completedLenses && existingProfileForExtension.completedLenses.length > 0;
            
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
                
                // Only set coaching mode on FIRST profile creation, not when adding lenses
                // This prevents accidentally changing the coaching mode when extending the profile
                let newCoachingMode: 'dpfl' | 'dpc' | null = null;
                if (!isAddingLens) {
                    // adaptive → DPFL (profile learns from sessions)
                    // stable → DPC (profile used but not modified)
                    newCoachingMode = result.adaptationMode === 'adaptive' ? 'dpfl' : 'dpc';
                    try {
                        const { user: updatedUser } = await userService.updateCoachingMode(newCoachingMode);
                        setCurrentUser(updatedUser);
                    } catch (coachingModeError) {
                        console.error('Failed to set coaching mode:', coachingModeError);
                        // Non-critical error - profile is saved, coaching mode can be set later
                    }
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
                
                // Show different success messages based on context
                if (isAddingLens) {
                    // Adding a lens to existing profile - find the newly added lens
                    const previousLenses = existingProfileForExtension?.completedLenses || [];
                    const newLens = result.completedLenses?.find(lens => !previousLenses.includes(lens));
                    const lensNameKey = newLens ? `lens_${newLens}_name` : '';
                    const lensName = lensNameKey ? (t(lensNameKey) || newLens || '') : '';
                    
                    alert(t('personality_survey_success_lens_added', { lens: lensName }) || 
                        `${lensName || 'Test'} wurde zu deinem Profil hinzugefügt! ✨`);
                } else {
                    // First profile creation - show coaching mode info
                    const modeLabel = newCoachingMode === 'dpfl' ? 'DPFL' : 'DPC';
                    if (signatureGenerated) {
                        alert(t('personality_survey_success_with_signature', { mode: modeLabel }) || 
                            `Profil und Signatur erstellt! ✨ Coaching-Modus „${modeLabel}" wurde aktiviert.`);
                    } else {
                        alert(t('personality_survey_success_with_coaching_mode', { mode: modeLabel }) || 
                            `Profil gespeichert! Coaching-Modus "${modeLabel}" wurde aktiviert. Du kannst jetzt deine Signatur generieren.`);
                    }
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
                const filename = generateSurveyPdfFilename(result.path, language);
                await generatePDF(result, filename, language, currentUser?.email);
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

    const handlePiiConfirm = async () => {
        setLifeContext(tempContext);
        setTempContext('');
        setView('botSelection');

        if (currentUser && encryptionKey) {
            try {
                await userService.saveUserData(tempContext, serializeGamificationState(gamificationState), encryptionKey);
            } catch (error) {
                console.error('Failed to auto-save Life Context after questionnaire:', error);
            }
        }
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

    const handleStartSessionFromEval = (botId: string, examplePrompt: string) => {
        const bot = BOTS.find(b => b.id === botId);
        if (!bot) return;

        // Stop any ongoing voice output
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => { audio.pause(); audio.currentTime = 0; });

        // Pre-seed chat history with the suggested prompt as a user message.
        // ChatView will detect this and auto-send it to the backend, skipping
        // the bot's standard greeting/open-task check-in.
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            text: examplePrompt,
            role: 'user',
            timestamp: new Date().toISOString(),
        };
        setSelectedBot(bot);
        setChatHistory([userMessage]);
        setUserMessageCount(0);
        setCameFromContextChoice(false);
        setView('chat');
    };
    
    const handleStartInterview = () => {
        const interviewBot = BOTS.find(b => b.id === 'gloria-life-context');
        if (interviewBot) {
            if (!lifeContext) {
                setGamificationState(DEFAULT_GAMIFICATION_STATE);
            }
            handleSelectBot(interviewBot);
        } else {
            console.error("Interview bot 'gloria-life-context' not found in BOTS constant.");
        }
    };

    const handleEndSession = async () => {
        if (!selectedBot) return;
        
        // --- Special Handling for Gloria Interview Bot ---
        if (selectedBot.id === 'gloria-interview') {
            if (userMessageCount === 0 && !isTestMode) {
                setSelectedBot(null);
                setChatHistory([]);
                setView('botSelection');
                return;
            }
            // Route directly to the transcript view with the chat history
            setView('interviewTranscript');
            return;
        }

        // --- Special Handling for Interview Bot "G." (Life Context) ---
        if (selectedBot.id === 'gloria-life-context') {
            if (userMessageCount === 0 && !isTestMode) {
                // If the user exits immediately, go back to the landing page.
                setSelectedBot(null);
                setChatHistory([]);
                setView('landing');
                return;
            }

            setIsAnalyzing(true);
            try {
                const generatedContext = await geminiService.generateContextFromInterview(chatHistory, language, lifeContext || undefined);
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
                    hasSessionGoalAchieved: false,
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
                    hasSessionGoalAchieved: false,
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
                                    language
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
                hasSessionGoalAchieved: false,
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
                // Show error notification to user
                alert(language === 'de' 
                    ? '⚠️ Speichern fehlgeschlagen. Bitte laden Sie Ihren Lebenskontext manuell herunter, um Datenverlust zu vermeiden.' 
                    : '⚠️ Save failed. Please manually download your Life Context to prevent data loss.');
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
            setNewGamificationState(null); // Clear test XP to prevent state pollution
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
            setNewGamificationState(null); // Clear test XP to prevent state pollution
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

    /**
     * Quick test for Comfort Check Modal
     * Bypasses full 20-30 min coaching session by directly navigating to SessionReview
     * with mock data and configurable hasConversationalEnd parameter
     */
    const handleTestComfortCheck = (withConversationalEnd: boolean) => {
        if (currentUser?.coachingMode !== 'dpfl') {
            alert('Comfort Check test requires coachingMode = "dpfl". Please update your user settings.');
            return;
        }

        // Mock SessionAnalysis
        const mockAnalysis: SessionAnalysis = {
            newFindings: "Mock session for Comfort Check testing - this is a simulated coaching session to test the Comfort Check modal functionality.",
            proposedUpdates: [],
            nextSteps: [],
            completedSteps: [],
            accomplishedGoals: [],
            solutionBlockages: [],
            blockageScore: 0,
            hasConversationalEnd: withConversationalEnd,
            hasAccomplishedGoal: false,
            hasSessionGoalAchieved: false,
        };

        // Mock ChatHistory (realistic DPFL session)
        const mockChatHistory: Message[] = [
            { 
                id: `msg-${Date.now()}-1`,
                role: 'user', 
                text: 'Ich möchte über meine Karriereziele sprechen',
                timestamp: new Date(Date.now() - 300000).toISOString()
            },
            { 
                id: `msg-${Date.now()}-2`,
                role: 'bot', 
                text: 'Sehr gerne! Was ist dein aktuelles Karriereziel?',
                timestamp: new Date(Date.now() - 240000).toISOString()
            },
            { 
                id: `msg-${Date.now()}-3`,
                role: 'user', 
                text: 'Ich möchte in den nächsten 2 Jahren Teamleiter werden',
                timestamp: new Date(Date.now() - 180000).toISOString()
            },
            { 
                id: `msg-${Date.now()}-4`,
                role: 'bot', 
                text: 'Ein ambitioniertes Ziel! Was sind deine nächsten Schritte?',
                timestamp: new Date(Date.now() - 120000).toISOString()
            },
            { 
                id: `msg-${Date.now()}-5`,
                role: 'user', 
                text: 'Ich plane, ein Führungskräfte-Seminar zu besuchen',
                timestamp: new Date(Date.now() - 60000).toISOString()
            },
        ];

        // Use Alex (Career Coach) as default DPFL bot
        const alexBot = BOTS.find(b => b.id === 'alex') || BOTS[0];

        // Calculate XP for this mock session
        const newState = calculateNewGamificationState(
            gamificationState,
            mockAnalysis,
            alexBot.id,
            mockChatHistory.length
        );

        // Set state
        setSessionAnalysis(mockAnalysis);
        setChatHistory(mockChatHistory);
        setSelectedBot(alexBot);
        setNewGamificationState(newState);
        setIsTestMode(true); // Mark as test mode
        
        // Set a minimal refinement preview to enable Comfort Check in test mode
        setRefinementPreview({
            success: true,
            isPreviewOnly: true,
            bidirectionalAnalysis: {
                messageCount: mockChatHistory.length
            },
            refinementResult: {
                hasSuggestions: false
            },
            profileType: 'RIEMANN', // Dummy value for test mode
            message: "Quick test mode - no actual refinement suggestions"
        });
        
        setMenuView(null);
        
        // Navigate to SessionReview
        setView('sessionReview');
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

    const appViewRouterProps = {
        view,
        menuView,
        setView,
        setMenuView,
        setAuthRedirectReason,
        authRedirectReason,
        handleLoginSuccess,
        handleAccessExpired,
        handleLogout,
        currentUser,
        setCurrentUser,
        setAndProcessUser,
        encryptionKey,
        lifeContext,
        setLifeContext,
        gamificationState,
        setGamificationState,
        hasPersonalityProfile,
        existingProfileForExtension,
        setExistingProfileForExtension,
        preselectedLensForSurvey,
        setPreselectedLensForSurvey,
        selectedBot,
        setSelectedBot,
        chatHistory,
        setChatHistory,
        sessionAnalysis,
        newGamificationState,
        setNewGamificationState,
        tempContext,
        setTempContext,
        cameFromContextChoice,
        setCameFromContextChoice,
        userMessageCount,
        setUserMessageCount,
        questionnaireAnswers,
        setQuestionnaireAnswers,
        paywallUserEmail,
        setPaywallUserEmail,
        highlightSection,
        setHighlightSection,
        postOceanRoute,
        setPostOceanRoute,
        isTestMode,
        setIsTestMode,
        testScenarioId,
        setTestScenarioId,
        shouldOpenTestRunner,
        setShouldOpenTestRunner,
        teStep,
        setTeStep,
        tePreAnswers,
        setTePreAnswers,
        teEvaluation,
        setTeEvaluation,
        teIsLoading,
        setTeIsLoading,
        tePrefillTranscript,
        setTePrefillTranscript,
        refinementPreview,
        isLoadingRefinementPreview,
        refinementPreviewError,
        iosSafeAreaTop,
        colorTheme,
        language,
        handleFileUpload,
        handleQuestionnaireSubmit,
        handlePiiConfirm,
        handleSelectBot,
        handleStartSessionFromEval,
        handleStartInterview,
        handleIntentSelected,
        handleOceanOnboardingComplete,
        handleOceanOnboardingSkip,
        handlePersonalitySurveyComplete,
        handleEndSession,
        handleContinueSession,
        handleSwitchCoach,
        handleStartOver,
        handleRunTestSession,
        handleTestComfortCheck,
        handleNavigateFromMenu,
        onDeleteAccount: () => setIsDeleteModalOpen(true),
        applyIntentLogic,
        routeWithIntentPicker,
        buildEmptyLifeContextTemplate,
        t,
    };

    const isAnyModalOpen = useIsAnyModalOpen();
    const showGamificationBar = !isAnyModalOpen && !['welcome', 'auth', 'login', 'register', 'forgotPassword', 'registrationPending', 'verifyEmail', 'resetPassword', 'paywall', 'intentPicker', 'oceanOnboarding', 'namePrompt', 'profileHint'].includes(view);
    const minimalBar = ['landing', 'questionnaire', 'piiWarning'].includes(view) && !menuView;
    const nativeBarHeight = minimalBar ? 48 : 60; // Must match Swift: barHeight in NativeGamificationBarView.updateLayout
    const previousViewRef = useRef<NavView>('welcome');
    const nativeSpacerRef = useRef<HTMLDivElement | null>(null);
    const [isLandscape, setIsLandscape] = useState(() => typeof window !== 'undefined' && window.innerWidth > window.innerHeight);
    const effectiveSafeAreaTop = isLandscape ? 0 : iosSafeAreaTop;
    const baseSpacerBarHeight = isLandscape ? (minimalBar ? 48 : 60) : nativeBarHeight;
    const isChatLandscapeNoSpacer = false;
    const spacerBarHeight = baseSpacerBarHeight;

    useEffect(() => {
        const handleResize = () => {
            const nextIsLandscape = window.innerWidth > window.innerHeight;
            setIsLandscape(nextIsLandscape);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (view !== 'achievements') {
            previousViewRef.current = view;
        }
    }, [view]);

    // Scroll to top on every view change so the heading is always visible.
    // Chat view is excluded because it manages its own scroll (bottom-anchored).
    useEffect(() => {
        if (view !== 'chat') {
            window.scrollTo(0, 0);
        }
    }, [view]);

    const handleNativeGamificationBarAction = useCallback((action: string) => {
        if (action === 'menu') {
            handleBurgerIconClick();
            return;
        }
        if (action === 'achievements') {
            const isAchievementsOpen = view === 'achievements' || menuView === 'achievements';
            const targetView = isAchievementsOpen ? (previousViewRef.current || view || 'botSelection') : 'achievements';
            if (isAchievementsOpen) {
                setMenuView(null);
                setView(targetView);
            } else {
                handleNavigateFromMenu('achievements');
            }
            return;
        }
        if (action === 'theme') {
            toggleDarkMode();
            return;
        }
        if (action === 'colorTheme') {
            toggleColorTheme();
            return;
        }
    }, [handleBurgerIconClick, handleNavigateFromMenu, toggleColorTheme, toggleDarkMode, view, menuView, isMenuOpen]);

    useEffect(() => {
        if (!useNativeGamificationBar) return;
        (window as any).nativeGamificationBarAction = handleNativeGamificationBarAction;
        return () => {
            delete (window as any).nativeGamificationBarAction;
        };
    }, [handleNativeGamificationBarAction, useNativeGamificationBar]);

    useEffect(() => {
        if (!useNativeGamificationBar) return;
        const nativeBar = (window as any).Capacitor?.Plugins?.NativeGamificationBar;

        const level = gamificationState.level ?? 1;
        const xp = gamificationState.xp ?? 0;
        const streak = gamificationState.streak ?? 0;
        const xpToReachCurrentLevel = 50 * (level - 1) * level;
        const xpForNextLevel = level * 100;
        const currentLevelXp = xp - xpToReachCurrentLevel;
        const progress = xpForNextLevel > 0 ? currentLevelXp / xpForNextLevel : 0;

        const payload: Record<string, unknown> = {
            visible: showGamificationBar,
            minimal: minimalBar,
            view,
            activeView: menuView || view,
            menuView: menuView || null,
            colorTheme,
            levelText: `${t('gamificationBar_level')} ${level}`,
            streakText: `${t('gamificationBar_streak')} ${streak}`,
            xpText: `${currentLevelXp}/${xpForNextLevel} XP`,
            progress,
            isMenuOpen,
            isDarkMode: isDarkMode === 'dark',
        };
        payload.showColorThemeToggle = HAS_MULTIPLE_THEMES;
        if (colorTheme === 'brand') {
            payload.brandAccentRgbLight = hexToRgb(brand.color3);
            payload.brandAccentRgbDark = hexToRgb(brand.color1);
        }

        if (!nativeBar?.setState) {
            return;
        }

        nativeBar.setState(payload).then(() => {
        }).catch((error: unknown) => {
            void error;
        });
    }, [gamificationState, isDarkMode, isMenuOpen, minimalBar, showGamificationBar, t, useNativeGamificationBar, view, menuView, colorTheme]);

    return (
        <div className={`font-sans ${view === 'chat' ? 'h-screen flex flex-col' : 'min-h-screen'}`}>
            {showGamificationBar && !useNativeGamificationBar && (
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
                    {/* Spacer for fixed web GamificationBar */}
                    {/* Chat gets extra spacer height (6rem) due to input bar; minimalBar is never true for chat view */}
                    <div style={{ height: view === 'chat'
                        ? `calc(6rem + ${iosSafeAreaTop}px)`
                        : (minimalBar ? `calc(4rem + ${iosSafeAreaTop}px)` : `calc(5rem + ${iosSafeAreaTop}px)`)
                    }} />
                </>
            )}
            {showGamificationBar && useNativeGamificationBar && (
                <div ref={nativeSpacerRef} style={{ height: `calc(${spacerBarHeight}px + ${effectiveSafeAreaTop}px + 20px)` }} />
            )}
            <main className={`container mx-auto px-4 ${view === 'chat' ? 'flex-1 min-h-0 py-0' : ''}`}>
                <PageTransition viewKey={menuView || view}>
                    <AppViewRouter {...appViewRouterProps} />
                </PageTransition>
            </main>
            <BurgerMenu 
                isOpen={isMenuOpen}
                onClose={handleCloseAllMenus}
                currentUser={currentUser}
                onNavigate={handleNavigateFromMenu}
                onLogout={handleLogout}
                onStartOver={handleStartOver}
                showProfileBadge={currentUser?.isPremium && completedLenses.includes('ocean') && (!completedLenses.includes('sd') || !completedLenses.includes('riemann'))}
            />
            <UpdateNotification onUpdate={updateServiceWorker} />
            {isAnalyzing && <AnalyzingView />}
            {isSavingProfile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadeIn text-center">
                    <BrandLoader size="lg" />
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