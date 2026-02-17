import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';

interface InfoViewProps {
}

const FormattingHelpView: React.FC<InfoViewProps> = () => {
    const { t } = useLocalization();
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 mt-4 mb-10 animate-fadeIn">
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
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('formatting_emphasis_title')}</h2>
                    <p>{t('formatting_emphasis_p1')}</p>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-3 mt-2 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-800 dark:text-gray-200"><code>
                        {t('formatting_emphasis_code')}
                    </code></pre>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('formatting_lists_title')}</h2>
                    <p>{t('formatting_lists_p1')}</p>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-3 mt-2 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-800 dark:text-gray-200"><code>
                        {t('formatting_lists_code')}
                    </code></pre>
                    <div className="p-4 mt-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg not-prose">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl mt-0.5">⚠️</div>
                            <p className="text-sm text-content-secondary" dangerouslySetInnerHTML={{ __html: t('formatting_lists_warning') }} />
                        </div>
                    </div>
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
                    <div className="p-4 mt-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 dark:border-emerald-600 rounded-lg not-prose">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl mt-0.5">ℹ️</div>
                            <p className="text-sm text-content-secondary" dangerouslySetInnerHTML={{__html: t('formatting_manual_p2')}}/>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FormattingHelpView;