import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocalization } from '../context/LocalizationContext';
import { LockIcon } from './icons/LockIcon';
import { KeyIcon } from './icons/KeyIcon';
import Button from './shared/Button';
import { usePayPal } from '../hooks/usePayPal';
import { isNativeApp, isNativeIOS } from '../utils/platformDetection';
import { User } from '../types';
import NativePaywall from './NativePaywall';
import { brand } from '../config/brand';

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
  currentUser?: User | null;
  onRedeem: () => void;
  onPurchaseSuccess: (user: User) => void;
  onLogout: () => void;
  onDownloadData?: () => void;
  onDownloadLifeContext?: () => void;
  onDownloadProfile?: () => void;
}

const PaywallView: React.FC<PaywallViewProps> = ({ userEmail, userXp = 0, currentUser, onRedeem, onPurchaseSuccess, onLogout, onDownloadData, onDownloadLifeContext, onDownloadProfile }) => {
  const { t } = useLocalization();
  const { ready: paypalReady, error: paypalError, createOrder, captureOrder, fetchProducts } = usePayPal();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(false);
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
      ? t('paywall_description_engaged', { email: userEmail, contactEmail: brand.contactEmail, primaryColor: brand.primaryColor })
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
      <div key={product.id} className="bg-background-tertiary border border-border-primary rounded-card p-4 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="font-semibold text-content-primary text-sm sm:text-base truncate">{product.name}</p>
            {product.duration && (
              <span className="text-xs text-content-subtle">{durationLabel(product.duration)}</span>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-content-subtle line-through mr-1">€{product.price.toFixed(2).replace('.', ',')}</span>
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

  const frostedOverlay = (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background-secondary/80 backdrop-blur-md" style={{ height: 'env(safe-area-inset-top, 0px)' }} />
  );

  return (
    <>
    {/* Frosted overlay rendered via portal to document.body — avoids motion.div transform breaking position:fixed */}
    {createPortal(frostedOverlay, document.body)}
    <div className="flex flex-col items-center min-h-screen text-center px-4 py-8 overflow-y-auto" style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}>
      <div className="w-full max-w-md md:max-w-3xl p-6 md:p-8 bg-background-secondary border border-brand-accent/40 rounded-card shadow-card-elevated">

        {/* Header */}
        <div className="flex flex-col items-center mb-4 md:mb-6">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-brand-accent/15 rounded-full flex items-center justify-center mb-3">
            <LockIcon className="w-8 h-8 md:w-10 md:h-10 text-brand-accent" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-content-primary tracking-tight">{t('paywall_title')}</h1>
        </div>

        <p className="text-sm md:text-base text-content-secondary leading-relaxed mb-5 md:mb-6" dangerouslySetInnerHTML={{ __html: description }} />

        {successMessage && (
          <div className="p-4 mb-6 bg-status-success-background border border-status-success-border rounded-card text-status-success-foreground font-medium">
            {successMessage}
          </div>
        )}

        {(errorMessage || paypalError) && !successMessage && (
          <div className="p-3 mb-6 bg-status-danger-background border border-status-danger-border rounded-card text-status-danger-foreground text-sm">
            {errorMessage || paypalError}
          </div>
        )}

        {/* Product catalog — web only (PayPal); hidden on native iOS where NativePaywall is used */}
        {!isLoading && products.length > 0 && !isNativeIOS() && (
          <div className="md:flex md:gap-6 md:items-start space-y-4 md:space-y-0 text-left mb-6">

            {/* Access products (Registered Monthly + Lifetime) */}
            {accessProducts.length > 0 && (
              <div className="md:flex-1 space-y-3">
                <h2 className="text-sm font-semibold text-content-subtle uppercase tracking-wide">
                  {t('paywall_section_basic')}
                </h2>
                {accessProducts.map(renderProductCard)}
              </div>
            )}

            {/* Premium products — dropdown selector (recommended) */}
            {premiumProducts.length > 0 && (
              <div className="md:flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-content-subtle uppercase tracking-wide">
                    {t('paywall_section_premium')}
                  </h2>
                  <span className="text-xs px-2 py-0.5 bg-brand-accent/15 text-brand-accent rounded-pill font-semibold">
                    {t('paywall_recommended')}
                  </span>
                </div>
                <p className="text-xs text-content-subtle">
                  {t('paywall_premium_includes_all')}
                </p>
                <div className="bg-background-tertiary border-2 border-brand-accent/40 rounded-card p-4 space-y-3">
                  <select
                    value={selectedPremiumId || ''}
                    onChange={e => handlePremiumChange(e.target.value)}
                    className="w-full p-2.5 bg-background-primary border border-border-primary rounded-lg text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
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

        {isLoading && !isNativeIOS() && (
          <div className="py-6 animate-pulse text-gray-500 dark:text-gray-400">{t('upgrade_loading')}</div>
        )}

        {isNativeIOS() && (
          <div className="mb-6">
            <NativePaywall onPurchaseSuccess={onPurchaseSuccess} currentUser={currentUser} />
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

          {(onDownloadLifeContext || onDownloadProfile) && (
            <div className="flex flex-col items-center gap-1">
              {onDownloadLifeContext && (
                <button
                  onClick={onDownloadLifeContext}
                  className="text-sm text-accent-primary hover:underline py-1"
                >
                  {t('paywall_download_life_context')}
                </button>
              )}
              {onDownloadProfile && (
                <button
                  onClick={onDownloadProfile}
                  className="text-sm text-accent-primary hover:underline py-1"
                >
                  {t('paywall_download_profile')}
                </button>
              )}
            </div>
          )}
          {onDownloadData && !onDownloadLifeContext && !onDownloadProfile && (
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
    </>
  );
};

export default PaywallView;
