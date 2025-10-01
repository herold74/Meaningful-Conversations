
import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Message, SessionAnalysis, User, GamificationState, Language } from './types';
import * as userService from './services/userService';
import * as geminiService from './services/geminiService';
import { getSession, clearSession } from './services/api';
import { deserializeGamificationState, serializeGamificationState } from './utils/gamificationSerializer';

// Components (Views)
import WelcomeScreen from './components/WelcomeScreen';
import LandingPage from './components/LandingPage';
import BotSelection from './components/BotSelection';
import ChatView from './components/ChatView';
import SessionReview from './components/SessionReview';
import Questionnaire from './components/Questionnaire';
import PIIWarningView from './components/PIIWarningView';
import ContextChoiceView from './components/ContextChoiceView';
import AuthView from './components/AuthView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import ForgotPasswordView from './components/ForgotPasswordView';
import ChangePasswordView from './components/ChangePasswordView';
import AchievementsView from './components/AchievementsView';
import UserGuideView from './components/UserGuideView';
import FormattingHelpView from './components/FormattingHelpView';
import FAQView from './components/FAQView';
import AboutView from './components/AboutView';
import DisclaimerView from './components/DisclaimerView';
import TermsView from './components/TermsView';
import AdminView from './components/AdminView';
import RedeemCodeView from './components/RedeemCodeView';
import DeleteAccountModal from './components/DeleteAccountModal';

// Shared UI
import GamificationBar from './components/GamificationBar';
import BurgerMenu from './components/BurgerMenu';
import AnalyzingView from './components/AnalyzingView';

// Types
type View =
  | 'loading'
  | 'auth'
  | 'landing'
  | 'contextChoice'
  | 'questionnaire'
  | 'piiWarning'
  | 'botSelection'
  | 'chat'
  | 'sessionReview'
  | 'achievements'
  | 'userGuide'
  | 'formattingHelp'
  | 'faq'
  | 'about'
  | 'disclaimer'
  | 'terms'
  | 'admin'
  | 'redeemCode'
  | 'login'
  | 'register'
  | 'forgotPassword'
  | 'changePassword';

const initialGamificationState: GamificationState = {
  xp: 0,
  level: 1,
  streak: 0,
  totalSessions: 0,
  lastSessionDate: null,
  unlockedAchievements: new Set(),
  coachesUsed: new Set(),
};

const App: React.FC = () => {
    const [view, setView] = useState<View>('loading');
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') as 'light' | 'dark' : null;
        return savedTheme || 'dark';
    });
    
    // User and Session State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [lifeContext, setLifeContext] = useState<string>('');
    const [savedContext, setSavedContext] = useState<string>(''); // Used for context choice screen
    const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [sessionAnalysis, setSessionAnalysis] = useState<SessionAnalysis | null>(null);
    const [gamificationState, setGamificationState] = useState<GamificationState>(initialGamificationState);

    // UI/Flow State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
    const [redirectReason, setRedirectReason] = useState<string | null>(null);
    const [previousView, setPreviousView] = useState<View>('landing');

    // Theme Management
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    // Initial Load Effect
    useEffect(() => {
        const initialize = async () => {
            const session = getSession();
            if (session) {
                setCurrentUser(session.user);
                try {
                    const data = await userService.loadUserData();
                    setLifeContext(data.context || '');
                    setSavedContext(data.context || '');
                    setGamificationState(deserializeGamificationState(data.gamificationState) || initialGamificationState);
                    
                    if (data.context) {
                        setView('contextChoice');
                    } else {
                        setView('landing');
                    }
                } catch (error) {
                    console.error("Failed to load user data, logging out.", error);
                    handleLogout();
                }
            } else {
                setView('auth');
            }
        };
        initialize();
    }, []);

    const updateGamificationState = useCallback((analysis: SessionAnalysis) => {
        setGamificationState(prev => {
            const newState = { ...prev };
            newState.xp += 25; // Base XP for session
            if (analysis.nextSteps.length > 0) newState.xp += 15; // Bonus for action items
            if (analysis.solutionBlockages.length > 0) newState.xp += 10; // Bonus for insights
            
            newState.totalSessions += 1;
            
            if (selectedBot) {
                newState.coachesUsed = new Set(prev.coachesUsed).add(selectedBot.id);
            }

            const today = new Date().toISOString().split('T')[0];
            if (prev.lastSessionDate) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                if (prev.lastSessionDate === yesterdayStr) {
                    newState.streak = prev.streak + 1;
                } else if (prev.lastSessionDate !== today) {
                    newState.streak = 1; // Reset if not consecutive days
                }
            } else {
                newState.streak = 1;
            }
            newState.lastSessionDate = today;

            // Level up logic
            let xpForNextLevel = newState.level * 100;
            while (newState.xp >= (50 * (newState.level - 1) * newState.level) + xpForNextLevel) {
                newState.level += 1;
                xpForNextLevel = newState.level * 100;
            }

            return newState;
        });
    }, [selectedBot]);
    
    // --- Navigation and Flow Handlers ---
    const handleStartWithContext = (context: string) => {
        const data = context.match(/<!-- do not delete: (.*?) -->/);
        let finalContext = context;
        if (data && data[1]) {
            try {
                const decodedState = atob(data[1]);
                const loadedState = deserializeGamificationState(decodedState);
                if (loadedState) {
                    setGamificationState(loadedState);
                }
                finalContext = context.replace(/<!-- do not delete: (.*?) -->\s*/, '');
            } catch (e) {
                console.error("Could not parse gamification state from file.", e);
            }
        }
        setLifeContext(finalContext);
        setView('botSelection');
    };
    
    const handleBotSelection = (bot: Bot) => {
        setSelectedBot(bot);
        const welcomeMessage: Message = {
            id: `bot-welcome-${Date.now()}`,
            text: `Hi, I'm ${bot.name}. How can I help you today?`,
            role: 'bot',
            timestamp: new Date().toISOString()
        };
        setChatHistory([welcomeMessage]);
        setView('chat');
    };

    const handleEndSession = async () => {
        if (!selectedBot || chatHistory.length <= 1) { // <=1 because of welcome message
            setView('botSelection');
            return;
        }

        setIsAnalyzing(true);
        try {
            const analysis = await geminiService.analyzeSession(chatHistory, lifeContext, 'en'); // hardcoded lang for now
            setSessionAnalysis(analysis);
            updateGamificationState(analysis);
            setView('sessionReview');
        } catch (error) {
            console.error("Failed to analyze session:", error);
            // Fallback: allow user to save manually
            setSessionAnalysis({
                newFindings: "There was an error analyzing the session. Please review the conversation and update your context manually.",
                proposedUpdates: [],
                nextSteps: [],
                solutionBlockages: [],
                blockageScore: 0,
                hasConversationalEnd: false,
            });
            setView('sessionReview');
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleSessionReviewContinue = async (newContext: string, options: { preventSave: boolean }) => {
        setLifeContext(newContext);
        if (currentUser && !options.preventSave) {
            await userService.saveUserData(newContext, serializeGamificationState(gamificationState));
        }
        setView('botSelection');
    };

    const handleReturnToStart = () => {
        setLifeContext('');
        setSelectedBot(null);
        setChatHistory([]);
        setSessionAnalysis(null);
        // Do not reset gamification or user
        setView('landing');
    };
    
    const handleNavigate = (targetView: string) => {
        setPreviousView(view);
        setView(targetView as View);
    }
    
    // --- Auth Handlers ---
    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
        // Re-run initialization logic after login
        const initialize = async () => {
            try {
                const data = await userService.loadUserData();
                setLifeContext(data.context || '');
                setSavedContext(data.context || '');
                setGamificationState(deserializeGamificationState(data.gamificationState) || initialGamificationState);
                if (data.context) {
                    setView('contextChoice');
                } else {
                    setView('landing');
                }
            } catch (error) {
                console.error("Failed to load user data after login.", error);
                setView('landing'); // Fallback to landing
            }
        };
        initialize();
    };

    const handleLogout = () => {
        clearSession();
        setCurrentUser(null);
        setLifeContext('');
        setSavedContext('');
        setGamificationState(initialGamificationState);
        setRedirectReason(null);
        setView('auth');
    };
    
    const handleDeleteAccountSuccess = () => {
        setIsDeleteModalOpen(false);
        handleLogout();
    };

    const renderView = () => {
        switch (view) {
            case 'loading': return <WelcomeScreen />;
            case 'auth': return <AuthView onLogin={() => setView('login')} onRegister={() => setView('register')} onGuest={() => setView('landing')} onLoginSuccess={handleLoginSuccess} redirectReason={redirectReason} />;
            case 'login': return <LoginView onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setView('register')} onBack={() => setView('auth')} onForgotPassword={() => setView('forgotPassword')} />;
            case 'register': return <RegisterView onRegisterSuccess={handleLoginSuccess} onSwitchToLogin={() => setView('login')} onBack={() => setView('auth')} />;
            case 'forgotPassword': return <ForgotPasswordView onBack={() => setView('login')} />;
            case 'changePassword': return <ChangePasswordView onBack={() => setView('disclaimer')} currentUser={currentUser!} />;
            
            case 'landing': return <LandingPage onSubmit={(context) => { setLifeContext(context); setView('piiWarning'); }} onStartQuestionnaire={() => setView('questionnaire')} />;
            case 'contextChoice': return <ContextChoiceView user={currentUser!} savedContext={savedContext} onContinue={() => { setLifeContext(savedContext); setView('botSelection'); }} onStartNew={() => { setLifeContext(''); setView('landing'); }} />;
            case 'questionnaire': return <Questionnaire onSubmit={handleStartWithContext} onBack={() => setView('landing')} answers={questionnaireAnswers} onAnswersChange={setQuestionnaireAnswers} />;
            case 'piiWarning': return <PIIWarningView onConfirm={() => handleStartWithContext(lifeContext)} onCancel={() => setView('landing')} />;
            case 'botSelection': return <BotSelection onSelect={handleBotSelection} currentUser={currentUser} />;
            
            case 'chat': return <ChatView bot={selectedBot!} lifeContext={lifeContext} chatHistory={chatHistory} setChatHistory={setChatHistory} onEndSession={handleEndSession} onMessageSent={() => {}} />;
            case 'sessionReview': return <SessionReview {...sessionAnalysis!} originalContext={lifeContext} selectedBot={selectedBot!} onContinueSession={handleSessionReviewContinue} onSwitchCoach={handleSessionReviewContinue} onReturnToStart={handleReturnToStart} gamificationState={gamificationState} currentUser={currentUser} />;

            // Menu Views
            case 'achievements': return <AchievementsView gamificationState={gamificationState} onBack={() => setView(previousView)} />;
            case 'userGuide': return <UserGuideView onBack={() => setView(previousView)} />;
            case 'formattingHelp': return <FormattingHelpView onBack={() => setView(previousView)} />;
            case 'faq': return <FAQView onBack={() => setView(previousView)} />;
            case 'about': return <AboutView onBack={() => setView(previousView)} />;
            case 'disclaimer': return <DisclaimerView onBack={() => setView(previousView)} currentUser={currentUser} onDeleteAccount={() => setIsDeleteModalOpen(true)} />;
            case 'terms': return <TermsView onBack={() => setView(previousView)} />;
            case 'admin': return <AdminView onBack={() => setView(previousView)} />;
            case 'redeemCode': return <RedeemCodeView onBack={() => setView(previousView)} onRedeemSuccess={(user) => { setCurrentUser(user); setView('botSelection'); }} />;

            default: return <LandingPage onSubmit={(context) => { setLifeContext(context); setView('piiWarning'); }} onStartQuestionnaire={() => setView('questionnaire')} />;
        }
    };
    
    const showGamificationBar = !['loading', 'auth', 'login', 'register', 'forgotPassword'].includes(view);

    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 font-sans ${theme}`}>
            {showGamificationBar && (
                 <GamificationBar 
                    gamificationState={gamificationState} 
                    currentUser={currentUser} 
                    onViewAchievements={() => handleNavigate('achievements')} 
                    onToggleMenu={() => setIsMenuOpen(true)}
                    theme={theme}
                    toggleTheme={toggleTheme}
                 />
            )}
             <BurgerMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
             />
             {isAnalyzing && <AnalyzingView />}
             <DeleteAccountModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDeleteSuccess={handleDeleteAccountSuccess}
             />
            <main>
                {renderView()}
            </main>
        </div>
    );
};

export default App;
