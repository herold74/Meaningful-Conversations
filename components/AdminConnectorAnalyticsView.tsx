import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';
import BrandLoader from './shared/BrandLoader';
import { useLocalization } from '../context/LocalizationContext';

type PeriodDays = 7 | 30 | 90 | 365;

interface BucketRow {
  id: string;
  name?: string;
  count: number | null;
  suppressed: boolean;
  displayCount: string;
  avgScore: number | null;
}

interface AdminConnectorStats {
  period: { start: string; end: string; days: number };
  kAnonymityThreshold: number;
  gdprNote: string;
  totals: {
    completedRuns: number;
    activeUsers: number | null;
    activeUsersSuppressed: boolean;
    avgOverallScore: number | null;
    heardRatePercent: number | null;
  };
  byVignette: BucketRow[];
  byEndType: Record<string, BucketRow>;
  byLiveMode: Record<string, BucketRow>;
  dimensionAverages: Record<string, number | null>;
  scoreHistogram: Record<string, number>;
  daily: Array<{ date: string; count: number }>;
  catalogSize: { vignettes: number };
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

const DailySparkline: React.FC<{ daily: AdminConnectorStats['daily'] }> = ({ daily }) => {
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

const VIGNETTE_LABEL_KEYS: Record<string, string> = {
  'jonas-meeting': 'connector_lab_vignette_jonas',
  'leila-breakup': 'connector_lab_vignette_leila',
  'tom-vancouver': 'connector_lab_vignette_tom',
  'carmen-mia': 'connector_lab_vignette_carmen',
  'david-exhaustion': 'connector_lab_vignette_david',
  'sophie-repair': 'connector_lab_vignette_sophie',
  'marc-promotion': 'connector_lab_vignette_marc',
  'nina-review': 'connector_lab_vignette_nina',
};

const AdminConnectorAnalyticsView: React.FC = () => {
  const { t, language } = useLocalization();
  const [days, setDays] = useState<PeriodDays>(90);
  const [stats, setStats] = useState<AdminConnectorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/admin/connector-stats?days=${days}&language=${language}`);
      setStats(data);
    } catch (e) {
      console.error(e);
      setError(t('admin_connector_stats_error'));
    } finally {
      setLoading(false);
    }
  }, [days, language, t]);

  useEffect(() => {
    load();
  }, [load]);

  const dimKeys = ['empathy', 'presence', 'curiosity', 'nonJudgment', 'steadiness'] as const;
  const dimLabels: Record<string, string> = {
    empathy: t('connector_dim_empathy'),
    presence: t('connector_dim_presence'),
    curiosity: t('connector_dim_curiosity'),
    nonJudgment: t('connector_dim_nonjudgment'),
    steadiness: t('connector_dim_steadiness'),
  };

  const endTypeLabels: Record<string, string> = {
    heard: t('admin_connector_stats_end_heard'),
    timeout: t('admin_connector_stats_end_timeout'),
    aborted: t('admin_connector_stats_end_aborted'),
  };

  const topVignettes = useMemo(
    () => [...(stats?.byVignette || [])].filter((v) => (v.count ?? 0) > 0 || v.suppressed),
    [stats],
  );

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
          {t('admin_connector_stats_retry')}
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const suppressedLabel = t('admin_connector_stats_suppressed', { k: stats.kAnonymityThreshold });

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between min-w-0">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
            {t('admin_connector_stats_title')}
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <KpiCard label={t('admin_connector_stats_runs')} value={stats.totals.completedRuns} />
        <KpiCard
          label={t('admin_connector_stats_active_users')}
          value={
            stats.totals.activeUsersSuppressed
              ? suppressedLabel
              : (stats.totals.activeUsers ?? '0')
          }
          hint={stats.totals.activeUsersSuppressed ? t('admin_connector_stats_k_anon_hint', { k: stats.kAnonymityThreshold }) : undefined}
        />
        <KpiCard
          label={t('admin_connector_stats_avg_score')}
          value={stats.totals.avgOverallScore != null ? `${stats.totals.avgOverallScore}/10` : '—'}
        />
        <KpiCard
          label={t('admin_connector_stats_heard_rate')}
          value={stats.totals.heardRatePercent != null ? `${stats.totals.heardRatePercent}%` : '—'}
          hint={t('admin_connector_stats_heard_rate_hint')}
        />
      </div>

      <section className="min-w-0">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
          {t('admin_connector_stats_dimensions')}
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

      <section className="min-w-0">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
          {t('admin_connector_stats_by_vignette')}
        </h3>
        <div className="space-y-2">
          {topVignettes.map((row) => (
            <div
              key={row.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 min-w-0"
            >
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                {VIGNETTE_LABEL_KEYS[row.id] ? t(VIGNETTE_LABEL_KEYS[row.id]) : (row.name || row.id)}
              </p>
              <div className="flex shrink-0 gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span>{t('admin_connector_stats_runs_short')}: {row.displayCount}</span>
                <ScoreCell score={row.avgScore} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
        <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-white dark:bg-gray-800/40 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t('admin_connector_stats_by_end_type')}
          </h3>
          <div className="space-y-2">
            {(['heard', 'timeout', 'aborted'] as const).map((type) => {
              const row = stats.byEndType[type];
              if (!row) return null;
              return (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{endTypeLabels[type]}</span>
                  <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <span>{row.displayCount}</span>
                    <ScoreCell score={row.avgScore} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-white dark:bg-gray-800/40 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t('admin_connector_stats_by_mode')}
          </h3>
          <div className="space-y-2">
            {(['text', 'voice'] as const).map((mode) => {
              const row = stats.byLiveMode[mode];
              if (!row) return null;
              return (
                <div key={mode} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {mode === 'text' ? t('admin_connector_stats_mode_text') : t('admin_connector_stats_mode_voice')}
                  </span>
                  <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <span>{row.displayCount}</span>
                    <ScoreCell score={row.avgScore} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="min-w-0">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('admin_connector_stats_activity')}
        </h3>
        <DailySparkline daily={stats.daily} />
      </section>

      <section className="min-w-0 overflow-x-auto">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
          {t('admin_connector_stats_histogram')}
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
  );
};

export default AdminConnectorAnalyticsView;
