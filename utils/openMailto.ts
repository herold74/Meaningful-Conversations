/**
 * Open a mailto: URI reliably across browsers (Chrome desktop, installed PWA).
 * A plain <a href="mailto:..."> click is sometimes ignored in standalone display mode.
 */
export function openMailtoLink(href: string): void {
  if (typeof window === 'undefined' || !href.startsWith('mailto:')) {
    return;
  }

  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (isStandalone) {
    const popup = window.open(href, '_blank', 'noopener,noreferrer');
    if (!popup) {
      window.location.assign(href);
    }
    return;
  }

  try {
    const link = document.createElement('a');
    link.href = href;
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    window.location.assign(href);
  }
}
