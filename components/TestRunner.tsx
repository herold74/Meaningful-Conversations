import React, { useState, useCallback, useMemo } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { Bot, Message, SessionAnalysis } from '../types';
import { BOTS } from '../constants';
import { 
  DynamicTestScenario, 
  TestRunResult, 
  getDynamicTestScenarios,
  getTestableBots,
  getCategoryIcon,
  getCategoryName,
  TestCategory,
  // New multi-select profile imports
  RiemannProfileBlock,
  SDProfileBlock,
  OCEANProfileBlock,
  RIEMANN_PROFILES,
  SD_PROFILES,
  OCEAN_PROFILES,
  combineProfiles,
  CombinedTestProfile
} from '../utils/testScenarios';
import { getApiBaseUrl, getSession } from '../services/api';
import { analyzeSession } from '../services/geminiService';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import Spinner from './shared/Spinner';

interface TestRunnerProps {
  onClose: () => void;
  userProfile?: any; // User's actual personality profile
}

type TestPhase = 'setup' | 'running' | 'analyzing' | 'validation' | 'complete';

const TestRunner: React.FC<TestRunnerProps> = ({ onClose, userProfile }) => {
  const { t, language } = useLocalization();
  
  // Setup state
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<DynamicTestScenario | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<TestCategory | 'all'>('all');
  
  // Multi-select profile state
  const [selectedRiemann, setSelectedRiemann] = useState<RiemannProfileBlock | null>(null);
  const [selectedSD, setSelectedSD] = useState<SDProfileBlock | null>(null);
  const [selectedOCEAN, setSelectedOCEAN] = useState<OCEANProfileBlock | null>(null);
  const [useMyProfile, setUseMyProfile] = useState(false);
  
  // Execution state
  const [phase, setPhase] = useState<TestPhase>('setup');
  const [isRunning, setIsRunning] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [testResult, setTestResult] = useState<TestRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Session analysis state (for session category tests)
  const [sessionAnalysisResult, setSessionAnalysisResult] = useState<SessionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Manual check state
  const [manualCheckResults, setManualCheckResults] = useState<Record<string, boolean | null>>({});
  const [manualNotes, setManualNotes] = useState<Record<string, string>>({});
  
  // Determine which lenses the user profile has
  const userProfileLenses = useMemo(() => {
    if (!userProfile) return [];
    const lenses: string[] = [];
    if (userProfile.riemann || userProfile.completedLenses?.includes('riemann')) lenses.push('riemann');
    if (userProfile.spiralDynamics || userProfile.completedLenses?.includes('sd')) lenses.push('sd');
    if (userProfile.big5 || userProfile.completedLenses?.includes('ocean')) lenses.push('ocean');
    return lenses;
  }, [userProfile]);

  const scenarios = getDynamicTestScenarios(t);
  const bots = getTestableBots();
  const interviewBot = BOTS.find(b => b.id === 'g-interviewer') || null;
  const categories: TestCategory[] = ['core', 'session', 'personality', 'safety', 'bot'];
  
  const filteredScenarios = categoryFilter === 'all' 
    ? scenarios 
    : scenarios.filter(s => s.category === categoryFilter);

  // Handle scenario selection - auto-select interview bot for interview scenario
  const handleScenarioSelect = (scenario: DynamicTestScenario) => {
    setSelectedScenario(scenario);
    if (scenario.id === 'bot_interview' && interviewBot) {
      setSelectedBot(interviewBot);
    } else if (selectedBot?.id === 'g-interviewer') {
      // Clear interview bot if switching away from interview scenario
      setSelectedBot(null);
    }
  };

  // Check if at least one profile option is selected
  const hasProfileSelection = useMemo(() => {
    return useMyProfile || selectedRiemann || selectedSD || selectedOCEAN;
  }, [useMyProfile, selectedRiemann, selectedSD, selectedOCEAN]);

  // Get combined profile name for display
  const getProfileDisplayName = useCallback((): string => {
    if (useMyProfile) return '👤 ' + t('test_runner_my_profile');
    
    const parts: string[] = [];
    if (selectedRiemann) parts.push(selectedRiemann.name);
    if (selectedSD) parts.push(selectedSD.name);
    if (selectedOCEAN) parts.push(selectedOCEAN.name);
    
    return parts.length > 0 ? parts.join(' + ') : t('test_runner_no_profile');
  }, [useMyProfile, selectedRiemann, selectedSD, selectedOCEAN, t]);

  // Get the profile to use for testing
  const getTestProfile = useCallback((): CombinedTestProfile | null => {
    if (useMyProfile && userProfile) {
      // Use the user's actual profile - ensure completedLenses is set
      return {
        ...userProfile,
        completedLenses: userProfile.completedLenses || userProfileLenses
      };
    }
    
    // Combine selected profile blocks
    if (selectedRiemann || selectedSD || selectedOCEAN) {
      return combineProfiles(selectedRiemann, selectedSD, selectedOCEAN);
    }
    
    return null;
  }, [useMyProfile, userProfile, userProfileLenses, selectedRiemann, selectedSD, selectedOCEAN]);

  // Run a single test message
  const runTestMessage = useCallback(async (
    message: string, 
    bot: Bot, 
    profile: any,
    chatHistory: Message[]
  ): Promise<{ response: string; responseTime: number; telemetry?: any }> => {
    const apiBaseUrl = getApiBaseUrl();
    const startTime = Date.now();
    
    const session = getSession();
    if (!session?.token) {
      throw new Error('Not authenticated');
    }
    const token = session.token;

    // Build request with test profile override
    const response = await fetch(`${apiBaseUrl}/api/gemini/chat/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Test-Mode': 'true', // Signal to backend this is a test
      },
      body: JSON.stringify({
        botId: bot.id,
        userMessage: message,
        history: chatHistory,
        lang: language,
        context: '', // Could be extended to test with context
        testProfileOverride: profile, // Backend will use this instead of user's actual profile
        includeTestTelemetry: true, // Request DPC/DPFL telemetry in response
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return {
      response: data.text,
      responseTime,
      telemetry: data.testTelemetry, // DPC/DPFL info from backend
    };
  }, [language]);

  // Fallback follow-up messages for variety when generation fails
  const fallbackFollowUps = useMemo(() => ({
    de: [
      'Das klingt interessant. Kannst du das genauer erklären?',
      'Wie meinst du das konkret?',
      'Was wäre ein nächster Schritt für mich?',
      'Gibt es da noch andere Aspekte zu beachten?',
      'Wie kann ich das in meinem Alltag umsetzen?',
      'Was würdest du mir in dieser Situation empfehlen?',
      'Kannst du mir ein Beispiel dafür geben?',
    ],
    en: [
      'That sounds interesting. Can you explain that in more detail?',
      'What do you mean by that specifically?',
      'What would be a next step for me?',
      'Are there other aspects to consider?',
      'How can I apply this in my daily life?',
      'What would you recommend in this situation?',
      'Can you give me an example of that?',
    ]
  }), []);

  // Generate a dynamic follow-up message based on conversation context
  const generateFollowUpMessage = useCallback(async (
    chatHistory: Message[],
    scenarioDescription: string,
    turnNumber: number,
    botId: string
  ): Promise<string> => {
    const apiBaseUrl = getApiBaseUrl();
    const session = getSession();
    if (!session?.token) {
      throw new Error('Not authenticated');
    }

    // Get last bot response for context
    const lastBotMessage = [...chatHistory].reverse().find(m => m.role === 'bot')?.text || '';
    const lastUserMessage = [...chatHistory].reverse().find(m => m.role === 'user')?.text || '';

    // Build a prompt for generating a contextual follow-up
    const followUpPrompt = language === 'de' 
      ? `WICHTIG: Du bist NICHT der Coach. Du spielst den BENUTZER in einem laufenden Gespräch.

Das Gespräch läuft bereits. Der Coach hat gerade gesagt:
"${lastBotMessage.substring(0, 400)}"

Der Benutzer hatte vorher gesagt:
"${lastUserMessage.substring(0, 200)}"

Thema: ${scenarioDescription}

AUFGABE: Schreibe die nächste Antwort des BENUTZERS (nicht des Coaches!).
- Reagiere auf das, was der Coach gerade gesagt hat
- Teile Gedanken, Gefühle oder stelle eine Nachfrage
- 1-2 Sätze, persönlich und authentisch
- KEINE Begrüßung, KEIN "Willkommen", das Gespräch läuft bereits!

Benutzer-Antwort:`
      : `IMPORTANT: You are NOT the coach. You are playing the USER in an ongoing conversation.

The conversation is already in progress. The coach just said:
"${lastBotMessage.substring(0, 400)}"

The user had previously said:
"${lastUserMessage.substring(0, 200)}"

Topic: ${scenarioDescription}

TASK: Write the USER's next response (not the coach's!).
- React to what the coach just said
- Share thoughts, feelings, or ask a follow-up question
- 1-2 sentences, personal and authentic
- NO greeting, NO "Welcome", the conversation is already ongoing!

User response:`;

    try {
      const response = await fetch(`${apiBaseUrl}/api/gemini/chat/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
          'X-Test-Mode': 'true',
        },
        body: JSON.stringify({
          botId: botId, // Use the selected test bot
          userMessage: followUpPrompt,
          history: [], // Empty history - the prompt contains the context
          lang: language,
          context: '',
          testProfileOverride: null, // No profile override for generation
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedText = data.text?.trim();
        
        // Validate the generated text
        if (generatedText && generatedText.length > 5 && generatedText.length < 500) {
          // Reject if it looks like a coach greeting or bot response
          const lowerText = generatedText.toLowerCase();
          const isCoachResponse = lowerText.includes('willkommen') || 
                                  lowerText.includes('welcome') ||
                                  lowerText.includes('was beschäftigt dich') ||
                                  lowerText.includes('was führt dich') ||
                                  lowerText.includes('schön, dass du') ||
                                  lowerText.includes('lass uns') ||
                                  lowerText.startsWith('ich verstehe');
          
          if (!isCoachResponse) {
            return generatedText;
          }
        }
      }
    } catch (err) {
      console.warn('Follow-up generation failed:', err);
    }

    // Fallback to varied follow-up messages
    const fallbacks = language === 'de' ? fallbackFollowUps.de : fallbackFollowUps.en;
    const fallbackIndex = (turnNumber - 1) % fallbacks.length;
    return fallbacks[fallbackIndex];
  }, [language, fallbackFollowUps]);

  // Run the full test scenario
  const runTest = useCallback(async () => {
    if (!selectedBot || !hasProfileSelection || !selectedScenario) return;

    setPhase('running');
    setIsRunning(true);
    setError(null);
    setCurrentMessageIndex(0);
    
    const profile = getTestProfile();
    const responses: TestRunResult['responses'] = [];
    const chatHistory: Message[] = [];
    let lastTelemetry: any = null;

    try {
      // Add initial bot greeting to simulate realistic conversation start
      // In real conversations, the bot greets first, then the user responds
      const initialGreeting: Message = {
        id: 'test-bot-greeting',
        role: 'bot',
        text: language === 'de' 
          ? 'Hallo! Schön, dass du da bist. Was beschäftigt dich heute?'
          : 'Hello! Nice to see you. What\'s on your mind today?',
        timestamp: new Date().toISOString(),
      };
      chatHistory.push(initialGreeting);

      for (let i = 0; i < selectedScenario.testMessages.length; i++) {
        setCurrentMessageIndex(i);
        const testMsg = selectedScenario.testMessages[i];
        
        // Add user message to history
        const userMessage: Message = {
          id: `test-user-${i}`,
          role: 'user',
          text: testMsg.text,
          timestamp: new Date().toISOString(),
        };
        chatHistory.push(userMessage);

        // Run the API call
        const result = await runTestMessage(testMsg.text, selectedBot, profile, chatHistory);
        
        // Add bot response to history
        const botMessage: Message = {
          id: `test-bot-${i}`,
          role: 'bot',
          text: result.response,
          timestamp: new Date().toISOString(),
        };
        chatHistory.push(botMessage);

        responses.push({
          userMessage: testMsg.text,
          botResponse: result.response,
          responseTime: result.responseTime,
        });

        if (result.telemetry) {
          lastTelemetry = result.telemetry;
        }
      }

      // Dynamic continuation: generate follow-up messages until minConversationTurns is reached
      const minTurns = selectedScenario.minConversationTurns ?? selectedScenario.testMessages.length;
      const enableDynamic = selectedScenario.enableDynamicContinuation ?? false;
      let currentTurn = selectedScenario.testMessages.length;

      if (enableDynamic && currentTurn < minTurns) {
        while (currentTurn < minTurns) {
          setCurrentMessageIndex(currentTurn);
          
          // Generate a contextual follow-up message
          const followUpText = await generateFollowUpMessage(
            chatHistory,
            selectedScenario.description,
            currentTurn + 1,
            selectedBot.id
          );

          // Add generated user message to history
          const userMessage: Message = {
            id: `test-user-dynamic-${currentTurn}`,
            role: 'user',
            text: followUpText,
            timestamp: new Date().toISOString(),
          };
          chatHistory.push(userMessage);

          // Run the API call
          const result = await runTestMessage(followUpText, selectedBot, profile, chatHistory);

          // Add bot response to history
          const botMessage: Message = {
            id: `test-bot-dynamic-${currentTurn}`,
            role: 'bot',
            text: result.response,
            timestamp: new Date().toISOString(),
          };
          chatHistory.push(botMessage);

          responses.push({
            userMessage: followUpText,
            botResponse: result.response,
            responseTime: result.responseTime,
            isDynamic: true, // Mark as dynamically generated
          });

          if (result.telemetry) {
            lastTelemetry = result.telemetry;
          }

          currentTurn++;
        }
      }

      // Build auto-check results
      const autoCheckResults: TestRunResult['autoCheckResults'] = [];
      
      // Check DPC injection
      if (selectedScenario.autoChecks.dpcRequired) {
        const dpcPresent = lastTelemetry?.dpcInjectionPresent ?? false;
        autoCheckResults.push({
          checkId: 'dpc_present',
          passed: dpcPresent,
          details: dpcPresent ? `DPC: ${lastTelemetry?.dpcInjectionLength || 0} chars` : 'No DPC injection found',
        });

        if (selectedScenario.autoChecks.minDpcLength) {
          const lengthOk = (lastTelemetry?.dpcInjectionLength || 0) >= selectedScenario.autoChecks.minDpcLength;
          autoCheckResults.push({
            checkId: 'dpc_length',
            passed: lengthOk,
            details: `Length: ${lastTelemetry?.dpcInjectionLength || 0} / ${selectedScenario.autoChecks.minDpcLength} required`,
          });
        }
      }

      // Check expected keywords
      if (selectedScenario.autoChecks.expectedKeywords?.length) {
        const detectedKeywords = lastTelemetry?.dpflKeywordsDetected || [];
        const expectedFound = selectedScenario.autoChecks.expectedKeywords.filter(
          k => detectedKeywords.some((d: string) => d.toLowerCase().includes(k.toLowerCase()))
        );
        autoCheckResults.push({
          checkId: 'dpfl_keywords',
          passed: expectedFound.length > 0,
          details: `Found: ${expectedFound.join(', ') || 'none'} / Expected: ${selectedScenario.autoChecks.expectedKeywords.join(', ')}`,
        });
      }

      // Check comfort check
      if (selectedScenario.autoChecks.expectComfortCheck) {
        const comfortTriggered = lastTelemetry?.comfortCheckTriggered ?? false;
        autoCheckResults.push({
          checkId: 'comfort_check',
          passed: comfortTriggered,
          details: comfortTriggered ? 'Comfort check was triggered' : 'Comfort check was NOT triggered',
        });
      }

      // Initialize manual check results
      const initialManualResults: Record<string, boolean | null> = {};
      selectedScenario.manualChecks.forEach((check, idx) => {
        initialManualResults[`manual_${idx}`] = null;
      });
      setManualCheckResults(initialManualResults);

      // Build profile ID from selections
      const profileId = useMyProfile 
        ? 'user_profile'
        : [selectedRiemann?.id, selectedSD?.id, selectedOCEAN?.id].filter(Boolean).join('+');

      const result: TestRunResult = {
        scenarioId: selectedScenario.id,
        botId: selectedBot.id,
        profileId: profileId || 'no_profile',
        timestamp: new Date().toISOString(),
        responses,
        telemetry: lastTelemetry,
        autoCheckResults,
        manualCheckResults: selectedScenario.manualChecks.map((check, idx) => ({
          checkId: `manual_${idx}`,
          passed: null,
        })),
      };

      setTestResult(result);
      
      // For session category tests, run session analysis before validation
      if (selectedScenario.category === 'session') {
        setPhase('analyzing');
        setIsAnalyzing(true);
        try {
          const analysis = await analyzeSession(chatHistory, '', language);
          // #region agent log
          fetch(`${getApiBaseUrl()}/api/debug/log`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TestRunner.tsx:session-analysis',message:'Session analysis result',data:{hasConversationalEnd:analysis?.hasConversationalEnd,hasAccomplishedGoal:analysis?.hasAccomplishedGoal,updatesCount:analysis?.proposedUpdates?.length,nextStepsCount:analysis?.nextSteps?.length,newFindings:analysis?.newFindings?.substring(0,100)},timestamp:Date.now(),sessionId:'test-debug'})}).catch(()=>{});
          // #endregion
          setSessionAnalysisResult(analysis);
          
          // Add session analysis auto-checks
          const sessionAutoChecks: TestRunResult['autoCheckResults'] = [];
          
          if (selectedScenario.autoChecks.expectSessionUpdates) {
            const hasUpdates = (analysis?.proposedUpdates?.length ?? 0) > 0;
            const count = analysis?.proposedUpdates?.length ?? 0;
            sessionAutoChecks.push({
              checkId: 'session_updates',
              passed: hasUpdates,
              details: hasUpdates 
                ? t('test_runner_autocheck_updates_found', { count })
                : t('test_runner_autocheck_no_updates'),
            });
          }
          
          if (selectedScenario.autoChecks.expectSessionNextSteps) {
            const hasNextSteps = (analysis?.nextSteps?.length ?? 0) > 0;
            const count = analysis?.nextSteps?.length ?? 0;
            sessionAutoChecks.push({
              checkId: 'session_nextsteps',
              passed: hasNextSteps,
              details: hasNextSteps 
                ? t('test_runner_autocheck_nextsteps_found', { count })
                : t('test_runner_autocheck_no_nextsteps'),
            });
          }
          
          // Update result with session auto-checks
          if (sessionAutoChecks.length > 0) {
            setTestResult(prev => prev ? {
              ...prev,
              autoCheckResults: [...prev.autoCheckResults, ...sessionAutoChecks]
            } : null);
          }
          
        } catch (analysisErr) {
          console.error('Session analysis failed:', analysisErr);
          // Add failed checks for expected session analysis
          const failedChecks: TestRunResult['autoCheckResults'] = [];
          const failedMsg = t('test_runner_autocheck_analysis_failed');
          
          if (selectedScenario.autoChecks.expectSessionUpdates) {
            failedChecks.push({
              checkId: 'session_updates',
              passed: false,
              details: failedMsg,
            });
          }
          
          if (selectedScenario.autoChecks.expectSessionNextSteps) {
            failedChecks.push({
              checkId: 'session_nextsteps',
              passed: false,
              details: failedMsg,
            });
          }
          
          if (failedChecks.length > 0) {
            setTestResult(prev => prev ? {
              ...prev,
              autoCheckResults: [...prev.autoCheckResults, ...failedChecks]
            } : null);
          }
          
          setSessionAnalysisResult(null);
        } finally {
          setIsAnalyzing(false);
        }
      }
      
      setPhase('validation');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
      setPhase('setup');
    } finally {
      setIsRunning(false);
    }
  }, [selectedBot, hasProfileSelection, selectedScenario, getTestProfile, runTestMessage, generateFollowUpMessage, useMyProfile, selectedRiemann, selectedSD, selectedOCEAN, t, language]);

  // Update manual check
  const handleManualCheck = (checkId: string, passed: boolean) => {
    setManualCheckResults(prev => ({ ...prev, [checkId]: passed }));
  };

  // Complete the test
  const completeTest = () => {
    if (!testResult) return;
    
    // Update result with manual checks
    const finalResult: TestRunResult = {
      ...testResult,
      manualCheckResults: Object.entries(manualCheckResults).map(([checkId, passed]) => ({
        checkId,
        passed,
        notes: manualNotes[checkId],
      })),
    };

    // Could save to backend here for test history
    console.log('Test completed:', finalResult);
    setPhase('complete');
  };

  // Render setup phase
  const renderSetup = () => (
    <div className="space-y-6">
      {/* Bot Selection */}
      <div>
        <h4 className="font-semibold mb-2 text-content-primary">1. {t('test_runner_step_bot')}</h4>
        {selectedScenario?.id === 'bot_interview' ? (
          // Interview scenario: Show only interview bot (auto-selected)
          <div className="p-3 rounded-lg border border-accent-primary bg-accent-primary/10">
            <div className="font-medium text-content-primary">🎤 {t('test_runner_interview_bot_name')}</div>
            <div className="text-xs text-content-secondary">{t('test_runner_interview_auto_selected')}</div>
          </div>
        ) : (
          // Normal scenarios: Show all testable bots
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {bots.map(bot => (
              <button
                key={bot.id}
                onClick={() => setSelectedBot(bot)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedBot?.id === bot.id
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-border-secondary hover:border-accent-primary/50'
                }`}
              >
                <div className="font-medium text-content-primary">{bot.name}</div>
                <div className="text-xs text-content-secondary truncate">
                  {language === 'de' ? (bot.style_de || bot.style) : bot.style}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Profile Selection - Multi-Select */}
      <div>
        <h4 className="font-semibold mb-2 text-content-primary">2. {t('test_runner_step_profile')}</h4>
        
        {/* My Profile Option */}
        <div className="mb-4 p-3 border rounded-lg border-border-secondary">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useMyProfile}
              onChange={(e) => {
                setUseMyProfile(e.target.checked);
                if (e.target.checked) {
                  // Clear manual selections when using my profile
                  setSelectedRiemann(null);
                  setSelectedSD(null);
                  setSelectedOCEAN(null);
                }
              }}
              disabled={!userProfile}
              className="mt-1 w-4 h-4 accent-accent-primary"
            />
            <div className={`flex-1 ${!userProfile ? 'opacity-50' : ''}`}>
              <div className="font-medium text-content-primary">👤 {t('test_runner_use_my_profile')}</div>
              <div className="text-xs text-content-secondary">
                {userProfile ? (
                  <>
                    {t('test_runner_uses_all_lenses')}
                    {userProfileLenses.length > 0 && (
                      <span className="ml-1 text-accent-primary">
                        ({userProfileLenses.map(l => l === 'riemann' ? 'Riemann' : l === 'sd' ? 'SD' : 'OCEAN').join(', ')})
                      </span>
                    )}
                  </>
                ) : (
                  t('test_runner_no_profile_available')
                )}
              </div>
            </div>
          </label>
        </div>
        
        {/* Manual Profile Selection - disabled when using my profile */}
        <div className={`space-y-3 ${useMyProfile ? 'opacity-40 pointer-events-none' : ''}`}>
          {/* Riemann Selection */}
          <div className="p-3 border rounded-lg border-border-secondary">
            <div className="text-sm font-medium text-content-primary mb-2">{t('test_runner_riemann_optional')}</div>
            <div className="flex gap-2 flex-wrap">
              {RIEMANN_PROFILES.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedRiemann(selectedRiemann?.id === profile.id ? null : profile)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedRiemann?.id === profile.id
                      ? 'bg-accent-primary text-white'
                      : 'bg-background-tertiary text-content-secondary hover:bg-background-secondary'
                  }`}
                >
                  {profile.name}
                </button>
              ))}
            </div>
          </div>

          {/* Spiral Dynamics Selection */}
          <div className="p-3 border rounded-lg border-border-secondary">
            <div className="text-sm font-medium text-content-primary mb-2">{t('test_runner_sd_optional')}</div>
            <div className="flex gap-2 flex-wrap">
              {SD_PROFILES.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedSD(selectedSD?.id === profile.id ? null : profile)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedSD?.id === profile.id
                      ? 'bg-accent-primary text-white'
                      : 'bg-background-tertiary text-content-secondary hover:bg-background-secondary'
                  }`}
                >
                  {profile.name}
                </button>
              ))}
            </div>
          </div>

          {/* OCEAN Selection */}
          <div className="p-3 border rounded-lg border-border-secondary">
            <div className="text-sm font-medium text-content-primary mb-2">{t('test_runner_ocean_optional')}</div>
            <div className="flex gap-2 flex-wrap">
              {OCEAN_PROFILES.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedOCEAN(selectedOCEAN?.id === profile.id ? null : profile)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedOCEAN?.id === profile.id
                      ? 'bg-accent-primary text-white'
                      : 'bg-background-tertiary text-content-secondary hover:bg-background-secondary'
                  }`}
                >
                  {profile.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selection Summary */}
        {hasProfileSelection && (
          <div className="mt-3 p-2 bg-accent-primary/10 rounded-lg text-sm text-content-primary">
            <strong>{t('test_runner_active')}:</strong> {getProfileDisplayName()}
          </div>
        )}
        
        {!hasProfileSelection && (
          <div className="mt-3 p-2 bg-yellow-500/10 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ {t('test_runner_profile_required')}
          </div>
        )}
      </div>

      {/* Scenario Selection */}
      <div>
        <h4 className="font-semibold mb-2 text-content-primary">3. {t('test_runner_step_scenario')}</h4>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              categoryFilter === 'all'
                ? 'bg-accent-primary text-white'
                : 'bg-background-tertiary text-content-secondary hover:bg-background-secondary'
            }`}
          >
            {t('test_runner_filter_all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                categoryFilter === cat
                  ? 'bg-accent-primary text-white'
                  : 'bg-background-tertiary text-content-secondary hover:bg-background-secondary'
              }`}
            >
              {getCategoryIcon(cat)} {getCategoryName(cat, t)}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredScenarios.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => handleScenarioSelect(scenario)}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                selectedScenario?.id === scenario.id
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border-secondary hover:border-accent-primary/50'
              }`}
            >
              <div className="font-medium text-content-primary">{scenario.name}</div>
              <div className="text-xs text-content-secondary">{scenario.description}</div>
              <div className="flex gap-1 mt-1">
                {scenario.testsFeatures.map(f => (
                  <span key={f} className="px-1.5 py-0.5 bg-background-tertiary rounded text-xs">
                    {f.toUpperCase()}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={runTest}
        disabled={!selectedBot || !hasProfileSelection || !selectedScenario}
        className="w-full py-3 px-6 bg-accent-primary text-white rounded-lg font-semibold
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:bg-accent-primary/90 transition-colors"
      >
        🚀 {t('test_runner_start')}
      </button>
    </div>
  );

  // Render running phase
  const renderRunning = () => {
    const minTurns = selectedScenario?.minConversationTurns ?? selectedScenario?.testMessages.length ?? 0;
    const predefinedCount = selectedScenario?.testMessages.length ?? 0;
    const isDynamicPhase = currentMessageIndex >= predefinedCount;
    const currentMessage = isDynamicPhase 
      ? (language === 'de' ? '🤖 Generiere Follow-up...' : '🤖 Generating follow-up...')
      : `"${selectedScenario?.testMessages[currentMessageIndex]?.text}"`;

    return (
      <div className="text-center py-12">
        <Spinner />
        <h3 className="text-xl font-semibold mt-4 text-content-primary">{t('test_runner_running')}</h3>
        <p className="text-content-secondary mt-2">
          {t('test_runner_message_progress', { current: currentMessageIndex + 1, total: minTurns })}
        </p>
        {isDynamicPhase && (
          <p className="text-accent-primary text-sm mt-1">
            {language === 'de' ? '🔄 Dynamische Fortsetzung' : '🔄 Dynamic continuation'}
          </p>
        )}
        <div className="mt-4 p-4 bg-background-tertiary rounded-lg text-left max-w-md mx-auto">
          <div className="text-sm text-content-secondary mb-1">{t('test_runner_current_message')}:</div>
          <div className="text-content-primary">
            {currentMessage}
          </div>
        </div>
      </div>
    );
  };

  // Render analyzing phase (for session category tests)
  const renderAnalyzing = () => (
    <div className="text-center py-12">
      <Spinner />
      <h3 className="text-xl font-semibold mt-4 text-content-primary">{t('test_runner_analyzing')}</h3>
      <p className="text-content-secondary mt-2">
        {t('test_runner_analyzing_desc')}
      </p>
    </div>
  );

  // Render validation phase
  const renderValidation = () => {
    if (!testResult || !selectedScenario) return null;

    const allManualChecked = Object.values(manualCheckResults).every(v => v !== null);
    const autoPassCount = testResult.autoCheckResults.filter(r => r.passed).length;
    const autoTotalCount = testResult.autoCheckResults.length;
    const manualPassCount = Object.values(manualCheckResults).filter(v => v === true).length;
    const manualTotalCount = selectedScenario.manualChecks.length;

    return (
      <div className="space-y-6">
        {/* Responses */}
        <div>
          <h4 className="font-semibold mb-2 text-content-primary">
            📝 {t('test_runner_responses')} ({testResult.responses.length} {language === 'de' ? 'Austausche' : 'exchanges'})
          </h4>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {testResult.responses.map((r, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${r.isDynamic ? 'bg-accent-primary/10 border border-accent-primary/30' : 'bg-background-tertiary'}`}>
                <div className="flex items-center gap-2 text-sm text-content-secondary mb-1">
                  <span>{t('test_runner_user')}:</span>
                  {r.isDynamic && (
                    <span className="px-1.5 py-0.5 bg-accent-primary/20 text-accent-primary rounded text-xs">
                      {language === 'de' ? '🤖 Dynamisch' : '🤖 Dynamic'}
                    </span>
                  )}
                </div>
                <div className="text-content-primary mb-2 text-sm">{r.userMessage}</div>
                <div className="text-sm text-content-secondary mb-1">
                  Bot <span className="text-xs opacity-70">({r.responseTime}ms)</span>:
                </div>
                <div className="text-content-primary text-sm whitespace-pre-wrap">{r.botResponse}</div>
                {!r.isDynamic && selectedScenario.testMessages[idx]?.expectedBehavior && (
                  <div className="mt-2 p-2 bg-yellow-500/10 rounded text-xs">
                    <span className="font-semibold">{t('test_runner_expected')}:</span> {selectedScenario.testMessages[idx].expectedBehavior}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Telemetry */}
        {testResult.telemetry && (
          <div>
            <h4 className="font-semibold mb-2 text-content-primary">📊 {t('test_runner_telemetry')}</h4>
            <div className="p-3 bg-background-tertiary rounded-lg text-sm space-y-1">
              <div>{t('test_runner_dpc_injection')}: {testResult.telemetry.dpcInjectionPresent ? '✓' : '✗'} ({testResult.telemetry.dpcInjectionLength} chars)</div>
              <div>{t('test_runner_dpc_strategies')}: {testResult.telemetry.dpcStrategiesUsed?.join(', ') || 'N/A'}</div>
              <div>{t('test_runner_dpfl_keywords')}: {testResult.telemetry.dpflKeywordsDetected?.join(', ') || t('test_runner_none')}</div>
              <div>{t('test_runner_comfort_check')}: {testResult.telemetry.comfortCheckTriggered ? '✓ ' + t('test_runner_triggered') : '✗ ' + t('test_runner_not_triggered')}</div>
            </div>
          </div>
        )}

        {/* Session Analysis (for session category tests) */}
        {sessionAnalysisResult && selectedScenario.category === 'session' && (
          <div>
            <h4 className="font-semibold mb-2 text-content-primary">📋 {t('test_runner_session_analysis')}</h4>
            <div className="p-3 bg-background-tertiary rounded-lg text-sm space-y-3">
              {/* Proposed Updates */}
              {sessionAnalysisResult.proposedUpdates.length > 0 && (
                <div>
                  <div className="font-medium text-accent-primary mb-1">✏️ {t('test_runner_proposed_updates')}:</div>
                  <div className="space-y-2 pl-2">
                    {sessionAnalysisResult.proposedUpdates.map((update, idx) => (
                      <div key={idx} className="p-2 bg-background-secondary rounded border-l-2 border-accent-primary">
                        <div className="font-medium text-content-primary">{update.headline}</div>
                        <div className="text-content-secondary text-xs whitespace-pre-wrap mt-1">{update.content}</div>
                        <div className="text-xs text-accent-secondary mt-1">{t('test_runner_type')}: {update.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Next Steps */}
              {sessionAnalysisResult.nextSteps.length > 0 && (
                <div>
                  <div className="font-medium text-accent-primary mb-1">🎯 {t('test_runner_next_steps')}:</div>
                  <ul className="list-disc pl-6 space-y-1">
                    {sessionAnalysisResult.nextSteps.map((step, idx) => (
                      <li key={idx} className="text-content-secondary">
                        {step.action} {step.deadline && <span className="text-xs opacity-70">({step.deadline})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* New Findings */}
              {sessionAnalysisResult.newFindings && (
                <div>
                  <div className="font-medium text-accent-primary mb-1">💡 {t('test_runner_new_findings')}:</div>
                  <div className="text-content-secondary whitespace-pre-wrap">{sessionAnalysisResult.newFindings}</div>
                </div>
              )}
              
              {/* No analysis available */}
              {!sessionAnalysisResult.proposedUpdates.length && !sessionAnalysisResult.nextSteps.length && !sessionAnalysisResult.newFindings && (
                <div className="text-content-secondary italic">{t('test_runner_no_analysis')}</div>
              )}
            </div>
          </div>
        )}

        {/* Auto Checks */}
        {testResult.autoCheckResults.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-content-primary">
              🤖 {t('test_runner_auto_checks')} ({autoPassCount}/{autoTotalCount})
            </h4>
            <div className="space-y-2">
              {testResult.autoCheckResults.map((check, idx) => (
                <div 
                  key={idx}
                  className={`p-2 rounded-lg flex items-center gap-2 ${
                    check.passed ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  {check.passed ? (
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XIcon className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm text-content-primary">{check.details}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Checks */}
        <div>
          <h4 className="font-semibold mb-2 text-content-primary">
            👤 {t('test_runner_manual_checks')} ({manualPassCount}/{manualTotalCount})
          </h4>
          <div className="space-y-2">
            {selectedScenario.manualChecks.map((check, idx) => {
              const checkId = `manual_${idx}`;
              const result = manualCheckResults[checkId];
              
              return (
                <div key={idx} className="p-3 bg-background-tertiary rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleManualCheck(checkId, true)}
                        className={`p-1 rounded transition-colors ${
                          result === true
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 hover:bg-green-100'
                        }`}
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleManualCheck(checkId, false)}
                        className={`p-1 rounded transition-colors ${
                          result === false
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 hover:bg-red-100'
                        }`}
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="text-content-primary text-sm">{check}</div>
                      <input
                        type="text"
                        placeholder={t('test_runner_notes_optional')}
                        value={manualNotes[checkId] || ''}
                        onChange={(e) => setManualNotes(prev => ({ ...prev, [checkId]: e.target.value }))}
                        className="mt-1 w-full px-2 py-1 text-xs bg-background-primary border border-border-secondary rounded"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Complete Button */}
        <button
          onClick={completeTest}
          disabled={!allManualChecked}
          className="w-full py-3 px-6 bg-accent-primary text-white rounded-lg font-semibold
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-accent-primary/90 transition-colors"
        >
          ✓ {t('test_runner_complete')}
        </button>
      </div>
    );
  };

  // Render complete phase
  const renderComplete = () => {
    if (!testResult || !selectedScenario) return null;

    const autoPassCount = testResult.autoCheckResults.filter(r => r.passed).length;
    const autoTotalCount = testResult.autoCheckResults.length;
    const manualPassCount = Object.values(manualCheckResults).filter(v => v === true).length;
    const manualTotalCount = selectedScenario.manualChecks.length;
    const totalPassed = autoPassCount + manualPassCount;
    const totalChecks = autoTotalCount + manualTotalCount;
    const passRate = Math.round((totalPassed / totalChecks) * 100);

    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">
          {passRate >= 80 ? '✅' : passRate >= 50 ? '⚠️' : '❌'}
        </div>
        <h3 className="text-2xl font-bold text-content-primary">
          {t('test_runner_completed')}
        </h3>
        <p className="text-4xl font-bold mt-2 text-accent-primary">
          {passRate}%
        </p>
        <p className="text-content-secondary mt-1">
          {t('test_runner_checks_passed', { passed: totalPassed, total: totalChecks })}
        </p>
        
        <div className="mt-6 p-4 bg-background-tertiary rounded-lg text-left max-w-md mx-auto">
          <div className="text-sm space-y-1">
            <div>{t('test_runner_result_bot')}: <span className="font-medium">{selectedBot?.name}</span></div>
            <div>{t('test_runner_result_profile')}: <span className="font-medium">{getProfileDisplayName()}</span></div>
            <div>{t('test_runner_result_scenario')}: <span className="font-medium">{selectedScenario.name}</span></div>
            <div>{t('test_runner_result_auto')}: <span className="font-medium">{autoPassCount}/{autoTotalCount}</span></div>
            <div>{t('test_runner_result_manual')}: <span className="font-medium">{manualPassCount}/{manualTotalCount}</span></div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => {
              setPhase('setup');
              setTestResult(null);
              setManualCheckResults({});
              setManualNotes({});
              setCurrentMessageIndex(0);
              setError(null);
              setSessionAnalysisResult(null);
              // Reset profile selections
              setSelectedRiemann(null);
              setSelectedSD(null);
              setSelectedOCEAN(null);
              setUseMyProfile(false);
            }}
            className="py-2 px-6 bg-background-tertiary text-content-primary rounded-lg
                       hover:bg-background-secondary transition-colors"
          >
            {t('test_runner_new_test')}
          </button>
          <button
            onClick={onClose}
            className="py-2 px-6 bg-accent-primary text-white rounded-lg
                       hover:bg-accent-primary/90 transition-colors"
          >
            {t('test_runner_close')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background-primary dark:bg-background-secondary rounded-lg shadow-xl max-w-3xl w-full p-6 my-8 animate-fadeIn max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-content-primary">
            🧪 {t('test_runner_title')}
          </h3>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-2 text-content-secondary hover:text-content-primary disabled:opacity-50"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
            ❌ {error}
          </div>
        )}

        {/* Phase Content */}
        {phase === 'setup' && renderSetup()}
        {phase === 'running' && renderRunning()}
        {phase === 'analyzing' && renderAnalyzing()}
        {phase === 'validation' && renderValidation()}
        {phase === 'complete' && renderComplete()}
      </div>
    </div>
  );
};

export default TestRunner;
