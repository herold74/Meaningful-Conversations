import React, { useEffect, useRef } from 'react';
import { FireIcon } from './icons/FireIcon';
import { StarIcon } from './icons/StarIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { BurgerIcon } from './icons/BurgerIcon';
import { GamificationState, User } from '../types';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { useLocalization } from '../context/LocalizationContext';
import { XIcon } from './icons/XIcon';
import { PaletteIcon } from './icons/PaletteIcon';

interface GamificationBarProps {
    gamificationState: GamificationState;
    currentUser: User | null;
    onViewAchievements: () => void;
    onBurgerClick: () => void;
    onCloseSubMenu: () => void;
    isMenuOpen: boolean;
    isSubMenuOpen: boolean;
    isDarkMode: 'light' | 'dark';
    toggleDarkMode: () => void;
    colorTheme: 'summer' | 'autumn' | 'winter';
    toggleColorTheme: () => void;
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
    isDarkMode, 
    toggleDarkMode,
    colorTheme,
    toggleColorTheme, 
    minimal 
}) => {
    const { t } = useLocalization();
    const { xp, level, streak } = gamificationState;

    // iOS Safe Area handling (contentInset: 'never' - we manage safe areas manually)
    const isIOS = (window as any).Capacitor?.getPlatform?.() === 'ios';
    
    // Calculate safe area - ensures content is below clock/Dynamic Island
    const getSafeAreaTop = (): number => {
        if (!isIOS) return 0;
        const screenHeight = Math.max(window.screen.height, window.screen.width);
        if (screenHeight >= 932) return 52;  // iPhone 14/15 Pro Max (Dynamic Island)
        if (screenHeight >= 852) return 52;  // iPhone 14/15 Pro (Dynamic Island)
        if (screenHeight >= 844) return 44;  // iPhone 12/13/14/15 (notch)
        if (screenHeight >= 812) return 44;  // iPhone X/XS/11 Pro (notch)
        return 20; // Older iPhones without notch
    };
    
    const safeAreaTop = getSafeAreaTop();
    const gbRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);

    // #region iOS fixed positioning fix - Use position:sticky instead of position:fixed
    // iOS WKWebView has a bug where position:fixed isn't honored until ~70+ scroll events.
    // Hypothesis C: position:sticky works more reliably on iOS WebKit because it's designed
    // to work within scroll containers rather than being positioned relative to viewport.
    // 
    // For non-iOS platforms, we continue to use position:fixed for better compatibility.
    // #endregion

    // #region agent log - Debug scroll behavior on iOS (hypothesis: backdrop-blur removed)
    useEffect(() => {
        if (!isIOS) return;
        
        let lastGBTop = safeAreaTop;
        let scrollCount = 0;
        let sessionId = 'sticky-test';
        
        // Get computed styles to check if fixed positioning is correct
        const getComputedInfo = () => {
            const gbEl = gbRef.current;
            if (!gbEl) return null;
            const computed = window.getComputedStyle(gbEl);
            const rect = gbEl.getBoundingClientRect();
            return {
                position: computed.position,
                top: computed.top,
                backdropFilter: computed.backdropFilter || 'none',
                rectTop: Math.round(rect.top),
            };
        };
        
        // Log initial state - testing position:sticky on iOS
        console.log('[GB-DEBUG] mount (STICKY TEST):', JSON.stringify({sessionId, safeAreaTop, positionStrategy: isIOS ? 'sticky' : 'fixed', ...getComputedInfo()}));
        
        // Track visibility change (lock/unlock device)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                sessionId = 'sticky-unlock-' + Date.now();
                console.log('[GB-DEBUG] visibility-visible:', JSON.stringify({sessionId, safeAreaTop, ...getComputedInfo()}));
            }
        };
        
        // Track scroll - only log if position is WRONG (delta > 5)
        const handleScroll = () => {
            scrollCount++;
            const gbRect = gbRef.current?.getBoundingClientRect();
            const gbTop = gbRect?.top ?? 0;
            const delta = gbTop - safeAreaTop;
            
            // If delta > 5, fixed positioning is BROKEN - log it
            if (Math.abs(delta) > 5) {
                console.log('[GB-DEBUG] FIXED BROKEN:', JSON.stringify({sessionId, scrollCount, gbTop: Math.round(gbTop), expected: safeAreaTop, delta: Math.round(delta), windowScrollY: Math.round(window.scrollY)}));
                lastGBTop = gbTop;
            } else if (scrollCount % 20 === 0) {
                // Periodic "all good" log every 20 scrolls
                console.log('[GB-DEBUG] fixed OK:', JSON.stringify({scrollCount, gbTop: Math.round(gbTop), expected: safeAreaTop, windowScrollY: Math.round(window.scrollY)}));
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isIOS, safeAreaTop]);
    // #endregion

    const xpToReachCurrentLevel = 50 * (level - 1) * level;
    const xpForNextLevel = level * 100;
    const currentLevelXp = xp - xpToReachCurrentLevel;
    const progressPercentage = xpForNextLevel > 0 ? (currentLevelXp / xpForNextLevel) * 100 : 0;

    const themeToggleButton = (
         <button
            onClick={toggleDarkMode}
            className="p-2 text-content-secondary hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
            aria-label="Toggle theme"
        >
            {isDarkMode === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
        </button>
    );

    const colorThemeToggleButton = (
         <button
            onClick={toggleColorTheme}
            className="p-2 text-content-secondary hover:text-accent-primary transition-colors"
            aria-label="Toggle color theme"
        >
            <PaletteIcon className="w-6 h-6" />
        </button>
    );

    // Use sticky on iOS (more reliable), fixed on other platforms
    const positionClass = isIOS ? 'sticky' : 'fixed';
    
    if (minimal) {
        return (
            <>
                {/* Safe area background extension - uses same positioning strategy as GB */}
                {isIOS && safeAreaTop > 0 && (
                    <div 
                        ref={bgRef}
                        data-gamification-bg
                        className={`${positionClass} top-0 left-0 right-0 z-10 bg-background-secondary/70 dark:bg-background-secondary/65 backdrop-blur-sm`}
                        style={{ height: safeAreaTop }}
                    />
                )}
                <div 
                    ref={gbRef}
                    data-gamification-bar
                    className={`${positionClass} left-0 right-0 z-10 flex justify-between items-center p-2 bg-background-secondary/70 dark:bg-background-secondary/65 backdrop-blur-sm`}
                    style={{ top: safeAreaTop }}
                >
                 <button 
                    onClick={onBurgerClick}
                    className="p-2 text-content-secondary hover:text-content-primary transition-colors"
                    aria-label={isMenuOpen ? t('menu_exit') : t('menu_title')}
                >
                    {isMenuOpen ? <XIcon className="w-6 h-6" /> : <BurgerIcon className="w-6 h-6"/>}
                </button>
                <div className="flex items-center">
                    {themeToggleButton}
                    {colorThemeToggleButton}
                </div>
            </div>
            </>
        );
    }

    return (
        <>
            {/* Safe area background extension - uses same positioning strategy as GB */}
            {isIOS && safeAreaTop > 0 && (
                <div 
                    ref={bgRef}
                    data-gamification-bg
                    className={`${positionClass} top-0 left-0 right-0 z-10 bg-background-secondary/70 dark:bg-background-secondary/65 backdrop-blur-sm`}
                    style={{ height: safeAreaTop }}
                />
            )}
            <div 
                ref={gbRef}
                data-gamification-bar
                className={`${positionClass} left-0 right-0 z-10 flex items-center p-3 bg-background-secondary/70 dark:bg-background-secondary/65 backdrop-blur-sm border-b border-border-primary dark:border-border-primary shadow-md`}
                style={{ top: safeAreaTop }}
            >
            {/* Left section: burger + level + streak */}
            <div className="flex items-center gap-2 sm:gap-4">
                {isSubMenuOpen ? (
                    <>
                        <button 
                            onClick={onBurgerClick}
                            className="p-2 text-content-secondary hover:text-content-primary transition-colors"
                            aria-label={t('menu_title')}
                        >
                            <BurgerIcon className="w-6 h-6"/>
                        </button>
                        <button 
                            onClick={onCloseSubMenu}
                            className="flex items-center gap-2 p-2 text-content-secondary hover:text-content-primary transition-colors"
                            aria-label={t('menu_exit')}
                        >
                            <XIcon className="w-6 h-6" />
                            <span className="font-bold uppercase text-xs">{t('menu_exit')}</span>
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={onBurgerClick}
                        className="p-2 text-content-secondary hover:text-content-primary transition-colors"
                        aria-label={isMenuOpen ? t('menu_exit') : t('menu_title')}
                    >
                        {isMenuOpen ? <XIcon className="w-6 h-6" /> : <BurgerIcon className="w-6 h-6"/>}
                    </button>
                )}
                
                <div className={`flex items-center gap-2 text-sm text-content-secondary ${isSubMenuOpen ? 'hidden sm:flex' : 'flex'}`}>
                    <StarIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                    <span className="hidden sm:inline">{t('gamificationBar_level')}</span>
                    <span className="font-bold text-content-primary">{level}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm text-content-secondary ${isSubMenuOpen ? 'hidden sm:flex' : 'flex'}`}>
                    <FireIcon className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                    <span className="hidden sm:inline">{t('gamificationBar_streak')}</span>
                    <span className="font-bold text-content-primary">{streak}</span>
                </div>
            </div>

            {/* Center section: XP progress (centered with flex-1 spacers) */}
            {!isSubMenuOpen && !isMenuOpen && (
                <>
                    <div className="flex-1" /> {/* Left spacer */}
                    <div className="flex flex-col items-center gap-1 mx-4">
                        <div className="hidden sm:flex items-center gap-3 w-32 md:w-48">
                            <div className="w-full bg-border-primary h-2 rounded">
                                <div className="bg-accent-primary h-2 rounded" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </div>
                        <span className="text-xs font-mono text-content-subtle whitespace-nowrap">{currentLevelXp}/{xpForNextLevel} XP</span>
                    </div>
                    <div className="flex-1" /> {/* Right spacer */}
                </>
            )}
            {(isSubMenuOpen || isMenuOpen) && <div className="flex-1" />}

            {/* Right section: icons */}
            <div className="flex items-center gap-1 sm:gap-2">
                {!isSubMenuOpen && !isMenuOpen && (
                    <button 
                        onClick={onViewAchievements} 
                        className="p-2 text-content-secondary hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
                        aria-label="View Achievements"
                    >
                        <TrophyIcon className="w-6 h-6"/>
                    </button>
                )}
                {themeToggleButton}
                {colorThemeToggleButton}
            </div>
        </div>
        </>
    );
};

export default GamificationBar;
