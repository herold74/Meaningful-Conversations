import React from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { BOTS } from '../constants';

const WelcomeScreen: React.FC = () => {
    // Pre-calculated positions for 6 bots in a hexagon shape around the central logo
    const avatarPositions = [
        { top: '-1.5rem', left: 'calc(50% - 1.5rem)' }, // Top
        { top: 'calc(25% - 1rem)', right: '-1.5rem' },  // Top-right
        { bottom: 'calc(25% - 1rem)', right: '-1.5rem' }, // Bottom-right
        { bottom: '-1.5rem', left: 'calc(50% - 1.5rem)' },// Bottom
        { bottom: 'calc(25% - 1rem)', left: '-1.5rem' }, // Bottom-left
        { top: 'calc(25% - 1rem)', left: '-1.5rem' },   // Top-left
    ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 text-center animate-fadeIn">
      {/* Container for the logo and avatars */}
      <div className="relative w-40 h-40">
        
        {/* Main Logo at the center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <LogoIcon className="w-32 h-32 text-green-500 dark:text-green-400" />
            <div className="absolute inset-0 rounded-full border-4 border-green-500/20 dark:border-green-400/20 animate-ping"></div>
        </div>
        
        {/* Bot Avatars positioned around the logo container */}
        {BOTS.slice(0, 6).map((bot, index) => {
          const animationDelay = `${200 + index * 100}ms`;
          const position = avatarPositions[index];

          return (
            <img
              key={bot.id}
              src={bot.avatar}
              alt={bot.name}
              className={`absolute w-12 h-12 rounded-full border-2 border-white dark:border-gray-800 shadow-lg opacity-0 animate-fadeIn`}
              style={{ 
                ...position,
                animationDelay 
              }}
            />
          );
        })}
      </div>

      <h1 className="mt-20 text-2xl font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">
        Meaningful Conversations
      </h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        Loading your experience...
      </p>
    </div>
  );
};

export default WelcomeScreen;
