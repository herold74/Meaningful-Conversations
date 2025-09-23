import React, { useState, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { BOTS } from './constants';
import { Bot, Message, AppView, View, ProposedUpdate, GamificationState, NavView, SessionAnalysis } from './types';
import { createChatSession, analyzeSession } from './services/geminiService';
import { ALL_ACHIEVEMENTS } from './achievements';

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
import AccessKeyView from './components/AccessKeyView';
import { decrypt } from './utils/encryption';

const App: React.FC = () => {
    const [view, setView] = useState<View>('welcome');
    const [previousAppView, setPreviousAppView] = useState<AppView>('landing');
    const [lifeContext, setLifeContext] = useState<string | null>(null);
    const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [sessionAnalysis, setSessionAnalysis] = useState<SessionAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const DEV_AUTH_BYPASS = false; // Set to true to deactivate access screen for development
    // FIX: Reverted to synchronous state initialization for the developer auth bypass. This ensures the access key is available immediately from the first render, preventing race conditions when handling the initial file upload.
    const [isAuthenticated, setIsAuthenticated] = useState(DEV_AUTH_BYPASS);
    const [accessKey, setAccessKey] = useState(DEV_AUTH_BYPASS ? 'key' : '');
    const [pendingReview, setPendingReview] = useState(false);

    const [gamificationState, setGamificationState] = useState<GamificationState>(() => {
        try {
            const savedState = localStorage.getItem('gamificationState');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                return {
                    ...parsed,
                    unlockedAchievements: new Set(parsed.unlockedAchievements || []),
                    coachesUsed: new Set(parsed.coachesUsed || []),
                };
            }
        } catch (error) {
            console.error("Failed to load gamification state:", error);
        }
        return {
            xp: 0,
            level: 1,
            streak: 0,
            unlockedAchievements: new Set(['beta_pioneer']),
            totalSessions: 0,
            lastSessionDate: null,
            coachesUsed: new Set(),
        };
    });

    useEffect(() => {
        try {
            const stateToSave = {
                ...gamificationState,
                unlockedAchievements: Array.from(gamificationState.unlockedAchievements),
                coachesUsed: Array.from(gamificationState.coachesUsed),
            };
            localStorage.setItem('gamificationState', JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Failed to save gamification state:", error);
        }
    }, [gamificationState]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const nextView = isAuthenticated ? 'landing' : 'access-key';
            setView(prev => prev === 'welcome' ? nextView : prev);
        }, 1500);
        return () => clearTimeout(timer);
    }, [isAuthenticated]);

    // This effect ensures the view transitions to 'session-review' only after all state updates from ending a session are complete.
    useEffect(() => {
        if (pendingReview) {
            setIsAnalyzing(false);
            setView('session-review');
            setPendingReview(false);
        }
    }, [pendingReview, gamificationState]); // Dependency on gamificationState is crucial

    const updateGamificationOnSessionStart = useCallback((botId: string) => {
        setGamificationState(prev => {
            let newStreak = prev.streak;
            
            const todayUTC = new Date();
            // FIX: Corrected the Date.UTC call to use getUTCMonth() instead of getUTCFullYear() for the month parameter. This fixes the streak calculation logic, which was previously always resetting the streak to 1.
            const todayAtUTCmidnight = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate()));
    
            if (prev.lastSessionDate) { // This is a YYYY-MM-DD string from UTC
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
    
            return {
                ...prev,
                streak: newStreak,
                coachesUsed: newCoachesUsed,
            };
        });
    }, []);

    const updateGamificationOnMessage = useCallback(() => {
        setGamificationState(prev => {
            const newXp = prev.xp + 10;
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
                newXp += 50; // Bonus for finishing a session with a defined next step
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
    }, []);


    const handleContextSubmit = (context: string) => {
        const streakMatchRegex = /<!-- do not delete: (.*?) -->/;
        const match = context.match(streakMatchRegex);

        if (match && match[1] && accessKey) {
            try {
                const decrypted = decrypt(match[1], accessKey);
                if (decrypted) {
                    const { streak, lastSessionDate } = JSON.parse(decrypted);
                    setGamificationState(prev => ({
                        ...prev,
                        streak: streak || 0,
                        lastSessionDate: lastSessionDate || null,
                    }));
                }
            } catch (error) {
                console.error("Failed to decrypt or parse streak data:", error);
            }
        }
        
        const streakRemoveRegex = /<!-- do not delete: (.*?) -->/g;
        setLifeContext(context.replace(streakRemoveRegex, '').trim());
        setView('pii-warning');
    };

    const handlePIIConfirm = () => {
        setView('bot-selection');
    };

    const handleBotSelect = (bot: Bot) => {
        if (!lifeContext) return;
        
        updateGamificationOnSessionStart(bot.id);

        const welcomeMessage: Message = {
            id: `bot-welcome-${Date.now()}`,
            text: `Hi! I'm ${bot.name}, your performance coach. I've reviewed your Life Context. What's on your mind today?`,
            role: 'bot',
            timestamp: new Date().toISOString(),
        };

        const history: Message[] = [welcomeMessage];
        const session = createChatSession(bot, lifeContext, []);
        setSelectedBot(bot);
        setChatSession(session);
        setChatHistory(history);
        setView('chat');
    };

    const handleEndSession = async () => {
        if (!lifeContext || chatHistory.length <= 1) { // 1 because of the welcome message
            setView('bot-selection'); // Go back if no real conversation happened
            return;
        }

        setIsAnalyzing(true);
        const analysis = await analyzeSession(chatHistory, lifeContext);
        setSessionAnalysis(analysis);
        updateGamificationOnSessionEnd(analysis.nextSteps);
        setPendingReview(true); // Trigger the useEffect to handle the view change
    };
    
    const handleContinueSession = (newContext: string) => {
        setLifeContext(newContext.replace(/<!-- do not delete: (.*?) -->/g, '').trim());
        if (selectedBot) {
            const newChatSession = createChatSession(selectedBot, newContext, chatHistory);
            setChatSession(newChatSession);
            const continueMessage: Message = {
                id: `bot-continue-${Date.now()}`,
                text: "I've updated your context. What's next?",
                role: 'bot',
                timestamp: new Date().toISOString(),
            };
            setChatHistory(prev => [...prev, continueMessage]);
        }
        setView('chat');
    };

    const handleSwitchCoach = (newContext: string) => {
        setLifeContext(newContext.replace(/<!-- do not delete: (.*?) -->/g, '').trim());
        setChatHistory([]);
        setSelectedBot(null);
        setChatSession(null);
        setSessionAnalysis(null);
        setView('bot-selection');
    };

    const handleRestart = () => {
        setLifeContext(null);
        setSelectedBot(null);
        setChatSession(null);
        setChatHistory([]);
        setSessionAnalysis(null);
        setIsMenuOpen(false);
        setView('landing');
    };

    const handleNavigate = (navView: NavView) => {
        if (view !== 'welcome' && view !== 'access-key' && view !== 'landing' && view !== 'questionnaire' && view !== 'pii-warning' && view !== 'bot-selection' && view !== 'chat' && view !== 'session-review') {
            // it's a NavView, don't update previousAppView
        } else {
             setPreviousAppView(view as AppView); // Assuming we only navigate from AppViews
        }
        setView(navView);
        setIsMenuOpen(false);
    };
    
    const handleBackFromInfo = () => {
        setView(previousAppView);
    };
    
    const handleAccessKeySubmit = (key: string): boolean => {
        if (key === 'key') {
            setIsAuthenticated(true);
            setAccessKey(key);
            setView('landing');
            return true;
        }
        return false;
    };


    const renderView = () => {
        if (view === 'welcome') {
            return <WelcomeScreen />;
        }

        if (!isAuthenticated) {
            return <AccessKeyView onSubmit={handleAccessKeySubmit} />;
        }

        switch (view) {
            case 'landing':
                return <LandingPage onSubmit={handleContextSubmit} onStartQuestionnaire={() => setView('questionnaire')} />;
            case 'questionnaire':
                return <Questionnaire onSubmit={handleContextSubmit} onBack={() => setView('landing')} />;
            case 'pii-warning':
                return <PIIWarningView onConfirm={handlePIIConfirm} onCancel={() => setView('landing')} />;
            case 'bot-selection':
                return <BotSelection bots={BOTS} onSelect={handleBotSelect} />;
            case 'chat':
                if (selectedBot && chatSession) {
                    return <ChatView bot={selectedBot} chatSession={chatSession} chatHistory={chatHistory} setChatHistory={setChatHistory} onEndSession={handleEndSession} onMessageSent={updateGamificationOnMessage}/>;
                }
                return null;
            case 'session-review':
                if (sessionAnalysis && lifeContext && selectedBot) {
                    return (
                        <SessionReview
                            newFindings={sessionAnalysis.newFindings}
                            proposedUpdates={sessionAnalysis.proposedUpdates}
                            nextSteps={sessionAnalysis.nextSteps}
                            originalContext={lifeContext}
                            selectedBot={selectedBot}
                            onContinueSession={handleContinueSession}
                            onSwitchCoach={handleSwitchCoach}
                            onReturnToStart={handleRestart}
                            gamificationState={gamificationState}
                            accessKey={accessKey}
                            isAuthenticated={isAuthenticated}
                        />
                    );
                }
                return null; // Or a loading/error state
            case 'about':
                return <AboutView onBack={handleBackFromInfo} />;
            case 'faq':
                return <FAQView onBack={handleBackFromInfo} />;
            case 'disclaimer':
                return <DisclaimerView onBack={handleBackFromInfo} />;
            case 'terms':
                return <TermsView onBack={handleBackFromInfo} />;
            case 'achievements':
                return <AchievementsView gamificationState={gamificationState} onBack={handleBackFromInfo} />;
            default:
                return <LandingPage onSubmit={handleContextSubmit} onStartQuestionnaire={() => setView('questionnaire')} />;
        }
    };
    
    const isMinimalBar = ['welcome', 'access-key', 'landing', 'questionnaire', 'pii-warning'].includes(view);

    return (
        <div className="bg-gray-950 min-h-screen text-gray-300 font-sans">
            <div className="container mx-auto px-4 py-2">
                {isAuthenticated && (
                     <GamificationBar 
                        gamificationState={gamificationState}
                        onViewAchievements={() => handleNavigate('achievements')}
                        onToggleMenu={() => setIsMenuOpen(true)}
                        minimal={isMinimalBar}
                     />
                )}
                {isAnalyzing && <AnalyzingView />}
                <main>
                    {renderView()}
                </main>
                <BurgerMenu
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    onNavigate={handleNavigate}
                    onRestart={handleRestart}
                />
            </div>
        </div>
    );
};

export default App;