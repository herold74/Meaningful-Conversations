import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { User, View } from '../types';
import { XIcon } from './icons/XIcon';
import { LogOutIcon } from './icons/LogOutIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import DeleteAccountModal from './DeleteAccountModal';

interface BurgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
    onLogout: () => void;
    onNavigate: (view: View) => void;
    onDeleteAccountSuccess: () => void;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ isOpen, onClose, currentUser, onLogout, onNavigate, onDeleteAccountSuccess }) => {
    const { t, language, setLanguage } = useLocalization();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleNavClick = (view: View) => {
        onNavigate(view);
        onClose();
    };
    
    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const handleLogout = () => {
        onLogout();
        onClose();
    }
    
    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} aria-hidden="true"></div>
        <div 
            className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-950 shadow-lg z-50 flex flex-col transition-transform duration-300 ease-in-out"
            style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
            role="dialog"
            aria-modal="true"
        >
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-200">{t('menu_title')}</h2>
                <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" aria-label="Close menu">
                    <XIcon className="w-6 h-6" />
                </button>
            </header>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <button onClick={() => handleNavClick('user-guide')} className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">{t('menu_user_guide')}</button>
                <button onClick={() => handleNavClick('formatting-help')} className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">{t('menu_formatting_help')}</button>
                <button onClick={() => handleNavClick('about')} className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">{t('menu_about')}</button>
                <button onClick={() => handleNavClick('faq')} className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">{t('menu_faq')}</button>
                <button onClick={() => handleNavClick('disclaimer')} className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">{t('menu_disclaimer')}</button>
                <button onClick={() => handleNavClick('terms')} className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">{t('menu_terms')}</button>
            </nav>
            
            <footer className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex justify-center gap-2">
                    <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-bold uppercase ${language === 'en' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>EN</button>
                    <button onClick={() => setLanguage('de')} className={`px-3 py-1 text-sm font-bold uppercase ${language === 'de' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>DE</button>
                </div>
                {currentUser && (
                    <>
                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-2 text-base font-bold text-yellow-600 dark:text-yellow-400 bg-transparent border border-yellow-600 dark:border-yellow-400 uppercase hover:bg-yellow-600 dark:hover:bg-yellow-400 hover:text-white dark:hover:text-black">
                            <LogOutIcon className="w-5 h-5" />
                            {t('menu_logout')}
                        </button>
                         <button onClick={handleDeleteClick} className="w-full flex items-center justify-center gap-3 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 bg-transparent uppercase hover:underline">
                            <DeleteIcon className="w-4 h-4" />
                            {t('menu_delete_account')}
                        </button>
                    </>
                )}
            </footer>
        </div>
        <DeleteAccountModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onDeleteSuccess={onDeleteAccountSuccess}
        />
        </>
    );
};

export default BurgerMenu;
