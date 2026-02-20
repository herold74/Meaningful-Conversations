import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import ImprintView from './ImprintView';
import PrivacyPolicyView from './PrivacyPolicyView';
import TermsView from './TermsView';

const LegalView: React.FC = () => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useState<'imprint' | 'privacy' | 'terms'>('imprint');

    const tabs = [
        { id: 'imprint' as const, label: t('legal_tab_imprint') },
        { id: 'privacy' as const, label: t('legal_tab_privacy') },
        { id: 'terms' as const, label: t('legal_tab_terms') },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto mt-4 mb-10 animate-fadeIn">
            <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-content-primary uppercase">{t('legal_title')}</h1>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-border-secondary dark:border-border-primary mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-base font-semibold uppercase transition-colors text-center ${
                            activeTab === tab.id
                                ? 'text-accent-primary border-b-2 border-accent-primary'
                                : 'text-content-subtle hover:text-content-secondary'
                        }`}
                    >
                        {tab.id === 'terms' ? (
                            <>
                                <span className="sm:hidden leading-tight">
                                    NUTZUNGS-<br />BEDINGUNGEN
                                </span>
                                <span className="hidden sm:inline">{tab.label}</span>
                            </>
                        ) : tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-fadeIn">
                {activeTab === 'imprint' && <ImprintView />}
                {activeTab === 'privacy' && <PrivacyPolicyView />}
                {activeTab === 'terms' && <TermsView />}
            </div>
        </div>
    );
};

export default LegalView;

