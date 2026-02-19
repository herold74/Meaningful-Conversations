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
    const { t, language } = useLocalization();
    const menuItemBase =
        'w-full p-4 text-left rounded-lg border border-border-secondary dark:border-border-primary bg-background-tertiary dark:bg-background-tertiary hover:bg-background-secondary dark:hover:bg-background-secondary transition-colors';
    const menuIconWrap =
        'flex h-10 w-10 items-center justify-center rounded-full border border-border-secondary/70 dark:border-border-primary/70 bg-background-secondary dark:bg-background-secondary';

    const getTierLabel = () => {
        if (currentUser.isDeveloper) return t('account_tier_developer');
        if (currentUser.isAdmin) return t('account_tier_admin');
        if (currentUser.isClient) return t('account_tier_client');
        if (currentUser.isPremium) return t('account_tier_premium');
        return t('account_tier_registered');
    };

    const premiumExpiresAt = currentUser.premiumExpiresAt || currentUser.accessExpiresAt;
    const shouldShowPremiumExpiry = currentUser.isPremium && !currentUser.isClient && !!premiumExpiresAt;

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
        <div className="w-full max-w-2xl mx-auto p-6 sm:p-8 space-y-6 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary mt-4 mb-10 animate-fadeIn rounded-lg shadow-md">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-content-primary">{t('account_management_title')}</h1>
                <p className="text-sm text-content-subtle mt-2">{currentUser.email}</p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-primary bg-background-tertiary text-sm text-content-primary">
                    <span className="text-content-subtle">{t('account_current_status')}:</span>
                    <span className="font-semibold">{getTierLabel()}</span>
                </div>
                {shouldShowPremiumExpiry && (
                    <p className="text-xs text-content-subtle mt-2">
                        {t('account_status_expires')}{' '}
                        {new Date(premiumExpiresAt).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
                    </p>
                )}
            </div>

            <div className="space-y-3">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={item.onClick}
                        className={menuItemBase}
                    >
                        <div className="flex items-start gap-4">
                            <div className={menuIconWrap}>
                                <item.icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-content-primary">{item.title}</h3>
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

