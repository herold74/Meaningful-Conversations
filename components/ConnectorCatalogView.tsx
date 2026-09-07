import React, { useEffect, useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import BrandLoader from './shared/BrandLoader';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import * as geminiService from '../services/geminiService';
import { CONNECTOR_AVATARS } from '../utils/connectorRun';
import type { ConnectorVignetteCatalogEntry } from '../types';

interface ConnectorCatalogViewProps {
  onStartPractice: (vignetteId: string, liveMode: boolean) => void;
  onBack: () => void;
  onNewAssessment?: () => void;
  isStarting: boolean;
}

const ConnectorCatalogView: React.FC<ConnectorCatalogViewProps> = ({
  onStartPractice,
  onBack,
  onNewAssessment,
  isStarting,
}) => {
  const { t, language } = useLocalization();
  const [liveMode, setLiveMode] = useState(false);
  const [catalog, setCatalog] = useState<ConnectorVignetteCatalogEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    geminiService.fetchConnectorCatalog(language)
      .then((res) => {
        if (!cancelled) setCatalog(res.vignettes);
      })
      .catch(() => {
        if (!cancelled) setLoadError(t('connector_catalog_load_error'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [language, t]);

  if (isLoading || isStarting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BrandLoader />
        <p className="mt-4 text-content-secondary">
          {isStarting ? t('connector_intro_starting') : t('connector_catalog_loading')}
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center">
        <p className="text-content-secondary mb-4">{loadError}</p>
        <button
          type="button"
          onClick={onBack}
          className="py-2 px-4 border border-border-primary rounded-lg text-content-secondary"
        >
          {t('connector_intro_back')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-background-secondary/80 dark:bg-background-secondary/40 backdrop-blur-sm border border-border-primary/60 shadow-card rounded-card p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-content-primary mb-1">
          {t('connector_catalog_title')}
        </h1>
        <p className="text-content-secondary text-sm mb-6">{t('connector_catalog_subtitle')}</p>

        <div className="rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary p-4 mb-6">
          <h2 className="font-semibold text-content-primary mb-2 text-sm">{t('connector_intro_mode_title')}</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setLiveMode(false)}
              className={`flex-1 flex items-center gap-3 p-3 rounded-lg border transition-colors ${!liveMode
                ? 'border-accent-primary bg-accent-primary/10 text-content-primary'
                : 'border-border-secondary text-content-secondary hover:border-accent-primary/50'}`}
            >
              <ChatBubbleIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm text-left">{t('connector_intro_mode_text')}</span>
            </button>
            <button
              type="button"
              onClick={() => setLiveMode(true)}
              className={`flex-1 flex items-center gap-3 p-3 rounded-lg border transition-colors ${liveMode
                ? 'border-accent-primary bg-accent-primary/10 text-content-primary'
                : 'border-border-secondary text-content-secondary hover:border-accent-primary/50'}`}
            >
              <SoundWaveIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm text-left">{t('connector_intro_mode_voice')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {catalog.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onStartPractice(v.id, liveMode)}
              className="text-left rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary p-4 hover:border-accent-primary/60 hover:bg-accent-primary/5 transition-colors"
            >
              <div className="flex gap-3">
                <img
                  src={CONNECTOR_AVATARS[v.id] || '/avatars/nobody.png'}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover shrink-0 bg-background-secondary"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-content-primary">{v.personaName}</p>
                  <p className="text-xs text-content-tertiary mb-1">{v.relationship}</p>
                  <p className="text-sm text-content-secondary leading-snug">{v.pickerTeaser}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {onNewAssessment && (
            <button
              type="button"
              onClick={onNewAssessment}
              className="py-3 px-6 border border-border-primary text-content-secondary hover:text-content-primary font-medium rounded-lg transition-colors"
            >
              {t('connector_catalog_new_assessment')}
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="py-3 px-6 border border-border-primary text-content-secondary hover:text-content-primary font-medium rounded-lg transition-colors"
          >
            {t('connector_intro_back')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectorCatalogView;
