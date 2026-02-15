import React, { useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { getTranscriptRatings, TranscriptRating, TranscriptRatingStats } from '../services/userService';
import Spinner from './shared/Spinner';

const TranscriptRatingsView: React.FC = () => {
    const { t } = useLocalization();
    const [ratings, setRatings] = useState<TranscriptRating[]>([]);
    const [stats, setStats] = useState<TranscriptRatingStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'with' | 'without' | 'contact'>('all');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchRatings();
    }, []);

    const fetchRatings = async () => {
        setIsLoading(true);
        try {
            const data = await getTranscriptRatings();
            setRatings(data.ratings);
            setStats(data.stats);
        } catch (error) {
            console.error('Failed to fetch transcript ratings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const getRatingColor = (rating: number) => {
        if (rating <= 6) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
        if (rating <= 8) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    };

    const getRatingCategory = (rating: number) => {
        if (rating >= 9) return t('admin_te_ratings_promoters');
        if (rating >= 7) return t('admin_te_ratings_passives');
        return t('admin_te_ratings_detractors');
    };

    const filteredRatings = ratings.filter(r => {
        if (feedbackFilter === 'with') return r.feedback && r.feedback.trim().length > 0;
        if (feedbackFilter === 'without') return !r.feedback || r.feedback.trim().length === 0;
        if (feedbackFilter === 'contact') return r.contactOptIn;
        return true;
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-content-primary">
                Evaluation Ratings (Transcripts)
            </h2>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-background-secondary dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-content-secondary mb-1">{t('admin_te_ratings_total')}</p>
                        <p className="text-2xl font-bold text-content-primary">{stats.total}</p>
                    </div>
                    <div className="bg-background-secondary dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-content-secondary mb-1">{t('admin_te_ratings_nps')}</p>
                        <p className="text-2xl font-bold text-accent-primary">{stats.nps.toFixed(1)}</p>
                    </div>
                    <div className="bg-background-secondary dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-content-secondary mb-1">{t('admin_te_ratings_avg')}</p>
                        <p className="text-2xl font-bold text-content-primary">{stats.avgRating.toFixed(1)}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-700 dark:text-green-300 mb-1">Promoters</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.promoters}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">Passives</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.passives}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                        <p className="text-xs text-red-700 dark:text-red-300 mb-1">Detractors</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.detractors}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFeedbackFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        feedbackFilter === 'all'
                            ? 'bg-accent-primary text-white'
                            : 'bg-background-secondary text-content-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    {t('admin_te_ratings_filter_all')}
                </button>
                <button
                    onClick={() => setFeedbackFilter('with')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        feedbackFilter === 'with'
                            ? 'bg-accent-primary text-white'
                            : 'bg-background-secondary text-content-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    {t('admin_te_ratings_filter_with_feedback')}
                </button>
                <button
                    onClick={() => setFeedbackFilter('without')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        feedbackFilter === 'without'
                            ? 'bg-accent-primary text-white'
                            : 'bg-background-secondary text-content-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    {t('admin_te_ratings_filter_no_feedback')}
                </button>
                <button
                    onClick={() => setFeedbackFilter('contact')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        feedbackFilter === 'contact'
                            ? 'bg-blue-600 text-white'
                            : 'bg-background-secondary text-content-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    📬 {t('admin_te_ratings_filter_contact')}
                </button>
            </div>

            {/* Ratings List */}
            {filteredRatings.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="text-content-secondary">{t('admin_te_ratings_no_ratings')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredRatings.map((rating) => {
                        const date = new Date(rating.ratedAt);
                        const dateStr = date.toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        const isExpanded = expandedIds.has(rating.id);

                        return (
                            <div
                                key={rating.id}
                                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-background-secondary dark:bg-transparent"
                            >
                                <div
                                    onClick={() => rating.feedback && rating.feedback.trim().length > 0 && toggleExpand(rating.id)}
                                    className={`p-4 transition-colors ${rating.feedback && rating.feedback.trim().length > 0 ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-sm ${getRatingColor(rating.rating)}`}>
                                                    {rating.rating}/10
                                                </span>
                                                <span className="text-xs text-content-tertiary">
                                                    {getRatingCategory(rating.rating)}
                                                </span>
                                                <span className="text-xs text-content-tertiary">•</span>
                                                <span className="text-xs text-content-secondary">{dateStr}</span>
                                                {rating.contactOptIn && (
                                                    <>
                                                        <span className="text-xs text-content-tertiary">•</span>
                                                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                                                            📬 {t('admin_te_ratings_contact_requested')}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-sm">
                                                <p className="text-content-secondary">
                                                    <span className="font-medium text-content-primary">{t('admin_te_ratings_user')}:</span> {rating.userEmail}
                                                    {rating.isClient && <span className="ml-2 text-xs bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded">Client</span>}
                                                    {rating.isPremium && !rating.isClient && <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded">Premium</span>}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Expand Icon - only show if there's feedback to display */}
                                        {rating.feedback && rating.feedback.trim().length > 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleExpand(rating.id);
                                                }}
                                                className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                                            >
                                                <svg
                                                    className={`w-5 h-5 text-content-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && rating.feedback && rating.feedback.trim().length > 0 && (
                                    <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                                        <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-2">
                                            {t('admin_te_ratings_feedback')}:
                                        </p>
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-sm text-content-primary whitespace-pre-wrap">
                                                {rating.feedback}
                                            </p>
                                        </div>
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

export default TranscriptRatingsView;
