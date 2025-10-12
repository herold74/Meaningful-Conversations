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
      <div className="relative w-full max-w-md p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700">
        <button onClick={onBack} className="absolute left-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('login_title')}</h1>
        </div>

        {reason && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-300 flex items-start gap-3 text-sm text-left">
                <InfoIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p>{reason}</p>
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 dark:text-gray-300 text-left">{t('login_email_label')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1 w-full p-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
          <div>
            <div className="flex justify-between items-baseline">
                <label htmlFor="password"  className="block text-sm font-bold text-gray-700 dark:text-gray-300 text-left">{t('login_password_label')}</label>
                <button type="button" onClick={onForgotPassword} disabled={isLoading} className="text-xs text-green-600 hover:underline dark:text-green-400 disabled:opacity-50">
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
              className="mt-1 w-full p-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          {error && <p className="text-red-500 text-sm whitespace-pre-wrap">{error}</p>}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 focus:outline-none transition-colors duration-200 flex items-center justify-center disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            {isLoading ? <Spinner /> : t('login_button')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('login_no_account')}{' '}
          <button onClick={onSwitchToRegister} disabled={isLoading} className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50">
            {t('login_register_link')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginView;
