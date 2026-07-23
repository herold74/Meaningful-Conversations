import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { usePayPal } from '../hooks/usePayPal';
import { isNativeApp, isNativeIOS } from '../utils/platformDetection';
import { KeyIcon } from './icons/KeyIcon';
import Button from './shared/Button';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPremiumId, setSelectedPremiumId] = useState<string | null>(null);
  const paypalButtonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const renderedButtonsRef = useRef<Set<string>>(new Set());

  const showPayPal = !isNativeApp();

  useEffect(() => {
    renderedButtonsRef.current = new Set();
    (async () => {
      try {
        const result = await fetchProducts();
        setData(result);
        const premiums = (result.products || []).filter((p: Product) => p.category === 'premium');
        if (premiums.length > 0) setSelectedPremiumId(premiums[0].id);
      } catch {
        setError(t('upgrade_load_error'));
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
        try {
          return await createOrder(productId);
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
  }, [createOrder, captureOrder, onPurchaseSuccess, t]);

  useEffect(() => {
    if (!showPayPal || !paypalReady || !data) return;

    const nonPremium = data.products.filter(p => p.category !== 'premium');
    for (const product of nonPremium) {
      const container = paypalButtonRefs.current[product.id];
      if (!container || renderedButtonsRef.current.has(product.id)) continue;
      renderedButtonsRef.current.add(product.id);
      renderPayPalButton(product.id, container);
    }
  }, [paypalReady, data, showPayPal, renderPayPalButton]);

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

  const durationLabel = (d: string | null) => {
    if (d === '1M') return t('upgrade_duration_1m');
    if (d === '3M') return t('upgrade_duration_3m');
    if (d === '1Y') return t('upgrade_duration_1y');
    return '';
  };

  if (isLoading && !isNativeIOS()) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-content-subtle">{t('upgrade_loading')}</div>
      </div>
    );
  }

  if (error && !data && !isNativeIOS()) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <p className="text-status-danger-foreground">{error}</p>
      </div>
    );
  }

  const tierLabel = data ? (TIER_LABELS[data.currentTier]?.[language] || data.currentTier) : '';
  const premiumProducts = data ? data.products.filter(p => p.category === 'premium') : [];
  const botProducts = data ? data.products.filter(p => p.category === 'bot') : [];
  const accessProducts = data ? data.products.filter(p => p.category === 'access') : [];
  const hasProducts = data ? data.products.length > 0 : false;
  const selectedPremium = premiumProducts.find(p => p.id === selectedPremiumId) || null;

  const renderProductCard = (product: Product) => {
    const hasDiscount = product.finalPrice < product.price;
    const isPurchasing = purchasingId === product.id;

    return (
      <div key={product.id} className="bg-background-secondary border border-border-primary rounded-lg p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-1">
          <div className="min-w-0">
            <h3 className="font-semibold text-content-primary text-sm sm:text-base truncate">{product.name}</h3>
            {product.duration && (
              <span className="text-xs text-content-subtle">{durationLabel(product.duration)}</span>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-content-subtle line-through mr-1">€{product.price.toFixed(2).replace('.', ',')}</span>
            )}
            <span className={`text-lg sm:text-xl font-bold ${hasDiscount ? 'text-status-success-foreground' : 'text-accent-primary'}`}>
              €{product.finalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {hasDiscount && product.discountReasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.discountReasons.includes('loyalty') && (
              <span className="text-xs px-2 py-0.5 bg-status-warning-background text-status-warning-foreground rounded-full">
                {t('upgrade_loyalty_badge')}
              </span>
            )}
            {product.discountReasons.includes('bot_credit') && (
              <span className="text-xs px-2 py-0.5 bg-status-info-background text-status-info-foreground rounded-full">
                {t('upgrade_bot_credit_badge')}
              </span>
            )}
          </div>
        )}

        {isPurchasing && (
          <div className="p-3 bg-status-info-background border border-status-info-border rounded text-status-info-foreground text-sm animate-pulse">
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
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Current Tier */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-content-primary">{t('upgrade_title')}</h1>
        <p className="mt-2 text-content-secondary">
          {t('upgrade_current_tier')}: <span className="font-semibold text-accent-primary">{tierLabel}</span>
          {data?.isLifetime && <span className="ml-1 text-xs text-status-success-foreground">(Lifetime)</span>}
          {data?.isPremium && data.premiumExpiresAt && (
            <span className="ml-1 text-xs text-content-subtle">
              ({t('upgrade_expires')} {new Date(data.premiumExpiresAt).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')})
            </span>
          )}
        </p>
      </div>

      {successMessage && (
        <div className="p-4 mb-6 bg-status-success-background border-2 border-status-success-border rounded-lg text-status-success-foreground font-medium text-center">
          ✅ {successMessage}
        </div>
      )}

      {(error || paypalError) && !successMessage && (
        <div className="p-3 mb-6 bg-status-danger-background border-2 border-status-danger-border rounded-lg text-status-danger-foreground text-sm text-center">
          {error || paypalError}
        </div>
      )}

      {!hasProducts && (
        <div className="text-center py-12 text-content-subtle">
          <p className="text-lg">{t('upgrade_all_unlocked')}</p>
        </div>
      )}

      {/* Access passes — web only (PayPal); hidden on native iOS where NativePaywall is used */}
      {accessProducts.length > 0 && !isNativeIOS() && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-content-primary mb-3">{t('upgrade_access_section')}</h2>
          <div className="space-y-4">{accessProducts.map(renderProductCard)}</div>
        </section>
      )}

      {/* Premium Passes — dropdown selector; hidden on native iOS */}
      {premiumProducts.length > 0 && !isNativeIOS() && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-content-primary mb-3">{t('upgrade_premium_section')}</h2>
          <p className="text-sm text-content-subtle mb-4">{t('upgrade_premium_description')}</p>
          <div className="bg-background-secondary border border-border-primary rounded-lg p-4 sm:p-5 space-y-3">
            <select
              value={selectedPremiumId || ''}
              onChange={e => handlePremiumChange(e.target.value)}
              className="w-full p-2.5 bg-background-secondary border border-border-secondary rounded-md text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
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
                  <span className="text-xs text-content-subtle">{durationLabel(selectedPremium.duration)}</span>
                  <div className="text-right flex-shrink-0">
                    {selectedPremium.finalPrice < selectedPremium.price && (
                      <span className="text-xs sm:text-sm text-content-subtle line-through mr-1">€{selectedPremium.price.toFixed(2).replace('.', ',')}</span>
                    )}
                    <span className={`text-lg sm:text-xl font-bold ${selectedPremium.finalPrice < selectedPremium.price ? 'text-status-success-foreground' : 'text-accent-primary'}`}>
                      €{selectedPremium.finalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {selectedPremium.discountReasons.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedPremium.discountReasons.includes('loyalty') && (
                      <span className="text-xs px-2 py-0.5 bg-status-warning-background text-status-warning-foreground rounded-full">
                        {t('upgrade_loyalty_badge')}
                      </span>
                    )}
                    {selectedPremium.discountReasons.includes('bot_credit') && (
                      <span className="text-xs px-2 py-0.5 bg-status-info-background text-status-info-foreground rounded-full">
                        {t('upgrade_bot_credit_badge')}
                      </span>
                    )}
                  </div>
                )}

                {purchasingId === selectedPremium.id && (
                  <div className="p-3 bg-status-info-background border border-status-info-border rounded text-status-info-foreground text-sm animate-pulse">
                    {t('upgrade_payment_processing')}
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
        </section>
      )}

      {/* Bot Unlocks — web only */}
      {botProducts.length > 0 && !isNativeIOS() && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-content-primary mb-3">{t('upgrade_bot_section')}</h2>
          <p className="text-sm text-content-subtle mb-4">{t('upgrade_bot_description')}</p>
          <div className="space-y-4">{botProducts.map(renderProductCard)}</div>
        </section>
      )}

      {/* Native IAP for iOS */}
      {isNativeIOS() && (
        <section className="mb-8">
          <NativePaywall onPurchaseSuccess={onPurchaseSuccess} currentUser={currentUser} showBotUnlocks={true} skipAutoRestore={true} />
        </section>
      )}

      {/* Divider + Redeem Code */}
      <div className="flex items-center gap-3 text-content-subtle my-6">
        <div className="flex-1 h-px bg-border-primary" />
        <span className="text-sm">{t('paywall_or_divider')}</span>
        <div className="flex-1 h-px bg-border-primary" />
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
