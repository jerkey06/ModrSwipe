import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-3 py-2',
          'border-4 border-[#595B65]',
          'rounded-none',
          'bg-[#010100]',
          'text-[#E1E0E1]',
          'focus:border-[#E1E0E1]',
          'focus:outline-none',
          'text-base',
          'shadow-none',
          'disabled:bg-[#222]',
          error && 'border-red-500 focus:border-red-500',
          className
        )}
        style={{
          caretColor: '#E1E0E1',
          textShadow: '2px 2px 0 #393938',
          ...props.style,
        }}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};