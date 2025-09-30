import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';

interface InfoViewProps {
    onBack: () => void;
}

const DisclaimerView: React.FC<InfoViewProps> = ({ onBack }) => {
    const { t } = useLocalization();
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn">
            <div className="relative text-center">
                <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('disclaimer_title')}</h1>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4 leading-relaxed">
                <p>{t('disclaimer_p1')}</p>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('disclaimer_professional_title')}</h2>
                <p>{t('disclaimer_professional_p1')}</p>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('disclaimer_guarantees_title')}</h2>
                <p>{t('disclaimer_guarantees_p1')}</p>
            </div>
        </div>
    );
};

export default DisclaimerView;