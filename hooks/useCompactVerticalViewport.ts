import { useEffect, useState } from 'react';

/** True on short viewports (e.g. small phones, keyboard open) — tighter chat chrome. */
export function useCompactVerticalViewport(maxHeightPx = 620): boolean {
  const query = `(max-height: ${maxHeightPx}px)`;

  const [compact, setCompact] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);

  return compact;
}
