import React from 'react';
import { useLocalization } from '../context/LocalizationContext';

interface BlockageScoreGaugeProps {
  score: number;
}

const BlockageScoreGauge: React.FC<BlockageScoreGaugeProps> = ({ score }) => {
  const { t } = useLocalization();
  const percentage = score * 10;

  const getGradientColor = (score: number) => {
    if (score <= 2) return 'from-green-400 to-green-500'; // Low
    if (score <= 6) return 'from-yellow-400 to-yellow-500'; // Medium
    return 'from-orange-400 to-red-500'; // High
  };

  const gradientClass = getGradientColor(score);

  return (
    <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg text-center border border-gray-200 dark:border-gray-700/50">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-300">{t('blockageScore_title')}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">{t('blockageScore_subtitle')}</p>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-6 my-2 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${gradientClass} transition-all duration-500 ease-out flex items-center justify-center`}
          style={{ width: `${percentage}%` }}
        >
           <span className="text-xs font-bold text-black/60">{score} / 10</span>
        </div>
      </div>
    </div>
  );
};

export default BlockageScoreGauge;