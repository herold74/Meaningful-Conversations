import React from 'react';
import { GamificationState } from '../types';
import { ALL_ACHIEVEMENTS } from '../achievements';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { LockIcon } from './icons/LockIcon';

interface AchievementsViewProps {
    gamificationState: GamificationState;
    onBack: () => void;
}

const AchievementsView: React.FC<AchievementsViewProps> = ({ gamificationState, onBack }) => {
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-transparent border border-gray-700 my-10 animate-fadeIn">
            <div className="relative text-center">
                <button onClick={onBack} className="absolute left-0 top-1 p-2 rounded-full hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-200 uppercase">Achievements</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {ALL_ACHIEVEMENTS.map(ach => {
                    const isUnlocked = ach.isUnlocked(gamificationState);
                    return (
                        <div key={ach.id} className={`p-4 border ${isUnlocked ? 'border-yellow-400 bg-gray-900/50' : 'border-gray-700 bg-gray-950'} flex flex-col items-center text-center transition-all`}>
                            <div className={`relative w-20 h-20 flex items-center justify-center rounded-full mb-3 ${isUnlocked ? 'bg-yellow-400/10' : 'bg-gray-800'}`}>
                                <ach.icon className={`w-10 h-10 ${isUnlocked ? 'text-yellow-400' : 'text-gray-600'}`} />
                                {!isUnlocked && <LockIcon className="absolute w-5 h-5 bottom-1 right-1 text-gray-500" />}
                            </div>
                            <h3 className={`font-bold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{ach.name}</h3>
                            <p className={`mt-1 text-sm ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>{ach.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AchievementsView;
