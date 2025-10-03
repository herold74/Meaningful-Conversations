import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Language } from '../types';

interface LocalizationContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('language') : null;
        const browserLang: Language = (typeof navigator !== 'undefined' && navigator.language.startsWith('de')) ? 'de' : 'en';
        return (savedLang === 'de' || savedLang === 'en') ? savedLang : browserLang;
    });

    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [fallbackTranslations, setFallbackTranslations] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTranslations = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const langResponse = await fetch(`/locales/${language}.json`);
                if (!langResponse.ok) throw new Error(`Failed to load ${language}.json`);
                const langData = await langResponse.json();
                setTranslations(langData);

                if (language !== 'en') {
                    const fallbackResponse = await fetch(`/locales/en.json`);
                     if (!fallbackResponse.ok) throw new Error('Failed to load fallback en.json');
                    const fallbackData = await fallbackResponse.json();
                    setFallbackTranslations(fallbackData);
                } else {
                    setFallbackTranslations(langData);
                }
            } catch (err: any) {
                console.error("Error loading translation files:", err.message);
                setError(err.message);
                try {
                    const fallbackResponse = await fetch(`/locales/en.json`);
                    if (!fallbackResponse.ok) {
                         const errText = `Failed to load even the fallback English translations: ${fallbackResponse.statusText}`;
                         console.error(errText);
                         throw new Error(errText);
                    }
                    const fallbackData = await fallbackResponse.json();
                    setTranslations(fallbackData);
                    setFallbackTranslations(fallbackData);
                    setLanguage('en');
                    setError(null); // Clear error if fallback is successful
                } catch (fallbackError: any) {
                    console.error(fallbackError);
                    const combinedError = `${err.message}\n${fallbackError.message}`;
                    setError(combinedError);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadTranslations();
        localStorage.setItem('language', language);
    }, [language]);

    const t = (key: string, replacements?: Record<string, string | number>): string => {
        let text = translations[key] || fallbackTranslations[key] || key;
        if (replacements) {
            Object.entries(replacements).forEach(([placeholder, value]) => {
                text = text.replace(new RegExp(`{{${placeholder}}}`, 'g'), String(value));
            });
        }
        return text;
    };

    if (isLoading) return null;
    
    if (error) {
        return (
            <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'red', textAlign: 'center', background: '#fff1f1' }}>
                <h1 style={{color: '#c00'}}>Application Error</h1>
                <pre style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', border: '1px solid #ddd', padding: '10px' }}>{error}</pre>
            </div>
        );
    }

    return (
        <LocalizationContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LocalizationContext.Provider>
    );
};

export const useLocalization = (): LocalizationContextType => {
    const context = useContext(LocalizationContext);
    if (context === undefined) {
        throw new Error('useLocalization must be used within a LocalizationProvider');
    }
    return context;
};