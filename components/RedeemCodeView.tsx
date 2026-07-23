import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as userService from '../services/userService';
import { User } from '../types';
import Button from './shared/Button';
import { CheckIcon } from './icons/CheckIcon';
import { brand } from '../config/brand';

interface RedeemCodeViewProps {
  onRedeemSuccess: (user: User) => void;
  onBack?: () => void;
}

const RedeemCodeView: React.FC<RedeemCodeViewProps> = ({ onRedeemSuccess, onBack }) => {
  const { t } = useLocalization();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setStatus('loading');
    setError('');
    try {
      const updatedUser = await userService.redeemCode(code);
      setStatus('success');
      setTimeout(() => onRedeemSuccess(updatedUser), 2000);
    } catch (err: any) {
      setStatus('error');
      if (err.data?.errorCode === 'ACCESS_EXPIRED_BOT_CODE' || err.status === 403) {
          setError(t('redeem_error_bot_code_expired'));
      } else if (err.status === 404 || err.status === 409) {
          setError(t('redeem_error_invalid'));
      } else {
          setError(t('redeem_error_generic'));
      }
    }
  };

  const renderContent = () => {
    if (status === 'success') {
      return (
        <div className="text-center p-4 animate-fadeIn">
            <div className="w-16 h-16 bg-status-success-background rounded-full flex items-center justify-center mb-4 mx-auto">
                <CheckIcon className="w-10 h-10 text-status-success-foreground" />
            </div>
          <h2 className="text-xl font-bold text-content-primary">{t('redeem_success')}</h2>
          <p className="mt-2 text-content-secondary">{t('redeemCode_redirecting')}</p>
        </div>
      );
    }

    return (
      <>
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-content-primary uppercase">{t('redeem_title')}</h1>
          <p className="mt-2 text-sm sm:text-base text-content-secondary mb-8">{t('redeem_subtitle')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('redeem_code_placeholder')}
              aria-label={t('redeem_code_placeholder')}
              required
              disabled={status === 'loading'}
              className="w-full p-3 bg-background-tertiary text-content-primary border border-border-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          {status === 'error' && <p className="text-status-danger-foreground text-sm">{error}</p>}
          
          <Button type="submit" disabled={status === 'loading' || !code.trim()} loading={status === 'loading'} size="lg" fullWidth>
            {t('redeem_button')}
          </Button>
        </form>
        <p className="text-center text-sm text-content-secondary mt-6">
            {t('redeem_info_text')}
            <a 
                href={brand.providerUrl}
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium text-accent-primary hover:text-accent-primary-hover"
            >
                {brand.providerName}
            </a>
        </p>

        {onBack && (
          <div className="pt-4 border-t border-border-primary mt-6 text-center">
            <button
              onClick={onBack}
              className="text-sm text-content-subtle hover:underline"
            >
              ← {t('redeem_back_button')}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto p-5 sm:p-8 space-y-6 bg-background-secondary border border-border-primary mt-4 mb-10 rounded-lg shadow-lg">
        <div className="w-full mt-4 sm:mt-0">
            {renderContent()}
        </div>
    </div>
  );
};

export default RedeemCodeView;