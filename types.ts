import React from 'react';

export interface Bot {
    id: string;
    name: string;
    description: string;
    avatar: string;
    style: string;
    systemPrompt: string;
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

export interface SessionAnalysis {
    newFindings: string;
    proposedUpdates: ProposedUpdate[];
    nextSteps: { action: string; deadline: string }[];
}

// FIX: Moved 'achievements' from AppView to NavView to correctly classify it as a secondary/informational screen and resolve type errors.
// FIX: Added 'pii-warning' and 'access-key' to handle new steps in the user flow.
export type AppView = 'welcome' | 'landing' | 'questionnaire' | 'bot-selection' | 'chat' | 'session-review' | 'pii-warning' | 'access-key';
export type NavView = 'about' | 'faq' | 'disclaimer' | 'terms' | 'achievements';
export type View = AppView | NavView;


export interface Achievement {
    id: string;
    name: string;
    description: string;
    // FIX: Changed icon type to React.FC to match the type of the imported icon components.
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    isUnlocked: (state: GamificationState) => boolean;
}