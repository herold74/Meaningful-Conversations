import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as userService from '../services/userService';
import { User } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Spinner from './shared/Spinner';
import { deriveKey, hexToUint8Array } from '../utils/encryption';
import { InfoIcon } from './icons/InfoIcon';

interface LoginViewProps {
  onLoginSuccess: (user: User, key: CryptoKey) => void;
  onAccessExpired: (email: string) => void;
  onSwitchToRegister: () => void;
  onBack: () => void;
  onForgotPassword: () => void;
  reason?: string | null;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onAccessExpired, onSwitchToRegister, onBack, onForgotPassword, reason }) => {
  const { t } = useLocalization();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    try {
        const { user, token } = await userService.login(trimmedEmail, trimmedPassword);
        
        if (!user.encryptionSalt) {
            throw new Error("Encryption salt is missing for this user.");
        }
        
        // The salt is hex-encoded on the backend, decode it to a byte array for the Web Crypto API
        const saltBytes = hexToUint8Array(user.encryptionSalt);
        
        const key = await deriveKey(trimmedPassword, saltBytes);
        
        onLoginSuccess(user, key);

    } catch (err: any) {
        console.error("Login failed:", err);
        if (err.status === 403 && err.data?.errorCode === 'ACCESS_EXPIRED') {
            onAccessExpired(trimmedEmail);
        } else if (err.isNetworkError) {
            setError(t('error_network_detailed', { url: err.backendUrl }));
        } else if (err.status === 401) {
            setError(t('login_error_credentials'));
        } else if (err.status === 403) {
            setError(err.message || 'An error occurred.'); // The backend sends a specific "pending verification" message.
        } else {
            setError(err.message || 'An unknown error occurred. Please try again.');
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
          <h1 className="text-3xl font-bold text-content-primary uppercase">{t('login_title')}</h1>
        </div>

        {reason && (
            <div className="p-4 bg-status-info-background dark:bg-status-info-background border border-status-info-border dark:border-status-info-border/30 text-status-info-foreground dark:text-status-info-foreground flex items-start gap-3 text-sm text-left">
                <InfoIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p>{reason}</p>
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-content-secondary text-left">{t('login_email_label')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1 w-full p-3 bg-background-tertiary dark:bg-background-primary text-content-primary border border-border-secondary dark:border-border-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary disabled:opacity-50"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
          <div>
            <div className="flex justify-between items-baseline">
                <label htmlFor="password"  className="block text-sm font-bold text-content-secondary text-left">{t('login_password_label')}</label>
                <button type="button" onClick={onForgotPassword} disabled={isLoading} className="text-xs text-accent-primary hover:underline disabled:opacity-50">
                    {t('login_forgot_password')}
                </button>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1 w-full p-3 bg-background-tertiary dark:bg-background-primary text-content-primary border border-border-secondary dark:border-border-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary disabled:opacity-50"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          {error && <p className="text-status-danger-foreground text-sm whitespace-pre-wrap">{error}</p>}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 text-base font-bold text-button-foreground-on-accent bg-accent-primary uppercase hover:bg-accent-primary-hover focus:outline-none transition-colors duration-200 flex items-center justify-center disabled:bg-gray-300 dark:disabled:bg-gray-700 rounded-lg shadow-md"
          >
            {isLoading ? <Spinner /> : t('login_button')}
          </button>
        </form>

        <p className="text-center text-sm text-content-secondary">
          {t('login_no_account')}{' '}
          <button onClick={onSwitchToRegister} disabled={isLoading} className="font-medium text-accent-primary hover:text-accent-primary-hover disabled:opacity-50">
            {t('login_register_link')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginView;