import React, { useEffect, useMemo, useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import {
  PracticeCatalog,
  PracticeFramework,
  PracticeScenario,
  PracticeContractingScenario,
  PracticeDifficulty,
  PracticeMatchTier,
  CoachPracticeConfig,
  PracticeEvaluationSummary,
  PracticePhase2Context,
  User,
} from '../types';
import * as geminiService from '../services/geminiService';
import { BOTS } from '../constants';
import { ChevronDown, ChevronUp, Info, Mic, Lock, AlertTriangle } from 'lucide-react';
import { resolveAssetUrl } from '../utils/assetUrl';
import { rollScopeBoundaryTheme } from '../utils/practiceScopeBoundary';
import {
  buildContractingProgressMap,
  buildMethodScenarioProgressMap,
  buildPhase2ContextFromEvaluation,
  ContractingScenarioProgress,
  formatCompletionPillLabel,
} from '../utils/practiceSetupProgress';
import PracticeFollowUpReminderModal from './PracticeFollowUpReminderModal';

interface PracticeSetupViewProps {
  currentUser: User | null;
  onStart: (config: CoachPracticeConfig) => void;
  onStartPhase2: (context: PracticePhase2Context) => void;
  onBack: () => void;
  onHistory: () => void;
  onProgress: () => void;
}

const TIER_RANK: Record<PracticeMatchTier, number> = {
  primary: 0,
  alternative: 1,
  neutral: 2,
  discouraged: 3,
};

const pickFrameworkId = (frameworks: PracticeFramework[], preferred?: string) => {
  if (preferred) {
    const match = frameworks.find((f) => f.id === preferred);
    if (match && !match.locked) return preferred;
  }
  return frameworks.find((f) => !f.locked)?.id ?? preferred ?? '';
};

const tierLabelKey = (tier: PracticeMatchTier): string => {
  switch (tier) {
    case 'primary': return 'practice_match_primary';
    case 'alternative': return 'practice_match_alternative';
    case 'discouraged': return 'practice_match_discouraged';
    default: return 'practice_match_neutral';
  }
};

const tierBadgeClass = (tier: PracticeMatchTier): string => {
  switch (tier) {
    case 'primary':
      return 'bg-accent-primary/15 text-accent-primary';
    case 'alternative':
      return 'bg-status-success-background text-status-success-foreground';
    case 'discouraged':
      return 'bg-status-warning-background text-status-warning-foreground';
    default:
      return 'bg-background-secondary text-content-secondary';
  }
};

const MatchBadge: React.FC<{ tier: PracticeMatchTier }> = ({ tier }) => {
  const { t } = useLocalization();
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${tierBadgeClass(tier)}`}>
      {t(tierLabelKey(tier))}
    </span>
  );
};

const PracticeSetupView: React.FC<PracticeSetupViewProps> = ({
  currentUser,
  onStart,
  onStartPhase2,
  onBack,
  onHistory,
  onProgress,
}) => {
  const { t, language } = useLocalization();
  const [catalog, setCatalog] = useState<PracticeCatalog | null>(null);
  const [evaluations, setEvaluations] = useState<PracticeEvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [frameworkId, setFrameworkId] = useState<string>('');
  const [scenarioId, setScenarioId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('moderate');
  const [liveMode, setLiveMode] = useState(false);
  const [focusNote, setFocusNote] = useState('');
  const [expandedFramework, setExpandedFramework] = useState<string | null>(null);
  type PracticeEntrySection = 'contracting' | 'scenario' | 'method';
  const [expandedSection, setExpandedSection] = useState<PracticeEntrySection | null>(null);
  const [showDiscouragedModal, setShowDiscouragedModal] = useState(false);
  const [subtitleInfoOpen, setSubtitleInfoOpen] = useState(false);
  const [contractingScenarioId, setContractingScenarioId] = useState('');
  const [difficultyInfoOpen, setDifficultyInfoOpen] = useState(false);
  const [followUpModal, setFollowUpModal] = useState<{
    evaluation: PracticeEvaluationSummary;
    coachee: PracticeContractingScenario;
  } | null>(null);

  const isPrivileged = !!(currentUser?.isAdmin || currentUser?.isDeveloper);

  useEffect(() => {
    Promise.all([
      geminiService.getPracticeCatalog(language),
      geminiService.getPracticeEvaluations().catch(() => [] as PracticeEvaluationSummary[]),
    ])
      .then(([data, evals]) => {
        setCatalog(data);
        setEvaluations(evals);
        const defaultFw = data.defaultPair?.frameworkId ?? data.frameworks[0]?.id ?? '';
        const defaultSc = data.defaultPair?.scenarioId ?? data.scenarios[0]?.id ?? '';
        setFrameworkId(pickFrameworkId(data.frameworks, defaultFw));
        setScenarioId(defaultSc);
        setContractingScenarioId(data.contractingScenarios[0]?.id ?? '');
      })
      .catch(() => setError(t('practice_catalog_error')))
      .finally(() => setLoading(false));
  }, [language, t]);

  const unlocks = catalog?.unlocks ?? { hardUnlockedPairs: [], privileged: isPrivileged };

  const pairHardUnlocked = useMemo(() => {
    if (isPrivileged || unlocks.privileged) return true;
    return unlocks.hardUnlockedPairs.some(
      (p) => p.frameworkId === frameworkId && p.scenarioId === scenarioId,
    );
  }, [isPrivileged, unlocks, frameworkId, scenarioId]);

  const hardUnlocked = pairHardUnlocked;
  const liveUnlocked = pairHardUnlocked;

  useEffect(() => {
    if (!hardUnlocked && difficulty === 'hard') {
      setDifficulty('moderate');
    }
  }, [hardUnlocked, difficulty]);

  useEffect(() => {
    if (!liveUnlocked && liveMode) {
      setLiveMode(false);
    }
  }, [liveUnlocked, liveMode]);

  const selectedFramework = catalog?.frameworks.find((f) => f.id === frameworkId);
  const selectedScenario = catalog?.scenarios.find((s) => s.id === scenarioId);
  const contractingScenario = catalog?.contractingScenarios.find((s) => s.id === contractingScenarioId);
  const difficultyLabel = catalog?.difficulties.find((d) => d.id === difficulty)?.label || difficulty;

  const difficultyLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    catalog?.difficulties.forEach((d) => { labels[d.id] = d.label; });
    return labels;
  }, [catalog]);

  const contractingProgressMap = useMemo(
    () => buildContractingProgressMap(evaluations, difficultyLabels),
    [evaluations, difficultyLabels],
  );

  const methodProgressMap = useMemo(
    () => buildMethodScenarioProgressMap(evaluations, difficultyLabels),
    [evaluations, difficultyLabels],
  );

  const contractingHardUnlocked = useMemo(() => {
    if (isPrivileged || unlocks.privileged) return true;
    return unlocks.hardUnlockedPairs.some((p) => p.scenarioId === contractingScenarioId);
  }, [isPrivileged, unlocks, contractingScenarioId]);

  const currentMatchTier: PracticeMatchTier = useMemo(() => {
    if (!selectedScenario || !selectedFramework) return 'neutral';
    return selectedScenario.frameworkMatches?.[selectedFramework.id] ?? 'neutral';
  }, [selectedScenario, selectedFramework]);

  const sortedFrameworks = useMemo(() => {
    if (!catalog || !scenarioId) return catalog?.frameworks ?? [];
    const scenario = catalog.scenarios.find((s) => s.id === scenarioId);
    return [...catalog.frameworks].sort((a, b) => {
      const tierA = scenario?.frameworkMatches?.[a.id] ?? 'neutral';
      const tierB = scenario?.frameworkMatches?.[b.id] ?? 'neutral';
      return TIER_RANK[tierA] - TIER_RANK[tierB];
    });
  }, [catalog, scenarioId]);

  const sortedScenarios = useMemo(() => {
    if (!catalog || !frameworkId) return catalog?.scenarios ?? [];
    const framework = catalog.frameworks.find((f) => f.id === frameworkId);
    return [...catalog.scenarios].sort((a, b) => {
      const tierA = framework?.scenarioMatches?.[a.id] ?? 'neutral';
      const tierB = framework?.scenarioMatches?.[b.id] ?? 'neutral';
      return TIER_RANK[tierA] - TIER_RANK[tierB];
    });
  }, [catalog, frameworkId]);

  const discouragedReason = useMemo(() => {
    if (!selectedScenario || !selectedFramework || currentMatchTier !== 'discouraged') return '';
    return selectedScenario.discouragedReasons?.[selectedFramework.id] ?? '';
  }, [selectedScenario, selectedFramework, currentMatchTier]);

  const sourceBotName = (fw: PracticeFramework) => {
    if (!fw.sourceBotId) return null;
    return BOTS.find((b) => b.id === fw.sourceBotId)?.name || fw.sourceBotId;
  };

  const selectFramework = (fw: PracticeFramework) => {
    if (fw.locked) return;
    setFrameworkId(fw.id);
  };

  const proceedStart = () => {
    if (!selectedFramework || !selectedScenario || selectedFramework.locked) return;
    if (difficulty === 'hard' && !hardUnlocked) return;
    if (liveMode && !liveUnlocked) return;

    const scopeBoundaryTheme =
      difficulty === 'hard' ? rollScopeBoundaryTheme(selectedScenario.id) : null;

    onStart({
      frameworkId: selectedFramework.id,
      frameworkName: selectedFramework.name,
      scenarioId: selectedScenario.id,
      scenarioName: selectedScenario.concern,
      coacheeName: selectedScenario.coacheeName,
      coacheeAvatar: selectedScenario.avatar,
      coacheeGender: selectedScenario.coacheeGender,
      difficulty,
      difficultyLabel: liveMode ? `${difficultyLabel} · ${t('practice_live_badge')}` : difficultyLabel,
      focusNote: focusNote.trim() || undefined,
      liveMode,
      scopeBoundaryTheme,
      practiceMode: 'method',
    });
  };

  const handleStart = () => {
    if (!selectedFramework || !selectedScenario) return;
    if (currentMatchTier === 'discouraged') {
      setShowDiscouragedModal(true);
      return;
    }
    proceedStart();
  };

  const proceedStartContracting = () => {
    if (!contractingScenario) return;
    if (difficulty === 'hard' && !contractingHardUnlocked) return;
    if (liveMode && !contractingHardUnlocked) return;

    onStart({
      frameworkId: 'contracting',
      frameworkName: t('practice_framework_contracting'),
      scenarioId: contractingScenario.id,
      scenarioName: contractingScenario.coacheeName,
      coacheeName: contractingScenario.coacheeName,
      coacheeAvatar: contractingScenario.avatar,
      coacheeGender: contractingScenario.coacheeGender,
      difficulty,
      difficultyLabel: liveMode ? `${difficultyLabel} · ${t('practice_live_badge')}` : difficultyLabel,
      focusNote: focusNote.trim() || undefined,
      liveMode,
      scopeBoundaryTheme: null,
      practiceMode: 'contracting',
      hideScenarioBrief: true,
    });
  };

  const handleStartContracting = () => {
    if (!contractingScenario) return;
    proceedStartContracting();
  };

  const difficultyLevels: PracticeDifficulty[] = ['easy', 'moderate', 'challenging', 'hard'];

  const renderCompletionPill = (label: string | null | undefined) => {
    if (!label) return null;
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-status-success-background text-status-success-foreground font-medium">
        {label}
      </span>
    );
  };

  const handleFollowUpClick = (
    e: React.MouseEvent,
    sc: PracticeContractingScenario,
    progress: ContractingScenarioProgress,
  ) => {
    e.stopPropagation();
    if (!progress?.followUpSource) return;
    setFollowUpModal({ evaluation: progress.followUpSource, coachee: sc });
  };

  const renderDifficultyPicker = (hardUnlockedForMode: boolean) => (
    <section className="mb-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-lg font-semibold text-content-primary">{t('practice_difficulty_label')}</h2>
        <button
          type="button"
          onClick={() => setDifficultyInfoOpen((open) => !open)}
          aria-expanded={difficultyInfoOpen}
          aria-controls="practice-difficulty-info"
          aria-label={t('practice_difficulty_info_label')}
          className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-accent-primary hover:text-accent-primary/80 transition-colors rounded-md px-1.5 py-1"
        >
          <Info className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline">{t('practice_difficulty_info_label')}</span>
        </button>
      </div>
      {difficultyInfoOpen && (
        <div
          id="practice-difficulty-info"
          className="mb-3 rounded-xl border border-border-primary bg-background-secondary/50 p-3 max-h-48 overflow-y-auto"
        >
          <ul className="space-y-2 text-sm text-content-secondary leading-relaxed">
            {difficultyLevels.map((level) => (
              <li key={level}>
                <span className="font-semibold text-content-primary">
                  {catalog?.difficulties.find((d) => d.id === level)?.label || level}:
                </span>{' '}
                {t(`practice_difficulty_${level}_desc`)}
              </li>
            ))}
            <li className="text-xs text-content-subtle pt-1">{t('practice_difficulty_scope_note')}</li>
          </ul>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {catalog!.difficulties.map((d) => {
          const locked = d.id === 'hard' && !hardUnlockedForMode;
          return (
            <button
              key={d.id}
              type="button"
              disabled={locked}
              title={locked ? t('practice_unlock_hard_hint') : undefined}
              onClick={() => !locked && setDifficulty(d.id)}
              className={`px-3 py-2 sm:px-4 rounded-lg border text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5 min-w-0 ${
                difficulty === d.id
                  ? 'border-accent-primary bg-accent-primary text-button-foreground-on-accent'
                  : locked
                    ? 'btn-surface-outline text-content-subtle opacity-60 cursor-not-allowed'
                    : 'btn-surface-outline text-content-secondary'
              }`}
            >
              {locked && <Lock className="w-3.5 h-3.5" aria-hidden />}
              {d.label}
            </button>
          );
        })}
      </div>
    </section>
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center text-content-secondary">
        {t('practice_loading')}
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <p className="text-status-danger-foreground mb-4">{error || t('practice_catalog_error')}</p>
        <button onClick={onBack} className="text-accent-primary hover:underline">{t('practice_back')}</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <button onClick={onBack} className="text-sm text-content-secondary hover:text-content-primary self-start">
          ← {t('practice_back')}
        </button>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <button onClick={onProgress} className="text-accent-primary hover:underline font-medium">
            {t('practice_progress_link')}
          </button>
          <button onClick={onHistory} className="text-accent-primary hover:underline">
            {t('practice_history_link')}
          </button>
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-content-primary mb-2">{t('practice_title')}</h1>
      <div className="mb-4">
        <div className="flex items-start gap-2">
          <p className="text-content-secondary flex-1 min-w-0">{t('practice_subtitle')}</p>
          <button
            type="button"
            onClick={() => setSubtitleInfoOpen((open) => !open)}
            aria-expanded={subtitleInfoOpen}
            aria-controls="practice-subtitle-info"
            aria-label={t('practice_subtitle_info_label')}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-accent-primary hover:text-accent-primary/80 transition-colors rounded-md px-1.5 py-1 -mt-0.5"
          >
            <Info className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">{t('practice_subtitle_info_label')}</span>
          </button>
        </div>
        {subtitleInfoOpen && (
          <div
            id="practice-subtitle-info"
            className="mt-3 rounded-xl border border-accent-primary/30 bg-accent-primary/10 p-4 flex gap-3"
          >
            <Info className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" aria-hidden />
            <div className="text-sm text-content-primary space-y-2 min-w-0">
              <p className="font-semibold text-content-primary">{t('practice_subtitle_info_label')}</p>
              <p>{t('practice_evaluates_coach_callout')}</p>
              <p>{t('practice_transcript_setup_note')}</p>
              {selectedFramework && sourceBotName(selectedFramework) && (
                <p>{t('practice_source_bot_callout', { bot: sourceBotName(selectedFramework)! })}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Entry: concern clarification (blind contracting) */}
      <section className="mb-4 rounded-xl border border-accent-primary/30 overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandedSection((current) => (current === 'contracting' ? null : 'contracting'))}
          className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-accent-primary/5 transition-colors"
          aria-expanded={expandedSection === 'contracting'}
        >
          <div>
            <h2 className="text-lg font-semibold text-content-primary">{t('practice_entry_contracting')}</h2>
            <p className="text-sm text-content-secondary mt-1">{t('practice_contracting_desc')}</p>
          </div>
          {expandedSection === 'contracting' ? (
            <ChevronUp className="w-5 h-5 text-content-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-content-secondary shrink-0" />
          )}
        </button>
        {expandedSection === 'contracting' && (
          <div className="px-4 pb-4 border-t border-border-primary/50">
            <p className="text-sm text-content-secondary mt-3 mb-3">{t('practice_contracting_scenario_hint')}</p>
            <div className="grid gap-2 sm:grid-cols-2 mb-4">
              {(catalog.contractingScenarios ?? []).map((sc: PracticeContractingScenario) => {
                const progress = contractingProgressMap.get(sc.id);
                return (
                <button
                  key={`contract-${sc.id}`}
                  type="button"
                  onClick={() => setContractingScenarioId(sc.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    contractingScenarioId === sc.id ? 'border-accent-primary bg-accent-primary/5' : 'surface-elevated hover:border-accent-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={resolveAssetUrl(sc.avatar)} alt="" className="w-10 h-10 rounded-full" />
                    <span className="font-semibold text-content-primary">{sc.coacheeName}</span>
                  </div>
                  {(progress?.highestDifficultyLabel || progress?.followUpSource) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {renderCompletionPill(formatCompletionPillLabel(
                        progress?.highestDifficultyLabel,
                        progress?.bestScore,
                      ))}
                      {progress?.followUpSource && (
                        <button
                          type="button"
                          onClick={(e) => handleFollowUpClick(e, sc, progress!)}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                            progress.followUpCompleted
                              ? 'bg-background-secondary text-content-secondary hover:bg-accent-primary/10'
                              : 'bg-accent-primary/15 text-accent-primary hover:bg-accent-primary/25'
                          }`}
                        >
                          {progress.followUpCompleted
                            ? t('practice_pill_followup_done')
                            : t('practice_pill_followup')}
                        </button>
                      )}
                    </div>
                  )}
                </button>
              );})}
            </div>
            {renderDifficultyPicker(contractingHardUnlocked)}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all mb-4 ${
                liveMode ? 'border-accent-primary bg-accent-primary/5' : 'surface-elevated'
              } ${!contractingHardUnlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                className="mt-1 accent-accent-primary"
                checked={liveMode}
                disabled={!contractingHardUnlocked}
                onChange={(e) => setLiveMode(e.target.checked)}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-content-primary">
                  <Mic className="w-4 h-4 text-accent-primary shrink-0" aria-hidden />
                  {t('practice_live_label')}
                </div>
              </div>
            </label>
            <button
              type="button"
              onClick={handleStartContracting}
              disabled={!contractingScenario}
              className="w-full py-3 rounded-lg btn-accent-solid font-semibold disabled:opacity-50"
            >
              {t('practice_contracting_start')}
            </button>
          </div>
        )}
      </section>

      {/* Entry: from scenario */}
      <section className="mb-4 rounded-xl border border-border-primary overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandedSection((current) => (current === 'scenario' ? null : 'scenario'))}
          className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-background-secondary/50 transition-colors"
          aria-expanded={expandedSection === 'scenario'}
        >
          <h2 className="text-lg font-semibold text-content-primary">{t('practice_entry_scenario')}</h2>
          {expandedSection === 'scenario' ? (
            <ChevronUp className="w-5 h-5 text-content-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-content-secondary shrink-0" />
          )}
        </button>
        {expandedSection === 'scenario' && (
          <div className="px-4 pb-4 border-t border-border-primary/50">
            <p className="text-sm text-content-secondary mt-3 mb-3">{t('practice_scenario_label')}</p>
            <div className="grid gap-2 sm:grid-cols-2 mb-6">
              {catalog.scenarios.map((sc: PracticeScenario) => {
                const progress = methodProgressMap.get(sc.id);
                return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setScenarioId(sc.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    scenarioId === sc.id ? 'border-accent-primary bg-accent-primary/5' : 'surface-elevated hover:border-accent-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img src={resolveAssetUrl(sc.avatar)} alt="" className="w-10 h-10 rounded-full" />
                    <span className="font-semibold text-content-primary">{sc.coacheeName}</span>
                    {renderCompletionPill(formatCompletionPillLabel(
                      progress?.highestDifficultyLabel,
                      progress?.bestScore,
                    ))}
                  </div>
                  <p className="text-sm text-content-secondary line-clamp-4 sm:line-clamp-3">{sc.concern}</p>
                  <p className="text-xs text-content-secondary mt-2">{sc.emotionalTone}</p>
                </button>
              );})}
            </div>

            {scenarioId && (
              <>
                <p className="text-sm font-semibold text-content-primary mb-3">{t('practice_framework_label')}</p>
                <div className="space-y-2">
                  {sortedFrameworks.map((fw) => {
                    const tier = catalog.scenarios.find((s) => s.id === scenarioId)?.frameworkMatches?.[fw.id] ?? 'neutral';
                    const isSelected = fw.id === frameworkId;
                    const isExpanded = expandedFramework === fw.id;
                    const botName = sourceBotName(fw);
                    const isLocked = !!fw.locked;
                    return (
                      <div
                        key={fw.id}
                        className={`rounded-xl border transition-all ${
                          isLocked
                            ? 'border-border-primary opacity-60'
                            : isSelected
                              ? 'border-accent-primary bg-accent-primary/5'
                              : 'surface-elevated'
                        }`}
                      >
                        <div className="w-full text-left p-4 flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => selectFramework(fw)}
                            disabled={isLocked}
                            className="mt-1 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center disabled:cursor-not-allowed"
                            aria-label={fw.name}
                          >
                            <span className={`w-2 h-2 rounded-full ${isSelected && !isLocked ? 'bg-accent-primary' : 'bg-transparent'}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => selectFramework(fw)}
                            disabled={isLocked}
                            className="flex-1 min-w-0 text-left disabled:cursor-not-allowed"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-content-primary">{fw.name}</span>
                              <MatchBadge tier={tier} />
                              {isLocked && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-background-tertiary text-content-secondary inline-flex items-center gap-1">
                                  <Lock className="w-3 h-3" aria-hidden />
                                  {t('practice_client_method_locked')}
                                </span>
                              )}
                              {botName && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-status-info-background text-status-info-foreground">
                                  {t('practice_ai_coach_badge', { name: botName })}
                                </span>
                              )}
                              {fw.isPracticeOnly && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-status-warning-background text-status-warning-foreground">
                                  {t('practice_only_badge')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-content-secondary mt-1">{fw.shortDescription}</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedFramework(isExpanded ? null : fw.id)}
                            className="p-1 text-content-secondary hover:text-content-primary shrink-0"
                            aria-label={t('practice_explainer_toggle')}
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 ml-7 border-t border-border-primary/50 mt-0 pt-4">
                            <p className="text-sm text-content-primary mb-2">{fw.explainer.summary}</p>
                            <p className="text-sm text-content-secondary mb-3"><strong>{t('practice_explainer_why')}:</strong> {fw.explainer.why}</p>
                            <p className="text-sm text-content-secondary mb-3"><strong>{t('practice_explainer_good')}:</strong> {fw.explainer.goodCompliance}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Entry: from method */}
      <section className="mb-8 rounded-xl border border-border-primary overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandedSection((current) => (current === 'method' ? null : 'method'))}
          className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-background-secondary/50 transition-colors"
          aria-expanded={expandedSection === 'method'}
        >
          <h2 className="text-lg font-semibold text-content-primary">{t('practice_entry_method')}</h2>
          {expandedSection === 'method' ? (
            <ChevronUp className="w-5 h-5 text-content-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-content-secondary shrink-0" />
          )}
        </button>
        {expandedSection === 'method' && (
          <div className="px-4 pb-4 border-t border-border-primary/50">
            <p className="text-sm text-content-secondary mt-3 mb-3">{t('practice_framework_label')}</p>
            <div className="space-y-2 mb-6">
              {catalog.frameworks.map((fw) => {
                const isSelected = fw.id === frameworkId;
                const isExpanded = expandedFramework === fw.id;
                const botName = sourceBotName(fw);
                const isLocked = !!fw.locked;
                return (
                  <div
                    key={fw.id}
                    className={`rounded-xl border transition-all ${
                      isLocked
                        ? 'border-border-primary opacity-60'
                        : isSelected
                          ? 'border-accent-primary bg-accent-primary/5'
                          : 'surface-elevated'
                    }`}
                  >
                    <div className="w-full text-left p-4 flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => selectFramework(fw)}
                        disabled={isLocked}
                        className="mt-1 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center disabled:cursor-not-allowed"
                        aria-label={fw.name}
                      >
                        <span className={`w-2 h-2 rounded-full ${isSelected && !isLocked ? 'bg-accent-primary' : 'bg-transparent'}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => selectFramework(fw)}
                        disabled={isLocked}
                        className="flex-1 min-w-0 text-left disabled:cursor-not-allowed"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-content-primary">{fw.name}</span>
                          {isLocked && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-background-tertiary text-content-secondary inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" aria-hidden />
                              {t('practice_client_method_locked')}
                            </span>
                          )}
                          {botName && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-status-info-background text-status-info-foreground">
                              {t('practice_ai_coach_badge', { name: botName })}
                            </span>
                          )}
                          {fw.isPracticeOnly && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-status-warning-background text-status-warning-foreground">
                              {t('practice_only_badge')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-content-secondary mt-1">{fw.shortDescription}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedFramework(isExpanded ? null : fw.id)}
                        className="p-1 text-content-secondary hover:text-content-primary shrink-0"
                        aria-label={t('practice_explainer_toggle')}
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 ml-7 border-t border-border-primary/50 mt-0 pt-4">
                        <p className="text-sm text-content-primary mb-2">{fw.explainer.summary}</p>
                        <p className="text-sm text-content-secondary mb-3"><strong>{t('practice_explainer_why')}:</strong> {fw.explainer.why}</p>
                        <p className="text-sm text-content-secondary mb-3"><strong>{t('practice_explainer_good')}:</strong> {fw.explainer.goodCompliance}</p>
                        <div className="mb-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary mb-1">{t('practice_stages_label')}</p>
                          <ul className="text-sm text-content-secondary space-y-1">
                            {fw.stages.map((s) => (
                              <li key={s.id}><span className="font-medium text-content-primary">{s.name}:</span> {s.description}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {frameworkId && (
              <>
                <p className="text-sm font-semibold text-content-primary mb-3">{t('practice_scenario_label')}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {sortedScenarios.map((sc: PracticeScenario) => {
                    const tier = catalog.frameworks.find((f) => f.id === frameworkId)?.scenarioMatches?.[sc.id] ?? 'neutral';
                    const progress = methodProgressMap.get(sc.id);
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => setScenarioId(sc.id)}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          scenarioId === sc.id ? 'border-accent-primary bg-accent-primary/5' : 'surface-elevated hover:border-accent-primary/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <img src={resolveAssetUrl(sc.avatar)} alt="" className="w-10 h-10 rounded-full" />
                          <span className="font-semibold text-content-primary">{sc.coacheeName}</span>
                          <MatchBadge tier={tier} />
                          {renderCompletionPill(formatCompletionPillLabel(
                            progress?.highestDifficultyLabel,
                            progress?.bestScore,
                          ))}
                        </div>
                        <p className="text-sm text-content-secondary line-clamp-4 sm:line-clamp-3">{sc.concern}</p>
                        <p className="text-xs text-content-secondary mt-2">{sc.emotionalTone}</p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {(expandedSection === 'scenario' || expandedSection === 'method') && (
        <>
      {/* Difficulty */}
      {renderDifficultyPicker(hardUnlocked)}
      {difficulty === 'hard' && (
        <p className="text-xs text-content-secondary -mt-4 mb-6 leading-relaxed">{t('practice_hard_desc')}</p>
      )}

      {/* Live overlay */}
      <section className="mb-8">
        <label
          className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
            liveMode ? 'border-accent-primary bg-accent-primary/5' : 'surface-elevated'
          } ${!liveUnlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            type="checkbox"
            className="mt-1 accent-accent-primary"
            checked={liveMode}
            disabled={!liveUnlocked}
            onChange={(e) => setLiveMode(e.target.checked)}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 font-semibold text-content-primary">
              <Mic className="w-4 h-4 text-accent-primary shrink-0" aria-hidden />
              {t('practice_live_label')}
              {!liveUnlocked && <Lock className="w-3.5 h-3.5 text-content-subtle" aria-hidden />}
            </div>
            <p className="text-sm text-content-secondary mt-1 leading-relaxed">{t('practice_live_desc')}</p>
            {!liveUnlocked && (
              <p className="text-xs text-content-subtle mt-2">{t('practice_unlock_live_hint')}</p>
            )}
            {liveMode && (
              <p className="text-sm text-status-warning-foreground mt-2 font-medium">{t('practice_live_warning')}</p>
            )}
          </div>
        </label>
      </section>

      {/* Optional focus */}
      <section className="mb-8">
        <label className="block text-sm font-semibold text-content-primary mb-2" htmlFor="practice-focus">
          {t('practice_focus_label')}
        </label>
        <textarea
          id="practice-focus"
          value={focusNote}
          onChange={(e) => setFocusNote(e.target.value)}
          placeholder={t('practice_focus_placeholder')}
          rows={2}
          className="w-full rounded-lg border border-border-primary bg-background-primary px-3 py-2 text-sm text-content-primary"
        />
      </section>

      <div className="mb-6 rounded-xl border border-accent-primary/30 bg-accent-primary/10 p-4 flex gap-3">
        <Info className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm text-content-primary">{t('practice_start_callout')}</p>
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={!selectedFramework || !selectedScenario}
        className="w-full py-3 rounded-lg btn-accent-solid font-semibold disabled:opacity-50"
      >
        {t('practice_start')}
      </button>
        </>
      )}

      {followUpModal && (
        <PracticeFollowUpReminderModal
          evaluation={followUpModal.evaluation}
          coacheeName={followUpModal.coachee.coacheeName}
          coacheeAvatar={followUpModal.coachee.avatar}
          onCancel={() => setFollowUpModal(null)}
          onContinue={() => {
            const ctx = buildPhase2ContextFromEvaluation(
              followUpModal.evaluation,
              followUpModal.coachee,
              difficultyLabels,
            );
            setFollowUpModal(null);
            onStartPhase2(ctx);
          }}
        />
      )}

      {showDiscouragedModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="practice-discouraged-title"
        >
          <div className="surface-elevated w-full max-w-md rounded-2xl border border-border-primary p-6 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-status-warning-foreground shrink-0 mt-0.5" aria-hidden />
              <h2 id="practice-discouraged-title" className="text-lg font-bold text-content-primary">
                {t('practice_discouraged_title')}
              </h2>
            </div>
            <p className="text-sm text-content-secondary mb-6">
              {t('practice_discouraged_body', { reason: discouragedReason })}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDiscouragedModal(false)}
                className="py-2.5 px-4 rounded-lg btn-surface-outline text-sm font-semibold"
              >
                {t('practice_discouraged_cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscouragedModal(false);
                  proceedStart();
                }}
                className="py-2.5 px-4 rounded-lg btn-accent-solid text-sm font-semibold"
              >
                {t('practice_discouraged_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeSetupView;
