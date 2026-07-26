import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import type { PracticeSessionDraft } from '../utils/practiceSessionDraft';
import { RotateCcw, X } from 'lucide-react';

interface PracticeResumePromptProps {
  draft: PracticeSessionDraft;
  onResume: () => void;
  onDiscard: () => void;
}

const PracticeResumePrompt: React.FC<PracticeResumePromptProps> = ({
  draft,
  onResume,
  onDiscard,
}) => {
  const { t } = useLocalization();
  const messageCount = draft.chatHistory.length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-draft-resume-title"
    >
      <div className="surface-elevated w-full max-w-md rounded-2xl border border-border-primary p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <RotateCcw className="w-5 h-5 text-accent-primary shrink-0" aria-hidden />
            <h2
              id="practice-draft-resume-title"
              className="text-lg font-bold text-content-primary"
            >
              {t('practice_draft_resume_title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onDiscard}
            className="p-1 rounded-lg text-content-secondary hover:text-content-primary hover:bg-background-secondary"
            aria-label={t('practice_draft_discard_button')}
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>
        <p className="text-sm text-content-secondary mb-6">
          {t('practice_draft_resume_body', {
            method: draft.practiceConfig.frameworkName,
            scenario: draft.practiceConfig.scenarioName,
            count: messageCount,
          })}
        </p>
        <p className="text-xs text-content-secondary mb-6">
          {t('practice_draft_resume_privacy_note')}
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onDiscard}
            className="py-2.5 px-4 rounded-lg btn-surface-outline text-sm font-semibold"
          >
            {t('practice_draft_discard_button')}
          </button>
          <button
            type="button"
            onClick={onResume}
            className="py-2.5 px-4 rounded-lg btn-accent-solid text-sm font-semibold"
          >
            {t('practice_draft_resume_button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeResumePrompt;
