import React from 'react';
import { FireIcon } from './icons/FireIcon';
import { StarIcon } from './icons/StarIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { BurgerIcon } from './icons/BurgerIcon';
import { GamificationState, User } from '../types';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { useLocalization } from '../context/LocalizationContext';
import { XIcon } from './icons/XIcon';

interface GamificationBarProps {
    gamificationState: GamificationState;
    currentUser: User | null;
    onViewAchievements: () => void;
    onBurgerClick: () => void;
    onCloseSubMenu: () => void;
    isMenuOpen: boolean;
    isSubMenuOpen: boolean;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    minimal?: boolean;
}

const GamificationBar: React.FC<GamificationBarProps> = ({ 
    gamificationState, 
    currentUser, 
    onViewAchievements, 
    onBurgerClick, 
    onCloseSubMenu,
    isMenuOpen, 
    isSubMenuOpen,
    theme, 
    toggleTheme, 
    minimal 
}) => {
    const { t } = useLocalization();
    const { xp, level, streak } = gamificationState;

    const xpToReachCurrentLevel = 50 * (level - 1) * level;
    const xpForNextLevel = level * 100;
    const currentLevelXp = xp - xpToReachCurrentLevel;
    const progressPercentage = xpForNextLevel > 0 ? (currentLevelXp / xpForNextLevel) * 100 : 0;

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
            <div className="sticky top-0 z-10 flex justify-between items-center p-2 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm">
                 <button 
                    onClick={onBurgerClick}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    aria-label={isMenuOpen ? t('menu_exit') : t('menu_title')}
                >
                    {isMenuOpen ? <XIcon className="w-6 h-6" /> : <BurgerIcon className="w-6 h-6"/>}
                </button>
                {themeToggleButton}
            </div>
        );
    }

    return (
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 sm:gap-6 p-3 bg-white/70 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-md">
            <div className="flex items-center gap-2 sm:gap-4">
                {isSubMenuOpen ? (
                    <>
                        <button 
                            onClick={onBurgerClick}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            aria-label={t('menu_title')}
                        >
                            <BurgerIcon className="w-6 h-6"/>
                        </button>
                        <button 
                            onClick={onCloseSubMenu}
                            className="flex items-center gap-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            aria-label={t('menu_exit')}
                        >
                            <XIcon className="w-6 h-6" />
                            <span className="hidden sm:inline font-bold uppercase text-xs">{t('menu_exit')}</span>
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={onBurgerClick}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        aria-label={isMenuOpen ? t('menu_exit') : t('menu_title')}
                    >
                        {isMenuOpen ? <XIcon className="w-6 h-6" /> : <BurgerIcon className="w-6 h-6"/>}
                    </button>
                )}
                
                <div className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 ${isSubMenuOpen ? 'hidden sm:flex' : 'flex'}`}>
                    <StarIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                    <span className="hidden sm:inline">{t('gamificationBar_level')}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{level}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 ${isSubMenuOpen ? 'hidden sm:flex' : 'flex'}`}>
                    <FireIcon className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                    <span className="hidden sm:inline">{t('gamificationBar_streak')}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{streak}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                {!isSubMenuOpen && !isMenuOpen ? (
                    <>
                        <div className="hidden md:flex items-center gap-3 w-64">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2">
                                <div className="bg-green-500 h-2" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{currentLevelXp}/{xpForNextLevel} XP</span>
                        </div>
                        <div className="block md:hidden text-xs font-mono text-gray-500 dark:text-gray-400">
                            <span className="whitespace-nowrap">{currentLevelXp}/{xpForNextLevel} XP</span>
                        </div>
                        <button 
                            onClick={onViewAchievements} 
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
                            aria-label="View Achievements"
                        >
                            <TrophyIcon className="w-6 h-6"/>
                        </button>
                        {themeToggleButton}
                    </>
                ) : (
                    <>{themeToggleButton}</>
                )}
            </div>
        </div>
    );
};

export default GamificationBar;