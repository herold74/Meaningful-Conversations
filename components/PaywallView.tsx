import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { LockIcon } from './icons/LockIcon';
import { KeyIcon } from './icons/KeyIcon';
import Button from './shared/Button';
import { usePayPal } from '../hooks/usePayPal';
import { isNativeApp, isNativeIOS } from '../utils/platformDetection';
import { User } from '../types';
import NativePaywall from './NativePaywall';

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

interface PaywallViewProps {
  userEmail: string | null;
  userXp?: number;
  onRedeem: () => void;
  onPurchaseSuccess: (user: User) => void;
  onLogout: () => void;
  onDownloadData?: () => void;
}

const PaywallView: React.FC<PaywallViewProps> = ({ userEmail, userXp = 0, onRedeem, onPurchaseSuccess, onLogout, onDownloadData }) => {
  const { t } = useLocalization();
  const { ready: paypalReady, error: paypalError, createOrder, captureOrder, fetchProducts } = usePayPal();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPremiumId, setSelectedPremiumId] = useState<string | null>(null);
  const paypalButtonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const renderedButtonsRef = useRef<Set<string>>(new Set());

  const showPayPal = !isNativeApp();

  useEffect(() => {
    renderedButtonsRef.current = new Set();
    (async () => {
      try {
        const result = await fetchProducts();
        const prods = result.products || [];
        setProducts(prods);
        const premiums = prods.filter((p: Product) => p.category === 'premium');
        if (premiums.length > 0) setSelectedPremiumId(premiums[0].id);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderPayPalButton = useCallback((productId: string, container: HTMLDivElement) => {
    if (!window.paypal?.Buttons) return;
    window.paypal.Buttons({
      style: { layout: 'horizontal', color: 'gold', shape: 'rect', label: 'paypal', height: 40, tagline: false },
      createOrder: async () => {
        setPurchasingId(productId);
        setSuccessMessage(null);
        setErrorMessage(null);
        try {
          return await createOrder(productId);
        } catch (err) {
          setPurchasingId(null);
          setErrorMessage(t('paywall_payment_error'));
          throw err;
        }
      },
      onApprove: async (data: { orderID: string }) => {
        try {
          const result = await captureOrder(data.orderID);
          if (result.success && result.user) {
            setSuccessMessage(t('paywall_payment_success'));
            setTimeout(() => onPurchaseSuccess(result.user), 1200);
          } else {
            setPurchasingId(null);
            setErrorMessage(result.error || t('paywall_payment_error'));
          }
        } catch {
          setPurchasingId(null);
          setErrorMessage(t('paywall_payment_error'));
        }
      },
      onCancel: () => { setPurchasingId(null); },
      onError: () => { setPurchasingId(null); setErrorMessage(t('paywall_payment_error')); },
    }).render(container);
  }, [createOrder, captureOrder, onPurchaseSuccess, t]);

  useEffect(() => {
    if (!showPayPal || !paypalReady || !products.length) return;

    const nonPremium = products.filter(p => p.category !== 'premium');
    for (const product of nonPremium) {
      const container = paypalButtonRefs.current[product.id];
      if (!container || renderedButtonsRef.current.has(product.id)) continue;
      renderedButtonsRef.current.add(product.id);
      renderPayPalButton(product.id, container);
    }
  }, [paypalReady, products, showPayPal, renderPayPalButton]);

  useEffect(() => {
    if (!showPayPal || !paypalReady || !selectedPremiumId) return;

    const key = `premium_${selectedPremiumId}`;
    const container = paypalButtonRefs.current[key];
    if (!container || renderedButtonsRef.current.has(key)) return;

    container.innerHTML = '';
    renderedButtonsRef.current.add(key);
    renderPayPalButton(selectedPremiumId, container);
  }, [paypalReady, selectedPremiumId, showPayPal, renderPayPalButton]);

  const handlePremiumChange = (newId: string) => {
    if (newId === selectedPremiumId) return;
    const oldKey = `premium_${selectedPremiumId}`;
    renderedButtonsRef.current.delete(oldKey);
    const oldContainer = paypalButtonRefs.current[oldKey];
    if (oldContainer) oldContainer.innerHTML = '';
    setSelectedPremiumId(newId);
  };

  const description = userEmail
    ? (userXp >= 100
      ? t('paywall_description_engaged', { email: userEmail })
      : t('paywall_description_expired', { email: userEmail }))
    : t('paywall_description_new');

  const accessProducts = products.filter(p => p.category === 'access');
  const premiumProducts = products.filter(p => p.category === 'premium');
  const selectedPremium = premiumProducts.find(p => p.id === selectedPremiumId) || null;

  const durationLabel = (d: string | null) => {
    if (d === '1M') return t('upgrade_duration_1m');
    if (d === '3M') return t('upgrade_duration_3m');
    if (d === '1Y') return t('upgrade_duration_1y');
    return '';
  };

  const renderProductCard = (product: Product) => {
    const hasDiscount = product.finalPrice < product.price;
    const isPurchasing = purchasingId === product.id;

    return (
      <div key={product.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">{product.name}</p>
            {product.duration && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{durationLabel(product.duration)}</span>
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
            {t('paywall_payment_processing')}
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
    <div className="flex flex-col items-center justify-center min-h-screen text-center animate-fadeIn px-4 py-8">
      <div className="w-full max-w-md md:max-w-3xl p-6 md:p-8 bg-white dark:bg-transparent border-2 border-yellow-400 dark:border-yellow-500 rounded-lg">

        {/* Header */}
        <div className="flex flex-col items-center mb-4 md:mb-6">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mb-3">
            <LockIcon className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 dark:text-yellow-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('paywall_title')}</h1>
        </div>

        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-5 md:mb-6" dangerouslySetInnerHTML={{ __html: description }} />

        {successMessage && (
          <div className="p-4 mb-6 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 rounded-lg text-emerald-700 dark:text-emerald-300 font-medium">
            ✅ {successMessage}
          </div>
        )}

        {(errorMessage || paypalError) && !successMessage && (
          <div className="p-3 mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-400 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {errorMessage || paypalError}
          </div>
        )}

        {/* Product catalog */}
        {!loading && products.length > 0 && (
          <div className="md:flex md:gap-6 md:items-start space-y-4 md:space-y-0 text-left mb-6">

            {/* Access products (Registered Monthly + Lifetime) */}
            {accessProducts.length > 0 && (
              <div className="md:flex-1 space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t('paywall_section_basic')}
                </h2>
                {accessProducts.map(renderProductCard)}
              </div>
            )}

            {/* Premium products — dropdown selector */}
            {premiumProducts.length > 0 && (
              <div className="md:flex-1 space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t('paywall_section_premium')}
                </h2>
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                  <select
                    value={selectedPremiumId || ''}
                    onChange={e => handlePremiumChange(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  >
                    {premiumProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — €{p.finalPrice.toFixed(2).replace('.', ',')}
                        {p.finalPrice < p.price ? ` (${t('upgrade_loyalty_badge')})` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedPremium && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{durationLabel(selectedPremium.duration)}</span>
                        <div className="text-right flex-shrink-0">
                          {selectedPremium.finalPrice < selectedPremium.price && (
                            <span className="text-xs sm:text-sm text-gray-400 line-through mr-1">€{selectedPremium.price.toFixed(2).replace('.', ',')}</span>
                          )}
                          <span className={`text-lg sm:text-xl font-bold ${selectedPremium.finalPrice < selectedPremium.price ? 'text-emerald-600 dark:text-emerald-400' : 'text-accent-primary'}`}>
                            €{selectedPremium.finalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      {selectedPremium.discountReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedPremium.discountReasons.includes('loyalty') && (
                            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                              {t('upgrade_loyalty_badge')}
                            </span>
                          )}
                          {selectedPremium.discountReasons.includes('bot_credit') && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                              {t('upgrade_bot_credit_badge')}
                            </span>
                          )}
                        </div>
                      )}

                      {purchasingId === selectedPremium.id && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded text-blue-700 dark:text-blue-300 text-sm animate-pulse">
                          {t('paywall_payment_processing')}
                        </div>
                      )}

                      {showPayPal && (
                        <div
                          ref={el => { paypalButtonRefs.current[`premium_${selectedPremium.id}`] = el; }}
                          className="min-h-[40px]"
                          style={{ display: purchasingId === selectedPremium.id ? 'none' : 'block' }}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="py-6 animate-pulse text-gray-500 dark:text-gray-400">{t('upgrade_loading')}</div>
        )}

        {isNativeIOS() && (
          <div className="mb-6">
            <NativePaywall onPurchaseSuccess={onPurchaseSuccess} />
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 text-gray-400 dark:text-gray-600 my-5">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-sm">{t('paywall_or_divider')}</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Actions: Redeem, Download, Logout */}
        <div className="space-y-3">
          <Button
            onClick={onRedeem}
            size="lg"
            fullWidth
            leftIcon={<KeyIcon className="w-5 h-5" />}
            className="bg-[#FECC78] text-black hover:brightness-95"
          >
            {t('paywall_redeem_button')}
          </Button>

          {onDownloadData && (
            <button
              onClick={onDownloadData}
              className="w-full text-sm text-accent-primary hover:underline py-2"
            >
              {t('paywall_download_data')}
            </button>
          )}

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onLogout}
              className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
            >
              {t('paywall_logout_button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaywallView;
