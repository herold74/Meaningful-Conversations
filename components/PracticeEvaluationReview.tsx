import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { PracticeEvaluationResult } from '../types';
import ScoreBadge from './shared/ScoreBadge';

interface PracticeEvaluationReviewProps {
  evaluation: PracticeEvaluationResult;
  frameworkName: string;
  scenarioName: string;
  difficultyLabel: string;
  onDone: () => void;
  onHistory: () => void;
  onProgress: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; badge?: React.ReactNode }> = ({ title, children, badge }) => (
  <div className="surface-elevated rounded-xl p-5 mb-4">
    <div className="flex items-center justify-between gap-3 mb-3">
      <h3 className="text-lg font-bold text-content-primary">{title}</h3>
      {badge}
    </div>
    {children}
  </div>
);

const DimensionSection: React.FC<{
  title: string;
  data: { score: number; evidence: string; gaps: string; stagesCovered?: string[] };
  stagesLabel?: string;
  evidenceLabel: string;
  gapsLabel: string;
}> = ({ title, data, stagesLabel, evidenceLabel, gapsLabel }) => (
  <Section title={title} badge={<ScoreBadge score={data.score} />}>
    <p className="text-sm text-content-secondary mb-2">
      <span className="font-semibold text-content-primary">{evidenceLabel}</span> {data.evidence}
    </p>
    <p className="text-sm text-content-secondary">
      <span className="font-semibold text-content-primary">{gapsLabel}</span> {data.gaps}
    </p>
    {data.stagesCovered && data.stagesCovered.length > 0 && stagesLabel && (
      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary mb-1">{stagesLabel}</p>
        <ul className="text-sm text-content-secondary list-disc list-inside">
          {data.stagesCovered.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
    )}
  </Section>
);

const PracticeEvaluationReview: React.FC<PracticeEvaluationReviewProps> = ({
  evaluation,
  frameworkName,
  scenarioName,
  difficultyLabel,
  onDone,
  onHistory,
  onProgress,
}) => {
  const { t, language } = useLocalization();
  const evidenceLabel = language === 'de' ? 'Belege:' : 'Evidence:';
  const gapsLabel = language === 'de' ? 'Lücken:' : 'Gaps:';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-content-primary">{t('practice_review_title')}</h1>
        <ScoreBadge score={evaluation.overallScore} max={10} />
      </div>

      <p className="text-sm text-content-secondary mb-1 break-words">
        {frameworkName} · {difficultyLabel}
      </p>
      <p className="text-sm text-content-secondary mb-6 break-words">{scenarioName}</p>

      <Section title={t('practice_review_summary')}>
        <p className="text-content-primary leading-relaxed">{evaluation.summary}</p>
      </Section>

      {evaluation.scopeBoundary?.active && (
        <div className="rounded-xl border-2 border-status-warning-border bg-status-warning-background/40 p-4 sm:p-5 mb-4">
          <h3 className="text-base sm:text-lg font-bold text-content-primary mb-2">{t('practice_review_scope_title')}</h3>
          <p className="text-sm text-content-secondary mb-3 leading-relaxed">{t('practice_review_scope_reveal')}</p>
          {evaluation.scopeBoundary.themeLabel && (
            <p className="text-sm font-semibold text-content-primary mb-2">
              {t('practice_review_scope_theme')}: {evaluation.scopeBoundary.themeLabel}
            </p>
          )}
          <p className="text-sm text-content-primary mb-2">
            <span className="font-semibold">{t('practice_review_scope_recognized')}:</span>{' '}
            {evaluation.scopeBoundary.recognized
              ? t('practice_review_scope_yes')
              : t('practice_review_scope_no')}
          </p>
          {evaluation.scopeBoundary.referralQuality && (
            <p className="text-sm text-content-secondary mb-2 leading-relaxed break-words">
              <span className="font-semibold text-content-primary">{t('practice_review_scope_referral')}:</span>{' '}
              {evaluation.scopeBoundary.referralQuality}
            </p>
          )}
          {evaluation.scopeBoundary.idealResponse && evaluation.scopeBoundary.idealResponse !== 'N/A' && (
            <p className="text-sm text-content-secondary leading-relaxed break-words">
              <span className="font-semibold text-content-primary">{t('practice_review_scope_ideal')}:</span>{' '}
              {evaluation.scopeBoundary.idealResponse}
            </p>
          )}
        </div>
      )}

      {evaluation.liveMode && (
        <p className="text-xs text-content-secondary mb-4">{t('practice_review_live_note')}</p>
      )}

      <DimensionSection
        title={t('practice_dim_compliance')}
        data={evaluation.methodCompliance}
        stagesLabel={t('practice_stages_covered')}
        evidenceLabel={evidenceLabel}
        gapsLabel={gapsLabel}
      />
      <DimensionSection
        title={t('practice_dim_effectiveness')}
        data={evaluation.effectiveness}
        evidenceLabel={evidenceLabel}
        gapsLabel={gapsLabel}
      />
      <DimensionSection
        title={t('practice_dim_clarity')}
        data={evaluation.clarity}
        evidenceLabel={evidenceLabel}
        gapsLabel={gapsLabel}
      />
      {evaluation.coacheeAutonomy && (
        <div>
          <DimensionSection
            title={t('practice_dim_autonomy')}
            data={evaluation.coacheeAutonomy}
            evidenceLabel={evidenceLabel}
            gapsLabel={gapsLabel}
          />
          <p className="text-xs text-content-secondary -mt-2 mb-4 px-1">{t('practice_dim_autonomy_hint')}</p>
        </div>
      )}
      <DimensionSection
        title={t('practice_dim_satisfaction')}
        data={evaluation.coacheeSatisfaction}
        evidenceLabel={evidenceLabel}
        gapsLabel={gapsLabel}
      />

      {evaluation.calibration && evaluation.calibration.selfRating > 0 && (
        <Section title={t('practice_calibration_title')}>
          <p className="text-sm text-content-primary">{evaluation.calibration.delta}</p>
          <p className="text-sm text-content-secondary mt-2">{evaluation.calibration.interpretation}</p>
        </Section>
      )}

      <Section title={t('practice_strengths_title')}>
        <ul className="space-y-1">
          {evaluation.strengths.map((s, i) => (
            <li key={i} className="text-sm text-content-primary flex gap-2">
              <span className="text-status-success-foreground shrink-0">+</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('practice_development_title')}>
        <ul className="space-y-1">
          {evaluation.developmentAreas.map((s, i) => (
            <li key={i} className="text-sm text-content-primary flex gap-2">
              <span className="text-status-warning-foreground shrink-0">→</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('practice_drills_title')}>
        <div className="space-y-3">
          {evaluation.nextDrills.map((d, i) => (
            <div key={i} className="rounded-lg border border-border-secondary bg-background-primary/50 p-3">
              <p className="text-sm font-semibold text-content-primary">{d.action}</p>
              <p className="text-sm text-content-secondary mt-1">{d.rationale}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 py-3 rounded-lg btn-accent-solid font-semibold"
        >
          {t('practice_done')}
        </button>
        <button
          type="button"
          onClick={onProgress}
          className="flex-1 py-3 rounded-lg btn-surface-outline font-semibold"
        >
          {t('practice_progress_link')}
        </button>
        <button
          type="button"
          onClick={onHistory}
          className="flex-1 py-3 rounded-lg btn-surface-outline font-semibold sm:hidden"
        >
          {t('practice_history_link')}
        </button>
      </div>
    </div>
  );
};

export default PracticeEvaluationReview;
