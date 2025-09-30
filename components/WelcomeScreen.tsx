import React from 'react';
import { BOTS } from '../constants';
import { useLocalization } from '../context/LocalizationContext';

const WelcomeScreen: React.FC = () => {
    const { t } = useLocalization();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen overflow-hidden p-4" style={{ backgroundColor: '#FECC78' }}>
            <div className="relative w-[360px] h-[360px] flex items-center justify-center scale-[0.85] sm:scale-100 transition-transform duration-300 ease-in-out">
                
                {/* This is a static container for the title */}
                <div className="relative text-center p-4 z-10 max-w-[240px]">
                     <h1 className="text-3xl font-extrabold text-gray-900 uppercase tracking-wider" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.2)' }}>
                        {t('meaningfulConversations').split(' ').map((word, index) => <React.Fragment key={index}>{word}<br/></React.Fragment>)}
                    </h1>
                </div>

                {/* This container will rotate, carrying the icons with it */}
                <div 
                    className="absolute inset-0"
                    style={{
                        animation: `spin 30s linear infinite`,
                    }}
                >
                    {BOTS.map((bot, index) => (
                        <div
                            key={bot.id}
                            className="absolute top-1/2 left-1/2 -mt-10 -ml-10 w-20 h-20"
                            style={{
                                transform: `rotate(${(360 / BOTS.length) * index}deg) translateY(-180px)`,
                            }}
                        >
                            <img
                                src={bot.avatar}
                                alt={bot.name}
                                className="w-full h-full rounded-full object-cover bg-white border-2 border-gray-200 shadow-lg"
                                style={{
                                    animation: `spin-reverse 30s linear infinite`,
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;