import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as userService from '../services/userService';
import { User } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Spinner from './shared/Spinner';
import { CheckIcon } from './icons/CheckIcon';
import { deriveKey, encryptData, hexToUint8Array } from '../utils/encryption';

interface ChangePasswordViewProps {
  onBack: () => void;
  currentUser: User;
  encryptionKey: CryptoKey;
  lifeContext: string;
}

const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({ onBack, currentUser, encryptionKey, lifeContext }) => {
  const { t } = useLocalization();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const trimmedOldPassword = oldPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (trimmedNewPassword.length < 6) {
      setError(t('changePassword_error_short'));
      return;
    }
    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setError(t('changePassword_error_mismatch'));
      return;
    }
    
    setIsLoading(true);
    try {
        if (!currentUser.encryptionSalt) {
            throw new Error("User salt is missing. Cannot re-encrypt data.");
        }
        // Re-encrypt the life context with a key derived from the new password
        const saltBytes = hexToUint8Array(currentUser.encryptionSalt);
        const newKey = await deriveKey(trimmedNewPassword, saltBytes);
        const newEncryptedLifeContext = await encryptData(newKey, lifeContext);

        await userService.changePassword(trimmedOldPassword, trimmedNewPassword, newEncryptedLifeContext);
        
        setSuccess(true);
        // On success, we must log the user out because their in-memory key is now invalid.
        // The API session is still valid, but they need to log in again to derive the new key.
        setTimeout(() => {
            // A full page reload is a simple way to force a clean logout and redirect to auth.
            window.location.reload(); 
        }, 2500);

    } catch (err: any) {
        if (err.status === 401) {
             setError(t('changePassword_error_incorrect'));
        } else {
            setError(err.message || t('changePassword_error_generic'));
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-fadeIn">
      <div className="relative w-full max-w-md p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
        <button onClick={onBack} className="absolute left-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('changePassword_title')}</h1>
        </div>
        
        {success ? (
             <div className="text-center p-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <CheckIcon className="w-10 h-10 text-green-500 dark:text-green-400" />
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300">{t('changePassword_success')}</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">You will be logged out and asked to log in again shortly.</p>
             </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="oldPassword" className="block text-sm font-bold text-gray-700 dark:text-gray-300 text-left">{t('changePassword_old_label')}</label>
                <input
                type="password"
                id="oldPassword"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                disabled={isLoading}
                className="mt-1 w-full p-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                />
            </div>
            <div>
                <label htmlFor="newPassword" className="block text-sm font-bold text-gray-700 dark:text-gray-300 text-left">{t('changePassword_new_label')}</label>
                <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
                className="mt-1 w-full p-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
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
                disabled={isLoading}
                className="mt-1 w-full p-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                />
            </div>

            {error && <p className="text-red-500 text-sm whitespace-pre-wrap">{error}</p>}
            
            <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 focus:outline-none transition-colors duration-200 flex items-center justify-center disabled:bg-gray-300 dark:disabled:bg-gray-700"
            >
                {isLoading ? <Spinner /> : t('changePassword_button')}
            </button>
            </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordView;