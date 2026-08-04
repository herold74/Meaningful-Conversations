import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { PracticeEvaluationSummary } from '../types';
import { resolveAssetUrl } from '../utils/assetUrl';

interface PracticeFollowUpReminderModalProps {
  evaluation: PracticeEvaluationSummary;
  coacheeName: string;
  coacheeAvatar: string;
  onContinue: () => void;
  onCancel: () => void;
}

const PracticeFollowUpReminderModal: React.FC<PracticeFollowUpReminderModalProps> = ({
  evaluation,
  coacheeName,
  coacheeAvatar,
  onContinue,
  onCancel,
}) => {
  const { t } = useLocalization();
  const data = evaluation.evaluationData;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-followup-reminder-title"
    >
      <div className="surface-elevated w-full max-w-lg rounded-2xl border border-border-primary p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <img src={resolveAssetUrl(coacheeAvatar)} alt="" className="w-12 h-12 rounded-full shrink-0" />
          <div className="min-w-0">
            <h2 id="practice-followup-reminder-title" className="text-lg font-bold text-content-primary">
              {t('practice_followup_reminder_title', { name: coacheeName })}
            </h2>
            <p className="text-xs text-content-secondary">
              {new Date(evaluation.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <p className="text-sm text-content-secondary mb-4">{t('practice_followup_reminder_intro')}</p>

        {data.clarifiedConcern?.trim() && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary mb-1">
              {t('practice_review_clarified_concern')}
            </p>
            <p className="text-sm text-content-primary leading-relaxed">{data.clarifiedConcern}</p>
          </div>
        )}

        {data.sessionContract?.trim() && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary mb-1">
              {t('practice_review_session_contract')}
            </p>
            <p className="text-sm text-content-primary leading-relaxed">{data.sessionContract}</p>
          </div>
        )}

        {data.methodSuggestions && data.methodSuggestions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary mb-2">
              {t('practice_review_method_suggestions')}
            </p>
            <ul className="space-y-2">
              {data.methodSuggestions.slice(0, 3).map((s, i) => (
                <li key={i} className="text-sm text-content-secondary">
                  <span className="font-semibold text-content-primary">{s.frameworkName}:</span> {s.rationale}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 rounded-lg btn-surface-outline text-sm font-semibold"
          >
            {t('practice_followup_reminder_cancel')}
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="py-2.5 px-4 rounded-lg btn-accent-solid text-sm font-semibold"
          >
            {t('practice_followup_reminder_continue')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeFollowUpReminderModal;
