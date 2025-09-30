import React from 'react';

export type Language = 'en' | 'de';

export type BotAccessTier = 'guest' | 'registered' | 'premium';

export interface Bot {
    id: string;
    name: string;
    description: string;
    description_de: string;
    avatar: string;
    style: string;
    style_de: string;
    systemPrompt: string;
    systemPrompt_de: string;
    accessTier: BotAccessTier;
}

export interface BotWithAvailability extends Bot {
    isAvailable: boolean;
}

export interface Message {
    id: string;
    text: string;
    role: 'user' | 'bot';
    timestamp: string;
}

export interface ProposedUpdate {
    type: 'append' | 'create_headline' | 'replace_section';
    headline: string;
    content: string;
}

export interface GamificationState {
    xp: number;
    level: number;
    streak: number;
    unlockedAchievements: Set<string>;
    totalSessions: number;
    lastSessionDate: string | null;
    coachesUsed: Set<string>;
}

export interface SolutionBlockage {
    blockage: 'Self-Reproach' | 'Blaming Others' | 'Expectational Attitudes' | 'Age Regression' | 'Dysfunctional Loyalties';
    explanation: string;
    quote: string;
}

export interface SessionAnalysis {
    newFindings: string;
    proposedUpdates: ProposedUpdate[];
    nextSteps: { action: string; deadline: string }[];
    solutionBlockages: SolutionBlockage[];
    blockageScore: number;
}

export interface UserData {
    lifeContext: string | null;
    gamificationState: GamificationState;
}

export type AppView = 'welcome' | 'auth' | 'login' | 'register' | 'landing' | 'questionnaire' | 'pii-warning' | 'bot-selection' | 'chat' | 'session-review' | 'context-choice' | 'forgot-password';
export type NavView = 'about' | 'faq' | 'disclaimer' | 'terms' | 'achievements' | 'formatting-help' | 'user-guide';
export type View = AppView | NavView;


export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    isUnlocked: (state: GamificationState) => boolean;
}

export interface User {
    email: string;
    isBetaTester?: boolean;
}