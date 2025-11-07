import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { MailIcon } from './icons/MailIcon';
import { CheckIcon } from './icons/CheckIcon';

interface RegistrationPendingViewProps {
  onGoToLogin: () => void;
}

const RegistrationPendingView: React.FC<RegistrationPendingViewProps> = ({ onGoToLogin }) => {
  const { t } = useLocalization();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-fadeIn">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700">
        <div className="w-16 h-16 bg-status-success-background dark:bg-status-success-background rounded-full flex items-center justify-center mb-4 mx-auto">
          <MailIcon className="w-10 h-10 text-status-success-foreground dark:text-status-success-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('register_pending_title')}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          {t('register_pending_subtitle')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          {t('register_pending_spam')}
        </p>
        <div className="pt-4">
          <button
            onClick={onGoToLogin}
            className="w-full px-6 py-3 text-base font-bold text-button-foreground-on-accent bg-accent-primary uppercase hover:bg-accent-primary-hover focus:outline-none transition-colors duration-200 rounded-lg shadow-md"
          >
            {t('login_button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPendingView;