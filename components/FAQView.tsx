import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';

interface InfoViewProps {
    onBack: () => void;
}

const FAQView: React.FC<InfoViewProps> = ({ onBack }) => {
    const { t } = useLocalization();
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn">
            <div className="relative text-center">
                <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('faq_title')}</h1>
            </div>
            <div className="space-y-6 text-gray-700 dark:text-gray-300">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('faq_q1_q')}</h2>
                    <p className="mt-2 leading-relaxed">{t('faq_q1_a')}</p>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('faq_q2_q')}</h2>
                    <p className="mt-2 leading-relaxed">{t('faq_q2_a')}</p>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('faq_q3_q')}</h2>
                    <p className="mt-2 leading-relaxed">{t('faq_q3_a')}</p>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('faq_q4_q')}</h2>
                    <p className="mt-2 leading-relaxed">{t('faq_q4_a')}</p>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('faq_q5_q')}</h2>
                    <p className="mt-2 leading-relaxed">
                        {t('faq_q5_a')}
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 pl-4">
                        <li>{t('faq_q5_a_li1')}</li>
                        <li>{t('faq_q5_a_li2')}</li>
                    </ul>
                    <p className="mt-2 leading-relaxed">
                        {t('faq_q5_a_footer')}
                    </p>
                </div>
                 <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('faq_q6_q')}</h2>
                    <p className="mt-2 leading-relaxed">{t('faq_q6_a')}</p>
                </div>
            </div>
        </div>
    );
};

export default FAQView;