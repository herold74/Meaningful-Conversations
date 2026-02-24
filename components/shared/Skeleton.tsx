import React from 'react';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'full' | 'card';
}

const roundedMap = {
  sm: 'rounded',
  md: 'rounded-md',
  full: 'rounded-full',
  card: 'rounded-card',
};

const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full', rounded = 'md' }) => (
  <div className={`animate-pulse bg-background-tertiary ${roundedMap[rounded]} ${className}`} />
);

export default Skeleton;
