import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import type { ConnectorDimensionKey, ConnectorQualitativeEvaluationResult, ConnectorVignettePublic } from '../types';

const DIMENSION_EMOJI: Record<ConnectorDimensionKey, string> = {
  empathy: '🤝',
  presence: '🎧',
  curiosity: '❓',
  nonJudgment: '⚖️',
  steadiness: '🌊',
};

interface ConnectorQualitativeResultsViewProps {
  evaluation: ConnectorQualitativeEvaluationResult;
  vignettes: ConnectorVignettePublic[];
  onAgain: () => void;
  onCatalog: () => void;
  onDone: () => void;
}

const ConnectorQualitativeResultsView: React.FC<ConnectorQualitativeResultsViewProps> = ({
  evaluation,
  vignettes,
  onAgain,
  onCatalog,
  onDone,
}) => {
  const { t } = useLocalization();

  const labels: Record<ConnectorDimensionKey, string> = {
    empathy: t('connector_dim_empathy'),
    presence: t('connector_dim_presence'),
    curiosity: t('connector_dim_curiosity'),
    nonJudgment: t('connector_dim_nonjudgment'),
    steadiness: t('connector_dim_steadiness'),
  };

  const personaName = vignettes[0]?.personaName || t('connector_open_generic_partner');

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-background-secondary/80 dark:bg-background-secondary/40 backdrop-blur-sm border border-border-primary/60 shadow-card rounded-card p-6 md:p-8 lg:p-10">
        <h1 className="text-2xl md:text-3xl font-bold text-content-primary mb-1">
          {t('connector_open_results_title')}
        </h1>
        <p className="text-content-tertiary text-sm mb-3">
          {t('connector_open_results_subtitle', { name: personaName })}
        </p>
        <p
          role="note"
          className="text-sm text-content-secondary leading-relaxed mb-6 px-4 py-3 rounded-lg border border-border-secondary dark:border-border-primary bg-background-tertiary/80"
        >
          {t('connector_open_results_disclaimer')}
        </p>

        {evaluation.summary && (
          <div className="rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary p-5 mb-6">
            <h2 className="font-semibold text-content-primary mb-2">{t('connector_open_results_summary')}</h2>
            <p className="text-sm text-content-secondary leading-relaxed whitespace-pre-wrap">{evaluation.summary}</p>
          </div>
        )}

        {evaluation.strengths.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-content-primary mb-2">{t('connector_open_results_strengths')}</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-content-secondary">
              {evaluation.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.missedOpportunities.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-content-primary mb-2">{t('connector_open_results_missed')}</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-content-secondary">
              {evaluation.missedOpportunities.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-8">
          <h2 className="font-semibold text-content-primary mb-2">{t('connector_open_results_fields')}</h2>
          <p className="text-xs text-content-tertiary mb-3">{t('connector_open_results_fields_hint')}</p>
          <div className="flex flex-wrap gap-2">
            {evaluation.developmentFieldsTouched.length === 0 ? (
              <span className="text-sm text-content-secondary">{t('connector_open_results_fields_none')}</span>
            ) : (
              evaluation.developmentFieldsTouched.map((key) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent-primary/40 bg-accent-primary/10 text-sm text-content-primary"
                >
                  <span aria-hidden>{DIMENSION_EMOJI[key]}</span>
                  {labels[key]}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <button
            type="button"
            onClick={onAgain}
            className="py-3 px-6 rounded-lg bg-accent-primary text-button-foreground-on-accent font-semibold"
          >
            {t('connector_open_results_again')}
          </button>
          <button
            type="button"
            onClick={onCatalog}
            className="py-3 px-6 border border-border-primary text-content-secondary hover:text-content-primary font-medium rounded-lg"
          >
            {t('connector_open_results_catalog')}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="py-3 px-6 border border-border-primary text-content-secondary hover:text-content-primary font-medium rounded-lg"
          >
            {t('connector_results_done')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectorQualitativeResultsView;
