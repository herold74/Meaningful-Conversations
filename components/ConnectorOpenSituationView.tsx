import React, { useEffect, useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import BrandLoader from './shared/BrandLoader';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import {
  CONNECTOR_OPEN_LIMITS,
  CONNECTOR_OPEN_SITUATION_CONSENT_KEY,
} from '../utils/connectorRun';
import type { User } from '../types';
import { resolveConnectorPremiumAccess } from '../utils/connectorAccess';

export type ConnectorOpenLengthPreset = 'short' | 'standard' | 'long';

interface ConnectorOpenSituationViewProps {
  currentUser: User | null;
  onBack: () => void;
  onUpgrade?: () => void;
  onStart: (params: {
    relationship: string;
    situation: string;
    lengthPreset: ConnectorOpenLengthPreset;
    liveMode: boolean;
  }) => void;
  isStarting: boolean;
}

const ConnectorOpenSituationView: React.FC<ConnectorOpenSituationViewProps> = ({
  currentUser,
  onBack,
  onUpgrade,
  onStart,
  isStarting,
}) => {
  const { t } = useLocalization();
  const premiumAccess = resolveConnectorPremiumAccess(currentUser);
  const locked = !premiumAccess.canAccessConnectorPractice;

  const [relationship, setRelationship] = useState('');
  const [situation, setSituation] = useState('');
  const [lengthPreset, setLengthPreset] = useState<ConnectorOpenLengthPreset>('standard');
  const [liveMode, setLiveMode] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentRequired, setConsentRequired] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONNECTOR_OPEN_SITUATION_CONSENT_KEY);
      if (stored === '1') {
        setConsentRequired(false);
        setConsentChecked(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) {
      onUpgrade?.();
      return;
    }
    if (consentRequired && !consentChecked) return;
    if (consentRequired && consentChecked) {
      try {
        localStorage.setItem(CONNECTOR_OPEN_SITUATION_CONSENT_KEY, '1');
      } catch {
        /* ignore */
      }
    }
    onStart({ relationship: relationship.trim(), situation: situation.trim(), lengthPreset, liveMode });
  };

  if (isStarting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BrandLoader />
        <p className="mt-4 text-content-secondary">{t('connector_open_compiling')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-background-secondary/80 dark:bg-background-secondary/40 backdrop-blur-sm border border-border-primary/60 shadow-card rounded-card p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-content-primary mb-1">
          {t('connector_open_title')}
        </h1>
        <p className="text-content-secondary text-sm mb-2">{t('connector_open_subtitle')}</p>
        <p className="text-xs text-content-tertiary mb-6">{t('connector_open_expectation')}</p>

        {locked && (
          <div className="mb-6 rounded-xl border border-accent-primary/40 bg-accent-primary/5 p-4 text-sm text-content-secondary">
            <p className="mb-3">{t('connector_open_premium_required')}</p>
            <button
              type="button"
              onClick={() => onUpgrade?.()}
              className="py-2 px-4 rounded-lg bg-accent-primary text-button-foreground-on-accent font-semibold text-sm"
            >
              {t('connector_open_premium_cta')}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {consentRequired && (
            <label className="flex gap-3 items-start text-sm text-content-secondary cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                disabled={locked}
              />
              <span>{t('connector_open_consent')}</span>
            </label>
          )}

          <div>
            <label className="block text-sm font-medium text-content-primary mb-1">
              {t('connector_open_relationship_label')}
            </label>
            <input
              type="text"
              maxLength={CONNECTOR_OPEN_LIMITS.relationshipMax}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              disabled={locked}
              className="w-full rounded-lg border border-border-primary bg-background-tertiary px-3 py-2 text-content-primary text-sm"
              placeholder={t('connector_open_relationship_placeholder')}
            />
            <p className="text-xs text-content-tertiary mt-1 text-right">
              {relationship.length}/{CONNECTOR_OPEN_LIMITS.relationshipMax}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-content-primary mb-1">
              {t('connector_open_situation_label')}
            </label>
            <textarea
              maxLength={CONNECTOR_OPEN_LIMITS.situationMax}
              rows={5}
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              disabled={locked}
              className="w-full rounded-lg border border-border-primary bg-background-tertiary px-3 py-2 text-content-primary text-sm"
              placeholder={t('connector_open_situation_placeholder')}
            />
            <p className="text-xs text-content-tertiary mt-1 text-right">
              {situation.length}/{CONNECTOR_OPEN_LIMITS.situationMax}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-content-primary mb-2">{t('connector_open_length_label')}</p>
            <div className="grid grid-cols-3 gap-2">
              {(['short', 'standard', 'long'] as ConnectorOpenLengthPreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={locked}
                  onClick={() => setLengthPreset(preset)}
                  className={`py-2 px-2 rounded-lg border text-xs sm:text-sm transition-colors ${
                    lengthPreset === preset
                      ? 'border-accent-primary bg-accent-primary/10 text-content-primary'
                      : 'border-border-secondary text-content-secondary'
                  }`}
                >
                  {t(`connector_open_length_${preset}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary p-4">
            <h2 className="font-semibold text-content-primary mb-2 text-sm">{t('connector_intro_mode_title')}</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={locked}
                onClick={() => setLiveMode(false)}
                className={`flex-1 flex items-center gap-3 p-3 rounded-lg border transition-colors ${!liveMode
                  ? 'border-accent-primary bg-accent-primary/10 text-content-primary'
                  : 'border-border-secondary text-content-secondary'}`}
              >
                <ChatBubbleIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm text-left">{t('connector_intro_mode_text')}</span>
              </button>
              <button
                type="button"
                disabled={locked}
                onClick={() => setLiveMode(true)}
                className={`flex-1 flex items-center gap-3 p-3 rounded-lg border transition-colors ${liveMode
                  ? 'border-accent-primary bg-accent-primary/10 text-content-primary'
                  : 'border-border-secondary text-content-secondary'}`}
              >
                <SoundWaveIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm text-left">{t('connector_intro_mode_voice')}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={locked || !relationship.trim() || !situation.trim() || (consentRequired && !consentChecked)}
              className="flex-1 py-3 px-6 rounded-lg bg-accent-primary text-button-foreground-on-accent font-semibold disabled:opacity-50"
            >
              {t('connector_open_start')}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="py-3 px-6 border border-border-primary text-content-secondary hover:text-content-primary font-medium rounded-lg"
            >
              {t('connector_intro_back')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectorOpenSituationView;
