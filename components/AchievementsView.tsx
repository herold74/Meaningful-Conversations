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
        <div className="w-full max-w-3xl mx-auto p-6 sm:p-8 space-y-6 bg-background-secondary border border-border-primary mt-4 mb-10 rounded-card shadow-card-elevated">
            <div className="text-center">
                <h1 className="text-2xl font-semibold text-content-primary tracking-tight">{t('achievements_title')}</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {ALL_ACHIEVEMENTS.map(ach => {
                    const isUnlocked = ach.isUnlocked(gamificationState);
                    return (
                        <div key={ach.id} className={`p-4 border rounded-card transition-all ${isUnlocked ? 'border-w4f-amber/50 bg-w4f-amber/5 shadow-card' : 'border-border-primary bg-background-primary'} flex flex-col items-center text-center`}>
                            <div className={`relative w-16 h-16 flex items-center justify-center rounded-full mb-3 ${isUnlocked ? 'bg-w4f-amber/15' : 'bg-background-tertiary'}`}>
                                <ach.icon className={`w-8 h-8 ${isUnlocked ? 'text-w4f-amber' : 'text-content-subtle'}`} />
                                {!isUnlocked && <LockIcon className="absolute w-4 h-4 bottom-0.5 right-0.5 text-content-subtle" />}
                            </div>
                            <h3 className={`text-sm font-semibold ${isUnlocked ? 'text-content-primary' : 'text-content-subtle'}`}>{ach.name}</h3>
                            <p className={`mt-1 text-xs ${isUnlocked ? 'text-content-secondary' : 'text-content-subtle'}`}>{ach.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AchievementsView;