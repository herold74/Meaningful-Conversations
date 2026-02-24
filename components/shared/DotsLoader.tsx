import React from 'react';
import { motion } from 'framer-motion';
import type { LoaderProps } from './BrandLoader';

const sizeMap = { sm: 6, md: 10, lg: 14 };

const DotsLoader: React.FC<LoaderProps> = ({ className = '', size = 'md' }) => {
  const dot = sizeMap[size];
  const gap = dot * 0.8;

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
      style={{ gap }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="rounded-full bg-accent-primary block"
          style={{ width: dot, height: dot }}
          animate={{ y: [0, -dot * 0.9, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatDelay: 0.3,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default DotsLoader;
