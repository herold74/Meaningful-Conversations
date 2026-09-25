import React, { useMemo, useState } from 'react';
import { Mail } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { brandEmailForPurpose, type BrandMailPurpose } from '../../config/brand';
import {
  buildGmailComposeUrl,
  buildMailtoHref,
  buildOutlookComposeUrl,
} from '../../utils/mailto';
import { isNativeApp } from '../../utils/platformDetection';

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

const stopBubble = (e: React.MouseEvent) => {
  e.stopPropagation();
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
  const [copied, setCopied] = useState(false);
  const nativeApp = isNativeApp();

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

  const composeParams = useMemo(
    () => ({
      to: destination,
      subject: resolvedSubject,
      body: resolvedBody,
    }),
    [destination, resolvedSubject, resolvedBody],
  );

  const mailtoHref = buildMailtoHref(composeParams);
  const gmailHref = buildGmailComposeUrl(composeParams);
  const outlookHref = buildOutlookComposeUrl(composeParams);

  const label = children ?? t('contact_send_message');
  const ariaLabel =
    purpose === 'coaching'
      ? t('contact_mailto_aria_coaching', { email: destination })
      : t('contact_mailto_aria_support', { email: destination });

  const buttonClassName = `
    inline-flex items-center justify-center gap-2
    min-h-[44px] w-full sm:w-auto max-w-full
    px-4 py-2.5 text-sm font-semibold
    rounded-lg border-2
    transition-colors
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    [-webkit-tap-highlight-color:transparent]
    ${toneButtonClasses[tone]}
    ${className}
  `;

  const linkClassName = `inline-flex items-center justify-center gap-1.5 font-medium underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-sm ${toneLinkClasses[tone]} ${className}`;

  const fallbackLinkClass =
    tone === 'gold'
      ? 'text-section-gold/90 hover:text-section-gold underline underline-offset-2'
      : 'text-content-secondary hover:text-content-primary underline underline-offset-2';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(destination);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t('contact_copy_email_prompt'), destination);
    }
  };

  const renderPrimaryAnchor = (href: string, target?: string, rel?: string) => {
    const content = (
      <>
        <Mail className="w-4 h-4 shrink-0" aria-hidden />
        {variant === 'button' ? (
          <span className="text-center leading-snug">{label}</span>
        ) : (
          label
        )}
      </>
    );

    if (variant === 'link') {
      return (
        <a
          href={href}
          target={target}
          rel={rel}
          onClick={stopBubble}
          className={linkClassName}
          aria-label={ariaLabel}
        >
          {content}
        </a>
      );
    }

    return (
      <a
        href={href}
        target={target}
        rel={rel}
        onClick={stopBubble}
        className={buttonClassName}
        aria-label={ariaLabel}
      >
        {content}
      </a>
    );
  };

  if (nativeApp) {
    return renderPrimaryAnchor(mailtoHref);
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-full">
      {renderPrimaryAnchor(gmailHref, '_blank', 'noopener noreferrer')}
      <p className="text-[0.6875rem] sm:text-xs leading-snug text-center max-w-prose">
        <a href={mailtoHref} onClick={stopBubble} className={fallbackLinkClass}>
          {t('contact_open_email_app')}
        </a>
        <span className="text-content-subtle/60 mx-1.5" aria-hidden>·</span>
        <a
          href={outlookHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stopBubble}
          className={fallbackLinkClass}
        >
          {t('contact_open_outlook')}
        </a>
        <span className="text-content-subtle/60 mx-1.5" aria-hidden>·</span>
        <button
          type="button"
          onClick={(e) => {
            stopBubble(e);
            void handleCopy();
          }}
          className={`${fallbackLinkClass} bg-transparent border-0 p-0 cursor-pointer font-inherit text-[inherit]`}
        >
          {copied ? t('contact_copy_email_done') : t('contact_copy_email')}
        </button>
      </p>
    </div>
  );
};

export default ContactMailLink;
