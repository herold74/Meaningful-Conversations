import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as userService from '../services/userService';
import { User } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Spinner from './shared/Spinner';
import { deriveKey, hexToUint8Array } from '../utils/encryption';

interface RegisterViewProps {
  onRegisterSuccess: (user: User, key: CryptoKey) => void;
  onSwitchToLogin: () => void;
  onBack: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onRegisterSuccess, onSwitchToLogin, onBack }) => {
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
      const { user } = await userService.register(trimmedEmail, trimmedPassword);
      
      if (!user.encryptionSalt) {
            throw new Error("Encryption salt was not created for the new user.");
      }
      
      const saltBytes = hexToUint8Array(user.encryptionSalt);
      const key = await deriveKey(trimmedPassword, saltBytes);

      onRegisterSuccess(user, key);

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
      <div className="relative w-full max-w-md p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700">
         <button onClick={onBack} className="absolute left-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('register_title')}</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email"  className="block text-sm font-bold text-gray-700 dark:text-gray-300 text-left">{t('register_email_label')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className={`mt-1 w-full p-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border ${error?.type === 'email' ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'} focus:outline-none focus:ring-1 disabled:opacity-50`}
              aria-invalid={error?.type === 'email'}
              aria-describedby={error?.type === 'email' ? 'email-error' : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
            {error?.type === 'email' && <p id="email-error" className="text-red-500 text-sm mt-1">{error.message}</p>}
          </div>
          <div>
            <label htmlFor="password"  className="block text-sm font-bold text-gray-700 dark:text-gray-300 text-left">{t('register_password_label')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className={`mt-1 w-full p-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border ${error?.type === 'password' ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'} focus:outline-none focus:ring-1 disabled:opacity-50`}
              aria-invalid={error?.type === 'password'}
              aria-describedby={error?.type === 'password' ? 'password-error' : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
           <div>
            <label htmlFor="confirm-password"  className="block text-sm font-bold text-gray-700 dark:text-gray-300 text-left">{t('register_confirm_password_label')}</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className={`mt-1 w-full p-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border ${error?.type === 'password' ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'} focus:outline-none focus:ring-1 disabled:opacity-50`}
              aria-invalid={error?.type === 'password'}
              aria-describedby={error?.type === 'password' ? 'password-error' : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
            {error?.type === 'password' && <p id="password-error" className="text-red-500 text-sm mt-1">{error.message}</p>}
          </div>

          {error?.type === 'general' && <p className="text-red-500 text-sm whitespace-pre-wrap">{error.message}</p>}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 focus:outline-none transition-colors duration-200 flex items-center justify-center disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            {isLoading ? <Spinner /> : t('register_button')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('register_has_account')}{' '}
          <button onClick={onSwitchToLogin} disabled={isLoading} className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50">
            {t('register_login_link')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterView;