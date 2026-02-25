import React from 'react';
import { motion } from 'framer-motion';
import type { LoaderProps } from './BrandLoader';

const sizeMap = { sm: 24, md: 36, lg: 52 };

/**
 * Steering-wheel loader that matches the brand LogoIcon exactly.
 * Uses the same viewBox="0 0 24 24" SVG paths as LogoIcon.tsx.
 */
const SteeringWheelLoader: React.FC<LoaderProps> = ({ className = '', size = 'md' }) => {
  const s = sizeMap[size];

  return (
    <div className={`inline-flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width={s}
        height={s}
        viewBox="0 0 24 24"
        animate={{ rotate: 360 }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        className="fill-accent-primary"
      >
        {[0, 45, 90, 135].map(angle => (
          <g key={angle} transform={`rotate(${angle} 12 12)`}>
            <path d="M11.325 4 L11.325 2 A 0.675 0.675 0 0 1 12.675 2 L12.675 4 L12.39375 4 L12.39375 20 L12.675 20 L12.675 22 A 0.675 0.675 0 0 1 11.325 22 L11.325 20 L11.60625 20 L11.60625 4 Z" />
          </g>
        ))}
        <path
          fillRule="evenodd"
          d="M12 20a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
        />
        <circle cx="12" cy="12" r="1.75" />
      </motion.svg>
    </div>
  );
};

export default SteeringWheelLoader;
