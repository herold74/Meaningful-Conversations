import React, { useMemo } from 'react';
import { Mail } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { brandEmailForPurpose, type BrandMailPurpose } from '../../config/brand';
import { buildMailtoHref } from '../../utils/mailto';
import { openMailtoLink } from '../../utils/openMailto';

export interface ContactMailLinkProps {
  purpose?: BrandMailPurpose;
  /** Override destination (defaults from purpose). */
  email?: string;
  subject?: string;
  body?: string;
  variant?: 'button' | 'link';
  /** Contextual styling — gold matches BotSelection client section. */
  tone?: 'default' | 'gold';
  className?: string;
  /** Shown in mail body when purpose is coaching. */
  userEmail?: string;
  children?: React.ReactNode;
}

const toneButtonClasses: Record<NonNullable<ContactMailLinkProps['tone']>, string> = {
  default: `
    border-accent-primary text-accent-primary
    hover:bg-accent-primary/10 active:bg-accent-primary/15
    focus-visible:ring-accent-primary
  `,
  gold: `
    border-section-gold text-section-gold
    hover:bg-section-gold/10 active:bg-section-gold/15
    focus-visible:ring-section-gold
  `,
};

const toneLinkClasses: Record<NonNullable<ContactMailLinkProps['tone']>, string> = {
  default: 'text-accent-primary hover:text-accent-primary-hover',
  gold: 'text-section-gold hover:text-section-gold/90 underline-offset-2',
};

const ContactMailLink: React.FC<ContactMailLinkProps> = ({
  purpose = 'coaching',
  email,
  subject,
  body,
  variant = 'button',
  tone = 'default',
  className = '',
  userEmail,
  children,
}) => {
  const { t } = useLocalization();

  const destination = email ?? brandEmailForPurpose(purpose);

  const resolvedSubject =
    subject ??
    (purpose === 'coaching'
      ? t('contact_mailto_coaching_subject')
      : t('contact_mailto_support_subject'));

  const resolvedBody = useMemo(() => {
    if (body !== undefined) return body;
    if (purpose !== 'coaching') return undefined;
    if (userEmail?.trim()) {
      return t('contact_mailto_coaching_body_logged_in', { userEmail: userEmail.trim() });
    }
    return t('contact_mailto_coaching_body_guest');
  }, [body, purpose, userEmail, t]);

  const href = buildMailtoHref({
    to: destination,
    subject: resolvedSubject,
    body: resolvedBody,
  });

  const label = children ?? t('contact_send_message');
  const ariaLabel =
    purpose === 'coaching'
      ? t('contact_mailto_aria_coaching', { email: destination })
      : t('contact_mailto_aria_support', { email: destination });

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    e.preventDefault();
    openMailtoLink(href);
  };

  if (variant === 'link') {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-1.5 font-medium underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-sm ${toneLinkClasses[tone]} ${className}`}
        aria-label={ariaLabel}
      >
        <Mail className="w-4 h-4 shrink-0" aria-hidden />
        {label}
      </a>
    );
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`
        inline-flex items-center justify-center gap-2
        min-h-[44px] w-full sm:w-auto max-w-full
        px-4 py-2.5 text-sm font-semibold
        rounded-lg border-2
        transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        [-webkit-tap-highlight-color:transparent]
        ${toneButtonClasses[tone]}
        ${className}
      `}
      aria-label={ariaLabel}
    >
      <Mail className="w-4 h-4 shrink-0" aria-hidden />
      <span className="text-center leading-snug">{label}</span>
    </a>
  );
};

export default ContactMailLink;
