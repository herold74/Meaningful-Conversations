import React from 'react';

export type ProfileInsightTone = 'warning' | 'danger' | 'success';

export interface ProfileInsightItem {
  title?: string;
  body: React.ReactNode;
}

const toneClasses: Record<
  ProfileInsightTone,
  { stripe: string; bg: string; title: string }
> = {
  warning: {
    stripe: 'border-status-warning-foreground',
    bg: 'bg-status-warning-background/50',
    title: 'text-status-warning-foreground',
  },
  danger: {
    stripe: 'border-status-danger-foreground',
    bg: 'bg-status-danger-background/50',
    title: 'text-status-danger-foreground',
  },
  success: {
    stripe: 'border-status-success-foreground',
    bg: 'bg-status-success-background/50',
    title: 'text-status-success-foreground',
  },
};

interface ProfileInsightGroupProps {
  tone: ProfileInsightTone;
  items: ProfileInsightItem[];
  className?: string;
}

const ProfileInsightGroup: React.FC<ProfileInsightGroupProps> = ({ tone, items, className = '' }) => {
  if (items.length === 0) return null;

  const c = toneClasses[tone];
  const hasTitles = items.some((i) => i.title);
  const gapClass = hasTitles ? 'space-y-3' : 'space-y-1.5';

  return (
    <div
      className={`border-l-[3px] ${c.stripe} ${c.bg} rounded-r-lg px-4 py-3 ${className}`}
    >
      <div className={gapClass}>
        {items.map((item, index) => (
          <div key={index}>
            {item.title && (
              <div className={`text-sm font-semibold ${c.title} mb-0.5`}>{item.title}</div>
            )}
            <div className="text-sm text-content-secondary leading-relaxed">{item.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileInsightGroup;
