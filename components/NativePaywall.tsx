import React, { useEffect, useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import {
  fetchAvailableProducts,
  purchaseProduct,
  restorePurchases,
  StoreProduct,
} from '../services/purchaseService';
import { User } from '../types';
import Button from './shared/Button';

interface NativePaywallProps {
  onPurchaseSuccess: (user: User) => void;
}

const NativePaywall: React.FC<NativePaywallProps> = ({ onPurchaseSuccess }) => {
  const { t } = useLocalization();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const available = await fetchAvailableProducts();
        setProducts(available);
      } catch {
        setError(t('iap_load_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePurchase = async (product: StoreProduct) => {
    setPurchasingId(product.identifier);
    setError(null);
    setSuccess(null);

    const result = await purchaseProduct(product.identifier);

    if (result.success) {
      setSuccess(t('paywall_payment_success'));
      if ((result as any).user) {
        setTimeout(() => onPurchaseSuccess((result as any).user), 1200);
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

    const result = await restorePurchases();

    if (result.restored > 0) {
      setSuccess(t('iap_restore_success', { count: result.restored }));
      setTimeout(() => window.location.reload(), 1500);
    } else if (result.error) {
      setError(result.error);
    } else {
      setError(t('iap_restore_none'));
    }

    setRestoring(false);
  };

  const subscriptions = products.filter(p => p.iapProduct.type === 'subscription');
  const nonConsumables = products.filter(p => p.iapProduct.type === 'non_consumable');
  const botUnlocks = nonConsumables.filter(p => p.iapProduct.tier === 'bot');
  const accessPasses = nonConsumables.filter(p => p.iapProduct.tier !== 'bot');

  if (loading) {
    return (
      <div className="py-6 animate-pulse text-gray-500 dark:text-gray-400 text-center">
        {t('upgrade_loading')}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
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
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-400 rounded-lg text-emerald-700 dark:text-emerald-300 text-sm font-medium text-center">
          {success}
        </div>
      )}

      {error && !success && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-400 rounded-lg text-red-700 dark:text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('iap_section_subscriptions')}
          </h3>
          {subscriptions.map(product => (
            <ProductCard
              key={product.identifier}
              product={product}
              purchasing={purchasingId === product.identifier}
              onPurchase={() => handlePurchase(product)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* One-time access passes */}
      {accessPasses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('iap_section_lifetime')}
          </h3>
          {accessPasses.map(product => (
            <ProductCard
              key={product.identifier}
              product={product}
              purchasing={purchasingId === product.identifier}
              onPurchase={() => handlePurchase(product)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Bot unlocks */}
      {botUnlocks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('iap_section_coaches')}
          </h3>
          {botUnlocks.map(product => (
            <ProductCard
              key={product.identifier}
              product={product}
              purchasing={purchasingId === product.identifier}
              onPurchase={() => handlePurchase(product)}
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
    </div>
  );
};

interface ProductCardProps {
  product: StoreProduct;
  purchasing: boolean;
  onPurchase: () => void;
  t: (key: string) => string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, purchasing, onPurchase, t }) => {
  const isSubscription = product.iapProduct.type === 'subscription';
  const periodLabel = product.identifier.endsWith('.yearly')
    ? t('iap_period_year')
    : t('iap_period_month');

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
            {product.localizedTitle}
          </p>
          {product.localizedDescription && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
              {product.localizedDescription}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-lg font-bold text-accent-primary">
            {product.priceString}
          </span>
          {isSubscription && (
            <span className="text-xs text-gray-500 dark:text-gray-400 block">
              /{periodLabel}
            </span>
          )}
        </div>
      </div>

      <Button
        onClick={onPurchase}
        disabled={purchasing}
        size="md"
        fullWidth
        className="mt-3"
      >
        {purchasing ? t('paywall_payment_processing') : t('iap_buy_button')}
      </Button>
    </div>
  );
};

export default NativePaywall;
