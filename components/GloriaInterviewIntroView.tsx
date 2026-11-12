import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import type { GloriaInterviewMode } from '../utils/gloriaInterview';

interface GloriaInterviewIntroViewProps {
  onStart: (mode: GloriaInterviewMode) => void;
  onBack: () => void;
}

/**
 * Gloria Interview — mode picker before the session starts.
 * Standard: ideas/projects/workflows. Connection prep: upcoming conversation clarity.
 */
const GloriaInterviewIntroView: React.FC<GloriaInterviewIntroViewProps> = ({ onStart, onBack }) => {
  const { t } = useLocalization();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-background-secondary/80 dark:bg-background-secondary/40 backdrop-blur-sm border border-border-primary/60 shadow-card rounded-card p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-content-primary mb-1">
          {t('gloria_interview_intro_title')}
        </h1>
        <p className="text-accent-primary font-semibold mb-4">{t('gloria_interview_intro_tagline')}</p>
        <p className="text-content-secondary mb-6">{t('gloria_interview_intro_description')}</p>

        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => onStart('standard')}
            className="w-full text-left rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary p-4 hover:border-accent-primary/60 transition-colors"
          >
            <p className="font-semibold text-content-primary mb-1">
              {t('gloria_interview_mode_standard_title')}
            </p>
            <p className="text-sm text-content-secondary leading-relaxed">
              {t('gloria_interview_mode_standard_desc')}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onStart('connectionPrep')}
            className="w-full text-left rounded-xl border border-accent-primary/40 bg-accent-primary/5 p-4 hover:border-accent-primary transition-colors"
          >
            <p className="font-semibold text-content-primary mb-1">
              {t('gloria_interview_mode_connection_title')}
            </p>
            <p className="text-sm text-content-secondary leading-relaxed">
              {t('gloria_interview_mode_connection_desc')}
            </p>
          </button>
        </div>

        <p className="text-xs text-content-tertiary mb-6">{t('gloria_interview_intro_note')}</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-lg border border-border-primary text-content-primary hover:bg-background-tertiary transition-colors"
          >
            {t('gloria_interview_intro_back')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GloriaInterviewIntroView;
