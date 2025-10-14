import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';

interface InfoViewProps {
    onBack: () => void;
}

const FormattingHelpView: React.FC<InfoViewProps> = ({ onBack }) => {
    const { t } = useLocalization();
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn">
            <div className="relative text-center">
                <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('formatting_title')}</h1>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed">
                <p dangerouslySetInnerHTML={{ __html: t('formatting_p1') }} />

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('formatting_headings_title')}</h2>
                    <p>{t('formatting_headings_p1')}</p>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-3 mt-2 border border-gray-200 dark:border-gray-700 text-sm font-mono"><code>
                        {t('formatting_headings_code')}
                    </code></pre>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('formatting_bold_title')}</h2>
                    <p>{t('formatting_bold_p1')}</p>
                     <pre className="bg-gray-100 dark:bg-gray-900 p-3 mt-2 border border-gray-200 dark:border-gray-700 text-sm font-mono"><code>
                        {t('formatting_bold_code')}
                    </code></pre>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('formatting_lists_title')}</h2>
                    <p>{t('formatting_lists_p1')}</p>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-3 mt-2 border border-gray-200 dark:border-gray-700 text-sm font-mono"><code>
                        {t('formatting_lists_code')}
                    </code></pre>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('formatting_separators_title')}</h2>
                    <p>{t('formatting_separators_p1')}</p>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-3 mt-2 border border-gray-200 dark:border-gray-700 text-sm font-mono"><code>
                        {t('formatting_separators_code')}
                    </code></pre>
                </div>
                
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('formatting_manual_title')}</h2>
                    <p dangerouslySetInnerHTML={{ __html: t('formatting_manual_p1') }} />
                    <p>{t('formatting_manual_p2')}</p>
                </div>

            </div>
        </div>
    );
};

export default FormattingHelpView;