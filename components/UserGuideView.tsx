import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';

interface InfoViewProps {
    onBack: () => void;
}

const UserGuideView: React.FC<InfoViewProps> = ({ onBack }) => {
    const { t } = useLocalization();
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn">
            <div className="relative text-center">
                <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('userGuide_title')}</h1>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4 leading-relaxed">
                <p>{t('userGuide_p1')}</p>
                
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('userGuide_gettingStarted_title')}</h2>
                <p>{t('userGuide_gettingStarted_p1')}</p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>{t('userGuide_gettingStarted_li1')}</li>
                    <li>{t('userGuide_gettingStarted_li2')}</li>
                    <li>{t('userGuide_gettingStarted_li3')}</li>
                </ul>

                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('userGuide_theSession_title')}</h2>
                <p>{t('userGuide_theSession_p1')}</p>
                <p>{t('userGuide_theSession_p2')}</p>

                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('userGuide_sessionReview_title')}</h2>
                <p>{t('userGuide_sessionReview_p1')}</p>
                <p>{t('userGuide_sessionReview_p2')}</p>

                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('userGuide_gamification_title')}</h2>
                <p>{t('userGuide_gamification_p1')}</p>
            </div>
        </div>
    );
};

export default UserGuideView;
