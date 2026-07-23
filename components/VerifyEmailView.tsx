import React, { useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as userService from '../services/userService';
import { User } from '../types';
import Button from './shared/Button';
import BrandLoader from './shared/BrandLoader';
import { CheckIcon } from './icons/CheckIcon';
import { WarningIcon } from './icons/WarningIcon';
import { deriveKey, hexToUint8Array } from '../utils/encryption';

interface VerifyEmailViewProps {
  onVerificationSuccess: (user: User, key: CryptoKey) => void;
}

const inputClass =
  'mt-1 w-full px-3 py-2.5 rounded-lg text-sm bg-background-primary border border-border-primary text-content-primary placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary transition-colors disabled:opacity-50';

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
        await userService.login(verifiedUser.email, password);
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
        setStatus('needsPassword');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 text-center bg-background-secondary border border-border-primary rounded-card shadow-card-elevated">
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4">
            <BrandLoader size="md" />
            <p className="text-lg text-content-secondary">{t('verifyEmail_loading')}</p>
          </div>
        )}
        {(status === 'needsPassword' || status === 'loggingIn') && verifiedUser && (
            <div className="w-full animate-fadeIn">
                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-status-success-background dark:bg-status-success-background rounded-full flex items-center justify-center">
                        <CheckIcon className="w-10 h-10 text-status-success-foreground dark:text-status-success-foreground" />
                    </div>
                    <h1 className="text-2xl font-semibold text-content-primary">{t('verifyEmail_success_title')}</h1>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <p className="text-center text-content-secondary">{t('verifyEmail_enter_password')}</p>
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
                            className={inputClass}
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
            <h1 className="text-2xl font-semibold text-content-primary">{t('verifyEmail_login_success')}</h1>
            <p className="text-lg text-content-secondary">{t('verifyEmail_redirecting')}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 animate-fadeIn">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
              <WarningIcon className="w-10 h-10 text-red-500 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-semibold text-content-primary">{t('verifyEmail_error_title')}</h1>
            <p className="text-status-danger-foreground">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailView;
