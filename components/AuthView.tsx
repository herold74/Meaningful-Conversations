import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocalization } from '../context/LocalizationContext';
import { LogInIcon } from './icons/LogInIcon';
import { UserIcon } from './icons/UserIcon';
import { UsersIcon } from './icons/UsersIcon';
import { InfoIcon } from './icons/InfoIcon';
import Button from './shared/Button';
import Card from './shared/Card';

interface AuthViewProps {
  onLogin: () => void;
  onRegister: () => void;
  onGuest: () => void;
  redirectReason: string | null;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister, onGuest, redirectReason }) => {
  const { t, language, setLanguage } = useLocalization();
  const [isLoading, setIsLoading] = useState(false);

  const langBtn = (lang: 'en' | 'de', label: string) => (
    <button
      onClick={() => setLanguage(lang)}
      className={`px-4 py-1.5 text-sm font-medium rounded-pill transition-colors ${
        language === lang
          ? 'bg-accent-primary text-button-foreground-on-accent'
          : 'bg-background-tertiary text-content-secondary hover:bg-border-primary'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <Card variant="elevated" className="p-8 space-y-6">
          <div className="flex justify-center gap-2">
            {langBtn('en', 'English')}
            {langBtn('de', 'Deutsch')}
          </div>
          
          {redirectReason && (
            <div className="p-3 rounded-lg bg-status-info-background border border-status-info-border text-status-info-foreground flex items-start gap-3">
              <InfoIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-left">{redirectReason}</p>
            </div>
          )}

          <div>
            <h1 className="text-2xl font-semibold text-content-primary tracking-tight">{t('auth_title')}</h1>
            <p className="mt-2 text-base text-content-secondary leading-relaxed">
              {t('auth_subtitle')}
            </p>
          </div>
          
          <div className="space-y-3 pt-2">
            <Button onClick={onLogin} disabled={isLoading} size="lg" fullWidth leftIcon={<LogInIcon className="w-5 h-5" />}>
              {t('auth_login')}
            </Button>
            <Button onClick={onRegister} disabled={isLoading} size="lg" fullWidth variant="secondary" leftIcon={<UserIcon className="w-5 h-5" />}>
              {t('auth_register')}
            </Button>
            <Button onClick={onGuest} disabled={isLoading} variant="ghost" size="lg" fullWidth leftIcon={<UsersIcon className="w-5 h-5" />}>
              {t('auth_guest')}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthView;