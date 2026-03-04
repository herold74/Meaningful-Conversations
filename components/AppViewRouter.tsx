import React from 'react';
import { Bot, Message, User, GamificationState, NavView, SessionAnalysis } from '../types';
import * as api from '../services/api';
import * as userService from '../services/userService';
import * as geminiService from '../services/geminiService';
import * as analyticsService from '../services/analyticsService';
import { serializeGamificationState } from '../utils/gamificationSerializer';
import { generatePDF, generateSurveyPdfFilename } from '../utils/pdfGeneratorReact';
import { decryptPersonalityProfile } from '../utils/personalityEncryption';
import { downloadTextFile } from '../utils/fileDownload';
import type { Big5Result } from '../utils/bfi2';
import { TranscriptPreAnswers, TranscriptEvaluationResult } from '../types';
import type { UserIntent } from './IntentPickerView';
import type { SurveyResult } from './PersonalitySurvey';
import type { RefinementPreviewResult } from '../services/api';

// Component Imports
import WelcomeScreen from './WelcomeScreen';
import AuthView from './AuthView';
import LoginView from './LoginView';
import RegisterView from './RegisterView';
import RegistrationPendingView from './RegistrationPendingView';
import VerifyEmailView from './VerifyEmailView';
import ForgotPasswordView from './ForgotPasswordView';
import ResetPasswordView from './ResetPasswordView';
import UnsubscribeView from './UnsubscribeView';
import ContextChoiceView from './ContextChoiceView';
import PaywallView from './PaywallView';
import LandingPage from './LandingPage';
import PIIWarningView from './PIIWarningView';
import Questionnaire from './Questionnaire';
import IntentPickerView from './IntentPickerView';
import NamePromptView from './NamePromptView';
import OceanOnboarding from './OceanOnboarding';
import ProfileHintView from './ProfileHintView';
import PersonalitySurvey from './PersonalitySurvey';
import PersonalityProfileView from './PersonalityProfileView';
import LifeContextEditorView from './LifeContextEditorView';
import BotSelection from './BotSelection';
import ChatView from './ChatView';
import SessionReview from './SessionReview';
import TranscriptPreQuestions from './TranscriptPreQuestions';
import TranscriptInput from './TranscriptInput';
import EvaluationReview from './EvaluationReview';
import EvaluationHistory from './EvaluationHistory';
import InterviewTranscriptView from './InterviewTranscriptView';
import TranscriptRecorder from './TranscriptRecorder';
import AchievementsView from './AchievementsView';
import UserGuideView from './UserGuideView';
import FormattingHelpView from './FormattingHelpView';
import FAQView from './FAQView';
import AboutView from './AboutView';
import DisclaimerView from './DisclaimerView';
import LegalView from './LegalView';
import AccountManagementView from './AccountManagementView';
import EditProfileView from './EditProfileView';
import DataExportView from './DataExportView';
import UpgradeView from './UpgradeView';
import RedeemCodeView from './RedeemCodeView';
import AdminView from './AdminView';
import ChangePasswordView from './ChangePasswordView';
import { TestScenario } from '../utils/testScenarios';
import { BOTS } from '../constants';

export interface AppViewRouterProps {
  // Navigation
  view: NavView;
  menuView: NavView | null;
  setView: React.Dispatch<React.SetStateAction<NavView>>;
  setMenuView: React.Dispatch<React.SetStateAction<NavView | null>>;
  setAuthRedirectReason: React.Dispatch<React.SetStateAction<string | null>>;

  // Auth
  authRedirectReason: string | null;
  handleLoginSuccess: (user: User, key: CryptoKey) => Promise<void>;
  handleAccessExpired: (email: string, user: User, key: CryptoKey) => Promise<void>;
  handleLogout: () => void;

  // User & Profile
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setAndProcessUser: (user: User | null) => void;
  encryptionKey: CryptoKey | null;
  lifeContext: string;
  setLifeContext: React.Dispatch<React.SetStateAction<string>>;
  gamificationState: GamificationState;
  setGamificationState: React.Dispatch<React.SetStateAction<GamificationState>>;
  hasPersonalityProfile: boolean;
  existingProfileForExtension: Partial<SurveyResult> | null;
  setExistingProfileForExtension: React.Dispatch<React.SetStateAction<Partial<SurveyResult> | null>>;
  preselectedLensForSurvey: 'sd' | 'riemann' | 'ocean' | null;
  setPreselectedLensForSurvey: React.Dispatch<React.SetStateAction<'sd' | 'riemann' | 'ocean' | null>>;

  // Chat & Session
  selectedBot: Bot | null;
  setSelectedBot: React.Dispatch<React.SetStateAction<Bot | null>>;
  chatHistory: Message[];
  setChatHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  sessionAnalysis: SessionAnalysis | null;
  newGamificationState: GamificationState | null;
  setNewGamificationState: React.Dispatch<React.SetStateAction<GamificationState | null>>;
  tempContext: string;
  setTempContext: React.Dispatch<React.SetStateAction<string>>;
  cameFromContextChoice: boolean;
  setCameFromContextChoice: React.Dispatch<React.SetStateAction<boolean>>;
  userMessageCount: number;
  setUserMessageCount: React.Dispatch<React.SetStateAction<number>>;

  // Transient state
  questionnaireAnswers: Record<string, string>;
  setQuestionnaireAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  paywallUserEmail: string | null;
  setPaywallUserEmail: React.Dispatch<React.SetStateAction<string | null>>;

  // Intent Picker / Bot Selection
  highlightSection: 'management' | 'topicSearch' | null;
  setHighlightSection: React.Dispatch<React.SetStateAction<'management' | 'topicSearch' | null>>;
  postOceanRoute: 'landing' | 'intent';
  setPostOceanRoute: React.Dispatch<React.SetStateAction<'landing' | 'intent'>>;

  // Test mode
  isTestMode: boolean;
  setIsTestMode: React.Dispatch<React.SetStateAction<boolean>>;
  testScenarioId: string | null;
  setTestScenarioId: React.Dispatch<React.SetStateAction<string | null>>;
  shouldOpenTestRunner: boolean;
  setShouldOpenTestRunner: React.Dispatch<React.SetStateAction<boolean>>;

  // Transcript Evaluation
  teStep: 'pre' | 'input' | 'review' | 'history';
  setTeStep: React.Dispatch<React.SetStateAction<'pre' | 'input' | 'review' | 'history'>>;
  tePreAnswers: TranscriptPreAnswers | null;
  setTePreAnswers: React.Dispatch<React.SetStateAction<TranscriptPreAnswers | null>>;
  teEvaluation: TranscriptEvaluationResult | null;
  setTeEvaluation: React.Dispatch<React.SetStateAction<TranscriptEvaluationResult | null>>;
  teIsLoading: boolean;
  setTeIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  tePrefillTranscript: string | null;
  setTePrefillTranscript: React.Dispatch<React.SetStateAction<string | null>>;

  // Refinement preview (DPFL test)
  refinementPreview: RefinementPreviewResult | null;
  isLoadingRefinementPreview: boolean;
  refinementPreviewError: string | null;

  // UI & Layout
  iosSafeAreaTop: number;
  colorTheme: 'summer' | 'autumn' | 'winter';
  language: 'de' | 'en';

  // Handlers
  handleFileUpload: (context: string) => void;
  handleQuestionnaireSubmit: (context: string) => void;
  handlePiiConfirm: () => void;
  handleSelectBot: (bot: Bot) => void;
  handleStartSessionFromEval: (botId: string, examplePrompt: string) => void;
  handleStartInterview: () => void;
  handleIntentSelected: (intent: UserIntent) => void;
  handleOceanOnboardingComplete: (big5: Big5Result) => Promise<void>;
  handleOceanOnboardingSkip: () => void;
  handlePersonalitySurveyComplete: (result: SurveyResult) => void;
  handleEndSession: () => Promise<void>;
  handleContinueSession: (newContext: string, options: { preventCloudSave: boolean }) => Promise<void>;
  handleSwitchCoach: (newContext: string, options: { preventCloudSave: boolean }) => Promise<void>;
  handleStartOver: () => void;
  handleRunTestSession: (scenario: TestScenario, adminLifeContext: string) => Promise<void>;
  handleTestComfortCheck: (withConversationalEnd: boolean) => void;
  handleNavigateFromMenu: (view: NavView) => void;
  onDeleteAccount: () => void;

  // Routing helpers
  applyIntentLogic: (intent: UserIntent | null) => void;
  routeWithIntentPicker: (hasContext: boolean) => Promise<void>;
  buildEmptyLifeContextTemplate: (name: string) => string;

  // Translation
  t: (key: string, params?: Record<string, string>) => string;
}

const AppViewRouter: React.FC<AppViewRouterProps> = (props) => {
  const {
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
    tempContext,
    setTempContext,
    cameFromContextChoice,
    setCameFromContextChoice,
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
    setTestScenarioId,
    setNewGamificationState,
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
    onDeleteAccount,
    applyIntentLogic,
    routeWithIntentPicker,
    buildEmptyLifeContextTemplate,
    t,
  } = props;

  const currentView = menuView || view;

  switch (currentView) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'auth':
      return (
        <AuthView
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
            try {
              localStorage.removeItem('guestName');
            } catch {}
            setLifeContext('');
            setView('intentPicker');
          }}
          redirectReason={authRedirectReason}
        />
      );
    case 'login':
      return (
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onAccessExpired={handleAccessExpired}
          onSwitchToRegister={() => {
            setAuthRedirectReason(null);
            setView('register');
          }}
          onBack={() => {
            setAuthRedirectReason(null);
            setView('auth');
          }}
          onForgotPassword={() => {
            setAuthRedirectReason(null);
            setView('forgotPassword');
          }}
          reason={authRedirectReason}
        />
      );
    case 'register':
      return (
        <RegisterView
          onShowPending={() => setView('registrationPending')}
          onSwitchToLogin={() => setView('login')}
          onBack={() => setView('auth')}
        />
      );
    case 'registrationPending':
      return <RegistrationPendingView onGoToLogin={() => setView('login')} />;
    case 'verifyEmail':
      return <VerifyEmailView onVerificationSuccess={handleLoginSuccess} />;
    case 'forgotPassword':
      return <ForgotPasswordView onBack={() => setView('login')} />;
    case 'resetPassword':
      return <ResetPasswordView onResetSuccess={() => setView('login')} />;
    case 'unsubscribe':
      return (
        <UnsubscribeView
          token={new URLSearchParams(window.location.search).get('token') || ''}
          onBack={() => setView('auth')}
        />
      );
    case 'contextChoice':
      return (
        <ContextChoiceView
          user={currentUser!}
          savedContext={lifeContext}
          gamificationState={gamificationState}
          onContinue={() => {
            setCameFromContextChoice(true);
            setView('botSelection');
          }}
          onStartNew={() => {
            setCameFromContextChoice(false);
            setLifeContext('');
            setView('landing');
          }}
        />
      );
    case 'paywall':
      return (
        <PaywallView
          userEmail={paywallUserEmail}
          userXp={gamificationState.xp}
          currentUser={currentUser}
          safeAreaTop={iosSafeAreaTop}
          onRedeem={() => {
            setMenuView('redeemCode');
          }}
          onPurchaseSuccess={(user) => {
            setAndProcessUser(user);
            setPaywallUserEmail(null);
            routeWithIntentPicker(!!lifeContext);
          }}
          onLogout={handleLogout}
          onDownloadLifeContext={
            lifeContext
              ? async () => {
                  await downloadTextFile(lifeContext, 'life-context.md', 'text/markdown;charset=utf-8');
                }
              : undefined
          }
          onDownloadProfile={
            encryptionKey && hasPersonalityProfile
              ? async () => {
                  try {
                    const profileData = await api.loadPersonalityProfile();
                    if (profileData?.encryptedData) {
                      const decrypted = await decryptPersonalityProfile(profileData.encryptedData, encryptionKey);
                      const surveyResult = {
                        completedLenses: [
                          ...(decrypted.spiralDynamics ? ['sd' as const] : []),
                          ...(decrypted.riemann ? ['riemann' as const] : []),
                          ...(decrypted.big5 ? ['ocean' as const] : []),
                        ],
                        path: (profileData.testType || 'BIG5') as 'RIEMANN' | 'BIG5' | 'SD',
                        filter: undefined,
                        spiralDynamics: decrypted.spiralDynamics,
                        riemann: decrypted.riemann,
                        big5: decrypted.big5,
                        narratives: decrypted.narratives,
                        adaptationMode: decrypted.adaptationMode || 'stable',
                        narrativeProfile: decrypted.narrativeProfile,
                      } as SurveyResult;
                      const filename = generateSurveyPdfFilename(surveyResult.path, language);
                      await generatePDF(surveyResult, filename, language, currentUser?.email);
                    }
                  } catch (err) {
                    console.error('Profile PDF export failed:', err);
                  }
                }
              : undefined
          }
        />
      );
    case 'landing': {
      const isTemplateContext = (() => {
        if (!lifeContext) return false;
        const lines = lifeContext.split('\n');
        const fieldPattern = /^\*\*[^*]+\*\*:\s*(.+)/;
        let filledCount = 0;
        for (const line of lines) {
          const m = line.match(fieldPattern);
          if (m && m[1].trim()) filledCount++;
        }
        return filledCount <= 1;
      })();
      return (
        <LandingPage
          onSubmit={handleFileUpload}
          onStartQuestionnaire={() => setView('questionnaire')}
          onStartInterview={handleStartInterview}
          onEditContext={(ctx) => {
            setLifeContext(ctx);
            setView('lcEditorFromLanding');
          }}
          existingContext={lifeContext || undefined}
          isTemplateContext={isTemplateContext}
        />
      );
    }
    case 'piiWarning':
      return (
        <PIIWarningView
          onConfirm={handlePiiConfirm}
          onCancel={() => setView('questionnaire')}
        />
      );
    case 'questionnaire':
      return (
        <Questionnaire
          onSubmit={handleQuestionnaireSubmit}
          onBack={() => setView('landing')}
          answers={questionnaireAnswers}
          onAnswersChange={setQuestionnaireAnswers}
        />
      );
    case 'lcEditorFromLanding':
      return (
        <LifeContextEditorView
          lifeContext={lifeContext}
          showPiiTips={false}
          title={t('lc_editor_title')}
          description={t('lc_editor_desc')}
          onSave={async (newContext: string) => {
            setLifeContext(newContext);
            if (currentUser && encryptionKey) {
              try {
                await userService.saveUserData(
                  newContext,
                  serializeGamificationState(gamificationState),
                  encryptionKey
                );
              } catch (error) {
                console.error('Failed to save edited context:', error);
              }
            }
            setView('landing');
          }}
          onCancel={() => setView('landing')}
        />
      );
    case 'intentPicker':
      return (
        <IntentPickerView
          onSelect={handleIntentSelected}
          isGuest={!currentUser}
          safeAreaTop={iosSafeAreaTop}
          onSkipPermanently={() => {
            try {
              localStorage.setItem('intentPickerDisabled', 'true');
            } catch {}
            if (!lifeContext) {
              setView('namePrompt');
            } else if (!hasPersonalityProfile) {
              setPostOceanRoute('intent');
              setView('oceanOnboarding');
            } else {
              setView(lifeContext ? 'contextChoice' : 'landing');
            }
          }}
        />
      );
    case 'namePrompt':
      return (
        <NamePromptView
          onContinue={(name) => {
            const template = buildEmptyLifeContextTemplate(name);
            setQuestionnaireAnswers((prev) => ({ ...prev, profile_name: name }));
            setLifeContext(template);
            if (currentUser && encryptionKey) {
              userService
                .saveUserData(template, serializeGamificationState(gamificationState), encryptionKey)
                .catch((e) => console.error('Failed to save initial LC:', e));
              if (!hasPersonalityProfile) {
                setPostOceanRoute('landing');
                setView('oceanOnboarding');
              } else {
                setView('landing');
              }
            } else {
              setView('landing');
            }
          }}
          onSkip={!currentUser ? () => setView('landing') : undefined}
          safeAreaTop={iosSafeAreaTop}
        />
      );
    case 'oceanOnboarding':
      return (
        <OceanOnboarding
          onComplete={handleOceanOnboardingComplete}
          onSkip={handleOceanOnboardingSkip}
          safeAreaTop={iosSafeAreaTop}
        />
      );
    case 'profileHint':
      return (
        <ProfileHintView
          onDiscover={() => {
            setExistingProfileForExtension(null);
            setPreselectedLensForSurvey(null);
            setView('personalitySurvey');
          }}
          onLater={() => applyIntentLogic(null)}
          onDisable={() => {
            try {
              localStorage.setItem('profileHintDisabled', 'true');
            } catch {}
            applyIntentLogic(null);
          }}
          safeAreaTop={iosSafeAreaTop}
        />
      );
    case 'personalitySurvey':
      return (
        <PersonalitySurvey
          onFinish={handlePersonalitySurveyComplete}
          onCancel={
            existingProfileForExtension
              ? () => {
                  setPreselectedLensForSurvey(null);
                  setView('personalityProfile');
                }
              : undefined
          }
          currentUser={currentUser}
          existingProfile={existingProfileForExtension}
          preselectedLens={preselectedLensForSurvey}
        />
      );
    case 'personalityProfile':
      return (
        <PersonalityProfileView
          encryptionKey={encryptionKey}
          onStartNewTest={(existingProfile?: Partial<SurveyResult>, targetLens?: 'sd' | 'riemann' | 'ocean') => {
            setMenuView(null);
            setExistingProfileForExtension(existingProfile || null);
            setPreselectedLensForSurvey(targetLens || null);
            setView('personalitySurvey');
          }}
          currentUser={currentUser}
          onUserUpdate={setCurrentUser}
          lifeContext={lifeContext}
          onEditLifeContext={() => setMenuView('lifeContextEditor')}
        />
      );
    case 'lifeContextEditor':
      return (
        <LifeContextEditorView
          lifeContext={lifeContext}
          onSave={async (newContext: string) => {
            setLifeContext(newContext);
            if (currentUser && encryptionKey) {
              try {
                await userService.saveUserData(
                  newContext,
                  serializeGamificationState(gamificationState),
                  encryptionKey
                );
              } catch (error) {
                console.error('Failed to save edited context:', error);
              }
            }
            setMenuView('personalityProfile');
          }}
          onCancel={() => setMenuView('personalityProfile')}
        />
      );
    case 'botSelection':
      return (
        <BotSelection
          onSelect={handleSelectBot}
          onTranscriptEval={() => {
            setTeStep('pre');
            setTePreAnswers(null);
            setTeEvaluation(null);
            setTePrefillTranscript(null);
            setView('transcriptEval');
          }}
          onTranscriptRecord={() => {
            setView('transcriptRecord');
          }}
          onUpgrade={() => setMenuView('upgrade')}
          onStartSessionWithPrompt={handleStartSessionFromEval}
          currentUser={currentUser}
          hasPersonalityProfile={hasPersonalityProfile}
          coachingMode={currentUser?.coachingMode || 'off'}
          highlightSection={highlightSection}
          onHighlightDone={() => setHighlightSection(null)}
        />
      );
    case 'chat':
      return (
        <ChatView
          bot={selectedBot!}
          lifeContext={lifeContext}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          onEndSession={handleEndSession}
          onMessageSent={() => setUserMessageCount((c) => c + 1)}
          currentUser={currentUser}
          isNewSession={!cameFromContextChoice}
          encryptionKey={encryptionKey}
          isTestMode={isTestMode}
        />
      );
    case 'sessionReview':
      return (
        <SessionReview
          {...sessionAnalysis!}
          originalContext={lifeContext}
          selectedBot={selectedBot!}
          onContinueSession={handleContinueSession}
          onSwitchCoach={handleSwitchCoach}
          onReturnToStart={handleStartOver}
          onReturnToAdmin={(options) => {
            setIsTestMode(false);
            setTestScenarioId(null);
            setNewGamificationState(null);
            setView('admin');
            setMenuView(null);
            if (options?.openTestRunner) {
              setShouldOpenTestRunner(true);
            }
          }}
          gamificationState={newGamificationState || gamificationState}
          currentUser={currentUser}
          isInterviewReview={selectedBot?.id === 'gloria-life-context'}
          interviewResult={tempContext}
          chatHistory={chatHistory}
          isTestMode={isTestMode}
          refinementPreview={refinementPreview}
          isLoadingRefinementPreview={isLoadingRefinementPreview}
          refinementPreviewError={refinementPreviewError}
          hasPersonalityProfile={hasPersonalityProfile}
          onStartPersonalitySurvey={() => setView('personalitySurvey')}
          encryptionKey={encryptionKey}
        />
      );
    case 'transcriptRecord':
      return (
        <TranscriptRecorder
          onBack={() => setView('botSelection')}
          onSubmitToEvaluation={(transcript) => {
            setTePrefillTranscript(transcript);
            setTeStep('pre');
            setTePreAnswers(null);
            setTeEvaluation(null);
            setView('transcriptEval');
          }}
          language={language}
        />
      );
    case 'transcriptEval': {
      const handleTePreSubmit = (answers: TranscriptPreAnswers) => {
        setTePreAnswers(answers);
        setTeStep('input');
      };
      const handleTeTranscriptSubmit = async (transcript: string) => {
        if (!tePreAnswers) return;
        setTeIsLoading(true);
        try {
          let profile = undefined;
          if (hasPersonalityProfile && encryptionKey) {
            try {
              const profileData = await api.loadPersonalityProfile();
              if (profileData?.encryptedData) {
                profile = await decryptPersonalityProfile(profileData.encryptedData, encryptionKey);
              }
            } catch {}
          }
          const result = await geminiService.evaluateTranscript(tePreAnswers, transcript, language, profile);
          setTeEvaluation({ ...result.evaluation, id: result.id });
          setTeStep('review');
        } catch (error) {
          console.error('Transcript evaluation failed:', error);
          alert('Evaluation failed. Please try again.');
        } finally {
          setTeIsLoading(false);
        }
      };

      if (teStep === 'pre') {
        return (
          <TranscriptPreQuestions
            onNext={handleTePreSubmit}
            onBack={() => setView('botSelection')}
            onHistory={() => setTeStep('history')}
          />
        );
      }
      if (teStep === 'input') {
        return (
          <TranscriptInput
            onSubmit={(transcript) => { setTePrefillTranscript(null); handleTeTranscriptSubmit(transcript); }}
            onBack={() => setTeStep('pre')}
            isLoading={teIsLoading}
            initialTranscript={tePrefillTranscript || undefined}
            language={language}
          />
        );
      }
      if (teStep === 'review' && teEvaluation && tePreAnswers) {
        return (
          <EvaluationReview
            evaluation={teEvaluation}
            preAnswers={tePreAnswers}
            currentUser={currentUser || undefined}
            onDone={() => setView('botSelection')}
            onStartSession={handleStartSessionFromEval}
          />
        );
      }
      if (teStep === 'history') {
        return (
          <EvaluationHistory
            onBack={() => setTeStep('pre')}
            currentUser={currentUser || undefined}
            onStartSession={handleStartSessionFromEval}
          />
        );
      }
      return null;
    }
    case 'interviewTranscript':
      return (
        <InterviewTranscriptView
          chatHistory={chatHistory}
          language={language}
          userName={currentUser?.firstName || undefined}
          onBack={() => {
            setSelectedBot(null);
            setChatHistory([]);
            setView('botSelection');
          }}
        />
      );
    case 'achievements':
      return <AchievementsView gamificationState={gamificationState} />;
    case 'userGuide':
      return <UserGuideView currentUser={currentUser} />;
    case 'formattingHelp':
      return <FormattingHelpView />;
    case 'faq':
      return <FAQView />;
    case 'about':
      return <AboutView />;
    case 'disclaimer':
      return <DisclaimerView />;
    case 'legal':
      return <LegalView />;
    case 'accountManagement':
      return (
        <AccountManagementView
          currentUser={currentUser!}
          onNavigate={handleNavigateFromMenu}
          onDeleteAccount={onDeleteAccount}
        />
      );
    case 'editProfile':
      return (
        <EditProfileView
          currentUser={currentUser!}
          onBack={() => setMenuView('accountManagement')}
          onProfileUpdated={(user) => setAndProcessUser(user)}
        />
      );
    case 'exportData':
      return <DataExportView lifeContext={lifeContext} colorTheme={colorTheme} />;
    case 'upgrade':
      return (
        <UpgradeView
          currentUser={currentUser!}
          onPurchaseSuccess={(user) => {
            setAndProcessUser(user);
            setMenuView(null);
          }}
          onRedeem={() => setMenuView('redeemCode')}
        />
      );
    case 'redeemCode':
      return (
        <RedeemCodeView
          onBack={view === 'paywall' ? () => setMenuView(null) : undefined}
          onRedeemSuccess={(user) => {
            setAndProcessUser(user);
            setMenuView(null);
            if (paywallUserEmail) {
              setAuthRedirectReason('Your pass has been applied! Please log in again to continue.');
              setPaywallUserEmail(null);
              setView('login');
            }
          }}
        />
      );
    case 'admin':
      return (
        <AdminView
          currentUser={currentUser}
          encryptionKey={encryptionKey!}
          onRunTestSession={handleRunTestSession}
          onTestComfortCheck={handleTestComfortCheck}
          lifeContext={lifeContext}
          shouldOpenTestRunner={shouldOpenTestRunner}
          onTestRunnerOpened={() => setShouldOpenTestRunner(false)}
        />
      );
    case 'changePassword':
      return (
        <ChangePasswordView
          currentUser={currentUser!}
          encryptionKey={encryptionKey!}
          lifeContext={lifeContext}
        />
      );
    default:
      return <WelcomeScreen />;
  }
};

export default AppViewRouter;
