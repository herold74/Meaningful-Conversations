import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as userService from '../services/userService';
import { User } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Spinner from './shared/Spinner';
import { deriveKey, hexToUint8Array } from '../utils/encryption';

interface RegisterViewProps {
  onShowPending: () => void;
  onSwitchToLogin: () => void;
  onBack: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onShowPending, onSwitchToLogin, onBack }) => {
  const { t } = useLocalization();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<{ type: 'email' | 'password' | 'general', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      await userService.register(trimmedEmail, trimmedPassword);
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-fadeIn">
      <div className="relative w-full max-w-md p-8 space-y-6 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary rounded-lg shadow-lg">
         <button onClick={onBack} className="absolute left-4 top-4 p-2 rounded-full bg-background-tertiary dark:bg-background-tertiary hover:bg-border-primary dark:hover:bg-border-primary transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-content-secondary" />
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-content-primary uppercase">{t('register_title')}</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email"  className="block text-sm font-bold text-content-secondary text-left">{t('register_email_label')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className={`mt-1 w-full p-3 bg-background-tertiary dark:bg-background-primary text-content-primary border ${error?.type === 'email' ? 'border-status-danger-border focus:ring-status-danger-border' : 'border-border-secondary dark:border-border-secondary focus:ring-accent-primary'} focus:outline-none focus:ring-1 disabled:opacity-50`}
              aria-invalid={error?.type === 'email'}
              aria-describedby={error?.type === 'email' ? 'email-error' : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
            {error?.type === 'email' && <p id="email-error" className="text-status-danger-foreground text-sm mt-1">{error.message}</p>}
          </div>
          <div>
            <label htmlFor="password"  className="block text-sm font-bold text-content-secondary text-left">{t('register_password_label')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className={`mt-1 w-full p-3 bg-background-tertiary dark:bg-background-primary text-content-primary border ${error?.type === 'password' ? 'border-status-danger-border focus:ring-status-danger-border' : 'border-border-secondary dark:border-border-secondary focus:ring-accent-primary'} focus:outline-none focus:ring-1 disabled:opacity-50`}
              aria-invalid={error?.type === 'password'}
              aria-describedby={error?.type === 'password' ? 'password-error' : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
           <div>
            <label htmlFor="confirm-password"  className="block text-sm font-bold text-content-secondary text-left">{t('register_confirm_password_label')}</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className={`mt-1 w-full p-3 bg-background-tertiary dark:bg-background-primary text-content-primary border ${error?.type === 'password' ? 'border-status-danger-border focus:ring-status-danger-border' : 'border-border-secondary dark:border-border-secondary focus:ring-accent-primary'} focus:outline-none focus:ring-1 disabled:opacity-50`}
              aria-invalid={error?.type === 'password'}
              aria-describedby={error?.type === 'password' ? 'password-error' : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
            {error?.type === 'password' && <p id="password-error" className="text-status-danger-foreground text-sm mt-1">{error.message}</p>}
          </div>

          {error?.type === 'general' && <p className="text-status-danger-foreground text-sm whitespace-pre-wrap">{error.message}</p>}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 text-base font-bold text-content-inverted-dark bg-accent-primary uppercase hover:bg-accent-primary-hover focus:outline-none transition-colors duration-200 flex items-center justify-center disabled:bg-gray-300 dark:disabled:bg-gray-700 rounded-lg shadow-md"
          >
            {isLoading ? <Spinner /> : t('register_button')}
          </button>
        </form>

        <p className="text-center text-sm text-content-secondary">
          {t('register_has_account')}{' '}
          <button onClick={onSwitchToLogin} disabled={isLoading} className="font-medium text-accent-primary hover:text-accent-primary-hover disabled:opacity-50">
            {t('register_login_link')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterView;