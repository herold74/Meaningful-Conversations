import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { TranscriptPreAnswers } from '../types';

interface TranscriptPreQuestionsProps {
    onNext: (preAnswers: TranscriptPreAnswers) => void;
    onBack: () => void;
    onHistory?: () => void;
}

const TranscriptPreQuestions: React.FC<TranscriptPreQuestionsProps> = ({ onNext, onBack, onHistory }) => {
    const { t } = useLocalization();
    const [situationName, setSituationName] = useState('');
    const [goal, setGoal] = useState('');
    const [personalTarget, setPersonalTarget] = useState('');
    const [assumptions, setAssumptions] = useState('');
    const [satisfaction, setSatisfaction] = useState<number>(0);
    const [difficult, setDifficult] = useState('');

    const isValid = situationName.trim().length > 0
        && goal.trim().length > 0 
        && personalTarget.trim().length > 0 
        && assumptions.trim().length > 0 
        && satisfaction > 0;

    const handleSubmit = () => {
        if (!isValid) return;
        onNext({
            situationName: situationName.trim(),
            goal: goal.trim(),
            personalTarget: personalTarget.trim(),
            assumptions: assumptions.trim(),
            satisfaction,
            ...(difficult.trim() ? { difficult: difficult.trim() } : {}),
        });
    };

    const satisfactionLabels = [
        t('te_pre_q4_1'),
        t('te_pre_q4_2'),
        t('te_pre_q4_3'),
        t('te_pre_q4_4'),
        t('te_pre_q4_5'),
    ];

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <button
                onClick={onBack}
                className="mb-4 text-sm text-content-secondary hover:text-content-primary transition-colors"
            >
                ← {t('te_input_back')}
            </button>

            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-content-primary">{t('te_pre_title')}</h2>
                {onHistory && (
                    <button
                        onClick={onHistory}
                        className="text-sm text-accent-primary hover:text-accent-primary/80 font-medium transition-colors"
                    >
                        {t('te_history_title')} →
                    </button>
                )}
            </div>
            <p className="text-content-secondary mb-8">{t('te_pre_subtitle')}</p>

            <div className="space-y-6">
                {/* Situation Name */}
                <div>
                    <div className="flex justify-between items-baseline mb-2">
                        <label className="text-sm font-semibold text-content-primary">
                            {t('te_pre_situation_label')} <span className="text-red-500">*</span>
                        </label>
                        <span className="text-sm text-red-500 font-semibold shrink-0">({t('required_field_indicator')})</span>
                    </div>
                    <input
                        type="text"
                        value={situationName}
                        onChange={(e) => setSituationName(e.target.value)}
                        placeholder={t('te_pre_situation_placeholder')}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-background-primary text-content-primary placeholder-content-secondary/50 focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                    />
                </div>

                {/* Question 1: Goal */}
                <div>
                    <label className="block text-sm font-semibold text-content-primary mb-2">
                        {t('te_pre_q1_label')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder={t('te_pre_q1_placeholder')}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-background-primary text-content-primary placeholder-content-secondary/50 resize-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                        rows={3}
                    />
                </div>

                {/* Question 2: Personal Target */}
                <div>
                    <label className="block text-sm font-semibold text-content-primary mb-2">
                        {t('te_pre_q2_label')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={personalTarget}
                        onChange={(e) => setPersonalTarget(e.target.value)}
                        placeholder={t('te_pre_q2_placeholder')}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-background-primary text-content-primary placeholder-content-secondary/50 resize-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                        rows={3}
                    />
                </div>

                {/* Question 3: Assumptions */}
                <div>
                    <label className="block text-sm font-semibold text-content-primary mb-2">
                        {t('te_pre_q3_label')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={assumptions}
                        onChange={(e) => setAssumptions(e.target.value)}
                        placeholder={t('te_pre_q3_placeholder')}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-background-primary text-content-primary placeholder-content-secondary/50 resize-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                        rows={3}
                    />
                </div>

                {/* Question 4: Satisfaction (Likert 1-5) */}
                <div>
                    <label className="block text-sm font-semibold text-content-primary mb-3">
                        {t('te_pre_q4_label')} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <button
                                key={value}
                                onClick={() => setSatisfaction(value)}
                                className={`flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all border ${
                                    satisfaction === value
                                        ? 'bg-accent-primary text-white border-accent-primary shadow-md'
                                        : 'bg-background-primary text-content-secondary border-gray-300 dark:border-gray-600 hover:border-accent-primary/50'
                                }`}
                            >
                                <div className="text-lg mb-1">{value}</div>
                                <div className="text-xs leading-tight">{satisfactionLabels[value - 1]}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Question 5: Difficult (optional) */}
                <div>
                    <label className="block text-sm font-semibold text-content-primary mb-2">
                        {t('te_pre_q5_label')}
                    </label>
                    <textarea
                        value={difficult}
                        onChange={(e) => setDifficult(e.target.value)}
                        placeholder={t('te_pre_q5_placeholder')}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-background-primary text-content-primary placeholder-content-secondary/50 resize-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                        rows={2}
                    />
                </div>
            </div>

            {/* Submit */}
            <div className="mt-8">
                <button
                    onClick={handleSubmit}
                    disabled={!isValid}
                    className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                        isValid
                            ? 'bg-accent-primary hover:bg-accent-primary/90 shadow-md hover:shadow-lg'
                            : 'bg-gray-400 cursor-not-allowed'
                    }`}
                >
                    {t('te_pre_next')} →
                </button>
            </div>
        </div>
    );
};

export default TranscriptPreQuestions;
