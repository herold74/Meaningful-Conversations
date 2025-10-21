import React from 'react';
import { User, NavView } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { LogInIcon } from './icons/LogInIcon';
import { UserIcon } from './icons/UserIcon';
import { LogOutIcon } from './icons/LogOutIcon';
import { XIcon } from './icons/XIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { ListIcon } from './icons/ListIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CodeIcon } from './icons/CodeIcon';
import { GearIcon } from './icons/GearIcon';
import { KeyIcon } from './icons/KeyIcon';
import { ShoppingBagIcon } from './icons/ShoppingBagIcon';

interface BurgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onNavigate: (view: NavView) => void;
  onLogout: () => void;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ isOpen, onClose, currentUser, onNavigate, onLogout }) => {
    const { t } = useLocalization();

    if (!isOpen) return null;

    const handleNavigate = (view: NavView) => {
        onNavigate(view);
        onClose();
    };
    
    const handleLogout = () => {
        onLogout();
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex justify-end"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="w-full max-w-sm h-full bg-white dark:bg-gray-950 shadow-2xl p-6 flex flex-col animate-slideInFromRight"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 uppercase">{t('menu_title')}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <nav className="flex-1 flex flex-col space-y-2 overflow-y-auto">
                    {currentUser?.isAdmin && (
                        <>
                            <MenuItem icon={GearIcon} text={t('menu_admin')} onClick={() => handleNavigate('admin')} />
                             <hr className="border-gray-200 dark:border-gray-800 my-2" />
                        </>
                    )}

                    {/* Items moved to the top */}
                    <MenuItem icon={UserIcon} text={t('menu_about')} onClick={() => handleNavigate('about')} />
                    <MenuItem icon={ListIcon} text={t('menu_terms')} onClick={() => handleNavigate('terms')} />
                    <MenuItem icon={ShieldIcon} text={t('menu_disclaimer')} onClick={() => handleNavigate('disclaimer')} />

                    <hr className="border-gray-200 dark:border-gray-800 my-2" />
                    
                    {currentUser && (
                        <>
                            <MenuItem icon={KeyIcon} text={t('menu_change_password')} onClick={() => handleNavigate('changePassword')} />
                            <MenuItem icon={ShoppingBagIcon} text={t('menu_redeem_code')} onClick={() => handleNavigate('redeemCode')} />
                        </>
                    )}

                    <MenuItem icon={BookOpenIcon} text={t('menu_user_guide')} onClick={() => handleNavigate('userGuide')} />
                    <MenuItem icon={QuestionMarkCircleIcon} text={t('menu_faq')} onClick={() => handleNavigate('faq')} />
                    <MenuItem icon={CodeIcon} text={t('menu_formatting')} onClick={() => handleNavigate('formattingHelp')} />
                </nav>

                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
                    {currentUser ? (
                        <>
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-left truncate">
                                {currentUser.email}
                            </div>
                            <MenuItem icon={LogOutIcon} text={t('menu_logout')} onClick={handleLogout} specialColor="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50" />
                        </>
                    ) : (
                        <MenuItem icon={LogInIcon} text={t('menu_login')} onClick={() => handleNavigate('auth')} />
                    )}
                    <p className="px-4 pt-2 text-xs text-center text-gray-400 dark:text-gray-500">
                        Version 1.4.5
                    </p>
                </div>
            </div>
        </div>
    );
};

const MenuItem: React.FC<{ icon: React.ElementType, text: string, onClick: () => void, specialColor?: string }> = ({ icon: Icon, text, onClick, specialColor }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center gap-4 px-4 py-3 text-left rounded-md transition-colors ${
            specialColor 
                ? specialColor 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
    >
        <Icon className={`w-6 h-6 ${specialColor ? '' : 'text-gray-500 dark:text-gray-400'}`} />
        <span className="font-semibold">{text}</span>
    </button>
);


export default BurgerMenu;