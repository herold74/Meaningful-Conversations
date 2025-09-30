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
      <div className="w-full max-w-2xl p-8 space-y-6 bg-yellow-50 dark:bg-transparent border border-yellow-400 dark:border-yellow-500">
        <div className="flex flex-col items-center">
          <WarningIcon className="w-16 h-16 text-yellow-500 dark:text-yellow-400" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('piiWarning_title')}</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          {t('piiWarning_subtitle')}
        </p>
        <div className="p-4 bg-yellow-50/50 dark:bg-gray-900 border border-yellow-200 dark:border-gray-700 text-left text-sm text-gray-600 dark:text-gray-400">
          <p className="font-bold text-gray-700 dark:text-gray-300">{t('piiWarning_examples')}</p>
          <ul className="list-disc list-inside mt-2 space-y-1 whitespace-pre-line">
            {t('piiWarning_list').split('\n').map((item, index) => <li key={index}>{item}</li>)}
          </ul>
           <p className="mt-4">{t('piiWarning_advice')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 text-base font-bold text-yellow-600 dark:text-yellow-400 bg-transparent border border-yellow-600 dark:border-yellow-400 uppercase hover:bg-yellow-600 dark:hover:bg-yellow-400 hover:text-white dark:hover:text-black focus:outline-none transition-colors"
          >
            {t('piiWarning_goBack')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 focus:outline-none transition-colors"
          >
            {t('piiWarning_continue')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PIIWarningView;