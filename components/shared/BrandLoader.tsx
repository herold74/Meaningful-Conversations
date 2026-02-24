import React, { lazy, Suspense } from 'react';
import { brand, type BrandLoaderType } from '../../config/brand';

export interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const loaderMap: Record<BrandLoaderType, React.LazyExoticComponent<React.FC<LoaderProps>>> = {
  tetris: lazy(() => import('./TetrisLoader')),
  'steering-wheel': lazy(() => import('./SteeringWheelLoader')),
  dots: lazy(() => import('./DotsLoader')),
  pulse: lazy(() => import('./PulseLoader')),
};

const BrandLoader: React.FC<LoaderProps> = (props) => {
  const Loader = loaderMap[brand.loader] ?? loaderMap.tetris;
  return (
    <Suspense fallback={null}>
      <Loader {...props} />
    </Suspense>
  );
};

export default BrandLoader;
