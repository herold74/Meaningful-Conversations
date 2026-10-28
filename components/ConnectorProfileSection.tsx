import React, { useMemo } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import ConnectorRadarChart, { CONNECTOR_DIMENSIONS } from './ConnectorRadarChart';
import ConnectorEvaluationMarkdown from './ConnectorEvaluationMarkdown';
import ConnectorNextStepsLadder from './ConnectorNextStepsLadder';
import type { ConnectorDimensionKey, ConnectorEvaluationResult, User } from '../types';
import { resolveConnectorForDisplay } from '../utils/connectorSignatureTranslation';
import { shouldOfferConnectorCoachBridge } from '../utils/connectorNextSteps';

interface ConnectorProfileSectionProps {
  connector: ConnectorEvaluationResult;
  /** When nested under Riemann, use compact heading */
  nested?: boolean;
  isTranslating?: boolean;
  currentUser?: User | null;
  onStartCoachSession?: (botId: string, starterPrompt: string) => void;
}

const ConnectorProfileSection: React.FC<ConnectorProfileSectionProps> = ({
  connector,
  nested = false,
  isTranslating = false,
  currentUser,
  onStartCoachSession,
}) => {
  const { t, language } = useLocalization();
  const uiLang = language === 'en' ? 'en' : 'de';
  const display = resolveConnectorForDisplay(connector, uiLang);

  const showCoachBridge = useMemo(
    () => !!onStartCoachSession && shouldOfferConnectorCoachBridge(connector, currentUser),
    [connector, currentUser, onStartCoachSession],
  );

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

  const noopFocus = (_focus: ConnectorDimensionKey) => {};

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
        <ConnectorRadarChart evaluation={display} labels={labels} />
      </div>

      {isTranslating && (
        <p className="mt-4 text-sm text-content-tertiary italic">{t('profile_connector_translating')}</p>
      )}
      {!isTranslating && display.summary && (
        <ConnectorEvaluationMarkdown text={display.summary} className="mt-4 text-sm text-content-secondary leading-relaxed" />
      )}

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        {CONNECTOR_DIMENSIONS.map((dim) => (
          <div
            key={dim}
            className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-background-secondary dark:bg-background-secondary border border-border-secondary/60"
          >
            <span className="text-content-primary">{labels[dim]}</span>
            <span className="font-semibold text-accent-primary">{display[dim]?.score ?? '–'}/10</span>
          </div>
        ))}
      </div>

      {!isTranslating && display.strengths?.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-content-primary mb-2">
            {t('connector_results_strengths_title')}
          </p>
          <ul className="space-y-1 text-sm text-content-secondary">
            {display.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0">•</span>
                <ConnectorEvaluationMarkdown text={s} className="text-sm text-content-secondary leading-relaxed flex-1 min-w-0" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isTranslating && display.growthAreas?.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-content-primary mb-2">
            {t('connector_results_growth_title')}
          </p>
          <ul className="space-y-1 text-sm text-content-secondary">
            {display.growthAreas.map((g, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0">→</span>
                <ConnectorEvaluationMarkdown text={g} className="text-sm text-content-secondary leading-relaxed flex-1 min-w-0" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isTranslating && showCoachBridge && onStartCoachSession && (
        <div className="mt-6">
          <ConnectorNextStepsLadder
            evaluation={connector}
            currentUser={currentUser}
            variant="coachOnly"
            onRestartWithFocus={noopFocus}
            onStartCoachSession={onStartCoachSession}
          />
        </div>
      )}

      <p className="mt-4 text-xs text-content-tertiary italic text-center">
        {t('profile_connector_disclaimer')}
      </p>
    </div>
  );
};

export default ConnectorProfileSection;
