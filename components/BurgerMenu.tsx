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
import { RepeatIcon } from './icons/RepeatIcon';

interface BurgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onNavigate: (view: NavView) => void;
  onLogout: () => void;
  onStartOver: () => void;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ isOpen, onClose, currentUser, onNavigate, onLogout, onStartOver }) => {
    const { t } = useLocalization();

    if (!isOpen) return null;
    
    const handleLogout = () => {
        onLogout();
        onClose();
    };

    const handleStartOverAndClose = () => {
        onStartOver();
        onClose();
    }

    return (
        <div 
            className="fixed inset-0 z-40 flex justify-start"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="w-full max-w-sm h-full bg-background-secondary shadow-2xl p-6 flex flex-col animate-slideInFromLeft"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-content-primary uppercase">{t('menu_title')}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-content-secondary hover:text-content-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <nav className="flex-1 flex flex-col space-y-2 overflow-y-auto">
                    <MenuItem icon={RepeatIcon} text={t('menu_start_over')} onClick={handleStartOverAndClose} />
                    <hr className="border-border-primary my-2" />
                    
                    {currentUser?.isAdmin && (
                        <>
                            <MenuItem icon={GearIcon} text={t('menu_admin')} onClick={() => onNavigate('admin')} />
                             <hr className="border-border-primary my-2" />
                        </>
                    )}

                    {/* Items moved to the top */}
                    <MenuItem icon={UserIcon} text={t('menu_about')} onClick={() => onNavigate('about')} />
                    <MenuItem icon={ListIcon} text={t('menu_legal')} onClick={() => onNavigate('legal')} />
                    <MenuItem icon={ShieldIcon} text={t('menu_disclaimer')} onClick={() => onNavigate('disclaimer')} />

                    <hr className="border-border-primary my-2" />
                    
                    {currentUser && (
                        <>
                            <MenuItem icon={UserIcon} text={t('menu_account_management')} onClick={() => onNavigate('accountManagement')} />
                            <hr className="border-border-primary my-2" />
                        </>
                    )}

                    <MenuItem icon={BookOpenIcon} text={t('menu_user_guide')} onClick={() => onNavigate('userGuide')} />
                    <MenuItem icon={QuestionMarkCircleIcon} text={t('menu_faq')} onClick={() => onNavigate('faq')} />
                    <MenuItem icon={CodeIcon} text={t('menu_formatting')} onClick={() => onNavigate('formattingHelp')} />
                </nav>

                <div className="mt-auto pt-4 border-t border-border-primary">
                    {currentUser ? (
                        <>
                            <div className="px-4 py-3 text-sm text-content-subtle text-left truncate">
                                {currentUser.email}
                            </div>
                            <MenuItem icon={LogOutIcon} text={t('menu_logout')} onClick={handleLogout} specialColor="text-status-danger-foreground hover:bg-status-danger-background" />
                        </>
                    ) : (
                        <MenuItem icon={LogInIcon} text={t('menu_login')} onClick={() => onNavigate('auth')} />
                    )}
                    <p className="px-4 pt-2 text-xs text-center text-content-subtle">
                        Version 1.5.4
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
                : 'text-content-secondary hover:bg-background-tertiary'
        }`}
    >
        <Icon className={`w-6 h-6 ${specialColor ? '' : 'text-content-subtle'}`} />
        <span className="font-semibold">{text}</span>
    </button>
);


export default BurgerMenu;