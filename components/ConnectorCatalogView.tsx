import React, { useEffect, useId, useState } from 'react';
import { Info } from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import BrandLoader from './shared/BrandLoader';
import ModalOverlay from './shared/ModalOverlay';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import * as geminiService from '../services/geminiService';
import { ApiError } from '../services/api';
import { CONNECTOR_AVATARS } from '../utils/connectorRun';
import type { ConnectorVignetteCatalogEntry, User } from '../types';
import { resolveConnectorPremiumAccess } from '../utils/connectorAccess';

interface ConnectorCatalogViewProps {
  currentUser: User | null;
  onStartPractice: (vignetteId: string, liveMode: boolean) => void;
  onOpenSituation: () => void;
  onBack: () => void;
  onNewAssessment?: () => void;
  onUpgrade?: () => void;
  isStarting: boolean;
}

const ConnectorCatalogView: React.FC<ConnectorCatalogViewProps> = ({
  currentUser,
  onStartPractice,
  onOpenSituation,
  onBack,
  onNewAssessment,
  onUpgrade,
  isStarting,
}) => {
  const { t, language } = useLocalization();
  const openSituationDescId = useId();
  const premiumAccess = resolveConnectorPremiumAccess(currentUser);
  const practiceLocked = !premiumAccess.canAccessConnectorPractice;
  const [liveMode, setLiveMode] = useState(false);
  const [signatureInfoOpen, setSignatureInfoOpen] = useState(false);
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
      .catch((err: unknown) => {
        if (!cancelled) {
          if (err instanceof ApiError && err.data?.errorCode === 'CONNECTOR_PREMIUM_REQUIRED') {
            setLoadError(t('connector_catalog_premium_required'));
          } else {
            setLoadError(t('connector_catalog_load_error'));
          }
        }
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
        <p className="text-content-secondary text-sm mb-4">{t('connector_catalog_subtitle')}</p>

        {practiceLocked && (
          <div className="mb-6 rounded-xl border border-accent-primary/40 bg-accent-primary/5 p-4 text-sm text-content-secondary">
            <p className="mb-3">{t('connector_catalog_premium_required')}</p>
            <button
              type="button"
              onClick={() => onUpgrade?.()}
              className="py-2 px-4 rounded-lg bg-accent-primary text-button-foreground-on-accent font-semibold text-sm"
            >
              {t('connector_catalog_premium_cta')}
            </button>
          </div>
        )}

        <div className="rounded-xl border border-accent-primary/50 bg-accent-primary/5 p-4 mb-6 hover:border-accent-primary transition-colors">
          <div className="flex gap-2 items-start">
            <button
              type="button"
              onClick={() => (practiceLocked ? onUpgrade?.() : onOpenSituation())}
              aria-label={t('connector_catalog_open_situation')}
              aria-describedby={openSituationDescId}
              className="flex gap-3 flex-1 min-w-0 text-left"
            >
              <img
                src="/avatars/nobody.png"
                alt=""
                className="w-12 h-12 rounded-full object-cover shrink-0 bg-background-secondary"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-content-primary" aria-hidden>
                  {t('connector_catalog_open_situation')}
                </p>
                <p
                  id={openSituationDescId}
                  className="text-sm text-content-secondary mt-1"
                >
                  {t('connector_catalog_open_situation_desc')}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSignatureInfoOpen(true)}
              aria-label={t('connector_signature_info_label')}
              className="shrink-0 inline-flex items-center justify-center p-2 rounded-lg text-accent-primary hover:bg-accent-primary/10 transition-colors"
            >
              <Info className="w-5 h-5" aria-hidden />
            </button>
          </div>
        </div>

        <ModalOverlay
          isOpen={signatureInfoOpen}
          onClose={() => setSignatureInfoOpen(false)}
          title={t('connector_signature_info_title')}
        >
          <p className="text-sm text-content-secondary leading-relaxed whitespace-pre-line">
            {t('connector_signature_info_body')}
          </p>
          <button
            type="button"
            onClick={() => setSignatureInfoOpen(false)}
            className="mt-6 w-full py-2.5 rounded-lg btn-accent-solid text-sm font-semibold"
          >
            {t('aria_close')}
          </button>
        </ModalOverlay>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 items-stretch">
          {catalog.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => (practiceLocked ? onUpgrade?.() : onStartPractice(v.id, liveMode))}
              className={`text-left h-full rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary p-4 transition-colors ${
                practiceLocked ? 'opacity-60' : 'hover:border-accent-primary/60 hover:bg-accent-primary/5'
              }`}
            >
              <div className="flex gap-3 h-full">
                <img
                  src={CONNECTOR_AVATARS[v.id] || '/avatars/nobody.png'}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover shrink-0 self-start bg-background-secondary"
                />
                <div className="min-w-0 flex-1 flex flex-col">
                  <p className="font-semibold text-content-primary line-clamp-1 min-h-5 leading-5">
                    {v.personaName}
                  </p>
                  <p className="text-xs text-content-tertiary line-clamp-2 min-h-7 leading-5">
                    {v.relationship}
                  </p>
                  <p className="text-sm font-medium text-content-primary line-clamp-2 leading-snug">
                    {v.pickerTeaser}
                  </p>
                  <p className="text-xs text-content-secondary line-clamp-2 leading-snug mt-1">
                    {v.scenarioBrief}
                  </p>
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
              className="flex-1 py-3 px-6 bg-accent-primary hover:bg-accent-primary/90 text-white font-semibold rounded-lg transition-colors"
            >
              {t('connector_catalog_new_assessment')}
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="py-3 px-6 border border-border-primary text-content-secondary hover:text-content-primary font-medium rounded-lg transition-colors sm:shrink-0"
          >
            {t('connector_intro_back')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectorCatalogView;
