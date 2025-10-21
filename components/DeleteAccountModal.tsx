import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as userService from '../services/userService';
import { XIcon } from './icons/XIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import Spinner from './shared/Spinner';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeleteSuccess: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, onDeleteSuccess }) => {
    const { t } = useLocalization();
    const [confirmationText, setConfirmationText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const requiredText = t('deleteAccount_confirmationText');

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (confirmationText !== requiredText) {
            setError(t('deleteAccount_error_mismatch'));
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await userService.deleteAccount();
            onDeleteSuccess();
        } catch (err: any) {
            setError(err.message || t('deleteAccount_error_api'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" 
            aria-modal="true" 
            role="dialog"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-900 w-full max-w-lg p-6 border border-red-400 dark:border-red-500/50 shadow-xl rounded-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 id="delete-modal-title" className="text-2xl font-bold text-red-600 dark:text-red-400 uppercase flex items-center gap-2">
                        <DeleteIcon className="w-6 h-6" />
                        {t('deleteAccount_title')}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" aria-label={t('modal_close')}>
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">{t('deleteAccount_warning')}</p>
                    <p className="text-gray-600 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: t('deleteAccount_confirmation', { requiredText: `<strong>${requiredText}</strong>` }) }} />

                    <input
                        type="text"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder={requiredText}
                        disabled={isLoading}
                        className="mt-1 w-full p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />

                    {error && <p className="text-red-500 text-sm mt-1 whitespace-pre-wrap">{error}</p>}
                </div>

                <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2 text-base font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-400 dark:border-gray-700 uppercase hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                        {t('deleteAccount_cancel')}
                    </button>
                    <button 
                        onClick={handleDelete}
                        disabled={isLoading || confirmationText !== requiredText}
                        className="px-6 py-2 text-base font-bold text-white bg-red-600 uppercase hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-800 disabled:cursor-not-allowed flex items-center justify-center w-40"
                    >
                        {isLoading ? <Spinner /> : t('deleteAccount_confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;