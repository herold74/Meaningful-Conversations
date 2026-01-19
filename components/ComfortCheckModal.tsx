import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as api from '../services/api';
import Button from './shared/Button';

interface ComfortCheckModalProps {
  chatHistory: any[];
  sessionId: string;
  coachingMode?: string;
  onComplete: () => void;
  encryptionKey: CryptoKey | null;
}

const ComfortCheckModal: React.FC<ComfortCheckModalProps> = ({
  chatHistory,
  sessionId,
  coachingMode,
  onComplete,
  encryptionKey
}) => {
  const { t, language } = useLocalization();
  const [comfortScore, setComfortScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show if DPFL mode and encryption key available
  if (coachingMode !== 'dpfl' || !encryptionKey) {
    // Silently skip comfort check
    onComplete();
    return null;
  }

  const handleSubmit = async (optOut: boolean) => {
    if (!optOut && comfortScore === null) {
      alert(t('comfort_check_select_score') || 'Please select a comfort score');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.submitSessionLog({
        chatHistory,
        sessionId,
        comfortScore: optOut ? null : comfortScore!,
        optedOut: optOut,
        encryptionKey,
        language: language as 'de' | 'en'
      });

      onComplete();
    } catch (error) {
      console.error('[DPFL] Failed to submit comfort check:', error);
      // Don't block user - complete anyway
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-primary dark:bg-background-secondary rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
        <h3 className="text-xl font-bold mb-4 text-content-primary">
          🧪 {t('comfort_check_title') || 'Session Reflection'}
        </h3>

        <p className="text-sm text-content-secondary mb-6">
          {t('comfort_check_description') || 
            'How authentic were you in this session? This helps refine your personality profile over time.'}
        </p>

        {/* Likert Scale */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-content-secondary">
              {t('comfort_check_low') || 'Not authentic'}
            </span>
            <span className="text-xs text-content-secondary">
              {t('comfort_check_high') || 'Very authentic'}
            </span>
          </div>

          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => setComfortScore(score)}
                className={`
                  flex-1 py-3 rounded-lg border-2 transition-all font-bold
                  ${comfortScore === score
                    ? 'bg-accent-primary text-white border-accent-primary'
                    : 'bg-background-secondary border-border-secondary hover:border-accent-primary'
                  }
                `}
              >
                {score}
              </button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-content-secondary">
            <strong className="text-blue-700 dark:text-blue-400">ℹ️ {t('comfort_check_privacy') || 'Privacy'}:</strong>{' '}
            {t('comfort_check_privacy_desc') || 
              'Session data is end-to-end encrypted. Only you can decrypt it.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => handleSubmit(false)}
            disabled={comfortScore === null || isSubmitting}
            loading={isSubmitting}
            size="lg"
            className="flex-1"
          >
            {isSubmitting 
              ? (t('comfort_check_submitting') || 'Saving...') 
              : (t('comfort_check_use_session') || 'Use for Profile Refinement')}
          </Button>

          <Button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            variant="secondary"
            size="lg"
            className="flex-1"
          >
            {t('comfort_check_skip') || 'Skip'}
          </Button>
        </div>

        <p className="text-xs text-content-secondary mt-4 text-center">
          {t('comfort_check_note') || 'Sessions with score ≥ 3 will be used for profile refinement'}
        </p>
      </div>
    </div>
  );
};

export default ComfortCheckModal;

