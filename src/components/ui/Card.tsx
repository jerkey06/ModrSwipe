import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  animated = true 
}) => {
  const Component = animated ? motion.div : 'div';
  const animationProps = animated ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {};

  return (
    <Component
      className={cn(
        'bg-white rounded-xl shadow-lg border border-gray-200 p-6',
        'hover:shadow-xl transition-shadow duration-200',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
};