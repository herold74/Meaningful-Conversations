/**
 * Service Worker Update Utilities
 */

/**
 * Force the waiting service worker to activate and reload the page
 */
export const updateServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration && registration.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Wait for the new service worker to activate
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload the page to get the new version
        window.location.reload();
      }, { once: true });
    } else {
      // No waiting worker, just reload
      window.location.reload();
    }
  } else {
    // No service worker support, just reload
    window.location.reload();
  }
};

/**
 * Perform a hard reload - clear all caches and reload
 */
export const hardReload = async (): Promise<void> => {
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Hard reload from server (bypass cache)
    window.location.reload();
  } catch (error) {
    console.error('Hard reload failed:', error);
    // Fallback to simple reload
    window.location.reload();
  }
};

/**
 * Check if an update is available
 */
export const checkForUpdates = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return !!registration.waiting;
    }
  }
  return false;
};

