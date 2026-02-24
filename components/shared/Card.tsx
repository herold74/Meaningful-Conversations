import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type CardVariant = 'default' | 'elevated' | 'ghost';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: CardVariant;
  hover?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-background-secondary border border-border-primary shadow-card',
  elevated: 'bg-background-secondary border border-border-primary shadow-card-elevated',
  ghost: 'bg-transparent',
};

const Card: React.FC<CardProps> = ({
  variant = 'default',
  hover = false,
  children,
  className = '',
  ...rest
}) => (
  <motion.div
    className={`rounded-card ${variantClasses[variant]} ${className}`}
    whileHover={hover ? { y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)' } : undefined}
    transition={{ duration: 0.15 }}
    {...rest}
  >
    {children}
  </motion.div>
);

export default Card;
