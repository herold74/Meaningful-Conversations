import React, { useEffect, useState, useRef } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import {
  fetchAvailableProducts,
  getActiveProductIds,
  purchaseProduct,
  restorePurchases,
  logInRevenueCat,
  sortPaywallProducts,
  StoreProduct,
} from '../services/purchaseService';
import { User } from '../types';
import Button from './shared/Button';
import * as api from '../services/api';
import { brand } from '../config/brand';

interface NativePaywallProps {
  onPurchaseSuccess: (user: User) => void;
  currentUser?: User | null;
  showBotUnlocks?: boolean;
  skipAutoRestore?: boolean;
}

const NativePaywall: React.FC<NativePaywallProps> = ({ onPurchaseSuccess, currentUser, showBotUnlocks = false, skipAutoRestore = false }) => {
  const { t } = useLocalization();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [activeProductIds, setActiveProductIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [successUser, setSuccessUser] = useState<User | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const syncAttemptedRef = useRef(false);

  // When we have currentUser: logIn FIRST (so RevenueCat uses our ID), then sync, then fetch products.
  // This ensures we never fetch products with anonymous ID — logIn must run before getOfferings/getCustomerInfo.
  useEffect(() => {
    (async () => {
      try {
        if (currentUser?.id && !syncAttemptedRef.current) {
          syncAttemptedRef.current = true;
          await logInRevenueCat(currentUser.id);
          await new Promise(r => setTimeout(r, 500));
          if (!skipAutoRestore) {
          const trySync = async (): Promise<'restored' | 'fatal' | false> => {
            try {
              const res = await api.apiFetch('/apple-iap/sync-from-revenuecat', { method: 'POST', body: JSON.stringify({}) });
              const syncedUser = res?.user;
              if (syncedUser) {
                const hasAccess = syncedUser.isAdmin || syncedUser.isDeveloper || syncedUser.isPremium || syncedUser.isClient
                  || (syncedUser.accessExpiresAt == null)
                  || (syncedUser.accessExpiresAt && new Date(syncedUser.accessExpiresAt) > new Date());
                if (hasAccess) {
                  onPurchaseSuccess(syncedUser);
                  return 'restored';
                }
              }
            } catch (err: any) {
              if (err?.status === 503) return 'fatal';
            }
            return false;
          };
          const s1 = await trySync();
          if (s1 === 'restored') return;
          if (s1 !== 'fatal') {
            await new Promise(r => setTimeout(r, 1000));
            const s2 = await trySync();
            if (s2 === 'restored') return;
            if (s2 !== 'fatal') {
              await new Promise(r => setTimeout(r, 2000));
              const s3 = await trySync();
              if (s3 === 'restored') return;
            }
          }
          }
        }

        const available = await fetchAvailableProducts();
        const activeIds = await getActiveProductIds();
        setProducts(available);
        setActiveProductIds(activeIds);
      } catch {
        setError(t('iap_load_error'));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [currentUser?.id, onPurchaseSuccess]);

  const handlePurchase = async (product: StoreProduct) => {
    setPurchasingId(product.identifier);
    setError(null);
    setSuccess(null);

    const result = await purchaseProduct(product.identifier);

    if (result.success) {
      setSuccess(t('paywall_payment_success'));
      setActiveProductIds(await getActiveProductIds());
      let userToUse: User | null = (result as any).user || null;
      if (!userToUse && currentUser) {
        const patched = { ...currentUser };
        const iap = products.find(p => p.identifier === product.identifier)?.iapProduct;
        const days = product.identifier.includes('yearly') || product.identifier.includes('yearly.v2') ? 365 : product.identifier.includes('lifetime') ? null : 30;
        const expiresAt = days != null ? new Date(Date.now() + days * 86400000).toISOString() : null;
        if (iap?.tier === 'premium' || iap?.tier === 'premium_plus') {
          patched.isPremium = true;
          const newPremiumExp = expiresAt ?? new Date(Date.now() + 365 * 86400000).toISOString();
          const existingPremium = patched.premiumExpiresAt ? new Date(patched.premiumExpiresAt) : null;
          const newPremiumDate = new Date(newPremiumExp);
          patched.premiumExpiresAt =
            !existingPremium || newPremiumDate > existingPremium
              ? newPremiumExp
              : patched.premiumExpiresAt;
          const currentAccess = patched.accessExpiresAt ? new Date(patched.accessExpiresAt) : null;
          const newExpiry = new Date(patched.premiumExpiresAt ?? newPremiumExp);
          if (!currentAccess || currentAccess < newExpiry) {
            patched.accessExpiresAt = patched.premiumExpiresAt ?? newPremiumExp;
          }
          if (iap?.tier === 'premium_plus') {
            patched.hasPracticeAccess = true;
            const existingPractice = patched.practiceExpiresAt ? new Date(patched.practiceExpiresAt) : null;
            patched.practiceExpiresAt =
              !existingPractice || newPremiumDate > existingPractice
                ? newPremiumExp
                : patched.practiceExpiresAt;
          }
        } else if (iap?.tier === 'registered') {
          patched.accessExpiresAt = expiresAt ?? undefined;
        } else if (iap?.tier === 'practice') {
          patched.hasPracticeAccess = true;
          patched.practiceExpiresAt = expiresAt ?? new Date(Date.now() + 30 * 86400000).toISOString();
        } else if (iap?.tier === 'bot') {
          const productToBotId: Record<string, string> = { 'mc.coach.kenji': 'kenji-resilience', 'mc.coach.chloe': 'chloe-structured-reflection' };
          const botId = productToBotId[product.identifier];
          if (botId) {
            const unlocked = [...(patched.unlockedCoaches || [])];
            if (!unlocked.includes(botId)) unlocked.push(botId);
            patched.unlockedCoaches = unlocked;
          }
        }
        userToUse = patched;
      }
      if (userToUse) {
        setSuccessUser(userToUse);
        setTimeout(() => { onPurchaseSuccess(userToUse!); setSuccessUser(null); }, 1200);
      } else {
        setTimeout(() => window.location.reload(), 1500);
      }
    } else if (result.error === 'cancelled') {
      // User cancelled — no error message
    } else {
      setError(result.error || t('paywall_payment_error'));
    }

    setPurchasingId(null);
  };

  const handleRestore = async () => {
    setRestoring(true);
    setError(null);
    setSuccess(null);

    // If we have currentUser, logIn + sync first (RevenueCat merge may not have completed on mount)
    if (currentUser?.id) {
      await logInRevenueCat(currentUser.id);
      await new Promise(r => setTimeout(r, 500));
      try {
        const res = await api.apiFetch('/apple-iap/sync-from-revenuecat', { method: 'POST', body: JSON.stringify({}) });
        const syncedUser = res?.user;
        if (syncedUser) {
          const hasAccess = syncedUser.isAdmin || syncedUser.isDeveloper || syncedUser.isPremium || syncedUser.isClient
            || (syncedUser.accessExpiresAt == null)
            || (syncedUser.accessExpiresAt && new Date(syncedUser.accessExpiresAt) > new Date());
          if (hasAccess) {
            onPurchaseSuccess(syncedUser);
            setRestoring(false);
            return;
          }
        }
      } catch {
        // Continue to restore flow
      }
    }

    const result = await restorePurchases();

    if (result.restored > 0) {
      setSuccess(t('iap_restore_success', { count: result.restored }));
      setActiveProductIds(await getActiveProductIds());
      const userToUse = (result as any).user || (currentUser ? (() => {
        const p = { ...currentUser };
        const oneYear = new Date(Date.now() + 365 * 86400000).toISOString();
        p.isPremium = true;
        p.premiumExpiresAt = oneYear;
        const currentAccess = p.accessExpiresAt ? new Date(p.accessExpiresAt) : null;
        if (!currentAccess || currentAccess < new Date(oneYear)) {
          p.accessExpiresAt = oneYear;
        }
        return p;
      })() : null);
      if (userToUse) {
        setSuccessUser(userToUse);
        setTimeout(() => { onPurchaseSuccess(userToUse); setSuccessUser(null); }, 1200);
      } else {
        setTimeout(() => window.location.reload(), 1500);
      }
    } else if (result.error) {
      setError(result.error);
    } else {
      setError(t('iap_restore_none'));
    }

    setRestoring(false);
  };

  const registeredProducts = sortPaywallProducts(
    products.filter(p => p.iapProduct.tier === 'registered'),
  );
  const botUnlocks = sortPaywallProducts(
    showBotUnlocks ? products.filter(p => p.iapProduct.tier === 'bot') : [],
  );
  const premiumProducts = sortPaywallProducts(
    products.filter(p => p.iapProduct.tier === 'premium'),
  );
  const premiumPlusProducts = sortPaywallProducts(
    products.filter(p => p.iapProduct.tier === 'premium_plus'),
  );
  const hasPremiumPlusOffer = premiumPlusProducts.some(p => p.identifier === 'mc.premium_plus.monthly');
  const showPremiumPlusAppleNote =
    !!currentUser?.isPremium &&
    !currentUser?.hasPracticeAccess &&
    hasPremiumPlusOffer;

  if (isLoading) {
    return (
      <div className="py-6 animate-pulse text-content-subtle text-center">
        {t('upgrade_loading')}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-content-subtle text-center">
          {t('iap_not_available')}
        </p>
        <button
          onClick={handleRestore}
          disabled={restoring}
          className="w-full text-sm text-accent-primary hover:underline py-2 disabled:opacity-50"
        >
          {restoring ? t('iap_restoring') : t('iap_restore_button')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {success && (
        <div className="p-3 bg-status-success-background border border-status-success-border rounded-lg text-status-success-foreground text-sm font-medium text-center space-y-2">
          <p>{success}</p>
          {successUser && (
            <Button onClick={() => { onPurchaseSuccess(successUser); setSuccessUser(null); }} size="md" fullWidth>
              {t('paywall_continue_button')}
            </Button>
          )}
        </div>
      )}

      {error && !success && (
        <div className="p-3 bg-status-danger-background border border-status-danger-border rounded-lg text-status-danger-foreground text-sm text-center">
          {error}
        </div>
      )}

      {/* Registered */}
      {registeredProducts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-content-subtle tracking-wide">
            {t('upgrade_access_section')}
          </h3>
          {registeredProducts.map(product => (
            <ProductCard
              key={product.identifier}
              product={product}
              purchasing={purchasingId === product.identifier}
              isActive={activeProductIds.has(product.identifier)}
              onPurchase={() => handlePurchase(product)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Coach unlocks */}
      {botUnlocks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-content-subtle tracking-wide">
            {t('iap_section_coaches')}
          </h3>
          {botUnlocks.map(product => (
            <ProductCard
              key={product.identifier}
              product={product}
              purchasing={purchasingId === product.identifier}
              isActive={activeProductIds.has(product.identifier)}
              onPurchase={() => handlePurchase(product)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Premium (without Coach Practice) */}
      {premiumProducts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-content-subtle tracking-wide">
            {t('upgrade_premium_section')}
          </h3>
          <p className="text-xs text-content-subtle px-1">
            {t('upgrade_premium_without_practice_description')}
          </p>
          {premiumProducts.map(product => (
            <ProductCard
              key={product.identifier}
              product={product}
              purchasing={purchasingId === product.identifier}
              isActive={activeProductIds.has(product.identifier)}
              onPurchase={() => handlePurchase(product)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Premium+ */}
      {premiumPlusProducts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-content-subtle tracking-wide">
            {t('upgrade_premium_plus_section')}
          </h3>
          <p className="text-xs text-content-subtle px-1">
            {showPremiumPlusAppleNote
              ? t('upgrade_premium_plus_upgrade_hint')
              : t('upgrade_premium_plus_description')}
          </p>
          {premiumPlusProducts.map(product => (
            <ProductCard
              key={product.identifier}
              product={product}
              purchasing={purchasingId === product.identifier}
              isActive={activeProductIds.has(product.identifier)}
              onPurchase={() => handlePurchase(product)}
              showAppleUpgradeNote={
                showPremiumPlusAppleNote && product.identifier === 'mc.premium_plus.monthly'
              }
              t={t}
            />
          ))}
        </div>
      )}

      {/* Restore Purchases — Apple mandatory */}
      <button
        onClick={handleRestore}
        disabled={restoring}
        className="w-full text-sm text-accent-primary hover:underline py-2 disabled:opacity-50"
      >
        {restoring ? t('iap_restoring') : t('iap_restore_button')}
      </button>

      {/* Legal links — Apple mandatory for auto-renewable subscriptions */}
      <div className="flex justify-center gap-4 text-xs text-content-subtle pt-2 pb-1">
        <a href={`https://${brand.domainProduction}/privacy`} target="_blank" rel="noopener noreferrer" className="underline">{t('paywall_privacy_link')}</a>
        <span>·</span>
        <a href={`https://${brand.domainProduction}/terms`} target="_blank" rel="noopener noreferrer" className="underline">{t('paywall_terms_link')}</a>
      </div>
    </div>
  );
};

interface ProductCardProps {
  product: StoreProduct;
  purchasing: boolean;
  isActive?: boolean;
  showAppleUpgradeNote?: boolean;
  onPurchase: () => void;
  t: (key: string) => string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  purchasing,
  isActive,
  showAppleUpgradeNote,
  onPurchase,
  t,
}) => {
  const isSubscription = product.iapProduct.type === 'subscription';
  const periodLabel = product.identifier.includes('yearly')
    ? t('iap_period_year')
    : t('iap_period_month');

  return (
    <div className={`rounded-lg p-4 border ${isActive ? 'bg-status-success-background/50 border-status-success-border' : 'bg-background-tertiary border-border-primary'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-content-primary text-sm sm:text-base">
              {product.localizedTitle}
            </p>
            {isActive && (
              <span className="text-xs font-medium text-status-success-foreground bg-status-success-background px-2 py-0.5 rounded">
                {t('iap_current')}
              </span>
            )}
          </div>
          {product.localizedDescription && (
            <p className="text-xs text-content-subtle mt-0.5">
              {product.localizedDescription}
            </p>
          )}
          {showAppleUpgradeNote && (
            <p className="text-xs text-status-warning-foreground mt-1.5 leading-relaxed">
              {t('iap_premium_plus_apple_upgrade_note')}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-lg font-bold text-accent-primary">
            {product.priceString}
          </span>
          {isSubscription && (
            <span className="text-xs text-content-subtle block">
              /{periodLabel}
            </span>
          )}
        </div>
      </div>

      <Button
        onClick={onPurchase}
        disabled={purchasing || isActive}
        size="md"
        fullWidth
        className="mt-3"
      >
        {isActive ? t('iap_current') : purchasing ? t('paywall_payment_processing') : t('iap_buy_button')}
      </Button>
    </div>
  );
};

export default NativePaywall;
