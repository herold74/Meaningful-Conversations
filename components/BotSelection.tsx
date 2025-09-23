import React from 'react';
import { Bot } from '../types';

// FIX: Add interface for component props
interface BotSelectionProps {
  bots: Bot[];
  onSelect: (bot: Bot) => void;
}

const BotSelection: React.FC<BotSelectionProps> = ({ bots, onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-200 uppercase">Choose Your Coach</h1>
        <p className="mt-2 text-lg text-gray-400 leading-relaxed">
          Each coach has a unique style. Select the one that resonates with you today.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {bots.map((bot) => (
          <div
            key={bot.id}
            onClick={() => onSelect(bot)}
            className="bg-transparent p-6 border border-gray-700 cursor-pointer hover:border-green-400 transition-colors duration-200 flex flex-col items-center text-center"
          >
            <img src={bot.avatar} alt={bot.name} className="w-24 h-24 rounded-full mb-4" />
            <h2 className="text-2xl font-bold text-gray-200">{bot.name}</h2>
            <p className="mt-2 text-gray-400 leading-relaxed">{bot.description}</p>
            <p className="mt-4 text-sm font-semibold text-gray-500 italic">Style: {bot.style}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BotSelection;