import * as api from '../services/api';
import * as userService from '../services/userService';
import { deserializeGamificationState } from '../utils/gamificationSerializer';
import { logInRevenueCat, isIAPAvailable, getAccessFromRevenueCat } from '../services/purchaseService';
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
            logInRevenueCat(user.id);
        }
        try {
            const data = await userService.loadUserData(key);
            setLifeContext(data.context || '');
            setGamificationState(deserializeGamificationState(data.gamificationState));

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

        // Fallback: RevenueCat may have data locally (under anonymous ID) before merge completes.
        if (isIAPAvailable()) {
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
