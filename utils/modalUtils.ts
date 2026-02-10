import { useEffect, useSyncExternalStore } from 'react';

/**
 * Track open modal count on <html> element via data-modal-open attribute.
 * Also provides a reactive hook (useIsAnyModalOpen) so App.tsx can
 * hide the native iOS GamificationBar when any modal is active.
 */
let modalCount = 0;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

function getSnapshot(): boolean {
  return modalCount > 0;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Hook to mark a modal as open/closed.
 * @param isOpen - For always-mounted components with isOpen prop, pass the prop value.
 *                 For conditionally-rendered components (mount=open), omit or pass true.
 */
export function useModalOpen(isOpen: boolean = true) {
  useEffect(() => {
    if (!isOpen) return;
    modalCount++;
    document.documentElement.setAttribute('data-modal-open', 'true');
    notifyListeners();
    return () => {
      modalCount--;
      if (modalCount <= 0) {
        modalCount = 0;
        document.documentElement.removeAttribute('data-modal-open');
      }
      notifyListeners();
    };
  }, [isOpen]);
}

/**
 * Reactive hook: returns true when any modal is open.
 * Use in App.tsx to hide the native GamificationBar on iOS.
 */
export function useIsAnyModalOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
