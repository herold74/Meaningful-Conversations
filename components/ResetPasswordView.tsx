import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as userService from '../services/userService';
import Spinner from './shared/Spinner';
import { CheckIcon } from './icons/CheckIcon';
import { KeyIcon } from './icons/KeyIcon';

interface ResetPasswordViewProps {
  token: string;
  onResetSuccess: () => void;
}

const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ token, onResetSuccess }) => {
  const { t } = useLocalization();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError(t('changePassword_error_short'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('changePassword_error_mismatch'));
      return;
    }
    
    setStatus('loading');
    try {
      await userService.resetPassword(token, newPassword);
      setStatus('success');
    } catch (err: any) {
      setError(err.message || t('changePassword_error_generic'));
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-fadeIn">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700">
        
        {status === 'success' ? (
             <div className="text-center p-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <CheckIcon className="w-10 h-10 text-green-500 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t('resetPassword_success_title')}</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{t('resetPassword_success_subtitle')}</p>
                <button onClick={onResetSuccess} className="mt-6 w-full px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500">
                    {t('login_button')}
                </button>
             </div>
        ) : (
            <>
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase flex items-center justify-center gap-3">
                        <KeyIcon className="w-8 h-8"/>
                        {t('forgotPassword_title')}
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-bold text-gray-700 dark:text-gray-300 text-left">{t('changePassword_new_label')}</label>
                        <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={status === 'loading'}
                        className="mt-1 w-full p-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 dark:text-gray-300 text-left">{t('changePassword_confirm_label')}</label>
                        <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={status === 'loading'}
                        className="mt-1 w-full p-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 focus:outline-none transition-colors duration-200 flex items-center justify-center disabled:bg-gray-300 dark:disabled:bg-gray-700"
                    >
                        {status === 'loading' ? <Spinner /> : t('changePassword_button')}
                    </button>
                </form>
            </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordView;
