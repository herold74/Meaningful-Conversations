import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';

interface PracticeSelfRatingViewProps {
  frameworkName: string;
  onSubmit: (rating: number | undefined) => void;
  onSkip: () => void;
}

const PracticeSelfRatingView: React.FC<PracticeSelfRatingViewProps> = ({ frameworkName, onSubmit, onSkip }) => {
  const { t } = useLocalization();
  const [rating, setRating] = useState<number | null>(null);

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <h1 className="text-xl font-bold text-content-primary mb-2">{t('practice_self_rating_title')}</h1>
      <p className="text-sm text-content-secondary mb-6">{frameworkName}</p>
      <p className="text-content-secondary mb-6">{t('practice_self_rating_desc')}</p>

      <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-sm mx-auto">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`w-10 h-10 rounded-full border-2 text-sm font-bold transition-all ${
              rating === n
                ? 'border-accent-primary btn-accent-solid'
                : 'border-border-primary text-content-secondary hover:border-accent-primary/50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onSubmit(rating ?? undefined)}
          disabled={rating === null}
          className="py-3 rounded-lg btn-accent-solid font-semibold disabled:opacity-50"
        >
          {t('practice_self_rating_submit')}
        </button>
        <button type="button" onClick={onSkip} className="text-sm text-content-secondary hover:text-content-primary">
          {t('practice_self_rating_skip')}
        </button>
      </div>
    </div>
  );
};

export default PracticeSelfRatingView;
