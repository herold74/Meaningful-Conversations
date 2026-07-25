import React, { useEffect, useMemo, useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import {
  CoachPracticeConfig,
  PracticeCatalog,
  PracticeEvaluationSummary,
} from '../types';
import * as geminiService from '../services/geminiService';
import ScoreBadge from './shared/ScoreBadge';
import {
  buildRecommendedPracticeConfig,
  computePracticeProgress,
  scoreColorClass,
  PracticeDimensionAverages,
} from '../utils/practiceProgress';
import { TrendingUp, TrendingDown, Minus, Target, Award } from 'lucide-react';

interface PracticeProgressViewProps {
  onBack: () => void;
  onHistory: () => void;
  onViewEvaluation: (item: PracticeEvaluationSummary) => void;
  onStartPractice: (config: CoachPracticeConfig) => void;
}

const DIMENSION_KEYS: Array<keyof PracticeDimensionAverages> = [
  'methodCompliance',
  'effectiveness',
  'clarity',
  'coacheeAutonomy',
  'coacheeSatisfaction',
];

const DIMENSION_LABEL_KEYS: Record<keyof PracticeDimensionAverages, string> = {
  methodCompliance: 'practice_dim_compliance',
  effectiveness: 'practice_dim_effectiveness',
  clarity: 'practice_dim_clarity',
  coacheeAutonomy: 'practice_dim_autonomy',
  coacheeSatisfaction: 'practice_dim_satisfaction',
};

/** Keys present in averages (legacy evals may omit coacheeAutonomy). */
const activeDimensionKeys = (averages: PracticeDimensionAverages) =>
  DIMENSION_KEYS.filter((key) => key !== 'coacheeAutonomy' || averages.coacheeAutonomy !== null);

const ScoreSparkline: React.FC<{ scores: number[]; width?: number; height?: number }> = ({
  scores,
  width = 280,
  height = 72,
}) => {
  if (scores.length < 2) {
    return (
      <div className="h-[72px] flex items-center justify-center text-sm text-content-secondary">
        —
      </div>
    );
  }

  const pad = 8;
  const max = 10;
  const min = 0;
  const step = (width - pad * 2) / (scores.length - 1);
  const points = scores.map((score, i) => {
    const x = pad + i * step;
    const y = height - pad - ((score - min) / (max - min)) * (height - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[72px]" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-accent-primary"
        points={points.join(' ')}
      />
      {scores.map((score, i) => {
        const x = pad + i * step;
        const y = height - pad - ((score - min) / (max - min)) * (height - pad * 2);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3.5"
            className="fill-accent-primary"
          />
        );
      })}
    </svg>
  );
};

const DimensionRadar: React.FC<{
  overall: PracticeDimensionAverages;
  recent: PracticeDimensionAverages | null;
  labels: Record<keyof PracticeDimensionAverages, string>;
  legendOverall: string;
  legendRecent: string;
  keys: Array<keyof PracticeDimensionAverages>;
}> = ({ overall, recent, labels, legendOverall, legendRecent, keys }) => {
  const size = 220;
  const center = size / 2;
  const radius = 78;
  const angles = keys.map((_, i) => (Math.PI * 2 * i) / keys.length - Math.PI / 2);

  const toPoint = (value: number, angle: number) => ({
    x: center + Math.cos(angle) * radius * (value / 10),
    y: center + Math.sin(angle) * radius * (value / 10),
  });

  const polygon = (values: PracticeDimensionAverages) =>
    keys.map((key, i) => {
      const raw = values[key];
      const score = raw === null ? 0 : raw;
      const p = toPoint(score, angles[i]);
      return `${p.x},${p.y}`;
    }).join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[240px]" role="img">
        {[2, 4, 6, 8, 10].map((level) => (
          <polygon
            key={level}
            points={keys.map((_, i) => {
              const p = toPoint(level, angles[i]);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-border-primary"
          />
        ))}
        {angles.map((angle, i) => {
          const p = toPoint(10, angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border-primary"
            />
          );
        })}
        <polygon
          points={polygon(overall)}
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-accent-primary/80"
        />
        {recent && (
          <polygon
            points={polygon(recent)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            className="text-accent-primary"
          />
        )}
        {keys.map((key, i) => {
          const labelPoint = toPoint(11.5, angles[i]);
          return (
            <text
              key={key}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-content-secondary text-[8px]"
            >
              {labels[key].slice(0, 12)}
            </text>
          );
        })}
      </svg>
      {recent && (
        <div className="flex flex-wrap justify-center gap-4 text-xs text-content-secondary mt-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-accent-primary/80 inline-block rounded" />
            {legendOverall}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-accent-primary inline-block" />
            {legendRecent}
          </span>
        </div>
      )}
    </div>
  );
};

const ActivityHeatmap: React.FC<{ dates: string[] }> = ({ dates }) => {
  const today = new Date();
  const days: Array<{ key: string; active: boolean }> = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, active: dates.includes(key) });
  }

  return (
    <div className="grid grid-cols-7 gap-1.5" aria-hidden>
      {days.map((day) => (
        <div
          key={day.key}
          title={day.key}
          className={`w-3 h-3 rounded-sm ${
            day.active ? 'bg-accent-primary' : 'bg-background-tertiary'
          }`}
        />
      ))}
    </div>
  );
};

const KpiCard: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({
  label,
  value,
  hint,
}) => (
  <div className="surface-elevated rounded-xl p-4 border border-border-primary/40">
    <p className="text-xs uppercase tracking-wide text-content-secondary mb-1">{label}</p>
    <p className="text-2xl font-bold text-content-primary">{value}</p>
    {hint && <p className="text-xs text-content-secondary mt-1">{hint}</p>}
  </div>
);

const PracticeProgressView: React.FC<PracticeProgressViewProps> = ({
  onBack,
  onHistory,
  onViewEvaluation,
  onStartPractice,
}) => {
  const { t, language } = useLocalization();
  const [evaluations, setEvaluations] = useState<PracticeEvaluationSummary[]>([]);
  const [catalog, setCatalog] = useState<PracticeCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      geminiService.getPracticeEvaluations(),
      geminiService.getPracticeCatalog(language),
    ])
      .then(([evs, cat]) => {
        setEvaluations(evs);
        setCatalog(cat);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [language]);

  const practicedFrameworks = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ev of evaluations) {
      counts.set(ev.frameworkId, (counts.get(ev.frameworkId) || 0) + 1);
    }
    const fromCatalog = catalog?.frameworks.filter((f) => counts.has(f.id)) || [];
    return fromCatalog
      .map((f) => ({ ...f, sessionCount: counts.get(f.id) || 0 }))
      .sort((a, b) => b.sessionCount - a.sessionCount);
  }, [evaluations, catalog]);

  const filteredEvaluations = useMemo(() => {
    if (frameworkFilter === 'all') return evaluations;
    return evaluations.filter((ev) => ev.frameworkId === frameworkFilter);
  }, [evaluations, frameworkFilter]);

  const stats = useMemo(() => computePracticeProgress(filteredEvaluations), [filteredEvaluations]);
  const dimensionKeys = activeDimensionKeys(stats.dimensionAverages);
  const isMethodFiltered = frameworkFilter !== 'all';

  const frameworkName = (id: string) =>
    catalog?.frameworks.find((f) => f.id === id)?.name || id;

  const dimensionLabels = useMemo(
    () =>
      DIMENSION_KEYS.reduce(
        (acc, key) => {
          acc[key] = t(DIMENSION_LABEL_KEYS[key]);
          return acc;
        },
        {} as Record<keyof PracticeDimensionAverages, string>,
      ),
    [t],
  );

  const recommendedConfig = catalog
    ? buildRecommendedPracticeConfig(stats, catalog)
    : null;

  const recentSessions = [...filteredEvaluations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const trendIcon =
    stats.trendDelta === null ? (
      <Minus className="w-4 h-4 inline" />
    ) : stats.trendDelta >= 0 ? (
      <TrendingUp className="w-4 h-4 inline text-status-success-foreground" />
    ) : (
      <TrendingDown className="w-4 h-4 inline text-status-warning-foreground" />
    );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-content-secondary">
        {t('practice_loading')}
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={onBack} className="text-sm text-content-secondary hover:text-content-primary mb-6">
          ← {t('practice_back')}
        </button>
        <h1 className="text-2xl font-bold text-content-primary mb-2">{t('practice_progress_title')}</h1>
        <p className="text-content-secondary mb-6">{t('practice_progress_empty')}</p>
        <button
          type="button"
          onClick={onBack}
          className="py-3 px-6 rounded-lg btn-accent-solid font-semibold"
        >
          {t('practice_start')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button onClick={onBack} className="text-sm text-content-secondary hover:text-content-primary">
          ← {t('practice_back')}
        </button>
        <div className="flex gap-3 text-sm">
          <button onClick={onHistory} className="text-accent-primary hover:underline">
            {t('practice_history_link')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-content-primary mb-1">
            {t('practice_progress_title')}
          </h1>
          <p className="text-content-secondary">
            {isMethodFiltered
              ? t('practice_progress_subtitle_method', {
                  count: stats.totalSessions,
                  method: frameworkName(frameworkFilter),
                })
              : t('practice_progress_subtitle', { count: stats.totalSessions })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary/10 border border-accent-primary/30">
          <Award className="w-5 h-5 text-accent-primary shrink-0" aria-hidden />
          <span className="text-sm font-semibold text-content-primary">
            {t(`practice_progress_level_${stats.practiceLevel}`)}
          </span>
        </div>
      </div>

      {/* Method filter */}
      {practicedFrameworks.length > 1 && (
        <div className="mb-6 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary mb-2">
            {t('practice_progress_filter_label')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFrameworkFilter('all')}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                frameworkFilter === 'all'
                  ? 'border-accent-primary bg-accent-primary text-button-foreground-on-accent'
                  : 'btn-surface-outline text-content-secondary'
              }`}
            >
              {t('practice_progress_filter_all')}
              <span className="ml-1.5 opacity-80">({evaluations.length})</span>
            </button>
            {practicedFrameworks.map((fw) => (
              <button
                key={fw.id}
                type="button"
                onClick={() => setFrameworkFilter(fw.id)}
                className={`max-w-full px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors truncate ${
                  frameworkFilter === fw.id
                    ? 'border-accent-primary bg-accent-primary text-button-foreground-on-accent'
                    : 'btn-surface-outline text-content-secondary'
                }`}
                title={fw.name}
              >
                {fw.name}
                <span className="ml-1.5 opacity-80">({fw.sessionCount})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isMethodFiltered && filteredEvaluations.length === 0 && (
        <div className="mb-6 p-4 rounded-xl border border-border-primary bg-background-secondary/50 text-sm text-content-secondary">
          {t('practice_progress_filter_empty')}
        </div>
      )}

      {filteredEvaluations.length > 0 && (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label={t('practice_progress_kpi_sessions')} value={stats.totalSessions} />
        <KpiCard
          label={t('practice_progress_kpi_average')}
          value={<ScoreBadge score={stats.averageScore} max={10} />}
        />
        <KpiCard
          label={t('practice_progress_kpi_best')}
          value={`${stats.bestScore}/10`}
        />
        <KpiCard
          label={t('practice_progress_kpi_trend')}
          value={
            <span className="inline-flex items-center gap-1">
              {trendIcon}
              {stats.trendDelta === null ? '—' : `${stats.trendDelta > 0 ? '+' : ''}${stats.trendDelta}`}
            </span>
          }
          hint={t('practice_progress_kpi_trend_hint')}
        />
      </div>

      {/* Next step + activity */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {stats.nextDrill && recommendedConfig && (
          <div className="surface-elevated rounded-xl p-5 border border-accent-primary/30 md:col-span-2">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" aria-hidden />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-content-primary mb-1">
                  {t('practice_progress_next_step')}
                </h2>
                <p className="text-sm font-semibold text-content-primary">{stats.nextDrill.action}</p>
                <p className="text-sm text-content-secondary mt-1">{stats.nextDrill.rationale}</p>
                <button
                  type="button"
                  onClick={() => onStartPractice(recommendedConfig)}
                  className="mt-4 py-2.5 px-4 rounded-lg btn-accent-solid text-sm font-semibold"
                >
                  {t('practice_progress_start_recommended')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="surface-elevated rounded-xl p-5">
          <h2 className="text-lg font-bold text-content-primary mb-3">
            {t('practice_progress_score_trend')}
          </h2>
          <ScoreSparkline scores={stats.scoreTimeline.map((p) => p.score)} />
          <p className="text-xs text-content-secondary mt-2">
            {t('practice_progress_score_trend_hint')}
          </p>
        </div>

        <div className="surface-elevated rounded-xl p-5">
          <h2 className="text-lg font-bold text-content-primary mb-3">
            {t('practice_progress_activity')}
          </h2>
          <ActivityHeatmap dates={stats.activityDates} />
          <p className="text-xs text-content-secondary mt-3">
            {t('practice_progress_activity_hint')}
          </p>
        </div>
      </div>

      {/* Radar + framework matrix */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="surface-elevated rounded-xl p-5">
          <h2 className="text-lg font-bold text-content-primary mb-1">
            {t('practice_progress_dimensions')}
          </h2>
          <p className="text-xs text-content-secondary mb-4">
            {t('practice_progress_dimensions_hint')}
          </p>
          <DimensionRadar
            overall={stats.dimensionAverages}
            recent={stats.recentDimensionAverages}
            labels={dimensionLabels}
            legendOverall={t('practice_progress_radar_overall')}
            legendRecent={t('practice_progress_radar_recent')}
            keys={dimensionKeys}
          />
          <ul className="mt-4 space-y-1">
            {dimensionKeys.map((key) => (
              <li key={key} className="flex justify-between text-sm">
                <span className="text-content-secondary">{dimensionLabels[key]}</span>
                <span className="font-semibold text-content-primary">
                  {stats.dimensionAverages[key] === null ? '—' : `${stats.dimensionAverages[key]}/10`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-elevated rounded-xl p-5 overflow-x-auto">
          <h2 className="text-lg font-bold text-content-primary mb-4">
            {isMethodFiltered
              ? t('practice_progress_methods_single', { method: frameworkName(frameworkFilter) })
              : t('practice_progress_methods')}
          </h2>
          {isMethodFiltered ? (
            stats.frameworkStats[0] ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-content-secondary">{t('practice_progress_kpi_sessions')}</span>
                  <span className="font-semibold text-content-primary">{stats.frameworkStats[0].count}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-content-secondary">{t('practice_progress_kpi_average')}</span>
                  <ScoreBadge score={stats.frameworkStats[0].averageScore} max={10} />
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-content-secondary">{t('practice_progress_kpi_best')}</span>
                  <span className="font-semibold text-content-primary">{stats.frameworkStats[0].lastScore}/10</span>
                </div>
              </div>
            ) : null
          ) : stats.frameworkStats.length === 0 ? (
            <p className="text-sm text-content-secondary">—</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-content-secondary border-b border-border-primary">
                  <th className="pb-2 pr-2 font-medium">{t('practice_framework_label')}</th>
                  <th className="pb-2 px-1 font-medium text-center">#</th>
                  {dimensionKeys.map((key) => (
                    <th key={key} className="pb-2 px-1 font-medium text-center w-10">
                      {dimensionLabels[key].slice(0, 3)}
                    </th>
                  ))}
                  <th className="pb-2 pl-1 font-medium text-center">Ø</th>
                </tr>
              </thead>
              <tbody>
                {stats.frameworkStats.map((fw) => (
                  <tr key={fw.frameworkId} className="border-b border-border-primary/50">
                    <td className="py-2 pr-2 text-content-primary font-medium truncate max-w-[120px]">
                      {frameworkName(fw.frameworkId)}
                    </td>
                    <td className="py-2 px-1 text-center text-content-secondary">{fw.count}</td>
                    {dimensionKeys.map((key) => (
                      <td key={key} className="py-2 px-1 text-center">
                        {fw.dimensionAverages[key] === null ? (
                          <span className="text-content-secondary">—</span>
                        ) : (
                        <span
                          className={`inline-block min-w-[2rem] px-1 py-0.5 rounded text-xs font-semibold ${scoreColorClass(fw.dimensionAverages[key]!)}`}
                        >
                          {fw.dimensionAverages[key]}
                        </span>
                        )}
                      </td>
                    ))}
                    <td className="py-2 pl-1 text-center font-bold text-accent-primary">
                      {fw.averageScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Development focus + milestones + calibration */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="surface-elevated rounded-xl p-5 md:col-span-2">
          <h2 className="text-lg font-bold text-content-primary mb-3">
            {t('practice_progress_development_focus')}
          </h2>
          {stats.recurringDevelopmentAreas.length === 0 ? (
            <p className="text-sm text-content-secondary">{t('practice_progress_no_patterns')}</p>
          ) : (
            <ul className="space-y-2">
              {stats.recurringDevelopmentAreas.map((area) => (
                <li
                  key={area.text}
                  className="text-sm text-content-primary flex justify-between gap-2"
                >
                  <span>{area.text}</span>
                  <span className="text-content-secondary shrink-0">
                    {t('practice_progress_mentions', { count: area.count })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface-elevated rounded-xl p-5">
          <h2 className="text-lg font-bold text-content-primary mb-3">
            {t('practice_progress_milestones')}
          </h2>
          <ul className="space-y-2">
            {stats.milestones.map((m) => (
              <li
                key={m.id}
                className={`text-sm flex items-center gap-2 ${
                  m.achieved ? 'text-content-primary' : 'text-content-secondary'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    m.achieved ? 'bg-accent-primary' : 'bg-border-primary'
                  }`}
                />
                {t(`practice_progress_milestone_${m.id}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {stats.calibration && (
        <div className="surface-elevated rounded-xl p-5 mb-6">
          <h2 className="text-lg font-bold text-content-primary mb-2">
            {t('practice_calibration_title')}
          </h2>
          <p className="text-sm text-content-secondary">
            {t('practice_progress_calibration_summary', {
              self: stats.calibration.avgSelf,
              evidence: stats.calibration.avgEvidence,
              count: stats.calibration.count,
            })}
          </p>
        </div>
      )}

      {/* Recent sessions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-content-primary">
            {t('practice_progress_recent')}
          </h2>
          <button
            type="button"
            onClick={onHistory}
            className="text-sm text-accent-primary hover:underline"
          >
            {t('practice_progress_view_all')}
          </button>
        </div>
        <div className="space-y-2">
          {recentSessions.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => onViewEvaluation(ev)}
              className="w-full text-left p-4 rounded-xl surface-elevated border border-transparent hover:border-accent-primary/40 transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-content-primary truncate">
                    {frameworkName(ev.frameworkId)}
                  </p>
                  <p className="text-sm text-content-secondary line-clamp-1">{ev.summary}</p>
                  <p className="text-xs text-content-secondary mt-1">
                    {new Date(ev.createdAt).toLocaleDateString()} · {ev.difficulty}
                  </p>
                </div>
                <ScoreBadge score={ev.overallScore} max={10} />
              </div>
            </button>
          ))}
        </div>
      </section>
      </>
      )}
    </div>
  );
};

export default PracticeProgressView;
