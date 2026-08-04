import React, { useEffect, useMemo, useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import {
  CoachPracticeConfig,
  PracticeCatalog,
  PracticeFramework,
  PracticeMatchTier,
  PracticePhase2Context,
  User,
} from '../types';
import * as geminiService from '../services/geminiService';
import { BOTS } from '../constants';
import { ChevronDown, ChevronUp, Info, Lock, Sparkles } from 'lucide-react';
import { resolveAssetUrl } from '../utils/assetUrl';
import { rollScopeBoundaryTheme } from '../utils/practiceScopeBoundary';

interface PracticePhase2PickerViewProps {
  currentUser: User | null;
  phase2Context: PracticePhase2Context;
  onStart: (config: CoachPracticeConfig) => void;
  onBack: () => void;
}

const tierLabelKey = (tier: PracticeMatchTier): string => {
  switch (tier) {
    case 'primary': return 'practice_match_primary';
    case 'alternative': return 'practice_match_alternative';
    case 'discouraged': return 'practice_match_discouraged';
    default: return 'practice_match_neutral';
  }
};

const PracticePhase2PickerView: React.FC<PracticePhase2PickerViewProps> = ({
  currentUser,
  phase2Context,
  onStart,
  onBack,
}) => {
  const { t, language } = useLocalization();
  const [catalog, setCatalog] = useState<PracticeCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [frameworkId, setFrameworkId] = useState('');
  const [expandedFramework, setExpandedFramework] = useState<string | null>(null);

  const isPrivileged = !!(currentUser?.isAdmin || currentUser?.isDeveloper);

  useEffect(() => {
    geminiService.getPracticeCatalog(language)
      .then((data) => {
        setCatalog(data);
        const defaultFw = data.defaultPair?.frameworkId ?? data.frameworks.find((f) => !f.locked)?.id ?? '';
        setFrameworkId(defaultFw);
      })
      .catch(() => setError(t('practice_catalog_error')))
      .finally(() => setLoading(false));
  }, [language, t]);

  const unlocks = catalog?.unlocks ?? { hardUnlockedPairs: [], privileged: isPrivileged };

  const pairHardUnlocked = useMemo(() => {
    if (isPrivileged || unlocks.privileged) return true;
    return unlocks.hardUnlockedPairs.some(
      (p) => p.scenarioId === phase2Context.scenarioId
        && (p.frameworkId === frameworkId || p.frameworkId === 'contracting' || frameworkId === 'free-play'),
    );
  }, [isPrivileged, unlocks, phase2Context.scenarioId, frameworkId]);

  const scenario = catalog?.scenarios.find((s) => s.id === phase2Context.scenarioId);

  const sortedFrameworks = useMemo(() => {
    if (!catalog || !scenario) return catalog?.frameworks ?? [];
    return [...catalog.frameworks].sort((a, b) => {
      const tierA = scenario.frameworkMatches?.[a.id] ?? 'neutral';
      const tierB = scenario.frameworkMatches?.[b.id] ?? 'neutral';
      const rank = { primary: 0, alternative: 1, neutral: 2, discouraged: 3 };
      return rank[tierA] - rank[tierB];
    });
  }, [catalog, scenario]);

  const sourceBotName = (fw: PracticeFramework) => {
    if (!fw.sourceBotId) return null;
    return BOTS.find((b) => b.id === fw.sourceBotId)?.name || fw.sourceBotId;
  };

  const buildConfig = (mode: 'method' | 'free-play', fw?: PracticeFramework): CoachPracticeConfig => {
    const scopeBoundaryTheme =
      phase2Context.difficulty === 'hard' && pairHardUnlocked
        ? rollScopeBoundaryTheme(phase2Context.scenarioId)
        : null;

    if (mode === 'free-play') {
      return {
        frameworkId: 'free-play',
        frameworkName: t('practice_free_play_title'),
        scenarioId: phase2Context.scenarioId,
        scenarioName: phase2Context.clarifiedConcern || scenario?.concern || '',
        coacheeName: phase2Context.coacheeName,
        coacheeAvatar: phase2Context.coacheeAvatar,
        coacheeGender: phase2Context.coacheeGender ?? scenario?.coacheeGender,
        difficulty: phase2Context.difficulty,
        difficultyLabel: phase2Context.difficultyLabel,
        liveMode: phase2Context.liveMode,
        scopeBoundaryTheme,
        practiceMode: 'free-play',
        hideScenarioBrief: false,
        priorTranscript: phase2Context.priorTranscript,
        clarifiedConcern: phase2Context.clarifiedConcern,
        sessionContract: phase2Context.sessionContract,
        followsContractingEvaluationId: phase2Context.contractingEvaluationId,
      };
    }

    return {
      frameworkId: fw!.id,
      frameworkName: fw!.name,
      scenarioId: phase2Context.scenarioId,
      scenarioName: phase2Context.clarifiedConcern || scenario?.concern || '',
      coacheeName: phase2Context.coacheeName,
      coacheeAvatar: phase2Context.coacheeAvatar,
      coacheeGender: phase2Context.coacheeGender ?? scenario?.coacheeGender,
      difficulty: phase2Context.difficulty,
      difficultyLabel: phase2Context.difficultyLabel,
      liveMode: phase2Context.liveMode,
      scopeBoundaryTheme,
      practiceMode: 'method',
      hideScenarioBrief: false,
      priorTranscript: phase2Context.priorTranscript,
      clarifiedConcern: phase2Context.clarifiedConcern,
      sessionContract: phase2Context.sessionContract,
      followsContractingEvaluationId: phase2Context.contractingEvaluationId,
    };
  };

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

  const selectedFramework = catalog.frameworks.find((f) => f.id === frameworkId);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <button onClick={onBack} className="text-sm text-content-secondary hover:text-content-primary mb-6">
        ← {t('practice_back')}
      </button>

      <h1 className="text-2xl md:text-3xl font-bold text-content-primary mb-2">{t('practice_phase2_title')}</h1>
      <p className="text-content-secondary mb-6">{t('practice_phase2_subtitle')}</p>

      <div className="rounded-xl border border-border-primary bg-background-secondary/50 p-4 mb-6 flex gap-3">
        <img
          src={resolveAssetUrl(phase2Context.coacheeAvatar)}
          alt=""
          className="w-12 h-12 rounded-full shrink-0"
        />
        <div className="min-w-0">
          <p className="font-semibold text-content-primary">{phase2Context.coacheeName}</p>
          <p className="text-sm text-content-secondary mt-1 leading-relaxed break-words">
            {phase2Context.clarifiedConcern}
          </p>
          {phase2Context.sessionContract && (
            <p className="text-xs text-content-secondary mt-2 leading-relaxed break-words">
              <span className="font-semibold text-content-primary">{t('practice_review_session_contract')}:</span>{' '}
              {phase2Context.sessionContract}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onStart(buildConfig('free-play'))}
        className="w-full text-left mb-6 p-4 rounded-xl border-2 border-dashed border-accent-primary/50 bg-accent-primary/5 hover:bg-accent-primary/10 transition-colors"
      >
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-semibold text-content-primary">{t('practice_free_play_title')}</p>
            <p className="text-sm text-content-secondary mt-1 leading-relaxed">{t('practice_free_play_desc')}</p>
          </div>
        </div>
      </button>

      <h2 className="text-lg font-semibold text-content-primary mb-3">{t('practice_framework_label')}</h2>
      <div className="space-y-2 mb-8">
        {sortedFrameworks.map((fw) => {
          const tier = scenario?.frameworkMatches?.[fw.id] ?? 'neutral';
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
                  onClick={() => !isLocked && setFrameworkId(fw.id)}
                  disabled={isLocked}
                  className="mt-1 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center disabled:cursor-not-allowed"
                  aria-label={fw.name}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected && !isLocked ? 'bg-accent-primary' : 'bg-transparent'}`} />
                </button>
                <button
                  type="button"
                  onClick={() => !isLocked && setFrameworkId(fw.id)}
                  disabled={isLocked}
                  className="flex-1 min-w-0 text-left disabled:cursor-not-allowed"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-content-primary">{fw.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tier === 'primary' ? 'bg-accent-primary/15 text-accent-primary' : 'bg-background-secondary text-content-secondary'}`}>
                      {t(tierLabelKey(tier))}
                    </span>
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
                  <p className="text-sm text-content-secondary">{fw.explainer.why}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => selectedFramework && !selectedFramework.locked && onStart(buildConfig('method', selectedFramework))}
        disabled={!selectedFramework || selectedFramework.locked}
        className="w-full py-3 rounded-lg btn-accent-solid font-semibold disabled:opacity-50"
      >
        {t('practice_start')}
      </button>
    </div>
  );
};

export default PracticePhase2PickerView;
