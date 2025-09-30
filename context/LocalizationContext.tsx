import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Language } from '../types';

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
    
    const [translations, setTranslations] = useState<Record<Language, Record<string, string>> | null>(null);

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
                
                setTranslations({
                    en: enData,
                    de: deData,
                });
            } catch (error) {
                console.error("Error loading translation files:", error);
                // Fallback to prevent crashes, though the app might not have text.
                setTranslations({ en: {}, de: {} });
            }
        };

        fetchTranslations();
    }, []);

    const setLanguage = (lang: Language) => {
        localStorage.setItem('language', lang);
        setLanguageState(lang);
    };
    
    // The translation function
    const t = (key: string, replacements?: Record<string, string | number>): string => {
        // Return the key itself if translations are not loaded yet.
        if (!translations) {
            return key;
        }

        let translation = translations[language][key] || key;
        if (replacements) {
            Object.keys(replacements).forEach(placeholder => {
                translation = translation.replace(`{{${placeholder}}}`, String(replacements[placeholder]));
            });
        }
        return translation;
    };
    
    // Don't render the rest of the app until translations are loaded to prevent
    // a flash of untranslated content.
    if (!translations) {
        return null; 
    }

    return (
        <LocalizationContext.Provider value={{ language, setLanguage, t }}>
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
