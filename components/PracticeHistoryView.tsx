import React, { useEffect, useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { PracticeEvaluationSummary } from '../types';
import * as geminiService from '../services/geminiService';

interface PracticeHistoryViewProps {
  onBack: () => void;
  onViewEvaluation: (item: PracticeEvaluationSummary) => void;
}

const PracticeHistoryView: React.FC<PracticeHistoryViewProps> = ({ onBack, onViewEvaluation }) => {
  const { t } = useLocalization();
  const [evaluations, setEvaluations] = useState<PracticeEvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    geminiService.getPracticeEvaluations()
      .then(setEvaluations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t('practice_delete_confirm'))) return;
    try {
      await geminiService.deletePracticeEvaluation(id);
      setEvaluations((prev) => prev.filter((ev) => ev.id !== id));
    } catch (err) {
      console.error(err);
      alert(t('practice_delete_error'));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={onBack} className="text-sm text-content-secondary hover:text-content-primary mb-6">
        ← {t('practice_back')}
      </button>

      <h1 className="text-2xl font-bold text-content-primary mb-6">{t('practice_history_title')}</h1>

      {loading && <p className="text-content-secondary">{t('practice_loading')}</p>}

      {!loading && evaluations.length === 0 && (
        <p className="text-content-secondary">{t('practice_history_empty')}</p>
      )}

      <div className="space-y-3">
        {evaluations.map((ev) => (
          <div
            key={ev.id}
            role="button"
            tabIndex={0}
            onClick={() => onViewEvaluation(ev)}
            onKeyDown={(e) => { if (e.key === 'Enter') onViewEvaluation(ev); }}
            className="p-4 rounded-xl surface-elevated border border-transparent hover:border-accent-primary/40 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-content-primary truncate">{ev.frameworkId}</p>
                <p className="text-sm text-content-secondary line-clamp-1">{ev.summary}</p>
                <p className="text-xs text-content-secondary mt-1">
                  {new Date(ev.createdAt).toLocaleDateString()} · {ev.difficulty}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-lg font-bold text-accent-primary">{ev.overallScore}/10</span>
                <button
                  type="button"
                  onClick={(e) => handleDelete(ev.id, e)}
                  className="text-xs text-status-danger-foreground hover:underline"
                >
                  {t('practice_delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticeHistoryView;
