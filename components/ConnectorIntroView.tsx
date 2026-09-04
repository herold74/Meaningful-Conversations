import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import BrandLoader from './shared/BrandLoader';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';

interface ConnectorIntroViewProps {
  onStart: (liveMode: boolean) => void;
  onBack: () => void;
  isStarting: boolean;
}

/**
 * The Connector — intro screen.
 * Frames the experience as a strengths discovery (NOT a coaching certificate),
 * includes the EU AI Act transparency note, and lets the user pick text or voice.
 */
const ConnectorIntroView: React.FC<ConnectorIntroViewProps> = ({ onStart, onBack, isStarting }) => {
  const { t } = useLocalization();
  const [liveMode, setLiveMode] = useState(false);

  if (isStarting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BrandLoader />
        <p className="mt-4 text-content-secondary">{t('connector_intro_starting')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-background-secondary/80 dark:bg-background-secondary/40 backdrop-blur-sm border border-border-primary/60 shadow-card rounded-card p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-content-primary mb-1">
          {t('connector_title')}
        </h1>
        <p className="text-accent-primary font-semibold mb-4">{t('connector_intro_tagline')}</p>

        <p className="text-content-secondary mb-4">{t('connector_intro_description')}</p>

        <div className="rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary p-4 mb-4">
          <h2 className="font-semibold text-content-primary mb-2">{t('connector_intro_how_title')}</h2>
          <ul className="space-y-2 text-sm text-content-secondary">
            <li className="flex gap-2"><span>💬</span><span>{t('connector_intro_how_1')}</span></li>
            <li className="flex gap-2"><span>🎭</span><span>{t('connector_intro_how_2')}</span></li>
            <li className="flex gap-2"><span>🧭</span><span>{t('connector_intro_how_3')}</span></li>
          </ul>
        </div>

        <div className="rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary p-4 mb-4">
          <h2 className="font-semibold text-content-primary mb-2">{t('connector_intro_mode_title')}</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setLiveMode(false)}
              className={`flex-1 flex items-center gap-3 p-3 rounded-lg border transition-colors ${!liveMode
                ? 'border-accent-primary bg-accent-primary/10 text-content-primary'
                : 'border-border-secondary text-content-secondary hover:border-accent-primary/50'}`}
            >
              <ChatBubbleIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm text-left">{t('connector_intro_mode_text')}</span>
            </button>
            <button
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

        <p className="text-xs text-content-tertiary mb-2">ℹ️ {t('connector_intro_ai_notice')}</p>
        <p className="text-xs text-content-tertiary mb-6">🔒 {t('connector_intro_privacy_note')}</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onStart(liveMode)}
            className="flex-1 py-3 px-6 bg-accent-primary hover:bg-accent-primary/90 text-white font-semibold rounded-lg transition-colors"
          >
            {t('connector_intro_start')}
          </button>
          <button
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

export default ConnectorIntroView;
