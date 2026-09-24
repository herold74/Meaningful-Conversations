import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import Button from './shared/Button';

export interface CoachingSessionResumeBannerProps {
  coachName: string;
  messageCount: number;
  onResume: () => void;
}

const CoachingSessionResumeBanner: React.FC<CoachingSessionResumeBannerProps> = ({
  coachName,
  messageCount,
  onResume,
}) => {
  const { t } = useLocalization();

  return (
    <div
      className="w-full rounded-card border border-accent-primary/40 bg-accent-primary/10 p-4 text-left"
      role="status"
    >
      <p className="text-sm text-content-secondary mb-3">
        {t('coaching_return_banner_body', { coach: coachName, count: messageCount })}
      </p>
      <Button
        type="button"
        onClick={onResume}
        variant="gradient"
        size="md"
        fullWidth
        leftIcon={<MessageCircle className="w-5 h-5" aria-hidden />}
      >
        {t('coaching_return_to_session')}
      </Button>
    </div>
  );
};

export default CoachingSessionResumeBanner;
