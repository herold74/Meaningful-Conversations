export interface MailtoParams {
  to: string;
  subject?: string;
  body?: string;
}

/**
 * Build a mailto: href with RFC 3986 percent-encoded query parameters.
 *
 * IMPORTANT: `URLSearchParams`/`encodeURIComponent`-via-form-encoding turns spaces
 * into `+`, which is correct for `application/x-www-form-urlencoded` bodies but
 * NOT for `mailto:` URIs — mail clients (e.g. iOS Mail) render literal `+`
 * characters instead of spaces. We build the query string manually with
 * `encodeURIComponent` (which encodes spaces as `%20`) to avoid that.
 */
export function buildMailtoHref({ to, subject, body }: MailtoParams): string {
  const trimmedTo = to.trim();
  if (!trimmedTo) return 'mailto:';

  const parts: string[] = [];
  if (subject?.trim()) parts.push(`subject=${encodeURIComponent(subject.trim())}`);
  if (body?.trim()) parts.push(`body=${encodeURIComponent(body.trim())}`);

  const query = parts.join('&');
  return query ? `mailto:${trimmedTo}?${query}` : `mailto:${trimmedTo}`;
}
