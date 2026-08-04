import React from 'react';

export type Language = 'en' | 'de';

export type NavView =
    | 'welcome'
    | 'auth'
    | 'login'
    | 'register'
    | 'registrationPending'
    | 'verifyEmail'
    | 'forgotPassword'
    | 'resetPassword'
    | 'unsubscribe'
    | 'landing'
    | 'piiWarning'
    | 'questionnaire'
    | 'botSelection'
    | 'chat'
    | 'sessionReview'
    | 'contextChoice'
    | 'paywall'
    | 'achievements'
    | 'userGuide'
    | 'formattingHelp'
    | 'faq'
    | 'about'
    | 'disclaimer'
    | 'legal'
    | 'accountManagement'
    | 'editProfile'
    | 'redeemCode'
    | 'upgrade'
    | 'admin'
    | 'changePassword'
    | 'exportData'
    | 'personalitySurvey'
    | 'personalityProfile'
    | 'lifeContextEditor'
    | 'transcriptEval'
    | 'transcriptRecord'
    | 'interviewTranscript'
    | 'oceanOnboarding'
    | 'intentPicker'
    | 'namePrompt'
    | 'lcEditorFromLanding'
    | 'lcEditorFromContextChoice'
    | 'profileHint'
    | 'practiceSetup'
    | 'practiceChat'
    | 'practiceSelfRating'
    | 'practiceReview'
    | 'practicePhase2Picker'
    | 'practiceHistory'
    | 'practiceProgress';

export type CoachingMode = 'off' | 'dpc' | 'dpfl';

export interface User {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    preferredLanguage?: string;
    newsletterConsent?: boolean;
    newsletterConsentDate?: string | null;
    isPremium: boolean;
    isClient?: boolean;
    isAdmin: boolean;
    isDeveloper?: boolean;
    unlockedCoaches: string[];
    createdAt?: string;
    accessExpiresAt?: string;
    premiumExpiresAt?: string;
    hasPracticeAccess?: boolean;
    practiceExpiresAt?: string;
    loginCount?: number;
    lastLogin?: string;
    encryptionSalt?: string; // Hex-encoded string
    gamificationState?: string;
    status?: 'PENDING' | 'ACTIVE';
    coachingMode?: CoachingMode; // off = standard coaching, dpc = profile used but not refined, dpfl = profile used and refined
    hasPersonalityProfile?: boolean;
    completedLenses?: string[];
}

export type BotAccessTier = 'guest' | 'registered' | 'premium' | 'client';

export interface Bot {
    id: string;
    name: string;
    description: string;
    description_de: string;
    avatar: string;
    style: string;
    style_de: string;
    accessTier: BotAccessTier;
}

export interface BotWithAvailability extends Bot {
    isAvailable: boolean;
}

export interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
    timestamp: string;
    llmProvider?: string | null;
    /** Parsed from trailing [REFERRAL:id,...] marker (stripped from text). */
    referralBotIds?: string[];
    /** Parsed from [AUDIT_TASK]...[/AUDIT_TASK] block (stripped from text). */
    auditTaskPayload?: string | null;
}

export interface GamificationState {
    xp: number;
    level: number;
    streak: number;
    longestStreak: number;
    totalSessions: number;
    lastSessionDate: string | null;
    unlockedAchievements: Set<string>;
    coachesUsed: Set<string>;
}

export interface ProposedUpdate {
    type: 'append' | 'replace_section' | 'create_headline';
    headline: string;
    content: string;
}

export interface SolutionBlockage {
    blockage: string;
    explanation: string;
    quote: string;
}

export interface SessionAnalysis {
    newFindings: string;
    proposedUpdates: ProposedUpdate[];
    nextSteps: { action: string; deadline: string }[];
    completedSteps: string[];
    accomplishedGoals: string[];
    solutionBlockages: SolutionBlockage[];
    blockageScore: number;
    hasConversationalEnd: boolean;
    hasAccomplishedGoal: boolean;
    hasSessionGoalAchieved: boolean;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    isUnlocked: (state: GamificationState) => boolean;
}

export interface UpgradeCode {
    id: string;
    code: string;
    botId: string;
    referrer?: string;
    isUsed: boolean;
    createdAt: string;
    usedBy?: { email: string };
}

export interface Ticket {
    id: string;
    type: 'PASSWORD_RESET';
    status: 'OPEN' | 'RESOLVED';
    payload: { email: string };
    createdAt: string;
}

export interface Feedback {
    id: string;
    rating: number | null;
    comments: string;
    botId: string;
    lastUserMessage: string | null;
    botResponse: string | null;
    isAnonymous: boolean;
    llmProvider: string | null;
    createdAt: string;
    user: { email: string } | null;
    guestEmail?: string | null;
}

export interface CalendarEvent {
    action: string;
    deadline: string;
    description?: string;
}

// Transcript Evaluation types
export interface TranscriptPreAnswers {
    situationName: string;
    goal: string;
    personalTarget: string;
    assumptions: string;
    satisfaction: number; // 1-5
    difficult?: string;
}

export interface BotRecommendationEntry {
    botId: string;
    botName: string;
    rationale: string;
    examplePrompt: string;
    requiredTier: 'guest' | 'premium' | 'client';
}

export interface BotRecommendation {
    developmentArea: string;
    primary: BotRecommendationEntry;
    secondary: BotRecommendationEntry;
}

export interface TranscriptEvaluationResult {
    summary: string;
    goalAlignment: { score: number; evidence: string; gaps: string };
    behavioralAlignment: { score: number; evidence: string; blindspotEvidence: string[] };
    assumptionCheck: { confirmed: string[]; challenged: string[]; newInsights: string[] };
    calibration: { selfRating: number; evidenceRating: number; delta: string; interpretation: string };
    personalityInsights: { dimension: string; observation: string; recommendation: string }[];
    strengths: string[];
    developmentAreas: string[];
    nextSteps: { action: string; rationale: string }[];
    botRecommendations?: BotRecommendation[];
    contextUpdates: ProposedUpdate[];
    overallScore: number; // 1-10
    // User rating fields
    id?: string;
    userRating?: number | null;
    userFeedback?: string | null;
    contactOptIn?: boolean;
}

export interface TranscriptEvaluationResponse {
    id: string;
    evaluation: TranscriptEvaluationResult;
    durationMs: number;
}

export interface TranscriptEvaluationSummary {
    id: string;
    createdAt: string;
    language: string;
    goal: string;
    summary: string;
    overallScore: number;
    preAnswers: TranscriptPreAnswers;
    evaluationData: TranscriptEvaluationResult;
    // User rating fields
    userRating?: number | null;
    userFeedback?: string | null;
    contactOptIn?: boolean;
}

export type PracticeDifficulty = 'easy' | 'moderate' | 'challenging' | 'hard';

export type PracticeMode = 'method' | 'contracting' | 'free-play';

/** Context carried from Phase 1 (contracting) into Phase 2 (method or free-play). */
export interface PracticePhase2Context {
    scenarioId: string;
    coacheeName: string;
    coacheeAvatar: string;
    coacheeGender?: 'male' | 'female';
    difficulty: PracticeDifficulty;
    difficultyLabel: string;
    liveMode: boolean;
    priorTranscript: string;
    clarifiedConcern: string;
    sessionContract?: string;
}

export type ScopeBoundaryTheme =
    | 'trauma'
    | 'addiction'
    | 'clinical-depression'
    | 'eating-disorder'
    | 'acute-distress';

export interface PracticeUnlocks {
    /** Framework+scenario pairs where a Challenging session was completed (unlocks Hard + Live). */
    hardUnlockedPairs: PracticeDefaultPair[];
    /** Admin/developer: Hard/Live always available for any pair. */
    privileged?: boolean;
}

export type PracticeMatchTier = 'primary' | 'alternative' | 'neutral' | 'discouraged';

export interface PracticeDefaultPair {
    frameworkId: string;
    scenarioId: string;
}

export interface PracticeFrameworkStage {
    id: string;
    name: string;
    description: string;
}

export interface PracticeFrameworkExplainer {
    summary: string;
    why: string;
    goodCompliance: string;
}

export interface PracticeFramework {
    id: string;
    sourceBotId: string | null;
    isPracticeOnly: boolean;
    name: string;
    shortDescription: string;
    stages: PracticeFrameworkStage[];
    complianceCriteria: string[];
    explainer: PracticeFrameworkExplainer;
    scenarioMatches?: Record<string, PracticeMatchTier>;
    clientOnly?: boolean;
    locked?: boolean;
    lockReason?: 'client_required' | null;
}

export interface PracticeScenario {
    id: string;
    coacheeName: string;
    avatar: string;
    /** TTS voice gender — derived from coach avatar persona when omitted. */
    coacheeGender?: 'male' | 'female';
    concern: string;
    emotionalTone: string;
    frameworkMatches?: Record<string, PracticeMatchTier>;
    discouragedReasons?: Record<string, string>;
}

export interface PracticeCatalog {
    frameworks: PracticeFramework[];
    scenarios: PracticeScenario[];
    defaultPair?: PracticeDefaultPair;
    difficulties: { id: PracticeDifficulty; label: string; locked?: boolean }[];
    unlocks: PracticeUnlocks;
}

export interface CoachPracticeConfig {
    frameworkId: string;
    frameworkName: string;
    scenarioId: string;
    scenarioName: string;
    coacheeName: string;
    coacheeAvatar: string;
    /** TTS voice gender for the practice coachee. */
    coacheeGender?: 'male' | 'female';
    difficulty: PracticeDifficulty;
    difficultyLabel: string;
    focusNote?: string;
    liveMode: boolean;
    scopeBoundaryTheme?: ScopeBoundaryTheme | null;
    /** Defaults to `method` when omitted (classic practice). */
    practiceMode?: PracticeMode;
    /** Hide scenario concern in setup/chat empty state (contracting Phase 1). */
    hideScenarioBrief?: boolean;
    /** Phase 2: transcript summary from contracting session. */
    priorTranscript?: string;
    /** Phase 2: clarified concern / contract from contracting evaluation. */
    clarifiedConcern?: string;
    sessionContract?: string;
}

export interface PracticeDimensionScore {
    score: number;
    evidence: string;
    gaps: string;
}

export interface PracticeContractingSteps {
    topicIdentified: boolean;
    relevanceExplored: boolean;
    outcomeDefined: boolean;
    contractConfirmed: boolean;
    evidence: string;
    highlights: string;
}

export interface PracticeMethodSuggestion {
    frameworkId: string;
    frameworkName: string;
    rationale: string;
}

export interface PracticeEvaluationResult {
    summary: string;
    /** Present for method-mode evaluations; optional for contracting / free-play. */
    methodCompliance?: PracticeDimensionScore & { stagesCovered: string[] };
    effectiveness: PracticeDimensionScore;
    clarity: PracticeDimensionScore;
    coacheeAutonomy?: PracticeDimensionScore;
    coacheeSatisfaction: PracticeDimensionScore;
    sessionFlow?: {
        coherent: boolean;
        evidence: string;
        highlights: string;
    };
    /** Contracting evaluation only. */
    practiceMode?: PracticeMode;
    contractingSteps?: PracticeContractingSteps;
    sessionContract?: string;
    clarifiedConcern?: string;
    methodSuggestions?: PracticeMethodSuggestion[];
    /** Free-play evaluation only — descriptive, not scored. */
    observedMethodElements?: string[];
    /** Free-play: what went well / alternatives / missed cues. */
    freePlaySuggestions?: {
        alternatives: string[];
        wentWell: string[];
        missedOrOverlooked: string[];
    };
    scenarioMethodFit?: {
        tier: PracticeMatchTier;
        note: string;
    };
    strengths: string[];
    developmentAreas: string[];
    nextDrills: { action: string; rationale: string }[];
    calibration: {
        selfRating: number;
        evidenceRating: number;
        delta: string;
        interpretation: string;
    };
    overallScore: number;
    id?: string;
    liveMode?: boolean;
    /** Full session transcript (Coach Practice only), stored after user completes evaluation. */
    transcript?: string;
    scopeBoundary?: {
        active: boolean;
        theme?: string;
        themeLabel?: string;
        recognized?: boolean;
        referralQuality?: string;
        idealResponse?: string;
    };
}

export interface PracticeEvaluationSummary {
    id: string;
    createdAt: string;
    language: string;
    frameworkId: string;
    scenarioId: string;
    difficulty: string;
    focusNote?: string | null;
    summary: string;
    overallScore: number;
    evaluationData: PracticeEvaluationResult;
}