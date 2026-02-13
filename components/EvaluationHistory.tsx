import React, { useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { TranscriptEvaluationSummary, TranscriptEvaluationResult, TranscriptPreAnswers } from '../types';
import { getTranscriptEvaluations } from '../services/geminiService';
import EvaluationReview from './EvaluationReview';
import Spinner from './shared/Spinner';
import { exportTranscriptEvaluationPDF } from '../utils/transcriptEvaluationPDF';

interface EvaluationHistoryProps {
    onBack: () => void;
    currentUser?: { email?: string; isClient?: boolean };
}

const EvaluationHistory: React.FC<EvaluationHistoryProps> = ({ onBack, currentUser }) => {
    const { t, language } = useLocalization();
    const [evaluations, setEvaluations] = useState<TranscriptEvaluationSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEval, setSelectedEval] = useState<TranscriptEvaluationSummary | null>(null);
    const [exportingId, setExportingId] = useState<string | null>(null);

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

    const handleExportPDF = async (evalItem: TranscriptEvaluationSummary, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening detail view
        setExportingId(evalItem.id);
        try {
            await exportTranscriptEvaluationPDF(
                evalItem.evaluationData,
                evalItem.preAnswers,
                currentUser?.email,
                language as 'de' | 'en'
            );
        } catch (error) {
            console.error('PDF export failed:', error);
            alert(t('te_export_error'));
        } finally {
            setExportingId(null);
        }
    };

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
                    currentUser={currentUser}
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
                                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-background-secondary dark:bg-transparent hover:border-accent-primary hover:shadow-md transition-all"
                            >
                                <div
                                    onClick={() => setSelectedEval(evalItem)}
                                    className="cursor-pointer"
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

                                {/* PDF Export Button - nur für Clients */}
                                {currentUser?.isClient && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={(e) => handleExportPDF(evalItem, e)}
                                            disabled={exportingId === evalItem.id}
                                            className="w-full py-2 px-3 rounded-lg text-sm font-medium text-accent-primary bg-white dark:bg-gray-800 border border-accent-primary hover:bg-accent-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {exportingId === evalItem.id ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>{t('te_exporting')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span>{t('te_export_pdf')}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EvaluationHistory;
