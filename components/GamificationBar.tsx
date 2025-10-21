import React from 'react';
import { FireIcon } from './icons/FireIcon';
import { StarIcon } from './icons/StarIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { BurgerIcon } from './icons/BurgerIcon';
import { GamificationState, User } from '../types';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { useLocalization } from '../context/LocalizationContext';

interface GamificationBarProps {
    gamificationState: GamificationState;
    currentUser: User | null;
    onViewAchievements: () => void;
    onToggleMenu: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    minimal?: boolean;
}

const GamificationBar: React.FC<GamificationBarProps> = ({ gamificationState, currentUser, onViewAchievements, onToggleMenu, theme, toggleTheme, minimal }) => {
    const { t } = useLocalization();
    const { xp, level, streak } = gamificationState;

    // --- Progressive XP Logic ---
    // Total XP required to reach the start of the current level.
    // The formula for the sum of an arithmetic series is used here: 100 * (n*(n-1))/2
    const xpToReachCurrentLevel = 50 * (level - 1) * level;
    // The amount of XP needed to get from the current level to the next.
    const xpForNextLevel = level * 100;
    // The amount of XP the user has accumulated within the current level.
    const currentLevelXp = xp - xpToReachCurrentLevel;
    // The progress percentage for the bar display.
    const progressPercentage = xpForNextLevel > 0 ? (currentLevelXp / xpForNextLevel) * 100 : 0;


    const burgerButton = (
        <button 
            onClick={onToggleMenu}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="Open menu"
        >
            <BurgerIcon className="w-6 h-6"/>
        </button>
    );
    
    const themeToggleButton = (
         <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
        </button>
    );

    if (minimal) {
        return (
            <div className="sticky top-0 z-10 flex justify-end items-center p-2 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm">
                {themeToggleButton}
                {burgerButton}
            </div>
        );
    }

    return (
        <div className="sticky top-0 z-10 flex items-center justify-between gap-6 p-3 bg-white/70 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-md">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <StarIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                    <span>{t('gamificationBar_level')}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{level}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <FireIcon className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                    <span>{t('gamificationBar_streak')}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{streak}</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3 w-64">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2">
                        <div className="bg-green-500 h-2" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{currentLevelXp}/{xpForNextLevel} XP</span>
                </div>
                <div className="md:hidden text-xs font-mono text-gray-500 dark:text-gray-400">
                    <span>{currentLevelXp}/{xpForNextLevel} XP</span>
                </div>
                <button 
                    onClick={onViewAchievements} 
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
                    aria-label="View Achievements"
                >
                    <TrophyIcon className="w-6 h-6"/>
                </button>
                {themeToggleButton}
                {burgerButton}
            </div>
        </div>
    );
};

export default GamificationBar;