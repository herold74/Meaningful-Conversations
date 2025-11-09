import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { User } from '../types';
import { KeyIcon } from './icons/KeyIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { ShoppingBagIcon } from './icons/ShoppingBagIcon';
import { UserIcon } from './icons/UserIcon';

interface AccountManagementViewProps {
    currentUser: User;
    onNavigate: (view: 'changePassword' | 'exportData' | 'redeemCode' | 'editProfile') => void;
    onDeleteAccount: () => void;
}

const AccountManagementView: React.FC<AccountManagementViewProps> = ({ currentUser, onNavigate, onDeleteAccount }) => {
    const { t } = useLocalization();

    const menuItems = [
        {
            icon: UserIcon,
            title: t('account_edit_profile'),
            description: t('account_edit_profile_desc'),
            onClick: () => onNavigate('editProfile'),
            color: 'text-indigo-600 dark:text-indigo-400',
        },
        {
            icon: KeyIcon,
            title: t('menu_change_password'),
            description: t('account_change_password_desc'),
            onClick: () => onNavigate('changePassword'),
            color: 'text-blue-600 dark:text-blue-400',
        },
        {
            icon: DownloadIcon,
            title: t('menu_export_data'),
            description: t('account_export_data_desc'),
            onClick: () => onNavigate('exportData'),
            color: 'text-green-600 dark:text-green-400',
        },
        {
            icon: ShoppingBagIcon,
            title: t('menu_redeem_code'),
            description: t('account_redeem_code_desc'),
            onClick: () => onNavigate('redeemCode'),
            color: 'text-purple-600 dark:text-purple-400',
        },
        {
            icon: DeleteIcon,
            title: t('menu_delete_account'),
            description: t('account_delete_account_desc'),
            onClick: onDeleteAccount,
            color: 'text-red-600 dark:text-red-400',
        },
    ];

    return (
        <div className="w-full max-w-2xl mx-auto p-8 space-y-6 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary my-10 animate-fadeIn rounded-lg shadow-lg">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-content-primary uppercase">{t('account_management_title')}</h1>
                <p className="text-sm text-content-subtle mt-2">{currentUser.email}</p>
            </div>

            <div className="space-y-4">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={item.onClick}
                        className="w-full p-4 bg-white dark:bg-gray-800 border border-border-secondary dark:border-border-primary rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                        <div className="flex items-start gap-4">
                            <item.icon className={`w-6 h-6 flex-shrink-0 mt-1 ${item.color}`} />
                            <div className="flex-1">
                                <h3 className="font-semibold text-content-primary">{item.title}</h3>
                                <p className="text-sm text-content-secondary mt-1">{item.description}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="pt-4 text-xs text-content-subtle text-center">
                {t('account_management_footer')}
            </div>
        </div>
    );
};

export default AccountManagementView;

