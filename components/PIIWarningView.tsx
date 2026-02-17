import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import Button from './shared/Button';

interface PIIWarningViewProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const PIIWarningView: React.FC<PIIWarningViewProps> = ({ onConfirm, onCancel }) => {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] text-center animate-fadeIn">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
        <div className="flex flex-col items-center">
          <div className="text-5xl">⚠️</div>
          <h1 className="mt-4 text-3xl font-bold text-content-primary uppercase">{t('piiWarning_title')}</h1>
        </div>
        <p className="text-lg text-content-secondary leading-relaxed">
          {t('piiWarning_subtitle')}
        </p>
        <div className="p-4 bg-white/60 dark:bg-background-primary border border-yellow-300 dark:border-yellow-700 rounded-lg text-left text-sm text-content-secondary">
          <p className="font-bold text-content-primary">{t('piiWarning_examples')}</p>
          <ul className="list-disc list-inside mt-2 space-y-1 whitespace-pre-line">
            {t('piiWarning_list').split('\n').map((item, index) => <li key={index}>{item}</li>)}
          </ul>
           <p className="mt-4">{t('piiWarning_advice')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button onClick={onCancel} variant="outline" size="lg" className="flex-1">
            {t('piiWarning_goBack')}
          </Button>
          <Button onClick={onConfirm} size="lg" className="flex-1">
            {t('piiWarning_continue')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PIIWarningView;