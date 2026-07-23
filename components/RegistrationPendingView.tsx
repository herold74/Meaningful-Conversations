import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { MailIcon } from './icons/MailIcon';
import Button from './shared/Button';

interface RegistrationPendingViewProps {
  onGoToLogin: () => void;
}

const RegistrationPendingView: React.FC<RegistrationPendingViewProps> = ({ onGoToLogin }) => {
  const { t } = useLocalization();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-background-secondary border border-border-primary">
        <div className="w-16 h-16 bg-status-success-background rounded-full flex items-center justify-center mb-4 mx-auto">
          <MailIcon className="w-10 h-10 text-status-success-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-content-primary">{t('register_pending_title')}</h1>
        <p className="text-lg text-content-secondary leading-relaxed">
          {t('register_pending_subtitle')}
        </p>
        <p className="text-sm text-content-subtle">
          {t('register_pending_spam')}
        </p>
        <div className="pt-4">
          <Button onClick={onGoToLogin} size="lg" fullWidth>
            {t('login_button')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPendingView;