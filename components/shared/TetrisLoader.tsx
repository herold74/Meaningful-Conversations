import React from 'react';
import { motion } from 'framer-motion';
import type { LoaderProps } from './BrandLoader';

const sizeMap = {
  sm: { block: 10, gap: 2, radius: 2 },
  md: { block: 14, gap: 3, radius: 3 },
  lg: { block: 20, gap: 4, radius: 4 },
};

const FILL_CLASSES = [
  'fill-brand-light',
  'fill-brand-mid',
  'fill-brand-base',
  'fill-brand-dark',
] as const;

const TetrisLoader: React.FC<LoaderProps> = ({ className = '', size = 'md' }) => {
  const s = sizeMap[size];
  const totalWidth = s.block * 3 + s.gap * 2;
  const totalHeight = s.block * 2 + s.gap;

  return (
    <div className={`inline-flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <svg width={totalWidth} height={totalHeight} viewBox={`0 0 ${totalWidth} ${totalHeight}`}>
        <motion.rect
          x={s.block + s.gap} y={0}
          width={s.block} height={s.block} rx={s.radius}
          className={FILL_CLASSES[0]}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
        />
        <motion.rect
          x={s.block * 2 + s.gap * 2} y={0}
          width={s.block} height={s.block} rx={s.radius}
          className={FILL_CLASSES[1]}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.15 }}
        />
        <motion.rect
          x={0} y={s.block + s.gap}
          width={s.block} height={s.block} rx={s.radius}
          className={FILL_CLASSES[2]}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
        />
        <motion.rect
          x={s.block + s.gap} y={s.block + s.gap}
          width={s.block} height={s.block} rx={s.radius}
          className={FILL_CLASSES[3]}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.45 }}
        />
      </svg>
    </div>
  );
};

export default TetrisLoader;
