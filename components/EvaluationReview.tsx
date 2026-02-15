import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { TranscriptEvaluationResult, TranscriptPreAnswers, BotRecommendation, BotRecommendationEntry } from '../types';
import { exportTranscriptEvaluationPDF } from '../utils/transcriptEvaluationPDF';
import EvaluationRating from './EvaluationRating';

interface EvaluationReviewProps {
    evaluation: TranscriptEvaluationResult;
    preAnswers: TranscriptPreAnswers;
    onDone: () => void;
    currentUser?: { email?: string; isPremium?: boolean; isClient?: boolean; isAdmin?: boolean; isDeveloper?: boolean; unlockedCoaches?: string[] };
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

const accessHierarchy: Record<string, number> = {
    guest: 0,
    registered: 1,
    premium: 2,
    client: 3
};

const getUserAccessLevel = (user?: EvaluationReviewProps['currentUser']): string => {
    if (!user) return 'guest';
    if (user.isAdmin || user.isDeveloper) return 'client';
    if (user.isClient) return 'client';
    if (user.isPremium) return 'premium';
    return 'registered';
};

const isBotAvailable = (requiredTier: string, userLevel: string, botId: string, unlockedCoaches: string[]): boolean => {
    return (accessHierarchy[userLevel] ?? 0) >= (accessHierarchy[requiredTier] ?? 0) || unlockedCoaches.includes(botId);
};

const BotRecCard: React.FC<{
    rec: BotRecommendationEntry;
    label: string;
    available: boolean;
    tierLabel: string;
    t: (key: string) => string;
}> = ({ rec, label, available, tierLabel, t }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(rec.examplePrompt).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className={`rounded-lg border p-4 flex flex-col h-full ${available ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${label === t('te_review_bot_primary') ? 'text-accent-primary' : 'text-content-tertiary'}`}>
                        {label}
                    </span>
                    <span className="text-sm font-bold text-content-primary">{rec.botName}</span>
                </div>
                {available ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {t('te_review_bot_available')}
                    </span>
                ) : (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${rec.requiredTier === 'client' ? 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30' : 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        {tierLabel}
                    </span>
                )}
            </div>
            <p className="text-sm text-content-secondary mb-3 line-clamp-6 min-h-[7.5rem]" title={rec.rationale}>{rec.rationale}</p>
            <div className="bg-background-primary dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex-1">
                <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-1">{t('te_review_bot_example_prompt')}</p>
                <p className="text-sm text-content-primary italic leading-relaxed">&ldquo;{rec.examplePrompt}&rdquo;</p>
                <button
                    onClick={handleCopy}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-primary hover:text-accent-primary/80 transition-colors"
                >
                    {copied ? (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {t('te_review_bot_copied')}
                        </>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            {t('te_review_bot_copy_prompt')}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

const EvaluationReview: React.FC<EvaluationReviewProps> = ({ evaluation, preAnswers, onDone, currentUser }) => {
    const { t, language } = useLocalization();
    const [isExporting, setIsExporting] = useState(false);
    const userAccessLevel = getUserAccessLevel(currentUser);
    const unlockedCoaches = currentUser?.unlockedCoaches || [];

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
            <h2 className="text-2xl font-bold text-content-primary mb-1">{t('te_review_title')}</h2>
            {preAnswers.situationName && (
                <p className="text-base text-content-secondary mb-4">{preAnswers.situationName}</p>
            )}

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

            {/* Bot Recommendations */}
            {evaluation.botRecommendations && evaluation.botRecommendations.length > 0 && (
                <Section title={t('te_review_bot_recommendations')}>
                    <div className="space-y-6">
                        {evaluation.botRecommendations.map((rec, i) => {
                            const getTierLabel = (tier: string) => {
                                if (tier === 'client') return t('te_review_bot_client_required');
                                if (tier === 'premium') return t('te_review_bot_premium_required');
                                return t('te_review_bot_available');
                            };
                            const primaryAvailable = isBotAvailable(rec.primary.requiredTier, userAccessLevel, rec.primary.botId, unlockedCoaches);
                            const secondaryAvailable = isBotAvailable(rec.secondary.requiredTier, userAccessLevel, rec.secondary.botId, unlockedCoaches);

                            return (
                                <div key={i}>
                                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-3 leading-relaxed">
                                        {rec.developmentArea}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <BotRecCard
                                            rec={rec.primary}
                                            label={t('te_review_bot_primary')}
                                            available={primaryAvailable}
                                            tierLabel={getTierLabel(rec.primary.requiredTier)}
                                            t={t}
                                        />
                                        <BotRecCard
                                            rec={rec.secondary}
                                            label={t('te_review_bot_secondary')}
                                            available={secondaryAvailable}
                                            tierLabel={getTierLabel(rec.secondary.requiredTier)}
                                            t={t}
                                        />
                                    </div>
                                    {i < evaluation.botRecommendations!.length - 1 && (
                                        <hr className="mt-6 border-gray-200 dark:border-gray-700" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}

            {/* Action buttons */}
            <div className="mt-8 mb-4 space-y-3">
                {/* PDF Export - für Premium, Clients, Admins und Developers */}
                {(currentUser?.isPremium || currentUser?.isClient || currentUser?.isAdmin || currentUser?.isDeveloper) && (
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

            {/* Rating Section */}
            {evaluation.id && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <EvaluationRating
                        evaluationId={evaluation.id}
                        existingRating={evaluation.userRating}
                        existingFeedback={evaluation.userFeedback}
                        existingContactOptIn={evaluation.contactOptIn}
                        onRated={() => {}}
                    />
                </div>
            )}
        </div>
    );
};

export default EvaluationReview;
