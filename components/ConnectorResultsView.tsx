import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import ConnectorRadarChart, { CONNECTOR_DIMENSIONS } from './ConnectorRadarChart';
import ConnectorNextStepsLadder from './ConnectorNextStepsLadder';
import ConnectorEvaluationMarkdown from './ConnectorEvaluationMarkdown';
import type { ConnectorDimensionKey, ConnectorEvaluationResult, ConnectorVignettePublic, User, ConnectorCoachSessionStartOptions } from '../types';
import { showConnectorPracticeLadder, connectorHighScoreNeedsCoachBridge } from '../utils/connectorNextSteps';
import ProfileInsightGroup from './ProfileInsightGroup';

const DIMENSION_EMOJI: Record<ConnectorDimensionKey, string> = {
  empathy: '🤝',
  presence: '🎧',
  curiosity: '❓',
  nonJudgment: '⚖️',
  steadiness: '🌊',
};

interface ConnectorResultsViewProps {
  evaluation: ConnectorEvaluationResult;
  vignettes: ConnectorVignettePublic[];
  runMode: 'assessment' | 'practice';
  onDone: (skipProfileSave: boolean) => Promise<void>;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  canSave: boolean;
  currentUser?: User | null;
  onRestart: () => void;
  /** Show Coach Practice cross-sell for strong results */
  showPracticeCrossSell: boolean;
  onPracticeCrossSell: () => void;
  onRestartWithFocus: (focus: ConnectorDimensionKey) => void;
  onStartCoachSession: (
    botId: string,
    starterPrompt: string,
    options?: ConnectorCoachSessionStartOptions,
  ) => void;
}

const ConnectorResultsView: React.FC<ConnectorResultsViewProps> = ({
  evaluation,
  vignettes,
  runMode,
  onDone,
  saveState,
  canSave,
  currentUser,
  onRestart,
  showPracticeCrossSell,
  onPracticeCrossSell,
  onRestartWithFocus,
  onStartCoachSession,
}) => {
  const { t } = useLocalization();
  const [skipProfileSave, setSkipProfileSave] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const labels: Record<ConnectorDimensionKey, string> = {
    empathy: t('connector_dim_empathy'),
    presence: t('connector_dim_presence'),
    curiosity: t('connector_dim_curiosity'),
    nonJudgment: t('connector_dim_nonjudgment'),
    steadiness: t('connector_dim_steadiness'),
  };

  const personaName = (vignetteId: string) =>
    vignettes.find((v) => v.id === vignetteId)?.personaName || vignetteId;

  const isPracticeRun = runMode === 'practice';
  const isSaving = saveState === 'saving' || isFinishing;
  const showSaveOptOut = !isPracticeRun && canSave && !!currentUser;

  const handleDoneClick = async () => {
    if (isSaving) return;
    setIsFinishing(true);
    try {
      await onDone(isPracticeRun ? true : skipProfileSave);
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-background-secondary/80 dark:bg-background-secondary/40 backdrop-blur-sm border border-border-primary/60 shadow-card rounded-card p-6 md:p-8 lg:p-10">
        <h1 className="text-2xl md:text-3xl font-bold text-content-primary mb-1">
          {t(isPracticeRun ? 'connector_results_practice_title' : 'connector_results_title')}
        </h1>
        <p className="text-content-tertiary text-sm mb-3">
          {t(isPracticeRun ? 'connector_results_practice_subtitle' : 'connector_results_subtitle')}
        </p>
        <p
          role="note"
          className="text-sm text-content-secondary leading-relaxed mb-6 px-4 py-3 rounded-lg border border-border-secondary dark:border-border-primary bg-background-tertiary/80"
        >
          {t(isPracticeRun ? 'connector_results_practice_run_info' : 'connector_results_run_info')}
        </p>

        {/* Overall + radar */}
        <div className="rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary p-5 sm:p-6 mb-6 overflow-visible">
          {evaluation.overallScore !== null && (
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-16 h-16 rounded-full bg-accent-primary text-white flex items-center justify-center text-2xl font-bold">
                {evaluation.overallScore}
              </div>
              <div className="text-sm text-content-secondary">{t('connector_results_overall_label')}</div>
            </div>
          )}
          <ConnectorRadarChart evaluation={evaluation} labels={labels} />
        </div>

        {/* Summary */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-content-primary mb-2">{t('connector_results_summary_title')}</h2>
          <ConnectorEvaluationMarkdown text={evaluation.summary} />
        </div>

        {/* Dimension details */}
        <div className="space-y-3 mb-6">
          {CONNECTOR_DIMENSIONS.map((dim) => (
            <details key={dim} className="rounded-lg border border-border-secondary dark:border-border-primary bg-background-tertiary p-3">
              <summary className="cursor-pointer font-medium text-content-primary flex items-center justify-between">
                <span>{labels[dim]}</span>
                <span className="text-accent-primary font-bold">{evaluation[dim]?.score ?? '–'}/10</span>
              </summary>
              {evaluation[dim]?.evidence?.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-content-secondary">
                  {evaluation[dim].evidence.map((e, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0">•</span>
                      <ConnectorEvaluationMarkdown text={e} className="text-sm text-content-secondary flex-1 min-w-0" />
                    </li>
                  ))}
                </ul>
              )}
            </details>
          ))}
        </div>

        {/* Strengths */}
        {evaluation.strengths?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-content-primary mb-2">💪 {t('connector_results_strengths_title')}</h2>
            <ProfileInsightGroup
              tone="warning"
              items={evaluation.strengths.map((s) => ({
                body: (
                  <ConnectorEvaluationMarkdown text={s} className="text-sm text-content-secondary leading-relaxed" />
                ),
              }))}
            />
          </div>
        )}

        {/* Growth areas */}
        {evaluation.growthAreas?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-content-primary mb-2">🌱 {t('connector_results_growth_title')}</h2>
            <ProfileInsightGroup
              tone="success"
              items={evaluation.growthAreas.map((g) => ({
                body: (
                  <ConnectorEvaluationMarkdown text={g} className="text-sm text-content-secondary leading-relaxed" />
                ),
              }))}
            />
          </div>
        )}

        {/* Per-vignette highlights */}
        {evaluation.perVignette?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-content-primary mb-2">{t('connector_results_moments_title')}</h2>
            <div className="space-y-3">
              {evaluation.perVignette.map((pv) => (
                <div key={pv.vignetteId} className="rounded-lg border border-border-secondary dark:border-border-primary bg-background-tertiary p-3 text-sm">
                  <p className="font-medium text-content-primary mb-1">{personaName(pv.vignetteId)}</p>
                  <p className="text-content-secondary text-sm flex gap-1 items-start">
                    <span className="shrink-0">⭐</span>
                    <ConnectorEvaluationMarkdown text={pv.highlight} className="text-sm text-content-secondary flex-1 min-w-0" />
                  </p>
                  {pv.missedCue && (
                    <div className="text-content-tertiary mt-1 text-sm flex gap-2 items-start">
                      <span className="shrink-0" aria-hidden>
                        👂
                      </span>
                      <div className="flex-1 min-w-0">
                        <span>{t('connector_results_missed_cue_label')}:</span>{' '}
                        <ConnectorEvaluationMarkdown
                          text={pv.missedCue}
                          className="inline text-sm text-content-tertiary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Micro-commitment ladder (scores below Practice threshold) */}
        {showConnectorPracticeLadder(evaluation.overallScore) && (
          <ConnectorNextStepsLadder
            evaluation={evaluation}
            currentUser={currentUser}
            variant="full"
            onRestartWithFocus={onRestartWithFocus}
            onStartCoachSession={onStartCoachSession}
          />
        )}

        {connectorHighScoreNeedsCoachBridge(evaluation) && (
          <ConnectorNextStepsLadder
            evaluation={evaluation}
            currentUser={currentUser}
            variant="coachOnly"
            onRestartWithFocus={onRestartWithFocus}
            onStartCoachSession={onStartCoachSession}
          />
        )}

        {/* Practice cross-sell */}
        {showPracticeCrossSell && (
          <div className="mb-6 rounded-xl border border-accent-primary/40 bg-accent-primary/5 p-4">
            <p className="text-sm text-content-primary font-medium mb-2">🎓 {t('connector_results_practice_title')}</p>
            <p className="text-sm text-content-secondary mb-3">{t('connector_results_practice_text')}</p>
            <button
              type="button"
              onClick={onPracticeCrossSell}
              className="text-sm font-semibold text-accent-primary hover:underline"
            >
              {t('connector_results_practice_cta')} →
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-content-tertiary mb-6">
          {t(isPracticeRun ? 'connector_results_practice_disclaimer' : 'connector_results_disclaimer')}
        </p>

        {showSaveOptOut && (
          <div className="mb-4 p-4 bg-status-warning-background dark:bg-status-warning-background border border-status-warning-border dark:border-status-warning-border/30 rounded-md">
            <label className="flex items-start cursor-pointer gap-3">
              <input
                type="checkbox"
                checked={skipProfileSave}
                onChange={(e) => setSkipProfileSave(e.target.checked)}
                disabled={isSaving}
                className="mt-0.5 h-5 w-5 shrink-0 rounded bg-background-secondary dark:bg-background-tertiary border-border-secondary dark:border-border-secondary text-accent-secondary focus:ring-accent-secondary [color-scheme:light] dark:[color-scheme:dark]"
              />
              <div>
                <span className="font-semibold text-content-primary">{t('connector_results_prevent_save_label')}</span>
                <p className="text-sm text-status-warning-foreground dark:text-status-warning-foreground mt-1">
                  {t('connector_results_prevent_save_desc')}
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Actions — match PracticeEvaluationReview / PracticeResumePrompt button tokens */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            type="button"
            onClick={onRestart}
            disabled={isSaving}
            className={`flex-1 py-3 rounded-lg font-semibold disabled:opacity-50 ${
              isPracticeRun ? 'btn-accent-solid' : 'btn-surface-outline'
            }`}
          >
            {t(isPracticeRun ? 'connector_results_practice_restart' : 'connector_results_restart')}
          </button>
          <button
            type="button"
            onClick={handleDoneClick}
            disabled={isSaving}
            className={`flex-1 py-3 rounded-lg font-semibold disabled:opacity-50 ${
              isPracticeRun ? 'btn-surface-outline' : 'btn-accent-solid'
            }`}
          >
            {isSaving
              ? t('connector_results_saving')
              : t(isPracticeRun ? 'connector_results_practice_done' : 'connector_results_done')}
          </button>
        </div>
        {saveState === 'error' && (
          <p className="mt-3 text-sm text-red-500">{t('connector_results_save_error')}</p>
        )}
      </div>
    </div>
  );
};

export default ConnectorResultsView;
