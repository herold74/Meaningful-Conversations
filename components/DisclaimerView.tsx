import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';
import { User } from '../types';
import { DeleteIcon } from './icons/DeleteIcon';

interface DisclaimerViewProps {
    onBack: () => void;
    currentUser: User | null;
    onDeleteAccount: () => void;
}

const DisclaimerView: React.FC<DisclaimerViewProps> = ({ onBack, currentUser, onDeleteAccount }) => {
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

            {currentUser && (
                <div className="mt-8 pt-6 border-t border-dashed border-gray-300 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">{t('menu_delete_account')}</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('disclaimer_delete_warning') }} />
                    <div className="mt-4 text-center">
                         <button 
                            onClick={onDeleteAccount} 
                            className="inline-flex items-center justify-center gap-3 px-6 py-2 text-base font-bold text-white bg-red-600 uppercase hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-950"
                        >
                            <DeleteIcon className="w-5 h-5" />
                            {t('deleteAccount_confirm')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisclaimerView;