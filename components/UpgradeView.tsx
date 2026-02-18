import React, { useEffect, useRef, useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { usePayPal } from '../hooks/usePayPal';
import { isNativeApp } from '../utils/platformDetection';
import { KeyIcon } from './icons/KeyIcon';
import Button from './shared/Button';
import { User } from '../types';

interface Product {
  id: string;
  name: string;
  price: number;
  finalPrice: number;
  discountReasons: string[];
  category: 'access' | 'premium' | 'bot';
  duration: string | null;
  description: string;
}

interface ProductsResponse {
  currentTier: string;
  isLifetime: boolean;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  ownedBots: string[];
  products: Product[];
}

interface UpgradeViewProps {
  currentUser: User;
  onPurchaseSuccess: (user: User) => void;
  onRedeem: () => void;
}

const TIER_LABELS: Record<string, { de: string; en: string }> = {
  registered: { de: 'Registriert', en: 'Registered' },
  premium: { de: 'Premium', en: 'Premium' },
  client: { de: 'Klient', en: 'Client' },
  admin: { de: 'Administrator', en: 'Administrator' },
};

const UpgradeView: React.FC<UpgradeViewProps> = ({ currentUser, onPurchaseSuccess, onRedeem }) => {
  const { t, language } = useLocalization();
  const { ready: paypalReady, error: paypalError, createOrder, captureOrder, fetchProducts } = usePayPal();
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const paypalButtonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const renderedButtonsRef = useRef<Set<string>>(new Set());

  const showPayPal = !isNativeApp();

  useEffect(() => {
    renderedButtonsRef.current = new Set();
    (async () => {
      try {
        const result = await fetchProducts();
        setData(result);
      } catch {
        setError(t('upgrade_load_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!showPayPal || !paypalReady || !data || !window.paypal?.Buttons) return;

    for (const product of data.products) {
      const container = paypalButtonRefs.current[product.id];
      if (!container || renderedButtonsRef.current.has(product.id)) continue;

      renderedButtonsRef.current.add(product.id);

      window.paypal.Buttons({
        style: { layout: 'horizontal', color: 'gold', shape: 'rect', label: 'paypal', height: 40, tagline: false },
        createOrder: async () => {
          setPurchasingId(product.id);
          setSuccessMessage(null);
          try {
            return await createOrder(product.id);
          } catch (err) {
            setPurchasingId(null);
            throw err;
          }
        },
        onApprove: async (approveData: { orderID: string }) => {
          try {
            const result = await captureOrder(approveData.orderID);
            if (result.success && result.user) {
              setSuccessMessage(t('upgrade_purchase_success'));
              setTimeout(() => onPurchaseSuccess(result.user), 1500);
            } else {
              setPurchasingId(null);
              setError(result.error || t('upgrade_purchase_error'));
            }
          } catch {
            setPurchasingId(null);
            setError(t('upgrade_purchase_error'));
          }
        },
        onCancel: () => { setPurchasingId(null); },
        onError: () => { setPurchasingId(null); },
      }).render(container);
    }
  }, [paypalReady, data, showPayPal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">{t('upgrade_loading')}</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const tierLabel = TIER_LABELS[data.currentTier]?.[language] || data.currentTier;
  const premiumProducts = data.products.filter(p => p.category === 'premium');
  const botProducts = data.products.filter(p => p.category === 'bot');
  const accessProducts = data.products.filter(p => p.category === 'access');
  const hasProducts = data.products.length > 0;

  const renderProductCard = (product: Product) => {
    const hasDiscount = product.finalPrice < product.price;
    const isPurchasing = purchasingId === product.id;

    return (
      <div key={product.id} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-1">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">{product.name}</h3>
            {product.duration && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {product.duration === '1M' ? t('upgrade_duration_1m') : product.duration === '3M' ? t('upgrade_duration_3m') : t('upgrade_duration_1y')}
              </span>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-gray-400 line-through mr-1">€{product.price.toFixed(2).replace('.', ',')}</span>
            )}
            <span className={`text-lg sm:text-xl font-bold ${hasDiscount ? 'text-emerald-600 dark:text-emerald-400' : 'text-accent-primary'}`}>
              €{product.finalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {hasDiscount && product.discountReasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.discountReasons.includes('loyalty') && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                {t('upgrade_loyalty_badge')}
              </span>
            )}
            {product.discountReasons.includes('bot_credit') && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                {t('upgrade_bot_credit_badge')}
              </span>
            )}
          </div>
        )}

        {isPurchasing && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded text-blue-700 dark:text-blue-300 text-sm animate-pulse">
            {t('upgrade_payment_processing')}
          </div>
        )}

        {showPayPal && (
          <div
            ref={el => { paypalButtonRefs.current[product.id] = el; }}
            className="min-h-[40px]"
            style={{ display: isPurchasing ? 'none' : 'block' }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fadeIn">
      {/* Current Tier */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-200">{t('upgrade_title')}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('upgrade_current_tier')}: <span className="font-semibold text-accent-primary">{tierLabel}</span>
          {data.isLifetime && <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400">(Lifetime)</span>}
          {data.isPremium && data.premiumExpiresAt && (
            <span className="ml-1 text-xs text-gray-500">
              ({t('upgrade_expires')} {new Date(data.premiumExpiresAt).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')})
            </span>
          )}
        </p>
      </div>

      {successMessage && (
        <div className="p-4 mb-6 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 rounded-lg text-emerald-700 dark:text-emerald-300 font-medium text-center">
          ✅ {successMessage}
        </div>
      )}

      {(error || paypalError) && !successMessage && (
        <div className="p-3 mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-400 rounded-lg text-red-700 dark:text-red-300 text-sm text-center">
          {error || paypalError}
        </div>
      )}

      {!hasProducts && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">{t('upgrade_all_unlocked')}</p>
        </div>
      )}

      {/* Registered Lifetime (for expired users who somehow reach this page) */}
      {accessProducts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('upgrade_access_section')}</h2>
          <div className="space-y-4">{accessProducts.map(renderProductCard)}</div>
        </section>
      )}

      {/* Premium Passes */}
      {premiumProducts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('upgrade_premium_section')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('upgrade_premium_description')}</p>
          <div className="space-y-4">{premiumProducts.map(renderProductCard)}</div>
        </section>
      )}

      {/* Bot Unlocks */}
      {botProducts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('upgrade_bot_section')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('upgrade_bot_description')}</p>
          <div className="space-y-4">{botProducts.map(renderProductCard)}</div>
        </section>
      )}

      {/* iOS hint */}
      {isNativeApp() && (
        <div className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 rounded-lg text-blue-700 dark:text-blue-300 text-sm">
          💡 {t('paywall_ios_hint')}
        </div>
      )}

      {/* Divider + Redeem Code */}
      <div className="flex items-center gap-3 text-gray-400 dark:text-gray-600 my-6">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-sm">{t('paywall_or_divider')}</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <Button
        onClick={onRedeem}
        size="lg"
        fullWidth
        leftIcon={<KeyIcon className="w-5 h-5" />}
        className="bg-[#FECC78] text-black hover:brightness-95"
      >
        {t('paywall_redeem_button')}
      </Button>
    </div>
  );
};

export default UpgradeView;
