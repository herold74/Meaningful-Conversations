import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { TranscriptEvaluationResult, TranscriptPreAnswers } from '../types';
import { exportTranscriptEvaluationPDF } from '../utils/transcriptEvaluationPDF';

interface EvaluationReviewProps {
    evaluation: TranscriptEvaluationResult;
    preAnswers: TranscriptPreAnswers;
    onDone: () => void;
    currentUser?: { email?: string; isClient?: boolean };
}

const ScoreBadge: React.FC<{ score: number; max: number }> = ({ score, max }) => {
    const ratio = score / max;
    const color = ratio >= 0.7 ? 'bg-green-500' : ratio >= 0.4 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-white font-bold text-sm ${color}`}>
            {score}/{max}
        </span>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode; badge?: React.ReactNode }> = ({ title, children, badge }) => (
    <div className="bg-background-primary rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-content-primary">{title}</h3>
            {badge}
        </div>
        {children}
    </div>
);

const BulletList: React.FC<{ items: string[]; color?: string }> = ({ items, color = 'text-content-primary' }) => {
    if (items.length === 0) return <p className="text-sm text-content-secondary italic">—</p>;
    return (
        <ul className="space-y-1">
            {items.map((item, i) => (
                <li key={i} className={`text-sm ${color} flex items-start gap-2`}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                    {item}
                </li>
            ))}
        </ul>
    );
};

const EvaluationReview: React.FC<EvaluationReviewProps> = ({ evaluation, preAnswers, onDone, currentUser }) => {
    const { t, language } = useLocalization();
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            await exportTranscriptEvaluationPDF(
                evaluation,
                preAnswers,
                currentUser?.email,
                language as 'de' | 'en'
            );
        } catch (error) {
            console.error('PDF export failed:', error);
            alert(t('te_export_error'));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <h2 className="text-2xl font-bold text-content-primary mb-2">{t('te_review_title')}</h2>

            {/* Overall Score */}
            <div className="bg-gradient-to-r from-accent-primary/10 to-accent-primary/5 rounded-xl border border-accent-primary/20 p-6 mb-6 text-center">
                <p className="text-sm text-content-secondary mb-2">{t('te_review_overall')}</p>
                <div className="text-5xl font-bold text-accent-primary mb-1">
                    {evaluation.overallScore}
                    <span className="text-xl text-content-secondary font-normal">/{10}</span>
                </div>
                <p className="text-sm text-content-secondary mt-3 max-w-lg mx-auto">{evaluation.summary}</p>
            </div>

            {/* Goal Alignment */}
            <Section
                title={t('te_review_goal_alignment')}
                badge={<ScoreBadge score={evaluation.goalAlignment.score} max={5} />}
            >
                <div className="space-y-3">
                    <div>
                        <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1">{t('te_review_evidence')}</p>
                        <p className="text-sm text-content-primary">{evaluation.goalAlignment.evidence}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1">{t('te_review_gaps')}</p>
                        <p className="text-sm text-content-primary">{evaluation.goalAlignment.gaps}</p>
                    </div>
                </div>
            </Section>

            {/* Behavioral Analysis */}
            <Section
                title={t('te_review_behavioral')}
                badge={<ScoreBadge score={evaluation.behavioralAlignment.score} max={5} />}
            >
                <p className="text-sm text-content-primary mb-3">{evaluation.behavioralAlignment.evidence}</p>
                {evaluation.behavioralAlignment.blindspotEvidence.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-2">{t('te_review_blindspots')}</p>
                        <BulletList items={evaluation.behavioralAlignment.blindspotEvidence} color="text-amber-700 dark:text-amber-400" />
                    </div>
                )}
            </Section>

            {/* Assumption Check */}
            <Section title={t('te_review_assumptions')}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
                            ✓ {t('te_review_assumptions_confirmed')}
                        </p>
                        <BulletList items={evaluation.assumptionCheck.confirmed} color="text-green-700 dark:text-green-300" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">
                            ✗ {t('te_review_assumptions_challenged')}
                        </p>
                        <BulletList items={evaluation.assumptionCheck.challenged} color="text-red-700 dark:text-red-300" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
                            ★ {t('te_review_assumptions_new')}
                        </p>
                        <BulletList items={evaluation.assumptionCheck.newInsights} color="text-blue-700 dark:text-blue-300" />
                    </div>
                </div>
            </Section>

            {/* Calibration */}
            <Section title={t('te_review_calibration')}>
                <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                        <p className="text-xs text-content-secondary mb-1">{t('te_review_calibration_self')}</p>
                        <div className="text-3xl font-bold text-content-primary">{evaluation.calibration.selfRating}<span className="text-lg text-content-secondary">/5</span></div>
                    </div>
                    <div className="text-2xl text-content-secondary">↔</div>
                    <div className="text-center">
                        <p className="text-xs text-content-secondary mb-1">{t('te_review_calibration_evidence')}</p>
                        <div className="text-3xl font-bold text-accent-primary">{evaluation.calibration.evidenceRating}<span className="text-lg text-content-secondary">/5</span></div>
                    </div>
                </div>
                <p className="text-sm font-medium text-content-primary mb-1">{evaluation.calibration.delta}</p>
                <p className="text-sm text-content-secondary">{evaluation.calibration.interpretation}</p>
            </Section>

            {/* Personality Insights */}
            {evaluation.personalityInsights.length > 0 && (
                <Section title={t('te_review_personality')}>
                    <div className="space-y-4">
                        {evaluation.personalityInsights.map((insight, i) => (
                            <div key={i} className="border-l-3 border-accent-primary pl-4">
                                <p className="text-xs font-bold text-accent-primary uppercase tracking-wide">{insight.dimension}</p>
                                <p className="text-sm text-content-primary mt-1">{insight.observation}</p>
                                <p className="text-sm text-content-secondary mt-1 italic">→ {insight.recommendation}</p>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {evaluation.personalityInsights.length === 0 && (
                <div className="bg-background-primary rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4 text-center">
                    <p className="text-sm text-content-secondary">{t('te_review_no_personality')}</p>
                </div>
            )}

            {/* Strengths & Development Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Section title={t('te_review_strengths')}>
                    <BulletList items={evaluation.strengths} color="text-green-700 dark:text-green-300" />
                </Section>
                <Section title={t('te_review_development')}>
                    <BulletList items={evaluation.developmentAreas} color="text-amber-700 dark:text-amber-400" />
                </Section>
            </div>

            {/* Next Steps */}
            <Section title={t('te_review_next_steps')}>
                <div className="space-y-3">
                    {evaluation.nextSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-primary text-white text-xs font-bold flex items-center justify-center mt-0.5">
                                {i + 1}
                            </span>
                            <div>
                                <p className="text-sm font-medium text-content-primary">{step.action}</p>
                                <p className="text-xs text-content-secondary mt-0.5">{step.rationale}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Action buttons */}
            <div className="mt-8 mb-4 space-y-3">
                {/* PDF Export - nur für Clients */}
                {currentUser?.isClient && (
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="w-full py-3 rounded-lg font-semibold text-accent-primary bg-white dark:bg-gray-800 border-2 border-accent-primary hover:bg-accent-primary hover:text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isExporting ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>{t('te_exporting')}</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>{t('te_export_pdf')}</span>
                            </>
                        )}
                    </button>
                )}
                
                {/* Done button */}
                <button
                    onClick={onDone}
                    className="w-full py-3 rounded-lg font-semibold text-white bg-accent-primary hover:bg-accent-primary/90 shadow-md hover:shadow-lg transition-all"
                >
                    {t('te_review_done')}
                </button>
            </div>
        </div>
    );
};

export default EvaluationReview;
