import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as userService from '../services/userService';
import { User } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Spinner from './shared/Spinner';
import { CheckIcon } from './icons/CheckIcon';

interface RedeemCodeViewProps {
  onRedeemSuccess: (user: User) => void;
}

const RedeemCodeView: React.FC<RedeemCodeViewProps> = ({ onRedeemSuccess }) => {
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
      if (err.status === 404 || err.status === 409) {
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
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <CheckIcon className="w-10 h-10 text-green-500 dark:text-green-400" />
            </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('redeem_success')}</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      );
    }

    return (
      <>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('redeem_title')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 mb-8">{t('redeem_subtitle')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('redeem_code_placeholder')}
              required
              disabled={status === 'loading'}
              className="w-full p-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {status === 'error' && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={status === 'loading' || !code.trim()}
            className="w-full px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 flex items-center justify-center rounded-lg shadow-md"
          >
            {status === 'loading' ? <Spinner /> : t('redeem_button')}
          </button>
        </form>
      </>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn rounded-lg shadow-lg">
        <div className="w-full mt-4 sm:mt-0">
            {renderContent()}
        </div>
    </div>
  );
};

export default RedeemCodeView;