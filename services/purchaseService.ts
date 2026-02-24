import { isNativeIOS } from '../utils/platformDetection';
import { apiFetch } from './api';

// App Store product definitions — must match App Store Connect configuration
export interface IAPProduct {
  id: string;
  appStoreId: string;
  name: string;
  type: 'subscription' | 'non_consumable';
  tier: 'registered' | 'premium' | 'bot';
}

export const IAP_PRODUCTS: IAPProduct[] = [
  { id: 'mc.registered.monthly',  appStoreId: 'mc.registered.monthly',  name: 'Registered Monthly',  type: 'subscription',    tier: 'registered' },
  { id: 'mc.premium.monthly',     appStoreId: 'mc.premium.monthly',     name: 'Premium Monthly',     type: 'subscription',    tier: 'premium' },
  { id: 'mc.premium.yearly',      appStoreId: 'mc.premium.yearly',      name: 'Premium Yearly',      type: 'subscription',    tier: 'premium' },
  { id: 'mc.registered.lifetime', appStoreId: 'mc.registered.lifetime', name: 'Registered Lifetime', type: 'non_consumable',  tier: 'registered' },
  { id: 'mc.coach.kenji',         appStoreId: 'mc.coach.kenji',         name: 'Kenji Coach',         type: 'non_consumable',  tier: 'bot' },
  { id: 'mc.coach.chloe',         appStoreId: 'mc.coach.chloe',         name: 'Chloe Coach',         type: 'non_consumable',  tier: 'bot' },
];

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
  error?: string;
}

// RevenueCat SDK is loaded dynamically only on native iOS
let Purchases: any = null;
let rcInitialized = false;

async function ensureRevenueCatLoaded(): Promise<boolean> {
  // #region agent log
  console.log('[DEBUG-cd59c1] ensureRC-enter, cached:', !!Purchases);
  // #endregion
  if (!isNativeIOS()) return false;
  if (Purchases) return true;

  try {
    // #region agent log
    console.log('[DEBUG-cd59c1] ensureRC-importing');
    // #endregion
    const module = await import('@revenuecat/purchases-capacitor');
    // #region agent log
    console.log('[DEBUG-cd59c1] ensureRC-imported');
    // #endregion
    Purchases = module.Purchases;
    return true;
  } catch (e) {
    // #region agent log
    console.log('[DEBUG-cd59c1] ensureRC-error', String(e));
    // #endregion
    return false;
  }
}

async function ensureRevenueCatConfigured(): Promise<boolean> {
  if (rcInitialized) return true;

  const loaded = await ensureRevenueCatLoaded();
  if (!loaded) return false;

  try {
    const apiKey = import.meta.env.VITE_REVENUECAT_IOS_KEY;
    // #region agent log
    console.log('[DEBUG-cd59c1] configure, hasKey:', !!apiKey);
    // #endregion
    if (!apiKey) return false;

    await Purchases.configure({ apiKey });
    rcInitialized = true;
    // #region agent log
    console.log('[DEBUG-cd59c1] configure SUCCESS');
    // #endregion
    return true;
  } catch (err) {
    // #region agent log
    console.error('[DEBUG-cd59c1] configure FAILED:', err);
    // #endregion
    return false;
  }
}

export async function initializePurchases(): Promise<boolean> {
  return ensureRevenueCatConfigured();
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

export async function fetchAvailableProducts(): Promise<StoreProduct[]> {
  // #region agent log
  console.log('[DEBUG-cd59c1] F1-enter-fetchProducts');
  // #endregion
  const ready = await ensureRevenueCatConfigured();
  // #region agent log
  console.log('[DEBUG-cd59c1] F2-configured:', ready);
  // #endregion
  if (!ready) return [];

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    // #region agent log
    console.log('[DEBUG-cd59c1] offerings:', JSON.stringify({hasCurrent:!!current, currentId:current?.identifier, pkgCount:current?.availablePackages?.length||0, pkgIds:(current?.availablePackages||[]).map((p:any)=>p.product?.identifier)}));
    // #endregion
    if (!current) return [];

    const products: StoreProduct[] = [];

    for (const pkg of current.availablePackages || []) {
      const storeProduct = pkg.product;
      const iapProduct = IAP_PRODUCTS.find(p => p.appStoreId === storeProduct.identifier);
      // #region agent log
      if (!iapProduct) { console.warn('[DEBUG-cd59c1] NO MATCH:', storeProduct.identifier); }
      // #endregion
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

    // #region agent log
    console.log('[DEBUG-cd59c1] final products:', products.length, products.map(p=>p.identifier));
    // #endregion
    return products;
  } catch (err) {
    // #region agent log
    console.error('[DEBUG-cd59c1] fetchProducts FAILED:', err);
    // #endregion
    return [];
  }
}

export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  const ready = await ensureRevenueCatConfigured();
  if (!ready) return { success: false, error: 'Store not available' };

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return { success: false, error: 'No offerings available' };

    const pkg = (current.availablePackages || []).find(
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
    // #region agent log
    console.log('[DEBUG-cd59c1] restore-entitlements:', activeEntitlements.length, JSON.stringify({
      entitlements: activeEntitlements,
      nonSubTx: (info.customerInfo?.nonSubscriptionTransactions || []).length,
      activeSubs: info.customerInfo?.activeSubscriptions || [],
    }));
    // #endregion

    let backendUser: any = null;

    if (activeEntitlements.length > 0) {
      try {
        const txIds: string[] = [];

        const nonSubTx = info.customerInfo?.nonSubscriptionTransactions || [];
        for (const t of nonSubTx) {
          if (t.transactionIdentifier) txIds.push(t.transactionIdentifier);
        }

        const entitlementValues = Object.values(info.customerInfo?.entitlements?.active || {}) as any[];
        for (const ent of entitlementValues) {
          if (ent.latestPurchaseDateMillis || ent.productIdentifier) {
            const subTxId = ent.originalPurchaseDateMillis
              ? String(ent.originalPurchaseDateMillis)
              : null;
            if (ent.store === 'app_store' || ent.store === 'APP_STORE') {
              // #region agent log
              console.log('[DEBUG-cd59c1] restore-entitlement-detail:', JSON.stringify(ent));
              // #endregion
            }
          }
        }

        // #region agent log
        console.log('[DEBUG-cd59c1] restore-txIds:', txIds.length, txIds);
        // #endregion

        if (txIds.length > 0) {
          const backendResult = await apiFetch('/apple-iap/restore', {
            method: 'POST',
            body: JSON.stringify({ transactionIds: txIds }),
          });
          backendUser = backendResult?.user || null;
          // #region agent log
          console.log('[DEBUG-cd59c1] restore-backend-result:', JSON.stringify({ restored: backendResult?.restored, hasUser: !!backendUser }));
          // #endregion
        }
      } catch (err) {
        // #region agent log
        console.error('[DEBUG-cd59c1] restore-backend-failed:', err);
        // #endregion
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
