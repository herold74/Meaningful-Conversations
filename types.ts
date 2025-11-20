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
    | 'admin'
    | 'changePassword'
    | 'exportData';

export interface User {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    preferredLanguage?: string;
    newsletterConsent?: boolean;
    newsletterConsentDate?: string | null;
    isBetaTester: boolean;
    isAdmin: boolean;
    unlockedCoaches: string[];
    createdAt?: string;
    accessExpiresAt?: string;
    loginCount?: number;
    lastLogin?: string;
    encryptionSalt?: string; // Hex-encoded string
    gamificationState?: string;
    status?: 'PENDING' | 'ACTIVE';
}

export type BotAccessTier = 'guest' | 'registered' | 'premium';

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
}

export interface GamificationState {
    xp: number;
    level: number;
    streak: number;
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
    solutionBlockages: SolutionBlockage[];
    blockageScore: number;
    hasConversationalEnd: boolean;
    hasAccomplishedGoal: boolean;
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
    createdAt: string;
    user: { email: string } | null;
    guestEmail?: string | null;
}

export interface CalendarEvent {
    action: string;
    deadline: string;
    description?: string;
}