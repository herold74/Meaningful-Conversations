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

async function getRevenueCatSDK() {
  if (!isNativeIOS()) return null;
  if (Purchases) return Purchases;

  try {
    const module = await import('@revenuecat/purchases-capacitor');
    Purchases = module.Purchases;
    return Purchases;
  } catch {
    console.warn('RevenueCat SDK not available');
    return null;
  }
}

export async function initializePurchases(): Promise<boolean> {
  if (!isNativeIOS()) return false;

  const RC = await getRevenueCatSDK();
  if (!RC) return false;

  try {
    const apiKey = import.meta.env.VITE_REVENUECAT_IOS_KEY;
    if (!apiKey) {
      console.warn('VITE_REVENUECAT_IOS_KEY not configured');
      return false;
    }

    await RC.configure({ apiKey });
    console.log('RevenueCat initialized');
    return true;
  } catch (err) {
    console.error('RevenueCat init failed:', err);
    return false;
  }
}

export async function fetchAvailableProducts(): Promise<StoreProduct[]> {
  const RC = await getRevenueCatSDK();
  if (!RC) return [];

  try {
    const offerings = await RC.getOfferings();
    const current = offerings.current;
    if (!current) return [];

    const products: StoreProduct[] = [];

    for (const pkg of current.availablePackages || []) {
      const storeProduct = pkg.product;
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

    return products;
  } catch (err) {
    console.error('Failed to fetch products:', err);
    return [];
  }
}

export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  const RC = await getRevenueCatSDK();
  if (!RC) return { success: false, error: 'Store not available' };

  try {
    const offerings = await RC.getOfferings();
    const current = offerings.current;
    if (!current) return { success: false, error: 'No offerings available' };

    const pkg = (current.availablePackages || []).find(
      (p: any) => p.product.identifier === productId
    );
    if (!pkg) return { success: false, error: 'Product not found' };

    const result = await RC.purchasePackage({ aPackage: pkg });
    const transaction = result.customerInfo?.originalAppUserId
      ? result.transaction
      : null;

    const transactionId = transaction?.transactionIdentifier || result.transaction?.transactionIdentifier;

    if (transactionId) {
      // Verify with our backend
      try {
        const verification = await apiFetch('/api/apple-iap/verify-receipt', {
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

export async function restorePurchases(): Promise<{ restored: number; error?: string }> {
  const RC = await getRevenueCatSDK();
  if (!RC) return { restored: 0, error: 'Store not available' };

  try {
    const info = await RC.restorePurchases();
    const activeEntitlements = Object.keys(info.customerInfo?.entitlements?.active || {});

    // Also verify with our backend
    if (activeEntitlements.length > 0) {
      try {
        const allTransactions = info.customerInfo?.nonSubscriptionTransactions || [];
        const txIds = allTransactions.map((t: any) => t.transactionIdentifier).filter(Boolean);

        if (txIds.length > 0) {
          await apiFetch('/api/apple-iap/restore', {
            method: 'POST',
            body: JSON.stringify({ transactionIds: txIds }),
          });
        }
      } catch {
        // Backend sync failed, but RevenueCat still has the purchases
      }
    }

    return { restored: activeEntitlements.length };
  } catch (err: any) {
    console.error('Restore failed:', err);
    return { restored: 0, error: err?.message || 'Restore failed' };
  }
}

export function isIAPAvailable(): boolean {
  return isNativeIOS();
}
