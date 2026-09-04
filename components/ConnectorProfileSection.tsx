import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import ConnectorRadarChart, { CONNECTOR_DIMENSIONS } from './ConnectorRadarChart';
import type { ConnectorDimensionKey, ConnectorEvaluationResult } from '../types';

interface ConnectorProfileSectionProps {
  connector: ConnectorEvaluationResult;
  /** When nested under Riemann, use compact heading */
  nested?: boolean;
}

const ConnectorProfileSection: React.FC<ConnectorProfileSectionProps> = ({
  connector,
  nested = false,
}) => {
  const { t, language } = useLocalization();

  const labels: Record<ConnectorDimensionKey, string> = {
    empathy: t('connector_dim_empathy'),
    presence: t('connector_dim_presence'),
    curiosity: t('connector_dim_curiosity'),
    nonJudgment: t('connector_dim_nonjudgment'),
    steadiness: t('connector_dim_steadiness'),
  };

  const completedDate = connector.completedAt
    ? new Date(connector.completedAt).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className={
        nested
          ? 'mt-6 pt-6 border-t border-border-secondary/80 dark:border-border-primary/80'
          : ''
      }
    >
      <div className="mb-4">
        <h4 className={nested ? 'text-base font-semibold text-content-primary' : 'text-lg font-semibold text-content-primary'}>
          {t('profile_connector_section_title')}
        </h4>
        <p className="text-sm text-content-tertiary mt-0.5">
          {t('profile_connector_subtitle')}
        </p>
        {completedDate && (
          <p className="text-xs text-content-tertiary mt-1">
            {t('profile_connector_completed_at', { date: completedDate })}
          </p>
        )}
      </div>

      {connector.overallScore !== null && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-accent-primary text-white flex items-center justify-center text-xl font-bold">
            {connector.overallScore}
          </div>
          <div className="text-sm text-content-secondary">{t('connector_results_overall_label')}</div>
        </div>
      )}

      <div className="p-4 bg-background-secondary dark:bg-background-secondary rounded-lg border border-border-secondary/70 overflow-visible">
        <ConnectorRadarChart evaluation={connector} labels={labels} />
      </div>

      {connector.summary && (
        <p className="mt-4 text-sm text-content-secondary leading-relaxed">{connector.summary}</p>
      )}

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        {CONNECTOR_DIMENSIONS.map((dim) => (
          <div
            key={dim}
            className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-background-secondary dark:bg-background-secondary border border-border-secondary/60"
          >
            <span className="text-content-primary">{labels[dim]}</span>
            <span className="font-semibold text-accent-primary">{connector[dim]?.score ?? '–'}/10</span>
          </div>
        ))}
      </div>

      {connector.strengths?.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-content-primary mb-2">
            {t('connector_results_strengths_title')}
          </p>
          <ul className="space-y-1 text-sm text-content-secondary">
            {connector.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span>•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-xs text-content-tertiary italic text-center">
        {t('profile_connector_disclaimer')}
      </p>
    </div>
  );
};

export default ConnectorProfileSection;
