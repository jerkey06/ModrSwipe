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
          'border-4 border-[#595B65]', // Borde exterior oscuro
          'rounded-none',
          'bg-[#010100]',
          'text-[#E1E0E1]',
          'focus:border-[#E1E0E1]', // Borde exterior se ilumina en foco
          'focus:outline-none',
          'text-base', // Tamaño de fuente original
          'shadow-none',
          'disabled:bg-[#222]',
          error && 'border-red-500 focus:border-red-500',
          className
        )}
        style={{
          // Estilos de la fuente eliminados
          // boxShadow: 'inset 0 0 0 2px #595B65', // ¡ELIMINADO! Quita el "borde interior más claro"
          caretColor: '#E1E0E1',
          textShadow: '2px 2px 0 #393938', // ¡ELIMINADO! Quita la sombra de texto del input
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