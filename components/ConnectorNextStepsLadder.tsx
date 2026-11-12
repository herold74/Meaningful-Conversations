import React, { useEffect, useMemo, useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { BOTS } from '../constants';
import type { ConnectorDimensionKey, ConnectorEvaluationResult, User, ConnectorCoachSessionStartOptions } from '../types';
import {
  buildCoachStarterPrompt,
  getCoachForDimension,
  getConnectorDimensionsWithAvailableCoach,
  getPrimaryMissedCue,
  getWeakestConnectorDimension,
  isConnectorCoachBotAvailable,
  microExerciseKey,
} from '../utils/connectorNextSteps';
import { buildConnectorHandoffPayload } from '../utils/connectorHandoffPayload';

interface ConnectorNextStepsLadderProps {
  evaluation: ConnectorEvaluationResult;
  currentUser?: User | null;
  /** full = micro + connector retry + coach; coachOnly = coach handoff (e.g. strong overall but weak dimension). */
  variant?: 'full' | 'coachOnly';
  onRestartWithFocus: (focus: ConnectorDimensionKey) => void;
  onStartCoachSession: (
    botId: string,
    starterPrompt: string,
    options?: ConnectorCoachSessionStartOptions,
  ) => void;
}

const ConnectorNextStepsLadder: React.FC<ConnectorNextStepsLadderProps> = ({
  evaluation,
  currentUser,
  variant = 'full',
  onRestartWithFocus,
  onStartCoachSession,
}) => {
  const { t, language } = useLocalization();
  const weakest = useMemo(() => getWeakestConnectorDimension(evaluation), [evaluation]);
  const missedCue = useMemo(() => getPrimaryMissedCue(evaluation), [evaluation]);
  const availableDimensions = useMemo(
    () => getConnectorDimensionsWithAvailableCoach(evaluation, currentUser),
    [evaluation, currentUser],
  );

  const [stage3Open, setStage3Open] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<ConnectorDimensionKey>(weakest);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (variant === 'coachOnly') setStage3Open(true);
  }, [variant]);

  useEffect(() => {
    const preferred =
      availableDimensions.find((d) => d === weakest) ?? availableDimensions[0] ?? weakest;
    setSelectedDimension(preferred);
  }, [availableDimensions, weakest]);

  const dimensionLabels: Record<ConnectorDimensionKey, string> = {
    empathy: t('connector_dim_empathy'),
    presence: t('connector_dim_presence'),
    curiosity: t('connector_dim_curiosity'),
    nonJudgment: t('connector_dim_nonjudgment'),
    steadiness: t('connector_dim_steadiness'),
  };

  const coach = getCoachForDimension(selectedDimension);
  const coachBot = BOTS.find((b) => b.id === coach.botId);
  const coachAvailable = coachBot && isConnectorCoachBotAvailable(coach.botId, currentUser);
  const starterPrompt = buildCoachStarterPrompt(
    selectedDimension,
    evaluation.growthAreas[0],
    language as 'de' | 'en',
    coach.botId,
    evaluation,
  );

  const handleCopyStarter = () => {
    navigator.clipboard.writeText(starterPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const showCoachStep = availableDimensions.length > 0;
  const showMicroSteps = variant === 'full';

  return (
    <div className="mb-6 space-y-4">
      <div className="rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-primary mb-1">
          {t('connector_ladder_heading')}
        </p>
        <p className="text-sm text-content-secondary mb-4">
          {t(variant === 'coachOnly' ? 'profile_connector_coach_bridge_intro' : 'connector_ladder_intro')}
        </p>

        {showMicroSteps && (
          <>
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
          </>
        )}

        {/* Stufe 3 — Opt-in Coach-Brücke (nur verfügbare Coaches) */}
        {showCoachStep && (
          <div className="rounded-lg border border-border-secondary dark:border-border-primary bg-background-secondary/80 p-4">
            <p className="text-sm font-semibold text-content-primary mb-1">
              {showMicroSteps ? `3 · ${t('connector_ladder_step3_title')}` : t('connector_ladder_step3_title')}
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
                  {availableDimensions.map((dim) => (
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

                {coachAvailable && coachBot && (
                  <div className="rounded-lg border border-accent-primary/40 bg-accent-primary/5 p-4">
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
                        onClick={() =>
                          onStartCoachSession(coach.botId, starterPrompt, {
                            serverHandoff: true,
                            handoffPayload: buildConnectorHandoffPayload(evaluation, selectedDimension),
                          })
                        }
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
        )}
      </div>
    </div>
  );
};

export default ConnectorNextStepsLadder;
