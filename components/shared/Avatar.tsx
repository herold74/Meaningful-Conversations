import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

function initials(name?: string): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  const base = `${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold overflow-hidden ${className}`;

  if (src) {
    return <img src={src} alt={name ?? 'avatar'} className={`${base} object-cover`} />;
  }

  return (
    <div className={`${base} bg-accent-primary/15 text-accent-primary`}>
      {initials(name)}
    </div>
  );
};

export default Avatar;
