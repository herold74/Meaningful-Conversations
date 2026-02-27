import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus within a container while it's mounted/active.
 * Handles Tab/Shift+Tab cycling and Escape to close.
 * Restores focus to the previously focused element on cleanup.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, onClose?: () => void, active = true) {
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    previousFocus.current = document.activeElement as HTMLElement;

    const el = containerRef.current;
    if (!el) return;

    const focusFirst = () => {
      const first = el.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    };

    // Small delay lets the portal render before we move focus
    const timer = setTimeout(focusFirst, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      el.removeEventListener('keydown', handleKeyDown);
      previousFocus.current?.focus();
    };
  }, [containerRef, onClose, active]);
}
