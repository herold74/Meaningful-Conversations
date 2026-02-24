import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocalization } from '../context/LocalizationContext';
import * as userService from '../services/userService';
import { User } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Button from './shared/Button';
import { deriveKey, hexToUint8Array } from '../utils/encryption';
import ChristmasSnowflakes from './ChristmasSnowflakes';
import SpringBlossoms from './SpringBlossoms';
import SummerButterflies from './SummerButterflies';
import AutumnLeaves from './AutumnLeaves';
import { isChristmasSeason, isSpringSeason, isSummerSeason, isAutumnSeason } from '../utils/dateUtils';

interface RegisterViewProps {
  onShowPending: () => void;
  onSwitchToLogin: () => void;
  onBack: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onShowPending, onSwitchToLogin, onBack }) => {
  const { t, language } = useLocalization();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<{ type: 'email' | 'password' | 'general', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const showChristmas = useMemo(() => isChristmasSeason(), []);
  const showSpring = useMemo(() => isSpringSeason(), []);
  const showSummer = useMemo(() => isSummerSeason(), []);
  const showAutumn = useMemo(() => isAutumnSeason(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedPassword.length < 6) {
      setError({ type: 'password', message: t('register_error_short_password') });
      return;
    }
    if (trimmedPassword !== trimmedConfirmPassword) {
      setError({ type: 'password', message: t('register_error_mismatch') });
      return;
    }
    setIsLoading(true);
    try {
      await userService.register(trimmedEmail, trimmedPassword, language, firstName.trim() || undefined, lastName.trim() || undefined, newsletterConsent);
      onShowPending();

    } catch (err: any) {
        console.error("Registration failed:", err);
        if (err.isNetworkError) {
            setError({ type: 'general', message: t('error_network_detailed', { url: err.backendUrl }) });
        } else if (err.status === 409) {
            setError({ type: 'email', message: t('register_error_exists') });
        } else {
            setError({ type: 'general', message: err.message || "An unknown error occurred." });
        }
    } finally {
        setIsLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `mt-1 w-full px-3 py-2.5 rounded-lg text-sm bg-background-primary border text-content-primary placeholder:text-content-subtle focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 ${
      hasError ? 'border-status-danger-border focus:ring-status-danger-border/40' : 'border-border-primary focus:ring-accent-primary/40 focus:border-accent-primary'
    }`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {showChristmas && <ChristmasSnowflakes darkModeOnly={true} />}
      {showSpring && <SpringBlossoms lightModeOnly={true} />}
      {showSummer && <SummerButterflies lightModeOnly={true} />}
      {showAutumn && <AutumnLeaves />}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-md p-8 space-y-6 bg-background-secondary border border-border-primary rounded-card shadow-card-elevated"
      >
         <button onClick={onBack} className="absolute left-4 top-4 p-2 rounded-full bg-background-tertiary hover:bg-border-primary transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-content-secondary" />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-content-primary tracking-tight">{t('register_title')}</h1>
          <p className="mt-1 text-sm text-content-secondary">{t('register_trial_info')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-content-primary text-left">{t('register_email_label')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('register_email_placeholder')}
              required
              disabled={isLoading}
              className={inputClass(error?.type === 'email')}
              aria-invalid={error?.type === 'email'}
              aria-describedby={error?.type === 'email' ? 'email-error' : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
            {error?.type === 'email' && <p id="email-error" className="text-status-danger-foreground text-xs mt-1">{error.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-content-primary text-left">{t('register_firstName_label')}</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t('register_firstName_placeholder')}
                disabled={isLoading}
                className={inputClass(false)}
                autoCapitalize="words"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-content-primary text-left">{t('register_lastName_label')}</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('register_lastName_placeholder')}
                disabled={isLoading}
                className={inputClass(false)}
                autoCapitalize="words"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
          </div>
          <label htmlFor="newsletter" className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="newsletter"
              checked={newsletterConsent}
              onChange={(e) => setNewsletterConsent(e.target.checked)}
              disabled={isLoading}
              className="mt-0.5 w-4 h-4 rounded border-border-primary text-accent-primary focus:ring-accent-primary disabled:opacity-50"
            />
            <span className="text-sm text-content-secondary">
              <span className="font-medium">{t('register_newsletter_label')}</span>
              <br />
              <span className="text-xs">{t('register_newsletter_desc')}</span>
            </span>
          </label>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-content-primary text-left">{t('register_password_label')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className={inputClass(error?.type === 'password')}
              aria-invalid={error?.type === 'password'}
              aria-describedby={error?.type === 'password' ? 'password-error' : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
           <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-content-primary text-left">{t('register_confirm_password_label')}</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className={inputClass(error?.type === 'password')}
              aria-invalid={error?.type === 'password'}
              aria-describedby={error?.type === 'password' ? 'password-error' : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
            {error?.type === 'password' && <p id="password-error" className="text-status-danger-foreground text-xs mt-1">{error.message}</p>}
          </div>

          {error?.type === 'general' && <p className="text-status-danger-foreground text-sm whitespace-pre-wrap">{error.message}</p>}
          
          <Button type="submit" disabled={isLoading} loading={isLoading} size="lg" fullWidth>
            {t('register_button')}
          </Button>
        </form>

        <p className="text-center text-sm text-content-secondary">
          {t('register_has_account')}{' '}
          <button onClick={onSwitchToLogin} disabled={isLoading} className="font-medium text-accent-primary hover:text-accent-primary-hover disabled:opacity-50">
            {t('register_login_link')}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterView;