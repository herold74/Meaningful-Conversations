import React from 'react';
import { GamificationState } from '../types';
import { getAchievements } from '../achievements';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { LockIcon } from './icons/LockIcon';
import { useLocalization } from '../context/LocalizationContext';

interface AchievementsViewProps {
    gamificationState: GamificationState;
}

const AchievementsView: React.FC<AchievementsViewProps> = ({ gamificationState }) => {
    const { t } = useLocalization();
    const ALL_ACHIEVEMENTS = getAchievements(t);
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary my-10 animate-fadeIn rounded-lg shadow-lg">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-content-primary uppercase">{t('achievements_title')}</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {ALL_ACHIEVEMENTS.map(ach => {
                    const isUnlocked = ach.isUnlocked(gamificationState);
                    return (
                        <div key={ach.id} className={`p-4 border ${isUnlocked ? 'border-yellow-500 bg-yellow-50 dark:border-yellow-400 dark:bg-background-primary/50' : 'border-border-primary bg-background-primary dark:bg-background-primary'} flex flex-col items-center text-center transition-all rounded-lg`}>
                            <div className={`relative w-20 h-20 flex items-center justify-center rounded-full mb-3 ${isUnlocked ? 'bg-yellow-500/20 dark:bg-yellow-400/10' : 'bg-background-tertiary dark:bg-background-tertiary'}`}>
                                <ach.icon className={`w-10 h-10 ${isUnlocked ? 'text-yellow-500 dark:text-yellow-400' : 'text-content-subtle'}`} />
                                {!isUnlocked && <LockIcon className="absolute w-5 h-5 bottom-1 right-1 text-content-subtle" />}
                            </div>
                            <h3 className={`font-bold ${isUnlocked ? 'text-content-primary' : 'text-content-subtle'}`}>{ach.name}</h3>
                            <p className={`mt-1 text-sm ${isUnlocked ? 'text-content-secondary' : 'text-content-subtle'}`}>{ach.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AchievementsView;