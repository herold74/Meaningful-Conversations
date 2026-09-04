import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import ConnectorRadarChart, { CONNECTOR_DIMENSIONS } from './ConnectorRadarChart';
import type { ConnectorDimensionKey, ConnectorEvaluationResult, ConnectorVignettePublic } from '../types';

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
  onSaveToProfile: () => void;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  canSave: boolean;
  onRestart: () => void;
  onDone: () => void;
  /** Show Coach Practice cross-sell for strong results */
  showPracticeCrossSell: boolean;
  onPracticeCrossSell: () => void;
}

const ConnectorResultsView: React.FC<ConnectorResultsViewProps> = ({
  evaluation,
  vignettes,
  onSaveToProfile,
  saveState,
  canSave,
  onRestart,
  onDone,
  showPracticeCrossSell,
  onPracticeCrossSell,
}) => {
  const { t } = useLocalization();

  const labels: Record<ConnectorDimensionKey, string> = {
    empathy: t('connector_dim_empathy'),
    presence: t('connector_dim_presence'),
    curiosity: t('connector_dim_curiosity'),
    nonJudgment: t('connector_dim_nonjudgment'),
    steadiness: t('connector_dim_steadiness'),
  };

  const personaName = (vignetteId: string) =>
    vignettes.find((v) => v.id === vignetteId)?.personaName || vignetteId;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-background-secondary/80 dark:bg-background-secondary/40 backdrop-blur-sm border border-border-primary/60 shadow-card rounded-card p-6 md:p-8 lg:p-10">
        <h1 className="text-2xl md:text-3xl font-bold text-content-primary mb-1">
          {t('connector_results_title')}
        </h1>
        <p className="text-content-tertiary text-sm mb-3">{t('connector_results_subtitle')}</p>
        <p
          role="note"
          className="text-sm text-content-secondary leading-relaxed mb-6 px-4 py-3 rounded-lg border border-border-secondary dark:border-border-primary bg-background-tertiary/80"
        >
          {t('connector_results_run_info')}
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
          <p className="text-content-secondary text-sm leading-relaxed">{evaluation.summary}</p>
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
                    <li key={i} className="flex gap-2"><span>•</span><span>{e}</span></li>
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
            <ul className="space-y-1 text-sm text-content-secondary">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex gap-2"><span>✓</span><span>{s}</span></li>
              ))}
            </ul>
          </div>
        )}

        {/* Growth areas */}
        {evaluation.growthAreas?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-content-primary mb-2">🌱 {t('connector_results_growth_title')}</h2>
            <ul className="space-y-1 text-sm text-content-secondary">
              {evaluation.growthAreas.map((g, i) => (
                <li key={i} className="flex gap-2"><span>→</span><span>{g}</span></li>
              ))}
            </ul>
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
                  <p className="text-content-secondary">⭐ {pv.highlight}</p>
                  {pv.missedCue && (
                    <p className="text-content-tertiary mt-1">👂 {t('connector_results_missed_cue_label')}: {pv.missedCue}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practice cross-sell */}
        {showPracticeCrossSell && (
          <div className="mb-6 rounded-xl border border-accent-primary/40 bg-accent-primary/5 p-4">
            <p className="text-sm text-content-primary font-medium mb-2">🎓 {t('connector_results_practice_title')}</p>
            <p className="text-sm text-content-secondary mb-3">{t('connector_results_practice_text')}</p>
            <button
              onClick={onPracticeCrossSell}
              className="text-sm font-semibold text-accent-primary hover:underline"
            >
              {t('connector_results_practice_cta')} →
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-content-tertiary mb-6">{t('connector_results_disclaimer')}</p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {canSave && saveState !== 'saved' && (
            <button
              onClick={onSaveToProfile}
              disabled={saveState === 'saving'}
              className="flex-1 py-3 px-6 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
            >
              {saveState === 'saving' ? t('connector_results_saving') : t('connector_results_save')}
            </button>
          )}
          {saveState === 'saved' && (
            <div className="flex-1 py-3 px-6 text-center text-sm font-medium text-accent-primary border border-accent-primary/40 rounded-lg">
              ✓ {t('connector_results_saved')}
            </div>
          )}
          <button
            onClick={onRestart}
            className="py-3 px-6 border border-border-primary text-content-secondary hover:text-content-primary font-medium rounded-lg transition-colors"
          >
            {t('connector_results_restart')}
          </button>
          <button
            onClick={onDone}
            className="py-3 px-6 border border-border-primary text-content-secondary hover:text-content-primary font-medium rounded-lg transition-colors"
          >
            {t('connector_results_done')}
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
