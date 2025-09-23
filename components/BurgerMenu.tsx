import React from 'react';
import { XIcon } from './icons/XIcon';
import { NavView } from '../types';

interface BurgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: NavView) => void;
    onRestart: () => void;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ isOpen, onClose, onNavigate, onRestart }) => {
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
            <div className="absolute top-0 right-0 flex flex-col w-80 h-full bg-gray-950 border-l border-gray-700 p-6 animate-slideInFromRight">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-gray-200 uppercase">Menu</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <nav>
                    <ul className="space-y-4">
                        <li>
                            <button onClick={() => handleLinkClick('about')} className="text-lg text-gray-300 hover:text-green-400 w-full text-left transition-colors">About</button>
                        </li>
                        <li>
                            <button onClick={() => handleLinkClick('faq')} className="text-lg text-gray-300 hover:text-green-400 w-full text-left transition-colors">FAQ</button>
                        </li>
                        <li>
                            <button onClick={() => handleLinkClick('disclaimer')} className="text-lg text-gray-300 hover:text-green-400 w-full text-left transition-colors">Disclaimer</button>
                        </li>
                        <li>
                            <button onClick={() => handleLinkClick('terms')} className="text-lg text-gray-300 hover:text-green-400 w-full text-left transition-colors">Terms & Conditions</button>
                        </li>
                        <hr className="border-gray-700 my-4" />
                        <li>
                            <button onClick={onRestart} className="text-lg text-yellow-400 hover:text-yellow-300 w-full text-left transition-colors">Start Over with New Context</button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default BurgerMenu;