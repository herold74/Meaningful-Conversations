import React, { useEffect, useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import {
  PracticeCatalog,
  PracticeFramework,
  PracticeScenario,
  PracticeDifficulty,
  CoachPracticeConfig,
} from '../types';
import * as geminiService from '../services/geminiService';
import { BOTS } from '../constants';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface PracticeSetupViewProps {
  onStart: (config: CoachPracticeConfig) => void;
  onBack: () => void;
  onHistory: () => void;
}

const PracticeSetupView: React.FC<PracticeSetupViewProps> = ({ onStart, onBack, onHistory }) => {
  const { t, language } = useLocalization();
  const [catalog, setCatalog] = useState<PracticeCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [frameworkId, setFrameworkId] = useState<string>('');
  const [scenarioId, setScenarioId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('moderate');
  const [focusNote, setFocusNote] = useState('');
  const [expandedFramework, setExpandedFramework] = useState<string | null>(null);

  useEffect(() => {
    geminiService.getPracticeCatalog(language)
      .then((data) => {
        setCatalog(data);
        if (data.frameworks.length > 0) setFrameworkId(data.frameworks[0].id);
        if (data.scenarios.length > 0) setScenarioId(data.scenarios[0].id);
      })
      .catch(() => setError(t('practice_catalog_error')))
      .finally(() => setLoading(false));
  }, [language, t]);

  const selectedFramework = catalog?.frameworks.find((f) => f.id === frameworkId);
  const selectedScenario = catalog?.scenarios.find((s) => s.id === scenarioId);
  const difficultyLabel = catalog?.difficulties.find((d) => d.id === difficulty)?.label || difficulty;

  const sourceBotName = (fw: PracticeFramework) => {
    if (!fw.sourceBotId) return null;
    return BOTS.find((b) => b.id === fw.sourceBotId)?.name || fw.sourceBotId;
  };

  const handleStart = () => {
    if (!selectedFramework || !selectedScenario) return;
    onStart({
      frameworkId: selectedFramework.id,
      frameworkName: selectedFramework.name,
      scenarioId: selectedScenario.id,
      scenarioName: selectedScenario.concern,
      coacheeName: selectedScenario.coacheeName,
      coacheeAvatar: selectedScenario.avatar,
      difficulty,
      difficultyLabel,
      focusNote: focusNote.trim() || undefined,
    });
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-sm text-content-secondary hover:text-content-primary">
          ← {t('practice_back')}
        </button>
        <button onClick={onHistory} className="text-sm text-accent-primary hover:underline">
          {t('practice_history_link')}
        </button>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-content-primary mb-2">{t('practice_title')}</h1>
      <p className="text-content-secondary mb-8">{t('practice_subtitle')}</p>

      {/* Framework selection */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-content-primary mb-3">{t('practice_framework_label')}</h2>
        <div className="space-y-2">
          {catalog.frameworks.map((fw) => {
            const isSelected = fw.id === frameworkId;
            const isExpanded = expandedFramework === fw.id;
            const botName = sourceBotName(fw);
            return (
              <div
                key={fw.id}
                className={`rounded-xl border transition-all ${
                  isSelected ? 'border-accent-primary bg-accent-primary/5' : 'surface-elevated'
                }`}
              >
                <div className="w-full text-left p-4 flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setFrameworkId(fw.id)}
                    className="mt-1 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                    aria-label={fw.name}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-accent-primary' : 'bg-transparent'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrameworkId(fw.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-content-primary">{fw.name}</span>
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
      </section>

      {/* Scenario selection */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-content-primary mb-3">{t('practice_scenario_label')}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {catalog.scenarios.map((sc: PracticeScenario) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setScenarioId(sc.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                scenarioId === sc.id ? 'border-accent-primary bg-accent-primary/5' : 'surface-elevated hover:border-accent-primary/40'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <img src={sc.avatar} alt="" className="w-10 h-10 rounded-full" />
                <span className="font-semibold text-content-primary">{sc.coacheeName}</span>
              </div>
              <p className="text-sm text-content-secondary line-clamp-3">{sc.concern}</p>
              <p className="text-xs text-content-secondary mt-2">{sc.emotionalTone}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Difficulty */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-content-primary mb-3">{t('practice_difficulty_label')}</h2>
        <div className="flex flex-wrap gap-2">
          {catalog.difficulties.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDifficulty(d.id)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                difficulty === d.id
                  ? 'border-accent-primary bg-accent-primary text-button-foreground-on-accent'
                  : 'btn-surface-outline text-content-secondary'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
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

      <button
        type="button"
        onClick={handleStart}
        disabled={!selectedFramework || !selectedScenario}
        className="w-full py-3 rounded-lg btn-accent-solid font-semibold disabled:opacity-50"
      >
        {t('practice_start')}
      </button>
    </div>
  );
};

export default PracticeSetupView;
