import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-baseline justify-between gap-4 mb-4 ${className}`}>
    <div>
      <h2 className="text-xl font-semibold text-content-primary tracking-tight">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-content-secondary">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

export default SectionHeader;
