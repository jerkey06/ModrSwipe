import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}) => {
  // Minecraft style base classes
  const baseClasses = 'font-minecraft px-6 py-3 text-lg select-none transition-all duration-200 focus:outline-none';

  const variants = {
    primary: [
      'bg-[#C6C6C6]',
      'text-[#4D4C4D]',
      'border-4 border-[#121312]',
      'relative',
      'before:content-[""] before:absolute before:inset-0 before:pointer-events-none before:z-10 before:shadow-[inset_4px_4px_0_0_#F6F6F7,inset_-4px_-4px_0_0_#656465]',
      'hover:bg-[#328C08]',
      'hover:text-[#FEFFFE]',
      'hover:border-[#FEFFFE]',
      'hover:before:shadow-[inset_-4px_-4px_0_0_#26D90B,inset_4px_4px_0_0_#055902]',
      'transition-all duration-200',
      'overflow-hidden',
    ].join(' '),
    secondary: [
      'bg-[#7E7E7E]', // gris medio
      'text-[#1A1A1A]',
      'border-4 border-[#2B2B2B]',
      'relative',
      'before:content-[""] before:absolute before:inset-0 before:pointer-events-none before:z-10 before:shadow-[inset_4px_4px_0_0_#BFBFBF,inset_-4px_-4px_0_0_#404040]',
      'hover:bg-[#9A9A9A]',
      'hover:text-white',
      'hover:border-white',
      'hover:before:shadow-[inset_-4px_-4px_0_0_#E6E6E6,inset_4px_4px_0_0_#1F1F1F]',
      'transition-all duration-200',
      'overflow-hidden',
    ].join(' '),
    danger: [
      'bg-[#8B1A1A]', // rojo oscuro
      'text-[#F2EAEA]',
      'border-4 border-[#3B0000]',
      'relative',
      'before:content-[""] before:absolute before:inset-0 before:pointer-events-none before:z-10 before:shadow-[inset_4px_4px_0_0_#D26E6E,inset_-4px_-4px_0_0_#400505]',
      'hover:bg-[#C62828]',
      'hover:text-white',
      'hover:border-white',
      'hover:before:shadow-[inset_-4px_-4px_0_0_#FCA5A5,inset_4px_4px_0_0_#5A0A0A]',
      'transition-all duration-200',
      'overflow-hidden',
    ].join(' '),
    success: [
      'bg-[#3D8B3D]', // verde medio
      'text-[#F0FFF0]',
      'border-4 border-[#1B3D1B]',
      'relative',
      'before:content-[""] before:absolute before:inset-0 before:pointer-events-none before:z-10 before:shadow-[inset_4px_4px_0_0_#A4ECA4,inset_-4px_-4px_0_0_#264D26]',
      'hover:bg-[#4CAF50]',
      'hover:text-white',
      'hover:border-white',
      'hover:before:shadow-[inset_-4px_-4px_0_0_#6EFF6E,inset_4px_4px_0_0_#135C13]',
      'transition-all duration-200',
      'overflow-hidden',
    ].join(' '),
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variant === 'primary' ? variants.primary : variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};