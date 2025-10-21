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
    const baseClass = "px-4 py-2 text-sm font-bold uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 focus:ring-green-500";
    if (language === lang) {
        return `${baseClass} bg-green-400 text-black`;
    }
    return `${baseClass} bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center animate-fadeIn">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
        <div className="flex justify-center gap-4">
            <button onClick={() => setLanguage('en')} className={getButtonClass('en')}>English</button>
            <button onClick={() => setLanguage('de')} className={getButtonClass('de')}>Deutsch</button>
        </div>
        
        {redirectReason && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 text-yellow-800 dark:text-yellow-300 flex items-start gap-3">
                <InfoIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-left">{redirectReason}</p>
            </div>
        )}

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('auth_title')}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          {t('auth_subtitle')}
        </p>
        
        <div className="space-y-4 pt-4">
          <button
            onClick={onLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 focus:outline-none transition-colors duration-200 disabled:opacity-50"
          >
            <LogInIcon className="w-6 h-6" />
            {t('auth_login')}
          </button>
           <button
            onClick={onRegister}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-black bg-[#FECC78] uppercase hover:brightness-95 focus:outline-none transition-colors duration-200 disabled:opacity-50"
          >
            <UserIcon className="w-6 h-6" />
            {t('auth_register')}
          </button>
           <button
            onClick={onGuest}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-gray-700 dark:text-gray-300 bg-transparent border border-gray-400 dark:border-gray-700 uppercase hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
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