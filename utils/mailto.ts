export interface MailtoParams {
  to: string;
  subject?: string;
  body?: string;
}

/** Build a mailto: href with encoded query parameters. */
export function buildMailtoHref({ to, subject, body }: MailtoParams): string {
  const trimmedTo = to.trim();
  if (!trimmedTo) return 'mailto:';

  const params = new URLSearchParams();
  if (subject?.trim()) params.set('subject', subject.trim());
  if (body?.trim()) params.set('body', body.trim());

  const query = params.toString();
  return query ? `mailto:${trimmedTo}?${query}` : `mailto:${trimmedTo}`;
}
