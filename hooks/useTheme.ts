import React, { useState, useEffect } from 'react';
import { getCurrentSeason, getSeasonalColorTheme } from '../utils/dateUtils';

export function useTheme() {
    const [isDarkMode, setIsDarkMode] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('isDarkMode') === 'dark' ? 'dark' : 'light';
        }
        return 'light';
    });
    const [isAutoThemeEnabled, setIsAutoThemeEnabled] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('autoThemeEnabled');
            return stored !== 'false'; // Default to true, only false if explicitly disabled
        }
        return true;
    });
    const [colorTheme, setColorTheme] = useState<'summer' | 'autumn' | 'winter'>(() => {
        if (typeof window !== 'undefined') {
            const currentSeason = getCurrentSeason();
            const lastAppliedSeason = localStorage.getItem('lastAppliedSeason');
            const storedTheme = localStorage.getItem('colorTheme');

            // Check if season has changed since last visit
            if (currentSeason !== lastAppliedSeason) {
                // New season! Apply seasonal theme once and save
                const newTheme = getSeasonalColorTheme() as 'summer' | 'autumn' | 'winter';
                localStorage.setItem('lastAppliedSeason', currentSeason);
                localStorage.setItem('colorTheme', newTheme);
                return newTheme;
            }

            // Same season - use stored preference if valid
            if (storedTheme === 'summer' || storedTheme === 'autumn' || storedTheme === 'winter') {
                return storedTheme;
            }
        }
        // Default to seasonal theme
        return getSeasonalColorTheme() as 'summer' | 'autumn' | 'winter';
    });

    useEffect(() => {
        if (isDarkMode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('isDarkMode', isDarkMode);
    }, [isDarkMode]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', colorTheme);
        localStorage.setItem('colorTheme', colorTheme);
    }, [colorTheme]);

    // Automatic theme switching based on time of day (18:00-6:00 = dark, 6:00-18:00 = light)
    // and season (spring/summer → summer theme, autumn → autumn theme, winter → winter theme)
    useEffect(() => {
        if (!isAutoThemeEnabled) return;

        const checkTimeAndUpdateTheme = () => {
            const now = new Date();
            const hour = now.getHours();

            // Dark mode: 18:00 (6 PM) to 6:00 (6 AM)
            // Light mode: 6:00 (6 AM) to 18:00 (6 PM)
            const shouldBeDark = hour >= 18 || hour < 6;
            const desiredMode = shouldBeDark ? 'dark' : 'light';

            if (isDarkMode !== desiredMode) {
                setIsDarkMode(desiredMode);
            }

            // Seasonal color theme switching
            const seasonalTheme = getSeasonalColorTheme() as 'summer' | 'autumn' | 'winter';
            if (colorTheme !== seasonalTheme) {
                setColorTheme(seasonalTheme);
            }
        };

        // Check immediately
        checkTimeAndUpdateTheme();

        // Check every minute for theme changes
        const intervalId = setInterval(checkTimeAndUpdateTheme, 60000);

        return () => clearInterval(intervalId);
    }, [isAutoThemeEnabled, isDarkMode]); // Removed colorTheme to prevent override loops

    return {
        isDarkMode,
        setIsDarkMode,
        colorTheme,
        setColorTheme,
        isAutoThemeEnabled,
        setIsAutoThemeEnabled,
    };
}
