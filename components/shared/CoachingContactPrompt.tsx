import React from 'react';
import { useLocalization } from '../../context/LocalizationContext';
import ContactMailLink from './ContactMailLink';

export interface CoachingContactPromptProps {
  messageKey?: string;
  messageParams?: Record<string, string | number>;
  tone?: 'default' | 'gold';
  userEmail?: string;
  className?: string;
}

/** Responsive hint + mailto button for coaching / client-access inquiries (connect@). */
const CoachingContactPrompt: React.FC<CoachingContactPromptProps> = ({
  messageKey = 'botSelection_clientContactMessage',
  messageParams,
  tone = 'gold',
  userEmail,
  className = '',
}) => {
  const { t } = useLocalization();

  const boxClasses =
    tone === 'gold'
      ? 'text-section-gold bg-section-gold-bg dark:bg-section-gold/10 border-section-gold/30'
      : 'text-content-secondary bg-background-secondary border-border-primary';

  return (
    <div
      className={`
        flex flex-col items-stretch sm:items-center gap-3 sm:gap-4
        text-sm p-4 sm:px-5 sm:py-4
        border text-center rounded-lg
        ${boxClasses}
        ${className}
      `}
    >
      <p className="leading-relaxed max-w-prose mx-auto">{t(messageKey, messageParams)}</p>
      <div className="flex justify-center w-full sm:w-auto shrink-0">
        <ContactMailLink purpose="coaching" tone={tone} userEmail={userEmail} />
      </div>
    </div>
  );
};

export default CoachingContactPrompt;
