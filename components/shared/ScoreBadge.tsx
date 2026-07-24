import React from 'react';

interface ScoreBadgeProps {
  score: number;
  max?: number;
}

/** Theme-aware score pill — uses status background + foreground (not white on bright accent). */
const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, max = 10 }) => {
  const ratio = score / max;
  const tier =
    ratio >= 0.7 ? 'success'
    : ratio >= 0.4 ? 'warning'
    : 'danger';

  const tierClass = {
    success: 'bg-status-success-background text-status-success-foreground border-status-success-border',
    warning: 'bg-status-warning-background text-status-warning-foreground border-status-warning-border',
    danger: 'bg-status-danger-background text-status-danger-foreground border-status-danger-border',
  }[tier];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full border font-bold text-sm ${tierClass}`}>
      {score}/{max}
    </span>
  );
};

export default ScoreBadge;
