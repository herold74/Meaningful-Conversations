import React, { useEffect, useRef, useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { LockIcon } from './icons/LockIcon';
import { KeyIcon } from './icons/KeyIcon';
import Button from './shared/Button';
import { usePayPal } from '../hooks/usePayPal';
import { isNativeApp } from '../utils/platformDetection';
import { User } from '../types';

interface PaywallViewProps {
  userEmail: string | null;
  onRedeem: () => void;
  onPurchaseSuccess: (user: User) => void;
  onLogout: () => void;
}

const PaywallView: React.FC<PaywallViewProps> = ({ userEmail, onRedeem, onPurchaseSuccess, onLogout }) => {
  const { t } = useLocalization();
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRenderedRef = useRef(false);
  const { ready: paypalReady, error: paypalError, createOrder, captureOrder } = usePayPal();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showPayPal = !isNativeApp();

  useEffect(() => {
    if (!showPayPal || !paypalReady || !paypalContainerRef.current || buttonsRenderedRef.current) return;
    if (!window.paypal?.Buttons) return;

    buttonsRenderedRef.current = true;

    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', height: 45 },
      createOrder: async () => {
        setPaymentStatus('processing');
        setErrorMessage(null);
        return createOrder();
      },
      onApprove: async (data: { orderID: string }) => {
        try {
          const result = await captureOrder(data.orderID);
          if (result.success && result.user) {
            setPaymentStatus('success');
            setTimeout(() => onPurchaseSuccess(result.user), 1200);
          } else {
            setPaymentStatus('error');
            setErrorMessage(result.error || t('paywall_payment_error'));
          }
        } catch {
          setPaymentStatus('error');
          setErrorMessage(t('paywall_payment_error'));
        }
      },
      onCancel: () => { setPaymentStatus('idle'); },
      onError: (err: any) => {
        console.error('PayPal button error:', err);
        setPaymentStatus('error');
        setErrorMessage(t('paywall_payment_error'));
      },
    }).render(paypalContainerRef.current);
  }, [paypalReady, showPayPal]);

  const description = userEmail
    ? t('paywall_description_expired', { email: userEmail })
    : t('paywall_description_new');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center animate-fadeIn px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-transparent border-2 border-yellow-400 dark:border-yellow-500 rounded-lg">

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mb-4">
            <LockIcon className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('paywall_title')}</h1>
        </div>

        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: description }} />

        {/* PayPal checkout (web only) */}
        {showPayPal && (
          <div className="space-y-3 pt-2">
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {t('paywall_product_title')}
              </p>
              <p className="text-2xl font-bold text-accent-primary mt-1">
                {t('paywall_product_price')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('paywall_product_description')}
              </p>
            </div>

            {paymentStatus === 'success' ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 rounded-lg text-emerald-700 dark:text-emerald-300 font-medium">
                ✅ {t('paywall_payment_success')}
              </div>
            ) : paymentStatus === 'processing' ? (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 rounded-lg text-blue-700 dark:text-blue-300 font-medium animate-pulse">
                {t('paywall_payment_processing')}
              </div>
            ) : (
              <>
                {(errorMessage || paypalError) && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-400 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    🚨 {errorMessage || paypalError}
                  </div>
                )}
                <div ref={paypalContainerRef} className="min-h-[50px]" />
              </>
            )}
          </div>
        )}

        {/* iOS native hint */}
        {isNativeApp() && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 rounded-lg text-blue-700 dark:text-blue-300 text-sm">
            💡 {t('paywall_ios_hint')}
          </div>
        )}

        {/* Divider */}
        {showPayPal && (
          <div className="flex items-center gap-3 text-gray-400 dark:text-gray-600">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-sm">{t('paywall_or_divider')}</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
        )}

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
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
          >
            {t('paywall_logout_button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaywallView;
