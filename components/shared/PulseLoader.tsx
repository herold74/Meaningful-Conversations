import React from 'react';
import { motion } from 'framer-motion';
import type { LoaderProps } from './BrandLoader';

const sizeMap = { sm: 20, md: 32, lg: 48 };

const PulseLoader: React.FC<LoaderProps> = ({ className = '', size = 'md' }) => {
  const s = sizeMap[size];

  return (
    <div className={`inline-flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <div className="relative" style={{ width: s, height: s }}>
        <motion.span
          className="absolute inset-0 rounded-full bg-accent-primary"
          animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
        />
        <span
          className="absolute rounded-full bg-accent-primary"
          style={{
            width: s * 0.5,
            height: s * 0.5,
            top: s * 0.25,
            left: s * 0.25,
          }}
        />
      </div>
    </div>
  );
};

export default PulseLoader;
