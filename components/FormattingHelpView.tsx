import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';
import { InfoIcon } from './icons/InfoIcon';

interface InfoViewProps {
}

const FormattingHelpView: React.FC<InfoViewProps> = () => {
    const { t } = useLocalization();
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('formatting_title')}</h1>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed">
                <p dangerouslySetInnerHTML={{ __html: t('formatting_p1') }} />

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('formatting_headings_title')}</h2>
                    <p>{t('formatting_headings_p1')}</p>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-3 mt-2 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-800 dark:text-gray-200"><code>
                        {t('formatting_headings_code')}
                    </code></pre>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('formatting_bold_title')}</h2>
                    <p>{t('formatting_bold_p1')}</p>
                     <pre className="bg-gray-100 dark:bg-gray-900 p-3 mt-2 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-800 dark:text-gray-200"><code>
                        {t('formatting_bold_code')}
                    </code></pre>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('formatting_lists_title')}</h2>
                    <p>{t('formatting_lists_p1')}</p>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-3 mt-2 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-800 dark:text-gray-200"><code>
                        {t('formatting_lists_code')}
                    </code></pre>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('formatting_separators_title')}</h2>
                    <p>{t('formatting_separators_p1')}</p>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-3 mt-2 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-800 dark:text-gray-200"><code>
                        {t('formatting_separators_code')}
                    </code></pre>
                </div>
                
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('formatting_manual_title')}</h2>
                    <p dangerouslySetInnerHTML={{ __html: t('formatting_manual_p1') }} />
                     <div className="p-4 mt-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-500 text-green-800 dark:text-green-300 flex items-start gap-4 not-prose">
                        <InfoIcon className="w-8 h-8 flex-shrink-0 mt-1" />
                        <p className="font-bold">{t('formatting_manual_p2')}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FormattingHelpView;