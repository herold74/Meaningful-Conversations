import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Language } from '../types';
import WelcomeScreen from '../components/WelcomeScreen'; // Import a loading component

// Define the shape of the context
interface LocalizationContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}

// Create the context with a default value
const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// Define the provider component
export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        if (typeof localStorage === 'undefined') return 'en';
        const savedLang = localStorage.getItem('language');
        return (savedLang === 'de' || savedLang === 'en') ? savedLang : 'en';
    });
    
    const [translations, setTranslations] = useState<Record<string, string> | null>(null);
    const [fallback, setFallback] = useState<Record<string, string> | null>(null);

    useEffect(() => {
        const fetchTranslations = async () => {
            try {
                // The paths are absolute from the public root where index.html is served.
                const enResponse = await fetch('/locales/en.json');
                const deResponse = await fetch('/locales/de.json');

                if (!enResponse.ok || !deResponse.ok) {
                    throw new Error('Failed to fetch translation files');
                }

                const enData = await enResponse.json();
                const deData = await deResponse.json();
                
                setFallback(enData); // Always have English as a fallback
                if (language === 'en') {
                    setTranslations(enData);
                } else {
                    setTranslations(deData);
                }
            } catch (error) {
                console.error("Error loading translation files:", error);
                // Try to load at least English as a fallback
                try {
                    const enResponse = await fetch('/locales/en.json');
                    const enData = await enResponse.json();
                    setFallback(enData);
                    setTranslations(enData);
                } catch (fallbackError) {
                    console.error("Failed to load even the fallback English translations:", fallbackError);
                    setTranslations({}); // Prevent infinite loading on total failure
                    setFallback({});
                }
            }
        };

        fetchTranslations();
    }, []); // Fetch once on mount

    useEffect(() => {
        // Function to load the new language file when language changes
        const loadLanguage = async () => {
            if (!fallback) return; // Don't run if initial fetch failed
            try {
                const response = await fetch(`/locales/${language}.json`);
                if (!response.ok) throw new Error(`Failed to fetch ${language}.json`);
                const data = await response.json();
                setTranslations(data);
            } catch (error) {
                console.error(`Could not switch to language ${language}:`, error);
                setTranslations(fallback); // Revert to English on failure
            }
        };
        
        if (translations) { // Only switch if initial load is complete
             loadLanguage();
        }
        localStorage.setItem('language', language);

    }, [language, fallback]);

    // The translation function
    const t = (key: string, replacements?: Record<string, string | number>): string => {
        if (!translations) {
            return key; // Should not happen if loading screen is shown
        }

        let translation = translations[key] || fallback?.[key] || key;
        if (replacements) {
            Object.keys(replacements).forEach(placeholder => {
                translation = translation.replace(`{{${placeholder}}}`, String(replacements[placeholder]));
            });
        }
        return translation;
    };
    
    // Show a loading screen until the initial translations are ready.
    // This prevents the app from rendering a blank page (returning null).
    if (!translations) {
        return <WelcomeScreen />;
    }

    return (
        <LocalizationContext.Provider value={{ language, setLanguage: setLanguageState, t }}>
            {children}
        </LocalizationContext.Provider>
    );
};

// Custom hook to use the localization context
export const useLocalization = (): LocalizationContextType => {
    const context = useContext(LocalizationContext);
    if (context === undefined) {
        throw new Error('useLocalization must be used within a LocalizationProvider');
    }
    return context;
};
