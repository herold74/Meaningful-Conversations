import React from 'react';

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-background-tertiary text-content-secondary',
  accent: 'bg-accent-primary/15 text-accent-primary',
  success: 'bg-status-success-background text-status-success-foreground',
  warning: 'bg-status-warning-background text-status-warning-foreground',
  danger: 'bg-status-danger-background text-status-danger-foreground',
};

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-medium ${variantClasses[variant]} ${className}`}>
    {children}
  </span>
);

export default Badge;
