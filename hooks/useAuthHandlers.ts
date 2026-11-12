import * as api from '../services/api';
import * as userService from '../services/userService';
import { deserializeGamificationState } from '../utils/gamificationSerializer';
import { readOfflineLifeContext, saveOfflineLifeContext } from '../utils/offlineLifeContext';
import { logInRevenueCat, initializePurchases, isIAPAvailable, getAccessFromRevenueCat } from '../services/purchaseService';
import type { User, GamificationState, NavView } from '../types';

interface UseAuthHandlersParams {
    setAndProcessUser: (user: User | null) => void;
    setEncryptionKey: React.Dispatch<React.SetStateAction<CryptoKey | null>>;
    setLifeContext: React.Dispatch<React.SetStateAction<string>>;
    setGamificationState: React.Dispatch<React.SetStateAction<GamificationState>>;
    setView: React.Dispatch<React.SetStateAction<NavView>>;
    setPaywallUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
    setAuthRedirectReason: React.Dispatch<React.SetStateAction<string | null>>;
    setMenuView: React.Dispatch<React.SetStateAction<NavView | null>>;
    routeWithIntentPicker: (hasContext: boolean) => Promise<void>;
    DEFAULT_GAMIFICATION_STATE: GamificationState;
}

export function useAuthHandlers({
    setAndProcessUser,
    setEncryptionKey,
    setLifeContext,
    setGamificationState,
    setView,
    setPaywallUserEmail,
    setAuthRedirectReason,
    setMenuView,
    routeWithIntentPicker,
    DEFAULT_GAMIFICATION_STATE,
}: UseAuthHandlersParams) {
    const handleLoginSuccess = async (user: User, key: CryptoKey) => {
        setAndProcessUser(user);
        setEncryptionKey(key);
        setView('welcome');
        if (isIAPAvailable()) {
            void initializePurchases().then(() => logInRevenueCat(user.id));
        }
        try {
            let local: Awaited<ReturnType<typeof readOfflineLifeContext>> = null;
            try {
                local = await readOfflineLifeContext(user.id, key);
            } catch (decryptError) {
                console.warn('Stored life context cannot be opened with this password. It stays on the device and is not uploaded.', decryptError);
            }
            if (local?.dirty) {
                setLifeContext(local.context || '');
                setGamificationState(deserializeGamificationState(local.gamificationState));
                await routeWithIntentPicker(!!local.context);
                return;
            }
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 8000);
            let data;
            try {
                data = await userService.loadUserData(key, controller.signal);
            } finally {
                clearTimeout(timer);
            }
            setLifeContext(data.context || '');
            setGamificationState(deserializeGamificationState(data.gamificationState));
            await saveOfflineLifeContext(user.id, key, data.context || '', data.gamificationState || '{}', { dirty: false });

            if (user.isAdmin || user.isDeveloper) {
                const startupPref = localStorage.getItem('adminStartupPref');
                if (startupPref === 'normal') {
                    await routeWithIntentPicker(!!data.context);
                } else {
                    setView('admin');
                }
            } else {
                await routeWithIntentPicker(!!data.context);
            }
        } catch (error) {
            const local = await readOfflineLifeContext(user.id, key).catch(() => null);
            const offline = error instanceof api.ApiError && error.isNetworkError;
            if (local) {
                console.warn('Using the life context stored on this device.', error);
                setLifeContext(local.context || '');
                setGamificationState(deserializeGamificationState(local.gamificationState));
                await routeWithIntentPicker(!!local.context);
                return;
            }
            if (offline) {
                console.warn('Signed in from the device record. Life context will sync when the network is back.', error);
                setLifeContext('');
                setGamificationState(DEFAULT_GAMIFICATION_STATE);
                await routeWithIntentPicker(false);
                return;
            }
            console.error("Failed to load user data after login, logging out.", error);
            api.clearSession();
            setAndProcessUser(null);
            setEncryptionKey(null);
            setView('auth');
            setAuthRedirectReason("There was an issue loading your profile. Please try logging in again.");
        }
    };

    const handleAccessExpired = async (email: string, user: User, key: CryptoKey) => {
        setAndProcessUser(user);
        setEncryptionKey(key);
        setPaywallUserEmail(email);
        setView('welcome');
        let hasContext = false;
        try {
            const data = await userService.loadUserData(key);
            setLifeContext(data.context || '');
            setGamificationState(deserializeGamificationState(data.gamificationState));
            hasContext = !!data.context;
        } catch { /* data load failed — download button will be empty, but paywall still works */ }

        // Sync from RevenueCat: Backend fetches subscription status. Works from web AND iOS.
        // On iOS we also call logIn first so RevenueCat merges anonymous → our user ID.
        if (isIAPAvailable()) {
            await initializePurchases();
            await logInRevenueCat(user.id);
            await new Promise(r => setTimeout(r, 500));
        }

        // Returns: 'restored' if access was restored, 'fatal' if the endpoint is not configured, false otherwise
        const trySync = async (): Promise<'restored' | 'fatal' | false> => {
            try {
                const res = await api.apiFetch('/apple-iap/sync-from-revenuecat', {
                    method: 'POST',
                    body: JSON.stringify({}),
                });
                const syncedUser = res?.user;
                if (syncedUser) {
                    const hasAccess = syncedUser.isAdmin || syncedUser.isDeveloper || syncedUser.isPremium || syncedUser.isClient
                        || (!syncedUser.accessExpiresAt)
                        || (syncedUser.accessExpiresAt && new Date(syncedUser.accessExpiresAt) > new Date());
                    if (hasAccess) {
                        setAndProcessUser(syncedUser);
                        setPaywallUserEmail(null);
                        return 'restored';
                    }
                }
            } catch (err: any) {
                console.warn('[Paywall] RevenueCat sync failed:', err);
                if (err?.status === 503) return 'fatal';
            }
            return false;
        };

        const syncResult = await trySync();
        if (syncResult === 'restored') { await routeWithIntentPicker(hasContext); return; }
        if (syncResult !== 'fatal') {
            await new Promise(r => setTimeout(r, 1000));
            const r2 = await trySync();
            if (r2 === 'restored') { await routeWithIntentPicker(hasContext); return; }
            if (r2 !== 'fatal') {
                await new Promise(r => setTimeout(r, 2000));
                const r3 = await trySync();
                if (r3 === 'restored') { await routeWithIntentPicker(hasContext); return; }
            }
        }

        // Local RC cache fallback only when server sync is unavailable — not when login already
        // returned accessExpired (server + RC API confirmed no access). Otherwise sandbox device
        // entitlements bypass the paywall after an intentional demo reset.
        const serverSaysExpired =
            !user.isAdmin && !user.isDeveloper && !user.isPremium && !user.isClient
            && user.accessExpiresAt != null
            && new Date(user.accessExpiresAt) < new Date();
        const syncUnavailable = syncResult === 'fatal';

        if (!serverSaysExpired && syncUnavailable && isIAPAvailable()) {
          const rcAccess = await getAccessFromRevenueCat();
          if (rcAccess?.hasAccess) {
            const patched = { ...user };
            patched.accessExpiresAt = rcAccess.accessExpiresAt ?? undefined;
            if (rcAccess.isPremium) {
              patched.isPremium = true;
              patched.premiumExpiresAt = rcAccess.accessExpiresAt ?? new Date(Date.now() + 365 * 86400000).toISOString();
            }
            if (rcAccess.accessExpiresAt && !patched.premiumExpiresAt) {
              patched.premiumExpiresAt = rcAccess.accessExpiresAt;
            }
            setAndProcessUser(patched);
            setPaywallUserEmail(null);
            await routeWithIntentPicker(hasContext);
            return;
          }
        }

        setView('paywall');
    };

    const handleLogout = () => {
        api.clearSession();
        setAndProcessUser(null);
        setEncryptionKey(null);
        setLifeContext('');
        setGamificationState(DEFAULT_GAMIFICATION_STATE);
        setAuthRedirectReason(null);
        setPaywallUserEmail(null);
        setMenuView(null); // Clear any open menu view to prevent being stuck
        // Go to welcome screen first, then to auth screen to mimic app start
        setView('welcome');
        setTimeout(() => setView('auth'), 1500);
    };

    return {
        handleLoginSuccess,
        handleAccessExpired,
        handleLogout,
    };
}
