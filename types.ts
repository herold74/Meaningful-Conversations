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
    accessTier: BotAccessTier;
    systemPrompt: string;
    systemPrompt_de: string;
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

export interface User {
    id: string;
    email: string;
    isBetaTester: boolean;
    isAdmin: boolean;
    unlockedCoaches: string[];
}

export interface ProposedUpdate {
    type: 'create_headline' | 'append' | 'replace_section';
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
    solutionBlockages: SolutionBlockage[];
    blockageScore: number;
    hasConversationalEnd: boolean;
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

export interface Achievement {
    id: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    name: string;
    description: string;
    isUnlocked: (state: GamificationState) => boolean;
}

export interface UpgradeCode {
    id: string;
    code: string;
    botId: string;
    isUsed: boolean;
    usedBy?: { email: string };
    createdAt: string;
}
