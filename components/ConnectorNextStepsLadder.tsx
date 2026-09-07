import React, { useMemo, useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { BOTS } from '../constants';
import type { ConnectorDimensionKey, ConnectorEvaluationResult } from '../types';
import {
  buildCoachStarterPrompt,
  getCoachForDimension,
  getPrimaryMissedCue,
  getWeakestConnectorDimension,
  microExerciseKey,
  rankConnectorDimensions,
} from '../utils/connectorNextSteps';

interface ConnectorNextStepsLadderProps {
  evaluation: ConnectorEvaluationResult;
  onRestartWithFocus: (focus: ConnectorDimensionKey) => void;
  onStartCoachSession: (botId: string, starterPrompt: string) => void;
}

const ConnectorNextStepsLadder: React.FC<ConnectorNextStepsLadderProps> = ({
  evaluation,
  onRestartWithFocus,
  onStartCoachSession,
}) => {
  const { t, language } = useLocalization();
  const weakest = useMemo(() => getWeakestConnectorDimension(evaluation), [evaluation]);
  const missedCue = useMemo(() => getPrimaryMissedCue(evaluation), [evaluation]);
  const rankedDimensions = useMemo(() => rankConnectorDimensions(evaluation), [evaluation]);

  const [stage3Open, setStage3Open] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<ConnectorDimensionKey>(weakest);
  const [copied, setCopied] = useState(false);

  const dimensionLabels: Record<ConnectorDimensionKey, string> = {
    empathy: t('connector_dim_empathy'),
    presence: t('connector_dim_presence'),
    curiosity: t('connector_dim_curiosity'),
    nonJudgment: t('connector_dim_nonjudgment'),
    steadiness: t('connector_dim_steadiness'),
  };

  const selectedGrowthArea = evaluation.growthAreas[0];
  const coach = getCoachForDimension(selectedDimension);
  const coachBot = BOTS.find((b) => b.id === coach.botId);
  const starterPrompt = buildCoachStarterPrompt(
    selectedDimension,
    selectedGrowthArea,
    language as 'de' | 'en',
  );

  const handleCopyStarter = () => {
    navigator.clipboard.writeText(starterPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-primary mb-1">
          {t('connector_ladder_heading')}
        </p>
        <p className="text-sm text-content-secondary mb-4">{t('connector_ladder_intro')}</p>

        {/* Stufe 1 — Micro-Übung */}
        <div className="rounded-lg border border-border-secondary dark:border-border-primary bg-background-secondary/80 p-4 mb-3">
          <p className="text-sm font-semibold text-content-primary mb-1">
            1 · {t('connector_ladder_step1_title')}
          </p>
          <p className="text-sm text-content-secondary leading-relaxed">
            {t(microExerciseKey(weakest))}
          </p>
          {missedCue && (
            <p className="mt-2 text-xs text-content-tertiary italic">
              {t('connector_ladder_step1_missed_cue', { cue: missedCue })}
            </p>
          )}
        </div>

        {/* Stufe 2 — Connector mit Fokus */}
        <div className="rounded-lg border border-border-secondary dark:border-border-primary bg-background-secondary/80 p-4 mb-3">
          <p className="text-sm font-semibold text-content-primary mb-1">
            2 · {t('connector_ladder_step2_title')}
          </p>
          <p className="text-sm text-content-secondary mb-3">{t('connector_ladder_step2_text')}</p>
          <button
            type="button"
            onClick={() => onRestartWithFocus(weakest)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent-primary hover:underline"
          >
            {t('connector_ladder_step2_cta', { focus: dimensionLabels[weakest] })} →
          </button>
        </div>

        {/* Stufe 3 — Opt-in Coach-Brücke */}
        <div className="rounded-lg border border-border-secondary dark:border-border-primary bg-background-secondary/80 p-4">
          <p className="text-sm font-semibold text-content-primary mb-1">
            3 · {t('connector_ladder_step3_title')}
          </p>
          {!stage3Open ? (
            <>
              <p className="text-sm text-content-secondary mb-3">{t('connector_ladder_step3_teaser')}</p>
              <button
                type="button"
                onClick={() => setStage3Open(true)}
                className="text-sm font-semibold text-accent-primary hover:underline"
              >
                {t('connector_ladder_step3_expand')} →
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-content-secondary mb-3">{t('connector_ladder_step3_select_hint')}</p>
              <fieldset className="space-y-2 mb-4">
                <legend className="sr-only">{t('connector_ladder_step3_select_label')}</legend>
                {rankedDimensions.map((dim) => (
                  <label
                    key={dim}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors ${
                      selectedDimension === dim
                        ? 'border-accent-primary bg-accent-primary/5'
                        : 'border-transparent hover:bg-background-tertiary/80'
                    }`}
                  >
                    <input
                      type="radio"
                      name="connector-focus-dimension"
                      checked={selectedDimension === dim}
                      onChange={() => setSelectedDimension(dim)}
                      className="text-accent-primary"
                    />
                    <span className="text-sm text-content-primary flex-1">{dimensionLabels[dim]}</span>
                    <span className="text-xs font-medium text-content-tertiary">
                      {evaluation[dim]?.score ?? '–'}/10
                    </span>
                  </label>
                ))}
              </fieldset>

              {coachBot && (
                <div className="rounded-lg border border-status-success-border bg-status-success-background/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-content-primary">{coachBot.name}</span>
                    <span className="text-xs text-content-tertiary">
                      · {t('connector_ladder_step3_kommunikation')}
                    </span>
                  </div>
                  <p className="text-sm text-content-secondary mb-3">{t(coach.rationaleKey)}</p>
                  <div className="bg-background-primary rounded-lg border border-border-primary p-3 mb-3">
                    <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-1">
                      {t('connector_ladder_step3_starter_label')}
                    </p>
                    <p className="text-sm text-content-primary italic leading-relaxed">
                      &ldquo;{starterPrompt}&rdquo;
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopyStarter}
                      className="text-xs font-medium text-accent-primary hover:underline"
                    >
                      {copied ? t('te_review_bot_copied') : t('te_review_bot_copy_prompt')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartCoachSession(coach.botId, starterPrompt)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-button-foreground-on-accent bg-accent-primary hover:bg-accent-primary-hover px-3 py-1.5 rounded-md transition-colors"
                    >
                      {t('connector_ladder_step3_start_coach', { coach: coachBot.name })}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectorNextStepsLadder;
