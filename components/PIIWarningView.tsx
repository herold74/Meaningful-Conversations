import React from 'react';
import { WarningIcon } from './icons/WarningIcon';
import { useLocalization } from '../context/LocalizationContext';

interface PIIWarningViewProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const PIIWarningView: React.FC<PIIWarningViewProps> = ({ onConfirm, onCancel }) => {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-fadeIn">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-status-warning-background dark:bg-status-warning-background border border-status-warning-border dark:border-status-warning-border/30">
        <div className="flex flex-col items-center">
          <WarningIcon className="w-16 h-16 text-status-warning-foreground" />
          <h1 className="mt-4 text-3xl font-bold text-content-primary uppercase">{t('piiWarning_title')}</h1>
        </div>
        <p className="text-lg text-content-secondary leading-relaxed">
          {t('piiWarning_subtitle')}
        </p>
        <div className="p-4 bg-background-secondary/50 dark:bg-background-primary border border-border-primary dark:border-border-primary text-left text-sm text-content-secondary">
          <p className="font-bold text-content-primary">{t('piiWarning_examples')}</p>
          <ul className="list-disc list-inside mt-2 space-y-1 whitespace-pre-line">
            {t('piiWarning_list').split('\n').map((item, index) => <li key={index}>{item}</li>)}
          </ul>
           <p className="mt-4">{t('piiWarning_advice')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 text-base font-bold text-status-warning-foreground bg-transparent border border-status-warning-foreground uppercase hover:bg-status-warning-foreground hover:text-content-inverted focus:outline-none transition-colors rounded-lg shadow-md"
          >
            {t('piiWarning_goBack')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 text-base font-bold text-button-foreground-on-accent bg-accent-primary uppercase hover:bg-accent-primary-hover focus:outline-none transition-colors rounded-lg shadow-md"
          >
            {t('piiWarning_continue')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PIIWarningView;