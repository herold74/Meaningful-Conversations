import React, { useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as userService from '../services/userService';
import { User } from '../types';
import Button from './shared/Button';
import Spinner from './shared/Spinner';
import { CheckIcon } from './icons/CheckIcon';
import { WarningIcon } from './icons/WarningIcon';
import { deriveKey, hexToUint8Array } from '../utils/encryption';

interface VerifyEmailViewProps {
  onVerificationSuccess: (user: User, key: CryptoKey) => void;
}

const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({ onVerificationSuccess }) => {
  const { t } = useLocalization();
  const [status, setStatus] = useState<'verifying' | 'needsPassword' | 'loggingIn' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (status !== 'verifying') return;

    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
        setError('No verification token found in URL.');
        setStatus('error');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    const verify = async () => {
      try {
        const { user } = await userService.verifyEmail(token);
        setVerifiedUser(user);
        setStatus('needsPassword');
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
        setStatus('error');
      }
      finally {
        // Clean the URL after the verification attempt to prevent re-use on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    verify();
  }, [status]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !verifiedUser || !verifiedUser.encryptionSalt) return;

    setStatus('loggingIn');
    setError('');

    try {
        // First, verify the password is correct by attempting a login.
        // This prevents the user from getting stuck with a bad key.
        await userService.login(verifiedUser.email, password);
        
        // If login is successful, we know the password is correct, so we can derive the key.
        const key = await deriveKey(password, hexToUint8Array(verifiedUser.encryptionSalt));

        setStatus('success');
        setTimeout(() => {
            onVerificationSuccess(verifiedUser, key);
        }, 1500);

    } catch (err: any) {
        if (err.status === 401) {
            setError(t('login_error_credentials'));
        } else {
            setError(err.message || 'Login failed after verification.');
        }
        setStatus('needsPassword'); // Go back to password entry
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 text-center bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700">
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4">
            <Spinner />
            <p className="text-lg text-gray-600 dark:text-gray-400">{t('verifyEmail_loading')}</p>
          </div>
        )}
        {(status === 'needsPassword' || status === 'loggingIn') && verifiedUser && (
            <div className="w-full animate-fadeIn">
                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-status-success-background dark:bg-status-success-background rounded-full flex items-center justify-center">
                        <CheckIcon className="w-10 h-10 text-status-success-foreground dark:text-status-success-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t('verifyEmail_success_title')}</h1>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <p className="text-center text-gray-600 dark:text-gray-400">{t('verifyEmail_enter_password')}</p>
                    <div>
                        <label htmlFor="password" className="sr-only">{t('login_password_label')}</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                            disabled={status === 'loggingIn'}
                            className="mt-1 w-full p-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                            placeholder={t('login_password_label')}
                        />
                    </div>

                    {error && <p className="text-status-danger-foreground text-sm">{error}</p>}

                    <Button type="submit" disabled={status === 'loggingIn' || !password} loading={status === 'loggingIn'} size="lg" fullWidth>
                        {t('login_button')}
                    </Button>
                </form>
            </div>
        )}
         {status === 'success' && (
          <div className="flex flex-col items-center gap-4 animate-fadeIn">
            <div className="w-16 h-16 bg-status-success-background dark:bg-status-success-background rounded-full flex items-center justify-center">
              <CheckIcon className="w-10 h-10 text-status-success-foreground dark:text-status-success-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t('verifyEmail_login_success')}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">{t('verifyEmail_redirecting')}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 animate-fadeIn">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
              <WarningIcon className="w-10 h-10 text-red-500 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t('verifyEmail_error_title')}</h1>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailView;