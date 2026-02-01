import React, { useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { apiFetch } from '../services/api';
import Spinner from './shared/Spinner';
import Button from './shared/Button';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { MailIcon } from './icons/MailIcon';

interface UnsubscribeViewProps {
  token: string;
  onBack: () => void;
}

const UnsubscribeView: React.FC<UnsubscribeViewProps> = ({ token, onBack }) => {
  const { t } = useLocalization();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_unsubscribed'>('loading');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    handleUnsubscribe();
  }, [token]);

  const handleUnsubscribe = async () => {
    try {
      const response = await apiFetch(`/newsletter/unsubscribe/${token}`, {
        method: 'GET',
      });

      if (response.alreadyUnsubscribed) {
        setStatus('already_unsubscribed');
      } else {
        setStatus('success');
        setEmail(response.email);
      }
    } catch (err: any) {
      console.error('Unsubscribe error:', err);
      setError(err.message || 'Failed to unsubscribe');
      setStatus('error');
    }
  };

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="text-center p-8">
          <Spinner />
          <p className="mt-4 text-content-secondary">{t('unsubscribe_loading')}</p>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4 mx-auto">
            <CheckIcon className="w-10 h-10 text-green-500 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-content-primary mb-2">{t('unsubscribe_success_title')}</h2>
          <p className="text-content-secondary mb-4">
            {email && (
              <>{t('unsubscribe_success_email', { email })}</>
            )}
            {!email && <>{t('unsubscribe_success_generic')}</>}
          </p>
          <p className="text-sm text-content-tertiary">
            {t('unsubscribe_success_note')}
          </p>
          <Button onClick={onBack} size="lg" className="mt-6">
            {t('unsubscribe_back_home')}
          </Button>
        </div>
      );
    }

    if (status === 'already_unsubscribed') {
      return (
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4 mx-auto">
            <MailIcon className="w-10 h-10 text-blue-500 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-content-primary mb-2">{t('unsubscribe_already_title')}</h2>
          <p className="text-content-secondary mb-4">
            {t('unsubscribe_already_desc')}
          </p>
          <Button onClick={onBack} size="lg" className="mt-6">
            {t('unsubscribe_back_home')}
          </Button>
        </div>
      );
    }

    // Error state
    return (
      <div className="text-center p-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4 mx-auto">
          <XIcon className="w-10 h-10 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-content-primary mb-2">{t('unsubscribe_error_title')}</h2>
        <p className="text-content-secondary mb-4">
          {error || t('unsubscribe_error_invalid_link')}
        </p>
        <p className="text-sm text-content-tertiary mb-6">
          {t('unsubscribe_error_contact')}
        </p>
        <Button onClick={onBack} size="lg">
          {t('unsubscribe_back_home')}
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-fadeIn">
      <div className="w-full max-w-md p-8 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary rounded-lg shadow-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default UnsubscribeView;

