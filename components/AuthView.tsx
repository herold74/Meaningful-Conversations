import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { LogInIcon } from './icons/LogInIcon';
import { UserIcon } from './icons/UserIcon';
import { UsersIcon } from './icons/UsersIcon';
import { InfoIcon } from './icons/InfoIcon';
import { User } from '../types';

interface AuthViewProps {
  onLogin: () => void;
  onRegister: () => void;
  onGuest: () => void;
  redirectReason: string | null;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister, onGuest, redirectReason }) => {
  const { t, language, setLanguage } = useLocalization();
  const [isLoading, setIsLoading] = useState(false);

  const getButtonClass = (lang: 'en' | 'de') => {
    const baseClass = "px-4 py-2 text-sm font-bold uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-background-primary rounded-md shadow-sm";
    if (language === lang) {
        return `${baseClass} bg-accent-tertiary text-accent-tertiary-foreground focus:ring-accent-tertiary`;
    }
    return `${baseClass} bg-border-primary dark:bg-border-primary text-content-secondary hover:bg-border-secondary dark:hover:bg-border-secondary focus:ring-border-secondary`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center animate-fadeIn">
      <div className="w-full max-w-md p-8 space-y-6 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary rounded-lg shadow-lg">
        <div className="flex justify-center gap-4">
            <button onClick={() => setLanguage('en')} className={getButtonClass('en')}>English</button>
            <button onClick={() => setLanguage('de')} className={getButtonClass('de')}>Deutsch</button>
        </div>
        
        {redirectReason && (
            <div className="p-4 bg-status-info-background dark:bg-status-info-background border border-status-info-border dark:border-status-info-border/30 text-status-info-foreground dark:text-status-info-foreground flex items-start gap-3">
                <InfoIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-left">{redirectReason}</p>
            </div>
        )}

        <h1 className="text-3xl font-bold text-content-primary uppercase">{t('auth_title')}</h1>
        <p className="text-lg text-content-secondary leading-relaxed">
          {t('auth_subtitle')}
        </p>
        
        <div className="space-y-4 pt-4">
          <button
            onClick={onLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-content-inverted-dark bg-accent-primary uppercase hover:bg-accent-primary-hover focus:outline-none transition-colors duration-200 disabled:opacity-50 rounded-lg shadow-md"
          >
            <LogInIcon className="w-6 h-6" />
            {t('auth_login')}
          </button>
           <button
            onClick={onRegister}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-content-inverted-dark bg-accent-secondary uppercase hover:bg-accent-secondary-hover focus:outline-none transition-colors duration-200 disabled:opacity-50 rounded-lg shadow-md"
          >
            <UserIcon className="w-6 h-6" />
            {t('auth_register')}
          </button>
           <button
            onClick={onGuest}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-content-secondary bg-transparent border border-border-secondary dark:border-border-primary uppercase hover:bg-background-tertiary dark:hover:bg-background-tertiary disabled:opacity-50 rounded-lg shadow-md"
          >
            <UsersIcon className="w-6 h-6" />
            {t('auth_guest')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;