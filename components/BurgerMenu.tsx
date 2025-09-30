import React from 'react';
import { XIcon } from './icons/XIcon';
import { NavView, User } from '../types';
import { useLocalization } from '../context/LocalizationContext';

interface BurgerMenuProps {
    isOpen: boolean;
    currentUser: User | null;
    onClose: () => void;
    onNavigate: (view: NavView) => void;
    onRestart: () => void;
    onFullReset: () => void;
    onLogout: () => void;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ isOpen, currentUser, onClose, onNavigate, onRestart, onFullReset, onLogout }) => {
    const { t } = useLocalization();
    if (!isOpen) return null;

    const handleLinkClick = (view: NavView) => {
        onNavigate(view);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Menu Panel */}
            <div className="absolute top-0 right-0 flex flex-col w-80 h-full bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-700 p-6 animate-slideInFromRight">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('burgerMenu_menu')}</h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <nav>
                    <ul className="space-y-4">
                        <li><button onClick={() => handleLinkClick('about')} className="text-lg text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 w-full text-left transition-colors">{t('burgerMenu_about')}</button></li>
                        <li><button onClick={() => handleLinkClick('disclaimer')} className="text-lg text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 w-full text-left transition-colors">{t('burgerMenu_disclaimer')}</button></li>
                        <li><button onClick={() => handleLinkClick('user-guide')} className="text-lg text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 w-full text-left transition-colors">{t('burgerMenu_userGuide')}</button></li>
                        <li><button onClick={() => handleLinkClick('faq')} className="text-lg text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 w-full text-left transition-colors">{t('burgerMenu_faq')}</button></li>
                        <li><button onClick={() => handleLinkClick('formatting-help')} className="text-lg text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 w-full text-left transition-colors">{t('burgerMenu_formatting')}</button></li>
                        <li><button onClick={() => handleLinkClick('terms')} className="text-lg text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 w-full text-left transition-colors">{t('burgerMenu_terms')}</button></li>
                        <hr className="border-gray-200 dark:border-gray-700 my-4" />
                        <li><button onClick={onRestart} className="text-lg text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300 w-full text-left transition-colors">{t('burgerMenu_restart')}</button></li>
                        {currentUser ? (
                             <li><button onClick={onLogout} className="text-lg text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 w-full text-left transition-colors">{t('burgerMenu_logout')}</button></li>
                        ) : (
                             <li><button onClick={onFullReset} className="text-lg text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 w-full text-left transition-colors">{t('burgerMenu_full_reset')}</button></li>
                        )}
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default BurgerMenu;
