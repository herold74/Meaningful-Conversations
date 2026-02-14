import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { rateTranscriptEvaluation } from '../services/geminiService';

interface EvaluationRatingProps {
    evaluationId: string;
    existingRating?: number | null;
    existingFeedback?: string | null;
    onRated: () => void;
}

const EvaluationRating: React.FC<EvaluationRatingProps> = ({
    evaluationId,
    existingRating,
    existingFeedback,
    onRated
}) => {
    const { t } = useLocalization();
    const [selectedRating, setSelectedRating] = useState<number | null>(existingRating ?? null);
    const [feedback, setFeedback] = useState(existingFeedback || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(!!existingRating);

    const handleSubmit = async () => {
        if (selectedRating === null) return;

        setIsSubmitting(true);
        try {
            await rateTranscriptEvaluation(evaluationId, selectedRating, feedback.trim() || undefined);
            setIsSubmitted(true);
            onRated();
        } catch (error) {
            console.error('Failed to submit rating:', error);
            alert(t('te_rating_error') || 'Fehler beim Speichern der Bewertung.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRatingColor = (rating: number) => {
        if (rating <= 6) return 'bg-red-500 hover:bg-red-600';
        if (rating <= 8) return 'bg-yellow-500 hover:bg-yellow-600';
        return 'bg-green-500 hover:bg-green-600';
    };

    const getRatingColorSelected = (rating: number) => {
        if (rating <= 6) return 'bg-red-600 ring-red-500';
        if (rating <= 8) return 'bg-yellow-600 ring-yellow-500';
        return 'bg-green-600 ring-green-500';
    };

    if (isSubmitted) {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    {t('te_rating_thanks') || 'Vielen Dank für Ihr Feedback!'}
                </p>
                {selectedRating !== null && (
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                        {t('te_rating_score') || 'Ihre Bewertung'}: {selectedRating}/10
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <p className="text-sm font-medium text-content-primary mb-1">
                    {t('te_rating_title') || 'Wie hilfreich war diese Evaluierung?'}
                </p>
                <p className="text-xs text-content-secondary mb-3">
                    {t('te_rating_subtitle') || 'Ihre Bewertung hilft uns, die Qualität zu verbessern.'}
                </p>

                {/* NPS Rating Scale 0-10 */}
                <div className="flex flex-wrap gap-2 mb-2">
                    {Array.from({ length: 11 }, (_, i) => i).map((rating) => (
                        <button
                            key={rating}
                            onClick={() => setSelectedRating(rating)}
                            className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                                selectedRating === rating
                                    ? `${getRatingColorSelected(rating)} text-white ring-2`
                                    : `${getRatingColor(rating)} text-white opacity-60 hover:opacity-100`
                            }`}
                        >
                            {rating}
                        </button>
                    ))}
                </div>

                {/* Scale labels */}
                <div className="flex justify-between text-xs text-content-tertiary">
                    <span>{t('te_rating_low') || 'Nicht hilfreich'}</span>
                    <span>{t('te_rating_high') || 'Sehr hilfreich'}</span>
                </div>
            </div>

            {/* Optional Feedback */}
            {selectedRating !== null && (
                <div>
                    <label className="block text-xs font-medium text-content-secondary mb-1">
                        {t('te_rating_feedback_label') || 'Optionales Feedback (max. 500 Zeichen)'}
                    </label>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
                        placeholder={t('te_rating_feedback_placeholder') || 'Was können wir verbessern?'}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-background-primary text-content-primary text-sm focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-none"
                        rows={3}
                    />
                    <p className="text-xs text-content-tertiary mt-1 text-right">
                        {feedback.length}/500
                    </p>
                </div>
            )}

            {/* Submit Button */}
            {selectedRating !== null && (
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-lg font-semibold text-white bg-accent-primary hover:bg-accent-primary/90 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{t('submitting') || 'Wird gesendet...'}</span>
                        </>
                    ) : (
                        <span>{t('te_rating_submit') || 'Bewertung absenden'}</span>
                    )}
                </button>
            )}
        </div>
    );
};

export default EvaluationRating;
