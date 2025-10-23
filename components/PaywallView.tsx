import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { LockIcon } from './icons/LockIcon';
import { KeyIcon } from './icons/KeyIcon';
import { ShoppingBagIcon } from './icons/ShoppingBagIcon';
import { LogOutIcon } from './icons/LogOutIcon';

interface PaywallViewProps {
  userEmail: string | null;
  onRedeem: () => void;
  onLogout: () => void;
}

const PaywallView: React.FC<PaywallViewProps> = ({ userEmail, onRedeem, onLogout }) => {
  const { t } = useLocalization();

  const description = userEmail
    ? t('paywall_description_expired', { email: userEmail })
    : t('paywall_description_new');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center animate-fadeIn">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-transparent border border-yellow-400 dark:border-yellow-500">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mb-4">
            <LockIcon className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('paywall_title')}</h1>
        </div>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: description }} />
        
        <div className="space-y-4 pt-4">
          <button
            onClick={() => window.open('https://example.com/purchase', '_blank')} // Placeholder URL
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 rounded-lg shadow-md"
          >
            <ShoppingBagIcon className="w-6 h-6" />
            {t('paywall_purchase_button')}
          </button>
           <button
            onClick={onRedeem}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-black bg-[#FECC78] uppercase hover:brightness-95 rounded-lg shadow-md"
          >
            <KeyIcon className="w-6 h-6" />
            {t('paywall_redeem_button')}
          </button>
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