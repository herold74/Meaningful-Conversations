import { isNativeIOS } from '../utils/platformDetection';
import { apiFetch } from './api';

// App Store product definitions — must match App Store Connect configuration
export interface IAPProduct {
  id: string;
  appStoreId: string;
  name: string;
  type: 'subscription' | 'non_consumable';
  tier: 'registered' | 'premium' | 'premium_plus' | 'bot' | 'practice';
}

export const IAP_PRODUCTS: IAPProduct[] = [
  { id: 'mc.registered.monthly',  appStoreId: 'mc.registered.monthly',  name: 'Registered Monthly',  type: 'subscription',    tier: 'registered' },
  { id: 'mc.premium_plus.monthly', appStoreId: 'mc.premium_plus.monthly', name: 'Premium+ Monthly',   type: 'subscription',    tier: 'premium_plus' },
  { id: 'mc.premium.monthly',     appStoreId: 'mc.premium.monthly',     name: 'Premium Monthly',     type: 'subscription',    tier: 'premium' },
  { id: 'mc.premium.yearly',      appStoreId: 'mc.premium.yearly',      name: 'Premium Yearly',      type: 'subscription',    tier: 'premium' },
  // Legacy separate Practice add-on (existing sandbox buyers only)
  { id: 'mc.practice.monthly',    appStoreId: 'mc.practice.monthly',    name: 'Coach Practice Monthly', type: 'subscription', tier: 'practice' },
  { id: 'mc.registered.yearly.v2', appStoreId: 'mc.registered.yearly.v2', name: 'Registered Annual',   type: 'subscription',    tier: 'registered' },
  // Legacy: bestehende Lifetime-Käufer (mc.registered.yearly war als IAP reserviert, daher .v2)
  { id: 'mc.registered.lifetime',  appStoreId: 'mc.registered.lifetime',  name: 'Registered Lifetime', type: 'non_consumable',  tier: 'registered' },
  { id: 'mc.coach.kenji',         appStoreId: 'mc.coach.kenji',         name: 'Kenji Coach',         type: 'non_consumable',  tier: 'bot' },
  { id: 'mc.coach.chloe',         appStoreId: 'mc.coach.chloe',         name: 'Chloe Coach',         type: 'non_consumable',  tier: 'bot' },
];

/** Legacy IAP — restore/verify only; never show in paywall (matches web /api/purchase/products). */
const PAYWALL_EXCLUDED_APP_STORE_IDS = new Set([
  'mc.registered.lifetime',
  'mc.practice.monthly',
]);

/** Display order: Registered → coaches → Premium → Premium+ */
const PAYWALL_PRODUCT_ORDER: Record<string, number> = {
  'mc.registered.monthly': 100,
  'mc.registered.yearly.v2': 110,
  'mc.coach.chloe': 200,
  'mc.coach.kenji': 210,
  'mc.premium.monthly': 300,
  'mc.premium.yearly': 310,
  'mc.premium_plus.monthly': 400,
};

export function sortPaywallProducts(products: StoreProduct[]): StoreProduct[] {
  return [...products].sort(
    (a, b) => (PAYWALL_PRODUCT_ORDER[a.identifier] ?? 999) - (PAYWALL_PRODUCT_ORDER[b.identifier] ?? 999),
  );
}

/** Map RevenueCat / StoreKit English errors to locale keys (caller passes `t`). */
export function localizeIapError(
  raw: string | undefined,
  t: (key: string) => string,
): string {
  if (!raw) return t('paywall_payment_error');
  const lower = raw.toLowerCase();
  if (lower.includes('app store') || lower.includes('storekit') || lower.includes('store problem')) {
    return t('iap_error_app_store');
  }
  if (lower.includes('not available') || lower.includes('unable to purchase') || lower.includes('cannot purchase')) {
    return t('iap_error_product_unavailable');
  }
  if (lower.includes('cancel')) return t('paywall_payment_error');
  // SDK messages are English-only — do not pass through on localized UI
  if (/[a-zA-Z]/.test(raw)) return t('paywall_payment_error');
  return raw;
}

export interface StoreProduct {
  identifier: string;
  localizedTitle: string;
  localizedDescription: string;
  priceString: string;
  price: number;
  currencyCode: string;
  iapProduct: IAPProduct;
}

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  user?: any;
  error?: string;
}

// RevenueCat SDK is loaded dynamically only on native iOS
let Purchases: any = null;

// Use globalThis so config state is shared across module instances (code-splitting can load this twice)
const RC_STATE_KEY = '__mc_revenuecat_config__';
const RC_PROMISE_KEY = '__mc_revenuecat_config_promise__';

function getRCState(): { initialized: boolean } {
  const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});
  if (!(RC_STATE_KEY in g)) (g as any)[RC_STATE_KEY] = { initialized: false };
  return (g as any)[RC_STATE_KEY];
}

function getRCGlobal(): Record<string, unknown> {
  const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});
  return g as Record<string, unknown>;
}

async function ensureRevenueCatLoaded(): Promise<boolean> {
  if (!isNativeIOS()) return false;
  if (Purchases) return true;

  try {
    const module = await import('@revenuecat/purchases-capacitor');
    Purchases = module.Purchases;
    return true;
  } catch {
    return false;
  }
}

async function ensureRevenueCatConfigured(): Promise<boolean> {
  const state = getRCState();
  if (state.initialized) return true;

  const g = getRCGlobal();
  const existing = g[RC_PROMISE_KEY] as Promise<boolean> | undefined;
  if (existing) return existing;

  // Store promise in globalThis BEFORE any await — ensures all chunks share the same promise
  const promise = (async (): Promise<boolean> => {
    try {
      const loaded = await ensureRevenueCatLoaded();
      if (!loaded) return false;
      const apiKey = import.meta.env.VITE_REVENUECAT_IOS_KEY;
      if (!apiKey) return false;
      await Purchases.setLogLevel({ level: 'DEBUG' });
      await Purchases.configure({ apiKey });
      state.initialized = true;
      return true;
    } catch {
      return false;
    }
  })();

  g[RC_PROMISE_KEY] = promise;
  return promise;
}

export async function initializePurchases(): Promise<boolean> {
  return ensureRevenueCatConfigured();
}

/** Link RevenueCat identity to our backend user. Call after login so purchases sync correctly. */
export async function logInRevenueCat(appUserId: string): Promise<void> {
  const ready = await ensureRevenueCatConfigured();
  if (!ready) return;
  try {
    await Purchases.logIn({ appUserID: appUserId });
  } catch (err) {
    console.warn('[Purchase] RevenueCat logIn failed:', err);
  }
}


export async function getActiveProductIds(): Promise<Set<string>> {
  const ready = await ensureRevenueCatConfigured();
  if (!ready) return new Set();

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const active = new Set<string>(customerInfo?.activeSubscriptions || []);
    const purchased = customerInfo?.allPurchasedProductIdentifiers || [];
    for (const id of purchased) {
      const iap = IAP_PRODUCTS.find(p => p.appStoreId === id);
      if (iap?.type === 'non_consumable') active.add(id);
    }
    return active;
  } catch {
    return new Set();
  }
}

/** When server access is expired (IAP demo reset), ignore sandbox subscription "Current" badges. */
export function userHasValidServerAccess(user?: { isAdmin?: boolean; isDeveloper?: boolean; isPremium?: boolean; isClient?: boolean; accessExpiresAt?: string | null } | null): boolean {
  if (!user) return false;
  if (user.isAdmin || user.isDeveloper || user.isPremium || user.isClient) return true;
  if (user.accessExpiresAt == null) return true;
  return new Date(user.accessExpiresAt) > new Date();
}

export function filterActiveProductIdsForServerAccess(
  activeIds: Set<string>,
  user?: { isAdmin?: boolean; isDeveloper?: boolean; isPremium?: boolean; isClient?: boolean; accessExpiresAt?: string | null; unlockedCoaches?: string[] } | null,
): Set<string> {
  if (userHasValidServerAccess(user)) return activeIds;
  const filtered = new Set<string>();
  for (const id of activeIds) {
    const iap = IAP_PRODUCTS.find(p => p.appStoreId === id);
    if (iap?.type === 'non_consumable') filtered.add(id);
  }
  return filtered;
}

/** Returns access info from local RevenueCat cache. Use when backend sync fails (e.g. merge not complete). */
export async function getAccessFromRevenueCat(): Promise<{
  hasAccess: boolean;
  accessExpiresAt: string | null;
  isPremium?: boolean;
} | null> {
  const ready = await ensureRevenueCatConfigured();
  if (!ready) return null;

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const active = customerInfo?.entitlements?.active || {};
    const activeIds = Object.keys(active);
    const hasRegistered = activeIds.includes('registered');
    const hasPremium = activeIds.includes('premium');
    const activeSubs = customerInfo?.activeSubscriptions || [];
    const hasAccessProduct = activeSubs.some(
      (id: string) => id.startsWith('mc.registered.') || id.startsWith('mc.premium.')
    );
    if (!hasRegistered && !hasPremium && !hasAccessProduct) return { hasAccess: false, accessExpiresAt: null };

    let expiresAt: string | null = null;
    for (const id of activeIds) {
      const ent = active[id];
      const exp = ent?.expirationDate ?? ent?.expirationDateMillis;
      if (exp) {
        const expStr = typeof exp === 'string' ? exp : (typeof exp === 'number' ? new Date(exp).toISOString() : (exp as Date)?.toISOString?.());
        if (expStr && (!expiresAt || expStr > expiresAt)) expiresAt = expStr;
      }
    }
    const byProduct = customerInfo?.allExpirationDatesByProduct || {};
    for (const exp of Object.values(byProduct)) {
      if (exp) {
        const expStr = typeof exp === 'string' ? exp : (typeof exp === 'number' ? new Date(exp).toISOString() : (exp as Date)?.toISOString?.());
        if (expStr && (!expiresAt || expStr > expiresAt)) expiresAt = expStr;
      }
    }
    return { hasAccess: true, accessExpiresAt: expiresAt, isPremium: hasPremium };
  } catch {
    return null;
  }
}

function resolveActiveOffering(offerings: any): any | null {
  if (!offerings) return null;
  return (
    offerings.current ??
    Object.values(offerings.all || {}).find((o: any) => (o?.availablePackages?.length ?? 0) > 0) ??
    null
  );
}

export async function fetchAvailableProducts(): Promise<StoreProduct[]> {
  const { products } = await fetchAvailableProductsWithDiagnostics();
  return products;
}

export async function fetchAvailableProductsWithDiagnostics(): Promise<{
  products: StoreProduct[];
  configured: boolean;
  offeringId?: string | null;
  packageCount?: number;
  error?: string;
}> {
  const ready = await ensureRevenueCatConfigured();
  if (!ready) {
    return {
      products: [],
      configured: false,
      error: 'RevenueCat not configured (missing API key in build)',
    };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const offering = resolveActiveOffering(offerings);

    if (!offering) {
      const allKeys = Object.keys(offerings.all || {});
      return {
        products: [],
        configured: true,
        offeringId: null,
        packageCount: 0,
        error: allKeys.length
          ? `No current RevenueCat offering (found: ${allKeys.join(', ')})`
          : 'No RevenueCat offerings returned',
      };
    }

    const packages = offering.availablePackages || [];
    const products: StoreProduct[] = [];

    for (const pkg of packages) {
      const storeProduct = pkg.product;
      if (!storeProduct?.identifier) continue;
      if (PAYWALL_EXCLUDED_APP_STORE_IDS.has(storeProduct.identifier)) continue;
      const iapProduct = IAP_PRODUCTS.find(p => p.appStoreId === storeProduct.identifier);
      if (!iapProduct) continue;

      products.push({
        identifier: storeProduct.identifier,
        localizedTitle: storeProduct.title || iapProduct.name,
        localizedDescription: storeProduct.description || '',
        priceString: storeProduct.priceString || `€${storeProduct.price}`,
        price: storeProduct.price,
        currencyCode: storeProduct.currencyCode || 'EUR',
        iapProduct,
      });
    }

    return {
      products: sortPaywallProducts(products),
      configured: true,
      offeringId: offering.identifier ?? null,
      packageCount: packages.length,
      error:
        packages.length > 0 && products.length === 0
          ? 'RevenueCat packages exist but StoreKit returned no loadable products'
          : packages.length === 0
            ? 'RevenueCat offering has zero packages (App Store Connect / ASC product status?)'
            : undefined,
    };
  } catch (err: any) {
    return {
      products: [],
      configured: true,
      error: err?.message || 'getOfferings failed',
    };
  }
}

export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  const ready = await ensureRevenueCatConfigured();
  if (!ready) return { success: false, error: 'Store not available' };
  if (PAYWALL_EXCLUDED_APP_STORE_IDS.has(productId)) {
    return { success: false, error: 'Product not available' };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const offering = resolveActiveOffering(offerings);
    if (!offering) return { success: false, error: 'No offerings available' };

    const pkg = (offering.availablePackages || []).find(
      (p: any) => p.product.identifier === productId
    );
    if (!pkg) return { success: false, error: 'Product not found' };

    const result = await Purchases.purchasePackage({ aPackage: pkg });
    const transaction = result.customerInfo?.originalAppUserId
      ? result.transaction
      : null;

    const transactionId = transaction?.transactionIdentifier || result.transaction?.transactionIdentifier;

    if (transactionId) {
      try {
        const verification = await apiFetch('/apple-iap/verify-receipt', {
          method: 'POST',
          body: JSON.stringify({ transactionId, productId }),
        });
        return {
          success: true,
          transactionId,
          ...verification,
        };
      } catch (verifyErr) {
        console.error('Backend verification failed:', verifyErr);
        // Retry via restore — new purchase is in RevenueCat; backend may succeed after transient failure
        try {
          const restoreResult = await restorePurchases();
          if (restoreResult.user) {
            return { success: true, transactionId, user: restoreResult.user };
          }
        } catch {
          // Ignore restore failure; fall back to patched user in NativePaywall
        }
        return { success: true, transactionId };
      }
    }

    return { success: true };
  } catch (err: any) {
    if (err?.userCancelled) {
      return { success: false, error: 'cancelled' };
    }
    console.error('Purchase failed:', err);
    return { success: false, error: err?.message || 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<{ restored: number; error?: string; user?: any }> {
  const ready = await ensureRevenueCatConfigured();
  if (!ready) return { restored: 0, error: 'Store not available' };

  try {
    const info = await Purchases.restorePurchases();
    const activeEntitlements = Object.keys(info.customerInfo?.entitlements?.active || {});

    let backendUser: any = null;

    if (activeEntitlements.length > 0) {
      try {
        const txIds: string[] = [];

        const nonSubTx = info.customerInfo?.nonSubscriptionTransactions || [];
        for (const t of nonSubTx) {
          if (t.transactionIdentifier) txIds.push(t.transactionIdentifier);
        }

        if (txIds.length > 0) {
          const backendResult = await apiFetch('/apple-iap/restore', {
            method: 'POST',
            body: JSON.stringify({ transactionIds: txIds }),
          });
          backendUser = backendResult?.user || null;
        }
      } catch {
        // Ignore
      }
    }

    return { restored: activeEntitlements.length, user: backendUser };
  } catch (err: any) {
    console.error('Restore failed:', err);
    return { restored: 0, error: err?.message || 'Restore failed' };
  }
}

export function isIAPAvailable(): boolean {
  return isNativeIOS();
}
