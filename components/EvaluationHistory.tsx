import React, { useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { TranscriptEvaluationSummary, TranscriptEvaluationResult, TranscriptPreAnswers } from '../types';
import { getTranscriptEvaluations } from '../services/geminiService';
import EvaluationReview from './EvaluationReview';
import Spinner from './shared/Spinner';

interface EvaluationHistoryProps {
    onBack: () => void;
}

const EvaluationHistory: React.FC<EvaluationHistoryProps> = ({ onBack }) => {
    const { t } = useLocalization();
    const [evaluations, setEvaluations] = useState<TranscriptEvaluationSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEval, setSelectedEval] = useState<TranscriptEvaluationSummary | null>(null);

    useEffect(() => {
        const fetchEvaluations = async () => {
            try {
                const data = await getTranscriptEvaluations();
                setEvaluations(data);
            } catch (error) {
                console.error('Failed to fetch evaluations:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvaluations();
    }, []);

    // Detail view
    if (selectedEval) {
        return (
            <div>
                <div className="max-w-3xl mx-auto px-4 pt-6">
                    <button
                        onClick={() => setSelectedEval(null)}
                        className="mb-2 text-sm text-content-secondary hover:text-content-primary transition-colors"
                    >
                        ← {t('te_history_back')}
                    </button>
                </div>
                <EvaluationReview
                    evaluation={selectedEval.evaluationData}
                    preAnswers={selectedEval.preAnswers}
                    onDone={() => setSelectedEval(null)}
                />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <button
                onClick={onBack}
                className="mb-4 text-sm text-content-secondary hover:text-content-primary transition-colors"
            >
                ← {t('te_input_back')}
            </button>

            <h2 className="text-2xl font-bold text-content-primary mb-6">{t('te_history_title')}</h2>

            {evaluations.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-content-secondary">{t('te_history_empty')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {evaluations.map((evalItem) => {
                        const date = new Date(evalItem.createdAt);
                        const dateStr = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                        const scoreColor = evalItem.overallScore >= 7 ? 'text-green-600 dark:text-green-400' 
                            : evalItem.overallScore >= 4 ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-red-600 dark:text-red-400';

                        return (
                            <div
                                key={evalItem.id}
                                onClick={() => setSelectedEval(evalItem)}
                                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-background-secondary dark:bg-transparent cursor-pointer hover:border-accent-primary hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-content-secondary">{dateStr}</span>
                                    <span className={`text-sm font-bold ${scoreColor}`}>
                                        {t('te_history_score')}: {evalItem.overallScore}/10
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-content-primary mb-1 line-clamp-1">{evalItem.goal}</p>
                                <p className="text-xs text-content-secondary line-clamp-2">{evalItem.summary}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EvaluationHistory;
