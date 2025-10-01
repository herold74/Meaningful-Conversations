import React from 'react';
import { User } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { UploadIcon } from './icons/UploadIcon';
import { FileTextIcon } from './icons/FileTextIcon';

interface ContextChoiceViewProps {
  user: User;
  savedContext: string;
  onContinue: () => void;
  onStartNew: () => void;
}

const ContextChoiceView: React.FC<ContextChoiceViewProps> = ({ user, savedContext, onContinue, onStartNew }) => {
  const { t } = useLocalization();

  // Show the full context, trimmed.
  const contextPreview = savedContext.trim();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-fadeIn">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">
          {t('contextChoice_welcome_back')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          {t('contextChoice_subtitle')}
        </p>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-left">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">{t('contextChoice_preview_title')}</h2>
          <pre className="font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
            <code>{contextPreview}</code>
          </pre>
        </div>

        <div className="space-y-4 pt-4">
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 focus:outline-none transition-colors duration-200"
          >
            <FileTextIcon className="w-6 h-6" />
            {t('contextChoice_continue')}
          </button>
           <button
            onClick={onStartNew}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-gray-700 dark:text-gray-300 bg-transparent border border-gray-400 dark:border-gray-700 uppercase hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <UploadIcon className="w-6 h-6" />
            {t('contextChoice_start_new')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContextChoiceView;