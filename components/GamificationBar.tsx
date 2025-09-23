import React from 'react';
import { FireIcon } from './icons/FireIcon';
import { StarIcon } from './icons/StarIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { BurgerIcon } from './icons/BurgerIcon';
import { GamificationState } from '../types';

interface GamificationBarProps {
    gamificationState: GamificationState;
    onViewAchievements: () => void;
    onToggleMenu: () => void;
    minimal?: boolean;
}

const XP_PER_LEVEL = 100;

const GamificationBar: React.FC<GamificationBarProps> = ({ gamificationState, onViewAchievements, onToggleMenu, minimal }) => {
    const { xp, level, streak } = gamificationState;
    const currentLevelXp = xp % XP_PER_LEVEL;
    const progressPercentage = (currentLevelXp / XP_PER_LEVEL) * 100;

    const burgerButton = (
        <button 
            onClick={onToggleMenu}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Open menu"
        >
            <BurgerIcon className="w-6 h-6"/>
        </button>
    );

    if (minimal) {
        return (
            <div className="flex justify-end">
                {burgerButton}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-6 p-3 bg-gray-900/50 border border-gray-700">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <StarIcon className="w-5 h-5 text-yellow-400" />
                    <span>Level:</span>
                    <span className="font-bold text-white">{level}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <FireIcon className="w-5 h-5 text-orange-400" />
                    <span>Session Streak:</span>
                    <span className="font-bold text-white">{streak}</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 w-64">
                    <div className="w-full bg-gray-700 h-2">
                        <div className="bg-green-500 h-2" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <span className="text-xs font-mono text-gray-400">{currentLevelXp}/{XP_PER_LEVEL} XP</span>
                </div>
                <button 
                    onClick={onViewAchievements} 
                    className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                    aria-label="View Achievements"
                >
                    <TrophyIcon className="w-6 h-6"/>
                </button>
                {burgerButton}
            </div>
        </div>
    );
};

export default GamificationBar;