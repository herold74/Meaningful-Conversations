import React, { useMemo, useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import ConnectorRadarChart from './ConnectorRadarChart';
import ConnectorEvaluationMarkdown from './ConnectorEvaluationMarkdown';
import ConnectorNextStepsLadder from './ConnectorNextStepsLadder';
import type { ConnectorDimensionKey, ConnectorEvaluationResult, User, ConnectorCoachSessionStartOptions } from '../types';
import { resolveConnectorForDisplay } from '../utils/connectorSignatureTranslation';
import { shouldOfferConnectorCoachBridge } from '../utils/connectorNextSteps';

interface ConnectorProfileSectionProps {
  connector: ConnectorEvaluationResult;
  /** When nested under Riemann, use compact heading */
  nested?: boolean;
  isTranslating?: boolean;
  currentUser?: User | null;
  onStartCoachSession?: (
    botId: string,
    starterPrompt: string,
    options?: ConnectorCoachSessionStartOptions,
  ) => void;
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
  const [isSectionOpen, setIsSectionOpen] = useState(true);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

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

  const hasInsights =
    !isTranslating
    && ((display.strengths?.length ?? 0) > 0
      || (display.growthAreas?.length ?? 0) > 0
      || showCoachBridge);

  const subtitleText = nested
    ? t('profile_connector_subtitle_nested')
    : t('profile_connector_subtitle');

  const scoreBadge =
    connector.overallScore !== null ? (
      <div
        className="shrink-0 w-11 h-11 rounded-full bg-accent-primary text-white flex items-center justify-center text-lg font-bold"
        aria-label={t('connector_results_overall_label')}
      >
        {connector.overallScore}
      </div>
    ) : null;

  const insightsContent = (
    <div
      className={
        nested
          ? 'mt-5 pt-5 border-t border-border-secondary/60 dark:border-border-primary/60 space-y-4'
          : 'px-3 pb-3 border-t border-border-secondary/60 pt-3 space-y-4'
      }
    >
      {display.strengths?.length > 0 && (
        <div>
          <p className="text-sm font-medium text-content-primary mb-2">
            {t('connector_results_strengths_title')}
          </p>
          <ul className="space-y-1 text-sm text-content-secondary">
            {display.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0">•</span>
                <ConnectorEvaluationMarkdown
                  text={s}
                  className="text-sm text-content-secondary leading-relaxed flex-1 min-w-0"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {display.growthAreas?.length > 0 && (
        <div>
          <p className="text-sm font-medium text-content-primary mb-2">
            {t('connector_results_growth_title')}
          </p>
          <ul className="space-y-1 text-sm text-content-secondary">
            {display.growthAreas.map((g, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0">→</span>
                <ConnectorEvaluationMarkdown
                  text={g}
                  className="text-sm text-content-secondary leading-relaxed flex-1 min-w-0"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {showCoachBridge && onStartCoachSession && (
        <ConnectorNextStepsLadder
          evaluation={connector}
          currentUser={currentUser}
          variant="coachOnly"
          onRestartWithFocus={noopFocus}
          onStartCoachSession={onStartCoachSession}
        />
      )}
    </div>
  );

  const mainBody = (
    <>
      {isTranslating && (
        <p className={`text-sm text-content-tertiary italic ${nested ? '' : 'mt-4'}`}>
          {t('profile_connector_translating')}
        </p>
      )}

      <div
        className={`${nested ? 'mt-0' : 'mt-4'} p-4 bg-background-secondary dark:bg-background-secondary rounded-lg border border-border-secondary/70 overflow-visible`}
      >
        <ConnectorRadarChart evaluation={display} labels={labels} />
      </div>

      {!isTranslating && display.summary && (
        <ConnectorEvaluationMarkdown
          text={display.summary}
          className="mt-4 text-sm text-content-secondary leading-relaxed"
        />
      )}

      {hasInsights && (
        nested ? (
          insightsContent
        ) : (
          <div className="mt-4 rounded-lg border border-border-secondary/70 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsInsightsOpen((open) => !open)}
              className="w-full px-3 py-3 flex items-center justify-between gap-2 text-left hover:bg-background-tertiary dark:hover:bg-background-tertiary transition-colors"
              aria-expanded={isInsightsOpen}
            >
              <span className="text-sm font-medium text-content-primary">
                {t('profile_connector_insights_title')}
              </span>
              <span
                className={`text-base text-content-tertiary transition-transform ${isInsightsOpen ? 'rotate-180' : ''}`}
                aria-hidden
              >
                ▼
              </span>
            </button>
            {isInsightsOpen && insightsContent}
          </div>
        )
      )}

      <p className="mt-4 text-xs text-content-tertiary italic text-center">
        {t('profile_connector_disclaimer')}
      </p>
    </>
  );

  if (nested) {
    return (
      <div className="mt-6 pt-6 border-t border-border-secondary/80 dark:border-border-primary/80">
        <div className="flex items-start gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-content-primary">
              {t('profile_connector_section_title')}
            </h4>
            <p className="text-xs text-content-tertiary mt-0.5">
              {subtitleText}
              {completedDate ? ` · ${completedDate}` : ''}
            </p>
          </div>
          {scoreBadge}
        </div>
        {mainBody}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-secondary/70 dark:border-border-primary/80 overflow-hidden bg-background-secondary/40 dark:bg-background-secondary/30">
      <button
        type="button"
        onClick={() => setIsSectionOpen((open) => !open)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-background-secondary dark:hover:bg-background-secondary transition-colors"
        aria-expanded={isSectionOpen}
      >
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-content-primary">
            {t('profile_connector_section_title')}
          </h4>
          <p className="text-xs text-content-tertiary mt-0.5 line-clamp-2 sm:line-clamp-none">
            {subtitleText}
            {completedDate ? ` · ${completedDate}` : ''}
          </p>
        </div>
        {scoreBadge}
        <span
          className={`shrink-0 text-lg text-content-tertiary transition-transform ${isSectionOpen ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {isSectionOpen && (
        <div className="px-4 pb-4 border-t border-border-secondary/60 dark:border-border-primary/60">
          {mainBody}
        </div>
      )}
    </div>
  );
};

export default ConnectorProfileSection;
