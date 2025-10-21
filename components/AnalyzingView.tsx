import React from 'react';
import Spinner from './shared/Spinner';
import { useLocalization } from '../context/LocalizationContext';

const AnalyzingView: React.FC = () => {
    const { t, language } = useLocalization();
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadeIn text-center">
            <Spinner />
            <h1 className="mt-6 text-2xl font-bold text-gray-200">{t('analyzing_title')}</h1>
            {language === 'de' ? (
                <p className="mt-2 text-lg text-gray-400">
                    Ihr Coach bereitet Ihre<br className="sm:hidden" /> Sitzungszusammenfassung vor.
                </p>
            ) : (
                <p className="mt-2 text-lg text-gray-400">{t('analyzing_subtitle')}</p>
            )}
        </div>
    );
};

export default AnalyzingView;