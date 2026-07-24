import React from 'react';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

interface ReviewSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  id,
  title,
  subtitle,
  badge,
  icon,
  expanded,
  onToggle,
  children,
  className = '',
}) => (
  <div
    className={`bg-background-secondary/90 backdrop-blur-sm border border-border-primary rounded-card shadow-card overflow-hidden ${className}`}
  >
    <button
      type="button"
      onClick={onToggle}
      className="w-full p-4 sm:p-5 flex justify-between items-center gap-3 text-left hover:bg-accent-primary/5 transition-colors"
      aria-expanded={expanded}
      aria-controls={id}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && <div className="flex-shrink-0 mt-0.5 text-accent-primary">{icon}</div>}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-content-primary">{title}</h2>
            {badge}
          </div>
          {subtitle && !expanded && (
            <p className="mt-1 text-sm text-content-secondary">{subtitle}</p>
          )}
        </div>
      </div>
      <ChevronDownIcon
        className={`w-5 h-5 text-content-secondary flex-shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
      />
    </button>
    {expanded && (
      <div id={id} className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-border-primary/60 animate-fadeIn">
        <div className="pt-4">{children}</div>
      </div>
    )}
  </div>
);

export default ReviewSection;
