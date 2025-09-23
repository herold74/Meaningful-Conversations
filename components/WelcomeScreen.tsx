import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

const WelcomeScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center">
            <div className="animate-fadeIn">
                <LogoIcon className="w-24 h-24 text-blue-600" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-gray-300 animate-fadeIn" style={{ animationDelay: '200ms' }}>
                Meaningful Conversations
            </h1>
        </div>
    );
};

export default WelcomeScreen;
