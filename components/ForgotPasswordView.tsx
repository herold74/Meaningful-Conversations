import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as userService from '../services/userService';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Button from './shared/Button';
import { MailIcon } from './icons/MailIcon';
import { CheckIcon } from './icons/CheckIcon';

interface ForgotPasswordViewProps {
  onBack: () => void;
}

const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onBack }) => {
  const { t, language } = useLocalization();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await userService.requestPasswordReset(email, language);
      setStatus('success');
    } catch (err: any) {
      console.error("Password reset request failed:", err);
      // For security, always show success to prevent email enumeration.
      // The error is logged for the developer.
      setStatus('success');
    }
  };
  
  const renderContent = () => {
    if (status === 'success') {
      return (
        <div className="text-center p-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <CheckIcon className="w-10 h-10 text-green-500 dark:text-green-400" />
            </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">{t('forgotPassword_success')}</p>
          <button onClick={onBack} className="mt-6 text-sm text-green-600 hover:underline dark:text-green-400">
            {t('forgotPassword_back_to_login')}
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('forgotPassword_title')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('forgotPassword_subtitle')}</p>
        </div>
        
        {/* E2EE Warning */}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl mt-0.5">🚨</div>
            <div>
              <h3 className="font-semibold text-content-primary mb-1">{t('forgotPassword_warning_title')}</h3>
              <p className="text-sm text-content-secondary">{t('forgotPassword_warning_text')}</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 dark:text-gray-300 text-left">{t('forgotPassword_email_label')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('forgotPassword_email_placeholder')}
              required
              className="mt-1 w-full p-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          {status === 'error' && <p className="text-status-danger-foreground text-sm whitespace-pre-wrap">{error}</p>}
          
          <Button
            type="submit"
            disabled={status === 'loading' || !email.trim()}
            loading={status === 'loading'}
            size="lg"
            fullWidth
            leftIcon={status !== 'loading' ? <MailIcon className="w-6 h-6" /> : undefined}
          >
            {t('forgotPassword_button')}
          </Button>
        </form>

        <p className="text-center text-sm">
          <button onClick={onBack} className="text-gray-600 hover:underline dark:text-gray-400">
            {t('forgotPassword_back_to_login')}
          </button>
        </p>
      </>
    );
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-fadeIn">
      <div className="relative w-full max-w-md p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
         {status !== 'success' && (
            <button onClick={onBack} className="absolute left-4 top-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
         )}
        {renderContent()}
      </div>
    </div>
  );
};

export default ForgotPasswordView;