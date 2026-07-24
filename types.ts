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
    | 'practiceHistory';

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

export type PracticeDifficulty = 'easy' | 'moderate' | 'challenging';

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
}

export interface PracticeScenario {
    id: string;
    coacheeName: string;
    avatar: string;
    concern: string;
    emotionalTone: string;
}

export interface PracticeCatalog {
    frameworks: PracticeFramework[];
    scenarios: PracticeScenario[];
    difficulties: { id: PracticeDifficulty; label: string }[];
}

export interface CoachPracticeConfig {
    frameworkId: string;
    frameworkName: string;
    scenarioId: string;
    scenarioName: string;
    coacheeName: string;
    coacheeAvatar: string;
    difficulty: PracticeDifficulty;
    difficultyLabel: string;
    focusNote?: string;
}

export interface PracticeDimensionScore {
    score: number;
    evidence: string;
    gaps: string;
}

export interface PracticeEvaluationResult {
    summary: string;
    methodCompliance: PracticeDimensionScore & { stagesCovered: string[] };
    effectiveness: PracticeDimensionScore;
    clarity: PracticeDimensionScore;
    coacheeSatisfaction: PracticeDimensionScore;
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