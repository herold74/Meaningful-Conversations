import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';
import BrandLoader from './shared/BrandLoader';
import { useLocalization } from '../context/LocalizationContext';

type PeriodDays = 7 | 30 | 90 | 365;
type SubTab = 'catalog' | 'impact';

interface BucketRow {
  id: string;
  name?: string;
  count: number | null;
  suppressed: boolean;
  displayCount: string;
  avgScore: number | null;
  concern?: string;
}

interface AdminPracticeStats {
  period: { start: string; end: string; days: number };
  kAnonymityThreshold: number;
  gdprNote: string;
  totals: {
    completedSessions: number;
    activeCoaches: number | null;
    activeCoachesSuppressed: boolean;
    avgOverallScore: number | null;
  };
  byFramework: BucketRow[];
  byScenario: BucketRow[];
  matrix: Array<{
    frameworkId: string;
    frameworkName: string;
    scenarioId: string;
    scenarioName: string;
    count: number | null;
    suppressed: boolean;
    displayCount: string;
    avgScore: number | null;
  }>;
  byDifficulty: Record<string, BucketRow>;
  dimensionAverages: Record<string, number | null>;
  scoreHistogram: Record<string, number>;
  underusedScenarios: Array<{ id: string; name: string }>;
  learningImpact: {
    suppressed: boolean;
    cohortSize: number | null;
    avgFirstScore: number | null;
    avgLastScore: number | null;
    avgDelta: number | null;
    multiSessionCoaches: number | null;
  };
  calibration: {
    sessionCount: number | null;
    suppressed: boolean;
    avgSelfRating: number | null;
    avgEvidenceRating: number | null;
  };
  daily: Array<{ date: string; count: number }>;
  catalogSize: { frameworks: number; scenarios: number };
}

const PERIODS: PeriodDays[] = [7, 30, 90, 365];

const KpiCard: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({
  label,
  value,
  hint,
}) => (
  <div className="min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-3 sm:p-4">
    <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate" title={label}>
      {label}
    </p>
    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 break-words">{value}</p>
    {hint && (
      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2" title={hint}>
        {hint}
      </p>
    )}
  </div>
);

const ScoreCell: React.FC<{ score: number | null }> = ({ score }) => {
  if (score == null) return <span className="text-gray-400">—</span>;
  const tier =
    score >= 7 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    : score >= 4 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  return (
    <span className={`inline-block min-w-[2rem] px-1.5 py-0.5 rounded text-xs font-semibold text-center ${tier}`}>
      {score}
    </span>
  );
};

const DailySparkline: React.FC<{ daily: AdminPracticeStats['daily'] }> = ({ daily }) => {
  if (daily.length < 2) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">—</p>;
  }
  const w = 320;
  const h = 64;
  const pad = 6;
  const max = Math.max(...daily.map((d) => d.count), 1);
  const step = (w - pad * 2) / (daily.length - 1);
  const points = daily.map((d, i) => {
    const x = pad + i * step;
    const y = h - pad - (d.count / max) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-full h-16" preserveAspectRatio="none" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-primary" points={points.join(' ')} />
    </svg>
  );
};

const AdminPracticeAnalyticsView: React.FC = () => {
  const { t, language } = useLocalization();
  const [days, setDays] = useState<PeriodDays>(90);
  const [subTab, setSubTab] = useState<SubTab>('catalog');
  const [stats, setStats] = useState<AdminPracticeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/admin/practice-stats?days=${days}&language=${language}`);
      setStats(data);
    } catch (e) {
      console.error(e);
      setError(t('admin_practice_stats_error'));
    } finally {
      setLoading(false);
    }
  }, [days, language, t]);

  useEffect(() => {
    load();
  }, [load]);

  const topFrameworks = useMemo(
    () => [...(stats?.byFramework || [])].sort((a, b) => {
      const ac = a.count ?? -1;
      const bc = b.count ?? -1;
      return bc - ac;
    }).slice(0, 8),
    [stats],
  );

  const topScenarios = useMemo(
    () => [...(stats?.byScenario || [])].filter((s) => (s.count ?? 0) > 0 || !s.suppressed).slice(0, 10),
    [stats],
  );

  const heatmapFrameworks = useMemo(() => {
    if (!stats) return [];
    const ids = new Set(stats.matrix.filter((m) => (m.count ?? 0) > 0).map((m) => m.frameworkId));
    return stats.byFramework.filter((f) => ids.has(f.id));
  }, [stats]);

  const heatmapScenarios = useMemo(() => {
    if (!stats) return [];
    const ids = new Set(stats.matrix.filter((m) => (m.count ?? 0) > 0).map((m) => m.scenarioId));
    return stats.byScenario.filter((s) => ids.has(s.id));
  }, [stats]);

  const matrixLookup = useMemo(() => {
    const map = new Map<string, AdminPracticeStats['matrix'][0]>();
    stats?.matrix.forEach((m) => map.set(`${m.frameworkId}::${m.scenarioId}`, m));
    return map;
  }, [stats]);

  const dimKeys = [
    'methodCompliance',
    'effectiveness',
    'clarity',
    'coacheeAutonomy',
    'coacheeSatisfaction',
  ] as const;

  const dimLabels: Record<string, string> = {
    methodCompliance: t('practice_dim_compliance'),
    effectiveness: t('practice_dim_effectiveness'),
    clarity: t('practice_dim_clarity'),
    coacheeAutonomy: t('practice_dim_autonomy'),
    coacheeSatisfaction: t('practice_dim_satisfaction'),
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-12">
        <BrandLoader size="md" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-4 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        <button type="button" onClick={load} className="mt-2 text-sm text-accent-primary hover:underline">
          {t('admin_practice_stats_retry')}
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const suppressedLabel = t('admin_practice_stats_suppressed', { k: stats.kAnonymityThreshold });

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header + period — stacks on narrow screens */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between min-w-0">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
            {t('admin_practice_stats_title')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-3 sm:line-clamp-none">
            {stats.gdprNote}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDays(p)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                days === p
                  ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tabs — scroll on very small screens */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex flex-nowrap gap-2 min-w-max sm:min-w-0">
          {(['catalog', 'impact'] as SubTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              className={`shrink-0 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-colors max-w-[12rem] sm:max-w-none truncate ${
                subTab === tab
                  ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
              }`}
            >
              {tab === 'catalog' ? t('admin_practice_stats_tab_catalog') : t('admin_practice_stats_tab_impact')}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <KpiCard label={t('admin_practice_stats_sessions')} value={stats.totals.completedSessions} />
        <KpiCard
          label={t('admin_practice_stats_active_coaches')}
          value={
            stats.totals.activeCoachesSuppressed
              ? suppressedLabel
              : (stats.totals.activeCoaches ?? '0')
          }
          hint={stats.totals.activeCoachesSuppressed ? t('admin_practice_stats_k_anon_hint', { k: stats.kAnonymityThreshold }) : undefined}
        />
        <KpiCard
          label={t('admin_practice_stats_avg_score')}
          value={stats.totals.avgOverallScore != null ? `${stats.totals.avgOverallScore}/10` : '—'}
        />
        <KpiCard
          label={t('admin_practice_stats_catalog_coverage')}
          value={`${stats.byScenario.filter((s) => (s.count ?? 0) > 0).length}/${stats.catalogSize.scenarios}`}
          hint={t('admin_practice_stats_scenarios_used')}
        />
      </div>

      {subTab === 'catalog' && (
        <div className="space-y-4 sm:space-y-6 min-w-0">
          {/* Framework ranking — mobile cards */}
          <section className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
              {t('admin_practice_stats_by_method')}
            </h3>
            <div className="md:hidden space-y-2">
              {topFrameworks.map((row) => (
                <div key={row.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate" title={row.name || row.id}>
                    {row.name || row.id}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>{t('admin_practice_stats_sessions_short')}: {row.displayCount}</span>
                    <span>{t('admin_practice_stats_avg_short')}: {row.avgScore != null ? `${row.avgScore}/10` : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-gray-50 dark:bg-gray-800/80">
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="p-3 font-medium max-w-[200px]">{t('practice_framework_label')}</th>
                    <th className="p-3 font-medium w-20 text-center">{t('admin_practice_stats_sessions_short')}</th>
                    <th className="p-3 font-medium w-24 text-center">{t('admin_practice_stats_avg_short')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topFrameworks.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100 dark:border-gray-700/50">
                      <td className="p-3 text-gray-900 dark:text-gray-100 truncate max-w-[200px]" title={row.name || row.id}>
                        {row.name || row.id}
                      </td>
                      <td className="p-3 text-center tabular-nums">{row.displayCount}</td>
                      <td className="p-3 text-center"><ScoreCell score={row.avgScore} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Underused scenarios alert */}
          {stats.underusedScenarios.length > 0 && (
            <section className="rounded-lg border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 p-3 sm:p-4 min-w-0">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-2">
                {t('admin_practice_stats_underused')} ({stats.underusedScenarios.length})
              </h3>
              <ul className="flex flex-wrap gap-2">
                {stats.underusedScenarios.map((s) => (
                  <li
                    key={s.id}
                    className="text-xs px-2 py-1 rounded-full bg-white/80 dark:bg-gray-900/50 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800 max-w-full truncate"
                    title={s.name}
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Heatmap — horizontal scroll, sticky first column */}
          {heatmapFrameworks.length > 0 && heatmapScenarios.length > 0 && (
            <section className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                {t('admin_practice_stats_matrix')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('admin_practice_stats_matrix_hint')}</p>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 -mx-1 sm:mx-0">
                <table className="text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 p-2 border-b border-r border-gray-200 dark:border-gray-700 min-w-[88px] max-w-[120px]">
                        <span className="sr-only">{t('practice_framework_label')}</span>
                      </th>
                      {heatmapScenarios.map((sc) => (
                        <th
                          key={sc.id}
                          className="p-2 border-b border-gray-200 dark:border-gray-700 font-medium text-gray-600 dark:text-gray-400 min-w-[72px] max-w-[96px]"
                          title={sc.name || sc.id}
                        >
                          <span className="block truncate">{sc.name || sc.id}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapFrameworks.map((fw) => (
                      <tr key={fw.id}>
                        <th
                          className="sticky left-0 z-10 bg-white dark:bg-gray-900 p-2 border-r border-b border-gray-200 dark:border-gray-700 text-left font-medium text-gray-800 dark:text-gray-200 min-w-[88px] max-w-[120px]"
                          title={fw.name || fw.id}
                        >
                          <span className="block truncate">{fw.name || fw.id}</span>
                        </th>
                        {heatmapScenarios.map((sc) => {
                          const cell = matrixLookup.get(`${fw.id}::${sc.id}`);
                          const hasData = cell && (cell.count ?? 0) > 0;
                          return (
                            <td
                              key={sc.id}
                              className={`p-1.5 border-b border-gray-100 dark:border-gray-800 text-center tabular-nums ${
                                hasData ? 'bg-accent-primary/5' : 'bg-gray-50/50 dark:bg-gray-800/30'
                              }`}
                              title={
                                cell
                                  ? `${fw.name} × ${sc.name}: ${cell.displayCount}${cell.avgScore != null ? ` · Ø ${cell.avgScore}` : ''}`
                                  : ''
                              }
                            >
                              {hasData ? (
                                <div className="leading-tight">
                                  <div className="font-semibold text-gray-800 dark:text-gray-200">{cell!.displayCount}</div>
                                  {cell!.avgScore != null && (
                                    <div className="text-[10px] text-gray-500">{cell!.avgScore}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-300 dark:text-gray-600">·</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Scenario list */}
          <section className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
              {t('admin_practice_stats_by_scenario')}
            </h3>
            <div className="space-y-2">
              {topScenarios.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{row.name || row.id}</p>
                    {row.concern && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{row.concern}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <span>{row.displayCount}</span>
                    <ScoreCell score={row.avgScore} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {subTab === 'impact' && (
        <div className="space-y-4 sm:space-y-6 min-w-0">
          {/* Learning impact */}
          <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-white dark:bg-gray-800/40 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
              {t('admin_practice_stats_learning')}
            </h3>
            {stats.learningImpact.suppressed ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{suppressedLabel}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <KpiCard label={t('admin_practice_stats_cohort')} value={stats.learningImpact.cohortSize ?? '—'} />
                <KpiCard label={t('admin_practice_stats_first_score')} value={stats.learningImpact.avgFirstScore ?? '—'} />
                <KpiCard label={t('admin_practice_stats_last_score')} value={stats.learningImpact.avgLastScore ?? '—'} />
                <KpiCard
                  label={t('admin_practice_stats_delta')}
                  value={
                    stats.learningImpact.avgDelta != null
                      ? `${stats.learningImpact.avgDelta > 0 ? '+' : ''}${stats.learningImpact.avgDelta}`
                      : '—'
                  }
                />
              </div>
            )}
          </section>

          {/* Dimensions */}
          <section className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
              {t('admin_practice_stats_dimensions')}
            </h3>
            <div className="space-y-2">
              {dimKeys.map((key) => {
                const val = stats.dimensionAverages[key];
                if (val == null) return null;
                return (
                  <div key={key} className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 w-24 sm:w-40 shrink-0 truncate" title={dimLabels[key]}>
                      {dimLabels[key]}
                    </span>
                    <div className="flex-1 min-w-0 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full bg-accent-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, (val / 10) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold tabular-nums w-10 text-right shrink-0">{val}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Calibration */}
          <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('practice_calibration_title')}
            </h3>
            {stats.calibration.suppressed ? (
              <p className="text-sm text-gray-500">{suppressedLabel}</p>
            ) : stats.calibration.sessionCount ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                {t('admin_practice_stats_calibration', {
                  self: stats.calibration.avgSelfRating ?? 0,
                  evidence: stats.calibration.avgEvidenceRating ?? 0,
                  count: stats.calibration.sessionCount ?? 0,
                })}
              </p>
            ) : (
              <p className="text-sm text-gray-500">{t('admin_practice_stats_no_calibration')}</p>
            )}
          </section>

          {/* Activity trend */}
          <section className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('admin_practice_stats_activity')}
            </h3>
            <DailySparkline daily={stats.daily} />
          </section>

          {/* Score histogram */}
          <section className="min-w-0 overflow-x-auto">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
              {t('admin_practice_stats_histogram')}
            </h3>
            <div className="flex items-end gap-1 sm:gap-2 min-w-[280px] h-24">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                const count = stats.scoreHistogram[String(score)] || 0;
                const max = Math.max(...Object.values(stats.scoreHistogram).map(Number), 1);
                const h = count ? Math.max(8, (count / max) * 100) : 4;
                return (
                  <div key={score} className="flex-1 min-w-0 flex flex-col items-center gap-1">
                    <div
                      className="w-full max-w-[2rem] mx-auto bg-accent-primary/70 rounded-t"
                      style={{ height: `${h}%` }}
                      title={`${score}: ${count}`}
                    />
                    <span className="text-[10px] text-gray-500 tabular-nums">{score}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminPracticeAnalyticsView;
