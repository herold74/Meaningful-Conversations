import React from 'react';
import { motion } from 'framer-motion';
import type { LoaderProps } from './BrandLoader';

const sizeMap = { sm: 24, md: 36, lg: 52 };

const SteeringWheelLoader: React.FC<LoaderProps> = ({ className = '', size = 'md' }) => {
  const s = sizeMap[size];
  const cx = s / 2;
  const outerR = s / 2 - 1;
  const innerR = outerR * 0.35;
  const spokeLen = outerR - innerR;
  const spokeCount = 8;

  return (
    <div className={`inline-flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <motion.svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx={cx} cy={cx} r={outerR} fill="none" className="stroke-w4f-slate" strokeWidth={s * 0.06} />
        <circle cx={cx} cy={cx} r={innerR} fill="none" className="stroke-w4f-navy" strokeWidth={s * 0.06} />
        {Array.from({ length: spokeCount }).map((_, i) => {
          const angle = (i * 360) / spokeCount;
          const rad = (angle * Math.PI) / 180;
          const x1 = cx + Math.cos(rad) * innerR;
          const y1 = cx + Math.sin(rad) * innerR;
          const x2 = cx + Math.cos(rad) * (innerR + spokeLen);
          const y2 = cx + Math.sin(rad) * (innerR + spokeLen);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              className={i % 2 === 0 ? 'stroke-w4f-slate' : 'stroke-w4f-steel'}
              strokeWidth={s * 0.05}
              strokeLinecap="round"
            />
          );
        })}
        {Array.from({ length: spokeCount }).map((_, i) => {
          const angle = (i * 360) / spokeCount;
          const rad = (angle * Math.PI) / 180;
          const hx = cx + Math.cos(rad) * outerR;
          const hy = cx + Math.sin(rad) * outerR;
          return (
            <circle
              key={`h${i}`}
              cx={hx} cy={hy} r={s * 0.04}
              className="fill-w4f-navy"
            />
          );
        })}
      </motion.svg>
    </div>
  );
};

export default SteeringWheelLoader;
